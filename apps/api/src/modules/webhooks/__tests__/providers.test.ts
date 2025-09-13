import { describe, it, expect } from 'vitest';
import { PSPWebhookProvider, PSPWebhookExamples } from '../providers/psp.provider';
import { FraudWebhookProvider, FraudWebhookExamples } from '../providers/fraud.provider';
import { KYBWebhookProvider, KYBWebhookExamples } from '../providers/kyb.provider';
import { createHmac } from 'crypto';

describe('Webhook Providers', () => {
  describe('PSPWebhookProvider', () => {
    const provider = new PSPWebhookProvider();
    const secret = 'test_secret_key';

    describe('signature verification', () => {
      it('should verify valid HMAC-SHA256 signatures', () => {
        const payload = 'test payload';
        const expectedSignature = createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
        const signature = `sha256=${expectedSignature}`;

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(true);
      });

      it('should reject invalid signatures', () => {
        const payload = 'test payload';
        const signature = 'sha256=invalid_signature';

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });

      it('should reject signatures without proper prefix', () => {
        const payload = 'test payload';
        const signature = 'invalid_format';

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });

      it('should handle signature verification errors gracefully', () => {
        const payload = 'test payload';
        const signature = 'sha256='; // Empty signature after prefix

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });
    });

    describe('dedupe key extraction', () => {
      it('should extract dedupe key from event_id', () => {
        const payload = { event_id: 'evt_12345' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('psp_evt_12345');
      });

      it('should extract dedupe key from id field', () => {
        const payload = { id: 'id_67890' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('psp_id_67890');
      });

      it('should extract dedupe key from transaction_id', () => {
        const payload = { transaction_id: 'txn_abc123' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('psp_transaction_txn_abc123');
      });

      it('should generate hash-based dedupe key for payloads without standard IDs', () => {
        const payload = { custom_field: 'value', amount: 1000 };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toMatch(/^psp_[a-f0-9]{16}$/);
      });
    });

    describe('event type extraction', () => {
      it('should extract event type from event_type field', () => {
        const eventType = provider.getEventType(PSPWebhookExamples.paymentCompleted);
        expect(eventType).toBe('payment.completed');
      });

      it('should extract event type from type field', () => {
        const payload = { type: 'payment.failed' };
        const eventType = provider.getEventType(payload);
        expect(eventType).toBe('payment.failed');
      });

      it('should return "unknown" for payloads without event type', () => {
        const payload = { custom_field: 'value' };
        const eventType = provider.getEventType(payload);
        expect(eventType).toBe('unknown');
      });
    });
  });

  describe('FraudWebhookProvider', () => {
    const provider = new FraudWebhookProvider();
    const secret = 'fraud_secret_key';

    describe('signature verification', () => {
      it('should verify signatures with timestamp', () => {
        const payload = 'fraud webhook payload';
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadWithTimestamp = `${timestamp}.${payload}`;
        
        const expectedSignature = createHmac('sha256', secret)
          .update(payloadWithTimestamp, 'utf8')
          .digest('hex');
        const signature = `v1=${expectedSignature},t=${timestamp}`;

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(true);
      });

      it('should reject signatures with old timestamps', () => {
        const payload = 'fraud webhook payload';
        const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 6+ minutes old
        const payloadWithTimestamp = `${oldTimestamp}.${payload}`;
        
        const expectedSignature = createHmac('sha256', secret)
          .update(payloadWithTimestamp, 'utf8')
          .digest('hex');
        const signature = `v1=${expectedSignature},t=${oldTimestamp}`;

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });

      it('should handle signatures without version prefix', () => {
        const payload = 'test payload';
        const signature = 'invalid_format';

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });

      it('should verify signatures without timestamp', () => {
        const payload = 'fraud webhook payload';
        const expectedSignature = createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
        const signature = `v1=${expectedSignature}`;

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(true);
      });
    });

    describe('dedupe key extraction', () => {
      it('should extract dedupe key from decision_id', () => {
        const payload = FraudWebhookExamples.highRiskTransaction;
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe(`fraud_${payload.decision_id}`);
      });

      it('should extract dedupe key from assessment_id', () => {
        const payload = { assessment_id: 'assess_123' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('fraud_assess_123');
      });

      it('should fall back to transaction_id', () => {
        const payload = { transaction_id: 'txn_fraud_test' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('fraud_transaction_txn_fraud_test');
      });
    });
  });

  describe('KYBWebhookProvider', () => {
    const provider = new KYBWebhookProvider();
    const secret = 'kyb_secret_key';

    describe('signature verification', () => {
      it('should verify basic HMAC signatures', () => {
        const payload = 'kyb webhook payload';
        const expectedSignature = createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');

        const isValid = provider.verifySignature(payload, expectedSignature, secret);
        expect(isValid).toBe(true);
      });

      it('should reject invalid signatures', () => {
        const payload = 'kyb webhook payload';
        const signature = 'invalid_signature';

        const isValid = provider.verifySignature(payload, signature, secret);
        expect(isValid).toBe(false);
      });
    });

    describe('dedupe key extraction', () => {
      it('should extract dedupe key from verification_id', () => {
        const payload = KYBWebhookExamples.verificationCompleted;
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe(`kyb_${payload.verification_id}`);
      });

      it('should extract dedupe key from application_id', () => {
        const payload = { application_id: 'app_kyb_123' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('kyb_app_kyb_123');
      });

      it('should fall back to merchant_id', () => {
        const payload = { merchant_id: 'merchant_kyb_test' };
        const dedupeKey = provider.extractDedupeKey(payload);
        expect(dedupeKey).toBe('kyb_merchant_merchant_kyb_test');
      });
    });

    describe('event type extraction', () => {
      it('should extract event type from event_type field', () => {
        const eventType = provider.getEventType(KYBWebhookExamples.verificationCompleted);
        expect(eventType).toBe('kyb.verification_completed');
      });

      it('should extract event type from verification_status field', () => {
        const payload = { verification_status: 'approved' };
        const eventType = provider.getEventType(payload);
        expect(eventType).toBe('approved');
      });

      it('should default to "kyb_update"', () => {
        const payload = { merchant_id: 'test' };
        const eventType = provider.getEventType(payload);
        expect(eventType).toBe('kyb_update');
      });
    });
  });

  describe('Webhook Examples Validation', () => {
    it('should have valid PSP webhook examples', () => {
      const examples = PSPWebhookExamples;
      
      expect(examples.paymentCompleted).toBeDefined();
      expect(examples.paymentCompleted.event_id).toBeDefined();
      expect(examples.paymentCompleted.event_type).toBe('payment.completed');
      expect(examples.paymentCompleted.transaction_id).toBeDefined();
      
      expect(examples.paymentFailed).toBeDefined();
      expect(examples.paymentFailed.event_type).toBe('payment.failed');
      expect(examples.paymentFailed.failure_code).toBeDefined();
    });

    it('should have valid fraud webhook examples', () => {
      const examples = FraudWebhookExamples;
      
      expect(examples.highRiskTransaction).toBeDefined();
      expect(examples.highRiskTransaction.decision_id).toBeDefined();
      expect(examples.highRiskTransaction.risk_score).toBeGreaterThan(70);
      expect(examples.highRiskTransaction.decision).toBe('decline');
      
      expect(examples.lowRiskTransaction).toBeDefined();
      expect(examples.lowRiskTransaction.risk_score).toBeLessThan(30);
      expect(examples.lowRiskTransaction.decision).toBe('approve');
    });

    it('should have valid KYB webhook examples', () => {
      const examples = KYBWebhookExamples;
      
      expect(examples.verificationCompleted).toBeDefined();
      expect(examples.verificationCompleted.verification_id).toBeDefined();
      expect(examples.verificationCompleted.status).toBe('approved');
      expect(examples.verificationCompleted.documents_verified).toBeInstanceOf(Array);
      
      expect(examples.verificationFailed).toBeDefined();
      expect(examples.verificationFailed.status).toBe('rejected');
      expect(examples.verificationFailed.rejection_reasons).toBeInstanceOf(Array);
    });
  });
});