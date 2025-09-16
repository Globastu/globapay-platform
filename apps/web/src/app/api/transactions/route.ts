import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isSandboxMode, 
  generateSandboxTransactions, 
  generateSandboxTransactionStats,
  filterSandboxTransactions 
} from '@/lib/sandbox';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // In sandbox mode, return generated data
    if (isSandboxMode()) {
      const allTransactions = generateSandboxTransactions();
      
      // Check if this is a stats request
      if (request.url.includes('/stats')) {
        const stats = generateSandboxTransactionStats(allTransactions);
        return NextResponse.json({ data: stats });
      }
      
      // Check if this is an export request
      if (searchParams.get('export') === 'csv') {
        const filters = Object.fromEntries(searchParams.entries());
        const { data: transactions } = filterSandboxTransactions(allTransactions, filters);
        
        // Generate CSV
        const headers = [
          'Transaction ID', 'Customer Name', 'Customer Email', 'Amount', 'Currency',
          'Status', 'Payment Method', 'Description', 'Date', 'Reference'
        ];
        
        const csvData = [
          headers.join(','),
          ...transactions.map(t => [
            t.id,
            `"${t.customerName ?? ''}"`,
            `"${t.customerEmail ?? ''}"`,
            (t.amount / 100).toFixed(2),
            t.currency,
            t.status,
            t.paymentMethodType ?? '',
            `"${t.description}"`,
            new Date(t.createdAt).toLocaleDateString(),
            t.reference ?? ''
          ].join(','))
        ].join('\n');
        
        return new Response(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="transactions.csv"'
          }
        });
      }
      
      // Regular transaction list request
      const filters = Object.fromEntries(searchParams.entries());
      const { data: transactions, total } = filterSandboxTransactions(allTransactions, filters);
      
      const page = parseInt(filters.page || '1');
      const limit = parseInt(filters.limit || '20');
      const totalPages = Math.ceil(total / limit);
      
      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
      
      return NextResponse.json({
        data: transactions,
        pagination
      });
    }
    
    // In production mode, integrate with actual API
    // For now, return empty data
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}