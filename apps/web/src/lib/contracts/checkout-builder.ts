import { z } from "zod";

export const Currency = z.string().min(3).max(3);
export const MoneyInt = z.number().int().nonnegative();

// Payment methods supported by Gr4vy
export const PaymentMethodSchema = z.enum([
  'card',
  'apple_pay',
  'google_pay',
  'paypal',
  'bank_transfer',
  'buy_now_pay_later'
]);

// Product Details Section
export const ProductDetailsSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  amount: MoneyInt.min(1, "Amount must be greater than 0"),
  currency: Currency.default("USD"),
});

// Payment Options Section
export const PaymentOptionsSchema = z.object({
  type: z.enum(['one_time', 'subscription']).default('one_time'),
  methods: z.array(PaymentMethodSchema).min(1, "At least one payment method is required"),
  require3DS: z.boolean().default(false),
  skipFraudCheck: z.boolean().default(false),
});

// Redirects & Branding Section
export const RedirectsBrandingSchema = z.object({
  successUrl: z.string().url("Success URL must be valid"),
  cancelUrl: z.string().url("Cancel URL must be valid"),
  theme: z.enum(['light', 'dark']).default('light'),
  customCss: z.string().optional(),
});

// Complete Checkout Builder Form
export const CheckoutBuilderFormSchema = z.object({
  productDetails: ProductDetailsSchema,
  paymentOptions: PaymentOptionsSchema,
  redirectsBranding: RedirectsBrandingSchema,
});

// Gr4vy API Request/Response Schemas
export const CreateGr4vyCheckoutSessionRequest = z.object({
  amount: MoneyInt,
  currency: Currency,
  description: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  paymentMethods: z.array(PaymentMethodSchema),
  require3DS: z.boolean().optional(),
  skipFraudCheck: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  customCss: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const Gr4vyCheckoutSessionResponse = z.object({
  id: z.string(),
  embedUrl: z.string().url(),
  checkoutUrl: z.string().url(),
  status: z.enum(['active', 'expired', 'completed', 'cancelled']),
  expiresAt: z.string(),
  createdAt: z.string(),
});

// Embed Code Configuration
export const EmbedConfigSchema = z.object({
  sessionId: z.string(),
  embedUrl: z.string().url(),
  theme: z.enum(['light', 'dark']),
  width: z.string().default('100%'),
  height: z.string().default('600px'),
});

// Generated Embed Code Result
export const EmbedCodeResultSchema = z.object({
  htmlSnippet: z.string(),
  jsSnippet: z.string(),
  iframeSrc: z.string().url(),
  sessionId: z.string(),
});

// Type exports
export type ProductDetails = z.infer<typeof ProductDetailsSchema>;
export type PaymentOptions = z.infer<typeof PaymentOptionsSchema>;
export type RedirectsBranding = z.infer<typeof RedirectsBrandingSchema>;
export type CheckoutBuilderForm = z.infer<typeof CheckoutBuilderFormSchema>;
export type CreateGr4vyCheckoutSessionRequest = z.infer<typeof CreateGr4vyCheckoutSessionRequest>;
export type Gr4vyCheckoutSessionResponse = z.infer<typeof Gr4vyCheckoutSessionResponse>;
export type EmbedConfig = z.infer<typeof EmbedConfigSchema>;
export type EmbedCodeResult = z.infer<typeof EmbedCodeResultSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;