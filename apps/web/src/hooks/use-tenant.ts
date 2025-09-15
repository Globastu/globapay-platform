'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { getTenantInfo, hasPermission, getTenantPageTitle, getTenantLabels, type TenantInfo } from '@/lib/tenant';

export function useTenant() {
  const { data: session, status } = useSession();

  const tenantInfo = useMemo(() => {
    if (status === 'loading' || !session) {
      return null;
    }
    return getTenantInfo(session);
  }, [session, status]);

  const checkPermission = useMemo(() => {
    return (permission: string) => hasPermission(tenantInfo, permission);
  }, [tenantInfo]);

  const getPageTitle = useMemo(() => {
    return (basePage: string) => getTenantPageTitle(basePage, tenantInfo);
  }, [tenantInfo]);

  const labels = useMemo(() => {
    return getTenantLabels(tenantInfo);
  }, [tenantInfo]);

  return {
    tenantInfo,
    isLoading: status === 'loading',
    isPlatform: tenantInfo?.type === 'platform',
    isMerchant: tenantInfo?.type === 'merchant',
    checkPermission,
    getPageTitle,
    labels,
    // Convenience permission checks
    canManageMerchants: checkPermission('manage_merchants'),
    canManageUsers: checkPermission('manage_users'),
    canAccessPlatformSettings: checkPermission('access_platform_settings'),
    canViewAllTransactions: checkPermission('view_all_transactions'),
    canAccessFraudManagement: checkPermission('access_fraud_management'),
    canAccessPlatforms: checkPermission('access_platforms'),
  };
}

export type UseTenantReturn = ReturnType<typeof useTenant>;