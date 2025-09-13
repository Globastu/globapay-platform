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
  fees?: TransactionFee[];
  refunds?: Refund[];
  paymentLink?: {
    id: string;
    shortCode: string;
    description: string;
  };
  checkoutSession?: {
    id: string;
    token: string;
    checkoutUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface Refund {
  id: string;
  transactionId: string;
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

export interface TransactionFee {
  id: string;
  transactionId: string;
  type: 'payment_processing' | 'platform_fee' | 'merchant_service_charge';
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

export interface TransactionFilters {
  status: string;
  paymentLinkId?: string;
  merchantId?: string;
  customerEmail?: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  currency: string;
  paymentMethod: string;
  search: string;
  page: number;
  limit: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  completedAmount: number;
  refundedTransactions: number;
  refundedAmount: number;
  averageTransactionAmount: number;
  successRate: number;
}

export interface RefundRequest {
  amount: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface TransactionTimeline {
  event: string;
  status: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface RouteInfo {
  id: string;
  name: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  duration?: number;
  details?: Record<string, any>;
}