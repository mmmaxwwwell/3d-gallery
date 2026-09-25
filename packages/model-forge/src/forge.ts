import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  allParts,
  artifactKey,
  buildViews,
  artifactUrl,
  canonicalizeParams,
  KEY_SCHEMA,
  KeyMismatchError,
  validateManifest,
  type ArtifactFormat,
  type Manifest,
  type ManifestPart,
  type RenderRequest,
  type RuntimeBuild,
  type RuntimeManifest,
  type RuntimePart,
  type ScadValue,
} from '@3d-gallery/model-core';
import { selectEngine, RenderFailedError, type EngineChoice, type RenderEngine } from './engine.ts';
import { createSourceCache, assemble, type SourceShape } from './source.ts';
import { createStore, type Sidecar, type Store } from './store.ts';

export interface ForgeConfig {
  /** Repo root. `files` in a resolved source are relative to it. */
  root: string;
  /** Defaults to `<root>/models`. */
  modelsDir?: string;
  /** Pass a manifest directly, or let it load from `<modelsDir>/manifest.json`. */
  manifest?: Manifest;
  /** Keep `devOnly` models. On for a dev server; off for a build that publishes. */
  includeDevOnly?: boolean;
  /** Defaults to `<root>/.cache/forge`. */
  cacheDir?: string;
  engine?: EngineChoice;
  /** Simultaneous renders. OpenSCAD is single-threaded per process but memory-hungry. */
  concurrency?: number;
  /** Wall-clock cap per render. */
  timeoutMs?: number;
  /** How long a failed render stays remembered. */
  negativeTtlMs?: number;
  /** URL prefix artifacts are served under. */
  artifactBase?: string;
}

export interface EnsureResult {
  key: string;
  format: ArtifactFormat;
  bytes: Buffer;
  path: string;
  status: 'hit' | 'built';
  sidecar: Sidecar;
}

export interface PrerenderStats {
  total: number;
  hit: number;
  built: number;
  failed: { slug: string; target: string; message: string }[];
  ms: number;
}

/** A render that already failed within the negative-cache window. */
export class CachedRenderError extends Error {
  readonly code = 'E_RENDER_FAILED_CACHED';
  readonly logs: string[];
  constructor(message: string, logs: string[]) {
    super(message);
    this.name = 'CachedRenderError';
    this.logs = logs;
  }
}

/** The URL extension disagrees with the format the render request declares. */
export class FormatMismatchError extends Error {
  readonly code = 'E_FORMAT_MISMATCH';
  constructor(urlFormat: string, requestFormat: string) {
    super(`URL extension ".${urlFormat}" contradicts the request format "${requestFormat}"`);
    this.name = 'FormatMismatchError';
  }
}

export class UnknownModelError extends Error {
  readonly code = 'E_UNKNOWN_MODEL';
  constructor(slug: string) {
    super(`No model "${slug}" in the manifest`);
    this.name = 'UnknownModelError';
  }
}

/** A part's source name — what `parts/` and `previews/` are searched for. */
export function targetOf(part: ManifestPart): string {
  return part.file.replace(/\.\w+$/, '');
}

