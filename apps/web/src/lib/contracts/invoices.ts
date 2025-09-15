import { z } from "zod";

export const MoneyInt = z.number().int().nonnegative(); // minor units
export const Currency = z.string().min(3).max(3);

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),                 // omit when creating
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitAmount: MoneyInt,
  taxRateId: z.string().optional(),
  discountId: z.string().optional(),
  amount: MoneyInt.optional(),               // server-calculated
  metadata: z.record(z.string(), z.any()).optional(),
});

export const InvoiceStatus = z.enum(["draft","open","paid","void","uncollectible"]);

export const InvoiceSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  platformId: z.string().optional(),
  customerId: z.string().optional(),
  number: z.string(),
  currency: Currency,
  status: InvoiceStatus,
  subtotal: MoneyInt,
  taxTotal: MoneyInt,
  discountTotal: MoneyInt,
  total: MoneyInt,
  amountDue: MoneyInt,
  dueDate: z.string(),
  memo: z.string().optional(),
  footer: z.string().optional(),
  paymentLinkId: z.string().optional(),
  paymentLinkUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(InvoiceItemSchema),
});

export const CreateInvoiceInput = z.object({
  merchantId: z.string(),
  platformId: z.string().optional(),
  currency: Currency.default("EUR"),
  customerId: z.string().optional(),
  dueDate: z.string(),
  memo: z.string().optional(),
  footer: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const UpdateInvoiceInput = CreateInvoiceInput.partial();

export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInput>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceInput>;
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;