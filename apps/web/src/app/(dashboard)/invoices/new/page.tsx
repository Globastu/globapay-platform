'use client';

import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { InvoiceForm } from '@/components/invoices/invoice-form';

export default function NewInvoicePage() {
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

  return <InvoiceForm />;
}