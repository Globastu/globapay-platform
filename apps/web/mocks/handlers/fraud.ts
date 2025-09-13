import { http, HttpResponse } from 'msw';
import { mockLatency } from '../utils';

// Mock fraud check data
const mockFraudChecks = [
  {
    id: '1',
    score: 15,
    decision: 'approve',
    confidence: 92,
    merchantId: 'merchant-1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    processingTime: 156,
    riskFactors: [
      {
        factor: 'low_transaction_amount',
        severity: 'low',
        score: 5,
        description: 'Transaction amount $25.00 is within normal range',
      },
    ],
  },
  {
    id: '2',
    score: 75,
    decision: 'decline',
    confidence: 85,
    merchantId: 'merchant-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    processingTime: 234,
    riskFactors: [
      {
        factor: 'suspicious_email',
        severity: 'high',
        score: 20,
        description: 'Email address contains suspicious patterns',
      },
      {
        factor: 'high_transaction_amount',
        severity: 'high',
        score: 25,
        description: 'Transaction amount $750.00 is unusually high',
      },
      {
        factor: 'international_transaction',
        severity: 'medium',
        score: 15,
        description: 'Transaction originates from outside the US',
      },
    ],
  },
  {
    id: '3',
    score: 45,
    decision: 'review',
    confidence: 68,
    merchantId: 'merchant-1',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    processingTime: 178,
    riskFactors: [
      {
        factor: 'new_customer',
        severity: 'medium',
        score: 12,
        description: 'First-time customer with no transaction history',
      },
      {
        factor: 'elevated_transaction_amount',
        severity: 'medium',
        score: 10,
        description: 'Transaction amount $150.00 is above average',
      },
    ],
  },
  {
    id: '4',
    score: 8,
    decision: 'approve',
    confidence: 95,
    merchantId: 'merchant-1',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    processingTime: 145,
    riskFactors: [],
  },
  {
    id: '5',
    score: 92,
    decision: 'decline',
    confidence: 98,
    merchantId: 'merchant-1',
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    processingTime: 289,
    riskFactors: [
      {
        factor: 'chargeback_history',
        severity: 'critical',
        score: 30,
        description: 'Customer has 3 previous chargebacks',
      },
      {
        factor: 'temporary_email',
        severity: 'high',
        score: 25,
        description: 'Email uses temporary/disposable email service',
      },
      {
        factor: 'high_transaction_amount',
        severity: 'high',
        score: 25,
        description: 'Transaction amount $1,250.00 is unusually high',
      },
    ],
  },
];

// Generate score distribution data
const generateScoreDistribution = () => {
  const distribution = [];
  for (let i = 0; i < 100; i += 10) {
    const count = Math.floor(Math.random() * 50) + 5;
    distribution.push({
      scoreRange: `${i}-${i + 9}`,
      count,
      percentage: ((count / 200) * 100).toFixed(1),
    });
  }
  return distribution;
};

// Generate high-risk transactions
const generateHighRiskTransactions = () => {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `txn_${i + 1}`,
    amount: Math.floor(Math.random() * 2000) + 100,
    currency: 'USD',
    fraudScore: Math.floor(Math.random() * 30) + 70, // High risk: 70-100
    fraudDecision: Math.random() > 0.7 ? 'decline' : 'review',
    customerEmail: `customer${i + 1}@${['suspicious.com', 'tempmail.org', 'fake.net'][Math.floor(Math.random() * 3)]}`,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Last 7 days
    status: ['pending', 'declined', 'under_review'][Math.floor(Math.random() * 3)],
    riskFactors: [
      'suspicious_email',
      'high_transaction_amount',
      'chargeback_history',
      'international_transaction',
    ].slice(0, Math.floor(Math.random() * 3) + 1),
  }));
};

export const fraudHandlers = [
  // Get fraud statistics
  http.get('/api/fraud/stats', async () => {
    await mockLatency();
    
    return HttpResponse.json({
      totalChecks: 1247,
      approvedCount: 856,
      reviewCount: 234,
      declinedCount: 157,
      averageScore: 28.5,
      averageProcessingTime: 189,
      scoreDistribution: generateScoreDistribution(),
      topRiskFactors: [
        { factor: 'new_customer', count: 134, averageScore: 12 },
        { factor: 'high_transaction_amount', count: 89, averageScore: 25 },
        { factor: 'international_transaction', count: 76, averageScore: 15 },
        { factor: 'suspicious_email', count: 45, averageScore: 20 },
        { factor: 'chargeback_history', count: 23, averageScore: 30 },
      ],
    });
  }),

  // Get high-risk transactions
  http.get('/api/fraud/high-risk-transactions', async ({ request }) => {
    await mockLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const allTransactions = generateHighRiskTransactions();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const transactions = allTransactions.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total: allTransactions.length,
        totalPages: Math.ceil(allTransactions.length / limit),
      },
    });
  }),

  // Get fraud checks history
  http.get('/api/fraud/checks', async ({ request }) => {
    await mockLatency();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const checks = mockFraudChecks.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: checks,
      pagination: {
        page,
        limit,
        total: mockFraudChecks.length,
        totalPages: Math.ceil(mockFraudChecks.length / limit),
      },
    });
  }),

  // Get individual fraud check details
  http.get('/api/fraud/checks/:id', async ({ params }) => {
    await mockLatency();
    
    const { id } = params;
    const check = mockFraudChecks.find(c => c.id === id);
    
    if (!check) {
      return HttpResponse.json({ error: 'Fraud check not found' }, { status: 404 });
    }
    
    return HttpResponse.json({
      ...check,
      rules: [
        {
          ruleId: 'blocked_email_domain',
          ruleName: 'Blocked Email Domain',
          triggered: check.score > 70,
          action: 'decline',
          weight: 50,
          description: 'Automatically decline transactions from blocked email domains',
        },
        {
          ruleId: 'high_amount_new_customer',
          ruleName: 'High Amount New Customer',
          triggered: check.score > 40,
          action: 'review',
          weight: 20,
          description: 'Flag high-value transactions from new customers for review',
        },
      ],
      recommendation: check.score < 30 
        ? 'Transaction appears legitimate. Process normally with standard monitoring.'
        : check.score > 70
        ? 'High fraud risk detected. Decline transaction.'
        : 'Manual review recommended. Consider additional verification.',
    });
  }),
];