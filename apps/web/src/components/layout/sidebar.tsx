'use client';

import Link from 'next/link';
import { 
  LayoutDashboard,
  Users,
  FileText,
  Link as LinkIcon,
  Shield,
  BarChart3,
  Settings,
  Gift,
  Receipt,
  Code,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/hooks/use-tenant';
import { filterNavigationByTenant } from '@/lib/tenant';
import { isSandboxMode } from '@/lib/sandbox';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Platforms',
    href: '/platforms',
    icon: Building,
  },
  {
    name: 'Merchants',
    href: '/merchants',
    icon: Users,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: FileText,
  },
  {
    name: 'Payment Links',
    href: '/payment-links',
    icon: LinkIcon,
  },
  {
    name: 'Checkout Builder',
    href: '/checkout-builder',
    icon: Code,
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: Receipt,
  },
  {
    name: 'Fraud',
    href: '/fraud',
    icon: Shield,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Gift Cards',
    href: '/gift-cards',
    icon: Gift,
    ...(process.env.NEXT_PUBLIC_GLOBAGIFT_ENABLED !== '1' && { badge: 'NEW' }),
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  pathname: string;
}

// Component to handle logo display with fallbacks
function CompanyLogo({ collapsed, className = "", isSandbox = false }: { collapsed: boolean; className?: string; isSandbox?: boolean }) {
  // Always show demo branding in sandbox mode for consistency
  if (collapsed) {
    return (
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm", className)}>
        <span className="text-sm font-bold text-white">{isSandbox ? 'S' : 'G'}</span>
      </div>
    );
  }

  // Expanded sidebar - show demo branding
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
        <span className="text-sm font-bold text-white">{isSandbox ? 'S' : 'G'}</span>
      </div>
      <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
        {isSandbox ? 'Source' : 'Globapay'}
      </span>
    </div>
  );
}

export function Sidebar({ collapsed, onCollapsedChange, pathname }: SidebarProps) {
  const { tenantInfo, isLoading, labels, isSandbox } = useTenant();

  // Filter navigation based on feature flags and tenant permissions
  const filteredNavigation = navigation.filter(item => {
    // Hide Gift Cards if feature is disabled and we're not showing the badge
    if (item.href === '/gift-cards' && process.env.NEXT_PUBLIC_GLOBAGIFT_ENABLED === '0' && !item.badge) {
      return false;
    }
    // Hide Invoices if feature is disabled
    if (item.href === '/invoices' && process.env.NEXT_PUBLIC_INVOICES_ENABLED !== '1') {
      return false;
    }
    // Hide Checkout Builder if feature is disabled
    if (item.href === '/checkout-builder' && process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== '1') {
      return false;
    }
    return true;
  });

  // Apply tenant-based filtering
  const tenantFilteredNavigation = isLoading ? filteredNavigation : filterNavigationByTenant(filteredNavigation, tenantInfo);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative">
      {/* Header */}
      <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center w-full">
          {/* Logo Section */}
          <div className="flex items-center flex-1 min-w-0">
            <CompanyLogo collapsed={collapsed} isSandbox={isSandbox} />
            {!collapsed && (
              <div className="ml-3 flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tenantInfo?.type === 'admin' ? 'Admin' : 
                   tenantInfo?.type === 'platform' ? 'Platform' : 'Merchant'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Collapse/Expand Button - Center edge of sidebar */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-1/2 -translate-y-1/2 -right-3 h-6 w-6 p-0 flex-shrink-0 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg z-10"
        onClick={() => onCollapsedChange(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {tenantFilteredNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                'group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                isActive 
                  ? 'bg-primary text-white shadow-sm hover:bg-primary/90' 
                  : 'text-gray-700 dark:text-gray-300',
                collapsed && 'justify-center px-2'
              )}>
                <Icon className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )} />
                {!collapsed && (
                  <>
                    <span className="ml-3 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
            All systems operational
          </div>
        </div>
      )}
    </div>
  );
}