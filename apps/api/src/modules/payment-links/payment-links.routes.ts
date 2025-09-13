import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentLinksService } from './payment-links.service';
import type { TenantContext } from '../auth/types';
import { AuditService } from '../audit/audit.service';

// Request type definitions
interface CreatePaymentLinkBody {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  reference?: string;
  metadata?: Record<string, string>;
  expiresInDays?: number;
}

interface UpdatePaymentLinkBody {
  description?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

interface PaymentLinkParams {
  id: string;
}

interface PaymentLinksQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export async function paymentLinksRoutes(fastify: FastifyInstance) {
  const paymentLinksService = new PaymentLinksService(fastify.prisma);

  // POST /payment-links - Create payment link
  fastify.post<{
    Body: CreatePaymentLinkBody;
  }>('/payment-links', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      body: {
        type: 'object',
        required: ['amount', 'currency', 'description'],
        properties: {
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          description: { type: 'string', minLength: 1, maxLength: 1000 },
          customerEmail: { type: 'string', format: 'email' },
          customerName: { type: 'string', maxLength: 255 },
          reference: { type: 'string', maxLength: 255 },
          metadata: { type: 'object', additionalProperties: { type: 'string' } },
          expiresInDays: { type: 'number', minimum: 1, maximum: 365 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { $ref: 'payment-link#' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: CreatePaymentLinkBody }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const paymentLink = await paymentLinksService.createPaymentLink(
        request.body,
        tenant
      );

      // Log creation
      await AuditService.logPaymentLinkCreated(
        tenant,
        paymentLink.id,
        paymentLink.amount,
        paymentLink.currency,
        paymentLink.description
      );

      return reply.status(201).send({ data: paymentLink });
    } catch (error) {
      request.log.error({ error }, 'Failed to create payment link');
      
      if (error instanceof Error) {
        if (error.message.includes('unique')) {
          return reply.status(409).send({
            type: 'https://globapay.com/problems/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'A payment link with this reference already exists.',
            instance: '/payment-links',
          });
        }
        
        return reply.status(400).send({
          type: 'https://globapay.com/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: error.message,
          instance: '/payment-links',
        });
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: '/payment-links',
      });
    }
  });

