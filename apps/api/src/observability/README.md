# Observability & Audit System

This directory contains the comprehensive observability and audit system for the Globapay Platform API, implementing tracing, metrics, structured logging, and comprehensive audit trails.

## 🎯 Features

### 🔍 **Distributed Tracing** (OpenTelemetry)
- **Automatic Instrumentation**: HTTP requests, database queries, external calls
- **Manual Tracing**: Custom spans for business logic
- **Jaeger Integration**: Visual trace analysis (production)
- **Console Export**: Development-friendly trace output

### 📊 **Metrics Collection** (Prometheus)
- **Authentication Metrics**: `auth_rate`, success/failure counts
- **Payment Metrics**: `capture_rate`, transaction amounts  
- **Webhook Metrics**: `webhook_lag_seconds`, processing times
- **HTTP Metrics**: Request duration, status codes
- **Fraud Metrics**: Score distribution, decision rates

### 📋 **Structured Logging**
- **Request Context**: Automatic `requestId`, `tenantId`, `merchantId` stamping
- **Correlation**: Link logs across distributed services
- **Security Events**: High-risk event highlighting
- **Performance**: Request timing and status tracking

### 🔒 **Comprehensive Audit Trail**
- **Security Events**: Authentication, permission changes, MFA
- **Business Operations**: Transactions, refunds, payment links
- **Compliance**: Required audit events for financial services
- **Data Access**: Exports, sensitive data queries
- **Suspicious Activity**: Automated threat detection logging

## 🚀 Quick Start

### 1. Initialize Observability

```typescript
// In your main server file (before creating Fastify instance)
import { initializeObservability } from './observability';

// Must be called before any other imports/initialization
initializeObservability();
```

### 2. Register Middleware

```typescript
import Fastify from 'fastify';
import { registerObservabilityMiddleware } from './middleware';

const fastify = Fastify({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV === 'development',
  },
});

// Register observability middleware
await registerObservabilityMiddleware(fastify);
```

### 3. Environment Variables

```bash
# Tracing
JAEGER_ENDPOINT=http://localhost:14268/api/traces
SERVICE_NAME=globapay-api
SERVICE_VERSION=1.0.0
NODE_ENV=development

# Metrics
PROMETHEUS_PORT=9464
```

## 📈 Metrics Available

### Authentication Metrics
```
auth_attempts_total{method="password", tenant_id="org-123", result="success"}
auth_success_total{method="password", tenant_id="org-123"}
auth_failures_total{method="password", tenant_id="org-123"}
auth_rate{service="globapay-api"} # Percentage
```

### Payment Capture Metrics
```
capture_attempts_total{currency="USD", merchant_id="merch-123", result="success"}
capture_success_total{currency="USD", merchant_id="merch-123"}
capture_failures_total{currency="USD", merchant_id="merch-123"}
capture_rate{service="globapay-api"} # Percentage
transactions_total{currency="USD", merchant_id="merch-123"}
transaction_amount_cents{currency="USD", merchant_id="merch-123"} # Histogram
```

### Webhook Metrics
```
webhook_lag_seconds{webhook_type="payment_completed", status="success"} # Histogram
webhooks_processed_total{webhook_type="payment_completed", status="success"}
webhooks_failed_total{webhook_type="payment_completed", status="failed"}
```

### HTTP Metrics
```
http_requests_total{method="POST", path="/api/transactions", status_code="200"}
http_request_duration_seconds{method="POST", path="/api/transactions"}
```

## 🔍 Using Tracing

### Automatic Tracing
All HTTP requests, database queries, and external calls are automatically traced.

### Manual Tracing
```typescript
import { traceAsync, addSpanAttributes } from '../observability/tracing';

export async function processPayment(paymentData: PaymentData) {
  return await traceAsync('process_payment', async () => {
    // Add custom attributes
    addSpanAttributes({
      'payment.amount': paymentData.amount,
      'payment.currency': paymentData.currency,
      'merchant.id': paymentData.merchantId,
    });

    // Your business logic here
    const result = await performPaymentLogic(paymentData);
    
    return result;
  });
}
```

## 📋 Logging with Context

### Structured Logging
```typescript
import { createContextLogger } from '../middleware/logging.middleware';

export async function myHandler(request: FastifyRequest, reply: FastifyReply) {
  const logger = createContextLogger(request);
  
  logger.info('Processing payment', {
    amount: request.body.amount,
    currency: request.body.currency,
  });
  
  // Logs will automatically include:
  // - requestId
  // - tenantId 
  // - merchantId
  // - userId
  // - IP address
  // - User agent
}
```

## 🔒 Audit Logging

