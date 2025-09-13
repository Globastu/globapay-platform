# Globapay Platform API Documentation

## Overview

The Globapay Platform API follows a **contract-first development approach** using OpenAPI 3.1 specification. All API endpoints, request/response schemas, and validation rules are defined in the OpenAPI specification, which serves as the single source of truth for both API implementation and client SDK generation.

## OpenAPI Specification

### Location
The master OpenAPI specification is located at:
```
contracts/openapi.yaml
```

### Key Features
- **OpenAPI 3.1** - Latest specification version with enhanced JSON Schema support
- **Full Type Safety** - Complete TypeScript types generated from contracts
- **Request/Response Validation** - Automatic validation against schemas
- **Interactive Documentation** - Auto-generated API docs with Swagger UI
- **Multi-Environment Support** - Development and production server configurations

### Viewing the API Documentation
When running the API server, interactive documentation is available at:
- **Development**: http://localhost:3001/docs
- **Production**: https://api.globapay.com/docs

## SDK Generation Guide

The TypeScript SDK is automatically generated from the OpenAPI specification using `openapi-typescript` and `openapi-fetch`.

### Regenerating the SDK

#### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Updated OpenAPI specification in `contracts/openapi.yaml`

#### Step 1: Update the OpenAPI Specification
Make your changes to the master contract file:
```bash
# Edit the OpenAPI specification
vim contracts/openapi.yaml

# Or use your preferred editor
code contracts/openapi.yaml
```

#### Step 2: Generate TypeScript Types
```bash
# Navigate to SDK package
cd packages/sdk

# Generate types from OpenAPI spec
pnpm generate

# This runs: openapi-typescript ../../contracts/openapi.yaml --output src/generated/types.ts
```

#### Step 3: Build the SDK
```bash
# Compile TypeScript
pnpm build

# Run type checking
pnpm typecheck

# Run tests (if any)
pnpm test
```

#### Step 4: Verify Generation
Check that the types were generated correctly:
```bash
# Check generated file
cat src/generated/types.ts

# Verify exports
head -20 src/index.ts
```

### Automated Generation via Workspace Commands

You can also regenerate the SDK from the repository root:

```bash
# From repository root
pnpm -F @globapay/sdk generate
pnpm -F @globapay/sdk build

# Or run across all packages
pnpm build  # This includes SDK generation
```

### SDK Structure

```
packages/sdk/
├── src/
│   ├── generated/
│   │   └── types.ts          # Auto-generated from OpenAPI
│   ├── client.ts             # HTTP client configuration
│   ├── auth.ts              # Authentication helpers
│   └── index.ts             # Public exports
├── package.json
└── tsconfig.json
```

### Using the Generated SDK

#### Installation (Internal Workspace)
The SDK is used internally within the monorepo:
```json
{
  "dependencies": {
    "@globapay/sdk": "workspace:*"
  }
}
```

#### Basic Usage
```typescript
import { createClient } from '@globapay/sdk';

// Create authenticated client
const client = createClient({
  baseUrl: 'https://api.globapay.com',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Make type-safe API calls
const { data: paymentLinks } = await client.GET('/payment-links', {
  params: {
    query: {
      limit: 20,
      status: 'active'
    }
  }
});

// Create payment link with full type safety
const { data: newLink } = await client.POST('/payment-links', {
  body: {
    amount: 10000,
    currency: 'USD',
    description: 'Healthcare consultation',
    customerEmail: 'patient@example.com'
  }
});
```

#### Error Handling
```typescript
try {
  const { data, error } = await client.POST('/payment-links', {
    body: invalidData
  });
  
  if (error) {
    // Type-safe error handling based on OpenAPI spec
    console.error('API Error:', error);
  }
} catch (err) {
  // Network or other errors
  console.error('Request failed:', err);
}
```

## Contract-First Development Workflow

### 1. Design API Contract
Start by designing the API in the OpenAPI specification:
```yaml
# Add new endpoint to contracts/openapi.yaml
paths:
  /merchants/{id}/kyb/submit:
    post:
      summary: Submit KYB documents
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/KybSubmissionRequest'
      responses:
        '201':
          description: KYB submission successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KybSubmission'
```

