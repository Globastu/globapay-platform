// Initialize MSW conditionally based on environment
export const initMocks = async () => {
  const shouldMock = process.env.NEXT_PUBLIC_MOCK === '1';
  
  if (!shouldMock) {
    return;
  }

  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Dynamic import to avoid bundling MSW in production
  const { enableMocking } = await import('./browser');
  await enableMocking();
};

// Export mock mode detection
export const isMockMode = () => {
  return process.env.NEXT_PUBLIC_MOCK === '1';
};