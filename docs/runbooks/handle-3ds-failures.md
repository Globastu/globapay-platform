# Runbook: Handle 3DS Failures

## Overview

This runbook provides comprehensive procedures for handling 3D Secure (3DS) authentication failures in the Globapay Platform. 3DS failures can occur due to various reasons including cardholder authentication issues, technical problems, or configuration errors.

## 3D Secure Overview

### What is 3D Secure?
3D Secure is an authentication protocol that adds an extra layer of security for online card transactions by requiring cardholder authentication (typically via SMS, mobile app, or biometrics).

### When 3DS is Required
- **European Economic Area (EEA)** transactions under PSD2/SCA requirements
- **High-risk transactions** flagged by fraud detection
- **Merchant configuration** requiring 3DS for all transactions
- **Issuer requirements** for specific card types or amounts

### 3DS Flow States
- `authentication_required` - 3DS challenge needed
- `authentication_pending` - Awaiting cardholder response
- `authentication_successful` - Challenge completed successfully
- `authentication_failed` - Challenge failed or abandoned
- `authentication_unavailable` - 3DS not available for this card

## Common 3DS Failure Types

### Authentication Failures
- **Challenge Abandoned**: Cardholder closed 3DS window without completing
- **Challenge Failed**: Wrong password/PIN entered
- **Challenge Timeout**: No response within time limit (typically 5-10 minutes)
- **Authentication Rejected**: Issuer rejected authentication attempt

