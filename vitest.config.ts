import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Vitest runs unit/component tests under src/ only.
    // Playwright E2E/a11y specs (tests/**) run via `pnpm exec playwright test`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'tests/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      // Scope coverage to application logic. Build artifacts, config, and
      // framework entrypoints (App Router pages/layouts, sitemap/robots/manifest,
      // middleware, next-intl wiring) are verified by `next build` + E2E, not unit tests.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '.next/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        'vitest.setup.ts',
        'src/__test__/**',
        'src/app/**',
        'src/middleware.ts',
        'src/i18n/routing.ts',
        'src/i18n/request.ts',
        'src/tools/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