### Security-Sensitive Events
```typescript
import { AuditService } from '../modules/audit/audit.service';

// Authentication events
await AuditService.logUserLogin(userId, organizationId, 'SUCCESS', ip, userAgent, requestId);
await AuditService.logFailedLoginAttempt(email, 'invalid_credentials', ip, userAgent, requestId);

// MFA events
await AuditService.logMfaEnabled(tenant, userId, 'totp', ip, userAgent, requestId);

// Permission changes
await AuditService.logPermissionChange(
  tenant, targetUserId, oldRole, newRole, 
  oldPermissions, newPermissions, reason, ip, userAgent, requestId
);
```

### Business Operations
```typescript
// Transaction refunds (compliance requirement)
await AuditService.logTransactionRefund(
  tenant, transactionId, refundId, amount, currency, 
  reason, 'SUCCESS', undefined, ip, userAgent, requestId
);

// KYB operations
await AuditService.logKybSubmission(tenant, merchantId, documentTypes, ip, userAgent, requestId);
await AuditService.logKybApproval(tenant, merchantId, reviewerId, notes, ip, userAgent, requestId);

// Data exports
await AuditService.logDataExport(
  tenant, 'transactions', recordCount, filters, 
  'SUCCESS', ip, userAgent, requestId
);
```

### Suspicious Activity
```typescript
// Automated threat detection
await AuditService.logSuspiciousActivity(
  tenant,
  'multiple_failed_logins',
  { attemptCount: 5, timeWindow: '5 minutes' },
  'high',
  ip, userAgent, requestId
);
```

## 📊 Accessing Metrics

### Prometheus Endpoint
```
GET http://localhost:9464/metrics
```

### Common PromQL Queries
```promql
# Authentication success rate over last 5 minutes
rate(auth_success_total[5m]) / rate(auth_attempts_total[5m]) * 100

# 95th percentile webhook processing lag
histogram_quantile(0.95, webhook_lag_seconds_bucket)

# Failed captures by merchant
sum by (merchant_id) (capture_failures_total)

# Request rate by endpoint
sum by (path) (rate(http_requests_total[5m]))
```

## 🎭 Development vs Production

### Development
- **Tracing**: Console output for easy debugging
- **Metrics**: Available at http://localhost:9464/metrics
- **Logging**: Pretty-printed JSON logs
- **Audit**: Full audit trail in development database

### Production
- **Tracing**: Exported to Jaeger for distributed analysis
- **Metrics**: Scraped by Prometheus monitoring
- **Logging**: Structured JSON logs for log aggregation
- **Audit**: Encrypted audit logs with retention policies

## 🔧 Configuration

### Required Dependencies
```json
{
  "@opentelemetry/sdk-node": "^0.45.0",
  "@opentelemetry/auto-instrumentations-node": "^0.40.0",
  "@opentelemetry/exporter-jaeger": "^1.17.0",
  "@opentelemetry/exporter-prometheus": "^0.45.0",
  "@opentelemetry/semantic-conventions": "^1.17.0"
}
```

### Docker Compose (for local development)
```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "14268:14268"  # HTTP collector
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

## 🏷️ Best Practices

### 1. **Trace Naming**
- Use verb-noun format: `process_payment`, `validate_kyb`, `send_webhook`
- Include business context, not just technical details

### 2. **Metric Labels**
- Keep cardinality low (< 1000 unique combinations per metric)
- Use `tenant_id`, `merchant_id`, not specific user IDs
- Clean URL paths (replace IDs with placeholders)

### 3. **Logging**
- Use structured fields, not string interpolation
- Include correlation IDs for distributed tracing
- Log business events, not just technical events

### 4. **Audit Events**
- Log all security-sensitive operations
- Include sufficient context for investigations
- Never log sensitive data (passwords, card numbers)
- Use consistent action naming conventions

## 🔍 Troubleshooting

### Common Issues

1. **High Cardinality Metrics**
   - Symptom: Prometheus memory usage growing
   - Solution: Check metric labels, remove high-cardinality fields

2. **Missing Traces**
   - Symptom: Spans not appearing in Jaeger
   - Solution: Verify JAEGER_ENDPOINT and network connectivity

3. **Audit Log Performance**
   - Symptom: Slow API responses
   - Solution: Audit logging is async, check database indices

4. **Log Correlation**
   - Symptom: Can't correlate logs across services
   - Solution: Ensure requestId is propagated in all outbound calls

## 📚 Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Structured Logging Guidelines](https://www.structlog.org/)
- [Financial Services Audit Requirements](https://www.bis.org/bcbs/publ/d431.htm)