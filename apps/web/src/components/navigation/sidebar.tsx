'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string[];
  roles?: string[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Payment Links',
    href: '/payment-links',
    icon: CreditCardIcon,
    permissions: ['PAYMENT_LINKS_READ'],
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: DocumentTextIcon,
    permissions: ['TRANSACTIONS_READ'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    permissions: ['REPORTS_READ'],
  },
  {
    name: 'Fraud Detection',
    href: '/fraud',
    icon: ShieldCheckIcon,
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  },
  {
    name: 'Merchants',
    href: '/merchants',
    icon: BuildingOfficeIcon,
    permissions: ['MERCHANTS_READ'],
    roles: ['PlatformAdmin', 'Admin'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserGroupIcon,
    permissions: ['USERS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
  {
    name: 'API Keys',
    href: '/api-keys',
    icon: KeyIcon,
    permissions: ['API_KEYS_READ'],
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    icon: ExclamationTriangleIcon,
    permissions: ['WEBHOOKS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: ClockIcon,
    permissions: ['AUDIT_LOGS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
  },
];

function classNames(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function hasPermission(
  userPermissions: string[],
  userRole: string,
  requiredPermissions?: string[],
  allowedRoles?: string[]
): boolean {
  // If no restrictions, allow access
  if (!requiredPermissions && !allowedRoles) {
    return true;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return false;
  }

  // Check permission-based access
  if (requiredPermissions && !requiredPermissions.some(p => userPermissions.includes(p))) {
    return false;
  }

  return true;
}

export function Sidebar(): JSX.Element {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) {
    return <div></div>;
  }

  const filteredNavigation = navigation.filter(item =>
    hasPermission(
      session.user.permissions,
      session.user.role,
      item.permissions,
      item.roles
    )
  );

  return (
    <div className="flex h-full flex-col bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-600 rounded"></div>
          <span className="ml-2 text-xl font-semibold text-gray-900">
            Globapay
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                      'h-6 w-6 shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info and sign out */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500">
              {session.user.role}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="mt-3 w-full text-left text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}