'use client';

import { TenantType } from './tenant';
import type { Transaction, TransactionStats } from '@/types/transactions';

// Fraud analytics interfaces
interface FraudStats {
  totalChecks: number;
  approvedCount: number;
  reviewCount: number;
  declinedCount: number;
  averageScore: number;
  averageProcessingTime: number;
  scoreDistribution: Array<{
    scoreRange: string;
    count: number;
    percentage: string;
  }>;
  topRiskFactors: Array<{
    factor: string;
    count: number;
    averageScore: number;
  }>;
}

interface HighRiskTransaction {
  id: string;
  amount: number;
  currency: string;
  fraudScore: number;
  fraudDecision: string;
  customerEmail: string;
  createdAt: string;
  status: string;
  riskFactors: string[];
}

// Re-export TenantType for convenience
export type { TenantType } from './tenant';

// Sandbox mode detection
export function isSandboxMode(): boolean {
  if (typeof window === 'undefined') {
    // Server-side detection
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_SANDBOX_MODE === '1' ||
      process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'development'
    );
  }
  
  // Client-side detection
  return (
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('globapay-platform-') || // Vercel preview deployments
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SANDBOX_MODE === '1'
  );
}

// Sandbox tenant storage keys
const SANDBOX_TENANT_KEY = 'globapay-sandbox-tenant-type';
const SANDBOX_PERMISSIONS_KEY = 'globapay-sandbox-permissions';

// Default permissions for each tenant type
const DEFAULT_ADMIN_PERMISSIONS = [
  'ADMIN_GLOBAL',
  'PLATFORMS_WRITE',
  'MERCHANTS_WRITE',
  'USERS_WRITE',
  'ORGANIZATION_WRITE',
  'REPORTS_GENERATE',
  'AUDIT_LOGS_READ',
  'TRANSACTIONS_READ'
];

const DEFAULT_PLATFORM_PERMISSIONS = [
  'PLATFORM_MANAGE',
  'MERCHANTS_WRITE', 
  'BILLING_MANAGE',
  'USERS_WRITE',
  'REPORTS_GENERATE',
  'AUDIT_LOGS_READ',
  'TRANSACTIONS_READ'
];

const DEFAULT_MERCHANT_PERMISSIONS = [
  'TRANSACTIONS_READ',
  'PAYMENT_LINKS_WRITE',
  'INVOICES_WRITE',
  'REPORTS_GENERATE'
];

export interface SandboxTenantData {
  type: TenantType;
  permissions: string[];
  organizationId: string;
  platformId?: string | undefined;
  merchantId?: string | undefined;
}

export function getSandboxTenantType(): TenantType {
  if (typeof window === 'undefined') return 'merchant';
  
  const stored = localStorage.getItem(SANDBOX_TENANT_KEY);
  return (stored as TenantType) || 'merchant';
}

export function setSandboxTenantType(type: TenantType): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SANDBOX_TENANT_KEY, type);
  
  // Also update permissions based on type
  const permissions = type === 'admin' ? DEFAULT_ADMIN_PERMISSIONS :
                     type === 'platform' ? DEFAULT_PLATFORM_PERMISSIONS : 
                     DEFAULT_MERCHANT_PERMISSIONS;
  localStorage.setItem(SANDBOX_PERMISSIONS_KEY, JSON.stringify(permissions));
  
  // Trigger a storage event to notify components
  window.dispatchEvent(new StorageEvent('storage', {
    key: SANDBOX_TENANT_KEY,
    newValue: type,
  }));
}

export function getSandboxTenantData(): SandboxTenantData {
  const type = getSandboxTenantType();
  const storedPermissions = typeof window !== 'undefined' ? localStorage.getItem(SANDBOX_PERMISSIONS_KEY) : null;
  
  let permissions: string[];
  try {
    permissions = storedPermissions ? JSON.parse(storedPermissions) : [];
  } catch {
    permissions = [];
  }
  
  // Fallback to defaults if no permissions stored
  if (permissions.length === 0) {
    permissions = type === 'admin' ? DEFAULT_ADMIN_PERMISSIONS :
                 type === 'platform' ? DEFAULT_PLATFORM_PERMISSIONS : 
                 DEFAULT_MERCHANT_PERMISSIONS;
  }
  
  return {
    type,
    permissions,
    organizationId: type === 'admin' ? 'org_sandbox_admin' :
                   type === 'platform' ? 'org_sandbox_platform' : 
                   'org_sandbox_merchant',
    platformId: type === 'platform' ? 'org_sandbox_platform' : undefined,
    merchantId: type === 'merchant' ? 'org_sandbox_merchant' : undefined,
  };
}

