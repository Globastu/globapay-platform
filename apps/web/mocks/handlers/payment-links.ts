import { http, HttpResponse } from 'msw';
import { mockPaymentLinks, generateNewPaymentLink } from '../fixtures/payment-links';

// In-memory storage for demo purposes
let paymentLinksStore = [...mockPaymentLinks];

// Helper to simulate latency based on query param or localStorage
const simulateLatency = async (request: Request): Promise<void> => {
  const url = new URL(request.url);
  let latency = parseInt(url.searchParams.get('latency') || '0');
  
  // Check localStorage for default latency in browser environments
  if (latency === 0 && typeof window !== 'undefined') {
    const storedLatency = localStorage.getItem('msw_latency');
    if (storedLatency) {
      latency = parseInt(storedLatency);
    }
  }
  
  if (latency > 0) {
    await new Promise(resolve => setTimeout(resolve, latency));
  }
};

export const paymentLinkHandlers = [
  // GET /payment-links/code/:shortCode - Get payment link by short code (public endpoint)
  http.get('*/payment-links/code/:shortCode', async ({ params, request }) => {
    await simulateLatency(request);
    const shortCode = params.shortCode as string;
    
    const paymentLink = paymentLinksStore.find(link => 
      link.shortCode.toLowerCase() === shortCode.toLowerCase()
    );
    
    if (!paymentLink) {
      return HttpResponse.json({
        type: 'https://globapay.com/problems/not-found',
        title: 'Payment Link Not Found',
        status: 404,
        detail: `Payment link with code '${shortCode}' was not found or has expired`,
        instance: `/payment-links/code/${shortCode}`,
      }, { status: 404 });
    }

    // Check if payment link is expired
    const now = new Date();
    const expiresAt = new Date(paymentLink.expiresAt);
    if (expiresAt < now && paymentLink.status === 'pending') {
      paymentLink.status = 'expired';
      paymentLink.updatedAt = now.toISOString();
    }

    return HttpResponse.json({
      data: paymentLink,
    });
  }),
  // GET /payment-links - List payment links with pagination
  http.get('*/payment-links', async ({ request }) => {
    await simulateLatency(request);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    // Filter by status if provided
    let filteredLinks = paymentLinksStore;
    if (status && status !== 'all') {
      filteredLinks = filteredLinks.filter(link => link.status === status);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLinks = filteredLinks.filter(link => 
        link.description.toLowerCase().includes(searchLower) ||
        link.customerName?.toLowerCase().includes(searchLower) ||
        link.customerEmail?.toLowerCase().includes(searchLower) ||
        link.reference.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedLinks = filteredLinks.slice(offset, offset + limit);
    const totalCount = filteredLinks.length;
    const totalPages = Math.ceil(totalCount / limit);

    return HttpResponse.json({
      data: paginatedLinks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }),

  // GET /payment-links/:id - Get single payment link
  http.get('*/payment-links/:id', async ({ params, request }) => {
    await simulateLatency(request);
    const { id } = params;
    const paymentLink = paymentLinksStore.find(link => link.id === id);

    if (!paymentLink) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Payment Link Not Found',
          status: 404,
          detail: `Payment link with ID '${id}' was not found.`,
          instance: `/payment-links/${id}`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: paymentLink });
  }),

  // POST /payment-links - Create new payment link
  http.post('*/payment-links', async ({ request }) => {
    await simulateLatency(request);
    try {
      const body = await request.json() as any;
      
      // Simulate validation
      if (!body.amount || !body.currency || !body.description) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Missing required fields: amount, currency, or description.',
            instance: '/payment-links',
            errors: {
              amount: body.amount ? undefined : ['Amount is required'],
              currency: body.currency ? undefined : ['Currency is required'],
              description: body.description ? undefined : ['Description is required'],
            },
          },
          { status: 400 }
        );
      }

      // Create new payment link
      const newPaymentLink = generateNewPaymentLink(body);
      paymentLinksStore.unshift(newPaymentLink); // Add to beginning for newest first

      // Simulate async processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return HttpResponse.json(
        { data: newPaymentLink },
        { status: 201 }
      );
    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred while creating the payment link.',
          instance: '/payment-links',
        },
        { status: 500 }
      );
    }
  }),

  // PUT /payment-links/:id - Update payment link
  http.put('*/payment-links/:id', async ({ params, request }) => {
    await simulateLatency(request);
    const { id } = params;
    const body = await request.json() as any;
    
    const linkIndex = paymentLinksStore.findIndex(link => link.id === id);
    if (linkIndex === -1) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Payment Link Not Found',
          status: 404,
          detail: `Payment link with ID '${id}' was not found.`,
          instance: `/payment-links/${id}`,
        },
        { status: 404 }
      );
    }

    // Update the payment link
    paymentLinksStore[linkIndex] = {
      ...paymentLinksStore[linkIndex],
      ...body,
      id, // Ensure ID can't be changed
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: paymentLinksStore[linkIndex] });
  }),

  // POST /payment-links/:id/void - Void payment link
  http.post('*/payment-links/:id/void', async ({ params, request }) => {
    await simulateLatency(request);
    const { id } = params;
    const linkIndex = paymentLinksStore.findIndex(link => link.id === id);
    
    if (linkIndex === -1) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Payment Link Not Found',
          status: 404,
          detail: `Payment link with ID '${id}' was not found.`,
          instance: `/payment-links/${id}/void`,
        },
        { status: 404 }
      );
    }

    const paymentLink = paymentLinksStore[linkIndex];

    // Can only void pending payment links
    if (paymentLink.status !== 'pending') {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/invalid-state',
          title: 'Invalid State',
          status: 400,
          detail: 'Can only void pending payment links',
          instance: `/payment-links/${id}/void`,
        },
        { status: 400 }
      );
    }

    // Mark as voided
    paymentLinksStore[linkIndex] = {
      ...paymentLink,
      status: 'voided',
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ 
      data: paymentLinksStore[linkIndex],
      message: 'Payment link has been voided successfully' 
    });
  }),

  // POST /payment-links/:id/resend - Resend payment link
  http.post('*/payment-links/:id/resend', async ({ params, request }) => {
    await simulateLatency(request);
    const { id } = params;
    const paymentLink = paymentLinksStore.find(link => link.id === id);
    
    if (!paymentLink) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Payment Link Not Found',
          status: 404,
          detail: `Payment link with ID '${id}' was not found.`,
          instance: `/payment-links/${id}/resend`,
        },
        { status: 404 }
      );
    }

    // Can only resend pending payment links
    if (paymentLink.status !== 'pending') {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/invalid-state',
          title: 'Invalid State',
          status: 400,
          detail: 'Can only resend pending payment links',
          instance: `/payment-links/${id}/resend`,
        },
        { status: 400 }
      );
    }

    // Check if customer email exists
    if (!paymentLink.customerEmail) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/invalid-state',
          title: 'Invalid State',
          status: 400,
          detail: 'Customer email is required to resend payment link',
          instance: `/payment-links/${id}/resend`,
        },
        { status: 400 }
      );
    }

    // Simulate sending email (just update timestamp)
    const linkIndex = paymentLinksStore.findIndex(link => link.id === id);
    paymentLinksStore[linkIndex] = {
      ...paymentLink,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      message: `Payment link resent to ${paymentLink.customerEmail}`,
      data: paymentLinksStore[linkIndex],
    });
  }),
];