'use client';

import { useEffect, useState, ReactNode } from 'react';
import { AuthProvider } from '../providers/auth-provider';
import { DemoDataBadge } from './ui/demo-data-badge';
import { MockLatencyControl } from '../lib/mock-latency-control';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps): JSX.Element {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize MSW if in mock mode
    async function initializeMocks() {
      try {
        // Dynamic import to avoid bundling in production
        const { initMocks } = await import('../../mocks/init');
        await initMocks();
      } catch (error) {
        console.warn('Failed to initialize mocks:', error);
      } finally {
        setIsReady(true);
      }
    }

    initializeMocks();

    // Add development controls for mock latency
    if (process.env.NEXT_PUBLIC_MOCK === '1') {
      MockLatencyControl.addDevControls();
    }
  }, []);

  // Show loading state while MSW is initializing (only in mock mode)
  if (!isReady && process.env.NEXT_PUBLIC_MOCK === '1') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Initializing demo mode...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider session={session}>
      {children}
      <DemoDataBadge />
    </AuthProvider>
  );
}