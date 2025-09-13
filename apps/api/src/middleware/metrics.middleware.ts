import { FastifyRequest, FastifyReply } from 'fastify';
import { recordHttpRequest } from '../observability/metrics';

/**
 * Middleware to collect HTTP request metrics
 */
export async function metricsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Add hook for recording metrics after response
  reply.addHook('onSend', async (request, reply, payload) => {
    const duration = (Date.now() - request.startTime) / 1000; // Convert to seconds
    
    // Clean up the URL path for metrics (remove dynamic segments)
    const cleanPath = cleanUrlPath(request.url);
    
    recordHttpRequest(
      request.method,
      cleanPath,
      reply.statusCode,
      duration,
      request.tenantId
    );

    return payload;
  });
}

/**
 * Clean URL path for metrics collection
 * Replaces dynamic segments with placeholders to avoid high cardinality
 */
function cleanUrlPath(path: string): string {
  return path
    // Replace UUIDs with placeholder
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    // Replace other IDs (alphanumeric strings > 8 chars)
    .replace(/\/[a-zA-Z0-9]{8,}/g, '/:id')
    // Replace payment link short codes
    .replace(/\/[A-Z0-9]{8}/g, '/:code')
    // Remove query parameters
    .split('?')[0];
}