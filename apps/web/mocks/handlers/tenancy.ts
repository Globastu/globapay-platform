import { http, HttpResponse } from 'msw';
import type { Merchant } from '@/types/tenancy';

// Mock data
const mockPlatforms = [
  {
    id: 'plat-001',
    name: 'TechStart Hub',
    description: 'Platform for technology startups and SaaS companies',
    website: 'https://techstarthub.com',
    status: 'active',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'plat-002',
    name: 'ECommerce Central',
    description: 'Multi-vendor marketplace and e-commerce platform',
    website: 'https://ecommercecentral.com',
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'plat-003',
    name: 'ServicePro Network',
    description: 'Professional services and consulting platform',
    website: 'https://servicepronet.com',
    status: 'inactive',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockMerchants = [
  {
    id: 'merch-001',
    platformId: 'plat-001',
    name: 'CloudTech Solutions',
    legalName: 'CloudTech Solutions LLC',
    email: 'admin@cloudtech.com',
    phone: '+1-555-0123',
    website: 'https://cloudtech.com',
    description: 'Cloud infrastructure and DevOps services',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    },
    kybStatus: 'approved',
    status: 'active',
    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      webhookUrl: 'https://cloudtech.com/webhooks/globapay'
    },
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    kybData: {
      businessType: 'llc',
      taxId: '12-3456789',
      registrationNumber: 'LLC-2023-001234',
      dateOfIncorporation: '2023-01-15',
      documents: [
        {
          id: 'doc-001',
          type: 'articles_of_incorporation',
          name: 'Articles of Incorporation.pdf',
          url: '/documents/doc-001.pdf',
          status: 'approved',
          uploadedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      owners: [
        {
          id: 'owner-001',
          firstName: 'John',
          lastName: 'Smith',
          title: 'CEO',
          ownershipPercentage: 60,
          email: 'john@cloudtech.com',
          phone: '+1-555-0124',
          address: {
            street: '456 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US'
          },
          ssn: '1234',
          dateOfBirth: '1985-03-15'
        },
        {
          id: 'owner-002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          title: 'CTO',
          ownershipPercentage: 40,
          email: 'sarah@cloudtech.com',
          phone: '+1-555-0125',
          address: {
            street: '789 Oak Ave',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'US'
          },
          ssn: '5678',
          dateOfBirth: '1987-07-22'
        }
      ],
      bankAccount: {
        accountType: 'checking',
        routingNumber: '123456789',
        accountNumber: '987654321',
        accountHolderName: 'CloudTech Solutions LLC'
      },
      submittedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
  {
    id: 'merch-002',
    platformId: 'plat-002',
    name: 'Fashion Forward',
    legalName: 'Fashion Forward Inc.',
    email: 'contact@fashionforward.com',
    phone: '+1-555-0200',
    website: 'https://fashionforward.com',
    description: 'Premium fashion and accessories retailer',
    address: {
      street: '789 Fashion Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10018',
      country: 'US'
    },
    kybStatus: 'under_review',
    status: 'pending',
    settings: {
      currency: 'USD',
      timezone: 'America/New_York'
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    kybData: {
      businessType: 'corporation',
      taxId: '98-7654321',
      documents: [
        {
          id: 'doc-002',
          type: 'articles_of_incorporation',
          name: 'Certificate of Incorporation.pdf',
          url: '/documents/doc-002.pdf',
          status: 'pending',
          uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      owners: [
        {
          id: 'owner-003',
          firstName: 'Maria',
          lastName: 'Rodriguez',
          title: 'Founder & CEO',
          ownershipPercentage: 100,
          email: 'maria@fashionforward.com',
          address: {
            street: '123 Broadway',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          }
        }
      ],
      submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
  {
    id: 'merch-003',
    platformId: null, // Standalone merchant
    name: 'Local Bakery Co',
    legalName: 'Local Bakery Company',
    email: 'info@localbakery.com',
    phone: '+1-555-0300',
    description: 'Artisanal baked goods and catering services',
    address: {
      street: '456 Baker Street',
      city: 'Portland',
      state: 'OR',
      postalCode: '97205',
      country: 'US'
    },
    kybStatus: 'additional_info_required',
    status: 'pending',
    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles'
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    kybData: {
      businessType: 'sole_proprietorship',
      documents: [],
      owners: [
        {
          id: 'owner-004',
          firstName: 'Tom',
          lastName: 'Baker',
          title: 'Owner',
          ownershipPercentage: 100,
          email: 'tom@localbakery.com',
          address: {
            street: '456 Baker Street',
            city: 'Portland',
            state: 'OR',
            postalCode: '97205',
            country: 'US'
          }
        }
      ],
    }
  },
  {
    id: 'merch-004',
    platformId: 'plat-001',
    name: 'DataViz Pro',
    legalName: 'DataViz Pro LLC',
    email: 'hello@datavizpro.com',
    phone: '+1-555-0400',
    website: 'https://datavizpro.com',
    description: 'Business intelligence and data visualization tools',
    address: {
      street: '321 Data Drive',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US'
    },
    kybStatus: 'rejected',
    status: 'rejected',
    settings: {
      currency: 'USD',
      timezone: 'America/Chicago'
    },
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    kybData: {
      businessType: 'llc',
      taxId: '11-2233445',
      documents: [
        {
          id: 'doc-003',
          type: 'articles_of_incorporation',
          name: 'LLC Formation.pdf',
          url: '/documents/doc-003.pdf',
          status: 'rejected',
          uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          reviewNotes: 'Document is not clear and missing required information'
        }
      ],
      owners: [],
      reviewNotes: 'Unable to verify business information. Missing required documentation and owner details.'
    }
  }
];

// In-memory storage for demo
let platformsStore = [...mockPlatforms];
let merchantsStore = [...mockMerchants];

export const tenancyHandlers = [
  // GET /platforms
  http.get('*/platforms', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');

    let filteredPlatforms = platformsStore;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlatforms = filteredPlatforms.filter(platform => 
        platform.name.toLowerCase().includes(searchLower) ||
        platform.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredPlatforms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedPlatforms = filteredPlatforms.slice(offset, offset + limit);
    const totalCount = filteredPlatforms.length;
    const totalPages = Math.ceil(totalCount / limit);

    return HttpResponse.json({
      data: paginatedPlatforms,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  }),

  // POST /platforms
  http.post('*/platforms', async ({ request }) => {
    try {
      const body = await request.json() as any;
      const { name, description, website } = body;

      // Validation
      if (!name || !description) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Name and description are required',
          },
          { status: 400 }
        );
      }

      const newPlatform = {
        id: `plat-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        website,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      platformsStore.push(newPlatform);

      return HttpResponse.json(
        {
          data: newPlatform,
          message: 'Platform created successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to create platform',
        },
        { status: 500 }
      );
    }
  }),

  // GET /merchants
  http.get('*/merchants', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const platformId = url.searchParams.get('platformId');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filteredMerchants = merchantsStore;

    // Platform filter
    if (platformId && platformId !== 'all') {
      if (platformId === '') {
        // Standalone merchants (no platform)
        filteredMerchants = filteredMerchants.filter(m => !m.platformId);
      } else {
        filteredMerchants = filteredMerchants.filter(m => m.platformId === platformId);
      }
    }

    // Status filter
    if (status && status !== 'all') {
      filteredMerchants = filteredMerchants.filter(m => m.status === status);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMerchants = filteredMerchants.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.legalName.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredMerchants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedMerchants = filteredMerchants.slice(offset, offset + limit);
    const totalCount = filteredMerchants.length;
    const totalPages = Math.ceil(totalCount / limit);

    return HttpResponse.json({
      data: paginatedMerchants,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  }),

  // GET /merchants/:id
  http.get('*/merchants/:id', ({ params }) => {
    const { id } = params;
    const merchant = merchantsStore.find(m => m.id === id);

    if (!merchant) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Merchant Not Found',
          status: 404,
          detail: `Merchant with ID '${id}' was not found.`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: merchant });
  }),

  // POST /merchants
  http.post('*/merchants', async ({ request }) => {
    try {
      const body = await request.json() as any;
      const { platformId, name, legalName, email, address, settings } = body;

      // Validation
      if (!name || !legalName || !email || !address) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Required fields are missing',
          },
          { status: 400 }
        );
      }

      // Validate platform exists if specified
      if (platformId && !platformsStore.find(p => p.id === platformId)) {
        return HttpResponse.json(
          {
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Platform not found',
          },
          { status: 400 }
        );
      }

      const newMerchant: Merchant = {
        id: `merch-${Math.random().toString(36).substr(2, 9)}`,
        platformId: platformId || undefined,
        name,
        legalName,
        email,
        phone: body.phone || undefined,
        website: body.website || undefined,
        description: body.description || undefined,
        address,
        kybStatus: 'not_started' as const,
        kybData: {
          businessType: 'corporation' as const,
          documents: [],
          owners: [],
        },
        status: 'pending' as const,
        settings: {
          currency: settings?.currency || 'USD',
          timezone: settings?.timezone || 'UTC',
          webhookUrl: settings?.webhookUrl || undefined,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      merchantsStore.push(newMerchant as any);

      return HttpResponse.json(
        {
          data: {
            id: newMerchant.id,
            name: newMerchant.name,
            email: newMerchant.email,
            status: newMerchant.status,
            kybStatus: newMerchant.kybStatus,
          },
          message: 'Merchant created successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to create merchant',
        },
        { status: 500 }
      );
    }
  }),

  // POST /merchants/:id/status
  http.post('*/merchants/:id/status', async ({ params, request }) => {
    const { id } = params;
    const merchantIndex = merchantsStore.findIndex(m => m.id === id);

    if (merchantIndex === -1) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Merchant Not Found',
          status: 404,
          detail: `Merchant with ID '${id}' was not found.`,
        },
        { status: 404 }
      );
    }

    try {
      const body = await request.json() as any;
      const { status, kybStatus, reviewNotes } = body;

      merchantsStore[merchantIndex] = {
        ...merchantsStore[merchantIndex],
        status,
        kybStatus: kybStatus || merchantsStore[merchantIndex].kybStatus,
        approvedAt: status === 'active' ? new Date().toISOString() : merchantsStore[merchantIndex].approvedAt,
        updatedAt: new Date().toISOString(),
      } as any;

      if (reviewNotes && merchantsStore[merchantIndex].kybData) {
        merchantsStore[merchantIndex].kybData!.reviewNotes = reviewNotes;
      }

      return HttpResponse.json({
        data: {
          id: merchantsStore[merchantIndex].id,
          status: merchantsStore[merchantIndex].status,
          kybStatus: merchantsStore[merchantIndex].kybStatus,
          updatedAt: merchantsStore[merchantIndex].updatedAt,
        },
        message: 'Merchant status updated successfully',
      });
    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to update merchant status',
        },
        { status: 500 }
      );
    }
  }),

  // POST /merchants/:id/kyb
  http.post('*/merchants/:id/kyb', async ({ params, request }) => {
    const { id } = params;
    const merchantIndex = merchantsStore.findIndex(m => m.id === id);

    if (merchantIndex === -1) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Merchant Not Found',
          status: 404,
          detail: `Merchant with ID '${id}' was not found.`,
        },
        { status: 404 }
      );
    }

    try {
      const body = await request.json() as any;
      const { kybData } = body;

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Basic validation and random outcome simulation
      let newKybStatus = 'documents_submitted';
      let success = true;
      let message = 'KYB submission received and is under review';

      // Simple validation
      if (!kybData.businessType) {
        newKybStatus = 'pending_documents';
        message = 'Business type is required';
        success = false;
      } else if (!kybData.owners || kybData.owners.length === 0) {
        newKybStatus = 'additional_info_required';
        message = 'Business owner information is required';
      } else {
        // Simulate random outcomes
        const random = Math.random();
        if (random < 0.2) {
          newKybStatus = 'under_review';
          message = 'Application is under manual review';
        } else if (random < 0.4) {
          newKybStatus = 'additional_info_required';
          message = 'Additional information required for verification';
        } else if (random < 0.7) {
          newKybStatus = 'approved';
          message = 'KYB verification completed successfully';
        }
      }

      // Update merchant
      merchantsStore[merchantIndex] = {
        ...merchantsStore[merchantIndex],
        kybStatus: newKybStatus,
        kybData: {
          ...kybData,
          submittedAt: new Date().toISOString(),
          reviewedAt: newKybStatus === 'approved' ? new Date().toISOString() : undefined,
        },
        updatedAt: new Date().toISOString(),
      };

      const submissionId = `kyb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return HttpResponse.json({
        success,
        message,
        submissionId,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/server-error',
          title: 'KYB Submission Failed',
          status: 500,
          detail: 'Failed to process KYB submission',
        },
        { status: 500 }
      );
    }
  }),

  // GET /merchants/:id/kyb-status
  http.get('*/merchants/:id/kyb-status', ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('submissionId');

    const merchant = merchantsStore.find(m => m.id === id);

    if (!merchant) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/not-found',
          title: 'Merchant Not Found',
          status: 404,
          detail: `Merchant with ID '${id}' was not found.`,
        },
        { status: 404 }
      );
    }

    if (!submissionId) {
      return HttpResponse.json(
        {
          type: 'https://globapay.com/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Submission ID is required',
        },
        { status: 400 }
      );
    }

    let message = 'Status unknown';
    switch (merchant.kybStatus) {
      case 'pending_documents':
        message = 'Waiting for required documents to be uploaded';
        break;
      case 'documents_submitted':
        message = 'Documents received, initial review in progress';
        break;
      case 'under_review':
        message = 'Application under manual review by compliance team';
        break;
      case 'additional_info_required':
        message = 'Additional information needed to complete verification';
        break;
      case 'approved':
        message = 'KYB verification completed successfully';
        break;
      case 'rejected':
        message = 'Application rejected - business does not meet requirements';
        break;
    }

    return HttpResponse.json({
      status: merchant.kybStatus,
      message,
      lastUpdated: merchant.updatedAt,
    });
  }),
];