'use client';

import { TenantType } from './tenant';

// Re-export TenantType for convenience
export type { TenantType } from './tenant';

// Sandbox mode detection
export function isSandboxMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for sandbox indicators
  return (
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('vercel.app') ||
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SANDBOX_MODE === '1'
  );
}

// Sandbox tenant storage keys
const SANDBOX_TENANT_KEY = 'globapay-sandbox-tenant-type';
const SANDBOX_PERMISSIONS_KEY = 'globapay-sandbox-permissions';

// Default permissions for each tenant type
const DEFAULT_PLATFORM_PERMISSIONS = [
  'ORGANIZATION_WRITE',
  'MERCHANTS_WRITE', 
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
  const permissions = type === 'platform' ? DEFAULT_PLATFORM_PERMISSIONS : DEFAULT_MERCHANT_PERMISSIONS;
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
    permissions = type === 'platform' ? DEFAULT_PLATFORM_PERMISSIONS : DEFAULT_MERCHANT_PERMISSIONS;
  }
  
  return {
    type,
    permissions,
    organizationId: type === 'platform' ? 'org_sandbox_platform' : 'org_sandbox_merchant',
    merchantId: type === 'merchant' ? 'org_sandbox_merchant' : undefined,
  };
}

export function createSandboxSession(): any {
  const sandboxData = getSandboxTenantData();
  
  return {
    user: {
      id: 'user_sandbox',
      email: 'sandbox@globapay.com',
      name: `Sandbox ${sandboxData.type === 'platform' ? 'Platform' : 'Merchant'} User`,
      organizationId: sandboxData.organizationId,
      organizationType: sandboxData.type,
      merchantId: sandboxData.merchantId,
      permissions: sandboxData.permissions,
      role: sandboxData.type === 'platform' ? 'PlatformAdmin' : 'MerchantAdmin',
    },
    accessToken: 'sandbox_token',
    refreshToken: 'sandbox_refresh_token',
  };
}