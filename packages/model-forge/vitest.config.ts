import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Real openscad renders dominate; the unit tests are fast but the
    // engine-backed ones are not.
    testTimeout: 120_000,
  },
});
