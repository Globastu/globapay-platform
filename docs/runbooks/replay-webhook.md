# Runbook: Replay Webhook

## Overview

This runbook provides step-by-step procedures for replaying webhooks in the Globapay Platform. Webhook replay is necessary when merchant endpoints fail to receive or process webhook events properly, ensuring data consistency and merchant system synchronization.

## When to Replay Webhooks

### Common Scenarios
- **Merchant Endpoint Downtime**: Target endpoint was unavailable
- **Processing Failures**: Merchant endpoint returned non-2xx status
- **Network Issues**: Timeout or connection failures
- **Merchant Request**: Manual replay for data synchronization
- **System Recovery**: After platform maintenance or outages
- **Integration Testing**: Redelivering events for development/testing

### Webhook Event Types
- `payment.completed` - Payment successfully processed
- `payment.failed` - Payment processing failed
- `payment.refunded` - Payment refund processed
- `checkout.expired` - Checkout session expired
- `kyb.approved` - KYB verification approved
- `kyb.rejected` - KYB verification rejected
- `fraud.alert` - High-risk transaction detected

## Prerequisites

- Platform Admin or Technical Support access
- Access to webhook monitoring dashboard
- Knowledge of merchant's webhook endpoint configuration
- Understanding of webhook event structure and timing

## Webhook Replay Process

### Step 1: Identify Webhook Events to Replay

#### Via Web Dashboard
1. **Navigate to Webhook Management**
   ```
   Dashboard > Admin > Webhooks > Event History
   ```

2. **Filter Failed Events**
   - Status: `failed`, `timeout`, `retry_exhausted`
   - Time Range: Select relevant period
   - Merchant ID: Specific merchant or all
   - Event Type: Specific events or all

3. **Review Event Details**
   - Event ID and timestamp
   - Failure reason and error code
   - Retry attempts and last attempt time
   - Merchant endpoint configuration

#### Via API Query
```bash
# Get failed webhook events
GET /admin/webhooks/events?status=failed&limit=50&merchantId={merchantId}

# Response includes:
{
  "events": [
    {
      "id": "we_1234567890",
      "eventType": "payment.completed",
      "merchantId": "org_merchant123",
      "status": "failed",
      "attempts": 3,
      "lastAttempt": "2024-01-15T10:30:00Z",
      "lastError": "Connection timeout after 30s",
      "webhookUrl": "https://merchant.com/webhooks/globapay",
      "payload": {...},
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

### Step 2: Verify Merchant Endpoint Health

#### Check Endpoint Availability
```bash
# Test webhook endpoint connectivity
POST /admin/webhooks/test-endpoint
{
  "merchantId": "org_merchant123",
  "url": "https://merchant.com/webhooks/globapay",
  "testPayload": {
    "eventType": "webhook.test",
    "timestamp": "2024-01-15T11:00:00Z",
    "data": {"test": true}
  }
}

# Response:
{
  "success": true,
  "responseCode": 200,
  "responseTime": 250,
  "responseHeaders": {"content-type": "application/json"},
  "responseBody": {"status": "received"}
}
```

#### Validate Webhook Configuration
- **Endpoint URL**: Verify correct HTTPS endpoint
- **Authentication**: Check signature validation setup
- **Response Format**: Ensure endpoint returns proper 2xx status
- **Timeout Settings**: Verify reasonable response times (<30s)

### Step 3: Single Webhook Replay

#### Via Web Dashboard
1. **Select Event to Replay**
   - Navigate to specific webhook event
   - Click **"Replay Event"** button
   - Review event details in replay modal

2. **Configure Replay Options**
   ```json
   {
     "immediate": true,
     "retryPolicy": "exponential_backoff",
     "maxRetries": 3,
     "notifyOnSuccess": true,
     "notifyOnFailure": true
   }
   ```

3. **Initiate Replay**
   - Click **"Confirm Replay"**
   - Monitor replay status in real-time
   - Review delivery confirmation

#### Via API
```bash
# Replay single webhook event
POST /admin/webhooks/{eventId}/replay
{
  "options": {
    "immediate": true,
    "maxRetries": 3,
    "retryDelaySeconds": 30,
    "notifyOnCompletion": true
  },
  "reason": "Merchant endpoint was down during original delivery"
}

