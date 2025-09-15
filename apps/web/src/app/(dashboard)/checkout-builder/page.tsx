'use client';

import { useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Code } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductDetailsSection } from '@/components/checkout-builder/ProductDetailsSection';
import { PaymentOptionsSection } from '@/components/checkout-builder/PaymentOptionsSection';
import { RedirectsBrandingSection } from '@/components/checkout-builder/RedirectsBrandingSection';
import { CheckoutBuilderFormSchema } from '@/lib/contracts/checkout-builder';

export default function CheckoutBuilderPage() {
  const form = useForm<FieldValues>({
    defaultValues: {
      productDetails: {
        name: '',
        description: '',
        amount: 0,
        currency: 'USD',
      },
      paymentOptions: {
        type: 'one_time',
        methods: ['card'],
        require3DS: false,
        skipFraudCheck: false,
      },
      redirectsBranding: {
        successUrl: '',
        cancelUrl: '',
        theme: 'light',
        customCss: '',
      },
    },
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure and generate embeddable checkout widgets
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Details Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <ProductDetailsSection control={form.control} />
        </div>

        {/* Payment Options Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <PaymentOptionsSection control={form.control} />
        </div>

        {/* Redirects & Branding Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <RedirectsBrandingSection control={form.control} />
        </div>
      </form>
    </div>
  );
}