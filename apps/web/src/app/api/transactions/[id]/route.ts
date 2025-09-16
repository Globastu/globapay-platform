import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  isSandboxMode, 
  generateSandboxTransactions 
} from '@/lib/sandbox';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // In sandbox mode, return generated transaction
    if (isSandboxMode()) {
      const allTransactions = generateSandboxTransactions();
      const transaction = allTransactions.find(t => t.id === id);
      
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: transaction });
    }

    // In production mode, check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production mode, integrate with actual API
    return NextResponse.json(
      { error: 'Transaction not found' }, 
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}