import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { cpus } from 'node:os';
import { resolve, sep } from 'node:path';
import { createForge, targetOf, createArtifactMiddleware, createManifestMiddleware } from '@3d-gallery/model-forge';
import type { ManifestPart } from '@3d-gallery/model-core';
// Node-side embedder, not the browser one in @3d-gallery/viewer — importing
// that package here would drag three.js and a web worker into the Vite config.
// @ts-expect-error — plain-JS build script, no types.
import { embedUrl } from '../../scripts/embed-source-url.mjs';
import { copyPrintToolkitAssets } from '@3d-gallery/print-toolkit/vite-plugin';

// libslic3r.wasm is fetched on demand from GitHub Releases (T4). Until that
// release exists the assets/ dir is empty and the toolkit's Vite plugin
// throws in buildStart — which would fail the whole gallery build even
// though the print UI can lazy-init the WASM later. Only wire the plugin
// in when there's actually something to copy; otherwise log a warning so
// the human notices during dev.
const toolkitAssetsDir = resolve(__dirname, '..', 'print-toolkit', 'assets');
const toolkitAssetsPresent =
  existsSync(toolkitAssetsDir) &&
  readdirSync(toolkitAssetsDir).some((n) => n.endsWith('.wasm') || n.endsWith('.js'));
if (!toolkitAssetsPresent) {
  // eslint-disable-next-line no-console
  console.warn(
    '[gallery-app] print-toolkit assets missing — skipping copyPrintToolkitAssets. ' +
      'Run `npm run fetch-wasm -w @3d-gallery/print-toolkit` to populate.',
  );
}

const REPO_ROOT = resolve(__dirname, '..', '..');
const MODELS_DIR = resolve(REPO_ROOT, 'models');
const SITE_URL = 'https://mmmaxwwwell.github.io/3d-gallery/';
const BASE = '/3d-gallery/';
const ARTIFACT_BASE = `${BASE}a/`;

/**
 * Serves models straight out of the artifact forge in dev.
 *
 * Replaces the eager rebuild-on-save watcher this config used to carry. Saving a
 * `.scad` no longer rebuilds every part of the model — it changes the source
 * digest, and the next request for the part you're actually looking at misses
 * the content-addressed cache and renders. Everything else stays cached.
 *
 * The URL shape (`models/<slug>/<file>`) is unchanged, so the app needs no
 * changes to benefit.
 */
