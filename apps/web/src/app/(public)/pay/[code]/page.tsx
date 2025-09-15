'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StubCheckout } from '@/components/checkout/StubCheckout';
import type { PaymentLink, CheckoutSession, PaymentResult } from '@/types/api';

interface PaymentPageState {
  paymentLink: PaymentLink | null;
  checkoutSession: CheckoutSession | null;
  loading: boolean;
  error: string | null;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [state, setState] = useState<PaymentPageState>({
    paymentLink: null,
    checkoutSession: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!code) {
      setState(prev => ({ ...prev, error: 'Invalid payment code', loading: false }));
      return;
    }

    loadPaymentLink();
  }, [code]);

  const loadPaymentLink = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check if we're in mock mode
      const isMockMode = process.env.NEXT_PUBLIC_MOCK === '1';

      if (isMockMode) {
        // In mock mode, simulate the lookup and session creation
        const mockPaymentLink: PaymentLink = {
          id: `pl_${Math.random().toString(36).substr(2, 9)}`,
          shortCode: code.toUpperCase(),
          merchantId: 'merchant_mock',
          amount: 2500, // $25.00
          currency: 'USD',
          description: 'Medical Consultation Payment',
          customerEmail: 'patient@example.com',
          customerName: 'John Doe',
          status: 'pending',
          paymentUrl: `https://pay.globapay.com/link/${code}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockCheckoutSession: CheckoutSession = {
          id: `cs_${Math.random().toString(36).substr(2, 9)}`,
          token: Math.random().toString(36).substr(2, 64),
          paymentLinkId: mockPaymentLink.id,
          merchantId: mockPaymentLink.merchantId,
          amount: mockPaymentLink.amount,
          currency: mockPaymentLink.currency,
          description: mockPaymentLink.description,
          ...(mockPaymentLink.customerEmail && { customerEmail: mockPaymentLink.customerEmail }),
          ...(mockPaymentLink.customerName && { customerName: mockPaymentLink.customerName }),
          status: 'active',
          checkoutUrl: `https://checkout.globapay.com/session/${Math.random().toString(36).substr(2, 64)}`,
          require3DS: mockPaymentLink.amount > 3000, // 3DS for amounts > $30
          skipFraudCheck: false,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setState({
          paymentLink: mockPaymentLink,
          checkoutSession: mockCheckoutSession,
          loading: false,
          error: null,
        });
        return;
      }

      // Real API calls
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

      // 1. Look up payment link by short code
      const paymentLinkResponse = await fetch(`${apiBaseUrl}/payment-links/code/${code}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!paymentLinkResponse.ok) {
        if (paymentLinkResponse.status === 404) {
          throw new Error('Payment link not found or has expired');
        }
        throw new Error('Failed to load payment link');
      }

      const paymentLinkData = await paymentLinkResponse.json();
      const paymentLink: PaymentLink = paymentLinkData.data;

      // 2. Create checkout session
      const checkoutResponse = await fetch(`${apiBaseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Note: This would typically include authentication headers
          // For public payment pages, we might use a different endpoint or token
        },
        body: JSON.stringify({
          paymentLinkId: paymentLink.id,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const checkoutData = await checkoutResponse.json();
      const checkoutSession: CheckoutSession = checkoutData.data;

      setState({
        paymentLink,
        checkoutSession,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load payment:', error);
      setState({
        paymentLink: null,
        checkoutSession: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handlePaymentAuthorized = (result: PaymentResult) => {
    console.log('Payment authorized:', result);
    
    // Redirect to success page with transaction details
    const successParams = new URLSearchParams({
      session_id: state.checkoutSession?.id || '',
      transaction_id: result.transactionId || '',
      amount: state.checkoutSession?.amount.toString() || '',
      currency: state.checkoutSession?.currency || '',
    });

    router.push(`/pay/success?${successParams.toString()}`);
  };

  const handlePaymentFailed = (result: PaymentResult) => {
    console.log('Payment failed:', result);
    
    // Redirect to failure page with error details
    const errorParams = new URLSearchParams({
      session_id: state.checkoutSession?.id || '',
      error: result.errorCode || 'payment_failed',
      message: result.errorMessage || 'Payment could not be processed',
    });

    router.push(`/pay/error?${errorParams.toString()}`);
  };

  const handleCancel = () => {
    // Redirect back to payment link or cancel page
    if (state.checkoutSession?.cancelUrl) {
      window.location.href = state.checkoutSession.cancelUrl;
    } else {
      router.push('/');
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Return to home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state.paymentLink || !state.checkoutSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Payment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Secure payment powered by Globapay
            </p>
          </div>

          <StubCheckout
            session={state.checkoutSession}
            onPaymentAuthorized={handlePaymentAuthorized}
            onPaymentFailed={handlePaymentFailed}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}