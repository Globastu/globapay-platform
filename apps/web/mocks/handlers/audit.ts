import { http, HttpResponse } from 'msw';
import { mockLatency } from '../utils';

// Mock audit log data
const generateMockAuditLogs = (count: number = 50) => {
  const actions = [
    'USER_LOGIN',
    'USER_LOGOUT',
    'PAYMENT_LINK_CREATE',
    'PAYMENT_LINK_VOID',
    'TRANSACTION_REFUND',
    'API_KEY_CREATE',
    'API_KEY_REVOKE',
    'MERCHANT_STATUS_CHANGE',
    'KYB_SUBMIT',
    'KYB_APPROVE',
    'KYB_REJECT',
    'DATA_EXPORT',
    'PERMISSION_CHANGE',
    'SUSPICIOUS_ACTIVITY',
  ];

  const resourceTypes = [
    'USER',
    'PAYMENT_LINK',
    'TRANSACTION',
    'REFUND',
    'API_KEY',
    'MERCHANT',
    'REPORT',
    'SECURITY_EVENT',
  ];

  const outcomes = ['SUCCESS', 'FAILURE'];
  
  const users = [
    { id: 'user-1', name: 'John Smith', email: 'john@acmehealthcare.com' },
    { id: 'user-2', name: 'Sarah Johnson', email: 'sarah@techflow.com' },
    { id: 'user-3', name: 'Admin User', email: 'admin@globapay.com' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const outcome = Math.random() > 0.9 ? 'FAILURE' : 'SUCCESS'; // 10% failure rate
    const user = users[Math.floor(Math.random() * users.length)];
    
    // Generate different details based on action
    let details = {};
    let resourceId = `res_${Math.random().toString(36).substr(2, 9)}`;

    switch (action) {
      case 'USER_LOGIN':
        details = {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          authType: 'user_session',
        };
        break;
      case 'PAYMENT_LINK_CREATE':
        details = {
          changes: {
            amount: Math.floor(Math.random() * 100000) + 1000,
            currency: 'USD',
            description: 'Medical consultation fee',
          },
        };
        break;
      case 'TRANSACTION_REFUND':
        details = {
          changes: {
            transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
            amount: Math.floor(Math.random() * 50000) + 500,
            currency: 'USD',
            reason: 'Customer requested refund',
          },
        };
        break;
      case 'API_KEY_CREATE':
        details = {
          changes: {
            name: `API Key ${i + 1}`,
            permissions: ['PAYMENT_LINKS_READ', 'TRANSACTIONS_READ'],
          },
        };
        break;
      case 'SUSPICIOUS_ACTIVITY':
        details = {
          activityType: 'multiple_failed_logins',
          severity: 'medium',
          attemptCount: Math.floor(Math.random() * 10) + 3,
        };
        break;
      default:
        details = {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        };
    }

    return {
      id: `audit_${i + 1}`,
      organizationId: 'org-1',
      merchantId: 'merchant-1',
      userId: user?.id || 'unknown-user',
      action,
      resourceType,
      resourceId,
      details,
      outcome,
      errorMessage: outcome === 'FAILURE' ? 'Operation failed due to validation error' : null,
      metadata: {
        requestId: `req_${Math.random().toString(36).substr(2, 16)}`,
        sessionId: `sess_${Math.random().toString(36).substr(2, 12)}`,
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      user,
    };
  });
};

const mockAuditLogs = generateMockAuditLogs(100);

// Generate audit statistics
const generateAuditStats = () => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  const recentLogs = mockAuditLogs.filter(log => 
    new Date(log.createdAt).getTime() > sevenDaysAgo
  );

  const eventsByAction = recentLogs.reduce((acc, log) => {
    if (log.action) {
      acc[log.action] = (acc[log.action] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const eventsByOutcome = recentLogs.reduce((acc, log) => {
    if (log.outcome) {
      acc[log.outcome] = (acc[log.outcome] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const failures = eventsByOutcome['FAILURE'] || 0;
  const total = recentLogs.length;
  const failureRate = total > 0 ? (failures / total) * 100 : 0;

  return {
    totalEvents: total,
    eventsByAction,
    eventsByOutcome,
    failureRate,
  };
};

export const auditHandlers = [
  // Get audit logs with filtering and pagination
  http.get('/api/audit-logs', async ({ request }) => {
    await mockLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const resourceType = url.searchParams.get('resourceType');
    const outcome = url.searchParams.get('outcome');
    const userId = url.searchParams.get('userId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Apply filters
    let filteredLogs = mockAuditLogs;
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
    }
    
    if (outcome) {
      filteredLogs = filteredLogs.filter(log => log.outcome === outcome);
    }
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (dateFrom) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.createdAt) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.createdAt) <= new Date(dateTo)
      );
    }

    // Sort by most recent first
    filteredLogs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredLogs.length;

    return HttpResponse.json({
      logs: paginatedLogs,
      hasMore,
      nextCursor: hasMore ? paginatedLogs[paginatedLogs.length - 1]?.id : null,
      total: filteredLogs.length,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit),
      },
    });
  }),

  // Get audit statistics
  http.get('/api/audit-logs/stats', async ({ request }) => {
    await mockLatency();
    
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    
    // For simplicity, return stats for the last 7 days
    const stats = generateAuditStats();
    
    return HttpResponse.json(stats);
  }),

  // Get individual audit log details
  http.get('/api/audit-logs/:id', async ({ params }) => {
    await mockLatency();
    
    const { id } = params;
    const log = mockAuditLogs.find(log => log.id === id);
    
    if (!log) {
      return HttpResponse.json({ error: 'Audit log not found' }, { status: 404 });
    }
    
    return HttpResponse.json(log);
  }),

  // Export audit logs
  http.post('/api/audit-logs/export', async ({ request }) => {
    await mockLatency();
    
    const body = await request.json() as any;
    const { format, filters } = body;
    
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return HttpResponse.json({
      success: true,
      exportId: `export_${Date.now()}`,
      downloadUrl: `/downloads/audit-logs-${Date.now()}.${format}`,
      recordCount: mockAuditLogs.length,
      message: `Audit logs exported successfully in ${format.toUpperCase()} format`,
    });
  }),
];