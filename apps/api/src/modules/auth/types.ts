import type { Permission } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  roleId: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

export interface ApiKeyPayload {
  keyId: string;
  organizationId: string;
  merchantId?: string;
  permissions: Permission[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roleId: string;
  permissions: Permission[];
  merchantId?: string; // For merchant-scoped users
}

export interface AuthenticatedApiKey {
  id: string;
  name: string;
  organizationId: string;
  merchantId?: string;
  permissions: Permission[];
}

export interface TenantContext {
  organizationId: string;
  merchantId?: string;
  userId?: string;
  permissions: Permission[];
  isApiKey: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    permissions: Permission[];
  };
}

// RBAC Types
export type RoleType = 'PlatformAdmin' | 'Admin' | 'MerchantAdmin' | 'Staff' | 'Analyst';

export type Resource = 
  | 'organization'
  | 'merchant'
  | 'user' 
  | 'payment_link'
  | 'checkout_session'
  | 'transaction'
  | 'refund'
  | 'webhook'
  | 'api_key'
  | 'report'
  | 'audit_log';

export type Action = 
  | 'create'
  | 'read'
  | 'update' 
  | 'delete'
  | 'list'
  | 'refund'
  | 'void'
  | 'replay'
  | 'generate'
  | 'schedule';

export interface PolicyRule {
  resource: Resource;
  actions: Action[];
  conditions?: {
    ownResource?: boolean;
    sameOrganization?: boolean;
    sameMerchant?: boolean;
  };
}

export interface RolePolicy {
  role: RoleType;
  rules: PolicyRule[];
}