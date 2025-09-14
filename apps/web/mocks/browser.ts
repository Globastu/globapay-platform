import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

// Enable API mocking during development
export const enableMocking = async () => {
  // Check if we're in mock mode
  const shouldMock = process.env.NEXT_PUBLIC_MOCK === '1';
  
  if (!shouldMock) {
    return;
  }

  // Only start MSW in browser environment
  if (typeof globalThis.window === 'undefined') {
    return;
  }

  console.log('🎭 Mock Service Worker enabled - using realistic demo data');
  
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    serviceWorker: {
      // Use custom service worker URL if needed
      url: '/mockServiceWorker.js',
    },
  });

  // Log active handlers for debugging
  const handlerPaths = handlers.map(handler => {
    // MSW v2 format - accessing the handler info
    if ('info' in handler && handler.info.path) {
      return `${handler.info.method} ${handler.info.path}`;
    }
    return 'Unknown handler';
  }).filter(path => path !== 'Unknown handler');

  console.log('📡 Mock handlers active:', handlerPaths);
};