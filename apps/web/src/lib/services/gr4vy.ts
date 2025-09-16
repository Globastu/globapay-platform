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

export interface RefundRequest {
  amount?: number; // Amount to refund in minor units (optional for partial refunds)
  reason?: string; // Reason for refund
  metadata?: Record<string, any>; // Additional metadata
}

export interface Refund {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
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
   * Create a refund for a transaction
   */
  async createRefund(transactionId: string, request: RefundRequest): Promise<Refund> {
    if (!this.apiKey) {
      throw new Error('Gr4vy API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          reason: request.reason,
          metadata: request.metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gr4vy refund API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        transaction_id: data.transaction_id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        reason: data.reason,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Failed to create Gr4vy refund:', error);
      throw error;
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<Refund | null> {
    if (!this.apiKey) {
      throw new Error('Gr4vy API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/refunds/${refundId}`, {
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
        transaction_id: data.transaction_id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        reason: data.reason,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Failed to get Gr4vy refund:', error);
      throw error;
    }
  }

  /**
   * List refunds for a transaction
   */
  async listTransactionRefunds(transactionId: string): Promise<Refund[]> {
    if (!this.apiKey) {
      throw new Error('Gr4vy API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/refunds`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gr4vy API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.items?.map((item: any) => ({
        id: item.id,
        transaction_id: item.transaction_id,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        reason: item.reason,
        created_at: item.created_at,
        updated_at: item.updated_at,
        metadata: item.metadata,
      })) || [];
    } catch (error) {
      console.error('Failed to list Gr4vy refunds:', error);
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