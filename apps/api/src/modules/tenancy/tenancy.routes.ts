import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenancyService } from './tenancy.service';
import type { TenantContext } from '../auth/types';
import type { 
  PlatformCreateRequest, 
  MerchantCreateRequest, 
  MerchantStatusUpdate,
  KybData 
} from './types';

interface PlatformParams {
  id: string;
}

interface MerchantParams {
  id: string;
}

interface PlatformsQuery {
  page?: string;
  limit?: string;
}

interface MerchantsQuery {
  page?: string;
  limit?: string;
  platformId?: string;
  status?: string;
}

interface KybSubmissionBody {
  kybData: KybData;
}

interface KybStatusQuery {
  submissionId: string;
}

export async function tenancyRoutes(fastify: FastifyInstance) {
  const tenancyService = new TenancyService(fastify.prisma);

  // GET /platforms - List platforms
  fastify.get<{
    Querystring: PlatformsQuery;
  }>('/platforms', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^[0-9]+$' },
          limit: { type: 'string', pattern: '^[0-9]+$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  website: { type: 'string', nullable: true },
                  status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: PlatformsQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { page = '1', limit = '20' } = request.query;

      const result = await tenancyService.getPlatforms(tenant);

      // Simple pagination for demo
      const pageNum = parseInt(page, 10);
      const limitNum = Math.min(parseInt(limit, 10), 100);
      const offset = (pageNum - 1) * limitNum;
      const paginatedPlatforms = result.platforms.slice(offset, offset + limitNum);

      return reply.send({
        data: paginatedPlatforms,
        pagination: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      fastify.log.error('Failed to list platforms:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve platforms',
        instance: '/platforms',
      });
    }
  });

  // POST /platforms - Create platform
  fastify.post<{
    Body: PlatformCreateRequest;
  }>('/platforms', {
    preHandler: [fastify.authenticate, fastify.requirePermission('PLATFORM_ADMIN', 'PLATFORM')],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'description'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', minLength: 1, maxLength: 500 },
          website: { type: 'string', format: 'uri' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                website: { type: 'string', nullable: true },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: PlatformCreateRequest }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const platform = await tenancyService.createPlatform(request.body, tenant);

      return reply.status(201).send({
        data: platform,
        message: 'Platform created successfully',
      });
    } catch (error) {
      fastify.log.error('Failed to create platform:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 500;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/server-error',
        title: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
        status: statusCode,
        detail: (error as Error).message,
        instance: '/platforms',
      });
    }
  });

  // GET /merchants - List merchants
  fastify.get<{
    Querystring: MerchantsQuery;
  }>('/merchants', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^[0-9]+$' },
          limit: { type: 'string', pattern: '^[0-9]+$' },
          platformId: { type: 'string', format: 'uuid' },
          status: { 
            type: 'string', 
            enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'] 
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  platformId: { type: 'string', nullable: true },
                  name: { type: 'string' },
                  legalName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string', nullable: true },
                  website: { type: 'string', nullable: true },
                  kybStatus: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: MerchantsQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { page = '1', limit = '20', platformId } = request.query;

      const result = await tenancyService.getMerchants(tenant, platformId);

      // Simple pagination
      const pageNum = parseInt(page, 10);
      const limitNum = Math.min(parseInt(limit, 10), 100);
      const offset = (pageNum - 1) * limitNum;
      const paginatedMerchants = result.merchants.slice(offset, offset + limitNum);

      return reply.send({
        data: paginatedMerchants.map(merchant => ({
          id: merchant.id,
          platformId: merchant.platformId,
          name: merchant.name,
          legalName: merchant.legalName,
          email: merchant.email,
          phone: merchant.phone,
          website: merchant.website,
          kybStatus: merchant.kybStatus,
          status: merchant.status,
          createdAt: merchant.createdAt.toISOString(),
          updatedAt: merchant.updatedAt.toISOString(),
        })),
        pagination: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      fastify.log.error('Failed to list merchants:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 500;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/server-error',
        title: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
        status: statusCode,
        detail: (error as Error).message,
        instance: '/merchants',
      });
    }
  });

  // GET /merchants/:id - Get merchant details
  fastify.get<{
    Params: MerchantParams;
  }>('/merchants/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                platformId: { type: 'string', nullable: true },
                name: { type: 'string' },
                legalName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                description: { type: 'string', nullable: true },
                address: { type: 'object' },
                kybStatus: { type: 'string' },
                kybData: { type: 'object', nullable: true },
                status: { type: 'string' },
                settings: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                approvedAt: { type: 'string', format: 'date-time', nullable: true },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: MerchantParams }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;

      const merchant = await tenancyService.getMerchantById(id, tenant);

      if (!merchant) {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Merchant Not Found',
          status: 404,
          detail: 'The requested merchant was not found',
          instance: `/merchants/${id}`,
        });
      }

      return reply.send({
        data: {
          ...merchant,
          createdAt: merchant.createdAt.toISOString(),
          updatedAt: merchant.updatedAt.toISOString(),
          approvedAt: merchant.approvedAt?.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Failed to get merchant:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 500;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/server-error',
        title: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
        status: statusCode,
        detail: (error as Error).message,
        instance: `/merchants/${request.params.id}`,
      });
    }
  });

  // POST /merchants - Create merchant
  fastify.post<{
    Body: MerchantCreateRequest;
  }>('/merchants', {
    preHandler: [fastify.authenticate, fastify.requirePermission('PLATFORM_ADMIN', 'PLATFORM')],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'legalName', 'email', 'address'],
        properties: {
          platformId: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          legalName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 20 },
          website: { type: 'string', format: 'uri' },
          description: { type: 'string', maxLength: 500 },
          address: {
            type: 'object',
            required: ['street', 'city', 'state', 'postalCode', 'country'],
            properties: {
              street: { type: 'string', minLength: 1, maxLength: 100 },
              city: { type: 'string', minLength: 1, maxLength: 50 },
              state: { type: 'string', minLength: 1, maxLength: 50 },
              postalCode: { type: 'string', minLength: 1, maxLength: 20 },
              country: { type: 'string', minLength: 2, maxLength: 2 },
            },
          },
          settings: {
            type: 'object',
            properties: {
              currency: { type: 'string', pattern: '^[A-Z]{3}$' },
              timezone: { type: 'string' },
              webhookUrl: { type: 'string', format: 'uri' },
            },
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                status: { type: 'string' },
                kybStatus: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: MerchantCreateRequest }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const merchant = await tenancyService.createMerchant(request.body, tenant);

      return reply.status(201).send({
        data: {
          id: merchant.id,
          name: merchant.name,
          email: merchant.email,
          status: merchant.status,
          kybStatus: merchant.kybStatus,
        },
        message: 'Merchant created successfully',
      });
    } catch (error) {
      fastify.log.error('Failed to create merchant:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 400;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/validation-error',
        title: statusCode === 403 ? 'Forbidden' : 'Validation Error',
        status: statusCode,
        detail: (error as Error).message,
        instance: '/merchants',
      });
    }
  });

  // POST /merchants/:id/status - Update merchant status
  fastify.post<{
    Params: MerchantParams;
    Body: MerchantStatusUpdate;
  }>('/merchants/:id/status', {
    preHandler: [fastify.authenticate, fastify.requirePermission('PLATFORM_ADMIN', 'MERCHANT')],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { 
            type: 'string', 
            enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'] 
          },
          kybStatus: {
            type: 'string',
            enum: [
              'not_started', 'pending_documents', 'documents_submitted',
              'under_review', 'additional_info_required', 'approved', 'rejected'
            ]
          },
          reviewNotes: { type: 'string', maxLength: 1000 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                kybStatus: { type: 'string' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: MerchantParams; Body: MerchantStatusUpdate }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;

      const merchant = await tenancyService.updateMerchantStatus(id, request.body, tenant);

      return reply.send({
        data: {
          id: merchant.id,
          status: merchant.status,
          kybStatus: merchant.kybStatus,
          updatedAt: merchant.updatedAt.toISOString(),
        },
        message: 'Merchant status updated successfully',
      });
    } catch (error) {
      fastify.log.error('Failed to update merchant status:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 
                        (error as Error).message.includes('not found') ? 404 : 500;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/server-error',
        title: statusCode === 403 ? 'Forbidden' : 
               statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        status: statusCode,
        detail: (error as Error).message,
        instance: `/merchants/${id}/status`,
      });
    }
  });

  // POST /merchants/:id/kyb - Submit KYB information
  fastify.post<{
    Params: MerchantParams;
    Body: KybSubmissionBody;
  }>('/merchants/:id/kyb', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['kybData'],
        properties: {
          kybData: {
            type: 'object',
            required: ['businessType'],
            properties: {
              businessType: {
                type: 'string',
                enum: ['sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit']
              },
              taxId: { type: 'string' },
              registrationNumber: { type: 'string' },
              dateOfIncorporation: { type: 'string', format: 'date' },
              documents: { type: 'array' },
              owners: { type: 'array' },
              bankAccount: { type: 'object' },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            submissionId: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: MerchantParams; Body: KybSubmissionBody }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;
      const { kybData } = request.body;

      const result = await tenancyService.submitKyb(id, kybData, tenant);

      return reply.send(result);
    } catch (error) {
      fastify.log.error('KYB submission failed:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 400;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/validation-error',
        title: statusCode === 403 ? 'Forbidden' : 'KYB Submission Failed',
        status: statusCode,
        detail: (error as Error).message,
        instance: `/merchants/${request.params.id}/kyb`,
      });
    }
  });

  // GET /merchants/:id/kyb-status - Check KYB status
  fastify.get<{
    Params: MerchantParams;
    Querystring: KybStatusQuery;
  }>('/merchants/:id/kyb-status', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        required: ['submissionId'],
        properties: {
          submissionId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: MerchantParams; Querystring: KybStatusQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;
      const { submissionId } = request.query;

      const result = await tenancyService.checkKybStatus(id, submissionId, tenant);

      return reply.send({
        status: result.status,
        message: result.message,
        lastUpdated: result.lastUpdated.toISOString(),
      });
    } catch (error) {
      fastify.log.error('Failed to check KYB status:', error);
      const statusCode = (error as Error).message.includes('permission') ? 403 : 400;
      
      return reply.status(statusCode).send({
        type: 'https://globapay.com/problems/server-error',
        title: statusCode === 403 ? 'Forbidden' : 'KYB Status Check Failed',
        status: statusCode,
        detail: (error as Error).message,
        instance: `/merchants/${request.params.id}/kyb-status`,
      });
    }
  });
}