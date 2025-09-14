'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { DashboardTopbar } from '@/components/navigation/dashboard-topbar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

// Routes that should NOT use the dashboard shell
const PUBLIC_ROUTES = [
  '/auth',
  '/pay',
  '/api',
];

// Check if the current path should use dashboard shell
function shouldUseDashboardShell(pathname: string): boolean {
  return !PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarCollapsed]);

  // Don't render shell for public routes or when not authenticated
  if (!shouldUseDashboardShell(pathname) || !session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "hidden lg:flex lg:flex-shrink-0 transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <EnhancedSidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              <EnhancedSidebar 
                collapsed={false}
                onCollapsedChange={() => setMobileMenuOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardTopbar 
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}