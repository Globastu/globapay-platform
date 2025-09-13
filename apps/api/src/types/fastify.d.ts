import type { AuthMiddleware } from '../modules/auth/middleware';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: AuthMiddleware['authenticate'];
    optionalAuthenticate: AuthMiddleware['optionalAuthenticate'];
    requireTenantScope: AuthMiddleware['requireTenantScope'];
    rateLimitByTenant: AuthMiddleware['rateLimitByTenant'];
    handleIdempotency: AuthMiddleware['handleIdempotency'];
  }
}