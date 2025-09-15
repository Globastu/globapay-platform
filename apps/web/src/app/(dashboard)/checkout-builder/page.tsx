'use client';

import { useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Code } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentOptionsSection } from '@/components/checkout-builder/PaymentOptionsSection';
import { CheckoutConfigSection } from '@/components/checkout-builder/RedirectsBrandingSection';
import { CheckoutPreview } from '@/components/checkout-builder/CheckoutPreview';
import { CheckoutBuilderFormSchema } from '@/lib/contracts/checkout-builder';

export default function CheckoutBuilderPage() {
  const form = useForm<FieldValues>({
    defaultValues: {
      paymentOptions: {
        methods: ['card'],
        require3DS: false,
        skipFraudCheck: false,
      },
      checkoutConfig: {
        successUrl: '',
        cancelUrl: '',
        theme: 'light',
        customCss: '',
      },
    },
  });

  const formData = form.watch();

  const onSubmit = (data: FieldValues) => {
    console.log('Form data:', data);
  };

  // Check if checkout builder feature is enabled
  if (process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== '1') {
    return (
      <EmptyState
        icon={<Code className="h-12 w-12" />}
        title="Enable Checkout Builder"
        description="The checkout builder feature is currently disabled. Please contact your administrator to enable it."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure payment methods and generate embeddable checkout widgets
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section - Left Column */}
        <div className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Options Section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <PaymentOptionsSection control={form.control} />
            </div>

            {/* Checkout Configuration Section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <CheckoutConfigSection control={form.control} />
            </div>

            {/* Generate Button */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generate Embed Code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generate the HTML embed code for your checkout widget
                </p>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Generate Embed Code
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section - Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 sticky top-6">
            <CheckoutPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}