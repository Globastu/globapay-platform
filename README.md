# Globapay Platform

[![CI](https://github.com/globapay/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/globapay/platform/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/globapay/platform/branch/main/graph/badge.svg)](https://codecov.io/gh/globapay/platform)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=globapay_platform&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=globapay_platform)

A **contract-first**, multi-tenant payments orchestration platform built with TypeScript, supporting both single-merchant and platform tenants with sub-merchants.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for local development)

### Development Setup

```bash
# Enable pnpm
corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Or use Docker Compose for full stack
docker-compose up
```

### 🎭 Mock Mode (Frontend Only)

Run the web dashboard with **realistic demo data** without needing the backend API:

```bash
# Web app with MSW mocks
pnpm dev:web:mock

# Or Prism schema mocks (serves OpenAPI spec)
pnpm mock:server
```

**Mock Mode Features:**
- ✅ **Realistic fixtures** for payment links & transactions
- ✅ **Full CRUD operations** (create, read, update, delete)
- ✅ **Pagination & filtering** with search
- ✅ **Transaction refunds** with validation
- ✅ **Demo Data badge** when active
- ✅ **Multi-tenant scenarios** (single & platform merchants)
- ✅ **E2E testing** with Playwright

**Environment Configuration:**
```bash
# Copy example config
cp apps/web/.env.local.example apps/web/.env.local

# Enable mock mode
NEXT_PUBLIC_MOCK=1
NEXT_PUBLIC_API_BASE_URL=
```

### Available Services
- **API Server**: http://localhost:3001
- **Web Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:3001/docs
- **Prometheus Metrics**: http://localhost:9464/metrics
- **Jaeger Tracing**: http://localhost:16686
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🏗️ Architecture Overview

### Tech Stack
- **Backend**: Fastify + TypeScript + OpenAPI 3.1
- **Frontend**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Observability**: OpenTelemetry + Prometheus + Jaeger
- **Monorepo**: pnpm workspaces + Turbo
- **Testing**: Vitest + Playwright
- **DevOps**: Docker + GitHub Actions

### Project Structure
```
globapay-platform/
├── apps/
│   ├── api/           # Fastify API server
│   └── web/           # Next.js dashboard
├── packages/
│   ├── config/        # Shared configs (ESLint, TypeScript)
│   ├── ui/            # shadcn/ui component library
│   └── sdk/           # OpenAPI-generated TypeScript client
├── contracts/
│   ├── openapi.yaml   # OpenAPI 3.1 specification (source of truth)
│   └── schemas/       # JSON Schema definitions
└── docs/              # Documentation
```

## 📋 Current Status

### ✅ Completed
- [x] **Monorepo scaffold** with pnpm workspaces
- [x] **Contract-first API design** with OpenAPI 3.1
- [x] **JSON Schema definitions** for all core entities
- [x] **TypeScript SDK** with full type safety
- [x] **Database schema & migrations** with Prisma
- [x] **Development tooling** (ESLint, Prettier, Husky)
- [x] **CI/CD pipeline** with GitHub Actions
- [x] **Docker containers** for production deployment
- [x] **Authentication & RBAC system** with JWT + API keys
- [x] **Multi-tenant architecture** with organization scoping
- [x] **Audit logging service** for compliance
- [x] **NextAuth integration** for web dashboard
- [x] **Role-aware navigation** with permission-based UI
- [x] **Full mock mode** with MSW + realistic fixtures
- [x] **Demo data badge** for mock mode visualization
- [x] **Prism schema mocking** for contract-first development
- [x] **Payment Links E2E** - Complete vertical slice with live API + MSW
- [x] **CRUD operations** - Create, list, filter, void, resend payment links
- [x] **Comprehensive testing** - Unit, integration, and E2E tests
- [x] **Transaction Management** - Processing, refunds, CSV export
- [x] **Multi-tenant KYB System** - Platform/sub-merchant onboarding with verification
- [x] **Merchant Onboarding Tracker** - Step-by-step progress visualization
- [x] **Role-based Access Control** - PlatformAdmin vs MerchantAdmin permissions
- [x] **Fraud Detection System** - Complete risk scoring with mock provider interface
- [x] **Fraud Dashboard** - Score distribution charts and high-risk transaction monitoring
- [x] **Observability & Audit** - OpenTelemetry tracing, Prometheus metrics, comprehensive audit logging
- [x] **Request Context Logging** - RequestId and tenant ID stamping in all logs
- [x] **Audit Log Viewer** - Web-based audit trail with filtering and export capabilities

### 🚧 In Progress
- [ ] **Webhook handling system**
- [ ] **Real-time notifications**

### 📋 Roadmap
1. **Foundations** - ✅ Database, auth, core services
2. **Payment Links E2E** - ✅ Create, host, complete payments  
3. **Multi-tenant + KYB** - ✅ Organization management, verification
4. **Fraud Detection** - ✅ Risk scoring integration
5. **Observability** - ✅ Tracing, metrics, audit logging
6. **Refunds & Reporting** - ✅ Transaction management, CSV exports
7. **Webhooks & Notifications** - 🚧 Real-time event system

## 🔌 API Documentation

### Contract-First Development
All API development follows the **OpenAPI specification** in `contracts/openapi.yaml`. This serves as the single source of truth for:
- API endpoint definitions
- Request/response schemas
- Validation rules
- TypeScript SDK generation

### Key Endpoints (Contracts Defined)

#### Authentication
- `POST /auth/token` - JWT authentication

#### Tenancy Management  
- `GET/POST /platforms` - Platform organizations
- `GET/POST /merchants` - Merchant management
- `POST /merchants/{id}/status` - Update merchant status

#### KYB (Know Your Business)
- `POST /merchants/{id}/kyb/submit` - Submit verification documents
- `GET /merchants/{id}/kyb/status` - Get verification status

#### Payment Processing
- `POST /payment-links` - Create payment links
- `POST /checkout/sessions` - Create checkout sessions
- `GET /transactions` - List transactions
- `POST /transactions/{id}/refund` - Process refunds

#### Webhook Integration
- `POST /webhooks/provider` - PSP webhook endpoint
- `POST /webhooks/fraud` - Fraud detection webhooks
- `POST /webhooks/kyb` - KYB verification webhooks

#### Fraud Detection
- `GET /fraud/stats` - Fraud detection statistics and metrics
- `GET /fraud/high-risk-transactions` - High-risk transactions monitoring
- `GET /fraud/checks` - Fraud check history and analysis

#### Admin & Reporting
- `POST /webhooks/{id}/replay` - Replay failed webhooks
- `GET/POST /reports` - Generate transaction reports
- `POST /reports/schedule` - Schedule recurring reports
- `GET /audit-logs` - Security and compliance audit trail
- `POST /audit-logs/export` - Export audit logs for compliance

#### Observability
- `GET /metrics` - Prometheus metrics endpoint
- `GET /health` - Service health and status checks

### API Conventions
- **RFC-7807 Error Format**: Standardized error responses with problem details
- **Cursor Pagination**: Efficient pagination for large datasets
- **Idempotency**: All write operations support `Idempotency-Key` header
- **Full Type Safety**: Request/response bodies validated against JSON schemas

## 🏛️ Data Models

### Core Entities (JSON Schema Defined)
- **Organization**: Platform or merchant organization
- **Merchant**: Payment-processing entity with KYB status
- **User**: Account with role-based permissions
- **Role**: Permission sets (system or custom)
- **PaymentLink**: Shareable payment requests
- **CheckoutSession**: Hosted/embedded payment flow with fraud scoring
- **Transaction**: Payment records with fraud/3DS data
- **Refund**: Transaction reversal with audit trail
- **FraudCheck**: Risk assessment with score and decision
- **WebhookEvent**: System notifications with retry logic
- **AuditLog**: Security and compliance logging with full context

### Multi-Tenancy Model
```
Platform Organization
└── Merchants (sub-tenants)
    ├── Users (scoped access)
    ├── Payment Links
    ├── Transactions
    └── Settings
```

## 🛠️ Development Commands

### Root Level
```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all packages
pnpm lint         # Run ESLint across all packages
pnpm typecheck    # TypeScript compilation check
pnpm test         # Run all tests
pnpm clean        # Clean all build artifacts
```

### API Server (`apps/api`)
```bash
cd apps/api
pnpm dev          # Start with hot reload
pnpm build        # Compile TypeScript
pnpm start        # Run production build
```

### Web Dashboard (`apps/web`)  
```bash
cd apps/web
pnpm dev          # Next.js development server
pnpm build        # Production build
pnpm start        # Serve production build
```

### TypeScript SDK (`packages/sdk`)
```bash
cd packages/sdk
pnpm generate     # Generate types from OpenAPI spec
pnpm build        # Compile SDK
```

### Database (`apps/api`)
```bash
cd apps/api
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database (development)
pnpm db:migrate   # Create and run migrations
pnpm db:seed      # Seed database with test data
pnpm db:studio    # Open Prisma Studio GUI
pnpm db:reset     # Reset database (destructive)
```

## 📊 Observability & Monitoring

### Distributed Tracing (OpenTelemetry)
- **Request Correlation**: Unique request IDs across all services
- **Automatic Instrumentation**: HTTP, database, and external API calls
- **Business Context**: Custom spans for payment flows and fraud detection
- **Jaeger Integration**: Visual trace analysis and performance debugging

### Metrics Collection (Prometheus)
- **Authentication Metrics**: Login success rates, failed attempts, MFA usage
- **Payment Metrics**: Capture rates, transaction amounts, processing times
- **Fraud Metrics**: Risk score distributions, decision breakdowns
- **Webhook Metrics**: Processing lag, delivery success rates
- **System Metrics**: Request duration, error rates, throughput

### Comprehensive Audit Logging
- **Security Events**: Authentication, permission changes, suspicious activity
- **Business Operations**: Transactions, refunds, KYB submissions
- **Data Access**: Exports, sensitive queries, admin operations
- **Compliance**: Required audit trails for financial regulations
- **Web Viewer**: `/settings/audit` - Filterable audit log interface

### Request Context Logging
- **Structured Logging**: JSON format with consistent field names
- **Request Correlation**: `requestId` stamped on all log entries
- **Tenant Isolation**: `tenantId` and `merchantId` in every log
- **Performance Tracking**: Request timing and status codes
- **Error Correlation**: Link errors across distributed components

## 🔒 Security & Compliance

### Authentication & Authorization
- **JWT Bearer Tokens**: 15-minute access tokens with refresh capability
- **API Keys**: Organization-scoped keys with `gp_` prefix for services
- **Multi-Factor Authentication**: TOTP support for enhanced security
- **Session Management**: NextAuth integration with automatic token refresh

### Role-Based Access Control (RBAC)
- **Hierarchical Roles**: PlatformAdmin > Admin > MerchantAdmin > Staff > Analyst
- **Permission-Based**: Granular permissions (READ, WRITE, DELETE) per resource
- **Dynamic Navigation**: UI elements shown/hidden based on user permissions
- **API Middleware**: Request-level authorization with tenant scoping

### Security Features
- **Tenant Isolation**: Organization/merchant-scoped data access
- **Audit Logging**: Comprehensive tracking of authentication, authorization, and critical operations
- **Secure Key Storage**: API keys hashed with bcrypt, prefix-based lookup
- **Rate Limiting**: Built-in protection against abuse
- **Idempotency**: Duplicate request protection with unique keys

### PCI Compliance (SAQ-A)
- No card data storage or processing on platform
- All sensitive operations handled by certified PSP
- 3D Secure support for EEA transactions
- **Webhook Signatures**: Cryptographic verification of incoming webhooks

## 🧪 Testing Strategy

### Contract Testing
- Request/response validation against OpenAPI schemas
- SDK integration tests with generated types
- Postman/Newman collection from OpenAPI spec

### Unit Testing
- Business logic with Vitest
- React components with Testing Library
- Mock external service integrations

### Integration Testing
- End-to-end flows with Playwright
- Database integration tests
- Webhook delivery testing

### Mock Mode Testing
```bash
# Run E2E tests in mock mode (no backend needed)
cd apps/web
pnpm test:e2e

# Interactive mode
pnpm test:e2e:ui

# Unit tests
pnpm test:unit
```

**E2E Test Scenarios:**
- ✅ Create payment links with realistic data
- ✅ Process transaction refunds
- ✅ Verify Demo Data badge visibility
- ✅ Test pagination and filtering
- ✅ Validate mock vs real API mode

## 💳 Payment Links Implementation

Complete end-to-end implementation with both live API and MSW mocks:

### 🔧 **API Implementation** (`apps/api/src/modules/payment-links/`)
- **Service Layer**: `PaymentLinksService` with CRUD operations
- **Route Handlers**: Full REST API with validation & error handling
- **Short Code Generation**: 8-character codes (e.g., `ABCD1234`)
- **URL Generation**: `https://pay.globapay.com/link/{shortCode}`
- **Tenant Scoping**: All operations scoped to merchant/organization
- **Audit Logging**: All CRUD operations logged for compliance

### 🎭 **MSW Mock Handlers** (`apps/web/mocks/handlers/payment-links.ts`)
- **Realistic Fixtures**: Healthcare payment scenarios
- **Full API Coverage**: All endpoints (create, list, get, update, void, resend)
- **Latency Simulation**: Configurable via `?latency=500` or localStorage
- **State Persistence**: In-memory store survives page reloads
- **Validation**: Mirrors real API validation rules

### 🖥️ **Web UI** (`apps/web/src/app/payment-links/`)
- **List Page**: Filterable table with pagination
- **Creation Form**: Full form with validation & preview
- **Actions**: Void pending links, resend with email
- **Optimistic Updates**: Immediate feedback in mock mode
- **Responsive Design**: Mobile-friendly with Tailwind CSS

### ✅ **Testing Coverage**
- **Unit Tests**: Service layer with mocked Prisma
- **Handler Tests**: MSW handlers with realistic scenarios  
- **E2E Tests**: Complete user flows in Playwright
- **Mock Latency Controls**: Development console utilities

### 🎯 **Key Features**
- ✅ **Create** payment links with amount, description, customer info
- ✅ **List & Filter** by status, search, date range with pagination
- ✅ **Void** pending payment links (irreversible)
- ✅ **Resend** payment links via email notification
- ✅ **Tenant Isolation** - merchants only see their own links
- ✅ **Audit Trail** - all operations logged with user context
- ✅ **Mock/Live Mode** - seamless switching for development

### 🔄 **Mock Mode Development**
```javascript
// Browser console controls (available in mock mode)
mockLatency.set(500)        // Set 500ms latency
mockLatency.toggle()        // Cycle through presets  
mockLatency.presets.slow()  // Set to 1000ms
mockLatency.get()           // Get current setting
```

## 📦 Deployment

### Docker Support
Each application includes production-ready Dockerfiles:
```bash
# Build images
docker build -t globapay-api ./apps/api
docker build -t globapay-web ./apps/web

# Development with compose
docker-compose up
```

### Environment Variables
Copy the example files and configure for your environment:
```bash
# API Server
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials

# Key variables:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globapay
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
```

### Database Setup
```bash
# Start database services
docker-compose up postgres redis -d

# Set up database schema
cd apps/api
pnpm db:push     # Push schema to database
pnpm db:seed     # Seed with test data

# Test users created:
# admin@globapay.com / admin123 (Platform Admin)
# user@acmehealthcare.com / user123 (Merchant User)  
# owner@techflow.com / owner123 (Merchant Owner)
#
# Test the authentication system:
# - Sign in at http://localhost:3000/auth/signin
# - Dashboard shows role-appropriate navigation
# - JWT tokens auto-refresh every 15 minutes
```

## 🏗️ Architecture Decisions

### Contract-First Development
- **Single Source of Truth**: OpenAPI spec drives both API and client development
- **Type Safety**: Full TypeScript coverage from contracts to implementation
- **Documentation**: Auto-generated, always up-to-date API docs

### Monorepo Structure
- **Shared Configuration**: Consistent linting, TypeScript settings
- **Internal Packages**: Reusable UI components and utilities
- **Efficient Builds**: Turbo for smart caching and parallelization

### Technology Choices
- **Fastify**: High-performance Node.js framework with excellent TypeScript support
- **Next.js 14**: React framework with App Router for optimal performance
- **pnpm**: Efficient package management with workspace support
- **shadcn/ui**: Accessible, customizable component system

## 🤝 Contributing

### Development Workflow
1. All API changes must update the OpenAPI spec first
2. Generate TypeScript types: `pnpm -F @globapay/sdk generate`
3. Implement API endpoints with schema validation
4. Add comprehensive tests for new functionality
5. Update documentation and README as needed

### Quality Standards
- **No `any` types** - explicit typing required
- **Exhaustive switch statements** on enums
- **Schema validation** on all API routes
- **Idempotency support** on write operations
- **Comprehensive error handling** with Problem Details format

## 📚 Additional Resources

- [OpenAPI Specification](./contracts/openapi.yaml)
- [API Documentation](http://localhost:3001/docs) (when running)
- [JSON Schemas](./contracts/schemas/)
- [Package Documentation](./packages/*/README.md)

---

**Status**: 🚧 **In Development** - Contract-first API design complete, implementation in progress

For questions or contributions, please refer to the issue tracker or documentation.