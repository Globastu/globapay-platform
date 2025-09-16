import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isSandboxMode, 
  generateSandboxTransactions, 
  generateSandboxTransactionStats 
} from '@/lib/sandbox';

export async function GET(request: NextRequest) {
  try {
    // In sandbox mode, return generated stats
    if (isSandboxMode()) {
      const allTransactions = generateSandboxTransactions();
      const stats = generateSandboxTransactionStats(allTransactions);
      return NextResponse.json({ data: stats });
    }

    // In production mode, check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production mode, integrate with actual API
    // For now, return empty stats
    return NextResponse.json({
      data: {
        totalTransactions: 0,
        totalAmount: 0,
        completedTransactions: 0,
        completedAmount: 0,
        refundedTransactions: 0,
        refundedAmount: 0,
        averageTransactionAmount: 0,
        successRate: 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}