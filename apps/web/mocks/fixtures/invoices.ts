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
  const currency = overrides.currency ?? currencies[Math.floor(Math.random() * currencies.length)] ?? 'USD';
  
  const merchantIds = ['merchant_123', 'merchant_456', 'merchant_789'];
  const platformIds = ['platform_abc', 'platform_def', 'platform_ghi'];
  
  const invoice: Invoice = {
    id,
    merchantId: overrides.merchantId ?? merchantIds[Math.floor(Math.random() * merchantIds.length)] ?? 'merchant_123',
    platformId: overrides.platformId || (Math.random() > 0.3 ? platformIds[Math.floor(Math.random() * platformIds.length)] ?? 'platform_abc' : undefined),
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

// Customer data for more realistic invoices
const customers = [
  { id: 'customer_acme_corp', name: 'Acme Corporation', email: 'billing@acme.com' },
  { id: 'customer_tech_startup', name: 'TechFlow Startup', email: 'finance@techflow.io' },
  { id: 'customer_enterprise', name: 'Enterprise Solutions Ltd', email: 'payments@enterprise.com' },
  { id: 'customer_digital_agency', name: 'Digital Creative Agency', email: 'accounts@digitalcreative.com' },
  { id: 'customer_consulting_firm', name: 'Strategic Consulting Firm', email: 'billing@strategic.com' },
  { id: 'customer_ecommerce', name: 'E-Commerce Solutions', email: 'finance@ecommerce.net' },
  { id: 'customer_saas_company', name: 'CloudTech SaaS', email: 'billing@cloudtech.com' },
  { id: 'customer_marketing_co', name: 'Growth Marketing Co', email: 'payments@growthmarketing.com' },
];

// Generate invoices with varying due dates and statuses
const generateTimedInvoice = (daysOffset: number, status: InvoiceStatus, customer: any, overrides: Partial<Invoice> = {}): Invoice => {
  const baseDate = new Date();
  const createdDate = new Date(baseDate.getTime() - Math.abs(daysOffset + 30) * 24 * 60 * 60 * 1000);
  const dueDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  
  return generateMockInvoice({
    customerId: customer.id,
    dueDate: dueDate.toISOString(),
    createdAt: createdDate.toISOString(),
    updatedAt: status === 'paid' ? new Date(dueDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString(),
    paymentLinkId: ['open', 'paid'].includes(status) ? `link_${Math.random().toString(36).substr(2, 12)}` : undefined,
    paymentLinkUrl: ['open', 'paid'].includes(status) ? `https://pay.gr4vy.com/demo_${Math.random().toString(36).substr(2, 8)}` : undefined,
    ...overrides,
  }, status);
};

// Mock invoice data with realistic scenarios
export const mockInvoices: Invoice[] = [
  // OVERDUE INVOICES (past due date)
  generateTimedInvoice(-15, 'open', customers[0], {
    id: 'inv_overdue_001',
    number: 'INV-001201',
    memo: 'Website development services - OVERDUE',
    currency: 'USD',
  }),
  
  generateTimedInvoice(-8, 'open', customers[1], {
    id: 'inv_overdue_002', 
    number: 'INV-001205',
    memo: 'Monthly subscription fee',
    currency: 'EUR',
  }),
  
  generateTimedInvoice(-3, 'open', customers[2], {
    id: 'inv_overdue_003',
    number: 'INV-001210',
    memo: 'Consulting services Q3',
    currency: 'GBP',
  }),

  // DUE TODAY
  generateTimedInvoice(0, 'open', customers[3], {
    id: 'inv_due_today_001',
    number: 'INV-001220',
    memo: 'Digital marketing campaign - DUE TODAY',
    currency: 'USD',
  }),
  
  generateTimedInvoice(0, 'open', customers[4], {
    id: 'inv_due_today_002',
    number: 'INV-001221',
    memo: 'Strategic planning workshop',
    currency: 'EUR',
  }),

  // DUE SOON (next 7 days)
  generateTimedInvoice(3, 'open', customers[5], {
    id: 'inv_due_soon_001',
    number: 'INV-001225',
    memo: 'E-commerce platform setup',
    currency: 'USD',
  }),
  
  generateTimedInvoice(7, 'open', customers[6], {
    id: 'inv_due_soon_002',
    number: 'INV-001228',
    memo: 'Cloud infrastructure services',
    currency: 'USD',
  }),

  // NOT DUE YET (future due dates)
  generateTimedInvoice(15, 'open', customers[7], {
    id: 'inv_future_001',
    number: 'INV-001235',
    memo: 'Growth marketing retainer',
    currency: 'USD',
  }),
  
  generateTimedInvoice(22, 'open', customers[0], {
    id: 'inv_future_002',
    number: 'INV-001240',
    memo: 'Annual support package',
    currency: 'EUR',
  }),
  
  generateTimedInvoice(30, 'open', customers[1], {
    id: 'inv_future_003',
    number: 'INV-001245',
    memo: 'Custom integration development',
    currency: 'USD',
  }),

  // RECENTLY PAID
  generateTimedInvoice(-5, 'paid', customers[2], {
    id: 'inv_paid_recent_001',
    number: 'INV-001180',
    memo: 'Q2 consulting services - PAID',
    currency: 'USD',
  }),
  
  generateTimedInvoice(-12, 'paid', customers[3], {
    id: 'inv_paid_recent_002',
    number: 'INV-001175',
    memo: 'Brand redesign project',
    currency: 'GBP',
  }),
  
  generateTimedInvoice(-20, 'paid', customers[4], {
    id: 'inv_paid_recent_003',
    number: 'INV-001165',
    memo: 'Leadership training program',
    currency: 'EUR',
  }),

  // DRAFT INVOICES (not sent yet)
  generateMockInvoice({
    id: 'inv_draft_001',
    number: 'INV-001250',
    customerId: customers[5]?.id ?? 'customer_ecommerce',
    currency: 'USD',
    memo: 'New project proposal - DRAFT',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, 'draft'),
  
  generateMockInvoice({
    id: 'inv_draft_002',
    number: 'INV-001251', 
    customerId: customers[6]?.id ?? 'customer_saas_company',
    currency: 'EUR',
    memo: 'Monthly maintenance fee',
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  }, 'draft'),

  // VOID INVOICES
  generateMockInvoice({
    id: 'inv_void_001',
    number: 'INV-001100',
    customerId: customers[7]?.id ?? 'customer_marketing_co',
    currency: 'USD',
    memo: 'Cancelled project - VOID',
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }, 'void'),

  // UNCOLLECTIBLE
  generateTimedInvoice(-90, 'uncollectible', customers[0], {
    id: 'inv_uncollectible_001',
    number: 'INV-001050',
    memo: 'Bad debt write-off',
    currency: 'USD',
  }),
];

// Export customer data for use in other components
export { customers };

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