export interface WebhookEvent {
  id: string;
  provider: 'psp' | 'fraud' | 'kyb';
  eventType: string;
  dedupeKey: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  signature?: string;
  verified: boolean;
  processed: boolean;
  processingAttempts: number;
  lastProcessedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  merchantId?: string;
}

export interface WebhookProvider {
  name: string;
  verifySignature(payload: string, signature: string, secret: string): boolean;
  extractDedupeKey(payload: Record<string, any>): string;
  getEventType(payload: Record<string, any>): string;
}

export interface WebhookProcessingResult {
  success: boolean;
  shouldRetry: boolean;
  error?: string;
  data?: Record<string, any>;
}

export interface WebhookReplayRequest {
  reason: string;
  targetUrl?: string;
}

export interface ReconciliationAlert {
  id: string;
  type: 'orphaned_transaction' | 'webhook_delivery_lag' | 'missing_payment_link';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  resourceId: string;
  resourceType: string;
  metadata: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
}