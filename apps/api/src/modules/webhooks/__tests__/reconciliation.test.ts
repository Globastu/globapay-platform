import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ReconciliationService } from '../reconciliation.service';

// Mock Prisma client
const mockPrisma = {
  transaction: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  paymentLink: {
    findMany: vi.fn(),
  },
  webhookEvent: {
    findMany: vi.fn(),
  },
  checkoutSession: {
    findMany: vi.fn(),
  },
  reconciliationAlert: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
} as unknown as PrismaClient;

describe('ReconciliationService', () => {
  let reconciliationService: ReconciliationService;

  beforeEach(() => {
    reconciliationService = new ReconciliationService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runReconciliation', () => {
    it('should identify orphaned transactions', async () => {
      const mockOrphanedTransactions = [
        {
          id: 'txn_orphaned_123',
          amount: 2500,
          currency: 'USD',
          status: 'completed',
          customerEmail: 'test@example.com',
          paymentLinkId: null,
          paymentLink: null,
          createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce(mockOrphanedTransactions);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null); // No existing alerts
      mockPrisma.reconciliationAlert.create.mockResolvedValue({});

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('orphaned_transaction');
      expect(result.alerts[0].severity).toBe('high');
      expect(result.alerts[0].resourceId).toBe('txn_orphaned_123');
      expect(result.stats.orphanedTransactions).toBe(1);
    });

    it('should identify missing payment links for completed transactions', async () => {
      const mockCompletedPaymentLinks = [
        {
          id: 'pl_missing_transaction',
          shortCode: 'MISSING01',
          amount: 1500,
          currency: 'USD',
          status: 'completed',
          completedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
          transactionId: null,
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce(mockCompletedPaymentLinks);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null);
      mockPrisma.reconciliationAlert.create.mockResolvedValue({});

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('missing_payment_link');
      expect(result.alerts[0].severity).toBe('medium');
      expect(result.alerts[0].resourceId).toBe('pl_missing_transaction');
      expect(result.stats.missingPaymentLinks).toBe(1);
    });

    it('should identify webhook delivery delays', async () => {
      const mockDelayedWebhooks = [
        {
          id: 'webhook_delayed_123',
          provider: 'psp',
          eventType: 'payment.completed',
          processed: false,
          processingAttempts: 5,
          failureReason: 'Connection timeout',
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          lastProcessedAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce(mockDelayedWebhooks);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null);
      mockPrisma.reconciliationAlert.create.mockResolvedValue({});

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('webhook_delivery_lag');
      expect(result.alerts[0].severity).toBe('high'); // >5 attempts = high severity
      expect(result.alerts[0].resourceId).toBe('webhook_delayed_123');
      expect(result.stats.webhookDelayAlerts).toBe(1);
    });

    it('should identify checkout sessions without transactions', async () => {
      const mockCompletedSessions = [
        {
          id: 'cs_no_transaction',
          status: 'completed',
          amount: 3000,
          currency: 'USD',
          completedAt: new Date(Date.now() - 45 * 60 * 1000),
          transactions: [], // No transactions
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce(mockCompletedSessions);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null);
      mockPrisma.reconciliationAlert.create.mockResolvedValue({});

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe('orphaned_transaction');
      expect(result.alerts[0].resourceType).toBe('checkout_session');
      expect(result.alerts[0].resourceId).toBe('cs_no_transaction');
    });

    it('should not create duplicate alerts for existing issues', async () => {
      const mockOrphanedTransactions = [
        {
          id: 'txn_existing_alert',
          amount: 2500,
          currency: 'USD',
          status: 'completed',
          paymentLinkId: null,
          paymentLink: null,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce(mockOrphanedTransactions);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      
      // Mock existing alert found
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValueOnce({
        id: 'orphaned_transaction_txn_existing_alert',
        type: 'orphaned_transaction',
      });

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      // Should not create new alert due to existing one
      expect(mockPrisma.reconciliationAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('getActiveAlerts', () => {
    it('should retrieve active alerts for organization', async () => {
      const mockAlerts = [
        {
          id: 'alert_1',
          type: 'orphaned_transaction',
          severity: 'high',
          title: 'Orphaned Transaction',
          description: 'Transaction without payment link',
          resourceId: 'txn_123',
          resourceType: 'transaction',
          metadata: { amount: 2500 },
          resolved: false,
          createdAt: new Date(),
          resolvedAt: null,
        },
      ];

      mockPrisma.reconciliationAlert.findMany.mockResolvedValueOnce(mockAlerts);

      const result = await reconciliationService.getActiveAlerts('org_123', 10);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('orphaned_transaction');
      expect(result[0].severity).toBe('high');
      expect(mockPrisma.reconciliationAlert.findMany).toHaveBeenCalledWith({
        where: {
          resolved: false,
          organizationId: 'org_123',
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      });
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      mockPrisma.reconciliationAlert.update.mockResolvedValueOnce({
        id: 'alert_123',
        resolved: true,
        resolvedAt: new Date(),
      });

      const result = await reconciliationService.resolveAlert(
        'alert_123',
        'Issue manually resolved'
      );

      expect(result).toBe(true);
      expect(mockPrisma.reconciliationAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert_123' },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
          metadata: { resolvedReason: 'Issue manually resolved' },
        },
      });
    });

    it('should handle resolution errors gracefully', async () => {
      mockPrisma.reconciliationAlert.update.mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await reconciliationService.resolveAlert('alert_123');

      expect(result).toBe(false);
    });
  });

  describe('getReconciliationStats', () => {
    it('should return accurate reconciliation statistics', async () => {
      mockPrisma.reconciliationAlert.count
        .mockResolvedValueOnce(3) // orphaned transactions
        .mockResolvedValueOnce(1) // missing payment links  
        .mockResolvedValueOnce(2); // webhook delays

      mockPrisma.reconciliationAlert.findFirst.mockResolvedValueOnce({
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      });

      const result = await reconciliationService.getReconciliationStats('org_123');

      expect(result).toEqual({
        orphanedTransactions: 3,
        missingPaymentLinks: 1,
        webhookDelayAlerts: 2,
        totalIssues: 6,
        lastRunAt: expect.any(Date),
        nextRunAt: expect.any(Date),
      });
    });
  });

  describe('cleanupStaleAlerts', () => {
    it('should auto-resolve old alerts', async () => {
      mockPrisma.reconciliationAlert.updateMany.mockResolvedValueOnce({
        count: 5,
      });

      const result = await reconciliationService.cleanupStaleAlerts();

      expect(result).toBe(5);
      expect(mockPrisma.reconciliationAlert.updateMany).toHaveBeenCalledWith({
        where: {
          resolved: false,
          createdAt: { lt: expect.any(Date) },
        },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
          metadata: {
            autoResolved: true,
            reason: 'Automatically resolved due to age',
          },
        },
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty results gracefully', async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);

      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(0);
      expect(result.stats.totalIssues).toBe(0);
    });

    it('should handle database errors during alert creation', async () => {
      const mockOrphanedTransactions = [
        {
          id: 'txn_error_test',
          amount: 1000,
          currency: 'USD',
          status: 'completed',
          paymentLinkId: null,
          paymentLink: null,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValueOnce(mockOrphanedTransactions);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null);
      mockPrisma.reconciliationAlert.create.mockRejectedValueOnce(
        new Error('Database constraint violation')
      );

      // Should not throw error, should continue processing
      const result = await reconciliationService.runReconciliation();

      expect(result.alerts).toHaveLength(1);
      expect(result.stats.totalIssues).toBe(1);
    });

    it('should respect alert limits to prevent overwhelming the system', async () => {
      // Create 100 orphaned transactions
      const manyOrphanedTransactions = Array.from({ length: 100 }, (_, i) => ({
        id: `txn_bulk_${i}`,
        amount: 1000,
        currency: 'USD',
        status: 'completed',
        paymentLinkId: null,
        paymentLink: null,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      }));

      mockPrisma.transaction.findMany.mockResolvedValueOnce(manyOrphanedTransactions);
      mockPrisma.paymentLink.findMany.mockResolvedValueOnce([]);
      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce([]);
      mockPrisma.checkoutSession.findMany.mockResolvedValueOnce([]);
      mockPrisma.reconciliationAlert.findUnique.mockResolvedValue(null);
      mockPrisma.reconciliationAlert.create.mockResolvedValue({});

      const result = await reconciliationService.runReconciliation();

      // Should be limited to 50 (or the take limit in the query)
      expect(result.alerts.length).toBeLessThanOrEqual(50);
    });
  });
});