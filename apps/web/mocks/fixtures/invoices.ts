import { Invoice, InvoiceItem, InvoiceStatus } from '@/lib/contracts/invoices';

// Generate mock invoice items
const createMockItems = (count: number = 1): InvoiceItem[] => {
  const templates = [
    { description: 'Professional Services', unitAmount: 15000 },
    { description: 'Software License', unitAmount: 9999 },
    { description: 'Monthly Subscription', unitAmount: 2500 },
    { description: 'Consulting Hours', unitAmount: 12500 },
    { description: 'API Usage Fee', unitAmount: 500 },
    { description: 'Platform Fee', unitAmount: 1000 },
    { description: 'Premium Support', unitAmount: 5000 },
    { description: 'Data Processing', unitAmount: 750 },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[i % templates.length]!;
    const quantity = Math.floor(Math.random() * 5) + 1;
    
    return {
      id: `item_${Date.now()}_${i}`,
      description: template.description,
      quantity,
      unitAmount: template.unitAmount,
    };
  });
};

// Helper to calculate totals for mock invoice
const calculateTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitAmount), 0);
  const taxTotal = Math.floor(subtotal * 0.08); // 8% tax
  const discountTotal = 0; // No discount for simplicity
  const total = subtotal + taxTotal - discountTotal;
  
  return { subtotal, taxTotal, discountTotal, total };
};

// Generate single mock invoice
export function generateMockInvoice(
  overrides: Partial<Invoice> = {},
  status: InvoiceStatus = 'draft'
): Invoice {
  const id = overrides.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const number = overrides.number || `INV-${Date.now().toString().substr(-6)}`;
  const items = overrides.items || createMockItems(Math.floor(Math.random() * 4) + 1);
  const totals = calculateTotals(items);
  
  const baseDate = new Date();
  const createdAt = new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const dueDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const currencies = ['USD', 'EUR', 'GBP'];
  const currency = overrides.currency ?? currencies[Math.floor(Math.random() * currencies.length)]!;
  
  const merchantIds = ['merchant_123', 'merchant_456', 'merchant_789'];
  const platformIds = ['platform_abc', 'platform_def', 'platform_ghi'];
  
  const invoice: Invoice = {
    id,
    merchantId: overrides.merchantId ?? merchantIds[Math.floor(Math.random() * merchantIds.length)]!,
    platformId: overrides.platformId || (Math.random() > 0.3 ? platformIds[Math.floor(Math.random() * platformIds.length)] : undefined),
    customerId: overrides.customerId || (Math.random() > 0.4 ? `customer_${Math.random().toString(36).substr(2, 9)}` : undefined),
    number,
    currency,
    status,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    amountDue: status === 'paid' ? 0 : totals.total,
    dueDate: dueDate.toISOString(),
    memo: overrides.memo || (Math.random() > 0.6 ? 'Payment terms: Net 30 days' : undefined),
    footer: overrides.footer || (Math.random() > 0.7 ? 'Thank you for your business!' : undefined),
    paymentLinkId: status === 'open' || status === 'paid' ? `link_${Math.random().toString(36).substr(2, 12)}` : undefined,
    paymentLinkUrl: status === 'open' || status === 'paid' ? `https://pay.gr4vy.com/${Math.random().toString(36).substr(2, 12)}` : undefined,
    metadata: overrides.metadata,
    createdAt: createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
    items,
    ...overrides,
  };
  
  return invoice;
}

// Mock invoice data for different scenarios
export const mockInvoices: Invoice[] = [
  // Recent draft invoices
  generateMockInvoice({
    id: 'inv_draft_001',
    number: 'INV-001234',
    merchantId: 'merchant_demo',
    customerId: 'customer_acme_corp',
    currency: 'USD',
    memo: 'Q4 2024 Professional Services',
    footer: 'Payment due within 30 days',
  }, 'draft'),
  
  generateMockInvoice({
    id: 'inv_draft_002', 
    number: 'INV-001235',
    merchantId: 'merchant_demo',
    currency: 'EUR',
  }, 'draft'),
  
  // Open invoices with payment links
  generateMockInvoice({
    id: 'inv_open_001',
    number: 'INV-001230',
    merchantId: 'merchant_demo',
    customerId: 'customer_tech_startup',
    currency: 'USD',
    memo: 'Monthly SaaS subscription',
    paymentLinkId: 'link_open_demo_001',
    paymentLinkUrl: 'https://pay.gr4vy.com/demo_open_001',
  }, 'open'),
  
  generateMockInvoice({
    id: 'inv_open_002',
    number: 'INV-001231',
    merchantId: 'merchant_demo', 
    currency: 'GBP',
    paymentLinkId: 'link_open_demo_002',
    paymentLinkUrl: 'https://pay.gr4vy.com/demo_open_002',
  }, 'open'),
  
  // Paid invoices
  generateMockInvoice({
    id: 'inv_paid_001',
    number: 'INV-001225',
    merchantId: 'merchant_demo',
    customerId: 'customer_enterprise',
    currency: 'USD',
    memo: 'Annual license renewal',
    paymentLinkId: 'link_paid_demo_001',
    paymentLinkUrl: 'https://pay.gr4vy.com/demo_paid_001',
  }, 'paid'),
  
  generateMockInvoice({
    id: 'inv_paid_002',
    number: 'INV-001226',
    merchantId: 'merchant_demo',
    currency: 'EUR',
    paymentLinkId: 'link_paid_demo_002', 
    paymentLinkUrl: 'https://pay.gr4vy.com/demo_paid_002',
  }, 'paid'),
  
  // Edge cases
  generateMockInvoice({
    id: 'inv_void_001',
    number: 'INV-001220',
    merchantId: 'merchant_demo',
    currency: 'USD',
    memo: 'Voided due to error',
  }, 'void'),
  
  generateMockInvoice({
    id: 'inv_large_001',
    number: 'INV-LARGE',
    merchantId: 'merchant_demo',
    currency: 'USD',
    items: createMockItems(8), // Large invoice with many items
    memo: 'Large multi-item invoice for testing',
  }, 'draft'),
];

// Helper to generate new invoice for testing
export function generateNewInvoice(data: any): Invoice {
  const items = data.items?.map((item: any, index: number) => ({
    id: `item_${Date.now()}_${index}`,
    description: item.description,
    quantity: item.quantity,
    unitAmount: item.unitAmount,
    taxRateId: item.taxRateId,
    discountId: item.discountId,
    metadata: item.metadata,
  })) || [];
  
  const totals = calculateTotals(items);
  
  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    merchantId: data.merchantId,
    platformId: data.platformId,
    customerId: data.customerId,
    number: `INV-${Date.now().toString().substr(-6)}`,
    currency: data.currency || 'EUR',
    status: 'draft',
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    amountDue: totals.total,
    dueDate: data.dueDate,
    memo: data.memo,
    footer: data.footer,
    metadata: data.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items,
  };
}