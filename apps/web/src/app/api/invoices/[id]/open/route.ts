import { NextRequest, NextResponse } from 'next/server';
import { gr4vyService } from '@/lib/services/gr4vy';

// POST /api/invoices/[id]/open - Create Gr4vy payment link
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

    // TODO: Get invoice from database
    // For now, return mock data to test the integration
    const mockInvoice = {
      id,
      merchantId: 'merchant_123',
      platformId: 'platform_456',
      total: 10000, // $100.00
      currency: 'USD',
      status: 'draft',
      number: `INV-${id}`,
    };

    // Check if invoice exists and is in draft status
    if (!mockInvoice) {
      return NextResponse.json(
        {
          type: 'https://httpstatuses.com/404',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found'
        },
        { status: 404 }
      );
    }

    if (mockInvoice.status !== 'draft') {
      return NextResponse.json(
        {
          type: 'https://httpstatuses.com/400',
          title: 'Bad Request',
          status: 400,
          detail: 'Invoice must be in draft status to open'
        },
        { status: 400 }
      );
    }

    try {
      // Create Gr4vy payment link
      const paymentLink = await gr4vyService.createInvoicePaymentLink(
        mockInvoice.id,
        mockInvoice.merchantId,
        mockInvoice.platformId,
        mockInvoice.total,
        mockInvoice.currency,
        `Payment for invoice ${mockInvoice.number}`
      );

      // TODO: Update invoice in database with:
      // - paymentLinkId: paymentLink.id
      // - paymentLinkUrl: paymentLink.url
      // - status: 'open'
      
      const updatedInvoice = {
        ...mockInvoice,
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        status: 'open' as const,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(updatedInvoice);
    } catch (gr4vyError) {
      console.error('Gr4vy payment link creation failed:', gr4vyError);
      return NextResponse.json(
        {
          type: 'https://httpstatuses.com/502',
          title: 'Bad Gateway',
          status: 502,
          detail: 'Failed to create payment link. Please try again later.'
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error opening invoice:', error);
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to open invoice'
      },
      { status: 500 }
    );
  }
}