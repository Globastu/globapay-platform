import { http, HttpResponse } from 'msw';
import type { CheckoutSession, CreateCheckoutSessionRequest, PaymentLink } from '@/types/api';

// In-memory store for checkout sessions
const checkoutSessions = new Map<string, CheckoutSession>();

// Helper to generate session token
const generateSessionToken = () => Math.random().toString(36).substr(2, 64);

// Helper to generate session ID
const generateSessionId = () => `cs_${Math.random().toString(36).substr(2, 24)}`;

// Helper to find payment link by ID (simulated)
const findPaymentLinkById = (id: string): PaymentLink | null => {
  // In a real implementation, this would query the payment links store
  // For mock purposes, we'll create a mock payment link
  return {
    id,
    shortCode: 'HEALTH01',
    merchantId: 'merchant_healthcare_demo',
    amount: 2500, // $25.00
    currency: 'USD',
    description: 'Medical Consultation Payment',
    customerEmail: 'patient@example.com',
    customerName: 'John Doe',
    status: 'pending',
    paymentUrl: `https://pay.globapay.com/link/HEALTH01`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const checkoutSessionHandlers = [
  // POST /checkout/sessions - Create checkout session
  http.post('/api/checkout/sessions', async ({ request }) => {
    const body = await request.json() as CreateCheckoutSessionRequest;

    // Simulate network latency
    const latency = parseInt(localStorage.getItem('mockLatency') || '0');
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    try {
      let amount: number;
      let currency: string;
      let description: string;
      let customerEmail: string | undefined;
      let customerName: string | undefined;
      let merchantId: string;
      let paymentLinkId: string | undefined;

      if (body.paymentLinkId) {
        // Look up payment link details
        const paymentLink = findPaymentLinkById(body.paymentLinkId);
        if (!paymentLink) {
          return HttpResponse.json({
            type: 'https://globapay.com/problems/not-found',
            title: 'Payment Link Not Found',
            status: 404,
            detail: 'Payment link not found or not available for checkout',
            instance: '/checkout/sessions',
          }, { status: 404 });
        }

        if (paymentLink.status !== 'pending') {
          return HttpResponse.json({
            type: 'https://globapay.com/problems/invalid-state',
            title: 'Payment Link Not Available',
            status: 400,
            detail: 'Payment link is not available for checkout',
            instance: '/checkout/sessions',
          }, { status: 400 });
        }

        amount = paymentLink.amount;
        currency = paymentLink.currency;
        description = paymentLink.description;
        customerEmail = paymentLink.customerEmail;
        customerName = paymentLink.customerName;
        merchantId = paymentLink.merchantId;
        paymentLinkId = paymentLink.id;
      } else {
        // Direct payment details
        if (!body.amount || !body.currency || !body.description) {
          return HttpResponse.json({
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Either paymentLinkId or amount/currency/description must be provided',
            instance: '/checkout/sessions',
          }, { status: 400 });
        }

        amount = body.amount;
        currency = body.currency;
        description = body.description;
        customerEmail = body.customerEmail;
        customerName = body.customerName;
        merchantId = body.merchantId || 'merchant_default';
        paymentLinkId = undefined;
      }

      // Generate session details
      const sessionId = generateSessionId();
      const token = generateSessionToken();
      const checkoutUrl = `https://checkout.globapay.com/session/${token}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const require3DS = body.require3DS ?? (currency === 'EUR' && amount > 3000);

      const session: CheckoutSession = {
        id: sessionId,
        token,
        paymentLinkId,
        merchantId,
        amount,
        currency,
        description,
        customerEmail,
        customerName,
        status: 'active',
        checkoutUrl,
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
        require3DS,
        skipFraudCheck: body.skipFraudCheck || false,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: body.metadata || {},
      };

      // Store session
      checkoutSessions.set(token, session);

      return HttpResponse.json({
        data: session,
      }, { status: 201 });
    } catch (error) {
      console.error('Mock error creating checkout session:', error);
      return HttpResponse.json({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: '/checkout/sessions',
      }, { status: 500 });
    }
  }),

  // GET /checkout/sessions/:token - Get checkout session by token (public endpoint)
  http.get('/api/checkout/sessions/:token', async ({ params }) => {
    const token = params.token as string;

    // Simulate network latency
    const latency = parseInt(localStorage.getItem('mockLatency') || '0');
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    const session = checkoutSessions.get(token);
    if (!session) {
      return HttpResponse.json({
        type: 'https://globapay.com/problems/not-found',
        title: 'Checkout Session Not Found',
        status: 404,
        detail: `Checkout session with token '${token}' was not found`,
        instance: `/checkout/sessions/${token}`,
      }, { status: 404 });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < now && session.status === 'active') {
      session.status = 'expired';
      session.updatedAt = now.toISOString();
      checkoutSessions.set(token, session);
    }

    // Return public view of session (no sensitive data)
    const publicSession = {
      id: session.id,
      token: session.token,
      merchantId: session.merchantId,
      amount: session.amount,
      currency: session.currency,
      description: session.description,
      customerEmail: session.customerEmail,
      customerName: session.customerName,
      status: session.status,
      require3DS: session.require3DS,
      skipFraudCheck: session.skipFraudCheck,
      expiresAt: session.expiresAt,
      metadata: session.metadata,
    };

    return HttpResponse.json({
      data: publicSession,
    });
  }),

  // POST /checkout/sessions/:token/complete - Complete checkout session (webhook endpoint)
  http.post('/api/checkout/sessions/:token/complete', async ({ params, request }) => {
    const token = params.token as string;
    const body = await request.json() as { transactionId: string; fraudScore?: number };

    // Simulate network latency
    const latency = parseInt(localStorage.getItem('mockLatency') || '0');
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    const session = checkoutSessions.get(token);
    if (!session) {
      return HttpResponse.json({
        type: 'https://globapay.com/problems/not-found',
        title: 'Checkout Session Not Found',
        status: 404,
        detail: 'Checkout session not found',
        instance: `/checkout/sessions/${token}/complete`,
      }, { status: 404 });
    }

    if (session.status !== 'active') {
      return HttpResponse.json({
        type: 'https://globapay.com/problems/invalid-state',
        title: 'Invalid State',
        status: 400,
        detail: 'Checkout session is not active',
        instance: `/checkout/sessions/${token}/complete`,
      }, { status: 400 });
    }

    // Update session as completed
    const completedAt = new Date().toISOString();
    session.status = 'completed';
    session.fraudScore = body.fraudScore;
    session.completedAt = completedAt;
    session.updatedAt = completedAt;

    checkoutSessions.set(token, session);

    return HttpResponse.json({
      data: {
        id: session.id,
        status: session.status,
        completedAt: session.completedAt,
      },
      message: 'Checkout session completed successfully',
    });
  }),

  // POST /checkout/sessions/:token/cancel - Cancel checkout session (public endpoint)
  http.post('/api/checkout/sessions/:token/cancel', async ({ params }) => {
    const token = params.token as string;

    // Simulate network latency
    const latency = parseInt(localStorage.getItem('mockLatency') || '0');
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    const session = checkoutSessions.get(token);
    if (!session) {
      return HttpResponse.json({
        type: 'https://globapay.com/problems/not-found',
        title: 'Checkout Session Not Found',
        status: 404,
        detail: 'Checkout session not found',
        instance: `/checkout/sessions/${token}/cancel`,
      }, { status: 404 });
    }

    // Cancel session
    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();

    checkoutSessions.set(token, session);

    return HttpResponse.json({
      data: {
        id: session.id,
        status: session.status,
      },
      message: 'Checkout session cancelled successfully',
    });
  }),
];