### Technical Failures
- **ACS Unavailable**: Access Control Server (issuer's 3DS system) down
- **Network Timeout**: Connection issues during 3DS flow
- **Malformed Response**: Invalid 3DS response format
- **Configuration Error**: Incorrect 3DS settings or credentials

### Integration Failures
- **Callback Issues**: 3DS completion webhook not received
- **State Mismatch**: Transaction state inconsistency
- **Browser Issues**: JavaScript/iframe problems in checkout

## Failure Investigation Process

### Step 1: Identify 3DS Failure

#### Via Transaction Logs
```bash
# Search for 3DS-related failures
GET /admin/transactions/search
{
  "filters": {
    "status": ["failed", "requires_action"],
    "threeDSStatus": ["authentication_failed", "authentication_unavailable"],
    "timeRange": {
      "from": "2024-01-15T00:00:00Z",
      "to": "2024-01-15T23:59:59Z"
    }
  },
  "limit": 50
}
```

#### Via Monitoring Dashboard
- Navigate to **Payments > 3DS Monitoring**
- Filter by failure types and time ranges
- Review real-time 3DS success/failure rates
- Check for patterns or spikes in failures

#### Via Merchant Reports
Merchants may report 3DS issues:
- High abandonment rates in checkout
- Customers unable to complete payments
- 3DS challenges not appearing
- Authentication loops or errors

### Step 2: Analyze Failure Details

#### Get Transaction Details
```bash
# Retrieve full transaction details including 3DS data
GET /admin/transactions/{transactionId}

# Response includes 3DS-specific information:
{
  "id": "txn_1234567890",
  "status": "failed",
  "amount": 5000,
  "currency": "EUR",
  "threeDSData": {
    "version": "2.2.0",
    "status": "authentication_failed",
    "authenticationAttempts": 1,
    "challengeType": "otp",
    "failureReason": "challenge_abandoned",
    "acsTransactionId": "acs_abc123",
    "dsTransactionId": "ds_def456",
    "messageCategory": "01",
    "challengeWindowSize": "03"
  },
  "paymentMethod": {
    "type": "card",
    "card": {
      "bin": "424242",
      "last4": "4242",
      "brand": "visa",
      "issuerCountry": "GB"
    }
  },
  "fraudCheck": {
    "riskScore": 75,
    "decision": "requires_3ds"
  }
}
```

#### Analyze 3DS Flow
```bash
# Get detailed 3DS flow history
GET /admin/transactions/{transactionId}/3ds-history

# Response shows step-by-step 3DS flow:
{
  "steps": [
    {
      "step": "authentication_request",
      "timestamp": "2024-01-15T10:00:00Z",
      "status": "success",
      "details": {
        "acsUrl": "https://acs.bank.com/3ds",
        "paReq": "encoded_pareq_data"
      }
    },
    {
      "step": "challenge_presented",
      "timestamp": "2024-01-15T10:00:30Z", 
      "status": "success",
      "details": {
        "challengeType": "otp",
        "windowSize": "03"
      }
    },
    {
      "step": "challenge_response",
      "timestamp": "2024-01-15T10:02:15Z",
      "status": "failed",
      "details": {
        "errorCode": "challenge_abandoned",
        "errorMessage": "Challenge window closed by user"
      }
    }
  ]
}
```

### Step 3: Categorize Failure Type

Based on analysis, categorize the failure:

#### User-Related Failures (Most Common)
- **Abandonment**: Customer closed challenge window
- **Authentication Error**: Wrong OTP/password entered
- **Timeout**: Customer didn't respond in time
- **Cancel**: Customer explicitly cancelled

#### Technical Failures
- **ACS Issues**: Issuer's 3DS system problems
- **Network Problems**: Connectivity or timeout issues
- **Integration Errors**: Callback or webhook failures
- **Configuration Issues**: Wrong 3DS settings

#### Card/Issuer Issues
- **3DS Not Enrolled**: Card not enrolled for 3DS
- **Issuer Decline**: Bank rejected authentication
- **System Maintenance**: Issuer ACS under maintenance

## Resolution Procedures

### User-Related Failures

#### Challenge Abandonment Resolution
```bash
# Check if retry is possible
GET /admin/transactions/{transactionId}/retry-eligibility

# If eligible, create retry attempt
POST /admin/transactions/{transactionId}/retry-3ds
{
  "retryReason": "challenge_abandoned",
  "notifyCustomer": true,
  "emailTemplate": "3ds_retry_invitation"
}
```

**Customer Communication:**
```json
{
  "emailType": "3ds_retry",
  "subject": "Complete Your Payment - Additional Verification Required",
  "content": {
    "message": "Your payment requires additional verification for security. Please click the link below to complete your payment.",
    "retryUrl": "https://checkout.globapay.com/retry/{retryToken}",
    "expiresAt": "2024-01-16T10:00:00Z"
  }
}
```

#### Authentication Error Resolution
For repeated authentication failures:

1. **Suggest Alternative Payment Method**
   ```bash
   POST /admin/merchants/{merchantId}/notify
   {
     "type": "suggest_alternative_payment",
     "transactionId": "txn_1234567890",
     "customerEmail": "customer@example.com",
     "alternatives": ["different_card", "bank_transfer", "digital_wallet"]
   }
   ```

2. **Contact Card Issuer**
   - Provide customer with issuer contact information
   - Suggest customer verify 3DS enrollment status
   - Recommend updating mobile number with bank

### Technical Failures

#### ACS Unavailable Resolution
```bash
# Check ACS status across issuers
GET /admin/3ds/acs-status

# Response shows issuer ACS availability:
{
  "acsStatus": [
    {
      "issuer": "Chase Bank",
      "acsUrl": "https://acs.chase.com",
      "status": "down",
      "lastCheck": "2024-01-15T10:30:00Z",
      "errorRate": 100
    },
    {
      "issuer": "Bank of America", 
      "acsUrl": "https://acs.bofa.com",
      "status": "operational",
      "lastCheck": "2024-01-15T10:30:00Z",
      "errorRate": 2
    }
  ]
}
```

**Resolution Steps:**
1. **Contact PSP Support** about issuer ACS issues
2. **Enable 3DS Exemption** temporarily if allowed
3. **Monitor ACS Recovery** and resume normal processing
4. **Notify Affected Merchants** of temporary issues

#### Network Timeout Resolution
```bash
# Increase 3DS timeout for specific transactions
PUT /admin/3ds/config/timeouts
{
  "challengeTimeout": 600,  # 10 minutes
  "networkTimeout": 30,     # 30 seconds
  "retryCount": 3
}

# Retry failed transactions with extended timeout
POST /admin/transactions/bulk-retry
{
  "criteria": {
    "failureReason": "network_timeout",
    "timeRange": "1h"
  },
  "retryOptions": {
    "extendedTimeout": true,
    "maxRetries": 1
  }
}
```

### Configuration Issues

#### 3DS Settings Validation
```bash
# Validate merchant 3DS configuration
GET /admin/merchants/{merchantId}/3ds/validate-config

# Response identifies configuration issues:
{
  "valid": false,
  "issues": [
    {
      "field": "merchantCategoryCode",
      "issue": "Invalid MCC code for 3DS",
      "recommendation": "Update MCC to match business type"
    },
    {
      "field": "threeDSRequestorId", 
      "issue": "Missing requestor ID",
      "recommendation": "Contact PSP to obtain 3DS requestor ID"
    }
  ]
}
```

#### Fix Configuration Issues
```bash
# Update merchant 3DS configuration
PUT /admin/merchants/{merchantId}/3ds/config
{
  "threeDSRequestorId": "1234567890123",
  "threeDSRequestorName": "Acme Healthcare",
  "merchantCategoryCode": "8011",
  "acquirerCountryCode": "840",
  "acquirerMerchantId": "ACQ_MERCH_123"
}
```

## Merchant Support Procedures

### Step 1: Gather Information from Merchant

**Required Information:**
- Transaction ID(s) experiencing 3DS issues
- Customer reports or feedback
- 3DS success rate trends
- Recent configuration changes
- Browser/device information from customers

### Step 2: Initial Troubleshooting

#### Check Merchant Dashboard
```bash
# Get merchant 3DS statistics
GET /admin/merchants/{merchantId}/3ds/stats
{
  "timeRange": "7d"
}

# Response:
{
  "totalTransactions": 1250,
  "threeDSRequired": 890,
  "threeDSSuccessful": 712,
  "threeDSFailed": 178,
  "successRate": 80.0,
  "failureBreakdown": {
    "challenge_abandoned": 89,
    "authentication_failed": 45,
    "technical_error": 28,
    "timeout": 16
  }
}
```

#### Review Recent Changes
- Check for recent configuration updates
- Review PSP or issuer notifications
- Verify certificate/key rotations
- Check for platform updates affecting 3DS

### Step 3: Provide Resolution

#### For High Abandonment Rates
1. **Optimize Challenge Flow**
   ```bash
   # Update 3DS challenge preferences
   PUT /admin/merchants/{merchantId}/3ds/challenge-preferences
   {
     "preferredChallengeType": "otp",
     "fallbackChallengeType": "native_app",
     "windowSize": "02"  # Smaller window for mobile
   }
   ```

2. **Improve User Experience**
   - Add progress indicators in checkout
   - Provide clear instructions about 3DS
   - Optimize mobile 3DS flow
   - Add customer support contact during 3DS

#### For Technical Issues
1. **PSP Coordination**
   - Escalate to Payment Service Provider
   - Request 3DS logs and diagnostics
   - Coordinate testing with PSP team

2. **Alternative Processing**
   - Enable 3DS exemptions where allowed
   - Route to backup PSP if available
   - Implement retry logic with delays

## Monitoring and Alerting

### 3DS Performance Metrics

#### Real-Time Dashboard
Monitor key 3DS metrics:
- **3DS Success Rate**: Target > 85%
- **Challenge Abandonment Rate**: Target < 15%
- **Technical Failure Rate**: Target < 3%
- **Average Challenge Duration**: Track user experience

#### Automated Alerts
```bash
# Configure 3DS failure alerts
POST /admin/monitoring/alerts
[
  {
    "type": "3ds_success_rate_low",
    "threshold": 80,
    "timeWindow": "15m",
    "severity": "warning",
    "recipients": ["payments@globapay.com"]
  },
  {
    "type": "3ds_acs_unavailable",
    "threshold": "any",
    "severity": "critical",
    "recipients": ["oncall@globapay.com"]
  },
  {
    "type": "3ds_high_abandonment",
    "threshold": 25,
    "timeWindow": "1h", 
    "severity": "warning",
    "recipients": ["merchant-success@globapay.com"]
  }
]
```

### Merchant-Specific Monitoring

#### Individual Merchant Alerts
```bash
# Set merchant-specific 3DS alerts
POST /admin/merchants/{merchantId}/alerts/3ds
{
  "successRateThreshold": 75,  # Lower threshold for this merchant
  "alertFrequency": "daily",
  "includeCustomerFeedback": true
}
```

## Preventive Measures

### 3DS Optimization

#### Challenge Type Optimization
```bash
# Analyze optimal challenge types by success rate
GET /admin/analytics/3ds/challenge-types

# Update preferences based on data
PUT /admin/3ds/global-preferences
{
  "preferredTypes": ["biometric", "otp", "password"],
  "avoidTypes": ["knowledge_based"],
  "mobileOptimized": true
}
```

#### Issuer-Specific Configuration
```bash
# Configure different settings per issuer
PUT /admin/3ds/issuer-config
{
  "configurations": [
    {
      "issuerBin": "424242",
      "preferredChallengeType": "native_app",
      "timeout": 600,
      "retryEnabled": true
    },
    {
      "issuerBin": "555555",
      "preferredChallengeType": "otp",
      "timeout": 300,
      "retryEnabled": false
    }
  ]
}
```

### Customer Education

#### Checkout Page Improvements
- Add 3DS explanation before payment
- Show progress indicators during authentication
- Provide help links and contact information
- Display expected authentication methods

#### Email Templates
Create informative email templates for 3DS issues:
```json
{
  "template": "3ds_explanation",
  "subject": "About Payment Security Verification",
  "content": {
    "html": "Your payment requires additional verification from your bank for security. This is called 3D Secure authentication...",
    "includeVideo": true,
    "supportUrl": "https://help.merchant.com/payment-verification"
  }
}
```

## Escalation Procedures

### Internal Escalation
| Issue Type | First Response | Escalation Path | SLA |
|------------|----------------|----------------|-----|
| **Customer 3DS Issues** | Merchant Support | Senior Support → Payments Team | 2 hours |
| **Technical 3DS Failures** | Platform Engineering | Senior Engineering → CTO | 30 minutes |
| **PSP 3DS Issues** | Partnerships Team | VP Partnerships → External PSP | 1 hour |
| **Widespread 3DS Outage** | Incident Commander | Emergency Response Team | 15 minutes |

### External Escalation

#### PSP Escalation
```bash
# Create PSP support ticket
POST /admin/external/psp-support/tickets
{
  "priority": "high",
  "category": "3ds_technical_issue",
  "merchantId": "org_merchant123",
  "transactionIds": ["txn_123", "txn_456"],
  "description": "High 3DS failure rate for Visa cards from Chase Bank",
  "contactMethod": "phone_and_email"
}
```

#### Issuer Communication
For widespread issuer-specific issues:
1. Contact issuer's merchant services
2. Escalate through PSP relationships
3. Coordinate with other payment processors
4. Document issuer response times and resolutions

## Success Metrics and KPIs

### Performance Targets
- **Overall 3DS Success Rate**: > 85%
- **Challenge Completion Rate**: > 80%
- **Technical Failure Rate**: < 3%
- **Mean Time to Resolution**: < 2 hours

### Merchant Satisfaction
- **Support Response Time**: < 1 hour
- **Issue Resolution Rate**: > 95%
- **Merchant NPS Score**: > 7.0

### Operational Metrics
- **False Decline Reduction**: Track 3DS impact on legitimate transactions
- **Fraud Prevention Effectiveness**: Monitor fraud caught by 3DS
- **Cost per Authentication**: Track 3DS processing costs

## Related Documentation
- [Payment Processing Guide](./payment-processing.md)
- [Fraud Detection Procedures](./fraud-detection.md)
- [Merchant Support Procedures](./merchant-support.md)
- [PSP Integration Guide](./psp-integration.md)

## Emergency Contacts
- **24/7 Payments Support**: +1-800-PAY-HELP
- **PSP Technical Support**: Via merchant support portal
- **Platform Engineering**: engineering@globapay.com
- **Merchant Success Team**: success@globapay.com