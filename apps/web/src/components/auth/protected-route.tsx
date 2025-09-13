'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = '/auth/signin',
}: ProtectedRouteProps): JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      router.push(fallbackPath);
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission =>
        session.user.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        router.push(fallbackPath);
        return;
      }
    }
  }, [session, status, router, requiredPermissions, requiredRoles, fallbackPath]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <div></div>; // Will redirect in useEffect
  }

  return <>{children}</>;
}

// Hook to check permissions
export function usePermissions() {
  const { data: session } = useSession();

  const hasPermission = (permission: string): boolean => {
    return session?.user.permissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return session?.user.role === role || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(session?.user.role || '') || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => 
      session?.user.permissions.includes(permission)
    ) || false;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    permissions: session?.user.permissions || [],
    role: session?.user.role || '',
  };
}