'use client';

import { isMockMode } from '../../../mocks/init';

export function DemoDataBadge(): JSX.Element | null {
  // Only show in mock mode
  if (!isMockMode()) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
        🎭 Demo Data
      </div>
    </div>
  );
}