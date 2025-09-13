import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../webhook.service';
import { PSPWebhookExamples } from '../providers/psp.provider';
import { FraudWebhookExamples } from '../providers/fraud.provider';
import { KYBWebhookExamples } from '../providers/kyb.provider';

// Mock Prisma client
const mockPrisma = {
  webhookEvent: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  checkoutSession: {
    update: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
    update: vi.fn(),
  },
  merchant: {
    update: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock Redis client
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService(mockPrisma, mockRedis);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PSP Webhook Processing', () => {
    const validPSPSignature = 'sha256=test_signature';
    const organizationId = 'org_test';
    const merchantId = 'merchant_test';

    it('should process payment completed webhook successfully', async () => {
      const payload = PSPWebhookExamples.paymentCompleted;
      const rawPayload = JSON.stringify(payload);
      const headers = {
        'x-signature': validPSPSignature,
        'content-type': 'application/json',
      };

      // Mock no existing event (idempotency check)
      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);

      // Mock webhook event creation
      const mockWebhookEvent = {
        id: 'webhook_123',
        provider: 'psp',
        eventType: 'payment.completed',
        dedupeKey: `psp_${payload.event_id}`,
        verified: false, // Will be false due to mocked signature
        processed: false,
        processingAttempts: 0,
      };
      mockPrisma.webhookEvent.create.mockResolvedValueOnce(mockWebhookEvent);

      // Mock webhook event update
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({
        ...mockWebhookEvent,
        processed: true,
        processingAttempts: 1,
      });

      // Mock checkout session and transaction updates
      mockPrisma.checkoutSession.update.mockResolvedValueOnce({});
      mockPrisma.transaction.create.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'psp',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe(mockWebhookEvent.id);
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'psp',
          eventType: 'payment.completed',
          payload,
          headers,
          organizationId,
          merchantId,
        }),
      });
    });

    it('should handle payment failed webhook', async () => {
      const payload = PSPWebhookExamples.paymentFailed;
      const rawPayload = JSON.stringify(payload);
      const headers = { 'x-signature': validPSPSignature };

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'webhook_456',
        provider: 'psp',
        eventType: 'payment.failed',
        verified: false,
        processed: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'psp',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.checkoutSession.update).toHaveBeenCalledWith({
        where: { id: payload.metadata.checkout_session_id },
        data: expect.objectContaining({
          status: 'cancelled',
        }),
      });
    });

    it('should enforce idempotency for duplicate events', async () => {
      const payload = PSPWebhookExamples.paymentCompleted;
      const rawPayload = JSON.stringify(payload);
      const headers = { 'x-signature': validPSPSignature };

      // Mock existing event found
      const existingEvent = {
        id: 'existing_webhook_123',
        dedupeKey: `psp_${payload.event_id}`,
      };
      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(existingEvent);

      const result = await webhookService.processWebhook(
        'psp',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe(existingEvent.id);
      // Should not create new event due to idempotency
      expect(mockPrisma.webhookEvent.create).not.toHaveBeenCalled();
    });

    it('should reject webhooks with invalid signatures', async () => {
      const payload = PSPWebhookExamples.paymentCompleted;
      const rawPayload = JSON.stringify(payload);
      const headers = { 'x-signature': 'invalid_signature' };

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'webhook_invalid',
        verified: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'psp',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'webhook_invalid' },
        data: expect.objectContaining({
          processed: true,
          failureReason: 'Invalid signature',
        }),
      });
    });
  });

  describe('Fraud Webhook Processing', () => {
    const validFraudSignature = 'v1=test_signature,t=1234567890';
    const organizationId = 'org_test';
    const merchantId = 'merchant_test';

    it('should process high risk fraud webhook', async () => {
      const payload = FraudWebhookExamples.highRiskTransaction;
      const rawPayload = JSON.stringify(payload);
      const headers = { signature: validFraudSignature };

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'fraud_webhook_123',
        provider: 'fraud',
        verified: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});
      mockPrisma.transaction.update.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'fraud',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: payload.transaction_id },
        data: expect.objectContaining({
          fraudScore: payload.risk_score,
        }),
      });
    });

    it('should cancel high risk transactions', async () => {
      const payload = {
        ...FraudWebhookExamples.highRiskTransaction,
        decision: 'decline',
        risk_score: 85,
      };
      const rawPayload = JSON.stringify(payload);

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'fraud_webhook_decline',
        verified: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});
      mockPrisma.transaction.update.mockResolvedValue({});

      const result = await webhookService.processWebhook(
        'fraud',
        rawPayload,
        {},
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.transaction.update).toHaveBeenCalledTimes(2);
      // Second call should cancel the transaction
      expect(mockPrisma.transaction.update).toHaveBeenLastCalledWith({
        where: { id: payload.transaction_id },
        data: expect.objectContaining({
          status: 'cancelled',
          failureCode: 'fraud_detected',
        }),
      });
    });
  });

  describe('KYB Webhook Processing', () => {
    const organizationId = 'org_test';
    const merchantId = 'merchant_test';

    it('should process KYB verification completed webhook', async () => {
      const payload = KYBWebhookExamples.verificationCompleted;
      const rawPayload = JSON.stringify(payload);
      const headers = { signature: 'test_kyb_signature' };

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'kyb_webhook_123',
        provider: 'kyb',
        verified: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});
      mockPrisma.merchant.update.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'kyb',
        rawPayload,
        headers,
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.merchant.update).toHaveBeenCalledWith({
        where: { id: payload.merchant_id },
        data: expect.objectContaining({
          kybStatus: 'approved',
          kybData: payload,
        }),
      });
    });

    it('should handle KYB verification failures', async () => {
      const payload = KYBWebhookExamples.verificationFailed;
      const rawPayload = JSON.stringify(payload);

      mockPrisma.webhookEvent.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: 'kyb_webhook_failed',
        verified: false,
      });
      mockPrisma.webhookEvent.update.mockResolvedValueOnce({});
      mockPrisma.merchant.update.mockResolvedValueOnce({});

      const result = await webhookService.processWebhook(
        'kyb',
        rawPayload,
        {},
        organizationId,
        merchantId
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.merchant.update).toHaveBeenCalledWith({
        where: { id: payload.merchant_id },
        data: expect.objectContaining({
          kybStatus: 'rejected',
          kybData: payload,
        }),
      });
    });
  });

  describe('Webhook Replay', () => {
    const tenant = {
      organizationId: 'org_test',
      merchantId: 'merchant_test',
      userId: 'user_test',
      permissions: ['WRITE'],
      isApiKey: false,
    };

    it('should replay webhook successfully', async () => {
      const eventId = 'webhook_123';
      const mockEvent = {
        id: eventId,
        provider: 'psp',
        eventType: 'payment.completed',
        payload: PSPWebhookExamples.paymentCompleted,
        organizationId: tenant.organizationId,
        processed: false,
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(mockEvent);
      mockPrisma.webhookEvent.update.mockResolvedValue({});
      // Mock successful processing
      mockPrisma.checkoutSession.update.mockResolvedValueOnce({});
      mockPrisma.transaction.create.mockResolvedValueOnce({});

      const result = await webhookService.replayWebhook(
        eventId,
        { reason: 'Manual retry due to initial failure' },
        tenant
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: expect.objectContaining({
          processed: false,
          processingAttempts: 0,
          failureReason: null,
        }),
      });
    });

    it('should reject replay for non-existent webhook', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(null);

      const result = await webhookService.replayWebhook(
        'non_existent',
        { reason: 'Test replay' },
        tenant
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook event not found');
    });

    it('should reject replay for different organization', async () => {
      const mockEvent = {
        id: 'webhook_123',
        organizationId: 'different_org',
        payload: {},
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce(mockEvent);

      const result = await webhookService.replayWebhook(
        'webhook_123',
        { reason: 'Test replay' },
        tenant
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('Webhook Event Retrieval', () => {
    const tenant = {
      organizationId: 'org_test',
      merchantId: 'merchant_test',
      userId: 'user_test',
      permissions: [],
      isApiKey: false,
    };

    it('should retrieve webhook events with filters', async () => {
      const mockEvents = [
        {
          id: 'webhook_1',
          provider: 'psp',
          eventType: 'payment.completed',
          processed: true,
          verified: true,
          createdAt: new Date(),
        },
        {
          id: 'webhook_2',
          provider: 'fraud',
          eventType: 'fraud.high_risk',
          processed: false,
          verified: true,
          createdAt: new Date(),
        },
      ];

      mockPrisma.webhookEvent.findMany.mockResolvedValueOnce(mockEvents);

      const result = await webhookService.getWebhookEvents(tenant, {
        provider: 'psp',
        processed: true,
        limit: 10,
      });

      expect(result).toEqual(mockEvents);
      expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: tenant.organizationId,
          merchantId: tenant.merchantId,
          provider: 'psp',
          processed: true,
        }),
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON payload', async () => {
      const result = await webhookService.processWebhook(
        'psp',
        'invalid json',
        {},
        'org_test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.webhookEvent.findFirst.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await webhookService.processWebhook(
        'psp',
        JSON.stringify(PSPWebhookExamples.paymentCompleted),
        {},
        'org_test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle unknown webhook providers', async () => {
      const result = await webhookService.processWebhook(
        'unknown' as any,
        '{}',
        {},
        'org_test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown webhook provider: unknown');
    });
  });
});