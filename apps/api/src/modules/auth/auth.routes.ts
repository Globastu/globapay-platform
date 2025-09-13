import type { FastifyInstance } from 'fastify';
import type { LoginCredentials, LoginResponse } from './types';
import { JwtService } from './jwt.service';
import { ApiKeyService } from './api-key.service';
import { AuditService } from '../audit/audit.service';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const jwtService = new JwtService(fastify);
  const apiKeyService = new ApiKeyService();

  // Login endpoint
  fastify.post<{
    Body: LoginCredentials;
    Reply: LoginResponse;
  }>('/auth/token', {
    schema: {
      tags: ['Authentication'],
      description: 'Authenticate user and get access token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          mfaToken: { type: 'string', pattern: '^\\d{6}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
            tokenType: { type: 'string', enum: ['Bearer'] },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                organizationId: { type: 'string', format: 'uuid' },
                permissions: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        400: { $ref: 'ProblemDetails' },
        401: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    try {
      const clientIp = request.ip;
      const userAgent = request.headers['user-agent'];
      
      const result = await jwtService.login(request.body);
      
      // Log successful login
      await AuditService.logUserLogin(
        result.user.id,
        result.user.organizationId,
        'SUCCESS',
        clientIp,
        userAgent
      );
      
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      
      // Try to get user ID for failed login audit
      // This is best effort - if we can't find the user, we still log the attempt
      try {
        const { prisma } = await import('../../lib/prisma');
        const user = await prisma.user.findUnique({
          where: { email: request.body.email },
          include: {
            organizations: {
              take: 1,
              select: { organizationId: true },
            },
          },
        });
        
        if (user && user.organizations[0]) {
          await AuditService.logUserLogin(
            user.id,
            user.organizations[0].organizationId,
            'FAILURE',
            request.ip,
            request.headers['user-agent'],
            message
          );
        }
      } catch (auditError) {
        // Ignore audit errors for failed login attempts
      }
      
      return reply.status(401).send({
        type: 'https://globapay.com/errors/authentication-failed',
        title: 'Authentication Failed',
        status: 401,
        detail: message,
      });
    }
  });

  // Refresh token endpoint
  fastify.post<{
    Body: { refreshToken: string };
    Reply: { accessToken: string };
  }>('/auth/refresh', {
    schema: {
      tags: ['Authentication'],
      description: 'Refresh access token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
          },
        },
        401: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await jwtService.refreshToken(request.body.refreshToken);
      return reply.send(result);
    } catch (error) {
      return reply.status(401).send({
        type: 'https://globapay.com/errors/invalid-refresh-token',
        title: 'Invalid Refresh Token',
        status: 401,
        detail: 'Refresh token is invalid or expired',
      });
    }
  });

  // Get current user info
  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      description: 'Get current user information',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            organizationId: { type: 'string', format: 'uuid' },
            roleId: { type: 'string', format: 'uuid' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        401: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    return reply.send(request.user);
  });

  // Logout endpoint
  fastify.post('/auth/logout', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      description: 'Logout user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Log logout
    if (request.user) {
      await AuditService.logUserLogout(
        request.user.id,
        request.user.organizationId,
        request.ip,
        request.headers['user-agent']
      );
    }
    
    await jwtService.logout(request.user!.id);
    
    return reply.send({
      message: 'Successfully logged out',
    });
  });

  // API Key Management Routes
  
  // Create API key
  fastify.post<{
    Body: {
      name: string;
      merchantId?: string;
      permissions: string[];
      expiresAt?: string;
    };
    Reply: {
      apiKey: string;
      id: string;
    };
  }>('/auth/api-keys', {
    preHandler: [fastify.authenticate, fastify.requireTenantScope()],
    schema: {
      tags: ['API Keys'],
      description: 'Create a new API key',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'permissions'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          merchantId: { type: 'string', format: 'uuid' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            apiKey: { type: 'string' },
            id: { type: 'string', format: 'uuid' },
          },
        },
        400: { $ref: 'ProblemDetails' },
        401: { $ref: 'ProblemDetails' },
        403: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    const { name, merchantId, permissions, expiresAt } = request.body;
    
    // Check permissions
    if (!request.tenant!.permissions.includes('API_KEYS_WRITE')) {
      return reply.status(403).send({
        type: 'https://globapay.com/errors/insufficient-permissions',
        title: 'Insufficient Permissions',
        status: 403,
        detail: 'You do not have permission to create API keys',
      });
    }
    
    try {
      const result = await apiKeyService.createApiKey({
        name,
        organizationId: request.tenant!.organizationId,
        merchantId: merchantId || request.tenant!.merchantId,
        permissions: permissions as any[],
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      // Log API key creation
      await AuditService.logApiKeyCreate(
        request.tenant!,
        result.id,
        name,
        permissions,
        request.ip,
        request.headers['user-agent']
      );
      
      return reply.status(201).send(result);
    } catch (error) {
      return reply.status(400).send({
        type: 'https://globapay.com/errors/api-key-creation-failed',
        title: 'API Key Creation Failed',
        status: 400,
        detail: error instanceof Error ? error.message : 'Failed to create API key',
      });
    }
  });

  // List API keys
  fastify.get('/auth/api-keys', {
    preHandler: [fastify.authenticate, fastify.requireTenantScope()],
    schema: {
      tags: ['API Keys'],
      description: 'List API keys',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          merchantId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  keyPrefix: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  isActive: { type: 'boolean' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        401: { $ref: 'ProblemDetails' },
        403: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    // Check permissions
    if (!request.tenant!.permissions.includes('API_KEYS_READ')) {
      return reply.status(403).send({
        type: 'https://globapay.com/errors/insufficient-permissions',
        title: 'Insufficient Permissions',
        status: 403,
        detail: 'You do not have permission to read API keys',
      });
    }
    
    const { merchantId } = request.query as any;
    
    const apiKeys = await apiKeyService.listApiKeys(
      request.tenant!.organizationId,
      merchantId || request.tenant!.merchantId
    );
    
    return reply.send({ apiKeys });
  });

  // Revoke API key
  fastify.delete<{
    Params: { keyId: string };
  }>('/auth/api-keys/:keyId', {
    preHandler: [fastify.authenticate, fastify.requireTenantScope()],
    schema: {
      tags: ['API Keys'],
      description: 'Revoke an API key',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['keyId'],
        properties: {
          keyId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: { $ref: 'ProblemDetails' },
        403: { $ref: 'ProblemDetails' },
        404: { $ref: 'ProblemDetails' },
      },
    },
  }, async (request, reply) => {
    // Check permissions
    if (!request.tenant!.permissions.includes('API_KEYS_DELETE')) {
      return reply.status(403).send({
        type: 'https://globapay.com/errors/insufficient-permissions',
        title: 'Insufficient Permissions',
        status: 403,
        detail: 'You do not have permission to revoke API keys',
      });
    }
    
    const { keyId } = request.params;
    
    try {
      // Get key details before revoking for audit log
      const { prisma } = await import('../../lib/prisma');
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          organizationId: request.tenant!.organizationId,
          ...(request.tenant!.merchantId && { merchantId: request.tenant!.merchantId }),
        },
      });
      
      if (!apiKey) {
        return reply.status(404).send({
          type: 'https://globapay.com/errors/api-key-not-found',
          title: 'API Key Not Found',
          status: 404,
          detail: 'The specified API key was not found',
        });
      }
      
      await apiKeyService.revokeApiKey(keyId);
      
      // Log API key revocation
      await AuditService.logApiKeyRevoke(
        request.tenant!,
        keyId,
        apiKey.name,
        undefined,
        request.ip,
        request.headers['user-agent']
      );
      
      return reply.send({
        message: 'API key successfully revoked',
      });
    } catch (error) {
      return reply.status(400).send({
        type: 'https://globapay.com/errors/api-key-revocation-failed',
        title: 'API Key Revocation Failed',
        status: 400,
        detail: error instanceof Error ? error.message : 'Failed to revoke API key',
      });
    }
  });
}