### 2. Define Data Schemas
Add corresponding schemas to the components section:
```yaml
components:
  schemas:
    KybSubmissionRequest:
      type: object
      required: [documentType, documentData]
      properties:
        documentType:
          type: string
          enum: [identity, business_registration, bank_statement]
        documentData:
          type: string
          format: base64
        notes:
          type: string
          maxLength: 500
```

### 3. Regenerate SDK
```bash
# Generate new types from updated contract
pnpm -F @globapay/sdk generate
pnpm -F @globapay/sdk build
```

### 4. Implement API Endpoint
Implement the endpoint in the API server using the contract as specification:
```typescript
// apps/api/src/modules/kyb/kyb.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

export async function kybRoutes(fastify: FastifyInstance) {
  fastify.post('/merchants/:id/kyb/submit', {
    schema: {
      params: Type.Object({
        id: Type.String()
      }),
      body: Type.Object({
        documentType: Type.Union([
          Type.Literal('identity'),
          Type.Literal('business_registration'),
          Type.Literal('bank_statement')
        ]),
        documentData: Type.String(),
        notes: Type.Optional(Type.String({ maxLength: 500 }))
      })
    }
  }, async (request, reply) => {
    // Implementation follows the contract
    const { id } = request.params;
    const { documentType, documentData, notes } = request.body;
    
    // Business logic here
  });
}
```

### 5. Update Frontend
Use the generated SDK in the frontend:
```typescript
// Frontend component using regenerated SDK
const submitKyb = async (merchantId: string, documents: KybSubmissionRequest) => {
  const { data, error } = await client.POST('/merchants/{id}/kyb/submit', {
    params: { path: { id: merchantId } },
    body: documents
  });
  
  if (error) {
    throw new Error('KYB submission failed');
  }
  
  return data;
};
```

## API Development Best Practices

### Schema Design
- **Use semantic naming** for endpoints and schemas
- **Define clear request/response structures** with proper validation
- **Include examples** in the OpenAPI spec for better documentation
- **Use consistent error formats** (RFC-7807 Problem Details)

### Versioning Strategy
- **Contract versioning** through OpenAPI specification
- **Backward compatibility** when possible
- **Deprecation notices** for removed features
- **Clear migration guides** for breaking changes

### Validation & Testing
- **Schema validation** on all endpoints
- **Contract testing** to ensure implementation matches specification
- **Integration tests** using the generated SDK
- **Mock server testing** with Prism for frontend development

## Troubleshooting

### Common Issues

#### 1. Type Generation Fails
```bash
# Error: Cannot find module 'openapi-typescript'
pnpm install  # Reinstall dependencies

# Error: Invalid OpenAPI spec
npx swagger-codegen-cli validate -i contracts/openapi.yaml
```

#### 2. Build Errors After Regeneration
```bash
# Clear build artifacts
pnpm clean

# Regenerate and rebuild
pnpm -F @globapay/sdk generate
pnpm build
```

#### 3. Type Mismatches
- Ensure API implementation matches OpenAPI specification exactly
- Check for required vs optional properties
- Verify enum values and constraints

#### 4. SDK Import Errors
```typescript
// Ensure proper imports
import type { components } from '@globapay/sdk/generated/types';

// Use type definitions
type PaymentLink = components['schemas']['PaymentLink'];
```

## Continuous Integration

The SDK generation is integrated into the CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
- name: Generate SDK
  run: pnpm -F @globapay/sdk generate

- name: Build packages
  run: pnpm build

- name: Type check
  run: pnpm typecheck
```

This ensures that:
- SDK is always up-to-date with the latest contract
- Type safety is maintained across the entire codebase
- Breaking changes are caught during CI

## API Documentation Links

- **Interactive API Docs**: http://localhost:3001/docs (when running locally)
- **OpenAPI Specification**: `contracts/openapi.yaml`
- **Generated Types**: `packages/sdk/src/generated/types.ts`
- **SDK Package**: `packages/sdk/`
- **Example Usage**: See `apps/web/` for real-world SDK usage examples

For questions or issues with API development, refer to the contract-first development guidelines and ensure all changes start with updating the OpenAPI specification.