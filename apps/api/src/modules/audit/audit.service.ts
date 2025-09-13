import type { 
  AuditLogAction, 
  AuditLogResourceType, 
  AuditLogOutcome 
} from '@prisma/client';
import type { TenantContext } from '../auth/types';
import { prisma } from '../../lib/prisma';
import { addSpanEvent, addSpanAttributes } from '../../observability/tracing';
import { createContextLogger } from '../../middleware/logging.middleware';

export interface AuditLogEntry {
  action: AuditLogAction;
  resourceType: AuditLogResourceType;
  resourceId?: string;
  details?: {
    changes?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  outcome: AuditLogOutcome;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(
    tenant: TenantContext,
    entry: AuditLogEntry,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    try {
      // Add tracing information
      addSpanEvent('audit_log_created', {
        action: entry.action,
        resourceType: entry.resourceType,
        outcome: entry.outcome,
        tenantId: tenant.organizationId,
        merchantId: tenant.merchantId || 'none',
      });

      await prisma.auditLog.create({
        data: {
          organizationId: tenant.organizationId,
          merchantId: tenant.merchantId || null,
          userId: tenant.userId || null, // Will be null for API key auth
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId || null,
          details: {
            ...entry.details,
            ...(ipAddress && { ipAddress }),
            ...(userAgent && { userAgent }),
            ...(requestId && { requestId }),
            authType: tenant.isApiKey ? 'api_key' : 'user_session',
            timestamp: new Date().toISOString(),
          },
          outcome: entry.outcome,
          errorMessage: entry.errorMessage || null,
          metadata: entry.metadata || null,
        },
      });

      // Log high-risk events
      if (this.isHighRiskEvent(entry.action)) {
        console.warn(`HIGH RISK AUDIT EVENT: ${entry.action}`, {
          tenantId: tenant.organizationId,
          merchantId: tenant.merchantId,
          userId: tenant.userId,
          resourceId: entry.resourceId,
          outcome: entry.outcome,
          requestId,
        });
      }
    } catch (error) {
      // Don't throw audit logging errors - log them but don't fail the request
      console.error('Failed to log audit event:', error, {
        tenantId: tenant.organizationId,
        action: entry.action,
        requestId,
      });
    }
  }

  /**
   * Check if an audit action is considered high-risk
   */
  private static isHighRiskEvent(action: AuditLogAction): boolean {
    const highRiskActions: AuditLogAction[] = [
      'USER_LOGIN',
      'USER_LOGOUT', 
      'API_KEY_CREATE',
      'API_KEY_REVOKE',
      'MERCHANT_STATUS_CHANGE',
      'TRANSACTION_REFUND',
      'WEBHOOK_REPLAY',
      'KYB_SUBMIT',
      'KYB_APPROVE',
      'KYB_REJECT',
      'PASSWORD_RESET',
      'MFA_ENABLE',
      'MFA_DISABLE',
    ];
    return highRiskActions.includes(action);
  }

  /**
   * Log user authentication events
   */
  static async logUserLogin(
    userId: string,
    organizationId: string,
    outcome: AuditLogOutcome,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(
      {
        organizationId,
        userId,
        permissions: [],
        isApiKey: false,
      },
      {
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: userId,
        outcome,
        errorMessage,
      },
      ipAddress,
      userAgent
    );
  }

  static async logUserLogout(
    userId: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      {
        organizationId,
        userId,
        permissions: [],
        isApiKey: false,
      },
      {
        action: 'USER_LOGOUT',
        resourceType: 'USER',
        resourceId: userId,
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log merchant operations
   */
  static async logMerchantCreate(
    tenant: TenantContext,
    merchantId: string,
    merchantData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'MERCHANT_CREATE',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes: { created: merchantData },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logMerchantUpdate(
    tenant: TenantContext,
    merchantId: string,
    changes: Record<string, any>,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'MERCHANT_UPDATE',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes,
          reason,
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logMerchantStatusChange(
    tenant: TenantContext,
    merchantId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'MERCHANT_STATUS_CHANGE',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes: {
            status: { from: oldStatus, to: newStatus },
          },
          reason,
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log payment operations
   */
  static async logPaymentLinkCreate(
    tenant: TenantContext,
    paymentLinkId: string,
    amount: number,
    currency: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_CREATE',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {
          changes: {
            amount,
            currency,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logPaymentLinkCreated(
    tenant: TenantContext,
    paymentLinkId: string,
    amount: number,
    currency: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_CREATE',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {
          changes: {
            amount,
            currency,
            description,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logPaymentLinkUpdated(
    tenant: TenantContext,
    paymentLinkId: string,
    updatedFields: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_UPDATE',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {
          changes: {
            updatedFields,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logPaymentLinkVoided(
    tenant: TenantContext,
    paymentLinkId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_VOID',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {},
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logPaymentLinkResent(
    tenant: TenantContext,
    paymentLinkId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_RESEND',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {},
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log checkout session operations
   */
  static async logCheckoutSessionCreated(
    tenant: TenantContext,
    checkoutSessionId: string,
    paymentLinkId?: string,
    amount?: number,
    currency?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'CHECKOUT_SESSION_CREATE',
        resourceType: 'CHECKOUT_SESSION',
        resourceId: checkoutSessionId,
        details: {
          changes: {
            paymentLinkId,
            amount,
            currency,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logCheckoutSessionCompleted(
    tenant: TenantContext,
    checkoutSessionId: string,
    transactionId: string,
    fraudScore?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'CHECKOUT_SESSION_COMPLETE',
        resourceType: 'CHECKOUT_SESSION',
        resourceId: checkoutSessionId,
        details: {
          changes: {
            transactionId,
            fraudScore,
            status: 'completed',
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logPaymentLinkVoid(
    tenant: TenantContext,
    paymentLinkId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PAYMENT_LINK_VOID',
        resourceType: 'PAYMENT_LINK',
        resourceId: paymentLinkId,
        details: {
          reason,
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log transaction refunds (required by compliance)
   */
  static async logTransactionRefund(
    tenant: TenantContext,
    transactionId: string,
    refundId: string,
    amount: number,
    currency: string,
    reason: string,
    outcome: AuditLogOutcome,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'TRANSACTION_REFUND',
        resourceType: 'REFUND',
        resourceId: refundId,
        details: {
          changes: {
            transactionId,
            amount,
            currency,
            reason,
          },
        },
        outcome,
        errorMessage,
        metadata: {
          originalTransactionId: transactionId,
        },
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log webhook operations
   */
  static async logWebhookReplay(
    tenant: TenantContext,
    webhookId: string,
    reason: string,
    outcome: AuditLogOutcome,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'WEBHOOK_REPLAY',
        resourceType: 'WEBHOOK',
        resourceId: webhookId,
        details: {
          reason,
        },
        outcome,
        errorMessage,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log API key operations
   */
  static async logApiKeyCreate(
    tenant: TenantContext,
    apiKeyId: string,
    keyName: string,
    permissions: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'API_KEY_CREATE',
        resourceType: 'API_KEY',
        resourceId: apiKeyId,
        details: {
          changes: {
            name: keyName,
            permissions,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent
    );
  }

  static async logApiKeyRevoke(
    tenant: TenantContext,
    apiKeyId: string,
    keyName: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'API_KEY_REVOKE',
        resourceType: 'API_KEY',
        resourceId: apiKeyId,
        details: {
          changes: {
            status: { from: 'active', to: 'revoked' },
          },
          reason,
        },
        outcome: 'SUCCESS',
        metadata: {
          keyName,
        },
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log report generation
   */
  static async logReportGenerate(
    tenant: TenantContext,
    reportType: string,
    filters: Record<string, any>,
    outcome: AuditLogOutcome,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'REPORT_GENERATE',
        resourceType: 'REPORT',
        details: {
          changes: {
            reportType,
            filters,
          },
        },
        outcome,
        errorMessage,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    tenant: TenantContext,
    filters: {
      action?: AuditLogAction;
      resourceType?: AuditLogResourceType;
      resourceId?: string;
      userId?: string;
      outcome?: AuditLogOutcome;
      dateFrom?: Date;
      dateTo?: Date;
      cursor?: string;
      limit?: number;
    } = {}
  ): Promise<{
    logs: any[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    const {
      action,
      resourceType,
      resourceId,
      userId,
      outcome,
      dateFrom,
      dateTo,
      cursor,
      limit = 50,
    } = filters;

    const where: any = {
      organizationId: tenant.organizationId,
      ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      ...(action && { action }),
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
      ...(userId && { userId }),
      ...(outcome && { outcome }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { ...where.createdAt, lte: dateTo } }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, -1) : logs;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      logs: items,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(
    tenant: TenantContext,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    failureRate: number;
  }> {
    const where = {
      organizationId: tenant.organizationId,
      ...(tenant.merchantId && { merchantId: tenant.merchantId }),
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    const [
      totalEvents,
      eventsByAction,
      eventsByOutcome,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      prisma.auditLog.groupBy({
        by: ['outcome'],
        where,
        _count: { outcome: true },
      }),
    ]);

    const actionStats = eventsByAction.reduce(
      (acc, item) => ({
        ...acc,
        [item.action]: item._count.action,
      }),
      {}
    );

    const outcomeStats = eventsByOutcome.reduce(
      (acc, item) => ({
        ...acc,
        [item.outcome]: item._count.outcome,
      }),
      {}
    );

    const failures = outcomeStats['FAILURE'] || 0;
    const failureRate = totalEvents > 0 ? (failures / totalEvents) * 100 : 0;

    return {
      totalEvents,
      eventsByAction: actionStats,
      eventsByOutcome: outcomeStats,
      failureRate,
    };
  }

  /**
   * Enhanced security-sensitive audit methods
   */

  // Password and authentication security
  static async logPasswordReset(
    userId: string,
    organizationId: string,
    outcome: AuditLogOutcome,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(
      {
        organizationId,
        userId,
        permissions: [],
        isApiKey: false,
      },
      {
        action: 'PASSWORD_RESET',
        resourceType: 'USER',
        resourceId: userId,
        outcome,
        errorMessage,
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  static async logMfaEnabled(
    tenant: TenantContext,
    userId: string,
    method: 'totp' | 'sms' | 'email',
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'MFA_ENABLE',
        resourceType: 'USER',
        resourceId: userId,
        details: {
          changes: { mfaMethod: method },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  static async logMfaDisabled(
    tenant: TenantContext,
    userId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'MFA_DISABLE',
        resourceType: 'USER',
        resourceId: userId,
        details: {
          reason,
          changes: { mfaEnabled: false },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  // KYB security events
  static async logKybSubmission(
    tenant: TenantContext,
    merchantId: string,
    documentTypes: string[],
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'KYB_SUBMIT',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes: {
            status: { to: 'PENDING' },
            documentTypes,
          },
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  static async logKybApproval(
    tenant: TenantContext,
    merchantId: string,
    reviewerId: string,
    notes?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'KYB_APPROVE',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes: {
            status: { to: 'APPROVED' },
            reviewerId,
            reviewNotes: notes,
          },
        },
        outcome: 'SUCCESS',
        metadata: {
          reviewerId,
        },
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  static async logKybRejection(
    tenant: TenantContext,
    merchantId: string,
    reviewerId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'KYB_REJECT',
        resourceType: 'MERCHANT',
        resourceId: merchantId,
        details: {
          changes: {
            status: { to: 'REJECTED' },
            reviewerId,
            rejectionReason: reason,
          },
        },
        outcome: 'SUCCESS',
        metadata: {
          reviewerId,
        },
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  // Data access and export
  static async logDataExport(
    tenant: TenantContext,
    exportType: 'transactions' | 'customers' | 'audit_logs' | 'reports',
    recordCount: number,
    filters: Record<string, any>,
    outcome: AuditLogOutcome,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'DATA_EXPORT',
        resourceType: 'REPORT',
        details: {
          changes: {
            exportType,
            recordCount,
            filters,
          },
        },
        outcome,
        errorMessage,
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  // Permission changes
  static async logPermissionChange(
    tenant: TenantContext,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    oldPermissions: string[],
    newPermissions: string[],
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'PERMISSION_CHANGE',
        resourceType: 'USER',
        resourceId: targetUserId,
        details: {
          changes: {
            role: { from: oldRole, to: newRole },
            permissions: { from: oldPermissions, to: newPermissions },
          },
          reason,
        },
        outcome: 'SUCCESS',
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  // Failed login attempts (security monitoring)
  static async logFailedLoginAttempt(
    email: string,
    reason: 'invalid_credentials' | 'account_locked' | 'mfa_failed' | 'account_suspended',
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    // Create a minimal tenant context for failed attempts
    const tempTenant = {
      organizationId: 'unknown', // We might not know the org for failed attempts
      permissions: [],
      isApiKey: false,
    };

    await this.logEvent(
      tempTenant,
      {
        action: 'USER_LOGIN',
        resourceType: 'USER',
        details: {
          email,
          failureReason: reason,
        },
        outcome: 'FAILURE',
        errorMessage: `Login failed: ${reason}`,
        metadata: {
          attemptedEmail: email,
        },
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  // Suspicious activity detection
  static async logSuspiciousActivity(
    tenant: TenantContext,
    activityType: 'multiple_failed_logins' | 'unusual_ip' | 'rapid_api_calls' | 'large_data_export',
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical',
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<void> {
    await this.logEvent(
      tenant,
      {
        action: 'SUSPICIOUS_ACTIVITY',
        resourceType: 'SECURITY_EVENT',
        details: {
          activityType,
          severity,
          ...details,
        },
        outcome: 'SUCCESS',
        metadata: {
          alertGenerated: true,
          severity,
        },
      },
      ipAddress,
      userAgent,
      requestId
    );
  }

  /**
   * Helper method to log with request context
   */
  static async logWithContext(
    tenant: TenantContext,
    entry: AuditLogEntry,
    request?: any // FastifyRequest
  ): Promise<void> {
    const ipAddress = request?.ip || request?.socket?.remoteAddress;
    const userAgent = request?.headers?.['user-agent'];
    const requestId = request?.requestId;

    await this.logEvent(tenant, entry, ipAddress, userAgent, requestId);
  }
}