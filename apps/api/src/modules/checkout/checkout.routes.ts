import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CheckoutService } from './checkout.service';
import type { TenantContext } from '../auth/types';
import { AuditService } from '../audit/audit.service';

// Request type definitions
interface CreateCheckoutSessionBody {
  paymentLinkId?: string;
  merchantId?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
  require3DS?: boolean;
  skipFraudCheck?: boolean;
}

interface CheckoutSessionParams {
  token: string;
}

interface CompleteCheckoutSessionBody {
  transactionId: string;
  fraudScore?: number;
}

export async function checkoutRoutes(fastify: FastifyInstance) {
  const checkoutService = new CheckoutService(fastify.prisma);

  // POST /checkout/sessions - Create checkout session
  fastify.post<{
    Body: CreateCheckoutSessionBody;
  }>('/checkout/sessions', {
    preHandler: [fastify.authenticate, fastify.requireMerchant],
    schema: {
      body: {
        type: 'object',
        properties: {
          paymentLinkId: { type: 'string', format: 'uuid' },
          merchantId: { type: 'string', format: 'uuid' },
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          customerEmail: { type: 'string', format: 'email' },
          customerName: { type: 'string', maxLength: 255 },
          description: { type: 'string', minLength: 1, maxLength: 1000 },
          metadata: { type: 'object', additionalProperties: { type: 'string' } },
          returnUrl: { type: 'string', format: 'uri' },
          cancelUrl: { type: 'string', format: 'uri' },
          require3DS: { type: 'boolean' },
          skipFraudCheck: { type: 'boolean' },
        },
        // Either paymentLinkId OR (amount + currency + description) required
        anyOf: [
          { required: ['paymentLinkId'] },
          { required: ['amount', 'currency', 'description'] }
        ],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                token: { type: 'string' },
                paymentLinkId: { type: 'string' },
                merchantId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                description: { type: 'string' },
                customerEmail: { type: 'string' },
                customerName: { type: 'string' },
                status: { type: 'string', enum: ['active', 'expired', 'completed', 'cancelled'] },
                checkoutUrl: { type: 'string', format: 'uri' },
                returnUrl: { type: 'string', format: 'uri' },
                cancelUrl: { type: 'string', format: 'uri' },
                require3DS: { type: 'boolean' },
                skipFraudCheck: { type: 'boolean' },
                fraudScore: { type: 'number' },
                expiresAt: { type: 'string', format: 'date-time' },
                completedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                metadata: { type: 'object' },
              },
              required: ['id', 'token', 'merchantId', 'amount', 'currency', 'description', 'status', 'checkoutUrl', 'require3DS', 'skipFraudCheck', 'expiresAt', 'createdAt', 'updatedAt'],
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: CreateCheckoutSessionBody }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;

      const session = await checkoutService.createCheckoutSession(
        request.body,
        tenant
      );

      // Log checkout session creation
      await AuditService.logCheckoutSessionCreated(
        tenant,
        session.id,
        session.paymentLinkId,
        session.amount,
        session.currency
      );

      return reply.status(201).send({ data: session });
    } catch (error) {
      request.log.error({ error }, 'Failed to create checkout session');

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('expired')) {
          return reply.status(404).send({
            type: 'https://globapay.com/problems/not-found',
            title: 'Payment Link Not Found',
            status: 404,
            detail: error.message,
            instance: '/checkout/sessions',
          });
        }

        if (error.message.includes('must be provided')) {
          return reply.status(400).send({
            type: 'https://globapay.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: error.message,
            instance: '/checkout/sessions',
          });
        }
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: '/checkout/sessions',
      });
    }
  });

  // GET /checkout/sessions/:token - Get checkout session by token (public endpoint)
  fastify.get<{
    Params: CheckoutSessionParams;
  }>('/checkout/sessions/:token', {
    // Public endpoint - no authentication required
    schema: {
      params: {
        type: 'object',
        properties: {
          token: { type: 'string', minLength: 64, maxLength: 64 },
        },
        required: ['token'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                token: { type: 'string' },
                merchantId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                description: { type: 'string' },
                customerEmail: { type: 'string' },
                customerName: { type: 'string' },
                status: { type: 'string' },
                require3DS: { type: 'boolean' },
                skipFraudCheck: { type: 'boolean' },
                expiresAt: { type: 'string' },
                metadata: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: CheckoutSessionParams }>, reply: FastifyReply) => {
    try {
      const { token } = request.params;

      const session = await checkoutService.getCheckoutSession(token);

      if (!session) {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Checkout Session Not Found',
          status: 404,
          detail: `Checkout session with token '${token}' was not found.`,
          instance: `/checkout/sessions/${token}`,
        });
      }

      // Don't expose sensitive information in public endpoint
      const publicSession = {
        id: session.id,
        token: session.token,
        merchantId: session.merchantId,
        amount: session.amount,
        currency: session.currency,
        description: session.description,
        customerEmail: session.customerEmail,
        customerName: session.customerName,
        status: session.status,
        require3DS: session.require3DS,
        skipFraudCheck: session.skipFraudCheck,
        expiresAt: session.expiresAt,
        metadata: session.metadata,
      };

      return reply.send({ data: publicSession });
    } catch (error) {
      request.log.error({ error }, 'Failed to get checkout session');

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/checkout/sessions/${request.params.token}`,
      });
    }
  });

  // POST /checkout/sessions/:token/complete - Complete checkout session (webhook endpoint)
  fastify.post<{
    Params: CheckoutSessionParams;
    Body: CompleteCheckoutSessionBody;
  }>('/checkout/sessions/:token/complete', {
    preHandler: [fastify.authenticate], // API key auth typically for webhooks
    schema: {
      params: {
        type: 'object',
        properties: {
          token: { type: 'string', minLength: 64, maxLength: 64 },
        },
        required: ['token'],
      },
      body: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', format: 'uuid' },
          fraudScore: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['transactionId'],
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
                completedAt: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: CheckoutSessionParams; Body: CompleteCheckoutSessionBody }>, reply: FastifyReply) => {
    try {
      const { token } = request.params;
      const { transactionId, fraudScore } = request.body;

      const session = await checkoutService.completeCheckoutSession(
        token,
        transactionId,
        fraudScore
      );

      // Log completion (this would typically be called by PSP webhook)
      const tenant = request.tenantContext as TenantContext;
      await AuditService.logCheckoutSessionCompleted(
        tenant,
        session.id,
        transactionId,
        fraudScore
      );

      return reply.send({
        data: {
          id: session.id,
          status: session.status,
          completedAt: session.completedAt,
        },
        message: 'Checkout session completed successfully',
      });
    } catch (error) {
      request.log.error({ error }, 'Failed to complete checkout session');

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({
            type: 'https://globapay.com/problems/not-found',
            title: 'Checkout Session Not Found',
            status: 404,
            detail: error.message,
            instance: `/checkout/sessions/${request.params.token}/complete`,
          });
        }

        if (error.message.includes('not active')) {
          return reply.status(400).send({
            type: 'https://globapay.com/problems/invalid-state',
            title: 'Invalid State',
            status: 400,
            detail: error.message,
            instance: `/checkout/sessions/${request.params.token}/complete`,
          });
        }
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/checkout/sessions/${request.params.token}/complete`,
      });
    }
  });

  // POST /checkout/sessions/:token/cancel - Cancel checkout session
  fastify.post<{
    Params: CheckoutSessionParams;
  }>('/checkout/sessions/:token/cancel', {
    // Public endpoint - no authentication required (user can cancel their own session)
    schema: {
      params: {
        type: 'object',
        properties: {
          token: { type: 'string', minLength: 64, maxLength: 64 },
        },
        required: ['token'],
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
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: CheckoutSessionParams }>, reply: FastifyReply) => {
    try {
      const { token } = request.params;

      const session = await checkoutService.cancelCheckoutSession(token);

      return reply.send({
        data: {
          id: session.id,
          status: session.status,
        },
        message: 'Checkout session cancelled successfully',
      });
    } catch (error) {
      request.log.error({ error }, 'Failed to cancel checkout session');

      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Checkout Session Not Found',
          status: 404,
          detail: error.message,
          instance: `/checkout/sessions/${request.params.token}/cancel`,
        });
      }

      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance: `/checkout/sessions/${request.params.token}/cancel`,
      });
    }
  });
}