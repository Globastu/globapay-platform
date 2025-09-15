'use client';

import { Control, Controller, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductDetailsSectionProps {
  control: Control<FieldValues>;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export function ProductDetailsSection({ control }: ProductDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Details</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure the product information for your checkout
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Controller
            name="productDetails.name"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <Input
                  id="productName"
                  placeholder="Enter product name"
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

        <div className="space-y-2">
          <Label htmlFor="productDescription">Description (Optional)</Label>
          <Controller
            name="productDetails.description"
            control={control}
            render={({ field }) => (
              <Input
                id="productDescription"
                placeholder="Enter product description"
                {...field}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Controller
              name="productDetails.amount"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    min="1"
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Amount in minor units (e.g., cents)</p>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Controller
              name="productDetails.currency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}