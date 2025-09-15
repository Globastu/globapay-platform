'use client';

import { Control, Controller, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckoutConfigSectionProps {
  control: Control<FieldValues>;
}

export function CheckoutConfigSection({ control }: CheckoutConfigSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Checkout Configuration</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure post-payment redirects and checkout appearance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Redirect URLs */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="successUrl">Success URL</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Where to redirect customers after successful payment
            </p>
            <Controller
              name="checkoutConfig.successUrl"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    id="successUrl"
                    type="url"
                    placeholder="https://yoursite.com/success"
                    {...field}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div>
            <Label htmlFor="cancelUrl">Cancel URL</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Where to redirect customers if they cancel the payment
            </p>
            <Controller
              name="checkoutConfig.cancelUrl"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    id="cancelUrl"
                    type="url"
                    placeholder="https://yoursite.com/cancel"
                    {...field}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Choose the appearance theme for your checkout
          </p>
          <Controller
            name="checkoutConfig.theme"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Theme</SelectItem>
                  <SelectItem value="dark">Dark Theme</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Custom CSS */}
        <div className="space-y-2">
          <Label htmlFor="customCss">Custom CSS (Optional)</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Add custom CSS to style your checkout widget
          </p>
          <Controller
            name="checkoutConfig.customCss"
            control={control}
            render={({ field }) => (
              <textarea
                id="customCss"
                rows={6}
                placeholder=".checkout-widget { border-radius: 12px; }"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                {...field}
              />
            )}
          />
          <p className="text-xs text-gray-400">
            CSS will be injected into the checkout iframe for custom styling
          </p>
        </div>

        {/* Preview Note */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Preview Available
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Once you fill in the required fields above, you&apos;ll see a live preview of your checkout widget in the next section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}