function semaphore(limit: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export function createForge(config: ForgeConfig) {
  const root = config.root;
  const modelsDir = config.modelsDir ?? join(root, 'models');
  const cacheDir = config.cacheDir ?? join(root, '.cache', 'forge');
  const artifactBase = config.artifactBase ?? '/a/';
  const timeoutMs = config.timeoutMs ?? 120_000;
  const negativeTtlMs = config.negativeTtlMs ?? 60_000;

  const authored: Manifest = config.manifest
    ? validateManifest(config.manifest)
    : validateManifest(JSON.parse(readFileSync(join(modelsDir, 'manifest.json'), 'utf8')));

  // Dropped at the door rather than at each consumer, so nothing downstream —
  // the part index, the declared requests, the runtime manifest — can publish a
  // dev-only model by forgetting to filter.
  const manifest: Manifest = (config.includeDevOnly ?? true)
    ? authored
    : { ...authored, models: authored.models.filter((m) => !m.devOnly) };

  const store: Store = createStore(cacheDir);
  const sources = createSourceCache(root);
  const inflight = new Map<string, Promise<EnsureResult>>();
  const limit = semaphore(config.concurrency ?? 4);

  let enginePromise: Promise<RenderEngine> | null = null;
  function engine(): Promise<RenderEngine> {
    // Deferred: a fully-warm cache should never need an engine at all, so a
    // machine without openscad can still serve every pre-built artifact.
    enginePromise ??= selectEngine(config.engine ?? 'auto');
    return enginePromise;
  }

  const partIndex = new Map<string, ManifestPart>();
  for (const model of manifest.models) {
    for (const part of allParts(model)) partIndex.set(`${model.slug}/${targetOf(part)}`, part);
  }

  function shapeFor(slug: string, target: string): SourceShape {
    if (!manifest.models.some((m) => m.slug === slug)) throw new UnknownModelError(slug);
    return sources.get({ modelsDir, slug, target, root });
  }

  async function keyFor(req: RenderRequest): Promise<string> {
    const shape = shapeFor(req.slug, req.target);
    return artifactKey({ ...req, sourceDigest: shape.digest, schema: shape.schema });
  }

  async function build(key: string, req: RenderRequest, shape: SourceShape): Promise<EnsureResult> {
    const params = canonicalizeParams(req.params, shape.schema);
    const part = partIndex.get(`${req.slug}/${req.target}`);
    const eng = await engine();
    const startedAt = Date.now();

    let bytes: Uint8Array;
    try {
      bytes = await limit(() =>
        eng.render(assemble(shape, params), req.format, {
          sourceDir: join(modelsDir, req.slug),
          asAssembly: part?.assembly ?? false,
          timeoutMs,
        }));
    } catch (err) {
      const e = err as RenderFailedError;
      store.writeError(key, {
        key,
        message: e.message,
        logs: e.logs ?? [],
        builtAt: new Date().toISOString(),
      });
      throw err;
    }

    const sidecar: Sidecar = {
      key,
      slug: req.slug,
      target: req.target,
      format: req.format,
      params,
      sourceDigest: shape.digest,
      externalIncludes: shape.externalIncludes,
      engine: eng.id,
      engineVersion: await eng.version(),
      args: eng.args,
      byteLength: bytes.byteLength,
      renderMs: Date.now() - startedAt,
      builtAt: new Date().toISOString(),
    };

    const path = store.write(key, req.format, bytes, sidecar);
    store.clearError(key);
    return { key, format: req.format, bytes: Buffer.from(bytes), path, status: 'built', sidecar };
  }

  /**
   * Return the artifact for a request, rendering it only if the store doesn't
   * already have it. Concurrent callers for the same key share one render.
   */
  async function ensure(req: RenderRequest): Promise<EnsureResult> {
    const shape = shapeFor(req.slug, req.target);
    const key = await artifactKey({ ...req, sourceDigest: shape.digest, schema: shape.schema });

    if (store.has(key, req.format)) {
      const bytes = store.read(key, req.format);
      const sidecar = store.sidecar(key);
      return {
        key,
        format: req.format,
        bytes,
        path: store.pathFor(key, req.format),
        status: 'hit',
        // A sidecar can go missing if the store was hand-edited; the bytes are
        // still valid, so synthesize enough to describe them rather than fail.
        sidecar: sidecar ?? {
          key, slug: req.slug, target: req.target, format: req.format,
          params: canonicalizeParams(req.params, shape.schema),
          sourceDigest: shape.digest, externalIncludes: shape.externalIncludes,
          engine: 'unknown', engineVersion: 'unknown', args: [],
          byteLength: bytes.byteLength, renderMs: 0, builtAt: new Date(0).toISOString(),
        },
      };
    }

    const cachedError = store.readError(key, negativeTtlMs);
    if (cachedError) throw new CachedRenderError(cachedError.message, cachedError.logs);

    const existing = inflight.get(key);
    if (existing) return existing;

    const promise = build(key, req, shape).finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  }

  /**
   * Every artifact the manifest declares: each entry at its build's params (the
   * lib defaults, for a model without builds), plus each declared variant.
   */
  function declaredRequests(): RenderRequest[] {
    const out: RenderRequest[] = [];
    for (const model of manifest.models) {
      for (const view of buildViews(model)) {
        const base = Object.keys(view.params).length > 0 ? { params: view.params } : {};
        for (const part of [...view.previews, ...view.parts]) {
          const target = targetOf(part);
          out.push({ slug: model.slug, target, format: part.format, ...base });
          for (const variant of part.variants ?? []) {
            out.push({ slug: model.slug, target, format: part.format, params: { ...view.params, ...variant.params } });
          }
        }
      }
    }
    return out;
  }

  return {
    manifest,
    store,
    artifactBase,
    shapeFor,
    keyFor,
    ensure,
    declaredRequests,

    /** Drop memoized sources for a slug. Called by the dev watcher; correctness never depends on it. */
    invalidate(slug: string): void {
      sources.invalidate(slug);
    },

    /**
     * Serve a request that arrived addressed by key.
     *
     * The key is one-way, so the caller supplies the request it hashed and it's
     * verified here — otherwise anyone could have arbitrary parameters rendered
     * and stored under a key of their choosing.
     */
    async ensureByKey(key: string, format: ArtifactFormat, req: RenderRequest): Promise<EnsureResult> {
      if (store.has(key, format)) {
        const bytes = store.read(key, format);
        return {
          key, format, bytes, path: store.pathFor(key, format), status: 'hit',
          sidecar: store.sidecar(key) ?? {
            key, slug: req.slug, target: req.target, format, params: {},
            sourceDigest: '', externalIncludes: [], engine: 'unknown', engineVersion: 'unknown',
            args: [], byteLength: bytes.byteLength, renderMs: 0, builtAt: new Date(0).toISOString(),
          },
        };
      }
      if (format !== req.format) throw new FormatMismatchError(format, req.format);
      const result = await ensure(req);
      // Typed so a caller — and the middleware — can tell a client mistake from
      // a render that genuinely blew up.
      if (result.key !== key) throw new KeyMismatchError(key, result.key);
      return result;
    },

    /** Build everything the manifest declares. Anything already stored is a no-op. */
    prerender(): Promise<PrerenderStats> {
      return this.ensureAll(declaredRequests());
    },

    /** Build a specific set of requests, reporting per-request failures rather than throwing. */
    async ensureAll(requests: RenderRequest[]): Promise<PrerenderStats> {
      const started = Date.now();
      const stats: PrerenderStats = { total: requests.length, hit: 0, built: 0, failed: [], ms: 0 };

      await Promise.all(requests.map(async (req) => {
        try {
          const result = await ensure(req);
          if (result.status === 'hit') stats.hit++;
          else stats.built++;
        } catch (err) {
          stats.failed.push({ slug: req.slug, target: req.target, message: (err as Error).message });
        }
      }));

      stats.ms = Date.now() - started;
      return stats;
    },

    /** Keys the manifest currently declares — the set eviction must not touch. */
    async declaredKeys(): Promise<Set<string>> {
      return new Set(await Promise.all(declaredRequests().map(keyFor)));
    },

    /**
     * The manifest the browser gets: the authored one plus the digests and keys
     * a client needs to address the cache without re-deriving any SCAD source.
     */
    async runtimeManifest(): Promise<RuntimeManifest> {
      const models = await Promise.all(manifest.models.map(async (model) => {
        async function enrich(part: ManifestPart, buildParams: Record<string, ScadValue> = {}): Promise<RuntimePart> {
          const target = targetOf(part);
          const shape = shapeFor(model.slug, target);
          const base = { sourceDigest: shape.digest, schema: shape.schema };

          const defaultKey = await artifactKey({
            slug: model.slug, target, format: part.format, ...base,
          });

          const variants = part.variants
            ? await Promise.all(part.variants.map(async (v) => ({
                ...v,
                key: await artifactKey({
                  slug: model.slug, target, format: part.format, params: { ...buildParams, ...v.params }, ...base,
                }),
              })))
            : undefined;

          // Drop the authored `variants` from the spread — the enriched ones
          // below carry a key and would otherwise be widened back out.
          const { variants: _authored, ...rest } = part;
          return {
            ...rest,
            sourceDigest: shape.digest,
            paramSchema: shape.schema,
            defaultKey,
            ...(variants ? { variants } : {}),
          };
        }

        const { previews, parts, builds, ...rest } = model;
        return {
          ...rest,
          ...(previews ? { previews: await Promise.all(previews.map((p) => enrich(p))) } : {}),
          ...(parts ? { parts: await Promise.all(parts.map((p) => enrich(p))) } : {}),
          ...(builds ? {
            builds: await Promise.all(builds.map(async ({ previews: bp, parts: bq, ...b }): Promise<RuntimeBuild> => ({
              ...b,
              ...(bp ? { previews: await Promise.all(bp.map((p) => enrich(p, b.params))) } : {}),
              ...(bq ? { parts: await Promise.all(bq.map((p) => enrich(p, b.params))) } : {}),
            }))),
          } : {}),
        };
      }));

      return { keySchema: KEY_SCHEMA, artifactBase, models };
    },

    urlFor(key: string, format: ArtifactFormat): string {
      return artifactUrl(key, format, artifactBase);
    },
  };
}

export type Forge = ReturnType<typeof createForge>;
export type { ScadValue };
