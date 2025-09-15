import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateInvoiceInput, InvoiceSchema } from '@/lib/contracts/invoices';

// GET /api/invoices - List invoices with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // TODO: Implement actual database query
    // For now, return empty list
    const invoices: any[] = [];
    
    return NextResponse.json({
      data: invoices,
      pagination: {
        hasNext: false,
        nextCursor: null,
        total: 0
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch invoices'
      },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedInput = CreateInvoiceInput.parse(body);
    
    // TODO: Implement actual invoice creation
    // For now, return a mock invoice
    const mockInvoice = {
      id: `inv_${Date.now()}`,
      merchantId: validatedInput.merchantId,
      platformId: validatedInput.platformId,
      customerId: validatedInput.customerId,
      number: `INV-${Date.now()}`,
      currency: validatedInput.currency,
      status: 'draft' as const,
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      total: 0,
      amountDue: 0,
      dueDate: validatedInput.dueDate,
      memo: validatedInput.memo,
      footer: validatedInput.footer,
      metadata: validatedInput.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: validatedInput.items.map(item => ({
        ...item,
        id: `item_${Date.now()}_${Math.random()}`
      }))
    };

    // Validate output
    const validatedInvoice = InvoiceSchema.parse(mockInvoice);
    
    return NextResponse.json(validatedInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    
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
        detail: 'Failed to create invoice'
      },
      { status: 500 }
    );
  }
}