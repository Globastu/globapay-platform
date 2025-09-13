// Middleware registration and exports
import { FastifyInstance } from 'fastify';
import { loggingMiddleware } from './logging.middleware';
import { metricsMiddleware } from './metrics.middleware';

export * from './logging.middleware';
export * from './metrics.middleware';

/**
 * Register all observability middleware with Fastify
 */
export async function registerObservabilityMiddleware(fastify: FastifyInstance) {
  // Register logging middleware first (sets up request context)
  fastify.addHook('preHandler', loggingMiddleware);
  
  // Register metrics middleware (depends on logging context)
  fastify.addHook('preHandler', metricsMiddleware);
  
  console.log('Observability middleware registered');
}

/**
 * Example usage in main server file:
 * 
 * ```typescript
 * import Fastify from 'fastify';
 * import { initializeObservability } from './observability';
 * import { registerObservabilityMiddleware } from './middleware';
 * 
 * // Initialize observability before creating the server
 * initializeObservability();
 * 
 * const fastify = Fastify({
 *   logger: {
 *     level: 'info',
 *     prettyPrint: process.env.NODE_ENV === 'development',
 *   },
 * });
 * 
 * // Register observability middleware
 * await registerObservabilityMiddleware(fastify);
 * 
 * // Register your routes...
 * await fastify.register(routes);
 * 
 * // Start server
 * await fastify.listen({ port: 3001, host: '0.0.0.0' });
 * ```
 */