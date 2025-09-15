import { Session } from 'next-auth';

export type TenantType = 'platform' | 'merchant';

export interface TenantInfo {
  type: TenantType;
  organizationId: string;
  organizationName?: string;
  merchantId?: string | undefined; // For single-tenant merchants
  canManageMerchants: boolean;
  canManageUsers: boolean;
  canAccessPlatformSettings: boolean;
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

  // Use the organizationType from the session, fall back to permission-based detection
  const tenantType = user.organizationType || (
    permissions.includes('ORGANIZATION_WRITE') || 
    permissions.includes('MERCHANTS_WRITE') || 
    user.role === 'PlatformAdmin' ? 'platform' : 'merchant'
  );

  return {
    type: tenantType,
    organizationId: user.organizationId,
    organizationName: user.name, // This might need to be fetched separately
    merchantId: user.merchantId || (tenantType === 'merchant' ? user.organizationId : undefined),
    canManageMerchants: tenantType === 'platform' && permissions.includes('MERCHANTS_WRITE'),
    canManageUsers: permissions.includes('USERS_WRITE'),
    canAccessPlatformSettings: tenantType === 'platform' && (
      permissions.includes('ORGANIZATION_WRITE') || 
      user.role === 'PlatformAdmin'
    ),
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
    case 'manage_merchants':
      return tenantInfo.canManageMerchants;
    case 'manage_users':
      return tenantInfo.canManageUsers;
    case 'access_platform_settings':
      return tenantInfo.canAccessPlatformSettings;
    case 'view_all_transactions':
      return tenantInfo.type === 'platform';
    case 'create_payment_links':
      return true; // Both tenant types can create payment links
    case 'access_invoices':
      return true; // Both tenant types can access invoices
    case 'access_checkout_builder':
      return true; // Both tenant types can access checkout builder
    case 'access_fraud_management':
      return tenantInfo.type === 'platform'; // Platform only for now
    case 'access_reports':
      return true; // Both tenant types can access reports
    case 'access_platforms':
      return tenantInfo.canAccessPlatformSettings;
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

  const prefix = tenantInfo.type === 'platform' ? 'Platform' : 'Merchant';
  
  switch (basePage.toLowerCase()) {
    case 'overview':
    case 'dashboard':
      return `${prefix} Dashboard`;
    case 'transactions':
      return tenantInfo.type === 'platform' ? 'All Transactions' : 'My Transactions';
    case 'merchants':
      return 'Merchant Management';
    case 'settings':
      return tenantInfo.type === 'platform' ? 'Platform Settings' : 'Merchant Settings';
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
    organizationLabel: tenantInfo.type === 'platform' ? 'Platform' : 'Merchant',
    transactionsLabel: tenantInfo.type === 'platform' ? 'All Transactions' : 'My Transactions',
    settingsLabel: tenantInfo.type === 'platform' ? 'Platform Settings' : 'Account Settings'
  };
}