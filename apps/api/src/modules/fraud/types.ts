export interface FraudCheckRequest {
  // Transaction details
  amount: number;
  currency: string;
  merchantId: string;
  
  // Customer information
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  
  // Payment method
  paymentMethod: {
    type: 'card' | 'wallet' | 'bank_transfer';
    cardFingerprint?: string;
    walletProvider?: string;
    last4?: string;
    country?: string;
  };
  
  // Request context
  ipAddress: string;
  userAgent: string;
  browserFingerprint?: string;
  
  // Geographic data
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Session info
  sessionId?: string;
  referrer?: string;
  
  // Historical context
  customerHistory?: {
    totalTransactions: number;
    totalAmount: number;
    firstTransactionDate?: Date;
    lastTransactionDate?: Date;
    chargebacks: number;
  };
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface FraudCheckResult {
  // Core results
  score: number; // 0-100, higher = more risky
  decision: FraudDecision;
  confidence: number; // 0-100, confidence in the decision
  
  // Detailed analysis
  riskFactors: FraudRiskFactor[];
  rules: FraudRule[];
  
  // Provider info
  providerId: string;
  providerTransactionId: string;
  processingTime: number; // milliseconds
  
  // Additional context
  recommendation?: string;
  metadata?: Record<string, any>;
}

export type FraudDecision = 'approve' | 'review' | 'decline';

export interface FraudRiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // contribution to overall score
  description: string;
  details?: Record<string, any>;
}

export interface FraudRule {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  action: 'approve' | 'review' | 'decline' | 'flag';
  weight: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface FraudThresholds {
  approveBelow: number; // Auto-approve if score is below this
  reviewAbove: number; // Manual review if score is above approve but below decline
  declineAbove: number; // Auto-decline if score is above this
}

export interface FraudProvider {
  name: string;
  version: string;
  
  /**
   * Perform fraud check on a transaction
   */
  checkFraud(request: FraudCheckRequest): Promise<FraudCheckResult>;
  
  /**
   * Update fraud result (for learning/feedback)
   */
  updateResult?(
    providerTransactionId: string, 
    actualOutcome: 'approved' | 'declined' | 'chargeback' | 'legitimate'
  ): Promise<void>;
  
  /**
   * Get provider status/health
   */
  getStatus(): Promise<{
    healthy: boolean;
    latency?: number;
    errorRate?: number;
    metadata?: Record<string, any>;
  }>;
}

// Database models
export interface FraudCheck {
  id: string;
  checkoutSessionId?: string;
  transactionId?: string;
  merchantId: string;
  
  // Request data
  requestData: FraudCheckRequest;
  
  // Results
  score: number;
  decision: FraudDecision;
  confidence: number;
  riskFactors: FraudRiskFactor[];
  rules: FraudRule[];
  
  // Provider info
  providerId: string;
  providerTransactionId: string;
  processingTime: number;
  
  // Status tracking
  status: 'completed' | 'failed' | 'timeout';
  error?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Follow-up
  actualOutcome?: 'approved' | 'declined' | 'chargeback' | 'legitimate';
  outcomeUpdatedAt?: Date;
  
  // Additional context
  metadata?: Record<string, any>;
}

export interface FraudStats {
  totalChecks: number;
  approvedCount: number;
  reviewCount: number;
  declinedCount: number;
  averageScore: number;
  averageProcessingTime: number;
  topRiskFactors: Array<{
    factor: string;
    count: number;
    averageScore: number;
  }>;
}