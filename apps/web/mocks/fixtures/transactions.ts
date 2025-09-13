import { getCurrentMerchant } from './merchants';
import { mockPaymentLinks } from './payment-links';

// Generate realistic transaction fixture data
export const createMockTransaction = (overrides: any = {}) => {
  const merchant = getCurrentMerchant();
  const id = overrides.id || `tx-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = overrides.createdAt || new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();
  const processedAt = overrides.status !== 'pending' ? new Date(new Date(createdAt).getTime() + Math.random() * 60 * 60 * 1000).toISOString() : undefined;
  
  const cardBrands = ['visa', 'mastercard', 'amex', 'discover'];
  const countries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU'];
  
  return {
    id,
    merchantId: merchant.id,
    paymentLinkId: overrides.paymentLinkId || mockPaymentLinks[Math.floor(Math.random() * mockPaymentLinks.length)].id,
    reference: overrides.reference || `TXN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    amount: overrides.amount || Math.floor(Math.random() * 100000) + 500, // $5.00 - $1000.00
    currency: overrides.currency || merchant.settings.currency,
    status: overrides.status || ['captured', 'authorized', 'failed'][Math.floor(Math.random() * 3)],
    paymentMethod: {
      type: 'card',
      details: {
        last4: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
        brand: cardBrands[Math.floor(Math.random() * cardBrands.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
      },
    },
    customer: {
      email: overrides.customerEmail || `customer${Math.floor(Math.random() * 1000)}@example.com`,
      name: overrides.customerName || `${['Alice', 'Bob', 'Carol', 'David', 'Eve'][Math.floor(Math.random() * 5)]} ${['Wilson', 'Garcia', 'Miller', 'Davis', 'Martinez'][Math.floor(Math.random() * 5)]}`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    },
    fraudScore: Math.floor(Math.random() * 30), // Low fraud scores for demo
    threeDsResult: {
      status: ['authenticated', 'not_authenticated', 'attempted'][Math.floor(Math.random() * 3)],
      version: ['2.1', '2.2'][Math.floor(Math.random() * 2)],
    },
    fees: {
      processing: Math.floor(overrides.amount || 10000 * 0.029) + 30, // 2.9% + 30 cents
      platform: Math.floor((overrides.amount || 10000) * 0.005), // 0.5% platform fee
    },
    refunds: overrides.refunds || [],
    pspTransactionId: `psp_${Math.random().toString(36).substr(2, 16)}`,
    metadata: overrides.metadata || {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      source: 'payment_link',
    },
    processedAt,
    createdAt,
    updatedAt: overrides.updatedAt || processedAt || createdAt,
    ...overrides,
  };
};

// Pre-generated sample transactions
export const mockTransactions = [
  createMockTransaction({
    id: 'tx-demo-001',
    paymentLinkId: 'pl-demo-001',
    amount: 15000, // $150.00
    status: 'captured',
    customer: {
      email: 'sarah.johnson@email.com',
      name: 'Sarah Johnson',
      phone: '+1-555-0123',
    },
    reference: 'CONSULT-001',
  }),
  createMockTransaction({
    id: 'tx-demo-002',
    paymentLinkId: 'pl-demo-003',
    amount: 32000, // $320.00
    status: 'captured',
    customer: {
      email: 'emily.rodriguez@email.com',
      name: 'Emily Rodriguez',
      phone: '+1-555-0456',
    },
    reference: 'PHYSIO-003',
    refunds: [
      {
        id: 'rf-demo-001',
        amount: 5000, // $50.00 partial refund
        reason: 'Service partially unused',
        status: 'succeeded',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }),
  createMockTransaction({
    id: 'tx-demo-003',
    amount: 8500, // $85.00
    status: 'failed',
    customer: {
      email: 'michael.chen@email.com',
      name: 'Michael Chen',
      phone: '+1-555-0789',
    },
    reference: 'TELEMED-002',
    fraudScore: 75, // Higher fraud score for failed transaction
  }),
  createMockTransaction({
    id: 'tx-demo-004',
    amount: 25000, // $250.00
    status: 'captured',
    customer: {
      email: 'jennifer.walsh@email.com',
      name: 'Jennifer Walsh',
      phone: '+1-555-0321',
    },
    reference: 'IMAGING-004',
  }),
  createMockTransaction({
    id: 'tx-demo-005',
    amount: 4500, // $45.00
    status: 'authorized',
    customer: {
      email: 'robert.kim@email.com',
      name: 'Robert Kim',
      phone: '+1-555-0654',
    },
    reference: 'CHECKUP-005',
  }),
];

// Helper to create refund data
export const createMockRefund = (transactionId: string, amount: number, reason: string = 'Requested by customer') => {
  return {
    id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    transactionId,
    amount,
    reason,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
};

// Helper to find transaction by ID
export const findTransactionById = (id: string) => {
  return mockTransactions.find(tx => tx.id === id);
};