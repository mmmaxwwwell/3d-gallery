import { defineConfig } from 'vite';

export default defineConfig({
  base: '/3d-gallery/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
});
