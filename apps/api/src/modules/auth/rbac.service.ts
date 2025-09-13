import type { Permission } from '@prisma/client';
import type { 
  RoleType, 
  Resource, 
  Action, 
  PolicyRule, 
  RolePolicy, 
  TenantContext, 
  AuthenticatedUser, 
  AuthenticatedApiKey 
} from './types';

// RBAC Policy Definitions
const ROLE_POLICIES: RolePolicy[] = [
  {
    role: 'PlatformAdmin',
    rules: [
      {
        resource: 'organization',
        actions: ['create', 'read', 'update', 'delete', 'list'],
      },
      {
        resource: 'merchant',
        actions: ['create', 'read', 'update', 'delete', 'list'],
      },
      {
        resource: 'user',
        actions: ['create', 'read', 'update', 'delete', 'list'],
      },
      {
        resource: 'payment_link',
        actions: ['create', 'read', 'update', 'delete', 'list', 'void'],
      },
      {
        resource: 'transaction',
        actions: ['read', 'list', 'refund'],
      },
      {
        resource: 'refund',
        actions: ['create', 'read', 'list'],
      },
      {
        resource: 'webhook',
        actions: ['read', 'list', 'replay'],
      },
      {
        resource: 'api_key',
        actions: ['create', 'read', 'update', 'delete', 'list'],
      },
      {
        resource: 'report',
        actions: ['read', 'list', 'generate', 'schedule'],
      },
      {
        resource: 'audit_log',
        actions: ['read', 'list'],
      },
    ],
  },
  {
    role: 'Admin',
    rules: [
      {
        resource: 'organization',
        actions: ['read', 'update'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'merchant',
        actions: ['create', 'read', 'update', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'user',
        actions: ['create', 'read', 'update', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'payment_link',
        actions: ['create', 'read', 'update', 'delete', 'list', 'void'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'transaction',
        actions: ['read', 'list', 'refund'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'refund',
        actions: ['create', 'read', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'webhook',
        actions: ['read', 'list', 'replay'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'api_key',
        actions: ['create', 'read', 'update', 'delete', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'report',
        actions: ['read', 'list', 'generate', 'schedule'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'audit_log',
        actions: ['read', 'list'],
        conditions: { sameOrganization: true },
      },
    ],
  },
  {
    role: 'MerchantAdmin',
    rules: [
      {
        resource: 'merchant',
        actions: ['read', 'update'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'user',
        actions: ['create', 'read', 'update', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'payment_link',
        actions: ['create', 'read', 'update', 'delete', 'list', 'void'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'checkout_session',
        actions: ['create', 'read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'transaction',
        actions: ['read', 'list', 'refund'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'refund',
        actions: ['create', 'read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'webhook',
        actions: ['read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'api_key',
        actions: ['create', 'read', 'update', 'delete', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'report',
        actions: ['read', 'list', 'generate'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'audit_log',
        actions: ['read', 'list'],
        conditions: { sameMerchant: true },
      },
    ],
  },
  {
    role: 'Staff',
    rules: [
      {
        resource: 'payment_link',
        actions: ['create', 'read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'checkout_session',
        actions: ['create', 'read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'transaction',
        actions: ['read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'refund',
        actions: ['read', 'list'],
        conditions: { sameMerchant: true },
      },
      {
        resource: 'report',
        actions: ['read', 'list'],
        conditions: { sameMerchant: true },
      },
    ],
  },
  {
    role: 'Analyst',
    rules: [
      {
        resource: 'transaction',
        actions: ['read', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'refund',
        actions: ['read', 'list'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'report',
        actions: ['read', 'list', 'generate'],
        conditions: { sameOrganization: true },
      },
      {
        resource: 'audit_log',
        actions: ['read', 'list'],
        conditions: { sameOrganization: true },
      },
    ],
  },
];

// Permission to Role mapping
const PERMISSION_TO_ROLE: Record<Permission, RoleType[]> = {
  // Platform level permissions
  ORGANIZATION_READ: ['PlatformAdmin', 'Admin'],
  ORGANIZATION_WRITE: ['PlatformAdmin', 'Admin'],
  
  // Merchant permissions
  MERCHANTS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  MERCHANTS_WRITE: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  MERCHANTS_DELETE: ['PlatformAdmin'],
  
  // User permissions
  USERS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  USERS_WRITE: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  USERS_DELETE: ['PlatformAdmin', 'Admin'],
  
  // Payment Link permissions
  PAYMENT_LINKS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Staff'],
  PAYMENT_LINKS_WRITE: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Staff'],
  PAYMENT_LINKS_DELETE: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  
  // Transaction permissions
  TRANSACTIONS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Staff', 'Analyst'],
  TRANSACTIONS_REFUND: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  
  // Report permissions
  REPORTS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Staff', 'Analyst'],
  REPORTS_GENERATE: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  
  // Webhook permissions
  WEBHOOKS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  WEBHOOKS_REPLAY: ['PlatformAdmin', 'Admin'],
  
  // API Key permissions
  API_KEYS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  API_KEYS_WRITE: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  API_KEYS_DELETE: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  
  // Audit log permissions
  AUDIT_LOGS_READ: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
};

export class RBACService {
  /**
   * Check if user has permission to perform action on resource
   */
  static hasPermission(
    tenant: TenantContext,
    resource: Resource,
    action: Action,
    resourceContext?: {
      organizationId?: string;
      merchantId?: string;
      ownerId?: string;
    }
  ): boolean {
    // Find applicable rules for the user's role
    const userRole = this.getUserRole(tenant.permissions);
    const policy = ROLE_POLICIES.find(p => p.role === userRole);
    
    if (!policy) {
      return false;
    }

    // Find rule for the resource
    const rule = policy.rules.find(r => r.resource === resource);
    if (!rule || !rule.actions.includes(action)) {
      return false;
    }

    // Check conditions if present
    if (rule.conditions && resourceContext) {
      if (rule.conditions.sameOrganization) {
        if (resourceContext.organizationId !== tenant.organizationId) {
          return false;
        }
      }

      if (rule.conditions.sameMerchant) {
        if (!tenant.merchantId || resourceContext.merchantId !== tenant.merchantId) {
          return false;
        }
      }

      if (rule.conditions.ownResource) {
        if (resourceContext.ownerId !== tenant.userId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get user's primary role based on permissions
   */
  static getUserRole(permissions: Permission[]): RoleType | null {
    // Check for platform admin
    if (permissions.includes('ORGANIZATION_WRITE')) {
      return 'PlatformAdmin';
    }

    // Check for admin (organization level)
    if (permissions.includes('USERS_WRITE') && permissions.includes('MERCHANTS_WRITE')) {
      return 'Admin';
    }

    // Check for merchant admin
    if (permissions.includes('MERCHANTS_WRITE') || permissions.includes('USERS_WRITE')) {
      return 'MerchantAdmin';
    }

    // Check for analyst
    if (permissions.includes('REPORTS_GENERATE') || permissions.includes('AUDIT_LOGS_READ')) {
      return 'Analyst';
    }

    // Default to staff
    return 'Staff';
  }

  /**
   * Get permissions for a role
   */
  static getRolePermissions(role: RoleType): Permission[] {
    return Object.entries(PERMISSION_TO_ROLE)
      .filter(([_, roles]) => roles.includes(role))
      .map(([permission]) => permission as Permission);
  }

  /**
   * Check if user can access specific merchant
   */
  static canAccessMerchant(tenant: TenantContext, merchantId: string): boolean {
    // If user is not scoped to a specific merchant, they can access any merchant in their org
    if (!tenant.merchantId) {
      return true;
    }

    // If user is scoped to a specific merchant, they can only access that merchant
    return tenant.merchantId === merchantId;
  }

  /**
   * Get filtered query conditions based on tenant scope
   */
  static getTenantQueryFilter(tenant: TenantContext): {
    organizationId?: string;
    merchantId?: string;
  } {
    const filter: { organizationId?: string; merchantId?: string } = {};

    // Always filter by organization
    filter.organizationId = tenant.organizationId;

    // Filter by merchant if user is merchant-scoped
    if (tenant.merchantId) {
      filter.merchantId = tenant.merchantId;
    }

    return filter;
  }

  /**
   * Validate resource access based on tenant context
   */
  static validateResourceAccess(
    tenant: TenantContext,
    resource: { organizationId: string; merchantId?: string }
  ): boolean {
    // Check organization access
    if (resource.organizationId !== tenant.organizationId) {
      return false;
    }

    // Check merchant access if tenant is merchant-scoped
    if (tenant.merchantId && resource.merchantId !== tenant.merchantId) {
      return false;
    }

    return true;
  }

  /**
   * Get role hierarchy - roles that can manage other roles
   */
  static getRoleHierarchy(): Record<RoleType, RoleType[]> {
    return {
      PlatformAdmin: ['Admin', 'MerchantAdmin', 'Staff', 'Analyst'],
      Admin: ['MerchantAdmin', 'Staff', 'Analyst'],
      MerchantAdmin: ['Staff'],
      Staff: [],
      Analyst: [],
    };
  }

  /**
   * Check if user can manage another user's role
   */
  static canManageRole(managerRole: RoleType, targetRole: RoleType): boolean {
    const hierarchy = this.getRoleHierarchy();
    return hierarchy[managerRole]?.includes(targetRole) || false;
  }
}