  // GET /payment-links - List payment links
  fastify.get<{
    Querystring: PaymentLinksQuery;
  }>('/payment-links', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^[1-9][0-9]*$' },
          limit: { type: 'string', pattern: '^[1-9][0-9]*$' },
          status: { type: 'string', enum: ['all', 'pending', 'completed', 'expired', 'voided'] },
          search: { type: 'string', maxLength: 255 },
          fromDate: { type: 'string', format: 'date' },
          toDate: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: 'payment-link#' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                totalCount: { type: 'number' },
                totalPages: { type: 'number' },
                hasNextPage: { type: 'boolean' },
                hasPrevPage: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: PaymentLinksQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const params = {
        page: request.query.page ? parseInt(request.query.page) : undefined,
        limit: request.query.limit ? parseInt(request.query.limit) : undefined,
        status: request.query.status,
        search: request.query.search,
        fromDate: request.query.fromDate,
        toDate: request.query.toDate,
      };

      const result = await paymentLinksService.getPaymentLinks(params, tenant);

      return reply.send(result);
    } catch (error) {
      request.log.error({ error }, 'Failed to get payment links');
      
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: '/payment-links',
      });
    }
  });

  // GET /payment-links/:id - Get single payment link
  fastify.get<{
    Params: PaymentLinkParams;
  }>('/payment-links/:id', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'payment-link#' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: PaymentLinkParams }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const paymentLink = await paymentLinksService.getPaymentLink(
        request.params.id,
        tenant
      );

      return reply.send({ data: paymentLink });
    } catch (error) {
      request.log.error({ error }, 'Failed to get payment link');
      
      if (error instanceof Error && error.message === 'Payment link not found') {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Payment Link Not Found',
          status: 404,
          detail: `Payment link with ID '${request.params.id}' was not found.`,
          instance: `/payment-links/${request.params.id}`,
        });
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/payment-links/${request.params.id}`,
      });
    }
  });

  // PUT /payment-links/:id - Update payment link
  fastify.put<{
    Params: PaymentLinkParams;
    Body: UpdatePaymentLinkBody;
  }>('/payment-links/:id', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          description: { type: 'string', minLength: 1, maxLength: 1000 },
          customerEmail: { type: 'string', format: 'email' },
          customerName: { type: 'string', maxLength: 255 },
          metadata: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'payment-link#' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: PaymentLinkParams; Body: UpdatePaymentLinkBody }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const paymentLink = await paymentLinksService.updatePaymentLink(
        request.params.id,
        request.body,
        tenant
      );

      // Log update
      await AuditService.logPaymentLinkUpdated(
        tenant,
        paymentLink.id,
        Object.keys(request.body)
      );

      return reply.send({ data: paymentLink });
    } catch (error) {
      request.log.error({ error }, 'Failed to update payment link');
      
      if (error instanceof Error) {
        if (error.message === 'Payment link not found') {
          return reply.status(404).send({
            type: 'https://globapay.com/problems/not-found',
            title: 'Payment Link Not Found',
            status: 404,
            detail: `Payment link with ID '${request.params.id}' was not found.`,
            instance: `/payment-links/${request.params.id}`,
          });
        }
        
        if (error.message.includes('Can only update')) {
          return reply.status(400).send({
            type: 'https://globapay.com/problems/invalid-state',
            title: 'Invalid State',
            status: 400,
            detail: error.message,
            instance: `/payment-links/${request.params.id}`,
          });
        }
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/payment-links/${request.params.id}`,
      });
    }
  });

  // POST /payment-links/:id/void - Void payment link
  fastify.post<{
    Params: PaymentLinkParams;
  }>('/payment-links/:id/void', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'payment-link#' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: PaymentLinkParams }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const paymentLink = await paymentLinksService.voidPaymentLink(
        request.params.id,
        tenant
      );

      // Log void action
      await AuditService.logPaymentLinkVoided(
        tenant,
        paymentLink.id
      );

      return reply.send({
        data: paymentLink,
        message: 'Payment link has been voided successfully',
      });
    } catch (error) {
      request.log.error({ error }, 'Failed to void payment link');
      
      if (error instanceof Error) {
        if (error.message === 'Payment link not found') {
          return reply.status(404).send({
            type: 'https://globapay.com/problems/not-found',
            title: 'Payment Link Not Found',
            status: 404,
            detail: `Payment link with ID '${request.params.id}' was not found.`,
            instance: `/payment-links/${request.params.id}/void`,
          });
        }
        
        if (error.message.includes('Can only void')) {
          return reply.status(400).send({
            type: 'https://globapay.com/problems/invalid-state',
            title: 'Invalid State',
            status: 400,
            detail: error.message,
            instance: `/payment-links/${request.params.id}/void`,
          });
        }
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/payment-links/${request.params.id}/void`,
      });
    }
  });

  // POST /payment-links/:id/resend - Resend payment link
  fastify.post<{
    Params: PaymentLinkParams;
  }>('/payment-links/:id/resend', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { $ref: 'payment-link#' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: PaymentLinkParams }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      
      const result = await paymentLinksService.resendPaymentLink(
        request.params.id,
        tenant
      );

      // Log resend action
      await AuditService.logPaymentLinkResent(
        tenant,
        request.params.id
      );

      return reply.send(result);
    } catch (error) {
      request.log.error({ error }, 'Failed to resend payment link');
      
      if (error instanceof Error) {
        if (error.message === 'Payment link not found') {
          return reply.status(404).send({
            type: 'https://globapay.com/problems/not-found',
            title: 'Payment Link Not Found',
            status: 404,
            detail: `Payment link with ID '${request.params.id}' was not found.`,
            instance: `/payment-links/${request.params.id}/resend`,
          });
        }
        
        if (error.message.includes('Can only resend') || error.message.includes('email is required')) {
          return reply.status(400).send({
            type: 'https://globapay.com/problems/invalid-state',
            title: 'Invalid State',
            status: 400,
            detail: error.message,
            instance: `/payment-links/${request.params.id}/resend`,
          });
        }
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/payment-links/${request.params.id}/resend`,
      });
    }
  });
}