import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSandboxMode } from '@/lib/sandbox';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { amount, reason } = body;

    // In sandbox mode, simulate refund processing
    if (isSandboxMode()) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock refund response
      const refund = {
        id: `ref_sandbox_${Math.random().toString(36).substr(2, 12)}`,
        transactionId: id,
        amount,
        currency: 'USD',
        reason,
        status: 'completed',
        processorRefundId: `proc_ref_${Math.random().toString(36).substr(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
      
      return NextResponse.json({ 
        data: refund,
        message: 'Refund processed successfully' 
      });
    }
    
    // In production mode, integrate with actual API
    return NextResponse.json(
      { error: 'Refund processing not available' }, 
      { status: 501 }
    );
    
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}