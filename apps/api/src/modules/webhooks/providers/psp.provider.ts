import { BaseWebhookProvider } from './base.provider';

export class PSPWebhookProvider extends BaseWebhookProvider {
  name = 'psp';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    // PSP providers typically use HMAC-SHA256 with "sha256=" prefix
    // Example: "sha256=abc123def456..."
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const signatureWithoutPrefix = signature.slice(7); // Remove "sha256=" prefix
    return this.verifyHmacSignature(payload, signatureWithoutPrefix, secret, 'sha256');
  }

  extractDedupeKey(payload: Record<string, any>): string {
    // PSP events typically have an event ID or transaction ID
    if (payload.event_id) {
      return `psp_${payload.event_id}`;
    }
    if (payload.id) {
      return `psp_${payload.id}`;
    }
    if (payload.transaction_id) {
      return `psp_transaction_${payload.transaction_id}`;
    }
    
    // Fallback: hash the entire payload
    return `psp_${this.hashPayload(payload)}`;
  }

  getEventType(payload: Record<string, any>): string {
    return payload.event_type || payload.type || 'unknown';
  }

  private hashPayload(payload: Record<string, any>): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(payloadString).digest('hex').slice(0, 16);
  }
}

// Example PSP webhook payload structures for reference:
export const PSPWebhookExamples = {
  paymentCompleted: {
    event_id: "evt_1234567890",
    event_type: "payment.completed",
    transaction_id: "txn_abc123def456",
    amount: 2500,
    currency: "USD",
    status: "completed",
    payment_method: {
      type: "card",
      last4: "4242",
      brand: "visa"
    },
    metadata: {
      checkout_session_id: "cs_xyz789"
    },
    created_at: "2024-01-15T10:30:00Z"
  },
  paymentFailed: {
    event_id: "evt_0987654321",
    event_type: "payment.failed",
    transaction_id: "txn_def456ghi789",
    amount: 1500,
    currency: "USD",
    status: "failed",
    failure_code: "card_declined",
    failure_message: "Your card was declined.",
    metadata: {
      checkout_session_id: "cs_abc123"
    },
    created_at: "2024-01-15T10:35:00Z"
  }
};