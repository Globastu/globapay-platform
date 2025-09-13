import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/schemas/',
        '**/examples/',
        '**/__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Business logic packages - higher thresholds
        'src/modules/*/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/services/*/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
});