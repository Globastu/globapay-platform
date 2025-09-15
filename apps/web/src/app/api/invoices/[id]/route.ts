import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UpdateInvoiceInput, InvoiceSchema } from '@/lib/contracts/invoices';

// GET /api/invoices/[id] - Get single invoice
export async function GET(
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

    // TODO: Implement actual database query
    // For now, return 404
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
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch invoice'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[id] - Update invoice (only when draft)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
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
    
    // Validate input
    const validatedInput = UpdateInvoiceInput.parse(body);
    
    // TODO: Implement actual invoice update logic
    // - Check if invoice exists
    // - Check if invoice is in draft status
    // - Update the invoice
    // - Recalculate totals if items changed
    
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
    console.error('Error updating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          type: 'https://httpstatuses.com/400',
          title: 'Bad Request',
          status: 400,
          detail: 'Invalid input data',
          errors: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to update invoice'
      },
      { status: 500 }
    );
  }
}