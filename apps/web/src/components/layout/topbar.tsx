'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../providers/theme-provider';
import { 
  Search,
  Bell, 
  Menu,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  Database,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Topbar({ 
  onMobileMenuToggle, 
  sidebarCollapsed, 
  onSidebarToggle 
}: TopbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [environment, setEnvironment] = useState(
    process.env.NEXT_PUBLIC_GR4VY_ENV || 'sandbox'
  );

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  // Demo user for when no session
  const demoUser = {
    name: 'Demo User',
    email: 'demo@globapay.com',
    role: 'Admin',
    image: null
  };

  const user = session?.user ? { ...session.user, image: (session.user as any).image } : demoUser;
  const isDemo = !session?.user;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6">
      <div className="flex w-full items-center justify-between">
        {/* Left side - Mobile menu + Sidebar toggle + Search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={onSidebarToggle}
          >
            <ChevronLeft className={cn(
              'h-5 w-5 transition-transform',
              sidebarCollapsed && 'rotate-180'
            )} />
          </Button>

          {/* Global Search */}
          <div className="relative hidden sm:flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search transactions, merchants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Right side - Environment + Notifications + Theme + Profile */}
        <div className="flex items-center gap-3">
          {/* Environment Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'hidden md:flex items-center gap-2 transition-colors',
                  environment === 'sandbox' 
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                )}
              >
                <Database className="h-3 w-3" />
                <span className="text-xs font-medium capitalize">{environment}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Environment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEnvironment('sandbox')}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Sandbox</span>
                  {environment === 'sandbox' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEnvironment('production')}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Production</span>
                  {environment === 'production' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* MSW Demo Badge */}
          {process.env.NEXT_PUBLIC_MOCK === '1' && (
            <Badge variant="outline" className="hidden sm:inline-flex">
              Demo Data
            </Badge>
          )}

          {/* Mobile search */}
          <Button variant="ghost" size="sm" className="sm:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ThemeIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image} alt={user.name || ''} />
                  <AvatarFallback className="text-sm">
                    {getInitials(user.name || 'User')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {isDemo && (
                    <p className="text-xs leading-none text-blue-600 dark:text-blue-400">
                      Demo Mode
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isDemo && (
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}