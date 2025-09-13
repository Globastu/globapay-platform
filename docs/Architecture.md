# Globapay Platform Architecture

## System Overview

The Globapay Platform is a contract-first, multi-tenant payments orchestration platform built with TypeScript, supporting both single-merchant and platform tenants with sub-merchants.

## C4 Architecture Diagrams

### Level 1: System Context

```mermaid
C4Context
    title Globapay Platform - System Context Diagram
    
    Person(merchant, "Merchant User", "Creates payment links and manages transactions")
    Person(platform_admin, "Platform Admin", "Manages merchants and platform settings")
    Person(customer, "End Customer", "Makes payments via payment links")
    
    System(globapay, "Globapay Platform", "Multi-tenant payments orchestration platform")
    
    System_Ext(psp, "Payment Service Provider", "Processes card payments (Stripe, Adyen)")
    System_Ext(fraud_provider, "Fraud Detection", "Risk scoring and fraud analysis")
    System_Ext(kyb_provider, "KYB Provider", "Business verification services")
    System_Ext(notification, "Email Service", "Transactional emails and notifications")
    
    Rel(merchant, globapay, "Manages payments", "HTTPS/Web UI")
    Rel(platform_admin, globapay, "Platform management", "HTTPS/Web UI")
    Rel(customer, globapay, "Makes payments", "HTTPS/Checkout")
    
    Rel(globapay, psp, "Process payments", "API/Webhooks")
    Rel(globapay, fraud_provider, "Risk scoring", "API/Webhooks")
    Rel(globapay, kyb_provider, "Business verification", "API/Webhooks")
    Rel(globapay, notification, "Send emails", "API")
    
    UpdateRelStyle(merchant, globapay, $offsetY="-40", $offsetX="-40")
    UpdateRelStyle(platform_admin, globapay, $offsetY="-40", $offsetX="40")
    UpdateRelStyle(customer, globapay, $offsetY="40")
```

### Level 2: Container Diagram

```mermaid
C4Container
    title Globapay Platform - Container Diagram
    
    Person(merchant, "Merchant User")
    Person(customer, "End Customer")
    System_Ext(psp, "Payment Service Provider")
    System_Ext(external_apis, "External APIs")
    
    Container_Boundary(globapay, "Globapay Platform") {
        Container(web_app, "Web Dashboard", "Next.js 14", "React-based dashboard for merchant management")
        Container(api_gateway, "API Gateway", "Fastify", "RESTful API with OpenAPI specification")
        Container(auth_service, "Authentication Service", "JWT + NextAuth", "User authentication and authorization")
        Container(payment_service, "Payment Service", "TypeScript", "Payment link creation and processing")
        Container(fraud_service, "Fraud Service", "TypeScript", "Risk scoring and fraud detection")
        Container(kyb_service, "KYB Service", "TypeScript", "Business verification workflow")
        Container(audit_service, "Audit Service", "TypeScript", "Comprehensive audit logging")
        Container(notification_service, "Notification Service", "TypeScript", "Email and webhook notifications")
    }
    
    ContainerDb(postgres, "PostgreSQL", "Database", "Multi-tenant data storage")
    ContainerDb(redis, "Redis", "Cache/Queue", "Session storage and background jobs")
    
    Container(observability, "Observability Stack", "OpenTelemetry", "Tracing, metrics, and logging")
    
    Rel(merchant, web_app, "Uses", "HTTPS")
    Rel(customer, api_gateway, "Checkout", "HTTPS")
    
    Rel(web_app, api_gateway, "API calls", "HTTPS/REST")
    Rel(api_gateway, auth_service, "Authenticate")
    Rel(api_gateway, payment_service, "Payment operations")
    Rel(api_gateway, fraud_service, "Risk scoring")
    Rel(api_gateway, kyb_service, "Verification")
    Rel(api_gateway, audit_service, "Audit logs")
    
    Rel(payment_service, postgres, "Reads/writes")
    Rel(fraud_service, postgres, "Reads/writes")
    Rel(kyb_service, postgres, "Reads/writes")
    Rel(auth_service, redis, "Sessions")
    
    Rel(payment_service, psp, "Process payments", "API/Webhooks")
    Rel(fraud_service, external_apis, "Risk data", "API")
    Rel(notification_service, external_apis, "Send emails", "API")
    
    Rel_L(api_gateway, observability, "Telemetry")
```

