'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  ExternalLink, 
  Send, 
  Copy, 
  FileText, 
  CheckCircle, 
  Clock,
  DollarSign 
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/lib/contracts/invoices';
import { apiPost } from '@/lib/api';
import Link from 'next/link';

interface InvoiceDetailProps {
  invoice: Invoice;
  onInvoiceUpdated?: (invoice: Invoice) => void;
}

function getStatusBadge(status: InvoiceStatus) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'open':
      return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Open</Badge>;
    case 'paid':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
    case 'void':
      return <Badge variant="destructive">Void</Badge>;
    case 'uncollectible':
      return <Badge variant="outline">Uncollectible</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function InvoiceDetail({ invoice, onInvoiceUpdated }: InvoiceDetailProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleOpenInvoice = async () => {
    setIsOpening(true);
    try {
      const updatedInvoice = await apiPost<Invoice>(`/api/invoices/${invoice.id}/open`, {});
      onInvoiceUpdated?.(updatedInvoice);
      alert('Invoice opened successfully! Payment link created.');
    } catch (error) {
      console.error('Failed to open invoice:', error);
      alert('Failed to open invoice. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      await apiPost(`/api/invoices/${invoice.id}/send`, {});
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (invoice.paymentLinkUrl) {
      try {
        await navigator.clipboard.writeText(invoice.paymentLinkUrl);
        alert('Payment link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Failed to copy link. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoice {invoice.number}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            {getStatusBadge(invoice.status)}
            <span className="text-sm text-gray-500">
              Created {formatDate(invoice.createdAt)}
            </span>
            {invoice.dueDate && (
              <span className="text-sm text-gray-500">
                Due {formatDate(invoice.dueDate)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {invoice.status === 'draft' && (
            <>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button 
                onClick={handleOpenInvoice} 
                disabled={isOpening}
                size="sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {isOpening ? 'Opening...' : 'Open'}
              </Button>
            </>
          )}
          
          {invoice.status === 'open' && invoice.paymentLinkUrl && (
            <>
              <Button 
                onClick={handleSendInvoice}
                disabled={isSending}
                variant="outline"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <a 
                href={invoice.paymentLinkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              </a>
            </>
          )}
          
          <Link href={`/invoices/${invoice.id}/preview`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      {invoice.status === 'paid' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Payment Received
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                This invoice has been paid in full.
              </p>
            </div>
          </div>
        </div>
      )}

      {invoice.status === 'open' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Payment Pending
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                This invoice is open and awaiting payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & Payment Info */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Merchant ID</dt>
              <dd className="text-sm text-gray-900 dark:text-white font-mono">{invoice.merchantId}</dd>
            </div>
            {invoice.platformId && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform ID</dt>
                <dd className="text-sm text-gray-900 dark:text-white font-mono">{invoice.platformId}</dd>
              </div>
            )}
            {invoice.customerId && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</dt>
                <dd className="text-sm text-gray-900 dark:text-white font-mono">{invoice.customerId}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{invoice.currency}</dd>
            </div>
          </dl>
        </div>

        {/* Amount Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Amount Summary</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Subtotal</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </dd>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Discount</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  -{formatCurrency(invoice.discountTotal, invoice.currency)}
                </dd>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Tax</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {formatCurrency(invoice.taxTotal, invoice.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <dt className="text-base font-semibold text-gray-900 dark:text-white">Total</dt>
              <dd className="text-base font-semibold text-gray-900 dark:text-white">
                {formatCurrency(invoice.total, invoice.currency)}
              </dd>
            </div>
            {invoice.amountDue !== invoice.total && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-900 dark:text-white">Amount Due</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.amountDue, invoice.currency)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-3">Description</th>
                <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 w-20">Qty</th>
                <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 w-32">Unit Price</th>
                <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.unitAmount, invoice.currency)}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                    {formatCurrency(item.quantity * item.unitAmount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {(invoice.memo || invoice.footer) && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          {invoice.memo && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Memo</h3>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.memo}</p>
            </div>
          )}
          {invoice.footer && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Footer</h3>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.footer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}