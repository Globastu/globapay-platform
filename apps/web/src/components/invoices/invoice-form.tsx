'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator, Save, ArrowLeft } from 'lucide-react';
import { CreateInvoiceInput, InvoiceItem, Invoice } from '@/lib/contracts/invoices';
import { calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { apiPost, apiPatch } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InvoiceFormProps {
  invoice?: Invoice;
  isEditing?: boolean;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount / 100);
}

export function InvoiceForm({ invoice, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [merchantId, setMerchantId] = useState(invoice?.merchantId || '');
  const [customerId, setCustomerId] = useState(invoice?.customerId || '');
  const [currency, setCurrency] = useState(invoice?.currency || 'EUR');
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate 
      ? new Date(invoice.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  );
  const [memo, setMemo] = useState(invoice?.memo || '');
  const [footer, setFooter] = useState(invoice?.footer || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length 
      ? invoice.items 
      : [{ description: '', quantity: 1, unitAmount: 0 }]
  );

  // Calculate totals
  const totals = calculateInvoiceTotals(items);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitAmount: 0 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData: CreateInvoiceInput = {
        merchantId: merchantId || 'merchant_default',
        currency,
        customerId: customerId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        memo: memo || undefined,
        footer: footer || undefined,
        items: items.filter(item => item.description.trim() && item.quantity > 0),
      };

      if (isEditing && invoice?.id) {
        await apiPatch(`/api/invoices/${invoice.id}`, formData);
        router.push(`/invoices/${invoice.id}`);
      } else {
        const newInvoice = await apiPost<Invoice>('/api/invoices', formData);
        router.push(`/invoices/${newInvoice.id}`);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [merchantId, currency, customerId, dueDate, memo, footer, items, isEditing, invoice?.id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? `Edit Invoice ${invoice?.number}` : 'Create Invoice'}
            </h1>
            {invoice?.status && (
              <div className="mt-1">
                <Badge variant="secondary">{invoice.status}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Merchant ID</label>
              <Input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="merchant_12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer ID</label>
              <Input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="customer_12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-end space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Product or service description"
                    required
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium mb-2">Unit Amount ({currency})</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitAmount / 100}
                    onChange={(e) => updateItem(index, 'unitAmount', Math.round(parseFloat(e.target.value || '0') * 100))}
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium mb-2">Total</label>
                  <div className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center text-sm">
                    {formatCurrency(item.quantity * item.unitAmount, currency)}
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Memo</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Internal notes or payment terms"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Footer</label>
              <Textarea
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Thank you for your business!"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(totals.discountTotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(totals.taxTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {/* Recalculate button for real-time server calculations */}
            <Button type="button" variant="outline" size="sm">
              <Calculator className="h-4 w-4 mr-2" />
              Recalculate
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/invoices">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}