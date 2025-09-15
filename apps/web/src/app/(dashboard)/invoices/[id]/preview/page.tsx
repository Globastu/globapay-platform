'use client';

import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface InvoicePreviewPageProps {
  params: { id: string };
}

export default function InvoicePreviewPage({ params }: InvoicePreviewPageProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preview Invoice {params.id}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          HTML preview for PDF generation
        </p>
      </div>

      {/* Placeholder for invoice preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-gray-500">Invoice PDF preview will be implemented here.</p>
      </div>
    </div>
  );
}