### Level 3: Component Diagram - Payment Service

```mermaid
C4Component
    title Payment Service - Component Diagram
    
    Container(api_gateway, "API Gateway", "Fastify")
    ContainerDb(postgres, "PostgreSQL")
    System_Ext(psp, "Payment Service Provider")
    
    Container_Boundary(payment_service, "Payment Service") {
        Component(payment_controller, "Payment Controller", "Fastify Routes", "Handles payment API requests")
        Component(payment_link_service, "Payment Link Service", "TypeScript", "Business logic for payment links")
        Component(transaction_service, "Transaction Service", "TypeScript", "Transaction processing and management")
        Component(checkout_service, "Checkout Service", "TypeScript", "Checkout session management")
        Component(refund_service, "Refund Service", "TypeScript", "Refund processing and validation")
        
        Component(payment_repository, "Payment Repository", "Prisma", "Data access layer for payments")
        Component(webhook_handler, "Webhook Handler", "TypeScript", "PSP webhook processing")
        Component(validation_middleware, "Validation Middleware", "Ajv", "Request/response validation")
    }
    
    Rel(api_gateway, payment_controller, "HTTP requests")
    Rel(payment_controller, validation_middleware, "Validate")
    Rel(payment_controller, payment_link_service, "Create/manage links")
    Rel(payment_controller, transaction_service, "Process transactions")
    Rel(payment_controller, checkout_service, "Checkout sessions")
    Rel(payment_controller, refund_service, "Process refunds")
    
    Rel(payment_link_service, payment_repository, "Data access")
    Rel(transaction_service, payment_repository, "Data access")
    Rel(checkout_service, payment_repository, "Data access")
    Rel(refund_service, payment_repository, "Data access")
    
    Rel(payment_repository, postgres, "SQL queries")
    Rel(transaction_service, psp, "Payment processing")
    Rel(webhook_handler, psp, "Webhook events", "HTTPS")
    Rel(webhook_handler, transaction_service, "Update status")
```

## Payment Link Flow - Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Merchant
    participant WEB as Web Dashboard
    participant API as API Gateway
    participant PLS as Payment Link Service
    participant FS as Fraud Service
    participant DB as PostgreSQL
    participant PSP as Payment Service Provider
    participant CUST as Customer
    participant CS as Checkout Service
    participant NS as Notification Service
    
    Note over M,NS: Payment Link Creation Flow
    
    M->>WEB: Create payment link
    WEB->>API: POST /payment-links
    API->>PLS: Create payment link
    PLS->>DB: Store payment link
    PLS->>PLS: Generate short code
    PLS->>API: Return payment link
    API->>WEB: Payment link created
    WEB->>M: Display link & QR code
    
    Note over M,NS: Customer Payment Flow
    
    CUST->>API: Access payment link
    API->>PLS: Get payment link details
    PLS->>DB: Query payment link
    PLS->>API: Return link details
    API->>CUST: Show checkout page
    
    CUST->>API: Submit payment details
    API->>CS: Create checkout session
    CS->>FS: Risk scoring
    FS->>FS: Calculate risk score
    FS->>CS: Risk assessment
    
    alt Low Risk
        CS->>PSP: Process payment
        PSP->>CS: Payment success
        CS->>DB: Create transaction
        CS->>API: Payment completed
        API->>CUST: Success page
        CS->>NS: Send receipt email
        NS->>CUST: Email receipt
        NS->>M: Payment notification
    else High Risk
        CS->>PSP: Process with 3DS
        PSP->>CUST: 3DS challenge
        CUST->>PSP: Complete 3DS
        PSP->>CS: 3DS result
        CS->>DB: Create transaction
        CS->>API: Payment completed
        API->>CUST: Success page
    else Fraud Detected
        CS->>DB: Log fraud attempt
        CS->>API: Payment declined
        API->>CUST: Declined message
        CS->>NS: Alert merchant
        NS->>M: Fraud alert
    end
    
    Note over M,NS: Webhook Processing
    
    PSP->>API: Payment webhook
    API->>CS: Process webhook
    CS->>DB: Update transaction
    CS->>NS: Status notification
    NS->>M: Transaction update
