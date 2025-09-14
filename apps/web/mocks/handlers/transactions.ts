import { http, HttpResponse } from 'msw';
import { mockTransactions, createMockRefund, findTransactionById } from '../fixtures/transactions';
import type { Refund } from '@/types/api';

// In-memory storage for demo purposes
let transactionsStore = [...mockTransactions];

export const transactionHandlers = [
  // GET /transactions - List transactions with filtering and pagination
  http.get('*/transactions', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const paymentLinkId = url.searchParams.get('paymentLinkId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const search = url.searchParams.get('search');
    const exportFormat = url.searchParams.get('export');

    let filteredTransactions = transactionsStore;

    // Filter by status
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }

    // Filter by payment link
    if (paymentLinkId) {
      filteredTransactions = filteredTransactions.filter(tx => tx.paymentLinkId === paymentLinkId);
    }

    // Date range filter
    if (fromDate) {
      const from = new Date(fromDate);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.createdAt) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.createdAt) <= to);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(tx => {
        const customerEmail = tx.customerEmail || tx.customer?.email || '';
        const customerName = tx.customerName || tx.customer?.name || '';
        const reference = tx.reference || '';
        
        return reference.toLowerCase().includes(searchLower) ||
               customerEmail.toLowerCase().includes(searchLower) ||
               customerName.toLowerCase().includes(searchLower) ||
               tx.id.toLowerCase().includes(searchLower);
      });
    }

    // Sort by creation date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Handle CSV export
    if (exportFormat === 'csv') {
      const csvHeaders = [
        'Transaction ID',
        'Amount',
        'Currency', 
        'Status',
        'Customer Email',
        'Customer Name',
        'Payment Method',
        'Reference',
        'Created At',
        'Refunded Amount'
      ];
      
      const csvRows = filteredTransactions.map(tx => [
        tx.id,
        (tx.amount / 100).toFixed(2),
        tx.currency || 'USD',
        tx.status,
        tx.customerEmail || tx.customer?.email || '',
        tx.customerName || tx.customer?.name || '',
        tx.paymentMethodType || tx.paymentMethod?.type || '',
        tx.reference || '',
        new Date(tx.createdAt).toISOString(),
        tx.refundedAmount ? (tx.refundedAmount / 100).toFixed(2) : '0.00'
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
    const totalCount = filteredTransactions.length;
    const totalPages = Math.ceil(totalCount / limit);

    return HttpResponse.json({
      data: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }),

  // GET /transactions/:id - Get single transaction
  http.get('*/transactions/:id', ({ params }) => {
    const { id } = params;
    const transaction = transactionsStore.find(tx => tx.id === id);

    if (!transaction) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: `Transaction with ID '${id}' was not found.`,
          instance: `/transactions/${id}`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: transaction });
  }),

  // POST /transactions/:id/refund - Process refund
  http.post('*/transactions/:id/refund', async ({ params, request }) => {
    const { id } = params;
    const transactionIndex = transactionsStore.findIndex(tx => tx.id === id);

    if (transactionIndex === -1) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: `Transaction with ID '${id}' was not found.`,
          instance: `/transactions/${id}/refund`,
        },
        { status: 404 }
      );
    }

    const transaction = transactionsStore[transactionIndex];

    // Check if transaction can be refunded
    if (transaction.status !== 'completed') {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/invalid-state',
          title: 'Invalid Transaction State',
          status: 400,
          detail: 'Only completed transactions can be refunded.',
          instance: `/transactions/${id}/refund`,
        },
        { status: 400 }
      );
    }

    try {
      const body = await request.json() as any;
      const { amount, reason = 'Refund requested by merchant' } = body;

      // Validate refund amount
      if (!amount || amount <= 0) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Invalid Refund Amount',
            status: 400,
            detail: 'Refund amount must be greater than zero.',
            instance: `/transactions/${id}/refund`,
            errors: {
              amount: ['Amount must be greater than zero'],
            },
          },
          { status: 400 }
        );
      }

      // Calculate total refunded amount
      const totalRefunded = transaction.refunds?.reduce((sum: number, refund: Refund) => 
        refund.status === 'completed' ? sum + refund.amount : sum, 0
      ) || 0;

      if (totalRefunded + amount > transaction.amount) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Refund Amount Exceeds Transaction',
            status: 400,
            detail: `Cannot refund $${(amount / 100).toFixed(2)}. Available for refund: $${((transaction.amount - totalRefunded) / 100).toFixed(2)}`,
            instance: `/transactions/${id}/refund`,
            errors: {
              amount: [`Cannot exceed remaining refundable amount of $${((transaction.amount - totalRefunded) / 100).toFixed(2)}`],
            },
          },
          { status: 400 }
        );
      }

      // Create refund
      const refund = createMockRefund(id, amount, reason);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update refund status to completed (in real world, this would be async)
      refund.status = 'completed';

      // Add refund to transaction
      if (!transactionsStore[transactionIndex].refunds) {
        transactionsStore[transactionIndex].refunds = [];
      }
      transactionsStore[transactionIndex].refunds.push(refund);

      // Update transaction refunded amount
      const newTotalRefunded = totalRefunded + amount;
      transactionsStore[transactionIndex].refundedAmount = newTotalRefunded;

      // Update transaction status if fully refunded
      if (newTotalRefunded === transaction.amount) {
        transactionsStore[transactionIndex].status = 'refunded';
      } else if (newTotalRefunded > 0) {
        transactionsStore[transactionIndex].status = 'partially_refunded';
      }

      transactionsStore[transactionIndex].updatedAt = new Date().toISOString();

      return HttpResponse.json(
        { 
          success: true,
          data: refund,
          message: `Refund of $${(amount / 100).toFixed(2)} processed successfully`
        },
        { status: 200 }
      );

    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'Refund Processing Failed',
          status: 500,
          detail: 'An error occurred while processing the refund.',
          instance: `/transactions/${id}/refund`,
        },
        { status: 500 }
      );
    }
  }),

  // GET /transactions/stats - Get transaction statistics
  http.get('*/transactions/stats', ({ request }) => {
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    let filteredTransactions = transactionsStore;

    // Date range filter
    if (fromDate) {
      const from = new Date(fromDate);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.createdAt) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.createdAt) <= to);
    }

    // Calculate statistics
    const completedTransactions = filteredTransactions.filter(tx => tx.status === 'completed');
    const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const completedAmount = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const refundedAmount = filteredTransactions.reduce((sum, tx) => sum + (tx.refundedAmount || 0), 0);
    const refundedTransactions = filteredTransactions.filter(tx => 
      tx.status === 'refunded' || tx.status === 'partially_refunded'
    ).length;

    const stats = {
      totalTransactions: filteredTransactions.length,
      totalAmount,
      completedTransactions: completedTransactions.length,
      completedAmount,
      refundedTransactions,
      refundedAmount,
      averageTransactionAmount: filteredTransactions.length > 0 ? 
        Math.round(totalAmount / filteredTransactions.length) : 0,
      successRate: filteredTransactions.length > 0 ? 
        Math.round((completedTransactions.length / filteredTransactions.length) * 100) : 0,
    };

    return HttpResponse.json({ data: stats });
  }),
];