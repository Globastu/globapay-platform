'use client';

import { useState, useEffect } from 'react';
import { Button } from '@globapay/ui';

import type { CheckoutSession, PaymentResult } from '@/types/api';

export interface StubCheckoutProps {
  session: CheckoutSession;
  onPaymentAuthorized?: (result: PaymentResult) => void;
  onPaymentFailed?: (result: PaymentResult) => void;
  onCancel?: () => void;
  className?: string;
}

export function StubCheckout({
  session,
  onPaymentAuthorized,
  onPaymentFailed,
  onCancel,
  className = '',
}: StubCheckoutProps): JSX.Element {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | '3ds' | 'success' | 'error'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    email: session.customerEmail || '',
    // Bank transfer fields
    iban: '',
    accountHolder: '',
  });
  const [error, setError] = useState<string>('');

  // Simulate session expiry
  useEffect(() => {
    const expiryTime = new Date(session.expiresAt).getTime();
    const now = Date.now();
    
    if (expiryTime <= now) {
      setStep('error');
      setError('Payment session has expired');
      return;
    }

    const timeoutId = setTimeout(() => {
      if (step === 'details' || step === 'payment') {
        setStep('error');
        setError('Payment session has expired');
        onPaymentFailed?.({
          success: false,
          errorCode: 'SESSION_EXPIRED',
          errorMessage: 'Payment session has expired',
        });
      }
    }, expiryTime - now);

    return () => clearTimeout(timeoutId);
  }, [session.expiresAt, step, onPaymentFailed]);

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const generateMockTransactionId = (): string => {
    return `tx_mock_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  };

  const simulatePaymentProcessing = async (): Promise<PaymentResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate different payment scenarios based on card number patterns
    const { cardNumber } = formData;
    
    // Test card numbers for different scenarios
    if (cardNumber.startsWith('4000000000000002')) {
      // Declined card
      return {
        success: false,
        errorCode: 'CARD_DECLINED',
        errorMessage: 'Your card was declined. Please try a different payment method.',
      };
    } else if (cardNumber.startsWith('4000000000000028')) {
      // Insufficient funds
      return {
        success: false,
        errorCode: 'INSUFFICIENT_FUNDS',
        errorMessage: 'Insufficient funds on your card.',
      };
    } else if (cardNumber.startsWith('4000000000000036')) {
      // Expired card
      return {
        success: false,
        errorCode: 'CARD_EXPIRED',
        errorMessage: 'Your card has expired.',
      };
    } else if (cardNumber.startsWith('4000000000000077')) {
      // Invalid CVV
      return {
        success: false,
        errorCode: 'INVALID_CVV',
        errorMessage: 'Invalid security code.',
      };
    }

    // Default to success
    return {
      success: true,
      transactionId: generateMockTransactionId(),
    };
  };

  const simulate3DSChallenge = async (): Promise<boolean> => {
    // Simulate 3DS challenge delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // 90% success rate for 3DS
    return Math.random() > 0.1;
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Validate form data
      if (paymentMethod === 'card') {
        if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvv) {
          setError('Please fill in all card details');
          setProcessing(false);
          return;
        }
      } else if (paymentMethod === 'bank_transfer') {
        if (!formData.iban || !formData.accountHolder) {
          setError('Please fill in all bank details');
          setProcessing(false);
          return;
        }
      }

      setStep('payment');

      // Simulate payment processing
      const result = await simulatePaymentProcessing();

      if (!result.success) {
        setStep('error');
        setError(result.error?.message || 'Payment failed');
        onPaymentFailed?.(result);
        setProcessing(false);
        return;
      }

      // Check if 3DS is required
      if (session.require3DS && paymentMethod === 'card') {
        setStep('3ds');
        
        const threeDSSuccess = await simulate3DSChallenge();
        
        if (!threeDSSuccess) {
          const threeDSResult: PaymentResult = {
            success: false,
            errorCode: '3DS_FAILED',
            errorMessage: '3D Secure authentication failed',
          };
          setStep('error');
          setError(threeDSResult.errorMessage!);
          onPaymentFailed?.(threeDSResult);
          setProcessing(false);
          return;
        }
      }

      // Payment successful
      setStep('success');
      onPaymentAuthorized?.(result);
      setProcessing(false);
    } catch (err) {
      const errorResult: PaymentResult = {
        success: false,
        errorCode: 'PROCESSING_ERROR',
        errorMessage: 'An error occurred while processing your payment',
      };
      setStep('error');
      setError(errorResult.errorMessage!);
      onPaymentFailed?.(errorResult);
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleRetry = () => {
    setStep('details');
    setError('');
    setProcessing(false);
  };

  // Details step
  if (step === 'details') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto ${className}`}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <p className="text-sm text-gray-600 mt-1">{session.description}</p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatAmount(session.amount, session.currency)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 border rounded-lg text-center ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              💳 Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-3 border rounded-lg text-center ${
                paymentMethod === 'bank_transfer'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              🏦 Bank
            </button>
          </div>
        </div>

        {paymentMethod === 'card' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={formData.cardNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  setFormData({ ...formData, cardNumber: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  id="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  id="expiryYear"
                  value={formData.expiryYear}
                  onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">YY</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={String(year).slice(-2)}>
                        {String(year).slice(-2)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  value={formData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, cvv: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                id="holderName"
                placeholder="John Doe"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                id="iban"
                placeholder="GB29 NWBK 6016 1331 9268 19"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder
              </label>
              <input
                type="text"
                id="accountHolder"
                placeholder="John Doe"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button
            onClick={handlePayment}
            disabled={processing}
            className="w-full"
          >
            {processing ? 'Processing...' : `Pay ${formatAmount(session.amount, session.currency)}`}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={processing}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Test Mode - Use test card numbers</p>
          <p className="mt-1">
            Success: 4242424242424242 • Decline: 4000000000000002
          </p>
        </div>
      </div>
    );
  }

  // Processing step
  if (step === 'payment') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h3 className="text-lg font-medium text-gray-900 mt-4">Processing Payment</h3>
        <p className="text-sm text-gray-600 mt-2">Please wait while we process your payment...</p>
      </div>
    );
  }

  // 3DS Challenge step
  if (step === '3ds') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900">3D Secure Authentication</h3>
        <p className="text-sm text-gray-600 mt-2">
          Authenticating your payment with your bank...
        </p>
        <div className="mt-4">
          <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
        </div>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Payment Successful!</h3>
        <p className="text-sm text-gray-600 mt-2">
          Your payment of {formatAmount(session.amount, session.currency)} has been processed successfully.
        </p>
      </div>
    );
  }

  // Error step
  if (step === 'error') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center ${className}`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Payment Failed</h3>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        
        <div className="mt-6 space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={handleCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return <div></div>;
}