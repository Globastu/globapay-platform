import { http, HttpResponse } from 'msw';
import { mockInvoices, generateNewInvoice, generateMockInvoice } from '../fixtures/invoices';
import { CreateInvoiceInput, UpdateInvoiceInput, InvoiceSchema } from '@/lib/contracts/invoices';

// In-memory storage for demo purposes
let invoicesStore = [...mockInvoices];

// Helper to simulate latency based on query param or localStorage
const simulateLatency = async (request: Request): Promise<void> => {
  const url = new URL(request.url);
  let latency = parseInt(url.searchParams.get('latency') || '0');
  
  // Check localStorage for default latency in browser environments
  if (latency === 0 && typeof window !== 'undefined') {
    const storedLatency = localStorage.getItem('msw_latency');
    if (storedLatency) {
      latency = parseInt(storedLatency);
    }
  }
  
  if (latency > 0) {
    await new Promise(resolve => setTimeout(resolve, latency));
  }
};

export const invoiceHandlers = [
  // GET /api/invoices - List invoices with pagination and filtering
  http.get('*/api/invoices', async ({ request }) => {
    await simulateLatency(request);
    
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filteredInvoices = [...invoicesStore];

    // Filter by status
    if (status && status !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    // Filter by search term (searches number, customer ID, and memo)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.number.toLowerCase().includes(searchLower) ||
        invoice.customerId?.toLowerCase().includes(searchLower) ||
        invoice.memo?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created date (newest first)
    filteredInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Simple pagination (in real app would use proper cursor-based pagination)
    const startIndex = cursor ? filteredInvoices.findIndex(inv => inv.id === cursor) + 1 : 0;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < filteredInvoices.length;
    const nextCursor = hasNext ? paginatedInvoices[paginatedInvoices.length - 1]?.id : null;

    return HttpResponse.json({
      data: paginatedInvoices,
      pagination: {
        hasNext,
        nextCursor,
        total: filteredInvoices.length
      }
    });
  }),

  // POST /api/invoices - Create new invoice
  http.post('*/api/invoices', async ({ request }) => {
    await simulateLatency(request);
    
    try {
      const body = await request.json() as any;
      
      // Validate input (basic validation, in real app would use zod)
      if (!body || !body.merchantId || !body.items?.length) {
        return HttpResponse.json({
          type: 'https://httpstatuses.com/400',
          title: 'Bad Request',
          status: 400,
          detail: 'Missing required fields: merchantId and items are required'
        }, { status: 400 });
      }

      const newInvoice = generateNewInvoice(body);
      invoicesStore.push(newInvoice);

      return HttpResponse.json(newInvoice, { status: 201 });
    } catch (error) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid JSON payload'
      }, { status: 400 });
    }
  }),

  // GET /api/invoices/:id - Get single invoice
  http.get('*/api/invoices/:id', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoice = invoicesStore.find(inv => inv.id === id);

    if (!invoice) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    return HttpResponse.json(invoice);
  }),

  // PATCH /api/invoices/:id - Update invoice (only when draft)
  http.patch('*/api/invoices/:id', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoiceIndex = invoicesStore.findIndex(inv => inv.id === id);

    if (invoiceIndex === -1) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    const invoice = invoicesStore[invoiceIndex]!;
    
    if (invoice.status !== 'draft') {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Only draft invoices can be updated'
      }, { status: 400 });
    }

    try {
      const updates = await request.json() as any;
      
      // Update the invoice (in real app would validate with zod and recalculate totals)
      const updatedInvoice = {
        ...invoice,
        ...updates,
        id: invoice.id, // Ensure ID doesn't change
        status: invoice.status, // Ensure status doesn't change via PATCH
        updatedAt: new Date().toISOString(),
      };

      // Recalculate totals if items changed
      if (updates.items) {
        const subtotal = updates.items.reduce((sum: number, item: any) => 
          sum + (item.quantity * item.unitAmount), 0);
        const taxTotal = Math.floor(subtotal * 0.08); // 8% tax
        const discountTotal = 0;
        const total = subtotal + taxTotal - discountTotal;
        
        updatedInvoice.subtotal = subtotal;
        updatedInvoice.taxTotal = taxTotal;
        updatedInvoice.discountTotal = discountTotal;
        updatedInvoice.total = total;
        updatedInvoice.amountDue = total;
      }

      invoicesStore[invoiceIndex] = updatedInvoice;
      return HttpResponse.json(updatedInvoice);
    } catch (error) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid JSON payload'
      }, { status: 400 });
    }
  }),

  // POST /api/invoices/:id/open - Open invoice and create payment link
  http.post('*/api/invoices/:id/open', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoiceIndex = invoicesStore.findIndex(inv => inv.id === id);

    if (invoiceIndex === -1) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    const invoice = invoicesStore[invoiceIndex]!;
    
    if (invoice.status !== 'draft') {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invoice must be in draft status to open'
      }, { status: 400 });
    }

    // Simulate creating payment link
    const paymentLinkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    const paymentLinkUrl = `https://pay.gr4vy.com/demo_${paymentLinkId}`;

    const updatedInvoice = {
      ...invoice,
      status: 'open' as const,
      paymentLinkId,
      paymentLinkUrl,
      updatedAt: new Date().toISOString(),
    };

    invoicesStore[invoiceIndex] = updatedInvoice;
    return HttpResponse.json(updatedInvoice);
  }),

  // POST /api/invoices/:id/send - Send invoice email
  http.post('*/api/invoices/:id/send', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoice = invoicesStore.find(inv => inv.id === id);

    if (!invoice) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    if (!invoice.paymentLinkUrl) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invoice must be opened before it can be sent'
      }, { status: 400 });
    }

    // Simulate sending email
    console.log(`Mock: Sending invoice ${invoice.number} to customer ${invoice.customerId || 'unknown'}`);
    console.log(`Mock: Payment link: ${invoice.paymentLinkUrl}`);

    return HttpResponse.json({
      sent: true,
      invoice_id: id,
      payment_link_url: invoice.paymentLinkUrl
    });
  }),

  // POST /api/invoices/:id/recalculate - Recalculate totals
  http.post('*/api/invoices/:id/recalculate', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoice = invoicesStore.find(inv => inv.id === id);

    if (!invoice) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    // Recalculate totals based on current items
    const subtotal = invoice.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitAmount), 0);
    const taxTotal = Math.floor(subtotal * 0.08); // 8% tax
    const discountTotal = 0;
    const total = subtotal + taxTotal - discountTotal;
    const amountDue = invoice.status === 'paid' ? 0 : total;

    return HttpResponse.json({
      subtotal,
      taxTotal,
      discountTotal,
      total,
      amountDue,
    });
  }),

  // GET /api/invoices/:id/pdf - Generate PDF (mock endpoint)
  http.get('*/api/invoices/:id/pdf', async ({ params, request }) => {
    await simulateLatency(request);
    
    const id = params.id as string;
    const invoice = invoicesStore.find(inv => inv.id === id);

    if (!invoice) {
      return HttpResponse.json({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      }, { status: 404 });
    }

    // Return a small mock PDF blob
    const pdfContent = `%PDF-1.4
Mock PDF for Invoice ${invoice.number}
This would be a real PDF in production.`;
    
    return HttpResponse.text(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`
      }
    });
  }),
];

// Helper function to simulate payment completion (for testing webhooks)
export function simulatePaymentCompletion(invoiceId: string) {
  const invoiceIndex = invoicesStore.findIndex(inv => inv.id === invoiceId);
  if (invoiceIndex !== -1) {
    const invoice = invoicesStore[invoiceIndex]!;
    invoicesStore[invoiceIndex] = {
      ...invoice,
      status: 'paid' as const,
      amountDue: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}