export function createSandboxSession(): any {
  const sandboxData = getSandboxTenantData();
  
  const roleMap = {
    admin: 'GlobalAdmin',
    platform: 'PlatformAdmin', 
    merchant: 'MerchantAdmin'
  };

  const nameMap = {
    admin: 'Admin',
    platform: 'Platform',
    merchant: 'Merchant'
  };
  
  return {
    user: {
      id: 'user_sandbox',
      email: 'sandbox@globapay.com',
      name: `Sandbox ${nameMap[sandboxData.type]} User`,
      organizationId: sandboxData.organizationId,
      organizationType: sandboxData.type,
      platformId: sandboxData.platformId,
      merchantId: sandboxData.merchantId,
      permissions: sandboxData.permissions,
      role: roleMap[sandboxData.type],
    },
    accessToken: 'sandbox_token',
    refreshToken: 'sandbox_refresh_token',
  };
}

// Generate dummy transaction data for sandbox mode
export function generateSandboxTransactions(): Transaction[] {
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 3); // Start 3 months ago
  
  const transactions: Transaction[] = [];
  const statuses: Transaction['status'][] = ['completed', 'pending', 'processing', 'failed', 'refunded', 'partially_refunded'];
  const paymentMethods = ['card', 'bank_transfer', 'wallet'];
  const currencies = ['USD', 'EUR', 'GBP'];
  
  const customers = [
    { name: 'John Smith', email: 'john.smith@example.com' },
    { name: 'Sarah Johnson', email: 'sarah.j@example.com' },
    { name: 'Michael Brown', email: 'mbrown@company.com' },
    { name: 'Emma Davis', email: 'emma.davis@email.com' },
    { name: 'David Wilson', email: 'david.wilson@business.com' },
    { name: 'Lisa Anderson', email: 'lisa.a@example.org' },
    { name: 'James Miller', email: 'james.miller@domain.com' },
    { name: 'Maria Garcia', email: 'maria.garcia@example.net' },
    { name: 'Robert Taylor', email: 'robert.t@example.com' },
    { name: 'Jennifer Lee', email: 'jennifer.lee@company.org' }
  ];

  const descriptions = [
    'Online store purchase',
    'Subscription payment',
    'Digital product license',
    'Service booking fee',
    'Monthly membership',
    'One-time consultation',
    'Software license renewal',
    'E-learning course',
    'Premium account upgrade',
    'Event ticket purchase'
  ];

  // Generate 150 transactions
  for (let i = 0; i < 150; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]!;
    const currency = currencies[Math.floor(Math.random() * currencies.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]!;
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]!
    
    // Generate realistic amounts (in cents)
    const amount = Math.floor(Math.random() * 500000) + 1000; // $10 to $5000
    
    // Calculate transaction date (spread over last 3 months)
    const transactionDate = new Date(baseDate);
    transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 90));
    
    const transaction: Transaction = {
      id: `txn_sandbox_${i.toString().padStart(6, '0')}`,
      merchantId: 'org_sandbox_merchant',
      amount,
      currency,
      description,
      customerEmail: customer.email,
      customerName: customer.name,
      status,
      paymentMethodType: paymentMethod,
      reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      fraudScore: Math.floor(Math.random() * 100),
      require3DS: Math.random() > 0.7, // 30% require 3DS
      threeDSStatus: Math.random() > 0.5 ? '3ds_authenticated' : '3ds_not_required',
      processorTransactionId: `proc_${Math.random().toString(36).substr(2, 12)}`,
      ...(status === 'refunded' ? { refundedAmount: amount } : 
          status === 'partially_refunded' ? { refundedAmount: Math.floor(amount * 0.5) } : {}),
      createdAt: transactionDate.toISOString(),
      updatedAt: transactionDate.toISOString(),
      ...(status === 'completed' || status === 'refunded' || status === 'partially_refunded' ? 
        { completedAt: new Date(transactionDate.getTime() + Math.random() * 3600000).toISOString() } : {}),
      metadata: {
        source: 'sandbox',
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    // Add payment link for some transactions
    if (Math.random() > 0.7) {
      transaction.paymentLinkId = `plink_${Math.random().toString(36).substr(2, 8)}`;
      transaction.paymentLink = {
        id: transaction.paymentLinkId,
        shortCode: `PL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        description: `Payment link for ${description}`
      };
    }

    transactions.push(transaction);
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateSandboxTransactionStats(transactions: Transaction[]): TransactionStats {
  const totalTransactions = transactions.length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const completedAmount = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const refundedTransactions = transactions.filter(t => 
    t.status === 'refunded' || t.status === 'partially_refunded'
  ).length;
  const refundedAmount = transactions
    .filter(t => t.status === 'refunded' || t.status === 'partially_refunded')
    .reduce((sum, t) => sum + (t.refundedAmount || 0), 0);
  
  const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;
  const averageTransactionAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  return {
    totalTransactions,
    totalAmount,
    completedTransactions,
    completedAmount,
    refundedTransactions,
    refundedAmount,
    averageTransactionAmount,
    successRate
  };
}

// Filter transactions based on filters (for sandbox simulation)
export function filterSandboxTransactions(
  transactions: Transaction[], 
  filters: Record<string, any>
): { data: Transaction[], total: number } {
  let filtered = [...transactions];

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(searchLower) ||
      t.customerEmail?.toLowerCase().includes(searchLower) ||
      t.customerName?.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower)
    );
  }

  if (filters.currency && filters.currency !== 'all') {
    filtered = filtered.filter(t => t.currency === filters.currency);
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    filtered = filtered.filter(t => t.paymentMethodType === filters.paymentMethod);
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(t => new Date(t.createdAt) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(t => new Date(t.createdAt) <= toDate);
  }

  if (filters.minAmount) {
    const minAmount = parseFloat(filters.minAmount) * 100; // Convert to cents
    filtered = filtered.filter(t => t.amount >= minAmount);
  }

  if (filters.maxAmount) {
    const maxAmount = parseFloat(filters.maxAmount) * 100; // Convert to cents
    filtered = filtered.filter(t => t.amount <= maxAmount);
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: filtered.slice(startIndex, endIndex),
    total: filtered.length
  };
}

// Generate fraud analytics data for sandbox mode
export function generateSandboxFraudStats(): FraudStats {
  // Generate realistic fraud statistics
  const totalChecks = 2847;
  const approvedCount = 2156;
  const reviewCount = 485;
  const declinedCount = 206;
  
  const scoreDistribution = [
    { scoreRange: "0-9", count: 845, percentage: "29.7" },
    { scoreRange: "10-19", count: 623, percentage: "21.9" },
    { scoreRange: "20-29", count: 489, percentage: "17.2" },
    { scoreRange: "30-39", count: 287, percentage: "10.1" },
    { scoreRange: "40-49", count: 198, percentage: "7.0" },
    { scoreRange: "50-59", count: 156, percentage: "5.5" },
    { scoreRange: "60-69", count: 125, percentage: "4.4" },
    { scoreRange: "70-79", count: 89, percentage: "3.1" },
    { scoreRange: "80-89", count: 42, percentage: "1.5" },
    { scoreRange: "90-100", count: 28, percentage: "1.0" }
  ];

  const topRiskFactors = [
    { factor: "velocity_checks", count: 156, averageScore: 68 },
    { factor: "geo_location_mismatch", count: 134, averageScore: 72 },
    { factor: "email_domain_risk", count: 98, averageScore: 61 },
    { factor: "ip_reputation", count: 87, averageScore: 74 },
    { factor: "device_fingerprint", count: 76, averageScore: 65 },
    { factor: "payment_method_risk", count: 64, averageScore: 58 },
    { factor: "transaction_pattern", count: 52, averageScore: 69 },
    { factor: "billing_address_mismatch", count: 48, averageScore: 56 }
  ];

  return {
    totalChecks,
    approvedCount,
    reviewCount,
    declinedCount,
    averageScore: 28.4,
    averageProcessingTime: 145,
    scoreDistribution,
    topRiskFactors
  };
}

export function generateSandboxHighRiskTransactions(): HighRiskTransaction[] {
  const riskFactors = [
    "velocity_checks",
    "geo_location_mismatch", 
    "email_domain_risk",
    "ip_reputation",
    "device_fingerprint",
    "payment_method_risk",
    "transaction_pattern",
    "billing_address_mismatch"
  ];

  const decisions = ["decline", "review", "approve"];
  const statuses = ["pending", "completed", "failed", "cancelled"];
  const currencies = ["USD", "EUR", "GBP"];
  
  const customers = [
    "suspicious.user@temp-email.com",
    "fraud.test@fakeemail.org", 
    "risky.customer@example.com",
    "high.risk@domain.net",
    "test.fraud@suspicious.co",
    "fake.account@temp.mail",
    "phishing@scam.com",
    "stolen.card@hack.org"
  ];

  const transactions: HighRiskTransaction[] = [];
  
  // Generate 25 high-risk transactions
  for (let i = 0; i < 25; i++) {
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - Math.floor(Math.random() * 72)); // Last 3 days
    
    const currency = currencies[Math.floor(Math.random() * currencies.length)]!;
    const amount = Math.floor(Math.random() * 1000000) + 50000; // $500 to $10,000
    const fraudScore = Math.floor(Math.random() * 40) + 60; // 60-100 (high risk)
    const decision = decisions[Math.floor(Math.random() * decisions.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const customerEmail = customers[Math.floor(Math.random() * customers.length)]!;
    
    // Generate 2-4 risk factors per transaction
    const numFactors = Math.floor(Math.random() * 3) + 2;
    const shuffledFactors = [...riskFactors].sort(() => 0.5 - Math.random());
    const transactionRiskFactors = shuffledFactors.slice(0, numFactors);
    
    transactions.push({
      id: `txn_high_risk_${i.toString().padStart(3, '0')}`,
      amount,
      currency,
      fraudScore,
      fraudDecision: decision,
      customerEmail,
      createdAt: baseDate.toISOString(),
      status,
      riskFactors: transactionRiskFactors
    });
  }
  
  // Sort by fraud score (highest first)
  return transactions.sort((a, b) => b.fraudScore - a.fraudScore);
}