function galleryModelsPlugin(): Plugin {
  const MANIFEST_PATH = resolve(MODELS_DIR, 'manifest.json');
  let log: { info(msg: string): void } | null = null;

  const newForge = () =>
    createForge({
      root: REPO_ROOT,
      modelsDir: MODELS_DIR,
      // The e2e suite drives this server from several browsers at once. The
      // default cap of 4 leaves later requests queued behind renders, which is
      // enough extra latency to perturb timing-sensitive specs.
      concurrency: Math.max(4, cpus().length - 2),
    });

  type Forge = ReturnType<typeof newForge>;
  type ForgeMiddleware = ReturnType<typeof createArtifactMiddleware>;

  /**
   * Everything derived from the manifest, in one object. The forge parses
   * `models/manifest.json` once at construction, so an edit to it means a new
   * forge and a new set of handlers — swapping this whole binding is what
   * keeps the two in step.
   */
  function bind(forge: Forge) {
    // `file` -> the part entry, so a request can be mapped back to what renders it.
    const parts = new Map<string, Map<string, ManifestPart>>();
    for (const model of forge.manifest.models) {
      const byFile = new Map<string, ManifestPart>();
      for (const part of [...(model.previews ?? []), ...(model.parts ?? [])]) byFile.set(part.file, part);
      parts.set(model.slug, byFile);
    }
    return {
      forge,
      parts,
      // The forge defaults its artifact base to `/a/`, but the site is served
      // under a base prefix, so the client has to be told the prefixed form —
      // the same one `scripts/build-models.mjs` bakes into the published manifest.
      manifest: createManifestMiddleware(forge, { artifactBase: ARTIFACT_BASE }),
      // Two mounts for the same reason the model handler accepts two shapes:
      // whether the site base is still on req.url depends on where in the stack
      // this runs.
      artifacts: [ARTIFACT_BASE, '/a/'].map((base) =>
        createArtifactMiddleware(forge, {
          base,
          onLog: (message) => log?.info(`[gallery-artifacts] ${message}`),
        }),
      ),
    };
  }

  let bound = bind(newForge());

  /** Registered once, but resolved per request, so a reload takes effect. */
  function delegate(pick: () => ForgeMiddleware): ForgeMiddleware {
    const handler: ForgeMiddleware = (req, res, next) => pick()(req, res, next);
    return handler;
  }

  return {
    name: 'gallery-models',
    apply: 'serve',
    // Vite only runs middleware added here ahead of its own static handler; any
    // later and `public/models/` would answer with a stale artifact.
    enforce: 'pre',

    configureServer(server) {
      log = server.config.logger;
      server.middlewares.use('/3d-gallery/models/manifest.json', delegate(() => bound.manifest));
      // Ahead of Vite's static handler so a request renders on demand instead
      // of 404ing when `public/a/` predates the current source.
      bound.artifacts.forEach((_, i) => server.middlewares.use(delegate(() => bound.artifacts[i])));

      server.middlewares.use(async (req, res, next) => {
        // Whether the site base is still on req.url depends on where in the
        // stack this runs: registered ahead of Vite's internals it is, but under
        // Astro the base is already stripped. Accept either.
        const path = (req.url ?? '').split('?')[0];
        const rel = path.startsWith(BASE) ? path.slice(BASE.length - 1) : path;
        const match = rel.match(/^\/models\/([a-z0-9-]+)\/([^/]+)$/);
        if (!match) return next();

        const [, slug, file] = match;
        const part = bound.parts.get(slug)?.get(file);
        if (!part) return next();

        try {
          const started = Date.now();
          const result = await bound.forge.ensure({ slug, target: targetOf(part), format: part.format });

          // Same permalink the CLI build injects, so a part downloaded from the
          // dev server scans back to its page exactly like a released one.
          const url = new URL(SITE_URL);
          url.searchParams.set('model', slug);
          if (part.module) url.searchParams.set('part', part.module);
          const bytes: Uint8Array = embedUrl(result.bytes, part.format, url.toString());

          if (result.status === 'built') {
            server.config.logger.info(`[gallery-models] built ${slug}/${file} in ${Date.now() - started}ms`);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', part.format === '3mf' ? 'model/3mf' : 'model/stl');
          res.setHeader('Content-Length', String(bytes.byteLength));
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-Forge-Status', result.status);
          res.end(Buffer.from(bytes));
        } catch (err) {
          server.config.logger.error(`[gallery-models] ${slug}/${file}: ${(err as Error).message}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end((err as Error).message);
        }
      });

      // Compared against on every manifest event: adding a directory to the
      // watcher replays an `add` for each file already in it, and that is not
      // an edit. Only a stamp that moved is.
      let manifestStamp = statSync(MANIFEST_PATH).mtimeMs;

      function reloadManifest() {
        const stamp = statSync(MANIFEST_PATH).mtimeMs;
        if (stamp === manifestStamp) return;
        manifestStamp = stamp;
        let next: Forge;
        try {
          next = newForge();
        } catch (err) {
          // A half-written or invalid file: keep serving the last good one, and
          // let the next save try again.
          server.config.logger.error(
            `[gallery-models] manifest.json not loadable, keeping the previous one — ${(err as Error).message}`,
          );
          return;
        }
        bound = bind(next);
        server.config.logger.info('[gallery-models] manifest.json changed — reloaded');
        server.ws.send({ type: 'full-reload' });
      }

      // The directory, not a glob: chokidar 4 (Vite 6) dropped glob support, so
      // a pattern here is treated as a literal path that never matches. models/
      // also sits outside the Vite root, so nothing watches it otherwise.
      server.watcher.add(MODELS_DIR);

      function onModelsFileEvent(path: string) {
        if (!path.startsWith(MODELS_DIR + sep)) return;
        // Editors that save by rename report unlink + add rather than change,
        // so both events route here.
        if (path === MANIFEST_PATH) return reloadManifest();
        if (!path.endsWith('.scad')) return;
        const slug = path.substring(MODELS_DIR.length + 1).split(sep)[0];
        if (!slug) return;
        // Only drops the memoized source shape; the artifact cache is
        // content-addressed and needs no eviction.
        bound.forge.invalidate(slug);
        server.config.logger.info(`[gallery-models] ${slug} changed — next request re-renders`);
        server.ws.send({ type: 'custom', event: 'scad-rebuilt', data: { slug } });
        server.ws.send({ type: 'full-reload' });
      }

      server.watcher.on('change', onModelsFileEvent);
      server.watcher.on('add', (path: string) => {
        if (path === MANIFEST_PATH) reloadManifest();
      });
    },
  };
}

export default defineConfig({
  base: '/3d-gallery/',
  // Static assets (built STL/3MF, wasm, icons, PWA manifest) live at the
  // repo-root `public/`: `scripts/build-models.mjs` writes STL/3MF into
  // `public/models/`, `flake.nix` symlinks WASM into `public/wasm/`, and
  // the gallery-app icons live alongside them. Point Vite at the shared
  // dir instead of duplicating it per-package.
  publicDir: resolve(__dirname, '..', '..', 'public'),
  define: {
    // Bundle marker — logged on boot so we can tell whether the browser
    // is running the current bundle or a cached one from a stale SW.
    __BUILD_TAG__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    galleryModelsPlugin(),
    ...(toolkitAssetsPresent ? [copyPrintToolkitAssets({ dest: 'wasm' })] : []),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // main.ts registers via virtual:pwa-register
      // In dev, the PWA plugin should be a no-op. Any SW registration
      // (from a prior prod visit) is cleared client-side in main.ts.
      devOptions: { enabled: false },
      // Precache the built vite bundle + everything Vite copies from
      // public/ (models, wasm, icons). Ranges: keep the model assets
      // small enough that offline install is meaningful without
      // bloating first-load — cap per-file at 10 MB.
      //
      // Assets over the cap are named in globIgnores and stay network-only;
      // raising the cap instead would push first-visit precache past 100 MB.
      // They are spelled out one by one rather than derived from a size scan
      // because vite-plugin-pwa fails the build on an oversized asset it was
      // not told about, and that error is the only signal that a new
      // multi-megabyte file has landed. Ignoring by size would silence it.
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,webmanifest,wasm,json,stl,3mf}'],
        globIgnores: [
          'wasm/libslic3r-wasm64.wasm',
          'models/et300-knob-aide-knurled/knurl-depth-grid.stl',
          // Content-addressed artifact tree emitted by scripts/build-models.mjs.
          // Immutable and fetched on demand; precaching it would ship every
          // model twice.
          'a/**',
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: '/3d-gallery/index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        id: '/3d-gallery/',
        name: "mmmaxwwwell's 3d-gallery",
        short_name: '3d-gallery',
        description: 'Gallery of 3D-printable OpenSCAD models with an in-browser Three.js viewer.',
        start_url: '/3d-gallery/',
        scope: '/3d-gallery/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'any',
        icons: [
          { src: 'icons/icon.svg',                sizes: 'any',     type: 'image/svg+xml', purpose: 'any'      },
          { src: 'icons/icon-192.png',            sizes: '192x192', type: 'image/png',     purpose: 'any'      },
          { src: 'icons/icon-512.png',            sizes: '512x512', type: 'image/png',     purpose: 'any'      },
          { src: 'icons/icon-maskable-512.png',   sizes: '512x512', type: 'image/png',     purpose: 'maskable' },
        ],
      },
    }),
  ],
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
