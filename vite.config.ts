import { defineConfig, type Plugin } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Serve the source `models/manifest.json` in dev so edits show up on
// refresh without needing `npm run build:models`. In production the
// build step still copies it into `public/models/manifest.json` and
// this middleware never runs. Keeps humans + e2e tests + the app all
// looking at the same source of truth.
function liveManifestPlugin(): Plugin {
  const sourcePath = resolve(__dirname, 'models', 'manifest.json');
  return {
    name: 'live-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/3d-gallery/models/manifest.json', (_req, res) => {
        if (!existsSync(sourcePath)) {
          res.statusCode = 404;
          res.end('manifest.json not found');
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(sourcePath, 'utf8'));
      });
    },
  };
}

export default defineConfig({
  base: '/3d-gallery/',
  plugins: [liveManifestPlugin()],
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
