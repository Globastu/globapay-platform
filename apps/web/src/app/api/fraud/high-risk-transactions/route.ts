import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isSandboxMode, 
  generateSandboxHighRiskTransactions 
} from '@/lib/sandbox';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // In sandbox mode, return generated high-risk transactions
    if (isSandboxMode()) {
      const allTransactions = generateSandboxHighRiskTransactions();
      const transactions = allTransactions.slice(0, limit);
      
      return NextResponse.json({
        data: transactions,
        total: allTransactions.length
      });
    }

    // In production mode, check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production mode, integrate with actual API
    // For now, return empty data
    return NextResponse.json({
      data: [],
      total: 0
    });
    
  } catch (error) {
    console.error('Error fetching high-risk transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}