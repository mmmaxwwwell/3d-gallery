import { defineConfig } from 'astro/config';
import gallery from '@3d-gallery/astro';

export default defineConfig({
  base: '/demo/',
  // The test suite drives both prerender modes through this env var.
  integrations: [gallery({
    root: import.meta.dirname,
    prerender: process.env.GALLERY_PRERENDER ?? 'declared',
  })],
  // Keep the test output deterministic and quiet.
  build: { assets: '_astro' },
});
