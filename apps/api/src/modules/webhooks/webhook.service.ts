import { PrismaClient } from '@prisma/client';
import { getWebhookProvider } from './providers';
import { AuditService } from '../audit/audit.service';
import type { 
  WebhookEvent, 
  WebhookProcessingResult, 
  WebhookReplayRequest,
  TenantContext 
} from './types';

export class WebhookService {
  constructor(
    private prisma: PrismaClient,
    private redis?: any // Redis client for caching and queuing
  ) {}

  /**
   * Process incoming webhook with signature verification and idempotency
   */
  async processWebhook(
    providerType: 'psp' | 'fraud' | 'kyb',
    rawPayload: string,
    headers: Record<string, string>,
    organizationId: string,
    merchantId?: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const provider = getWebhookProvider(providerType);
      if (!provider) {
        throw new Error(`Unknown webhook provider: ${providerType}`);
      }

      const payload = JSON.parse(rawPayload);
      const signature = headers['x-signature'] || headers['signature'] || '';
      const webhookSecret = await this.getWebhookSecret(providerType, organizationId);

      // Verify signature
      const isValidSignature = signature ? 
        provider.verifySignature(rawPayload, signature, webhookSecret) : 
        false;

      // Extract dedupe key and event type
      const dedupeKey = provider.extractDedupeKey(payload);
      const eventType = provider.getEventType(payload);

      // Check for existing event (idempotency)
      const existingEvent = await this.prisma.webhookEvent.findFirst({
        where: {
          dedupeKey,
          organizationId,
        },
      });

      if (existingEvent) {
        console.log(`Webhook event already processed: ${dedupeKey}`);
        return { 
          success: true, 
          eventId: existingEvent.id 
        };
      }

      // Create webhook event record
      const webhookEvent = await this.prisma.webhookEvent.create({
        data: {
          provider: providerType,
          eventType,
          dedupeKey,
          payload,
          headers,
          signature,
          verified: isValidSignature,
          processed: false,
          processingAttempts: 0,
          organizationId,
          merchantId: merchantId || null,
        },
      });

      // If signature is invalid, mark as failed but don't process
      if (!isValidSignature && signature) {
        await this.prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processed: true,
            failureReason: 'Invalid signature',
            updatedAt: new Date(),
          },
        });

        // Log security audit event
        await AuditService.logEvent(
          { organizationId, merchantId, permissions: [], isApiKey: true },
          {
            action: 'WEBHOOK_SECURITY_VIOLATION',
            resourceType: 'WEBHOOK',
            resourceId: webhookEvent.id,
            outcome: 'FAILURE',
            errorMessage: 'Invalid webhook signature',
            details: {
              provider: providerType,
              eventType,
              headers: this.sanitizeHeaders(headers),
            },
          }
        );

        return { 
          success: false, 
          error: 'Invalid signature',
          eventId: webhookEvent.id 
        };
      }

      // Process the webhook event
      const result = await this.processWebhookEvent(webhookEvent, payload);

      // Update event with processing result
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: result.success,
          processingAttempts: 1,
          lastProcessedAt: new Date(),
          failureReason: result.error || null,
          updatedAt: new Date(),
        },
      });

      // If processing failed and should retry, add to queue
      if (!result.success && result.shouldRetry) {
        await this.addToRetryQueue(webhookEvent.id);
      }

      return { 
        success: result.success, 
        eventId: webhookEvent.id,
        error: result.error 
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      };
    }
  }

  /**
   * Process specific webhook event based on type
   */
  private async processWebhookEvent(
    event: WebhookEvent, 
    payload: Record<string, any>
  ): Promise<WebhookProcessingResult> {
    try {
      switch (event.provider) {
        case 'psp':
          return await this.processPSPWebhook(event, payload);
        case 'fraud':
          return await this.processFraudWebhook(event, payload);
        case 'kyb':
          return await this.processKYBWebhook(event, payload);
        default:
          return { 
            success: false, 
            shouldRetry: false, 
            error: `Unknown provider: ${event.provider}` 
          };
      }
    } catch (error) {
      console.error(`Error processing ${event.provider} webhook:`, error);
      return { 
        success: false, 
        shouldRetry: true, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      };
    }
  }

  /**
   * Process PSP (Payment Service Provider) webhook
   */
  private async processPSPWebhook(
    event: WebhookEvent, 
    payload: Record<string, any>
  ): Promise<WebhookProcessingResult> {
    const { event_type, transaction_id, status, metadata } = payload;

    try {
      switch (event_type) {
        case 'payment.completed': {
          // Find and update checkout session
          const checkoutSessionId = metadata?.checkout_session_id;
          if (checkoutSessionId) {
            await this.prisma.checkoutSession.update({
              where: { id: checkoutSessionId },
              data: {
                status: 'completed',
                completedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Create transaction record
            await this.prisma.transaction.create({
              data: {
                id: transaction_id,
                checkoutSessionId,
                merchantId: event.merchantId!,
                amount: payload.amount,
                currency: payload.currency,
                status: 'completed',
                paymentMethodType: payload.payment_method?.type || 'card',
                processorTransactionId: transaction_id,
                processorResponse: payload,
                completedAt: new Date(),
                organizationId: event.organizationId,
              },
            });
          }
          break;
        }

        case 'payment.failed': {
          const checkoutSessionId = metadata?.checkout_session_id;
          if (checkoutSessionId) {
            await this.prisma.checkoutSession.update({
              where: { id: checkoutSessionId },
              data: {
                status: 'cancelled',
                updatedAt: new Date(),
              },
            });

            // Create failed transaction record
            await this.prisma.transaction.create({
              data: {
                id: transaction_id,
                checkoutSessionId,
                merchantId: event.merchantId!,
                amount: payload.amount,
                currency: payload.currency,
                status: 'failed',
                failureCode: payload.failure_code,
                failureMessage: payload.failure_message,
                processorTransactionId: transaction_id,
                processorResponse: payload,
                organizationId: event.organizationId,
              },
            });
          }
          break;
        }
      }

      return { success: true, shouldRetry: false };
    } catch (error) {
      return { 
        success: false, 
        shouldRetry: true, 
        error: error instanceof Error ? error.message : 'PSP processing failed' 
      };
    }
  }

  /**
   * Process fraud detection webhook
   */
  private async processFraudWebhook(
    event: WebhookEvent, 
    payload: Record<string, any>
  ): Promise<WebhookProcessingResult> {
    const { transaction_id, risk_score, decision } = payload;

    try {
      // Update transaction with fraud assessment
      await this.prisma.transaction.update({
        where: { id: transaction_id },
        data: {
          fraudScore: risk_score,
          updatedAt: new Date(),
        },
      });

      // If high risk, may need to void/hold transaction
      if (decision === 'decline' && risk_score > 70) {
        await this.prisma.transaction.update({
          where: { id: transaction_id },
          data: {
            status: 'cancelled',
            failureCode: 'fraud_detected',
            failureMessage: 'Transaction blocked due to fraud risk',
            updatedAt: new Date(),
          },
        });
      }

      return { success: true, shouldRetry: false };
    } catch (error) {
      return { 
        success: false, 
        shouldRetry: true, 
        error: error instanceof Error ? error.message : 'Fraud processing failed' 
      };
    }
  }

  /**
   * Process KYB (Know Your Business) webhook
   */
  private async processKYBWebhook(
    event: WebhookEvent, 
    payload: Record<string, any>
  ): Promise<WebhookProcessingResult> {
    const { merchant_id, status, verification_level } = payload;

    try {
      // Update merchant KYB status
      await this.prisma.merchant.update({
        where: { id: merchant_id },
        data: {
          kybStatus: this.mapKYBStatus(status),
          kybData: payload,
          updatedAt: new Date(),
        },
      });

      return { success: true, shouldRetry: false };
    } catch (error) {
      return { 
        success: false, 
        shouldRetry: true, 
        error: error instanceof Error ? error.message : 'KYB processing failed' 
      };
    }
  }

  /**
   * Replay webhook event
   */
  async replayWebhook(
    eventId: string, 
    replayRequest: WebhookReplayRequest,
    tenant: TenantContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const event = await this.prisma.webhookEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return { success: false, error: 'Webhook event not found' };
      }

      // Check permissions
      if (event.organizationId !== tenant.organizationId) {
        return { success: false, error: 'Access denied' };
      }

      // Reset processing status
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: false,
          processingAttempts: 0,
          failureReason: null,
          lastProcessedAt: null,
          updatedAt: new Date(),
        },
      });

      // Process again
      const result = await this.processWebhookEvent(event, event.payload);

      // Update with replay result
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: result.success,
          processingAttempts: 1,
          lastProcessedAt: new Date(),
          failureReason: result.error || null,
          updatedAt: new Date(),
        },
      });

      // Log replay action
      await AuditService.logWebhookReplay(
        tenant,
        eventId,
        replayRequest.reason,
        result.success ? 'SUCCESS' : 'FAILURE',
        result.error
      );

      return { success: result.success, error: result.error };

    } catch (error) {
      console.error('Webhook replay error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Replay failed' 
      };
    }
  }

  /**
   * Get webhook events with filtering and pagination
   */
  async getWebhookEvents(
    tenant: TenantContext,
    filters: {
      provider?: string;
      eventType?: string;
      processed?: boolean;
      verified?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const {
      provider,
      eventType,
      processed,
      verified,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {
      organizationId: tenant.organizationId,
      ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      ...(provider && { provider }),
      ...(eventType && { eventType }),
      ...(processed !== undefined && { processed }),
      ...(verified !== undefined && { verified }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { ...where.createdAt, lte: dateTo } }),
    };

    return await this.prisma.webhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // Helper methods
  private async getWebhookSecret(provider: string, organizationId: string): Promise<string> {
    // In production, this would fetch from secure configuration or database
    return process.env[`WEBHOOK_SECRET_${provider.toUpperCase()}`] || 'default-secret-key';
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const { authorization, signature, ...safeHeaders } = headers;
    return safeHeaders;
  }

  private mapKYBStatus(status: string): string {
    switch (status) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'pending': return 'pending';
      default: return 'pending';
    }
  }

  private async addToRetryQueue(eventId: string): Promise<void> {
    // TODO: Implement Redis/BullMQ queue for retry processing
    console.log(`Adding webhook ${eventId} to retry queue`);
  }
}