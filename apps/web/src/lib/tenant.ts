import { Session } from 'next-auth';

export type TenantType = 'admin' | 'platform' | 'merchant';

export interface TenantInfo {
  type: TenantType;
  organizationId: string;
  organizationName?: string;
  platformId?: string | undefined; // For platform-level users
  merchantId?: string | undefined; // For merchant-level users
  canManagePlatforms: boolean;
  canManageMerchants: boolean;
  canManageUsers: boolean;
  canAccessAdminSettings: boolean;
  canAccessPlatformSettings: boolean;
  canBillMerchants: boolean;
}

/**
 * Determines tenant information from user session
 */
export function getTenantInfo(session: Session | null): TenantInfo | null {
  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const permissions = user.permissions || [];

  // Determine tenant type from organizationType or permissions
  let tenantType: TenantType;
  if (user.organizationType) {
    tenantType = user.organizationType as TenantType;
  } else {
    // Fallback permission-based detection
    if (permissions.includes('ADMIN_GLOBAL') || user.role === 'GlobalAdmin') {
      tenantType = 'admin';
    } else if (permissions.includes('PLATFORM_MANAGE') || permissions.includes('MERCHANTS_WRITE') || user.role === 'PlatformAdmin') {
      tenantType = 'platform';
    } else {
      tenantType = 'merchant';
    }
  }

  return {
    type: tenantType,
    organizationId: user.organizationId,
    organizationName: user.name, // This might need to be fetched separately
    platformId: user.platformId || (tenantType === 'platform' ? user.organizationId : undefined),
    merchantId: user.merchantId || (tenantType === 'merchant' ? user.organizationId : undefined),
    canManagePlatforms: tenantType === 'admin' && permissions.includes('PLATFORMS_WRITE'),
    canManageMerchants: (tenantType === 'admin' || tenantType === 'platform') && permissions.includes('MERCHANTS_WRITE'),
    canManageUsers: permissions.includes('USERS_WRITE'),
    canAccessAdminSettings: tenantType === 'admin' && (
      permissions.includes('ADMIN_GLOBAL') || 
      user.role === 'GlobalAdmin'
    ),
    canAccessPlatformSettings: (tenantType === 'admin' || tenantType === 'platform') && (
      permissions.includes('PLATFORM_MANAGE') || 
      user.role === 'PlatformAdmin'
    ),
    canBillMerchants: tenantType === 'platform' && permissions.includes('BILLING_MANAGE'),
  };
}

/**
 * Checks if user has permission for specific functionality
 */
export function hasPermission(
  tenantInfo: TenantInfo | null, 
  permission: string
): boolean {
  if (!tenantInfo) return false;

  switch (permission) {
    case 'manage_platforms':
      return tenantInfo.canManagePlatforms;
    case 'manage_merchants':
      return tenantInfo.canManageMerchants;
    case 'manage_users':
      return tenantInfo.canManageUsers;
    case 'access_admin_settings':
      return tenantInfo.canAccessAdminSettings;
    case 'access_platform_settings':
      return tenantInfo.canAccessPlatformSettings;
    case 'bill_merchants':
      return tenantInfo.canBillMerchants;
    case 'view_all_transactions':
      return tenantInfo.type === 'admin' || tenantInfo.type === 'platform';
    case 'create_payment_links':
      return tenantInfo.type === 'platform' || tenantInfo.type === 'merchant';
    case 'access_invoices':
      return tenantInfo.type === 'platform' || tenantInfo.type === 'merchant';
    case 'access_checkout_builder':
      return tenantInfo.type === 'platform' || tenantInfo.type === 'merchant';
    case 'access_fraud_management':
      return tenantInfo.type === 'admin' || tenantInfo.type === 'platform';
    case 'access_reports':
      return true; // All tenant types can access reports
    case 'access_platforms':
      return tenantInfo.canManagePlatforms;
    default:
      return false;
  }
}

/**
 * Filters navigation items based on tenant permissions
 */
export function filterNavigationByTenant(
  navigation: Array<{ name: string; href: string; [key: string]: any }>,
  tenantInfo: TenantInfo | null
): Array<{ name: string; href: string; [key: string]: any }> {
  if (!tenantInfo) return [];

  return navigation.filter(item => {
    switch (item.href) {
      case '/merchants':
        return hasPermission(tenantInfo, 'manage_merchants');
      case '/platforms':
        return hasPermission(tenantInfo, 'access_platforms');
      case '/fraud':
        return hasPermission(tenantInfo, 'access_fraud_management');
      case '/transactions':
        return hasPermission(tenantInfo, 'view_all_transactions') || tenantInfo.type === 'merchant';
      case '/payment-links':
        return hasPermission(tenantInfo, 'create_payment_links');
      case '/checkout-builder':
        return hasPermission(tenantInfo, 'access_checkout_builder');
      case '/invoices':
        return hasPermission(tenantInfo, 'access_invoices');
      case '/reports':
        return hasPermission(tenantInfo, 'access_reports');
      case '/settings':
        return true; // Both can access settings, but content will differ
      case '/gift-cards':
        return true; // Both can access gift cards
      case '/':
        return true; // Both can access overview
      default:
        return true;
    }
  });
}

/**
 * Gets the appropriate page title based on tenant type
 */
export function getTenantPageTitle(
  basePage: string, 
  tenantInfo: TenantInfo | null
): string {
  if (!tenantInfo) return basePage;

  const prefix = tenantInfo.type === 'admin' ? 'Admin' : 
                 tenantInfo.type === 'platform' ? 'Platform' : 'Merchant';
  
  switch (basePage.toLowerCase()) {
    case 'overview':
    case 'dashboard':
      return `${prefix} Dashboard`;
    case 'transactions':
      return tenantInfo.type === 'merchant' ? 'My Transactions' : 'All Transactions';
    case 'platforms':
      return 'Platform Management';
    case 'merchants':
      return tenantInfo.type === 'admin' ? 'Platform & Merchant Management' : 'Merchant Management';
    case 'settings':
      return tenantInfo.type === 'admin' ? 'Admin Settings' : 
             tenantInfo.type === 'platform' ? 'Platform Settings' : 'Merchant Settings';
    default:
      return basePage;
  }
}

/**
 * Gets context-appropriate labels and descriptions
 */
export function getTenantLabels(tenantInfo: TenantInfo | null) {
  if (!tenantInfo) {
    return {
      organizationLabel: 'Organization',
      transactionsLabel: 'Transactions',
      settingsLabel: 'Settings'
    };
  }

  return {
    organizationLabel: tenantInfo.type === 'admin' ? 'Admin' : 
                      tenantInfo.type === 'platform' ? 'Platform' : 'Merchant',
    transactionsLabel: tenantInfo.type === 'merchant' ? 'My Transactions' : 'All Transactions',
    settingsLabel: tenantInfo.type === 'admin' ? 'Admin Settings' : 
                   tenantInfo.type === 'platform' ? 'Platform Settings' : 'Account Settings'
  };
}