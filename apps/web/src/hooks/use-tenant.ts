'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useEffect, useState } from 'react';
import { getTenantInfo, hasPermission, getTenantPageTitle, getTenantLabels, type TenantInfo } from '@/lib/tenant';
import { isSandboxMode, createSandboxSession } from '@/lib/sandbox';

export function useTenant() {
  const { data: session, status } = useSession();
  const [sandboxSession, setSandboxSession] = useState<any>(null);

  // Check if we're in sandbox mode and create a mock session
  useEffect(() => {
    if (isSandboxMode()) {
      setSandboxSession(createSandboxSession());
    }
  }, []);

  // Listen for sandbox tenant type changes
  useEffect(() => {
    if (!isSandboxMode()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globapay-sandbox-tenant-type') {
        setSandboxSession(createSandboxSession());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const tenantInfo = useMemo(() => {
    // In sandbox mode, use the sandbox session
    if (isSandboxMode() && sandboxSession) {
      return getTenantInfo(sandboxSession);
    }
    
    // In production, use the real session
    if (status === 'loading' || !session) {
      return null;
    }
    return getTenantInfo(session);
  }, [session, status, sandboxSession]);

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
    isLoading: isSandboxMode() ? false : status === 'loading',
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
    // Sandbox-specific properties
    isSandbox: isSandboxMode(),
  };
}

export type UseTenantReturn = ReturnType<typeof useTenant>;