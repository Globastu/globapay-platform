// Main observability initialization
export * from './tracing';
export * from './metrics';

import { initializeTracing, shutdownTracing } from './tracing';

/**
 * Initialize all observability components
 * This should be called before any other application code
 */
export function initializeObservability() {
  console.log('Initializing observability...');
  
  // Initialize tracing first
  initializeTracing();
  
  // Metrics are initialized automatically when imported
  console.log('Observability initialized successfully');
}

/**
 * Shutdown all observability components
 * This should be called on graceful shutdown
 */
export async function shutdownObservability() {
  console.log('Shutting down observability...');
  await shutdownTracing();
  console.log('Observability shutdown completed');
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await shutdownObservability();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await shutdownObservability();
  process.exit(0);
});