# Response:
{
  "replayId": "wr_replay123",
  "status": "queued",
  "scheduledAt": "2024-01-15T11:05:00Z",
  "estimatedDelivery": "2024-01-15T11:05:30Z"
}
```

### Step 4: Bulk Webhook Replay

#### Bulk Replay via Dashboard
1. **Select Multiple Events**
   - Use checkboxes to select events
   - Or use filters to select by criteria
   - Maximum 100 events per bulk operation

2. **Configure Bulk Replay**
   ```json
   {
     "batchSize": 10,
     "delayBetweenBatches": 60,
     "retryFailedEvents": true,
     "preserveOriginalOrder": false
   }
   ```

#### Bulk Replay via API
```bash
# Bulk replay by criteria
POST /admin/webhooks/bulk-replay
{
  "criteria": {
    "merchantId": "org_merchant123",
    "status": "failed",
    "eventTypes": ["payment.completed", "payment.failed"],
    "timeRange": {
      "from": "2024-01-15T00:00:00Z",
      "to": "2024-01-15T23:59:59Z"
    }
  },
  "options": {
    "batchSize": 25,
    "delayBetweenBatches": 30,
    "maxRetries": 2,
    "dryRun": false
  },
  "reason": "Replay events from merchant downtime period"
}

# Response:
{
  "bulkReplayId": "br_bulk456",
  "totalEvents": 47,
  "batchCount": 2,
  "estimatedDuration": "00:02:30",
  "status": "queued"
}
```

#### Specific Event IDs Replay
```bash
# Replay specific webhook events
POST /admin/webhooks/replay-batch
{
  "eventIds": [
    "we_1234567890",
    "we_1234567891", 
    "we_1234567892"
  ],
  "options": {
    "immediate": true,
    "maxRetries": 3
  }
}
```

## Step 5: Monitor Replay Progress

### Real-time Monitoring
```bash
# Check replay status
GET /admin/webhooks/replays/{replayId}/status

# Response:
{
  "replayId": "wr_replay123",
  "status": "completed",
  "progress": {
    "total": 47,
    "completed": 47,
    "successful": 45,
    "failed": 2
  },
  "startedAt": "2024-01-15T11:05:00Z",
  "completedAt": "2024-01-15T11:07:30Z",
  "duration": "00:02:30"
}
```

### Bulk Replay Monitoring
```bash
# Monitor bulk replay progress
GET /admin/webhooks/bulk-replays/{bulkReplayId}

# WebSocket connection for real-time updates
wss://api.globapay.com/admin/webhooks/bulk-replays/{bulkReplayId}/stream
```

### Delivery Confirmations
Track individual webhook delivery attempts:
```bash
# Get delivery attempts for event
GET /admin/webhooks/events/{eventId}/attempts

# Response:
{
  "attempts": [
    {
      "attemptId": "wa_attempt1",
      "timestamp": "2024-01-15T11:05:30Z",
      "responseCode": 200,
      "responseTime": 180,
      "success": true,
      "retryCount": 0
    }
  ]
}
```

## Step 6: Handle Replay Failures

### Failed Replay Analysis
```bash
# Get failed replay details
GET /admin/webhooks/replays/{replayId}/failures

