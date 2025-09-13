'use client';

import { getSession } from 'next-auth/react';

// Get base URL from environment or use empty string for MSW
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * API client that respects mock mode
 * When NEXT_PUBLIC_API_BASE_URL is empty and NEXT_PUBLIC_MOCK=1,
 * requests will be intercepted by MSW
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        type: 'https://globapay.com/problems/network-error',
        title: 'Network Error',
        status: response.status,
        detail: 'An error occurred while making the request.',
      }));
      throw new Error(JSON.stringify(error));
    }

    return response.json();
  }

  // Payment Links API
  async getPaymentLinks(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/payment-links${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getPaymentLink(id: string) {
    return this.request(`/payment-links/${id}`);
  }

  async createPaymentLink(data: {
    amount: number;
    currency: string;
    description: string;
    customerEmail?: string;
    customerName?: string;
    reference?: string;
    metadata?: Record<string, string>;
  }) {
    return this.request('/payment-links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentLink(id: string, data: Partial<{
    description: string;
    customerEmail: string;
    customerName: string;
    metadata: Record<string, string>;
  }>) {
    return this.request(`/payment-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async voidPaymentLink(id: string) {
    return this.request(`/payment-links/${id}/void`, {
      method: 'POST',
    });
  }

  async resendPaymentLink(id: string) {
    return this.request(`/payment-links/${id}/resend`, {
      method: 'POST',
    });
  }

  // Transactions API
  async getTransactions(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentLinkId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getTransaction(id: string) {
    return this.request(`/transactions/${id}`);
  }

  async refundTransaction(id: string, data: {
    amount: number;
    reason?: string;
  }) {
    return this.request(`/transactions/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactionStats(params: {
    fromDate?: string;
    toDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/transactions/stats${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Checkout Sessions API
  async createCheckoutSession(data: {
    paymentLinkId?: string;
    merchantId?: string;
    amount?: number;
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    description?: string;
    metadata?: Record<string, string>;
    returnUrl?: string;
    cancelUrl?: string;
    require3DS?: boolean;
    skipFraudCheck?: boolean;
  }) {
    return this.request('/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckoutSession(token: string) {
    return this.request(`/checkout/sessions/${token}`);
  }

  async completeCheckoutSession(token: string, data: {
    transactionId: string;
    fraudScore?: number;
  }) {
    return this.request(`/checkout/sessions/${token}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelCheckoutSession(token: string) {
    return this.request(`/checkout/sessions/${token}/cancel`, {
      method: 'POST',
    });
  }

  // Payment Links lookup by short code (public endpoint)
  async getPaymentLinkByCode(shortCode: string) {
    return this.request(`/payment-links/code/${shortCode}`, {
      headers: {
        // Public endpoint - no auth headers needed
        'Content-Type': 'application/json',
      }
    });
  }

  // Utility method to check if we're in mock mode
  isMockMode(): boolean {
    return process.env.NEXT_PUBLIC_MOCK === '1' && !this.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;