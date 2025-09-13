'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionId = searchParams.get('session_id');
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'insufficient_funds':
        return 'Insufficient funds. Please check your account balance or try a different card.';
      case 'expired_card':
        return 'Your card has expired. Please use a different payment method.';
      case 'invalid_card':
        return 'Invalid card details. Please check your card information and try again.';
      case 'processing_error':
        return 'There was an error processing your payment. Please try again.';
      case 'session_expired':
        return 'Your payment session has expired. Please start a new payment.';
      case '3ds_failed':
        return '3D Secure authentication failed. Please try again.';
      default:
        return message || 'An unexpected error occurred while processing your payment.';
    }
  };

  const canRetry = error && !['session_expired', 'invalid_session'].includes(error);

  const handleRetry = () => {
    // Go back to the previous page to retry payment
    router.back();
  };

  const handleNewPayment = () => {
    // Close window or redirect to home
    if (window.opener) {
      window.close();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Payment Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {getErrorMessage(error || 'payment_failed')}
                </AlertDescription>
              </Alert>

              {error && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-500 mb-1">Error Code</p>
                  <p className="font-mono text-sm text-gray-900">
                    {error}
                  </p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                {canRetry && (
                  <Button 
                    onClick={handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <Button 
                  onClick={handleNewPayment}
                  className="w-full"
                  variant={canRetry ? "outline" : "default"}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {window.opener ? 'Close Window' : 'Return to Home'}
                </Button>
              </div>

              <div className="text-sm text-gray-500 pt-2">
                If you continue to experience issues, please contact support.
              </div>

              <div className="text-xs text-gray-400 pt-2">
                Powered by Globapay
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}