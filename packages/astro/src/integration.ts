import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import { KEY_SCHEMA, type RenderRequest } from '@3d-gallery/model-core';
import {
  createForge,
  createArtifactMiddleware,
  createManifestMiddleware,
  type Forge,
} from '@3d-gallery/model-forge';
import { resolveOptions, withSiteBase, type GalleryOptions } from './options.ts';
import { referencedRequests } from './registry.ts';

const VIRTUAL_ID = 'virtual:3d-gallery';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

/**
 * Wires the 3d-gallery module into an Astro site.
 *
 * Dev: artifacts are generated the first time something asks for one, and an
 * edited `.scad` regenerates on the next request — not on save, and not for the
 * parts nobody is looking at.
 *
 * Build: every artifact the manifest declares is rendered into the static
 * output under a content-addressed path. Anything already in the cache is a
 * no-op, so an incremental build only renders what changed.
 *
 * The site itself stays static. There is no server at runtime.
 */
export default function gallery(options: GalleryOptions = {}): AstroIntegration {
  let forge: Forge;
  let artifactUrlBase: string;
  let manifestUrlPath: string;
  let resolved: ReturnType<typeof resolveOptions>;

  return {
    name: '@3d-gallery/astro',

    hooks: {
      'astro:config:setup': ({ config, updateConfig, addWatchFile, logger }) => {
        resolved = resolveOptions(options, fileURLToPath(config.root));

        forge = createForge({
          root: resolved.root,
          modelsDir: resolved.modelsDir,
          cacheDir: resolved.cacheDir,
          manifest: resolved.manifest,
          artifactBase: resolved.artifactBase,
          engine: resolved.engine,
          concurrency: resolved.concurrency,
          timeoutMs: resolved.timeoutMs,
        });

        // Astro writes a static build to dist/ and treats `base` purely as a URL
        // prefix, so the client fetches base-prefixed URLs while the build emits
        // at the un-prefixed path.
        artifactUrlBase = withSiteBase(config.base, resolved.artifactBase);
        manifestUrlPath = withSiteBase(config.base, resolved.manifestPath);

        addWatchFile(join(resolved.modelsDir, 'manifest.json'));

        logger.info(`models from ${resolved.modelsDir}, artifacts at ${artifactUrlBase}`);

        updateConfig({
          vite: {
            plugins: [galleryVitePlugin({
              getForge: () => forge,
              // Two different bases, and the distinction is load-bearing.
              // Vite strips the site base before middlewares see req.url, so
              // the dev routes mount at the gallery-relative path. The browser
              // fetches the real URL, so the manifest publishes the prefixed one.
              serveBase: resolved.artifactBase,
              serveManifestPath: resolved.manifestPath,
              getPublishedBase: () => artifactUrlBase,
              modelsDir: resolved.modelsDir,
            })],
            // The OpenSCAD-WASM fallback renderer is a module worker. Without
            // this a consumer that enables it hits an opaque Rollup error about
            // IIFE worker output rather than anything actionable.
            worker: { format: 'es' },
          },
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const wanted = resolved.prerender === 'declared'
          ? forge.declaredRequests()
          : withDeclaredVariants(referencedRequests(), forge);

        if (resolved.prerender) {
          if (resolved.prerender === 'referenced' && wanted.length === 0) {
            logger.warn('no <ModelViewer> rendered during the build, so nothing was baked. Use prerender: "declared" to bake the whole manifest.');
          }
          const stats = await forge.ensureAll(wanted);
          logger.info(
            `prerendered ${stats.total} ${resolved.prerender} artifacts: ` +
            `${stats.built} built, ${stats.hit} cached (${stats.ms}ms)`,
          );
          for (const failure of stats.failed) {
            logger.error(`${failure.slug}/${failure.target}: ${failure.message}`);
          }
          if (stats.failed.length > 0) {
            throw new Error(`${stats.failed.length} model(s) failed to render — see the errors above`);
          }
        }

        // Emit at the un-prefixed path: Astro's `base` is a URL prefix, not an
        // output directory.
        const artifactDir = join(outDir, resolved.artifactBase);
        mkdirSync(artifactDir, { recursive: true });

        let emitted = 0;
        let bytes = 0;
        for (const request of wanted) {
          const key = await forge.keyFor(request);
          if (!forge.store.has(key, request.format)) continue;
          const from = forge.store.pathFor(key, request.format);
          cpSync(from, join(artifactDir, `${key}.${request.format}`));
          bytes += forge.store.sidecar(key)?.byteLength ?? 0;
          emitted++;
        }

        const manifestFile = join(outDir, resolved.manifestPath);
        mkdirSync(dirname(manifestFile), { recursive: true });
        // The forge knows the gallery-relative base ("/a/"); a client fetching
        // this file needs the site-prefixed one ("/demo/a/"), the same value the
        // virtual module publishes.
        const runtime = await forge.runtimeManifest();
        writeFileSync(manifestFile, JSON.stringify({ ...runtime, artifactBase: artifactUrlBase }));

        logger.info(
          `emitted ${emitted} artifacts (${(bytes / 1_048_576).toFixed(1)} MB) + the runtime manifest into ${outDir}`,
        );
      },
    },
  };
}

/**
 * Expand a referenced set with the declared `variants` of the same parts.
 *
 * `variants` exist to be pre-baked, so a part a page actually shows should bring
 * its variants along. Without this they would silently do nothing outside
 * `prerender: 'declared'`.
 */
function withDeclaredVariants(requests: RenderRequest[], forge: Forge): RenderRequest[] {
  const seen = new Set(requests.map((r) => `${r.slug}/${r.target}/${JSON.stringify(r.params ?? {})}`));
  const out = [...requests];
  const parts = new Set(requests.map((r) => `${r.slug}/${r.target}`));

  for (const declared of forge.declaredRequests()) {
    if (!parts.has(`${declared.slug}/${declared.target}`)) continue;
    const id = `${declared.slug}/${declared.target}/${JSON.stringify(declared.params ?? {})}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(declared);
  }

  return out;
}

interface PluginContext {
  getForge: () => Forge;
  /** Where the dev middleware mounts — base-stripped, as Vite delivers it. */
  serveBase: string;
  serveManifestPath: string;
  /** What the browser fetches — site-base prefixed. */
  getPublishedBase: () => string;
  modelsDir: string;
}

/**
 * Mounts the artifact routes and publishes the runtime manifest as
 * `virtual:3d-gallery`.
 *
 * Both live in a Vite plugin rather than Astro's `astro:server:setup` because
 * Vite only runs middleware added from `configureServer` *before* its own
 * internals. Registered later, Astro's catch-all answers first and every
 * artifact request 404s.
 */
function galleryVitePlugin(ctx: PluginContext): Plugin {
  return {
    name: '3d-gallery',
    // Astro installs its own catch-all dev middleware from its own Vite plugin.
    // Without 'pre' ordering, that catch-all answers first and every artifact
    // request 404s before reaching us.
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      const manifest = await ctx.getForge().runtimeManifest();
      return [
        `export const manifest = ${JSON.stringify({ ...manifest, artifactBase: ctx.getPublishedBase() })};`,
        `export const artifactBase = ${JSON.stringify(ctx.getPublishedBase())};`,
        `export const keySchema = ${JSON.stringify(KEY_SCHEMA)};`,
        'export default manifest;',
      ].join('\n');
    },

    configureServer(server) {
      const forge = ctx.getForge();
      server.config.logger.info(
        `[3d-gallery] artifacts ${ctx.getPublishedBase()} (mounted ${ctx.serveBase}), manifest ${ctx.serveManifestPath}`,
      );

      // Deferred generation: nothing is built until a request arrives, and an
      // edited .scad yields a key the store has never seen — a miss, which
      // renders. There is no invalidation path because none is needed.
      server.middlewares.use(
        createArtifactMiddleware(forge, {
          base: ctx.serveBase,
          onLog: (message) => server.config.logger.info(`[3d-gallery] ${message}`),
        }),
      );
      server.middlewares.use(
        ctx.serveManifestPath,
        createManifestMiddleware(forge, { artifactBase: ctx.getPublishedBase() }),
      );

      server.watcher.on('change', (path: string) => {
        if (!path.endsWith('.scad') && !path.endsWith('manifest.json')) return;
        if (!path.startsWith(ctx.modelsDir + sep)) return;

        const slug = path.slice(ctx.modelsDir.length + 1).split(sep)[0];
        // Drops only the memoized source shape. The artifact store is
        // content-addressed and needs no eviction.
        if (slug) forge.invalidate(slug);

        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
