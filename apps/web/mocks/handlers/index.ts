import { paymentLinkHandlers } from './payment-links';
import { transactionHandlers } from './transactions';
import { checkoutSessionHandlers } from './checkout-sessions';
import { tenancyHandlers } from './tenancy';
import { fraudHandlers } from './fraud';
import { auditHandlers } from './audit';
import { invoiceHandlers } from './invoices';

// Combine all MSW handlers
export const handlers = [
  ...paymentLinkHandlers,
  ...transactionHandlers,
  ...checkoutSessionHandlers,
  ...tenancyHandlers,
  ...fraudHandlers,
  ...auditHandlers,
  ...invoiceHandlers,
];

export * from './payment-links';
export * from './transactions';
export * from './checkout-sessions';
export * from './tenancy';
export * from './fraud';
export * from './audit';
export * from './invoices';