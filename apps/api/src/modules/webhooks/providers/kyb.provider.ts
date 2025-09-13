import { BaseWebhookProvider } from './base.provider';

export class KYBWebhookProvider extends BaseWebhookProvider {
  name = 'kyb';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    // KYB providers often use JWT-style signatures or simple HMAC
    // Example: Basic HMAC-SHA256 without prefix
    return this.verifyHmacSignature(payload, signature, secret, 'sha256');
  }

  extractDedupeKey(payload: Record<string, any>): string {
    // KYB events typically have a verification ID or application ID
    if (payload.verification_id) {
      return `kyb_${payload.verification_id}`;
    }
    if (payload.application_id) {
      return `kyb_${payload.application_id}`;
    }
    if (payload.merchant_id) {
      return `kyb_merchant_${payload.merchant_id}`;
    }
    
    return `kyb_${this.hashPayload(payload)}`;
  }

  getEventType(payload: Record<string, any>): string {
    return payload.event_type || payload.verification_status || 'kyb_update';
  }

  private hashPayload(payload: Record<string, any>): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(payloadString).digest('hex').slice(0, 16);
  }
}

// Example KYB webhook payload structures
export const KYBWebhookExamples = {
  verificationCompleted: {
    verification_id: "kyb_abc123def456",
    event_type: "kyb.verification_completed",
    merchant_id: "merchant_xyz789",
    application_id: "app_123456",
    status: "approved",
    verification_level: "full",
    documents_verified: [
      {
        type: "business_registration",
        status: "verified",
        confidence: 0.95
      },
      {
        type: "tax_identification",
        status: "verified",
        confidence: 0.92
      }
    ],
    risk_assessment: {
      level: "low",
      score: 0.15,
      factors: []
    },
    created_at: "2024-01-15T10:30:00Z"
  },
  verificationFailed: {
    verification_id: "kyb_def456ghi789",
    event_type: "kyb.verification_failed",
    merchant_id: "merchant_abc123",
    application_id: "app_789012",
    status: "rejected",
    rejection_reasons: [
      {
        code: "invalid_document",
        description: "Business registration document could not be verified",
        document_type: "business_registration"
      }
    ],
    retry_allowed: true,
    created_at: "2024-01-15T10:35:00Z"
  },
  additionalDocumentsRequired: {
    verification_id: "kyb_ghi789jkl012",
    event_type: "kyb.documents_required",
    merchant_id: "merchant_def456",
    application_id: "app_345678",
    status: "pending",
    required_documents: [
      {
        type: "bank_statement",
        description: "Recent bank statement (last 3 months)",
        required: true
      }
    ],
    deadline: "2024-01-30T23:59:59Z",
    created_at: "2024-01-15T10:40:00Z"
  }
};