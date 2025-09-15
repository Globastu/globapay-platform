'use client';

import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldValues } from 'react-hook-form';
import Image from 'next/image';

interface CheckoutPreviewProps {
  formData: FieldValues;
}

export function CheckoutPreview({ formData }: CheckoutPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  const selectedMethods = formData?.paymentOptions?.methods || ['card'];
  const theme = formData?.checkoutConfig?.theme || 'light';
  
  const getPaymentMethodLogo = (method: string) => {
    const logoMap: Record<string, string> = {
      'card': '/providers/visa.svg',
      'apple_pay': '/providers/apple-pay.svg',
      'google_pay': '/providers/google-pay.svg',
      'paypal': '/providers/paypal.svg',
      'bank_transfer': '/providers/ideal.svg',
    };
    return logoMap[method];
  };

  const getPaymentMethodName = (method: string) => {
    const nameMap: Record<string, string> = {
      'card': 'Card',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'paypal': 'PayPal',
      'bank_transfer': 'Bank Transfer',
      'buy_now_pay_later': 'Buy Now Pay Later',
    };
    return nameMap[method] || method;
  };

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <div 
          className={`mx-auto transition-all duration-300 ${
            previewMode === 'mobile' 
              ? 'max-w-sm' 
              : 'max-w-md'
          }`}
        >
          {/* Mock Checkout Widget */}
          <div 
            className={`rounded-lg shadow-lg overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className="font-medium">Complete your purchase</h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Secure checkout powered by Gr4vy
              </p>
            </div>

            {/* Order Summary */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span>Sample Product</span>
                <span className="font-medium">$25.00</span>
              </div>
              <div className={`border-t pt-3 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>$25.00</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className={`p-4 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h5 className="font-medium mb-3">Payment Method</h5>
              <div className="space-y-2">
                {selectedMethods.map((method: string) => {
                  const logo = getPaymentMethodLogo(method);
                  return (
                    <div
                      key={method}
                      className={`flex items-center p-3 rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      } cursor-pointer transition-colors`}
                    >
                      {logo && (
                        <div className="w-8 h-6 relative bg-white rounded border border-gray-200 flex items-center justify-center mr-3">
                          <Image
                            src={logo}
                            alt=""
                            width={24}
                            height={16}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="text-sm">{getPaymentMethodName(method)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mock Form Fields */}
            <div className="p-4 space-y-4">
              {selectedMethods.includes('card') && (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Card Number
                    </label>
                    <div className={`p-3 border rounded ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        •••• •••• •••• ••••
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Expiry
                      </label>
                      <div className={`p-3 border rounded ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          MM/YY
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        CVC
                      </label>
                      <div className={`p-3 border rounded ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          •••
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <Button className="w-full">
                Pay $25.00
              </Button>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t text-center ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Secured by Globapay • Your payment is safe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className={`text-xs rounded p-3 ${
        theme === 'dark' 
          ? 'bg-blue-900/20 text-blue-300' 
          : 'bg-blue-50 text-blue-700'
      }`}>
        This is a live preview of how your checkout will appear to customers. 
        Configure the options on the left to see changes in real-time.
      </div>
    </div>
  );
}