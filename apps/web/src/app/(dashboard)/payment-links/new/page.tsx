'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@globapay/ui';

interface CreatePaymentLinkData {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  reference?: string;
  expiresInDays?: number;
  metadata?: Record<string, string>;
}

export default function NewPaymentLinkPage(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatePaymentLinkData>({
    amount: 0,
    currency: 'USD',
    description: '',
    customerEmail: '',
    customerName: '',
    reference: '',
    expiresInDays: 7,
    metadata: {},
  });

  const [metadataFields, setMetadataFields] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  const handleInputChange = (field: keyof CreatePaymentLinkData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...metadataFields];
    if (newFields[index]) {
      newFields[index][field] = value;
    }
    setMetadataFields(newFields);
    
    // Update formData metadata
    const metadata: Record<string, string> = {};
    newFields.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        metadata[key.trim()] = value.trim();
      }
    });
    setFormData(prev => ({ ...prev, metadata }));
  };

  const addMetadataField = () => {
    setMetadataFields(prev => [...prev, { key: '', value: '' }]);
  };

  const removeMetadataField = (index: number) => {
    if (metadataFields.length > 1) {
      const newFields = metadataFields.filter((_, i) => i !== index);
      setMetadataFields(newFields);
      
      // Update formData metadata
      const metadata: Record<string, string> = {};
      newFields.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          metadata[key.trim()] = value.trim();
        }
      });
      setFormData(prev => ({ ...prev, metadata }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (formData.customerEmail && !isValidEmail(formData.customerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        ...formData,
        amount: Math.round(formData.amount * 100), // Convert to cents
        // Only include optional fields if they have values
        ...(formData.customerEmail?.trim() && { customerEmail: formData.customerEmail.trim() }),
        ...(formData.customerName?.trim() && { customerName: formData.customerName.trim() }),
        ...(formData.reference?.trim() && { reference: formData.reference.trim() }),
        ...(formData.expiresInDays !== 7 && { expiresInDays: formData.expiresInDays }),
        ...(Object.keys(formData.metadata || {}).length > 0 && { metadata: formData.metadata }),
      };

      // Remove undefined fields
      Object.keys(requestData).forEach(key => {
        if (requestData[key as keyof typeof requestData] === undefined) {
          delete requestData[key as keyof typeof requestData];
        }
      });

      const response = await apiClient.createPaymentLink(requestData);
      
      // In mock mode, show optimistic success
      if (apiClient.isMockMode()) {
        // Show immediate success feedback
        router.push('/payment-links?created=true');
      } else {
        // Wait for real API response
        router.push('/payment-links');
      }
    } catch (err) {
      console.error('Failed to create payment link:', err);
      
      try {
        const errorData = JSON.parse((err as Error).message);
        if (errorData.errors) {
          // Show validation errors
          const errorMessages = Object.values(errorData.errors).flat().join(', ');
          setError(errorMessages);
        } else {
          setError(errorData.detail || 'Failed to create payment link. Please try again.');
        }
      } catch {
        setError('Failed to create payment link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatAmountDisplay = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/payment-links" className="hover:text-gray-700">
            Payment Links
          </Link>
          <span>/</span>
          <span>Create New</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Payment Link</h1>
        <p className="text-sm text-gray-600">
          Create a secure payment link to share with your customers
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Payment Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <select
                id="currency"
                required
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              required
              maxLength={1000}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What is this payment for?"
            />
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <input
              type="text"
              id="reference"
              maxLength={255}
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Internal reference (e.g., invoice number)"
            />
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                maxLength={255}
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Customer's full name"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="customer@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email will receive payment link and notifications
              </p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          
          <div>
            <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-1">
              Expires In
            </label>
            <select
              id="expiresInDays"
              value={formData.expiresInDays}
              onChange={(e) => handleInputChange('expiresInDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days (default)</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Metadata</h3>
            <button
              type="button"
              onClick={addMetadataField}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Field
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Add custom key-value pairs for internal tracking
          </p>
          
          {metadataFields.map((field, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={field.key}
                  onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => removeMetadataField(index)}
                  disabled={metadataFields.length === 1}
                  className="w-full px-3 py-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link href="/payment-links">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Payment Link'}
          </Button>
        </div>
      </form>

      {/* Preview */}
      {formData.amount > 0 && formData.description && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Amount:</span>
              <span className="font-medium text-blue-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency,
                }).format(formData.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Description:</span>
              <span className="font-medium text-blue-900">{formData.description}</span>
            </div>
            {formData.customerName && (
              <div className="flex justify-between">
                <span className="text-blue-700">Customer:</span>
                <span className="font-medium text-blue-900">{formData.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-blue-700">Expires:</span>
              <span className="font-medium text-blue-900">
                {formData.expiresInDays} day{formData.expiresInDays !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}