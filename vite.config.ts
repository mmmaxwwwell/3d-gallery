import { defineConfig, type Plugin } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { buildModel, loadManifest } from './scripts/build-models.mjs';

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

// In dev, watch models/**/*.scad and rebuild the affected model (STL/3MF +
// mirror into public/models/<slug>/) on save, then trigger a full page
// reload so the viewer re-fetches the artifact. Debounced per-slug so a
// burst of saves collapses into one build.
function scadWatcherPlugin(): Plugin {
  const modelsDir = resolve(__dirname, 'models');
  const pending = new Set<string>();
  const inflight = new Map<string, Promise<void>>();
  let timer: NodeJS.Timeout | null = null;

  return {
    name: 'scad-watcher',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(resolve(modelsDir, '**/*.scad'));

      async function rebuild(slug: string) {
        const existing = inflight.get(slug);
        if (existing) return existing;
        const p = (async () => {
          const manifest = loadManifest();
          const model = manifest.models.find((m: { slug: string }) => m.slug === slug);
          if (!model) {
            server.config.logger.warn(`[scad-watcher] ${slug} not in manifest — skipping`);
            return;
          }
          const t0 = Date.now();
          server.config.logger.info(`[scad-watcher] rebuilding ${slug}...`);
          await buildModel(model);
          server.config.logger.info(`[scad-watcher] ${slug} rebuilt in ${Date.now() - t0}ms`);
        })().finally(() => inflight.delete(slug));
        inflight.set(slug, p);
        return p;
      }

      server.watcher.on('change', (path: string) => {
        if (!path.endsWith('.scad')) return;
        if (!path.startsWith(modelsDir + sep)) return;
        const rel = path.substring(modelsDir.length + 1);
        const slug = rel.split(sep)[0];
        if (!slug) return;
        pending.add(slug);
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          const slugs = [...pending];
          pending.clear();
          timer = null;
          try {
            await Promise.all(slugs.map(rebuild));
            for (const slug of slugs) {
              server.ws.send({ type: 'custom', event: 'scad-rebuilt', data: { slug } });
            }
          } catch (err) {
            server.config.logger.error(`[scad-watcher] rebuild failed: ${(err as Error).message}`);
          }
        }, 200);
      });
    },
  };
}

export default defineConfig({
  base: '/3d-gallery/',
  plugins: [liveManifestPlugin(), scadWatcherPlugin()],
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
