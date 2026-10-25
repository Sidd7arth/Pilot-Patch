import { defineConfig, configDefaults } from 'vitest/config';

const isLiveExplicit =
  process.argv.some((arg) => arg.includes('live.test.ts')) ||
  process.env.VITEST_INCLUDE_LIVE === 'true';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
      ...(isLiveExplicit ? [] : ['packages/qloo-client/test/live.test.ts']),
    ],
  },
});
