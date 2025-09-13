import { BaseWebhookProvider } from './base.provider';

export class FraudWebhookProvider extends BaseWebhookProvider {
  name = 'fraud';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Fraud providers often use different signature schemes
    // Example: "v1=abc123def456,t=1234567890" (with timestamp)
    const parts = signature.split(',');
    let actualSignature = '';
    let timestamp = 0;

    for (const part of parts) {
      if (part.startsWith('v1=')) {
        actualSignature = part.slice(3);
      } else if (part.startsWith('t=')) {
        timestamp = parseInt(part.slice(2), 10);
      }
    }

    if (!actualSignature) {
      return false;
    }

    // Check timestamp to prevent replay attacks
    if (timestamp && !this.isTimestampValid(timestamp)) {
      return false;
    }

    // Include timestamp in payload for verification if present
    const payloadWithTimestamp = timestamp 
      ? `${timestamp}.${payload}`
      : payload;

    return this.verifyHmacSignature(payloadWithTimestamp, actualSignature, secret, 'sha256');
  }

  extractDedupeKey(payload: Record<string, any>): string {
    // Fraud events typically have a decision ID or assessment ID
    if (payload.decision_id) {
      return `fraud_${payload.decision_id}`;
    }
    if (payload.assessment_id) {
      return `fraud_${payload.assessment_id}`;
    }
    if (payload.transaction_id) {
      return `fraud_transaction_${payload.transaction_id}`;
    }
    
    return `fraud_${this.hashPayload(payload)}`;
  }

  getEventType(payload: Record<string, any>): string {
    return payload.event_type || payload.decision_type || 'fraud_assessment';
  }

  private hashPayload(payload: Record<string, any>): string {
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(payloadString).digest('hex').slice(0, 16);
  }
}

// Example fraud webhook payload structures
export const FraudWebhookExamples = {
  highRiskTransaction: {
    decision_id: "decision_abc123",
    event_type: "fraud.high_risk",
    transaction_id: "txn_xyz789",
    risk_score: 85,
    decision: "decline",
    factors: [
      {
        type: "velocity",
        description: "High transaction velocity from IP",
        weight: 35
      },
      {
        type: "geolocation",
        description: "Transaction from high-risk country",
        weight: 25
      }
    ],
    recommendation: "decline",
    created_at: "2024-01-15T10:30:00Z"
  },
  lowRiskTransaction: {
    decision_id: "decision_def456",
    event_type: "fraud.low_risk",
    transaction_id: "txn_abc123",
    risk_score: 15,
    decision: "approve",
    factors: [
      {
        type: "customer_history",
        description: "Returning customer with good history",
        weight: -20
      }
    ],
    recommendation: "approve",
    created_at: "2024-01-15T10:35:00Z"
  }
};