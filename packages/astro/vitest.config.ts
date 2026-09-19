import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    // build.test.ts and dev.test.ts drive the same fixture site — one runs
    // `astro build`, the other spawns `astro dev` and edits a .scad underneath
    // it. Sharing a cache directory and a models tree, they cannot run at once.
    fileParallelism: false,
  },
});
