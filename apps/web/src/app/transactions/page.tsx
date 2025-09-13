'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { TransactionDetailDrawer } from '@/components/transactions/TransactionDetailDrawer';
import { RefundModal } from '@/components/transactions/RefundModal';
import type { Transaction, TransactionFilters, TransactionStats } from '@/types/transactions';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters and pagination state
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    currency: 'all',
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    loadTransactions();
    loadTransactionStats();
  }, [filters.page, filters.limit]);

  const loadTransactions = async (newFilters?: Partial<TransactionFilters>) => {
    setLoading(true);
    try {
      const activeFilters = { ...filters, ...newFilters };
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to load transactions:', data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/transactions/stats?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading transaction stats:', error);
    }
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to first page
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  const handleSearch = () => {
    loadTransactions({ ...filters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '' && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString());
        }
      });
      params.append('export', 'csv');
      params.append('limit', '10000'); // Export more records

      const response = await fetch(`/api/transactions?${params.toString()}`);
      
      if (response.ok) {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailDrawer(true);
  };

  const handleInitiateRefund = (transaction: Transaction) => {
    setRefundTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleRefund = async (amount: number, reason?: string) => {
    if (!refundTransaction) return;
    
    try {
      const response = await fetch(`/api/transactions/${refundTransaction.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Refund failed');
      }

      const result = await response.json();
      
      // Refresh transactions list and close modal
      loadTransactions();
      setShowRefundModal(false);
      setRefundTransaction(null);
      
      return result;
    } catch (error) {
      console.error('Refund failed:', error);
      throw error;
    }
  };

  const handleDetailDrawerRefund = async (amount: number, reason?: string) => {
    if (!selectedTransaction) return;
    
    try {
      const response = await fetch(`/api/transactions/${selectedTransaction.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Refund failed');
      }

      const result = await response.json();
      
      // Refresh transactions list and update selected transaction
      await loadTransactions();
      
      // Update the selected transaction with the latest data
      const updatedResponse = await fetch(`/api/transactions/${selectedTransaction.id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setSelectedTransaction(updatedData.data);
      }
      
      return result;
    } catch (error) {
      console.error('Refund failed:', error);
      throw error;
    }
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setRefundTransaction(null);
    loadTransactions(); // Refresh transactions list
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'refunded':
      case 'partially_refunded':
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'refunded':
      case 'partially_refunded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-gray-600">
          Monitor and manage payment transactions across your platform.
        </p>
      </div>

      {/* Transaction Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.totalAmount, 'USD')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.completedAmount, 'USD')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTransactions} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average: {formatAmount(stats.averageTransactionAmount, 'USD')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunds</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.refundedAmount, 'USD')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.refundedTransactions} refunded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTransactions()}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mt-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Transaction ID, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="minAmount">Min Amount ($)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="maxAmount">Max Amount ($)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="1000.00"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium font-mono text-sm">
                            {transaction.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.description}
                          </div>
                          {transaction.paymentLink && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {transaction.paymentLink.shortCode}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.customerName}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </div>
                        {transaction.refundedAmount && transaction.refundedAmount > 0 && (
                          <div className="text-sm text-red-600">
                            -{formatAmount(transaction.refundedAmount, transaction.currency)} refunded
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={getStatusBadgeVariant(transaction.status)}>
                            {transaction.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {transaction.fraudScore !== null && transaction.fraudScore !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            Fraud: {transaction.fraudScore}/100
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">{transaction.paymentMethodType || 'Unknown'}</div>
                        {transaction.require3DS && (
                          <div className="text-xs text-blue-600">3DS Required</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === 'completed' && 
                            (!transaction.refundedAmount || transaction.refundedAmount < transaction.amount) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInitiateRefund(transaction)}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Drawer */}
      {selectedTransaction && (
        <TransactionDetailDrawer
          transaction={selectedTransaction}
          open={showDetailDrawer}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedTransaction(null);
          }}
          onRefund={handleDetailDrawerRefund}
        />
      )}

      {/* Refund Modal */}
      {refundTransaction && (
        <RefundModal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setRefundTransaction(null);
          }}
          transaction={refundTransaction}
          onRefund={handleRefund}
        />
      )}
    </div>
  );
}