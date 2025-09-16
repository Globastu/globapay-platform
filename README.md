# Globapay Platform

[![CI](https://github.com/globapay/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/globapay/platform/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/globapay/platform/branch/main/graph/badge.svg)](https://codecov.io/gh/globapay/platform)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=globapay_platform&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=globapay_platform)

A **contract-first**, multi-tenant payments orchestration platform built with TypeScript, supporting a 3-level tenant hierarchy: Admin (Globapay Staff), Platform Partners, and Merchants.

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

### 🎭 Sandbox Mode (Frontend Only)

Run the web dashboard with **realistic demo data** without needing the backend API:

```bash
# Web app with sandbox mode
pnpm dev

# Enable sandbox mode (auto-enabled on localhost)
NEXT_PUBLIC_SANDBOX_MODE=1
```

**Sandbox Mode Features:**
- ✅ **3-Level Tenant Hierarchy** - Switch between Admin, Platform, and Merchant views
- ✅ **150 Realistic Transactions** with filtering, pagination, CSV export
- ✅ **Comprehensive Fraud Dashboard** with risk scoring and high-risk monitoring  
- ✅ **Full CRUD operations** (create, read, update, delete)
- ✅ **Transaction refunds** with validation
- ✅ **Multi-tenant scenarios** with proper permission scoping
- ✅ **Sandbox Toggle UI** with real-time tenant switching

**Environment Configuration:**
```bash
# Copy example config
cp apps/web/.env.local.example apps/web/.env.local

# Sandbox mode is auto-enabled on localhost
# Manually enable with:
NEXT_PUBLIC_SANDBOX_MODE=1
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
- [x] **3-level tenant architecture** (Admin/Platform/Merchant) with organization scoping
- [x] **Audit logging service** for compliance
- [x] **NextAuth integration** for web dashboard
- [x] **Role-aware navigation** with permission-based UI
- [x] **Full sandbox mode** with 150 realistic transactions + fraud analytics
- [x] **Sandbox tenant toggle** for testing different user levels
- [x] **Contract-first development** with OpenAPI + MSW mocks
- [x] **Payment Links E2E** - Complete vertical slice with live API + MSW
- [x] **CRUD operations** - Create, list, filter, void, resend payment links
- [x] **Comprehensive testing** - Unit, integration, and E2E tests
- [x] **Transaction Management** - Processing, refunds, CSV export
- [x] **3-Level KYB System** - Admin can onboard platforms, platforms onboard merchants
- [x] **Merchant Onboarding Tracker** - Step-by-step progress visualization  
- [x] **Hierarchical RBAC** - Admin/Platform/Merchant permissions with proper isolation
- [x] **Fraud Detection System** - Complete risk scoring with mock provider interface
- [x] **Fraud Dashboard** - Score distribution charts and high-risk transaction monitoring
- [x] **Observability & Audit** - OpenTelemetry tracing, Prometheus metrics, comprehensive audit logging
- [x] **Request Context Logging** - RequestId and tenant ID stamping in all logs
- [x] **Audit Log Viewer** - Web-based audit trail with filtering and export capabilities
- [x] **Invoices Module** - Complete Stripe-like invoicing with Gr4vy payment links

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

### 3-Level Tenant Hierarchy
```
Admin (Globapay Staff)
├── Can onboard Platform Partners
├── Can onboard Merchants directly
├── Full system access
└── Fraud monitoring across all tenants

Platform Partners
├── Can onboard Merchants
├── Can bill their Merchants
├── Access to their Merchant ecosystem
└── Platform-level reporting

Merchants (End Users)  
├── Payment processing functionality
├── Transaction management
├── Customer payment links
└── Merchant-scoped reporting
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

### 3-Level Role-Based Access Control (RBAC)
- **Admin Level**: Globapay staff with full platform access and cross-tenant visibility
- **Platform Level**: Partner organizations managing their merchant ecosystem with billing capabilities
- **Merchant Level**: End users with payment processing functionality scoped to their organization
- **Permission-Based**: Granular permissions (READ, WRITE, DELETE) per resource and tenant level
- **Dynamic Navigation**: UI elements and pages shown/hidden based on user permissions and tenant type
- **API Middleware**: Request-level authorization with hierarchical tenant scoping

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
- ✅ Complete invoice creation and payment flows

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

## 🧾 Invoices Module Implementation

Complete Stripe-like invoicing system with Gr4vy payment link integration:

### 🏗️ **Architecture** (`apps/web/src/app/(dashboard)/invoices/`)
- **Feature Flag Controlled**: `NEXT_PUBLIC_INVOICES_ENABLED` for gradual rollout
- **Contract-First Design**: Zod schemas with strict TypeScript validation
- **Route Group Structure**: Clean App Router organization under `(dashboard)`
- **Zero Build Errors**: Production-ready with comprehensive error handling

### 🔧 **API Endpoints** (`apps/web/src/app/api/invoices/`)
- **CRUD Operations**: `GET/POST /api/invoices`, `GET/PATCH /api/invoices/[id]`
- **Payment Actions**: `POST /api/invoices/[id]/open` - Creates Gr4vy payment links
- **Email Integration**: `POST /api/invoices/[id]/send` - Send invoice to customers
- **Real-time Calculations**: `POST /api/invoices/[id]/recalculate` - Server-side totals
- **Webhook Handler**: `POST /api/webhooks/gr4vy` - Payment completion events
- **RFC-7807 Errors**: Standardized error responses with problem details

### 💰 **Totals Calculation Engine** (`apps/web/src/lib/invoices/calculations.ts`)
- **Pre-tax Discounts**: Applied before tax calculation for MVP
- **Tax Handling**: Exclusive (add on top) and inclusive (extract portion) support
- **Multi-currency**: Full international currency support
- **Real-time Updates**: Live calculation in forms with validation

### 🔗 **Gr4vy Integration** (`apps/web/src/lib/services/gr4vy.ts`)
- **Payment Link Creation**: Secure metadata attachment with invoice context
- **Success/Cancel URLs**: Proper redirect handling after payment
- **Webhook Processing**: Automatic invoice status updates on payment completion
- **Error Handling**: Graceful fallbacks when payment service unavailable
- **Environment Configuration**: Separate staging/production credentials

### 🖥️ **User Interface** (`apps/web/src/components/invoices/`)
- **Invoice List**: Filterable table with status badges and pagination
- **Create/Edit Forms**: Multi-section forms with live calculation preview
- **Detail View**: Status-aware action buttons (Edit, Open, Send, Copy Link)
- **Payment Flows**: Seamless integration with Gr4vy hosted checkout
- **Responsive Design**: Mobile-friendly with Tailwind CSS and shadcn/ui

### 🎭 **MSW Mock System** (`apps/web/mocks/handlers/invoices.ts`)
- **Realistic Fixtures**: ~10 seeded invoices across all statuses (draft, open, paid, void)
- **Full API Coverage**: All endpoints with proper validation and state management
- **Payment Simulation**: Mock payment completion for testing workflows
- **Tenant Context**: Proper merchant scoping in mock responses
- **Development Tools**: Latency controls and debug capabilities

### 📊 **Invoice Statuses & Workflows**
```
Draft → Open → Paid
  ↓      ↓
Void   Uncollectible
```

- **Draft**: Editable invoices, can be opened to create payment links
- **Open**: Payment link active, awaiting customer payment
- **Paid**: Payment completed via webhook, invoice locked
- **Void**: Cancelled invoices (irreversible)
- **Uncollectible**: Bad debt classification

### 🔒 **Security & Compliance**
- **Tenant Isolation**: All operations scoped to merchant/organization
- **Payment Security**: No card data stored, all processing via certified PSP
- **Webhook Verification**: Cryptographic signature validation (production)
- **Audit Trail**: All invoice operations logged with user context
- **Feature Gates**: Granular feature flag control for safe deployment

### 🎯 **Key Features**
- ✅ **Create & Edit** invoices with line items, tax, and discounts
- ✅ **Multi-currency** support with proper formatting
- ✅ **Payment Links** - One-click Gr4vy integration for customer payments
- ✅ **Email Sending** - Invoice delivery with payment link inclusion
- ✅ **Real-time Status** - Automatic updates via webhook processing
- ✅ **PDF Preview** - HTML preview ready for PDF generation
- ✅ **Live Calculations** - Server-side totals with client preview
- ✅ **Feature Flags** - Safe deployment with `NEXT_PUBLIC_INVOICES_ENABLED`

### 🧪 **Testing & Development**
```bash
# Enable invoices in development
echo "NEXT_PUBLIC_INVOICES_ENABLED=1" >> apps/web/.env.local

# Test with mock data (no backend required)
pnpm dev:web:mock

# Run invoice-specific tests
cd apps/web
pnpm test:unit -- invoices
```

### 🔄 **Webhook Flow Example**
```
1. Invoice created (status: draft)
2. Invoice opened → Gr4vy payment link created (status: open)
3. Customer pays via link → Gr4vy webhook fired
4. Webhook processed → Invoice status updated (status: paid)
5. Confirmation email sent (optional)
```

## 🎮 Sandbox Mode Implementation

Complete sandbox environment for testing all tenant levels without backend dependencies:

### 🏗️ **3-Level Tenant System** (`apps/web/src/lib/sandbox.ts`)
- **Admin Simulation**: Globapay staff with platform/merchant onboarding capabilities
- **Platform Simulation**: Partner organizations with merchant management and billing features
- **Merchant Simulation**: End users with payment processing functionality
- **Real-time Switching**: Sandbox toggle UI for instant tenant level changes
- **Permission Isolation**: Proper scoping of features and navigation per tenant type

### 💳 **Transaction Data Engine** (`apps/web/src/lib/sandbox.ts:149-274`)
- **150 Realistic Transactions**: Diverse payment scenarios across 3 months
- **Dynamic Filtering**: Status, date range, amount, currency, payment method
- **CSV Export**: Full transaction export with proper formatting
- **Pagination**: Configurable page sizes with proper navigation
- **Statistics**: Real-time metrics calculation (volume, success rate, averages)

### 🛡️ **Fraud Analytics Dashboard** (`apps/web/src/lib/sandbox.ts:370-475`)
- **Risk Score Distribution**: Realistic scoring patterns across 0-100 range
- **High-Risk Monitoring**: 25 flagged transactions with detailed risk factors
- **Decision Analytics**: Approve/Review/Decline breakdown with percentages
- **Performance Metrics**: Processing times and fraud detection KPIs
- **Risk Factor Analysis**: Top 8 risk factors with occurrence tracking

### 🔧 **API Route Integration** (`apps/web/src/app/api/`)
```bash
# Sandbox-aware endpoints (no authentication required in sandbox)
GET /api/transactions       # Transaction list with filtering
GET /api/transactions/stats # Transaction statistics  
GET /api/fraud/stats        # Fraud analytics dashboard
GET /api/fraud/high-risk-transactions # High-risk monitoring
```

### 🎯 **Sandbox Features**
- ✅ **Auto-Detection**: Enabled on localhost/vercel.app domains
- ✅ **Tenant Toggle**: Bottom-right widget for instant role switching
- ✅ **Real-time Updates**: LocalStorage sync across browser tabs
- ✅ **No Authentication**: Bypasses NextAuth in sandbox mode
- ✅ **Full UI Coverage**: All dashboard pages populated with realistic data
- ✅ **Type Safety**: Full TypeScript coverage with proper interfaces

### 🔄 **Sandbox Mode Activation**
```javascript
// Automatic activation on:
window.location.hostname.includes('localhost')
window.location.hostname.includes('vercel.app') 
process.env.NODE_ENV === 'development'
process.env.NEXT_PUBLIC_SANDBOX_MODE === '1'

// Manual tenant switching in sandbox
localStorage.setItem('globapay-sandbox-tenant-type', 'admin')    // Admin
localStorage.setItem('globapay-sandbox-tenant-type', 'platform') // Platform  
localStorage.setItem('globapay-sandbox-tenant-type', 'merchant') // Merchant
```

## 📦 Deployment

### Production Deployment Fixes

Key issues resolved for successful Vercel deployment:

#### 🔧 **Tailwind CSS Configuration**
```javascript
// tailwind.config.js - Fixed content scanning for route groups
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}" // Covers route groups like (dashboard)
  ],
  // ... rest of config
}
```

#### 📝 **PostCSS Configuration**
```javascript
// postcss.config.js - Critical missing file for Tailwind processing
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 🎨 **Global Styles Setup**
```css
/* globals.css - Proper Tailwind directives */
@tailwind base;
@tailwind components; 
@tailwind utilities;

@layer base {
  /* Custom CSS variables and base styles */
}
```

#### ⚛️ **React Hooks Compliance**
- Fixed conditional hook calls by moving feature flag checks after all hooks
- Ensured hooks are called in the same order on every render
- Added proper dependency arrays with useCallback for exhaustive-deps compliance

#### 📦 **Missing Dependencies**
```bash
# Added missing packages for production builds
pnpm add zod autoprefixer
```

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