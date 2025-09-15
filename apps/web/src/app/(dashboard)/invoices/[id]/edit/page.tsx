'use client';

import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { Invoice } from '@/lib/contracts/invoices';
import { apiGet } from '@/lib/api';

interface EditInvoicePageProps {
  params: { id: string };
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const data = await apiGet<Invoice>(`/api/invoices/${params.id}`);
        setInvoice(data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [params.id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <EmptyState
        icon={<Receipt className="h-12 w-12" />}
        title="Invoice Not Found"
        description={error || "The invoice you're looking for doesn't exist."}
      />
    );
  }

  if (invoice.status !== 'draft') {
    return (
      <EmptyState
        icon={<Receipt className="h-12 w-12" />}
        title="Cannot Edit Invoice"
        description="Only draft invoices can be edited. This invoice is already open or paid."
      />
    );
  }

  return <InvoiceForm invoice={invoice} isEditing={true} />;
}