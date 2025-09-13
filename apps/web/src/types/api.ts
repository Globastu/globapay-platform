// Payment Link types
export interface PaymentLink {
  id: string;
  shortCode: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  reference?: string;
  status: 'pending' | 'completed' | 'expired' | 'voided';
  paymentUrl: string;
  transactionId?: string;
  expiresAt: string;
  completedAt?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

// Checkout Session types
export interface CheckoutSession {
  id: string;
  token: string;
  paymentLinkId?: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  checkoutUrl: string;
  returnUrl?: string;
  cancelUrl?: string;
  require3DS: boolean;
  skipFraudCheck: boolean;
  fraudScore?: number;
  expiresAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionRequest {
  paymentLinkId?: string;
  merchantId?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
  require3DS?: boolean;
  skipFraudCheck?: boolean;
}

// Transaction types
export interface Transaction {
  id: string;
  merchantId: string;
  paymentLinkId?: string;
  checkoutSessionId?: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  paymentMethodId?: string;
  paymentMethodType?: string;
  reference?: string;
  fraudScore?: number;
  require3DS: boolean;
  threeDSStatus?: '3ds_authenticated' | '3ds_failed' | '3ds_not_required';
  processorTransactionId?: string;
  processorResponse?: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  refundedAmount?: number;
  refunds?: Refund[];
  fees?: TransactionFee[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, string>;
}

// Refund types
export interface Refund {
  id: string;
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processorRefundId?: string;
  processorResponse?: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Transaction Fee types
export interface TransactionFee {
  id: string;
  transactionId: string;
  type: 'payment_processing' | 'platform_fee' | 'merchant_service_charge';
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

// Payment Result types for checkout
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// API Response wrapper types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error response types (RFC 7807)
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [key: string]: any;
}