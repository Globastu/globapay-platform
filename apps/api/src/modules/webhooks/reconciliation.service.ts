import { PrismaClient } from '@prisma/client';
import type { ReconciliationAlert } from './types';

export interface ReconciliationStats {
  orphanedTransactions: number;
  missingPaymentLinks: number;
  webhookDelayAlerts: number;
  totalIssues: number;
  lastRunAt: Date;
  nextRunAt: Date;
}

export class ReconciliationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run full reconciliation process
   */
  async runReconciliation(): Promise<{
    alerts: ReconciliationAlert[];
    stats: ReconciliationStats;
  }> {
    console.log('Starting reconciliation process...');
    
    const alerts: ReconciliationAlert[] = [];
    const startTime = new Date();

    // 1. Find orphaned transactions (transactions without matching payment links)
    const orphanedTransactionAlerts = await this.findOrphanedTransactions();
    alerts.push(...orphanedTransactionAlerts);

    // 2. Find missing payment links (payment links without corresponding transactions)
    const missingPaymentLinkAlerts = await this.findMissingPaymentLinks();
    alerts.push(...missingPaymentLinkAlerts);

    // 3. Find webhook delivery delays
    const webhookDelayAlerts = await this.findWebhookDelays();
    alerts.push(...webhookDelayAlerts);

    // 4. Find inconsistent statuses
    const statusInconsistencyAlerts = await this.findStatusInconsistencies();
    alerts.push(...statusInconsistencyAlerts);

    // Save alerts to database
    for (const alert of alerts) {
      await this.saveAlert(alert);
    }

    const stats: ReconciliationStats = {
      orphanedTransactions: orphanedTransactionAlerts.length,
      missingPaymentLinks: missingPaymentLinkAlerts.length,
      webhookDelayAlerts: webhookDelayAlerts.length,
      totalIssues: alerts.length,
      lastRunAt: startTime,
      nextRunAt: new Date(Date.now() + 15 * 60 * 1000), // Next run in 15 minutes
    };

    console.log(`Reconciliation completed: ${alerts.length} issues found`);
    return { alerts, stats };
  }

  /**
   * Find transactions that don't have matching payment links
   */
  private async findOrphanedTransactions(): Promise<ReconciliationAlert[]> {
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const orphanedTransactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { lt: cutoffTime },
        OR: [
          { paymentLinkId: null },
          { 
            paymentLinkId: { not: null },
            paymentLink: null // Left join will be null if payment link doesn't exist
          }
        ],
        status: { in: ['completed', 'processing'] },
      },
      include: {
        paymentLink: true,
      },
      take: 50, // Limit to prevent overwhelming alerts
    });

    return orphanedTransactions.map(transaction => ({
      id: `orphaned_transaction_${transaction.id}`,
      type: 'orphaned_transaction' as const,
      severity: 'high' as const,
      title: 'Orphaned Transaction Detected',
      description: `Transaction ${transaction.id} (${transaction.currency} ${transaction.amount / 100}) has no matching payment link`,
      resourceId: transaction.id,
      resourceType: 'transaction',
      metadata: {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        customerEmail: transaction.customerEmail,
        createdAt: transaction.createdAt.toISOString(),
      },
      createdAt: new Date(),
    }));
  }

  /**
   * Find payment links that should have transactions but don't
   */
  private async findMissingPaymentLinks(): Promise<ReconciliationAlert[]> {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const completedPaymentLinks = await this.prisma.paymentLink.findMany({
      where: {
        status: 'completed',
        completedAt: { lt: cutoffTime },
        transactionId: null, // No associated transaction
      },
      take: 50,
    });

    return completedPaymentLinks.map(paymentLink => ({
      id: `missing_transaction_${paymentLink.id}`,
      type: 'missing_payment_link' as const,
      severity: 'medium' as const,
      title: 'Missing Transaction for Completed Payment Link',
      description: `Payment link ${paymentLink.shortCode} is marked as completed but has no transaction record`,
      resourceId: paymentLink.id,
      resourceType: 'payment_link',
      metadata: {
        paymentLinkId: paymentLink.id,
        shortCode: paymentLink.shortCode,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        completedAt: paymentLink.completedAt?.toISOString(),
      },
      createdAt: new Date(),
    }));
  }

  /**
   * Find webhook delivery delays
   */
  private async findWebhookDelays(): Promise<ReconciliationAlert[]> {
    const delayThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

    const delayedWebhooks = await this.prisma.webhookEvent.findMany({
      where: {
        createdAt: { lt: delayThreshold },
        processed: false,
        processingAttempts: { gte: 3 },
      },
      take: 20,
    });

    return delayedWebhooks.map(webhook => ({
      id: `webhook_delay_${webhook.id}`,
      type: 'webhook_delivery_lag' as const,
      severity: webhook.processingAttempts > 5 ? 'high' as const : 'medium' as const,
      title: 'Webhook Delivery Delayed',
      description: `Webhook ${webhook.eventType} has failed ${webhook.processingAttempts} times and remains unprocessed`,
      resourceId: webhook.id,
      resourceType: 'webhook',
      metadata: {
        webhookId: webhook.id,
        provider: webhook.provider,
        eventType: webhook.eventType,
        processingAttempts: webhook.processingAttempts,
        failureReason: webhook.failureReason,
        createdAt: webhook.createdAt.toISOString(),
        lastProcessedAt: webhook.lastProcessedAt?.toISOString(),
      },
      createdAt: new Date(),
    }));
  }

  /**
   * Find status inconsistencies between related records
   */
  private async findStatusInconsistencies(): Promise<ReconciliationAlert[]> {
    const alerts: ReconciliationAlert[] = [];

    // Find checkout sessions marked as completed but no transaction exists
    const completedSessionsWithoutTransactions = await this.prisma.checkoutSession.findMany({
      where: {
        status: 'completed',
        completedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
      },
      include: {
        transactions: true,
      },
      take: 20,
    });

    for (const session of completedSessionsWithoutTransactions) {
      if (session.transactions.length === 0) {
        alerts.push({
          id: `inconsistent_checkout_${session.id}`,
          type: 'orphaned_transaction' as const,
          severity: 'high' as const,
          title: 'Completed Checkout Session Without Transaction',
          description: `Checkout session ${session.id} is marked as completed but has no transaction records`,
          resourceId: session.id,
          resourceType: 'checkout_session',
          metadata: {
            checkoutSessionId: session.id,
            amount: session.amount,
            currency: session.currency,
            status: session.status,
            completedAt: session.completedAt?.toISOString(),
          },
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Save alert to database
   */
  private async saveAlert(alert: ReconciliationAlert): Promise<void> {
    try {
      // Check if alert already exists to avoid duplicates
      const existing = await this.prisma.reconciliationAlert.findUnique({
        where: { id: alert.id },
      });

      if (!existing) {
        await this.prisma.reconciliationAlert.create({
          data: {
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            resourceId: alert.resourceId,
            resourceType: alert.resourceType,
            metadata: alert.metadata,
            resolved: false,
          },
        });
      }
    } catch (error) {
      console.error('Failed to save reconciliation alert:', error);
    }
  }

  /**
   * Get active reconciliation alerts
   */
  async getActiveAlerts(organizationId?: string, limit: number = 50): Promise<ReconciliationAlert[]> {
    const alerts = await this.prisma.reconciliationAlert.findMany({
      where: {
        resolved: false,
        ...(organizationId && { organizationId }),
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as ReconciliationAlert['type'],
      severity: alert.severity as ReconciliationAlert['severity'],
      title: alert.title,
      description: alert.description,
      resourceId: alert.resourceId,
      resourceType: alert.resourceType,
      metadata: alert.metadata as Record<string, any>,
      createdAt: alert.createdAt,
      resolvedAt: alert.resolvedAt,
    }));
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, reason?: string): Promise<boolean> {
    try {
      await this.prisma.reconciliationAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          ...(reason && { 
            metadata: {
              resolvedReason: reason 
            } 
          }),
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(organizationId?: string): Promise<ReconciliationStats> {
    const [
      orphanedCount,
      missingCount,
      webhookDelayCount,
      lastRun
    ] = await Promise.all([
      this.prisma.reconciliationAlert.count({
        where: {
          type: 'orphaned_transaction',
          resolved: false,
          ...(organizationId && { organizationId }),
        },
      }),
      this.prisma.reconciliationAlert.count({
        where: {
          type: 'missing_payment_link',
          resolved: false,
          ...(organizationId && { organizationId }),
        },
      }),
      this.prisma.reconciliationAlert.count({
        where: {
          type: 'webhook_delivery_lag',
          resolved: false,
          ...(organizationId && { organizationId }),
        },
      }),
      this.prisma.reconciliationAlert.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      orphanedTransactions: orphanedCount,
      missingPaymentLinks: missingCount,
      webhookDelayAlerts: webhookDelayCount,
      totalIssues: orphanedCount + missingCount + webhookDelayCount,
      lastRunAt: lastRun?.createdAt || new Date(),
      nextRunAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  /**
   * Auto-resolve stale alerts
   */
  async cleanupStaleAlerts(): Promise<number> {
    const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const result = await this.prisma.reconciliationAlert.updateMany({
      where: {
        resolved: false,
        createdAt: { lt: staleThreshold },
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        metadata: {
          autoResolved: true,
          reason: 'Automatically resolved due to age',
        },
      },
    });

    console.log(`Auto-resolved ${result.count} stale reconciliation alerts`);
    return result.count;
  }
}