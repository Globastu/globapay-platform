import { PSPWebhookProvider, PSPWebhookExamples } from './psp.provider';
import { FraudWebhookProvider, FraudWebhookExamples } from './fraud.provider';
import { KYBWebhookProvider, KYBWebhookExamples } from './kyb.provider';
import type { WebhookProvider } from '../types';

export const WEBHOOK_PROVIDERS: Record<string, WebhookProvider> = {
  psp: new PSPWebhookProvider(),
  fraud: new FraudWebhookProvider(),
  kyb: new KYBWebhookProvider(),
};

export const WEBHOOK_EXAMPLES = {
  psp: PSPWebhookExamples,
  fraud: FraudWebhookExamples,
  kyb: KYBWebhookExamples,
};

export function getWebhookProvider(providerName: string): WebhookProvider | null {
  return WEBHOOK_PROVIDERS[providerName] || null;
}

export * from './base.provider';
export * from './psp.provider';
export * from './fraud.provider';
export * from './kyb.provider';