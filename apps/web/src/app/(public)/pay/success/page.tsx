'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseInt(amount) / 100; // Convert from cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(numAmount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Your payment has been processed successfully.
              </p>
              
              {amount && currency && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(amount, currency)}
                  </p>
                </div>
              )}

              {transactionId && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {transactionId}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-4">
                  A confirmation email has been sent to you.
                </p>
                
                <Button 
                  onClick={() => window.close()}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Close Window
                </Button>
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