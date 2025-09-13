# @globapay/sdk

OpenAPI-generated TypeScript client SDK for the Globapay Platform API.

## Features

- TypeScript client with full type safety
- Automatic OpenAPI schema generation
- Configurable base URL and authentication
- Built with openapi-fetch for optimal performance

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5+

### Installation

This package is part of the Globapay Platform monorepo and is consumed by other packages in the workspace.

### Usage

```typescript
import { createGlobapayClient } from '@globapay/sdk';

// Create client instance
const client = createGlobapayClient({
  baseUrl: 'http://localhost:3001',
  apiKey: 'your-api-key', // optional
});

// Use the client
const { data, error } = await client.GET('/health');

if (error) {
  console.error('API Error:', error);
} else {
  console.log('Health check:', data);
}
```

### Configuration

The client accepts the following configuration options:

```typescript
interface GlobapayClientConfig {
  baseUrl?: string;     // API base URL (default: http://localhost:3001)
  apiKey?: string;      // Optional API key for authentication
  headers?: Record<string, string>; // Additional headers
}
```

### Scripts

- `pnpm generate` - Generate client from OpenAPI specification
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run tests once

## Code Generation

The SDK is generated from the OpenAPI specification provided by the API server. To regenerate the client:

1. Ensure the API server is running and generating `openapi.json`
2. Run `pnpm generate` to update the generated client code

## Types

The package exports TypeScript types for all API operations, request/response schemas, and error types.