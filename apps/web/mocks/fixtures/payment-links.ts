import { getCurrentMerchant } from './merchants';

// Generate realistic payment link fixture data
export const createMockPaymentLink = (overrides: any = {}) => {
  const merchant = getCurrentMerchant();
  const id = overrides.id || `pl-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = overrides.createdAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  const expiresAt = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    id,
    merchantId: merchant.id,
    reference: overrides.reference || `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    amount: overrides.amount || Math.floor(Math.random() * 50000) + 1000, // $10.00 - $500.00
    currency: overrides.currency || merchant.settings.currency,
    description: overrides.description || `Payment for ${['Consultation', 'Product Purchase', 'Service Fee', 'Subscription'][Math.floor(Math.random() * 4)]}`,
    customerEmail: overrides.customerEmail || `customer${Math.floor(Math.random() * 1000)}@example.com`,
    customerName: overrides.customerName || `${['John', 'Jane', 'Alex', 'Sam', 'Chris'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][Math.floor(Math.random() * 5)]}`,
    status: overrides.status || ['pending', 'completed', 'expired'][Math.floor(Math.random() * 3)],
    url: `https://pay.globapay.com/link/${id}`,
    expiresAt,
    completedAt: overrides.status === 'completed' ? new Date(new Date(createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
    transactionId: overrides.status === 'completed' ? `tx-${Math.random().toString(36).substr(2, 9)}` : undefined,
    metadata: overrides.metadata || {
      source: 'dashboard',
      campaignId: `camp-${Math.random().toString(36).substr(2, 6)}`,
    },
    createdAt,
    updatedAt: overrides.updatedAt || createdAt,
    ...overrides,
  };
};

// Pre-generated sample payment links
export const mockPaymentLinks = [
  createMockPaymentLink({
    id: 'pl-demo-001',
    description: 'Medical Consultation Fee',
    amount: 15000, // $150.00
    status: 'completed',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.johnson@email.com',
    reference: 'CONSULT-001',
  }),
  createMockPaymentLink({
    id: 'pl-demo-002', 
    description: 'Telehealth Session',
    amount: 8500, // $85.00
    status: 'pending',
    customerName: 'Michael Chen',
    customerEmail: 'michael.chen@email.com',
    reference: 'TELEMED-002',
  }),
  createMockPaymentLink({
    id: 'pl-demo-003',
    description: 'Physical Therapy Package',
    amount: 32000, // $320.00
    status: 'completed',
    customerName: 'Emily Rodriguez',
    customerEmail: 'emily.rodriguez@email.com',
    reference: 'PHYSIO-003',
  }),
  createMockPaymentLink({
    id: 'pl-demo-004',
    description: 'Lab Test Payment',
    amount: 12500, // $125.00
    status: 'expired',
    customerName: 'David Thompson',
    customerEmail: 'david.thompson@email.com',
    reference: 'LAB-004',
  }),
  createMockPaymentLink({
    id: 'pl-demo-005',
    description: 'Prescription Consultation',
    amount: 6000, // $60.00
    status: 'pending',
    customerName: 'Lisa Kim',
    customerEmail: 'lisa.kim@email.com',
    reference: 'PRESCRIPTION-005',
  }),
];

// Helper to create new payment link with realistic data
export const generateNewPaymentLink = (input: any) => {
  return createMockPaymentLink({
    ...input,
    id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};