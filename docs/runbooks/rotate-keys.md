# Runbook: Rotate Keys

## Overview

This runbook covers the secure rotation of various cryptographic keys in the Globapay Platform, including API keys, JWT signing keys, webhook signing secrets, and database encryption keys. Regular key rotation is essential for maintaining security and compliance.

## Key Types and Rotation Frequency

| Key Type | Rotation Frequency | Impact Level | Automation |
|----------|-------------------|--------------|------------|
| **JWT Signing Keys** | Every 90 days | High - All user sessions | Automated |
| **API Keys** | On-demand/Breach | Medium - Specific merchant | Manual |
| **Webhook Secrets** | Every 180 days | Medium - Webhook delivery | Semi-automated |
| **Database Encryption** | Yearly | High - All stored data | Manual |
| **TLS/SSL Certificates** | Before expiration | High - All connections | Automated |

## Prerequisites

- Platform Admin or Security Officer access
- Access to key management systems
- Database admin privileges for encryption key rotation
- Coordination with affected merchants for API key changes
- Maintenance window scheduling for system-wide rotations

## JWT Signing Key Rotation

### Overview
JWT signing keys are used to sign access tokens and refresh tokens. Rotation ensures compromised keys have limited impact.

### Automated Rotation Process

#### Step 1: Generate New Key Pair
```bash
# Generate new RSA key pair
openssl genrsa -out jwt_private_new.pem 2048
openssl rsa -in jwt_private_new.pem -pubout -out jwt_public_new.pem

# Or using the platform API
POST /admin/security/jwt-keys/generate
{
  "keyAlgorithm": "RS256",
  "keySize": 2048,
  "validFrom": "2024-01-15T00:00:00Z",
  "description": "Monthly JWT key rotation - January 2024"
}
```

#### Step 2: Deploy New Key (Dual Key Period)
```bash
# Add new key to active key set
POST /admin/security/jwt-keys
{
  "privateKey": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "keyId": "jwt_key_2024_01",
  "algorithm": "RS256",
  "status": "active",
  "primary": false  # Keep old key as primary initially
}
```

#### Step 3: Update Token Signing
```bash
# Switch to new key for signing new tokens
PUT /admin/security/jwt-keys/{newKeyId}/set-primary
{
  "effectiveDate": "2024-01-15T12:00:00Z"
}
```

#### Step 4: Monitor Token Validation
- Monitor error rates for JWT validation
- Check for authentication failures
- Verify both old and new tokens work during overlap period

#### Step 5: Retire Old Key
```bash
# After 24-48 hours, retire old key
PUT /admin/security/jwt-keys/{oldKeyId}
{
  "status": "retired",
  "retiredDate": "2024-01-17T12:00:00Z"
}
```

### Manual JWT Key Rotation

#### Emergency Key Rotation
For compromised keys requiring immediate rotation:

```bash
# 1. Immediately disable compromised key
PUT /admin/security/jwt-keys/{compromisedKeyId}
{
  "status": "revoked",
  "revokedReason": "Security breach - key compromised",
  "immediateRevocation": true
}

# 2. Generate and deploy new key immediately
POST /admin/security/jwt-keys/emergency-generate
{
  "replaceKeyId": "{compromisedKeyId}",
  "reason": "Emergency rotation due to compromise"
}

# 3. Invalidate all active sessions
POST /admin/security/sessions/invalidate-all
{
  "reason": "Emergency key rotation",
  "excludeAdminSessions": false
}
```

## API Key Rotation

### Merchant API Key Rotation

