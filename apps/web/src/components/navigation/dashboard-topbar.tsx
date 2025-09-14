'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DashboardTopbar() {
  const { data: session } = useSession();
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');

  const toggleEnvironment = () => {
    setEnvironment(current => current === 'sandbox' ? 'production' : 'sandbox');
  };

  return (
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions, merchants, or resources..."
            className="pl-10 bg-background/50 border-border focus:bg-background"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Environment Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex items-center space-x-2 transition-colors',
                environment === 'sandbox' 
                  ? 'border-info/30 bg-info/10 text-info hover:bg-info/20' 
                  : 'border-success/30 bg-success/10 text-success hover:bg-success/20'
              )}
            >
              <div className={cn(
                'h-2 w-2 rounded-full',
                environment === 'sandbox' ? 'bg-info' : 'bg-success'
              )} />
              <span className="text-sm font-medium capitalize">
                {environment}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Environment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEnvironment('sandbox')}>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-info" />
                <span>Sandbox</span>
                {environment === 'sandbox' && (
                  <Badge variant="secondary" size="sm" className="ml-auto">
                    Active
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEnvironment('production')}>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span>Production</span>
                {environment === 'production' && (
                  <Badge variant="secondary" size="sm" className="ml-auto">
                    Active
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            size="sm"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>

        {/* User Profile Quick Access */}
        {session?.user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-border">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{session.user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}