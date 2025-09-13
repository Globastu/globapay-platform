import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { JwtService, ApiKeyService, AuthMiddleware, authRoutes } from './modules/auth/index';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadOpenAPISpec(): Record<string, unknown> {
  try {
    const openApiPath = join(__dirname, '../../..', 'contracts', 'openapi.yaml');
    const openApiContent = readFileSync(openApiPath, 'utf8');
    return yaml.load(openApiContent) as Record<string, unknown>;
  } catch (error) {
    console.warn('Failed to load OpenAPI spec from contracts/openapi.yaml, using fallback');
    return {
      openapi: '3.1.0',
      info: {
        title: 'Globapay Platform API',
        description: 'Multi-tenant payments orchestration API',
        version: '0.1.0',
      },
      paths: {},
    };
  }
}

async function buildServer(): Promise<ReturnType<typeof Fastify>> {
  const server = Fastify({
    logger: {
      level: 'info',
    },
  });

  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
  });

  await server.register(helmet);

  // Register JWT plugin
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  });

  // Set up authentication services
  const jwtService = new JwtService(server);
  const apiKeyService = new ApiKeyService();
  const authMiddleware = new AuthMiddleware(jwtService, apiKeyService);

  // Register authentication decorators
  server.decorate('authenticate', authMiddleware.authenticate);
  server.decorate('optionalAuthenticate', authMiddleware.optionalAuthenticate);
  server.decorate('requireTenantScope', authMiddleware.requireTenantScope);
  server.decorate('rateLimitByTenant', authMiddleware.rateLimitByTenant);
  server.decorate('handleIdempotency', authMiddleware.handleIdempotency);

  const openApiSpec = loadOpenAPISpec();
  await server.register(swagger, {
    openapi: openApiSpec,
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  server.get('/health', async (): Promise<{ status: string; timestamp: string }> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // Serve OpenAPI spec as JSON
  server.get('/openapi.json', async () => {
    return server.swagger();
  });

  // Register auth routes
  await server.register(authRoutes);

  return server;
}

async function start(): Promise<void> {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`API docs available at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}