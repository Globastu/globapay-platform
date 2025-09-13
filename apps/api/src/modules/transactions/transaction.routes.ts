import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService, type TransactionListFilters, type RefundRequest } from './transaction.service';
import type { TenantContext } from '../auth/types';

interface TransactionParams {
  id: string;
}

interface TransactionListQuery {
  status?: string;
  paymentLinkId?: string;
  merchantId?: string;
  customerEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  currency?: string;
  paymentMethod?: string;
  search?: string;
  page?: string;
  limit?: string;
  export?: string; // 'csv' for CSV export
}

export async function transactionRoutes(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // GET /transactions - List transactions with filters and pagination
  fastify.get<{
    Querystring: TransactionListQuery;
  }>('/transactions', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'] 
          },
          paymentLinkId: { type: 'string', format: 'uuid' },
          merchantId: { type: 'string', format: 'uuid' },
          customerEmail: { type: 'string', format: 'email' },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          minAmount: { type: 'string', pattern: '^[0-9]+$' },
          maxAmount: { type: 'string', pattern: '^[0-9]+$' },
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          paymentMethod: { type: 'string' },
          search: { type: 'string', maxLength: 100 },
          page: { type: 'string', pattern: '^[0-9]+$' },
          limit: { type: 'string', pattern: '^[0-9]+$' },
          export: { type: 'string', enum: ['csv'] },
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
                  merchantId: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  customerEmail: { type: 'string', nullable: true },
                  customerName: { type: 'string', nullable: true },
                  paymentMethodType: { type: 'string', nullable: true },
                  fraudScore: { type: 'number', nullable: true },
                  require3DS: { type: 'boolean' },
                  refundedAmount: { type: 'number', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  completedAt: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: TransactionListQuery }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const {
        status,
        paymentLinkId,
        merchantId,
        customerEmail,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        currency,
        paymentMethod,
        search,
        page = '1',
        limit = '20',
        export: exportFormat,
      } = request.query;

      // Parse filters
      const filters: TransactionListFilters = {
        status: status as any,
        paymentLinkId,
        merchantId,
        customerEmail,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        minAmount: minAmount ? parseInt(minAmount, 10) : undefined,
        maxAmount: maxAmount ? parseInt(maxAmount, 10) : undefined,
        currency,
        paymentMethod,
        search,
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10), 100), // Max 100 per page
      };

      const result = await transactionService.getTransactions(tenant, filters);

      // Handle CSV export
      if (exportFormat === 'csv') {
        const csv = transactionService.generateTransactionsCSV(result.transactions);
        const filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);
        return csv;
      }

      // Return JSON response
      return reply.send({
        data: result.transactions.map(tx => ({
          id: tx.id,
          merchantId: tx.merchantId,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description,
          status: tx.status,
          customerEmail: tx.customerEmail,
          customerName: tx.customerName,
          paymentMethodType: tx.paymentMethodType,
          fraudScore: tx.fraudScore,
          require3DS: tx.require3DS,
          refundedAmount: tx.refundedAmount,
          createdAt: tx.createdAt.toISOString(),
          completedAt: tx.completedAt?.toISOString(),
          paymentLink: tx.paymentLink,
          refunds: tx.refunds?.length || 0,
        })),
        pagination: result.pagination,
      });
    } catch (error) {
      fastify.log.error('Failed to list transactions:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve transactions',
        instance: '/transactions',
      });
    }
  });

  // GET /transactions/{id} - Get transaction details
  fastify.get<{
    Params: TransactionParams;
  }>('/transactions/:id', {
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
                merchantId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                customerEmail: { type: 'string', nullable: true },
                customerName: { type: 'string', nullable: true },
                paymentMethodType: { type: 'string', nullable: true },
                reference: { type: 'string', nullable: true },
                fraudScore: { type: 'number', nullable: true },
                require3DS: { type: 'boolean' },
                threeDSStatus: { type: 'string', nullable: true },
                processorTransactionId: { type: 'string', nullable: true },
                failureCode: { type: 'string', nullable: true },
                failureMessage: { type: 'string', nullable: true },
                refundedAmount: { type: 'number', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                completedAt: { type: 'string', format: 'date-time', nullable: true },
                fees: { type: 'array' },
                refunds: { type: 'array' },
                paymentLink: { type: 'object', nullable: true },
                checkoutSession: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: TransactionParams }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;

      const transaction = await transactionService.getTransactionById(id, tenant);

      if (!transaction) {
        return reply.status(404).send({
          type: 'https://globapay.com/problems/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: 'The requested transaction was not found',
          instance: `/transactions/${id}`,
        });
      }

      return reply.send({ data: transaction });
    } catch (error) {
      fastify.log.error('Failed to get transaction:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve transaction',
        instance: `/transactions/${request.params.id}`,
      });
    }
  });

  // POST /transactions/{id}/refund - Refund transaction
  fastify.post<{
    Params: TransactionParams;
    Body: RefundRequest;
  }>('/transactions/:id/refund', {
    preHandler: [fastify.authenticate, fastify.requirePermission('WRITE', 'TRANSACTION')],
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
        properties: {
          amount: { 
            type: 'number', 
            minimum: 1,
            description: 'Refund amount in cents'
          },
          reason: { 
            type: 'string', 
            maxLength: 500,
            description: 'Reason for refund'
          },
          metadata: { 
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Additional metadata'
          },
        },
        required: ['amount'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                transactionId: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                reason: { type: 'string', nullable: true },
                status: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: TransactionParams; Body: RefundRequest }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { id } = request.params;
      const refundRequest = request.body;

      // Get client IP and user agent for audit logging
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];

      const result = await transactionService.refundTransaction(
        id,
        refundRequest,
        tenant,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        return reply.status(400).send({
          type: 'https://globapay.com/problems/bad-request',
          title: 'Refund Failed',
          status: 400,
          detail: result.error || 'Failed to process refund',
          instance: `/transactions/${id}/refund`,
        });
      }

      return reply.send({
        success: true,
        data: result.refund,
        message: 'Refund processed successfully',
      });
    } catch (error) {
      fastify.log.error('Refund processing failed:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to process refund',
        instance: `/transactions/${request.params.id}/refund`,
      });
    }
  });

  // GET /transactions/stats - Get transaction statistics
  fastify.get('/transactions/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                totalTransactions: { type: 'number' },
                totalAmount: { type: 'number' },
                completedTransactions: { type: 'number' },
                completedAmount: { type: 'number' },
                refundedTransactions: { type: 'number' },
                refundedAmount: { type: 'number' },
                averageTransactionAmount: { type: 'number' },
                successRate: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: { dateFrom?: string; dateTo?: string } }>, reply: FastifyReply) => {
    try {
      const tenant = request.tenantContext as TenantContext;
      const { dateFrom, dateTo } = request.query;

      const stats = await transactionService.getTransactionStats(
        tenant,
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined
      );

      return reply.send({ data: stats });
    } catch (error) {
      fastify.log.error('Failed to get transaction stats:', error);
      return reply.status(500).send({
        type: 'https://globapay.com/problems/server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to retrieve transaction statistics',
        instance: '/transactions/stats',
      });
    }
  });
}