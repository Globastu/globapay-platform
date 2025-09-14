'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/components/providers/theme-provider';
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
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardTopbarProps {
  onMobileMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function DashboardTopbar({ 
  onMobileMenuToggle, 
  sidebarCollapsed, 
  onSidebarToggle 
}: DashboardTopbarProps) {
  const { data: session } = useSession();
  const { theme: themeValue, setTheme } = useTheme();
  const theme = themeValue || 'system';
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length] as 'light' | 'dark' | 'system';
    setTheme(nextTheme);
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card/80 backdrop-blur-sm px-6">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions, merchants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 bg-background"
            />
          </div>
        </div>

        {/* Right side - Environment + Notifications + Theme + Profile */}
        <div className="flex items-center gap-3">
          {/* Environment Badge */}
          <Badge variant="info-soft" className="hidden md:flex">
            <Database className="h-3 w-3 mr-1" />
            Sandbox
          </Badge>

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
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            <ThemeIcon className="h-5 w-5" />
          </Button>

          {/* User Profile */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(session.user as any).image} alt={session.user.name || ''} />
                    <AvatarFallback className="text-sm">
                      {getInitials(session.user.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Role: {(session.user as any).role || 'User'}
                    </p>
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
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}