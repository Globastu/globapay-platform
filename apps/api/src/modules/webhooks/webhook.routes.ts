import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebhookService } from './webhook.service';
import type { TenantContext } from '../auth/types';
import type { WebhookReplayRequest } from './types';
import { AuditService } from '../audit/audit.service';

interface WebhookParams {
  provider: 'psp' | 'fraud' | 'kyb';
}

interface WebhookReplayParams {
  id: string;
}

interface WebhookListQuery {
  provider?: string;
  eventType?: string;
  processed?: string;
  verified?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  const webhookService = new WebhookService(fastify.prisma, fastify.redis);

  // POST /webhooks/provider - PSP webhook endpoint
  fastify.post<{
    Params: { provider: 'psp' };
    Headers: { [key: string]: string };
  }>('/webhooks/psp', {
    // No authentication required - external webhook
    config: { rawBody: true }, // Preserve raw body for signature verification
    schema: {
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawBody = request.rawBody as string || JSON.stringify(request.body);
      const headers = request.headers as Record<string, string>;

      // Extract organization/merchant from webhook payload or headers
      const payload = JSON.parse(rawBody);
      const organizationId = payload.organization_id || headers['x-organization-id'] || 'default-org';
      const merchantId = payload.merchant_id || headers['x-merchant-id'];

      const result = await webhookService.processWebhook(
        'psp',
        rawBody,
        headers,
        organizationId,
        merchantId
      );

      if (result.success) {
        return reply.status(200).send({ 
          received: true, 
          event_id: result.eventId 
        });
      } else {
        return reply.status(400).send({ 
          error: result.error,
          event_id: result.eventId 
        });
      }
    } catch (error) {
      fastify.log.error('PSP webhook processing failed:', error);
      return reply.status(500).send({ 
        error: 'Internal server error' 
      });
    }
  });

  // POST /webhooks/fraud - Fraud provider webhook
  fastify.post<{
    Params: { provider: 'fraud' };
    Headers: { [key: string]: string };
  }>('/webhooks/fraud', {
    config: { rawBody: true },
    schema: {
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawBody = request.rawBody as string || JSON.stringify(request.body);
      const headers = request.headers as Record<string, string>;

      const payload = JSON.parse(rawBody);
      const organizationId = payload.organization_id || headers['x-organization-id'] || 'default-org';
      const merchantId = payload.merchant_id || headers['x-merchant-id'];

      const result = await webhookService.processWebhook(
        'fraud',
        rawBody,
        headers,
        organizationId,
        merchantId
      );

      if (result.success) {
        return reply.status(200).send({ 
          received: true, 
          event_id: result.eventId 
        });
      } else {
        return reply.status(400).send({ 
          error: result.error,
          event_id: result.eventId 
        });
      }
    } catch (error) {
      fastify.log.error('Fraud webhook processing failed:', error);
      return reply.status(500).send({ 
        error: 'Internal server error' 
      });
    }
  });

  // POST /webhooks/kyb - KYB provider webhook
  fastify.post<{
    Params: { provider: 'kyb' };
    Headers: { [key: string]: string };
  }>('/webhooks/kyb', {
    config: { rawBody: true },
    schema: {
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawBody = request.rawBody as string || JSON.stringify(request.body);
      const headers = request.headers as Record<string, string>;

      const payload = JSON.parse(rawBody);
      const organizationId = payload.organization_id || headers['x-organization-id'] || 'default-org';
      const merchantId = payload.merchant_id || headers['x-merchant-id'];

      const result = await webhookService.processWebhook(
        'kyb',
        rawBody,
        headers,
        organizationId,
        merchantId
      );

      if (result.success) {
        return reply.status(200).send({ 
          received: true, 
          event_id: result.eventId 
        });
      } else {
        return reply.status(400).send({ 
          error: result.error,
          event_id: result.eventId 
        });
      }
    } catch (error) {
      fastify.log.error('KYB webhook processing failed:', error);
      return reply.status(500).send({ 
        error: 'Internal server error' 
      });
    }
  });

