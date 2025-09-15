'use client';

import { Invoice } from '@/lib/contracts/invoices';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  ExternalLink, 
  Copy,
  Clock,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { customers } from '../../../mocks/fixtures/invoices';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoiceDetailView({ invoice, onClose }: InvoiceDetailViewProps) {
  // Find customer data
  const customer = customers.find(c => c.id === invoice.customerId);

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if invoice is overdue
  const isOverdue = () => {
    if (invoice.status !== 'open') return false;
    return new Date(invoice.dueDate) < new Date();
  };

  // Days until/past due
  const getDaysUntilDue = () => {
    const today = new Date();
    const due = new Date(invoice.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getStatusColor = () => {
    switch (invoice.status) {
      case 'paid': return 'text-green-600 dark:text-green-400';
      case 'open': return isOverdue() ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400';
      case 'draft': return 'text-gray-600 dark:text-gray-400';
      case 'void': return 'text-gray-600 dark:text-gray-400';
      case 'uncollectible': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (invoice.status) {
      case 'paid': return <CheckCircle className="h-5 w-5" />;
      case 'open': return isOverdue() ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />;
      case 'draft': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invoice {invoice.number}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getDaysUntilDue()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'open' ? 'secondary' : 'outline'}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Customer</h3>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {customer?.name || 'Unknown Customer'}
                  </p>
                  {customer?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">ID: {invoice.customerId}</p>
                </div>
              </Card>

              {/* Invoice Items */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Invoice Items</h3>
                <div className="space-y-3">
                  {invoice.items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} × {formatCurrency(item.unitAmount, invoice.currency)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.quantity * item.unitAmount, invoice.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </span>
                  </div>
                  {invoice.taxTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(invoice.taxTotal, invoice.currency)}
                      </span>
                    </div>
                  )}
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="text-gray-900 dark:text-white">
                        -{formatCurrency(invoice.discountTotal, invoice.currency)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                  {invoice.amountDue !== invoice.total && (
                    <div className="flex justify-between font-medium text-lg text-red-600 dark:text-red-400">
                      <span>Amount Due</span>
                      <span>{formatCurrency(invoice.amountDue, invoice.currency)}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment Link */}
              {invoice.paymentLinkUrl && (
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Payment Link</h3>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <code className="flex-1 text-sm text-gray-700 dark:text-gray-300 break-all">
                      {invoice.paymentLinkUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(invoice.paymentLinkUrl!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.paymentLinkUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {(invoice.memo || invoice.footer) && (
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Notes</h3>
                  <div className="space-y-2">
                    {invoice.memo && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Memo</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.memo}</p>
                      </div>
                    )}
                    {invoice.footer && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Footer</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.footer}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Details */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Due Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Currency</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateTime(invoice.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateTime(invoice.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Invoice Events Timeline */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Invoice Events</h3>
                <div className="space-y-3">
                  {/* Created Event */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Invoice Created</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDateTime(invoice.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Sent Event (for non-draft invoices) */}
                  {invoice.status !== 'draft' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Invoice Sent</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {/* Simulate sent time as a few minutes after creation */}
                          {formatDateTime(new Date(new Date(invoice.createdAt).getTime() + 5 * 60 * 1000).toISOString())}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Opened Event (for open/paid invoices) */}
                  {(invoice.status === 'open' || invoice.status === 'paid') && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Invoice Opened</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {/* Simulate opened time as a few hours after sending */}
                          {formatDateTime(new Date(new Date(invoice.createdAt).getTime() + 3 * 60 * 60 * 1000).toISOString())}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reminded Events (for overdue invoices) */}
                  {isOverdue() && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Reminder Sent</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {/* Simulate reminder 3 days before due */}
                            {formatDateTime(new Date(new Date(invoice.dueDate).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Final Notice Sent</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {/* Simulate final notice 1 day after due */}
                            {formatDateTime(new Date(new Date(invoice.dueDate).getTime() + 1 * 24 * 60 * 60 * 1000).toISOString())}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Payment Event (for paid invoices) */}
                  {invoice.status === 'paid' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Received</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDateTime(invoice.updatedAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Voided Event */}
                  {invoice.status === 'void' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Invoice Voided</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDateTime(invoice.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Uncollectible Event */}
                  {invoice.status === 'uncollectible' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Marked Uncollectible</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDateTime(invoice.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  {invoice.status === 'draft' && (
                    <>
                      <Button className="w-full">Send Invoice</Button>
                      <Button variant="outline" className="w-full">Edit Invoice</Button>
                    </>
                  )}
                  {invoice.status === 'open' && (
                    <>
                      <Button className="w-full">Mark as Paid</Button>
                      <Button variant="outline" className="w-full">Send Reminder</Button>
                      <Button variant="outline" className="w-full">Edit Invoice</Button>
                    </>
                  )}
                  {invoice.status === 'paid' && (
                    <>
                      <Button variant="outline" className="w-full">Download Receipt</Button>
                      <Button variant="outline" className="w-full">Refund</Button>
                    </>
                  )}
                  <Button variant="ghost" className="w-full">Download PDF</Button>
                  <Button variant="ghost" className="w-full text-red-600 hover:text-red-700">
                    Void Invoice
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}