#### Step 1: Generate New API Key
```bash
# Create new API key for merchant
POST /api-keys
{
  "organizationId": "org_merchant123",
  "name": "Production API Key - Rotated Jan 2024",
  "permissions": ["read", "write", "process_payments"],
  "expiresAt": "2025-01-15T00:00:00Z"
}

# Response:
{
  "keyId": "ak_new_1234567890",
  "key": "gp_live_sk_new1234567890abcdef",
  "permissions": ["read", "write", "process_payments"],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Step 2: Notify Merchant
Send secure notification to merchant with new API key:

```bash
POST /notifications/send
{
  "type": "api_key_rotation",
  "recipientId": "user_merchant_admin",
  "secureDelivery": true,
  "templateData": {
    "newKeyId": "ak_new_1234567890",
    "oldKeyId": "ak_old_1234567890",
    "rotationDeadline": "2024-01-29T23:59:59Z",
    "testEndpoint": "https://api.globapay.com/test-auth"
  },
  "urgency": "high"
}
```

#### Step 3: Merchant Integration Update
Provide merchant with update instructions:

```javascript
// Update merchant's integration
const client = new GlobapayClient({
  // Replace old API key
  // apiKey: 'gp_live_sk_old1234567890abcdef',  // OLD KEY
  apiKey: 'gp_live_sk_new1234567890abcdef',     // NEW KEY
  environment: 'production'
});

// Test authentication
try {
  const result = await client.auth.test();
  console.log('New API key working:', result);
} catch (error) {
  console.error('API key rotation failed:', error);
}
```

#### Step 4: Monitor Usage Transition
```bash
# Monitor API key usage
GET /admin/api-keys/usage-stats
{
  "keyIds": ["ak_old_1234567890", "ak_new_1234567890"],
  "timeRange": "24h"
}

# Response shows usage transition:
{
  "stats": [
    {
      "keyId": "ak_old_1234567890",
      "requests24h": 150,  # Decreasing
      "lastUsed": "2024-01-16T09:30:00Z"
    },
    {
      "keyId": "ak_new_1234567890", 
      "requests24h": 1250, # Increasing
      "lastUsed": "2024-01-16T10:45:00Z"
    }
  ]
}
```

#### Step 5: Disable Old API Key
After confirming merchant has switched:

```bash
# Disable old API key
PUT /api-keys/{oldKeyId}
{
  "status": "disabled",
  "disabledReason": "Rotated to new key",
  "gracePeriodHours": 24  # Allow 24hr grace period
}
```

### Platform API Key Rotation

For internal service-to-service API keys:

```bash
# Rotate internal service keys
POST /admin/security/internal-keys/rotate
{
  "serviceId": "fraud-detection-service",
  "rotationType": "scheduled",
  "rolloverPeriodHours": 4
}
```

## Webhook Secret Rotation

### Step 1: Generate New Webhook Secret
```bash
# Generate new webhook signing secret
POST /admin/webhooks/secrets/generate
{
  "merchantId": "org_merchant123",
  "purpose": "Webhook signature verification",
  "algorithm": "HMAC-SHA256",
  "secretLength": 64
}

