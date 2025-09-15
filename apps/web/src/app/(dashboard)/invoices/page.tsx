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
import { InvoiceStatus } from '@/lib/contracts/invoices';

// Mock data for now
const mockInvoices = [] as any[];

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

  // If no invoices, show empty state
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
            {/* Mock empty table for now */}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={currentPage}
          totalPages={1}
          pageSize={pageSize}
          totalItems={0}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}