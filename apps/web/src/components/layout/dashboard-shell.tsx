'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

// Routes that should NOT use the dashboard shell (public pages)
const PUBLIC_ROUTES = [
  '/auth',
  '/pay',
  '/api',
];

function shouldUseDashboardShell(pathname: string): boolean {
  return !PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldUseShell = shouldUseDashboardShell(pathname);

  // Close mobile menu on route change
  useEffect(() => {
    if (shouldUseShell) {
      setMobileMenuOpen(false);
    }
  }, [pathname, shouldUseShell]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (!shouldUseShell) return;
    
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [shouldUseShell]);

  // Don't render shell for public routes
  if (!shouldUseShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:flex lg:flex-shrink-0 transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={setSidebarCollapsed}
            pathname={pathname}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              <Sidebar 
                collapsed={false}
                onCollapsedChange={() => setMobileMenuOpen(false)}
                pathname={pathname}
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar 
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}