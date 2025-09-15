import { NextRequest, NextResponse } from 'next/server';

// POST /api/invoices/[id]/send - Send email with payment link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        {
          type: 'https://httpstatuses.com/400',
          title: 'Bad Request',
          status: 400,
          detail: 'Invoice ID is required'
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual logic:
    // 1. Get invoice from database
    // 2. Check if invoice has paymentLinkUrl (must be opened first)
    // 3. Send email to customer containing paymentLinkUrl
    // 4. Update invoice with sentAt timestamp
    
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Invoice not found'
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to send invoice'
      },
      { status: 500 }
    );
  }
}