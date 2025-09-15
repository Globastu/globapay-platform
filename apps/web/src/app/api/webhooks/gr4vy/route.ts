import { NextRequest, NextResponse } from 'next/server';
import { PaymentLinkMetadata } from '@/lib/services/gr4vy';

interface Gr4vyTransactionEvent {
  event_type: 'transaction.captured' | 'transaction.failed' | 'transaction.voided';
  data: {
    id: string;
    amount: number;
    currency: string;
    status: 'captured' | 'failed' | 'voided';
    metadata?: PaymentLinkMetadata;
    created_at: string;
    payment_link_id?: string;
  };
}

// POST /api/webhooks/gr4vy - Handle Gr4vy webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body as Gr4vyTransactionEvent;

    console.log('Received Gr4vy webhook:', event.event_type, event.data.id);

    // Validate webhook signature (in production, verify HMAC signature)
    const signature = request.headers.get('gr4vy-signature');
    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Missing or invalid signature' },
        { status: 401 }
      );
    }

    // Handle different event types
    switch (event.event_type) {
      case 'transaction.captured':
        return await handleTransactionCaptured(event);
      
      case 'transaction.failed':
        return await handleTransactionFailed(event);
      
      case 'transaction.voided':
        return await handleTransactionVoided(event);
      
      default:
        console.log('Unhandled webhook event type:', event.event_type);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Error processing Gr4vy webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTransactionCaptured(event: Gr4vyTransactionEvent): Promise<NextResponse> {
  const { data } = event;
  
  // Check if this is an invoice payment
  if (data.metadata?.type !== 'invoice') {
    console.log('Non-invoice transaction captured:', data.id);
    return NextResponse.json({ received: true });
  }

  const invoiceId = data.metadata.invoice_id;
  console.log(`Transaction captured for invoice ${invoiceId}:`, data.id);

  try {
    // TODO: Update invoice in database:
    // - Set status to 'paid'
    // - Set amountDue to 0
    // - Set paidAt timestamp
    // - Store transaction ID and amount
    
    console.log(`Updated invoice ${invoiceId} to paid status`);
    
    // In a real implementation, you might also:
    // - Send confirmation email to customer
    // - Trigger fulfillment process
    // - Update accounting system
    // - Send webhook to merchant's system

    return NextResponse.json({ 
      received: true,
      invoice_updated: true,
      invoice_id: invoiceId 
    });
  } catch (error) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
    
    // Return 500 so Gr4vy will retry the webhook
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

async function handleTransactionFailed(event: Gr4vyTransactionEvent): Promise<NextResponse> {
  const { data } = event;
  
  if (data.metadata?.type !== 'invoice') {
    return NextResponse.json({ received: true });
  }

  const invoiceId = data.metadata.invoice_id;
  console.log(`Transaction failed for invoice ${invoiceId}:`, data.id);

  try {
    // TODO: Update invoice in database:
    // - Keep status as 'open' (customer can retry)
    // - Store last error details
    // - Maybe send notification to merchant
    
    console.log(`Recorded failed payment attempt for invoice ${invoiceId}`);
    
    return NextResponse.json({ 
      received: true,
      invoice_id: invoiceId 
    });
  } catch (error) {
    console.error(`Failed to record payment failure for invoice ${invoiceId}:`, error);
    return NextResponse.json(
      { error: 'Failed to process payment failure' },
      { status: 500 }
    );
  }
}

async function handleTransactionVoided(event: Gr4vyTransactionEvent): Promise<NextResponse> {
  const { data } = event;
  
  if (data.metadata?.type !== 'invoice') {
    return NextResponse.json({ received: true });
  }

  const invoiceId = data.metadata.invoice_id;
  console.log(`Transaction voided for invoice ${invoiceId}:`, data.id);

  try {
    // TODO: Update invoice in database:
    // - If invoice was paid, set status back to 'open'
    // - Set amountDue back to total
    // - Clear paidAt timestamp
    // - Record void transaction
    
    console.log(`Processed void for invoice ${invoiceId}`);
    
    return NextResponse.json({ 
      received: true,
      invoice_id: invoiceId 
    });
  } catch (error) {
    console.error(`Failed to process void for invoice ${invoiceId}:`, error);
    return NextResponse.json(
      { error: 'Failed to process void' },
      { status: 500 }
    );
  }
}