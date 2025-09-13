import { describe, it, expect } from 'vitest';

// Define types locally for testing
interface RefundRequest {
  amount: number;
  reason?: string;
  metadata?: Record<string, string>;
}

interface TransactionWithDetails {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  refundedAmount?: number | null;
  createdAt: Date;
}

interface RefundValidationResult {
  valid: boolean;
  error?: string;
}

// Pure function to validate refunds - extracted from service logic
function validateRefund(transaction: TransactionWithDetails, refundRequest: RefundRequest): RefundValidationResult {
  // Check transaction status
  if (transaction.status !== 'completed') {
    return { valid: false, error: 'Only completed transactions can be refunded' };
  }

  // Check refund amount
  if (refundRequest.amount <= 0) {
    return { valid: false, error: 'Refund amount must be greater than 0' };
  }

  // Check time limit (180 days)
  const daysDiff = Math.floor((Date.now() - transaction.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 180) {
    return { valid: false, error: 'Refunds can only be processed within 180 days of transaction' };
  }

  // Check available refund amount
  const alreadyRefunded = transaction.refundedAmount || 0;
  const availableForRefund = transaction.amount - alreadyRefunded;
  
  if (refundRequest.amount > availableForRefund) {
    return { valid: false, error: 'Refund amount cannot exceed remaining refundable amount' };
  }

  // Check reason length if provided
  if (refundRequest.reason && refundRequest.reason.length > 500) {
    return { valid: false, error: 'Refund reason cannot exceed 500 characters' };
  }

  return { valid: true };
}

describe('Transaction Refund Validation', () => {

  describe('validateRefund', () => {
    const baseTransaction: TransactionWithDetails = {
      id: 'tx-123',
      merchantId: 'merchant-456',
      paymentLinkId: null,
      checkoutSessionId: null,
      amount: 10000, // $100.00
      currency: 'USD',
      description: 'Test transaction',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      status: 'completed',
      paymentMethodId: 'pm-123',
      paymentMethodType: 'card',
      reference: 'REF-123',
      fraudScore: 25,
      require3DS: false,
      threeDSStatus: null,
      processorTransactionId: 'proc-123',
      processorResponse: {},
      failureCode: null,
      failureMessage: null,
      refundedAmount: 0,
      fees: [],
      refunds: [],
      paymentLink: null,
      checkoutSession: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      metadata: {},
    };

    it('should allow refund for completed transaction within time limit', () => {
      const transaction = {
        ...baseTransaction,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      };

      const refundRequest: RefundRequest = {
        amount: 5000, // $50.00
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(true);
    });

    it('should reject refund for non-completed transaction', () => {
      const transaction = {
        ...baseTransaction,
        status: 'pending' as const,
      };

      const refundRequest: RefundRequest = {
        amount: 5000,
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only completed transactions can be refunded');
    });

    it('should reject refund for transaction older than 180 days', () => {
      const transaction = {
        ...baseTransaction,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 181 * 24 * 60 * 60 * 1000), // 181 days ago
      };

      const refundRequest: RefundRequest = {
        amount: 5000,
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Refunds can only be processed within 180 days of transaction');
    });

    it('should reject refund amount exceeding transaction amount', () => {
      const transaction = {
        ...baseTransaction,
        amount: 10000, // $100.00
        refundedAmount: 0,
      };

      const refundRequest: RefundRequest = {
        amount: 15000, // $150.00 - more than transaction amount
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Refund amount cannot exceed remaining refundable amount');
    });

    it('should reject refund amount exceeding remaining refundable amount', () => {
      const transaction = {
        ...baseTransaction,
        amount: 10000, // $100.00
        refundedAmount: 7000, // $70.00 already refunded
      };

      const refundRequest: RefundRequest = {
        amount: 5000, // $50.00 - would exceed remaining $30.00
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Refund amount cannot exceed remaining refundable amount');
    });

    it('should reject refund with zero or negative amount', () => {
      const transaction = {
        ...baseTransaction,
      };

      const refundRequest: RefundRequest = {
        amount: 0,
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Refund amount must be greater than 0');
    });

    it('should reject refund with negative amount', () => {
      const transaction = {
        ...baseTransaction,
      };

      const refundRequest: RefundRequest = {
        amount: -1000,
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Refund amount must be greater than 0');
    });

    it('should allow partial refund with remaining balance', () => {
      const transaction = {
        ...baseTransaction,
        amount: 10000, // $100.00
        refundedAmount: 3000, // $30.00 already refunded
      };

      const refundRequest: RefundRequest = {
        amount: 5000, // $50.00 - leaves $20.00 remaining
        reason: 'Partial refund requested',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(true);
    });

    it('should allow full refund of remaining amount', () => {
      const transaction = {
        ...baseTransaction,
        amount: 10000, // $100.00
        refundedAmount: 3000, // $30.00 already refunded
      };

      const refundRequest: RefundRequest = {
        amount: 7000, // $70.00 - exactly the remaining amount
        reason: 'Full refund of remaining amount',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(true);
    });

    it('should handle edge case of transaction at exactly 180 days', () => {
      const transaction = {
        ...baseTransaction,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // exactly 180 days ago
      };

      const refundRequest: RefundRequest = {
        amount: 5000,
        reason: 'Customer requested refund',
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(true);
    });

    it('should validate reason length if provided', () => {
      const transaction = {
        ...baseTransaction,
        status: 'completed' as const,
      };

      // Test with valid reason
      const validRefundRequest: RefundRequest = {
        amount: 5000,
        reason: 'A'.repeat(500), // exactly 500 characters
      };

      const validResult = validateRefund(transaction, validRefundRequest);
      expect(validResult.valid).toBe(true);

      // Test with reason too long
      const invalidRefundRequest: RefundRequest = {
        amount: 5000,
        reason: 'A'.repeat(501), // 501 characters - too long
      };

      const invalidResult = validateRefund(transaction, invalidRefundRequest);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBe('Refund reason cannot exceed 500 characters');
    });

    it('should allow refund without reason', () => {
      const transaction = {
        ...baseTransaction,
        status: 'completed' as const,
      };

      const refundRequest: RefundRequest = {
        amount: 5000,
        // no reason provided
      };

      const result = validateRefund(transaction, refundRequest);

      expect(result.valid).toBe(true);
    });
  });
});