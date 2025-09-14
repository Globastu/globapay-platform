'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown,
  CreditCard,
  Shield,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  Database,
} from 'lucide-react';
import type { Transaction, TransactionTimeline, RouteInfo } from '@/types/transactions';
import { RefundModal } from './RefundModal';

interface TransactionDetailDrawerProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
  onRefund?: (amount: number, reason?: string) => Promise<void>;
}

export function TransactionDetailDrawer({
  transaction,
  open,
  onClose,
  onRefund,
}: TransactionDetailDrawerProps) {
  const [timeline, setTimeline] = useState<TransactionTimeline[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      loadTransactionDetails();
    }
  }, [open, transaction]);

  const loadTransactionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`);
      if (response.ok) {
        const data = await response.json();
        generateTimeline(data.data);
        generateRouteInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to load transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeline = (txn: Transaction) => {
    const events: TransactionTimeline[] = [];

    // Transaction created
    events.push({
      event: 'Transaction Created',
      status: 'completed',
      timestamp: txn.createdAt,
      description: `Transaction initiated for ${formatAmount(txn.amount, txn.currency)}`,
      metadata: {
        paymentMethod: txn.paymentMethodType,
        require3DS: txn.require3DS,
      },
    });

    // 3DS Authentication (if required)
    if (txn.require3DS) {
      events.push({
        event: '3D Secure Authentication',
        status: txn.threeDSStatus === '3ds_authenticated' ? 'completed' : 
               txn.threeDSStatus === '3ds_failed' ? 'failed' : 'pending',
        timestamp: txn.createdAt, // In real scenario, this would be separate timestamp
        description: txn.threeDSStatus === '3ds_authenticated' 
          ? 'Customer successfully completed 3D Secure authentication'
          : txn.threeDSStatus === '3ds_failed'
          ? '3D Secure authentication failed'
          : '3D Secure authentication in progress',
      });
    }

    // Fraud Check
    if (txn.fraudScore !== null && txn.fraudScore !== undefined) {
      const riskLevel = txn.fraudScore > 70 ? 'high' : txn.fraudScore > 30 ? 'medium' : 'low';
      events.push({
        event: 'Fraud Assessment',
        status: riskLevel === 'high' ? 'failed' : 'completed',
        timestamp: txn.createdAt,
        description: `Fraud risk assessed as ${riskLevel} (score: ${txn.fraudScore}/100)`,
        metadata: { fraudScore: txn.fraudScore, riskLevel },
      });
    }

    // Payment Processing
    events.push({
      event: 'Payment Processing',
      status: txn.status === 'completed' ? 'completed' : 
             txn.status === 'failed' ? 'failed' : 'pending',
      timestamp: txn.completedAt || txn.updatedAt,
      description: txn.status === 'completed' 
        ? 'Payment successfully processed by payment provider'
        : txn.status === 'failed'
        ? `Payment failed: ${txn.failureMessage || 'Unknown error'}`
        : 'Payment processing in progress',
      metadata: {
        processorTransactionId: txn.processorTransactionId,
        failureCode: txn.failureCode,
      },
    });

    // Refunds
    if (txn.refunds && txn.refunds.length > 0) {
      txn.refunds.forEach(refund => {
        events.push({
          event: 'Refund Processed',
          status: refund.status === 'completed' ? 'completed' : 
                 refund.status === 'failed' ? 'failed' : 'pending',
          timestamp: refund.completedAt || refund.createdAt,
          description: `${refund.status === 'completed' ? 'Refunded' : 'Refund requested'} ${formatAmount(refund.amount, refund.currency)}${refund.reason ? ` - ${refund.reason}` : ''}`,
          metadata: { refundId: refund.id, amount: refund.amount },
        });
      });
    }

    setTimeline(events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  };

  const generateRouteInfo = (txn: Transaction) => {
    const routes: RouteInfo[] = [];

    // Customer → Globapay
    routes.push({
      id: 'customer-globapay',
      name: 'Customer → Globapay',
      status: 'success',
      timestamp: txn.createdAt,
      duration: 150,
      details: {
        method: txn.paymentMethodType,
        amount: formatAmount(txn.amount, txn.currency),
        customerLocation: 'United States', // Mock data
      },
    });

    // Globapay → Fraud Check
    if (txn.fraudScore !== null && txn.fraudScore !== undefined) {
      routes.push({
        id: 'fraud-check',
        name: 'Fraud Detection',
        status: txn.fraudScore > 70 ? 'failed' : 'success',
        timestamp: txn.createdAt,
        duration: 300,
        details: {
          provider: 'Fraud Shield AI',
          score: `${txn.fraudScore}/100`,
          riskLevel: txn.fraudScore > 70 ? 'High' : txn.fraudScore > 30 ? 'Medium' : 'Low',
        },
      });
    }

    // Globapay → Payment Processor
    routes.push({
      id: 'payment-processor',
      name: 'Payment Processor',
      status: txn.status === 'completed' ? 'success' : 
             txn.status === 'failed' ? 'failed' : 'pending',
      timestamp: txn.createdAt,
      duration: 2000,
      details: {
        processor: 'Stripe', // Mock
        processorId: txn.processorTransactionId,
        networkFee: '$0.30', // Mock
      },
    });

    // 3DS Provider (if required)
    if (txn.require3DS) {
      routes.push({
        id: '3ds-provider',
        name: '3D Secure Provider',
        status: txn.threeDSStatus === '3ds_authenticated' ? 'success' : 
               txn.threeDSStatus === '3ds_failed' ? 'failed' : 'pending',
        timestamp: txn.createdAt,
        duration: 15000,
        details: {
          provider: '3DS Server v2.2',
          challenge: txn.threeDSStatus === '3ds_authenticated' ? 'Passed' : 'Failed',
          version: '2.2.0',
        },
      });
    }

    setRouteInfo(routes);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const canRefund = transaction.status === 'completed' && 
    (!transaction.refundedAmount || transaction.refundedAmount < transaction.amount);

  const handleRefund = async (amount: number, reason?: string) => {
    if (onRefund) {
      await onRefund(amount, reason);
      setShowRefundModal(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-none overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                Transaction Details
                {getStatusIcon(transaction.status)}
              </SheetTitle>
              <SheetDescription>
                View comprehensive transaction information and processing history
              </SheetDescription>
            </div>
            {canRefund && (
              <Button onClick={() => setShowRefundModal(true)} variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Refund
              </Button>
            )}
          </div>

          {/* Transaction Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-mono text-sm">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Amount</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                  {transaction.refundedAmount && transaction.refundedAmount > 0 && (
                    <p className="text-sm text-red-600">
                      -{formatAmount(transaction.refundedAmount, transaction.currency)} refunded
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    <Badge variant={transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'failed' ? 'destructive' : 'outline'}>
                      {transaction.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="routing">Route</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                    <p>{transaction.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <p>{transaction.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">{transaction.paymentMethodType || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Reference</p>
                    <p className="font-mono text-sm">{transaction.reference || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">3D Secure</p>
                      <div className="flex items-center gap-2">
                        {transaction.require3DS ? (
                          <>
                            <Badge variant={transaction.threeDSStatus === '3ds_authenticated' ? 'default' : 'destructive'}>
                              {transaction.threeDSStatus === '3ds_authenticated' ? 'Authenticated' : 
                               transaction.threeDSStatus === '3ds_failed' ? 'Failed' : 'Pending'}
                            </Badge>
                            <span className="text-sm text-gray-600">Required</span>
                          </>
                        ) : (
                          <Badge variant="secondary">Not Required</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Fraud Score</p>
                      {transaction.fraudScore !== null && transaction.fraudScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                transaction.fraudScore > 70 ? 'bg-red-500' :
                                transaction.fraudScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${transaction.fraudScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{transaction.fraudScore}/100</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not assessed</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Fees & Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Processing Fees</p>
                      {transaction.fees && transaction.fees.length > 0 ? (
                        <div className="space-y-1">
                          {transaction.fees.map(fee => (
                            <div key={fee.id} className="flex justify-between text-sm">
                              <span>{fee.description}</span>
                              <span>{formatAmount(fee.amount, fee.currency)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No fees recorded</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Refunds</p>
                      {transaction.refunds && transaction.refunds.length > 0 ? (
                        <div className="space-y-2">
                          {transaction.refunds.map(refund => (
                            <div key={refund.id} className="p-2 bg-gray-50 rounded text-sm">
                              <div className="flex justify-between items-center">
                                <span>{formatAmount(refund.amount, refund.currency)}</span>
                                <Badge variant={refund.status === 'completed' ? 'default' : 'outline'}>
                                  {refund.status}
                                </Badge>
                              </div>
                              {refund.reason && (
                                <p className="text-gray-600 mt-1">{refund.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No refunds</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Link Info */}
              {transaction.paymentLink && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Short Code</p>
                        <Badge variant="outline" className="font-mono">
                          {transaction.paymentLink.shortCode}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                        <p>{transaction.paymentLink.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.paymentLink?.id || '')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {getStatusIcon(event.status)}
                          {index < timeline.length - 1 && (
                            <div className="w-px h-12 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{event.event}</h4>
                            <Badge variant={event.status === 'completed' ? 'success' : 
                                          event.status === 'failed' ? 'destructive' : 'outline'}>
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">
                                View details
                              </summary>
                              <pre className="text-xs bg-gray-50 p-2 mt-1 rounded">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="routing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Payment Route
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {routeInfo.map((route, index) => (
                      <div key={route.id} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          {getStatusIcon(route.status)}
                          {index < routeInfo.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{route.name}</h4>
                            <div className="flex items-center gap-2">
                              {route.duration && (
                                <span className="text-xs text-gray-500">
                                  {route.duration}ms
                                </span>
                              )}
                              <Badge variant={route.status === 'success' ? 'success' : 
                                            route.status === 'failed' ? 'destructive' : 'outline'}>
                                {route.status}
                              </Badge>
                            </div>
                          </div>
                          {route.details && (
                            <div className="text-sm text-gray-600 space-y-1">
                              {Object.entries(route.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Identifiers</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Transaction ID</p>
                          <p className="font-mono bg-gray-50 p-2 rounded">{transaction.id}</p>
                        </div>
                        {transaction.processorTransactionId && (
                          <div>
                            <p className="text-gray-500 mb-1">Processor Transaction ID</p>
                            <p className="font-mono bg-gray-50 p-2 rounded">{transaction.processorTransactionId}</p>
                          </div>
                        )}
                        {transaction.paymentMethodId && (
                          <div>
                            <p className="text-gray-500 mb-1">Payment Method ID</p>
                            <p className="font-mono bg-gray-50 p-2 rounded">{transaction.paymentMethodId}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Timestamps</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Created At</p>
                          <p>{new Date(transaction.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Updated At</p>
                          <p>{new Date(transaction.updatedAt).toLocaleString()}</p>
                        </div>
                        {transaction.completedAt && (
                          <div>
                            <p className="text-gray-500 mb-1">Completed At</p>
                            <p>{new Date(transaction.completedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Failure Information */}
                  {transaction.failureCode && (
                    <div>
                      <h4 className="font-medium mb-3">Failure Information</h4>
                      <div className="bg-red-50 p-4 rounded border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-800">Error Code: {transaction.failureCode}</span>
                        </div>
                        <p className="text-red-700 text-sm">{transaction.failureMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Processor Response */}
                  {transaction.processorResponse && (
                    <div>
                      <h4 className="font-medium mb-3">Processor Response</h4>
                      <pre className="text-xs bg-gray-50 p-4 rounded border overflow-x-auto">
                        {JSON.stringify(transaction.processorResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Metadata</h4>
                      <pre className="text-xs bg-gray-50 p-4 rounded border overflow-x-auto">
                        {JSON.stringify(transaction.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <RefundModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          transaction={transaction}
          onRefund={handleRefund}
        />
      </SheetContent>
    </Sheet>
  );
}