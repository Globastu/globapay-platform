'use client';

import { Control, Controller, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentMethod } from '@/lib/contracts/checkout-builder';

interface PaymentOptionsSectionProps {
  control: Control<FieldValues>;
}

const paymentMethods: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'card', label: 'Credit/Debit Cards', description: 'Visa, Mastercard, American Express' },
  { value: 'apple_pay', label: 'Apple Pay', description: 'Quick checkout with Apple Pay' },
  { value: 'google_pay', label: 'Google Pay', description: 'Quick checkout with Google Pay' },
  { value: 'paypal', label: 'PayPal', description: 'Pay with your PayPal account' },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer' },
  { value: 'buy_now_pay_later', label: 'Buy Now Pay Later', description: 'Split payments over time' },
];

export function PaymentOptionsSection({ control }: PaymentOptionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Options</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure payment methods and options for your checkout
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Payment Type */}
        <div className="space-y-2">
          <Label htmlFor="paymentType">Payment Type</Label>
          <Controller
            name="paymentOptions.type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time Payment</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <Label>Payment Methods</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select which payment methods to offer to customers
          </p>
          <Controller
            name="paymentOptions.methods"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox
                      id={method.value}
                      checked={field.value?.includes(method.value) || false}
                      onCheckedChange={(checked) => {
                        const currentMethods = field.value || [];
                        if (checked) {
                          field.onChange([...currentMethods, method.value]);
                        } else {
                          field.onChange(currentMethods.filter((m: PaymentMethod) => m !== method.value));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={method.value}
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                      >
                        {method.label}
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {method.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        </div>

        {/* Security Options */}
        <div className="space-y-3">
          <Label>Security Options</Label>
          <div className="space-y-3">
            <Controller
              name="paymentOptions.require3DS"
              control={control}
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="require3DS"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="require3DS"
                      className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                    >
                      Require 3D Secure
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Force 3D Secure authentication for all transactions
                    </p>
                  </div>
                </div>
              )}
            />

            <Controller
              name="paymentOptions.skipFraudCheck"
              control={control}
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="skipFraudCheck"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="skipFraudCheck"
                      className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                    >
                      Skip Fraud Check
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Bypass fraud detection for faster processing (not recommended for production)
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}