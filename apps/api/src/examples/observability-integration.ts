/**
 * Example integration of observability features
 * This file demonstrates how to use the new observability components
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditService } from '../modules/audit/audit.service';
import { recordAuthAttempt, recordCaptureAttempt, recordWebhookLag } from '../observability/metrics';
import { traceAsync, addSpanAttributes } from '../observability/tracing';
import { createContextLogger, getRequestContext } from '../middleware/logging.middleware';
import type { TenantContext } from '../modules/auth/types';

/**
 * Example: Enhanced authentication handler with full observability
 */
export async function authenticateUserHandler(
  request: FastifyRequest<{
    Body: { email: string; password: string };
  }>,
  reply: FastifyReply
) {
  const logger = createContextLogger(request);
  const context = getRequestContext(request);

  return await traceAsync('user_authentication', async () => {
    try {
      const { email, password } = request.body;
      
      // Add tracing attributes
      addSpanAttributes({
        'user.email': email,
        'auth.method': 'password',
        'request.id': context.requestId,
      });

      logger.info('Authentication attempt started', {
        email,
        method: 'password',
      });

      // Simulate authentication logic
      const authResult = await authenticateUser(email, password);
      
      if (authResult.success) {
        // Record successful authentication metrics
        recordAuthAttempt('success', 'password', authResult.user.organizationId);
        
        // Log successful authentication audit event
        await AuditService.logUserLogin(
          authResult.user.id,
          authResult.user.organizationId,
          'SUCCESS',
          context.ip,
          context.userAgent,
          context.requestId
        );

        logger.info('Authentication successful', {
          userId: authResult.user.id,
          organizationId: authResult.user.organizationId,
        });

        return reply.code(200).send({
          success: true,
          user: authResult.user,
          token: authResult.token,
        });
      } else {
        // Record failed authentication metrics
        recordAuthAttempt('failure', 'password');
        
        // Log failed authentication audit event
        await AuditService.logFailedLoginAttempt(
          email,
          'invalid_credentials',
          context.ip,
          context.userAgent,
          context.requestId
        );

        logger.warn('Authentication failed', {
          email,
          reason: 'invalid_credentials',
        });

        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }
    } catch (error) {
      logger.error('Authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  });
}

/**
 * Example: Payment capture handler with metrics and audit logging
 */
export async function capturePaymentHandler(
  request: FastifyRequest<{
    Params: { transactionId: string };
    Body: { amount: number; currency: string };
  }>,
  reply: FastifyReply
) {
  const logger = createContextLogger(request);
  const tenant = request.user as TenantContext; // From auth middleware
  
  return await traceAsync('payment_capture', async () => {
    try {
      const { transactionId } = request.params;
      const { amount, currency } = request.body;
      
      addSpanAttributes({
        'transaction.id': transactionId,
        'payment.amount': amount,
        'payment.currency': currency,
        'merchant.id': tenant.merchantId || 'unknown',
      });

      logger.info('Payment capture started', {
        transactionId,
        amount,
        currency,
      });

      // Simulate payment capture
      const captureResult = await capturePayment(transactionId, amount);
      
      if (captureResult.success) {
        // Record successful capture metrics
        recordCaptureAttempt('success', amount, currency, tenant.merchantId);
        
        // Log audit event for successful capture
        await AuditService.logWithContext(
          tenant,
          {
            action: 'TRANSACTION_CAPTURE',
            resourceType: 'TRANSACTION',
            resourceId: transactionId,
            details: {
              changes: {
                amount,
                currency,
                status: 'captured',
              },
            },
            outcome: 'SUCCESS',
          },
          request
        );

        logger.info('Payment capture successful', {
          transactionId,
          captureId: captureResult.captureId,
        });

        return reply.send(captureResult);
      } else {
        // Record failed capture metrics
        recordCaptureAttempt('failure', amount, currency, tenant.merchantId);
        
        // Log audit event for failed capture
        await AuditService.logWithContext(
          tenant,
          {
            action: 'TRANSACTION_CAPTURE',
            resourceType: 'TRANSACTION',
            resourceId: transactionId,
            details: {
              changes: { amount, currency },
              reason: captureResult.error,
            },
            outcome: 'FAILURE',
            errorMessage: captureResult.error,
          },
          request
        );

        logger.error('Payment capture failed', {
          transactionId,
          error: captureResult.error,
        });

        return reply.code(400).send({
          error: 'Capture failed',
          message: captureResult.error,
        });
      }
    } catch (error) {
      logger.error('Payment capture error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  });
}

/**
 * Example: Webhook processing handler with lag metrics
 */
export async function processWebhookHandler(
  request: FastifyRequest<{
    Body: { type: string; data: any; timestamp: string };
  }>,
  reply: FastifyReply
) {
  const logger = createContextLogger(request);
  
  return await traceAsync('webhook_processing', async () => {
    try {
      const { type, data, timestamp } = request.body;
      const webhookTimestamp = new Date(timestamp);
      const now = new Date();
      const lagSeconds = (now.getTime() - webhookTimestamp.getTime()) / 1000;

      addSpanAttributes({
        'webhook.type': type,
        'webhook.lag_seconds': lagSeconds,
      });

      logger.info('Webhook processing started', {
        type,
        lagSeconds,
      });

      // Process webhook
      const result = await processWebhook(type, data);
      
      if (result.success) {
        // Record webhook processing metrics
        recordWebhookLag(lagSeconds, type, 'success');
        
        logger.info('Webhook processed successfully', {
          type,
          processingTime: result.processingTime,
        });
      } else {
        // Record failed webhook metrics
        recordWebhookLag(lagSeconds, type, 'failed');
        
        logger.error('Webhook processing failed', {
          type,
          error: result.error,
        });
      }

      return reply.send(result);
    } catch (error) {
      logger.error('Webhook processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  });
}

/**
 * Example: Refund handler with comprehensive audit logging
 */
export async function processRefundHandler(
  request: FastifyRequest<{
    Params: { transactionId: string };
    Body: { amount?: number; reason: string };
  }>,
  reply: FastifyReply
) {
  const logger = createContextLogger(request);
  const tenant = request.user as TenantContext;
  
  return await traceAsync('transaction_refund', async () => {
    try {
      const { transactionId } = request.params;
      const { amount, reason } = request.body;
      
      logger.info('Refund processing started', {
        transactionId,
        amount,
        reason,
      });

      // Get original transaction
      const transaction = await getTransaction(transactionId);
      if (!transaction) {
        return reply.code(404).send({ error: 'Transaction not found' });
      }

      const refundAmount = amount || transaction.amount;
      
      // Process refund
      const refundResult = await processRefund(transactionId, refundAmount, reason);
      
      if (refundResult.success) {
        // Log comprehensive audit event for refund (compliance requirement)
        await AuditService.logTransactionRefund(
          tenant,
          transactionId,
          refundResult.refundId,
          refundAmount,
          transaction.currency,
          reason,
          'SUCCESS',
          undefined, // no error message
          request.ip,
          request.headers['user-agent'],
          request.requestId
        );

        logger.info('Refund processed successfully', {
          transactionId,
          refundId: refundResult.refundId,
          amount: refundAmount,
        });

        return reply.send(refundResult);
      } else {
        // Log failed refund audit event
        await AuditService.logTransactionRefund(
          tenant,
          transactionId,
          '', // no refund ID for failed refunds
          refundAmount,
          transaction.currency,
          reason,
          'FAILURE',
          refundResult.error,
          request.ip,
          request.headers['user-agent'],
          request.requestId
        );

        logger.error('Refund processing failed', {
          transactionId,
          error: refundResult.error,
        });

        return reply.code(400).send({
          error: 'Refund failed',
          message: refundResult.error,
        });
      }
    } catch (error) {
      logger.error('Refund processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  });
}

// Mock functions (replace with real implementations)
async function authenticateUser(email: string, password: string) {
  // Implementation would validate credentials
  return { success: true, user: { id: 'user-1', organizationId: 'org-1' }, token: 'jwt-token' };
}

async function capturePayment(transactionId: string, amount: number) {
  // Implementation would capture payment via PSP
  return { success: true, captureId: 'cap-123' };
}

async function processWebhook(type: string, data: any) {
  // Implementation would process webhook data
  return { success: true, processingTime: 150 };
}

async function getTransaction(transactionId: string) {
  // Implementation would fetch transaction from database
  return { id: transactionId, amount: 10000, currency: 'USD' };
}

async function processRefund(transactionId: string, amount: number, reason: string) {
  // Implementation would process refund via PSP
  return { success: true, refundId: 'ref-123' };
}