```

## Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Platform Level"
        PA[Platform Admin]
        PO[Platform Organization]
    end
    
    subgraph "Tenant Level 1"
        M1[Merchant A]
        MO1[Merchant Org A]
        U1[Users A]
        PL1[Payment Links A]
        T1[Transactions A]
    end
    
    subgraph "Tenant Level 2"
        M2[Merchant B]
        MO2[Merchant Org B]
        U2[Users B]
        PL2[Payment Links B]
        T2[Transactions B]
    end
    
    subgraph "Shared Services"
        AUTH[Authentication]
        FRAUD[Fraud Detection]
        AUDIT[Audit Logging]
        OBSERV[Observability]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
    end
    
    PA --> PO
    PO --> MO1
    PO --> MO2
    
    MO1 --> M1
    MO1 --> U1
    M1 --> PL1
    PL1 --> T1
    
    MO2 --> M2
    MO2 --> U2
    M2 --> PL2
    PL2 --> T2
    
    U1 --> AUTH
    U2 --> AUTH
    T1 --> FRAUD
    T2 --> FRAUD
    
    AUTH --> DB
    FRAUD --> DB
    AUDIT --> DB
    MO1 --> DB
    MO2 --> DB
    
    style PA fill:#ff6b6b
    style PO fill:#4ecdc4
    style MO1 fill:#45b7d1
    style MO2 fill:#96ceb4
    style DB fill:#feca57
```

## Technology Stack

### Backend
- **Framework:** Fastify (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Authentication:** JWT + NextAuth
- **API:** OpenAPI 3.1 specification

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** React Server Components
- **Authentication:** NextAuth.js

### Infrastructure
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **Monitoring:** OpenTelemetry + Jaeger + Prometheus
- **Package Management:** pnpm workspaces + Turbo

### External Integrations
- **Payment Processing:** PSP APIs (Stripe, Adyen)
- **Fraud Detection:** Third-party risk scoring
- **KYB Verification:** Document verification services
- **Email Services:** Transactional email providers

## Security Architecture

### Authentication Layers
1. **User Authentication:** JWT tokens (15-minute access + refresh)
2. **API Authentication:** Organization-scoped API keys
3. **Service Authentication:** Internal service-to-service calls
4. **MFA Support:** TOTP for enhanced security

### Data Protection
- **Tenant Isolation:** Row-level security with organization scoping
- **Encryption at Rest:** Database encryption
- **Encryption in Transit:** TLS 1.3 for all communications
- **PCI Compliance:** No card data storage (tokenization via PSP)

### Audit & Compliance
- **Comprehensive Logging:** All security-sensitive operations
- **Request Tracing:** Correlation IDs across all services
- **Audit Trail:** Immutable logs with retention policies
- **GDPR Compliance:** Data subject rights and privacy controls

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services:** All services designed for horizontal scaling
- **Database Sharding:** Partition by tenant for large-scale deployment
- **Caching Strategy:** Redis for session storage and query caching
- **CDN Integration:** Static assets and checkout pages

### Performance Optimization
- **Database Indexing:** Optimized queries with proper indexes
- **Connection Pooling:** Efficient database connection management
- **Background Processing:** Async jobs for non-critical operations
- **API Rate Limiting:** Prevent abuse and ensure fair usage

### Monitoring & Observability
- **Distributed Tracing:** End-to-end request tracking
- **Business Metrics:** Payment success rates, fraud detection rates
- **Performance Metrics:** Response times, error rates, throughput
- **Alerting:** Proactive monitoring with intelligent alerts

This architecture provides a robust, scalable foundation for the Globapay Platform while maintaining security, compliance, and operational excellence.