# Response:
{
  "failures": [
    {
      "eventId": "we_1234567890",
      "failureReason": "Connection timeout",
      "responseCode": null,
      "lastAttempt": "2024-01-15T11:06:00Z",
      "retryCount": 3,
      "nextRetry": null
    }
  ],
  "totalFailures": 2
}
```

### Retry Failed Replays
```bash
# Retry failed events from replay
POST /admin/webhooks/replays/{replayId}/retry-failures
{
  "maxAdditionalRetries": 2,
  "retryDelayMinutes": 15,
  "onlySpecificFailures": ["Connection timeout", "HTTP 5xx"]
}
```

### Manual Investigation
For persistent failures:
1. **Check Merchant Endpoint**
   - Test endpoint directly
   - Verify SSL certificate validity
   - Check for IP whitelisting requirements

2. **Review Webhook Configuration**
   - Validate signature verification
   - Check content-type handling
   - Verify timeout settings

3. **Contact Merchant**
   - Inform about webhook issues
   - Request endpoint health check
   - Coordinate testing schedule

## Webhook Replay Best Practices

### Timing Considerations
- **Off-Peak Hours**: Schedule bulk replays during low-traffic periods
- **Business Hours**: Consider merchant's timezone for critical events
- **Sequential Processing**: Maintain event order for dependent operations
- **Rate Limiting**: Avoid overwhelming merchant endpoints

### Event Deduplication
Merchants should implement idempotency:
```json
{
  "eventId": "we_1234567890",
  "idempotencyKey": "payment_12345_completed",
  "eventType": "payment.completed",
  "timestamp": "2024-01-15T10:00:00Z",
  "isReplay": true,
  "originalTimestamp": "2024-01-15T10:00:00Z",
  "data": {...}
}
```

### Replay Limitations
- **Maximum Age**: Events older than 30 days cannot be replayed
- **Rate Limits**: Maximum 1000 events per hour per merchant
- **Bulk Size**: Maximum 500 events per bulk replay
- **Concurrency**: Maximum 3 concurrent replays per merchant

## Monitoring and Alerting

### Replay Metrics Dashboard
Monitor key metrics:
- **Replay Success Rate**: Target > 95%
- **Average Replay Time**: Track performance
- **Failed Replay Count**: Monitor for patterns
- **Merchant Endpoint Health**: Track availability

### Automated Alerts
Configure alerts for:
- **High Replay Volume**: Unusual replay activity
- **Repeated Failures**: Same events failing multiple times
- **Endpoint Issues**: Merchant endpoints consistently failing
- **Long-Running Replays**: Replays taking longer than expected

## Troubleshooting Common Issues

### Connection Issues
| Error | Cause | Resolution |
|-------|-------|------------|
| **Connection Timeout** | Slow merchant endpoint | Increase timeout, check endpoint performance |
| **Connection Refused** | Endpoint down or wrong URL | Verify endpoint status and URL |
| **SSL Handshake Failed** | Certificate issues | Check SSL certificate validity |
| **DNS Resolution Failed** | Domain issues | Verify domain configuration |

### Authentication Issues
| Error | Cause | Resolution |
|-------|-------|------------|
| **Invalid Signature** | Signature verification failed | Verify webhook secret and signing algorithm |
| **Missing Headers** | Required headers not sent | Check webhook configuration |
| **Unauthorized** | Authentication failed | Verify API credentials and permissions |

### Processing Issues
| Error | Cause | Resolution |
|-------|-------|------------|
| **HTTP 422** | Invalid payload format | Validate event structure |
| **HTTP 500** | Merchant processing error | Contact merchant for investigation |
| **Duplicate Event** | Event already processed | Verify idempotency implementation |

## Emergency Procedures

### Critical System Recovery
After major outages:
1. **Assess Impact Period**
   - Identify affected time range
   - Count failed webhook events
   - Prioritize critical event types

2. **Coordinate with Merchants**
   - Notify affected merchants
   - Provide estimated recovery timeline
   - Request endpoint readiness confirmation

3. **Staged Replay Process**
   - Start with high-priority merchants
   - Use small batch sizes initially
   - Monitor system performance during replay

### Escalation Matrix
| Severity | Response Time | Escalation Path |
|----------|---------------|----------------|
| **P1 - Critical** | 15 minutes | Platform Engineering → CTO |
| **P2 - High** | 1 hour | Technical Support → Engineering Manager |
| **P3 - Medium** | 4 hours | Support Team → Technical Lead |
| **P4 - Low** | 24 hours | Support Team |

## Success Metrics

### Operational KPIs
- **Webhook Delivery Success Rate**: Target > 99%
- **Replay Success Rate**: Target > 95%
- **Mean Time to Replay**: Target < 1 hour
- **Merchant Satisfaction**: Target > 4.5/5

### Performance Metrics
- **Average Replay Processing Time**: Track efficiency
- **Bulk Replay Throughput**: Events processed per minute
- **Error Rate by Merchant**: Identify problematic endpoints
- **System Resource Usage**: Monitor during bulk operations

## Related Documentation
- [Webhook Integration Guide](./webhook-integration.md)
- [Merchant Support Procedures](./merchant-support.md)
- [System Recovery Procedures](./system-recovery.md)
- [Platform Monitoring](./monitoring-alerts.md)

## Emergency Contacts
- **Platform Engineering**: engineering@globapay.com
- **Technical Support**: support@globapay.com  
- **Merchant Success**: success@globapay.com
- **24/7 Operations**: ops@globapay.com