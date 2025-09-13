import { FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';

// Extend FastifyRequest to include custom properties
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    tenantId?: string;
    merchantId?: string;
    userId?: string;
    startTime: number;
  }
}

// Logger context interface
export interface LogContext {
  requestId: string;
  tenantId?: string;
  merchantId?: string;
  userId?: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  duration?: number;
  statusCode?: number;
}

/**
 * Middleware to add request context to logs
 */
export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Generate unique request ID
  request.requestId = randomBytes(16).toString('hex');
  request.startTime = Date.now();

  // Extract tenant information from auth context or headers
  if (request.user) {
    request.tenantId = request.user.organizationId;
    request.merchantId = request.user.merchantId;
    request.userId = request.user.id;
  }

  // Extract from headers if not in user context
  if (!request.tenantId) {
    request.tenantId = request.headers['x-tenant-id'] as string;
  }
  if (!request.merchantId) {
    request.merchantId = request.headers['x-merchant-id'] as string;
  }

  // Create log context
  const logContext: LogContext = {
    requestId: request.requestId,
    tenantId: request.tenantId,
    merchantId: request.merchantId,
    userId: request.userId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip || request.socket.remoteAddress || 'unknown',
  };

  // Add context to request for use in other middleware/handlers
  (request as any).logContext = logContext;

  // Log incoming request
  request.log.info(logContext, `Incoming ${request.method} ${request.url}`);

  // Hook for logging response
  reply.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - request.startTime;
    const responseContext: LogContext = {
      ...logContext,
      duration,
      statusCode: reply.statusCode,
    };

    if (reply.statusCode >= 400) {
      request.log.error(responseContext, `Request failed with status ${reply.statusCode}`);
    } else {
      request.log.info(responseContext, `Request completed in ${duration}ms`);
    }

    return payload;
  });
}

/**
 * Create a structured logger with request context
 */
export function createContextLogger(request: FastifyRequest) {
  const context = (request as any).logContext || {};
  
  return {
    info: (message: string, extra?: Record<string, any>) => {
      request.log.info({ ...context, ...extra }, message);
    },
    warn: (message: string, extra?: Record<string, any>) => {
      request.log.warn({ ...context, ...extra }, message);
    },
    error: (message: string, extra?: Record<string, any>) => {
      request.log.error({ ...context, ...extra }, message);
    },
    debug: (message: string, extra?: Record<string, any>) => {
      request.log.debug({ ...context, ...extra }, message);
    },
  };
}

/**
 * Get current request context for logging
 */
export function getRequestContext(request: FastifyRequest): LogContext {
  return (request as any).logContext || {
    requestId: 'unknown',
    method: request.method,
    url: request.url,
    ip: request.ip || 'unknown',
  };
}