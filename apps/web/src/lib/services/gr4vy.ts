/**
 * Gr4vy Payment Link Integration Service
 * 
 * This service handles creating and managing payment links through the Gr4vy API
 * for invoice payments.
 */

export interface PaymentLinkMetadata {
  type: 'invoice';
  invoice_id: string;
  merchant_id: string;
  platform_id?: string;
}

export interface CreatePaymentLinkRequest {
  amount: number; // Amount in minor units (e.g., cents)
  currency: string; // 3-letter ISO currency code
  description?: string;
  metadata: PaymentLinkMetadata;
  success_url: string;
  cancel_url: string;
  expires_at?: string; // ISO datetime
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  metadata: PaymentLinkMetadata;
  created_at: string;
  expires_at?: string;
}

export class Gr4vyService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.GR4VY_API_BASE_URL || 'https://api.gr4vy.com';
    this.apiKey = process.env.GR4VY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('GR4VY_API_KEY not configured - payment links will fail');
    }
  }

  async createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLink> {
    if (!this.apiKey) {
      throw new Error('Gr4vy API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          metadata: request.metadata,
          success_url: request.success_url,
          cancel_url: request.cancel_url,
          expires_at: request.expires_at,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gr4vy API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        url: data.url,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        metadata: data.metadata,
        created_at: data.created_at,
        expires_at: data.expires_at,
      };
    } catch (error) {
      console.error('Failed to create Gr4vy payment link:', error);
      throw error;
    }
  }

  async getPaymentLink(id: string): Promise<PaymentLink | null> {
    if (!this.apiKey) {
      throw new Error('Gr4vy API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment-links/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gr4vy API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        url: data.url,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        metadata: data.metadata,
        created_at: data.created_at,
        expires_at: data.expires_at,
      };
    } catch (error) {
      console.error('Failed to get Gr4vy payment link:', error);
      throw error;
    }
  }

  /**
   * Create a payment link for an invoice
   */
  async createInvoicePaymentLink(
    invoiceId: string,
    merchantId: string,
    platformId: string | undefined,
    amount: number,
    currency: string,
    description: string
  ): Promise<PaymentLink> {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';
    
    return this.createPaymentLink({
      amount,
      currency,
      description,
      metadata: {
        type: 'invoice',
        invoice_id: invoiceId,
        merchant_id: merchantId,
        ...(platformId ? { platform_id: platformId } : {}),
      },
      success_url: `${baseUrl}/invoices/${invoiceId}?payment=success`,
      cancel_url: `${baseUrl}/invoices/${invoiceId}?payment=cancelled`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  }
}

// Export singleton instance
export const gr4vyService = new Gr4vyService();