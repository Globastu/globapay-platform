import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { TenantContext, AuthenticatedUser, AuthenticatedApiKey } from './types';
import { JwtService } from './jwt.service';
import { ApiKeyService } from './api-key.service';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    user?: AuthenticatedUser;
    apiKey?: AuthenticatedApiKey;
  }
}

export class AuthMiddleware {
  constructor(
    private jwtService: JwtService,
    private apiKeyService: ApiKeyService
  ) {}

  /**
   * Authentication middleware - verifies JWT or API key
   */
  authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'] as string;

    try {
      if (authHeader?.startsWith('Bearer ')) {
        // JWT Authentication
        const token = authHeader.substring(7);
        const user = await this.jwtService.verifyToken(token);
        request.user = user;
        
        // Set tenant context from user
        request.tenant = {
          organizationId: user.organizationId,
          merchantId: user.merchantId,
          userId: user.id,
          permissions: user.permissions,
          isApiKey: false,
        };
      } else if (apiKeyHeader) {
        // API Key Authentication
        const apiKey = await this.apiKeyService.verifyApiKey(apiKeyHeader);
        request.apiKey = apiKey;
        
        // Set tenant context from API key
        request.tenant = {
          organizationId: apiKey.organizationId,
          merchantId: apiKey.merchantId,
          permissions: apiKey.permissions,
          isApiKey: true,
        };
      } else {
        throw new Error('No authentication provided');
      }
    } catch (error) {
      return reply.status(401).send({
        type: 'https://globapay.com/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  /**
   * Optional authentication - allows unauthenticated requests to continue
   */
  optionalAuthenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'] as string;

    if (!authHeader && !apiKeyHeader) {
      return; // No auth provided, continue without setting context
    }

    try {
      await this.authenticate(request, reply);
    } catch (error) {
      // For optional auth, we don't fail the request
      // Just continue without authentication context
      return;
    }
  };

  /**
   * Tenant scoping middleware - ensures requests are scoped to user's tenant
   */
  requireTenantScope = (options: {
    organizationScope?: boolean;
    merchantScope?: boolean;
  } = {}) => {
    return async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> => {
      const { organizationScope = true, merchantScope = false } = options;
      
      if (!request.tenant) {
        return reply.status(401).send({
          type: 'https://globapay.com/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        });
      }

      // Extract tenant IDs from request params/query
      const requestOrgId = request.params?.organizationId || request.query?.organizationId;
      const requestMerchantId = request.params?.merchantId || request.query?.merchantId;

      // Check organization scope
      if (organizationScope && requestOrgId) {
        if (requestOrgId !== request.tenant.organizationId) {
          return reply.status(403).send({
            type: 'https://globapay.com/errors/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: 'Access denied to this organization',
          });
        }
      }

      // Check merchant scope
      if (merchantScope && requestMerchantId) {
        // If user/api key is scoped to a specific merchant, enforce it
        if (request.tenant.merchantId && requestMerchantId !== request.tenant.merchantId) {
          return reply.status(403).send({
            type: 'https://globapay.com/errors/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: 'Access denied to this merchant',
          });
        }
      }
    };
  };

  /**
   * Rate limiting middleware based on tenant
   */
  rateLimitByTenant = (options: {
    windowMs?: number;
    maxRequests?: number;
  } = {}) => {
    const { windowMs = 15 * 60 * 1000, maxRequests = 1000 } = options;
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> => {
      if (!request.tenant) {
        return; // No tenant context, skip rate limiting
      }

      const key = request.tenant.isApiKey 
        ? `api:${request.tenant.organizationId}:${request.tenant.merchantId || 'global'}`
        : `user:${request.tenant.organizationId}:${request.tenant.userId}`;
      
      const now = Date.now();
      const current = requestCounts.get(key);
      
      if (!current || now > current.resetTime) {
        // Reset window
        requestCounts.set(key, { count: 1, resetTime: now + windowMs });
        return;
      }
      
      if (current.count >= maxRequests) {
        return reply.status(429).send({
          type: 'https://globapay.com/errors/rate-limit-exceeded',
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded. Please try again later.',
        });
      }
      
      current.count++;
    };
  };

  /**
   * Idempotency middleware for write operations
   */
  handleIdempotency = () => {
    const idempotencyStore = new Map<string, { response: any; timestamp: number }>();
    const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

    return async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void> => {
      const idempotencyKey = request.headers['idempotency-key'] as string;
      
      if (!idempotencyKey) {
        return; // No idempotency key, continue normally
      }

      if (!request.tenant) {
        return; // No tenant context, can't scope idempotency
      }

      // Create scoped key
      const scopedKey = `${request.tenant.organizationId}:${idempotencyKey}`;
      const stored = idempotencyStore.get(scopedKey);
      
      if (stored) {
        // Check if still valid
        if (Date.now() - stored.timestamp < IDEMPOTENCY_TTL) {
          return reply.send(stored.response);
        } else {
          // Expired, remove
          idempotencyStore.delete(scopedKey);
        }
      }
      
      // Store the key for later use in response handler
      (request as any).idempotencyKey = scopedKey;
    };
  };
}

// Utility function to get tenant-scoped query filters
export function getTenantScopeFilters(tenant: TenantContext): {
  organizationId?: string;
  merchantId?: string;
} {
  const filters: { organizationId?: string; merchantId?: string } = {};
  
  if (tenant.organizationId) {
    filters.organizationId = tenant.organizationId;
  }
  
  if (tenant.merchantId) {
    filters.merchantId = tenant.merchantId;
  }
  
  return filters;
}

// Utility function to check if user can access a resource
export function canAccessResource(
  tenant: TenantContext,
  resourceOrgId: string,
  resourceMerchantId?: string
): boolean {
  // Check organization access
  if (tenant.organizationId !== resourceOrgId) {
    return false;
  }
  
  // If tenant is scoped to a specific merchant, check merchant access
  if (tenant.merchantId && resourceMerchantId && tenant.merchantId !== resourceMerchantId) {
    return false;
  }
  
  return true;
}