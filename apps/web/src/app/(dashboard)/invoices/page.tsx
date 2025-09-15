'use client';

import { Receipt, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TablePagination 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useState } from 'react';
import { Invoice, InvoiceStatus } from '@/lib/contracts/invoices';
import { InvoiceMetricsPanel } from '@/components/invoices/InvoiceMetricsPanel';
import { InvoiceDetailView } from '@/components/invoices/InvoiceDetailView';
import { mockInvoices } from '../../../../mocks/fixtures/invoices';

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

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Check if invoices feature is enabled
  if (process.env.NEXT_PUBLIC_INVOICES_ENABLED !== '1') {
    return (
      <EmptyState
        icon={<Receipt className="h-12 w-12" />}
        title="Enable Invoices"
        description="The invoices feature is currently disabled. Please contact your administrator to enable it."
      />
    );
  }

  // Filter invoices based on search and status
  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customerId && invoice.customerId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if invoice is overdue
  const isOverdue = (invoice: any) => {
    if (invoice.status !== 'open') return false;
    return new Date(invoice.dueDate) < new Date();
  };

  // If no invoices after filtering, show empty state
  if (filteredInvoices.length === 0 && mockInvoices.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage your invoices
            </p>
          </div>
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <InvoiceMetricsPanel invoices={mockInvoices} />

        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No invoices found"
          description="No invoices match your current search criteria. Try adjusting your filters."
        />
      </div>
    );
  }

  // If no invoices at all, show empty state
  if (mockInvoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage your invoices
            </p>
          </div>
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No invoices yet"
          description="Get started by creating your first invoice. You can send payment links to customers and track payment status."
          action={
            <Link href="/invoices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Metrics Panel */}
      <InvoiceMetricsPanel invoices={mockInvoices} />

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
            <SelectItem value="uncollectible">Uncollectible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead sortable>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead sortable>Status</TableHead>
              <TableHead sortable>Amount</TableHead>
              <TableHead sortable>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow 
                key={invoice.id} 
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${isOverdue(invoice) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{invoice.number}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {invoice.customerId || 'Unknown Customer'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(invoice.status)}
                    {isOverdue(invoice) && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                    {invoice.amountDue !== invoice.total && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(invoice.amountDue, invoice.currency)} due
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`text-sm ${isOverdue(invoice) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                    {formatDate(invoice.dueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(invoice);
                      }}
                    >
                      View
                    </Button>
                    {invoice.status === 'open' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Remind
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredInvoices.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}