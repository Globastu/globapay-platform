# @globapay/api

Fastify-based API server for the Globapay Platform.

## Features

- Fastify with TypeScript
- OpenAPI 3.1 documentation with Swagger UI
- CORS and security middleware
- Structured logging with Pino
- Vitest for testing
- ESLint and Prettier for code quality

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Scripts

- `pnpm dev` - Start development server with watch mode
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run tests once

## API Documentation

When the server is running, API documentation is available at:
- http://localhost:3001/docs

## Environment Variables

Create a `.env` file in the app root:

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globapay
REDIS_URL=redis://localhost:6379
```

## Docker

Build and run with Docker:

```bash
docker build -t globapay-api .
docker run -p 3001:3001 globapay-api
```