  // GET /webhooks - List webhook events (admin)
  fastify.get<{
    Querystring: WebhookListQuery;
  }>('/webhooks', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['psp', 'fraud', 'kyb'] },
          eventType: { type: 'string' },
          processed: { type: 'string', enum: ['true', 'false'] },
          verified: { type: 'string', enum: ['true', 'false'] },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
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
                  provider: { type: 'string' },
                  eventType: { type: 'string' },
                  processed: { type: 'boolean' },
                  verified: { type: 'boolean' },
                  processingAttempts: { type: 'number' },
                  failureReason: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  lastProcessedAt: { type: 'string', nullable: true },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: WebhookListQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const {
        provider,
        eventType,
        processed,
        verified,
        dateFrom,
        dateTo,
        page = '1',
        limit = '20',
      } = request.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      const events = await webhookService.getWebhookEvents(tenant, {
        provider,
        eventType,
        processed: processed ? processed === 'true' : undefined,
        verified: verified ? verified === 'true' : undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        limit: limitNum,
        offset,
      });

      // Get total count for pagination
      const total = await fastify.prisma.webhookEvent.count({
        where: {
          organizationId: tenant.organizationId,
          ...(tenant.merchantId && { merchantId: tenant.merchantId }),
          ...(provider && { provider }),
          ...(eventType && { eventType }),
          ...(processed !== undefined && { processed: processed === 'true' }),
          ...(verified !== undefined && { verified: verified === 'true' }),
        },
      });

      return reply.send({
        data: events.map(event => ({
          id: event.id,
          provider: event.provider,
          eventType: event.eventType,
          processed: event.processed,
          verified: event.verified,
          processingAttempts: event.processingAttempts,
          failureReason: event.failureReason,
          createdAt: event.createdAt.toISOString(),
          lastProcessedAt: event.lastProcessedAt?.toISOString() || null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      });
    } catch (error) {
      fastify.log.error('Failed to list webhook events:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve webhook events',
        instance: '/webhooks',
      });
    }
  });

  // GET /webhooks/{id} - Get webhook event details (admin)
  fastify.get<{
    Params: { id: string };
  }>('/webhooks/:id', {
    preHandler: [fastify.authenticate],
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
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                provider: { type: 'string' },
                eventType: { type: 'string' },
                payload: { type: 'object' },
                headers: { type: 'object' },
                verified: { type: 'boolean' },
                processed: { type: 'boolean' },
                processingAttempts: { type: 'number' },
                failureReason: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;

      const event = await fastify.prisma.webhookEvent.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          ...(tenant.merchantId && { merchantId: tenant.merchantId }),
        },
      });

      if (!event) {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Webhook Event Not Found',
          status: 404,
          detail: 'The requested webhook event was not found',
          instance: `/webhooks/${id}`,
        });
      }

      return reply.send({
        data: {
          id: event.id,
          provider: event.provider,
          eventType: event.eventType,
          payload: event.payload,
          headers: event.headers,
          verified: event.verified,
          processed: event.processed,
          processingAttempts: event.processingAttempts,
          failureReason: event.failureReason,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error('Failed to get webhook event:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve webhook event',
        instance: `/webhooks/${request.params.id}`,
      });
    }
  });

  // POST /webhooks/{id}/replay - Replay webhook event (admin)
  fastify.post<{
    Params: WebhookReplayParams;
    Body: WebhookReplayRequest;
  }>('/webhooks/:id/replay', {
    preHandler: [fastify.authenticate, fastify.requirePermission('WRITE', 'WEBHOOK')],
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
          reason: { type: 'string', minLength: 1, maxLength: 500 },
          targetUrl: { type: 'string', format: 'uri' },
        },
        required: ['reason'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            eventId: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: WebhookReplayParams; Body: WebhookReplayRequest }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;
      const replayRequest = request.body;

      const result = await webhookService.replayWebhook(id, replayRequest, tenant);

      if (result.success) {
        return reply.send({
          success: true,
          message: 'Webhook replayed successfully',
          eventId: id,
        });
      } else {
        return reply.status(400).send({
          type: 'https://globapay.com/problems/bad-request',
          title: 'Webhook Replay Failed',
          status: 400,
          detail: result.error || 'Failed to replay webhook',
          instance: `/webhooks/${id}/replay`,
        });
      }
    } catch (error) {
      fastify.log.error('Webhook replay failed:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to replay webhook',
        instance: `/webhooks/${request.params.id}/replay`,
      });
    }
  });
}