# Response:
{
  "secretId": "whs_new_abcdef123",
  "secret": "whsec_new_1234567890abcdef...",
  "algorithm": "HMAC-SHA256",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Step 2: Dual Secret Period
Configure system to sign webhooks with both old and new secrets:

```bash
# Enable dual signing
PUT /admin/webhooks/merchants/{merchantId}/signing
{
  "primarySecretId": "whs_old_123456",
  "secondarySecretId": "whs_new_abcdef123",
  "dualSigningEnabled": true,
  "transitionPeriodHours": 72
}
```

### Step 3: Notify Merchant
```bash
POST /notifications/send
{
  "type": "webhook_secret_rotation",
  "recipientId": "user_merchant_admin",
  "templateData": {
    "newSecret": "whsec_new_1234567890abcdef...",
    "rotationDeadline": "2024-01-18T00:00:00Z",
    "testWebhookUrl": "https://webhook.globapay.com/test"
  }
}
```

### Step 4: Merchant Webhook Update
Merchant updates their webhook verification:

```python
# Python example for merchant webhook verification
import hmac
import hashlib

def verify_webhook_signature(payload, signature_header, webhook_secret):
    # Handle both old and new secrets during transition
    secrets = [
        'whsec_old_1234567890abcdef...',  # Old secret
        'whsec_new_1234567890abcdef...'   # New secret
    ]
    
    for secret in secrets:
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(signature_header, expected_signature):
            return True
    
    return False
```

### Step 5: Complete Transition
```bash
# Switch to new secret only
PUT /admin/webhooks/merchants/{merchantId}/signing
{
  "primarySecretId": "whs_new_abcdef123",
  "dualSigningEnabled": false
}

# Retire old secret
PUT /admin/webhooks/secrets/{oldSecretId}
{
  "status": "retired",
  "retiredDate": "2024-01-18T00:00:00Z"
}
```

## Database Encryption Key Rotation

### Overview
Database encryption keys protect sensitive data at rest. Rotation requires careful coordination to avoid data loss.

### Preparation Steps

#### Step 1: Create Maintenance Window
```bash
# Schedule maintenance window
POST /admin/maintenance/schedule
{
  "type": "database_key_rotation",
  "scheduledStart": "2024-01-20T02:00:00Z",
  "estimatedDuration": "PT2H",  # 2 hours
  "impact": "partial_service_degradation",
  "notifyUsers": true
}
```

#### Step 2: Backup Database
```bash
# Create full database backup before rotation
pg_dump -h localhost -U postgres globapay_production > backup_pre_rotation_$(date +%Y%m%d).sql

# Verify backup integrity
pg_restore --list backup_pre_rotation_20240120.sql
```

### Rotation Process

#### Step 3: Generate New Encryption Key
```bash
# Generate new database encryption key
openssl rand -hex 32 > new_db_encryption_key.txt

# Securely store in key management system
aws secretsmanager create-secret \
  --name "globapay/db/encryption/key/2024-01" \
  --secret-string file://new_db_encryption_key.txt
```

#### Step 4: Update Database Configuration
```bash
# Update PostgreSQL configuration
# Add new key while keeping old key active
ALTER SYSTEM SET encryption_keys = 'old_key_id:old_key_value,new_key_id:new_key_value';
SELECT pg_reload_conf();
```

#### Step 5: Re-encrypt Data
```sql
-- Re-encrypt sensitive columns with new key
-- This process runs in background to minimize impact
SELECT schedule_encryption_rotation('new_key_id', 'batch_size=1000, delay_ms=100');

-- Monitor progress
SELECT 
    table_name,
    progress_pct,
    estimated_completion
FROM encryption_rotation_status;
```

#### Step 6: Verify Encryption
```bash
# Test data access with new key
psql -d globapay_production -c "SELECT decrypt(encrypted_column, 'new_key_id') FROM sensitive_table LIMIT 1;"

# Run data integrity check
npm run db:verify-encryption
```

#### Step 7: Remove Old Key
After successful re-encryption:

```sql
-- Remove old encryption key
ALTER SYSTEM SET encryption_keys = 'new_key_id:new_key_value';
SELECT pg_reload_conf();

-- Archive old key securely
-- Don't delete immediately - keep for recovery
```

## TLS/SSL Certificate Rotation

### Automated Certificate Renewal
```bash
# Renew Let's Encrypt certificates
certbot renew --deploy-hook "systemctl reload nginx"

# For custom certificates, check expiration
openssl x509 -in /etc/ssl/certs/globapay.crt -noout -dates

# Update certificate in load balancer
aws acm import-certificate \
  --certificate fileb://new-cert.pem \
  --private-key fileb://private-key.pem \
  --certificate-chain fileb://cert-chain.pem
```

## Key Rotation Monitoring

### Automated Monitoring
```bash
# Set up monitoring for key expiration
POST /admin/monitoring/alerts
{
  "type": "key_expiration_warning",
  "conditions": {
    "daysBeforeExpiration": 30
  },
  "notifications": ["security@globapay.com"],
  "severity": "warning"
}
```

### Key Rotation Dashboard
Monitor key rotation status:
- JWT key rotation schedule and status
- API key usage and transition metrics
- Webhook secret rotation progress
- Certificate expiration warnings

### Audit Logging
All key rotation activities are logged:
```bash
# Query key rotation audit logs
GET /admin/audit-logs?action=key_rotation&timeRange=30d

# Sample audit log entry:
{
  "timestamp": "2024-01-15T10:00:00Z",
  "action": "KEY_ROTATION",
  "resourceType": "API_KEY",
  "resourceId": "ak_1234567890",
  "actor": "admin@globapay.com",
  "details": {
    "operation": "generate_new_key",
    "merchantId": "org_merchant123",
    "reason": "scheduled_rotation"
  },
  "outcome": "SUCCESS"
}
```

## Emergency Key Revocation

### Immediate Key Compromise Response

#### Step 1: Revoke Compromised Key
```bash
# Immediately revoke compromised key
POST /admin/security/keys/revoke
{
  "keyId": "ak_compromised_key",
  "reason": "SECURITY_BREACH",
  "immediateRevocation": true,
  "blockAllSessions": true
}
```

#### Step 2: Generate Emergency Replacement
```bash
# Generate emergency replacement
POST /admin/security/keys/emergency-generate
{
  "replaceKeyId": "ak_compromised_key",
  "reason": "Emergency rotation due to compromise",
  "notifyStakeholders": true,
  "priority": "critical"
}
```

#### Step 3: Incident Response
- Notify security team
- Document security incident
- Investigate breach scope
- Update security procedures

## Best Practices

### Security Guidelines
- **Never log secret keys** in plain text
- **Use secure key storage** (AWS Secrets Manager, HashiCorp Vault)
- **Implement key versioning** for rollback capability
- **Monitor key usage** for anomalies
- **Regular security audits** of key management processes

### Operational Guidelines
- **Schedule rotations** during low-traffic periods
- **Coordinate with stakeholders** before rotation
- **Test rotations** in staging environment first
- **Maintain rollback plans** for failed rotations
- **Document all procedures** and keep updated

### Compliance Requirements
- **PCI DSS**: Annual key rotation for payment data encryption
- **SOX**: Quarterly access key reviews and rotations
- **GDPR**: Key rotation as part of data protection measures
- **Industry Standards**: Follow NIST guidelines for key management

## Troubleshooting

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| **JWT validation failures** | Key rotation timing | Extend dual-key period |
| **API authentication errors** | Merchant hasn't updated | Contact merchant, extend grace period |
| **Webhook signature failures** | Secret rotation coordination | Re-enable dual signing temporarily |
| **Database access issues** | Encryption key problems | Rollback to previous key |

### Recovery Procedures

#### Failed JWT Rotation
```bash
# Rollback to previous JWT key
PUT /admin/security/jwt-keys/{previousKeyId}/set-primary
{
  "emergencyRollback": true,
  "reason": "JWT rotation failure"
}
```

#### Failed Database Encryption
```bash
# Emergency rollback database encryption
ALTER SYSTEM SET encryption_keys = 'previous_key_id:previous_key_value';
SELECT pg_reload_conf();

# Restore from backup if necessary
pg_restore -d globapay_production backup_pre_rotation_20240120.sql
```

## Success Metrics

### Key Performance Indicators
- **Rotation Success Rate**: Target > 99%
- **Mean Time to Rotate**: Track efficiency
- **Zero Downtime Rotations**: Target 100%
- **Merchant Compliance**: API key updates within deadline

### Security Metrics
- **Key Compromise Detection Time**: Target < 1 hour
- **Emergency Rotation Time**: Target < 15 minutes
- **Audit Compliance Score**: Target 100%

## Related Documentation
- [Security Incident Response](./security-incident.md)
- [Certificate Management](./certificate-management.md)
- [Merchant Support Procedures](./merchant-support.md)
- [Database Administration](./database-admin.md)

## Emergency Contacts
- **Security Team**: security@globapay.com
- **Database Team**: dba@globapay.com
- **Platform Engineering**: engineering@globapay.com
- **24/7 Security Hotline**: +1-800-SECURITY