import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSandboxMode } from '@/lib/sandbox';
import { gr4vyService } from '@/lib/services/gr4vy';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // In production mode, check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In production mode, use Gr4vy API for actual refunds
    try {
      // Note: In a real implementation, you'd need to get the Gr4vy transaction ID
      // from your database based on the transaction ID
      const gr4vyTransactionId = id; // This should be looked up from your database
      
      const refund = await gr4vyService.createRefund(gr4vyTransactionId, {
        amount,
        reason,
        metadata: {
          refunded_by: session.user.id,
          refunded_at: new Date().toISOString(),
        }
      });
      
      return NextResponse.json({ 
        data: {
          id: refund.id,
          transactionId: id,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          status: refund.status,
          createdAt: refund.created_at,
          updatedAt: refund.updated_at
        },
        message: 'Refund processed successfully via Gr4vy' 
      });
    } catch (error) {
      console.error('Gr4vy refund failed:', error);
      return NextResponse.json(
        { 
          error: 'Refund processing failed',
          detail: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}