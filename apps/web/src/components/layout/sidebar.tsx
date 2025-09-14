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
  ChevronLeft,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export function Sidebar({ collapsed, onCollapsedChange, pathname }: SidebarProps) {
  // Filter navigation based on feature flags
  const filteredNavigation = navigation.filter(item => {
    // Hide Gift Cards if feature is disabled and we're not showing the badge
    if (item.href === '/gift-cards' && process.env.NEXT_PUBLIC_GLOBAGIFT_ENABLED === '0' && !item.badge) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <div className={cn('flex items-center', collapsed && 'justify-center w-full')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          {!collapsed && (
            <>
              <div className="ml-3 flex flex-col">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Globapay</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Platform</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 w-8 p-0"
                onClick={() => onCollapsedChange(!collapsed)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden"
              onClick={() => onCollapsedChange(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {filteredNavigation.map((item) => {
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