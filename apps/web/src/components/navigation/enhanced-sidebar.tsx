'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  LayoutDashboard,
  CreditCard,
  Receipt,
  BarChart3,
  Shield,
  Building2,
  Users,
  Key,
  Webhook,
  FileText,
  Settings,
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  Monitor,
  User,
  MenuIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  permissions?: string[];
  roles?: string[];
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Payment Links',
    href: '/payment-links',
    icon: CreditCard,
    permissions: ['PAYMENT_LINKS_READ'],
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    permissions: ['TRANSACTIONS_READ'],
    badge: '12',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    permissions: ['REPORTS_READ'],
  },
  {
    name: 'Fraud Detection',
    href: '/fraud',
    icon: Shield,
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
    badge: '3',
  },
  {
    name: 'Merchants',
    href: '/merchants',
    icon: Building2,
    permissions: ['MERCHANTS_READ'],
    roles: ['PlatformAdmin', 'Admin'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    permissions: ['USERS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
  {
    name: 'API Keys',
    href: '/api-keys',
    icon: Key,
    permissions: ['API_KEYS_READ'],
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
    permissions: ['WEBHOOKS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin'],
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: FileText,
    permissions: ['AUDIT_LOGS_READ'],
    roles: ['PlatformAdmin', 'Admin', 'MerchantAdmin', 'Analyst'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

function hasPermission(
  userPermissions: string[],
  userRole: string,
  requiredPermissions?: string[],
  allowedRoles?: string[]
): boolean {
  if (!requiredPermissions && !allowedRoles) {
    return true;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return false;
  }

  if (requiredPermissions && !requiredPermissions.some(p => userPermissions.includes(p))) {
    return false;
  }

  return true;
}

interface EnhancedSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function EnhancedSidebar({ collapsed = false, onCollapsedChange }: EnhancedSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const toggleCollapsed = () => {
    onCollapsedChange?.(!collapsed);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  if (!session?.user) {
    return (
      <div className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <div className="flex h-16 items-center justify-center">
          <div className="h-8 w-8 rounded bg-primary"></div>
        </div>
      </div>
    );
  }

  const filteredNavigation = navigation.filter(item =>
    hasPermission(
      session.user.permissions,
      session.user.role,
      item.permissions,
      item.roles
    )
  );

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className={cn(
      'flex h-full flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className={cn('flex items-center', collapsed && 'justify-center w-full')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
            <span className="text-sm font-bold text-primary-foreground">G</span>
          </div>
          {!collapsed && (
            <>
              <div className="ml-2 flex flex-col">
                <span className="text-lg font-semibold text-foreground">Globapay</span>
                <span className="text-xs text-muted-foreground">Platform</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6"
                onClick={toggleCollapsed}
              >
                <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200')} />
              </Button>
            </>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6"
              onClick={toggleCollapsed}
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Environment Badge */}
      {!collapsed && (
        <div className="px-4 pt-4">
          <Badge variant="info-soft" className="w-full justify-center">
            <div className="h-2 w-2 rounded-full bg-info mr-2"></div>
            Sandbox Mode
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 sidebar-scroll overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground',
                collapsed && 'justify-center px-2'
              )}>
                <Icon className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                )} />
                {!collapsed && (
                  <>
                    <span className="ml-3 truncate">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" size="sm" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        {collapsed ? (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(session.user as any).image} alt={session.user.name || ''} />
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  <ThemeIcon className="mr-2 h-4 w-4" />
                  Theme: {theme}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={(session.user as any).image} alt={session.user.name || ''} />
                <AvatarFallback>
                  {getInitials(session.user.name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.role}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleTheme}>
                    <ThemeIcon className="mr-2 h-4 w-4" />
                    Theme: {theme}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}