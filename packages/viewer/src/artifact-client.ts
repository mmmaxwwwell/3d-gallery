import {
  allParts,
  artifactKey,
  artifactUrl,
  encodeRenderRequest,
  type ArtifactFormat,
  type RuntimeManifest,
  type RuntimePart,
  type ScadValue,
} from '@3d-gallery/model-core';
import { createIdbCache, type ArtifactCache, type ArtifactSource } from './artifact-cache.ts';

export interface ArtifactRequest {
  slug: string;
  /** File base name of a manifest entry, e.g. "multicolor" for multicolor.3mf. */
  target: string;
  params?: Record<string, ScadValue>;
}

export interface ArtifactResult {
  key: string;
  format: ArtifactFormat;
  bytes: ArrayBuffer;
  source: ArtifactSource;
}

/** Renders locally when the server has nothing. Supplied by the consumer. */
export interface LocalRenderer {
  render(req: ArtifactRequest & { format: ArtifactFormat; part: RuntimePart }): Promise<ArrayBuffer>;
}

export class UnknownTargetError extends Error {
  readonly code = 'E_UNKNOWN_TARGET';
  constructor(slug: string, target: string) {
    super(`No "${target}" in the runtime manifest for "${slug}"`);
    this.name = 'UnknownTargetError';
  }
}

export class ArtifactUnavailableError extends Error {
  readonly code = 'E_ARTIFACT_UNAVAILABLE';
  constructor(key: string, detail: string) {
    super(`Artifact ${key.slice(0, 12)}… is not cached and could not be produced: ${detail}`);
    this.name = 'ArtifactUnavailableError';
  }
}

export class KeySchemaMismatchError extends Error {
  readonly code = 'E_KEY_SCHEMA';
  constructor(expected: string, got: string) {
    super(`This build computes ${expected} keys but the manifest was generated for ${got}. Reload to pick up the new bundle.`);
    this.name = 'KeySchemaMismatchError';
  }
}

export interface ArtifactClientOptions {
  manifest: RuntimeManifest;
  /** Defaults to the manifest's own `artifactBase`. */
  artifactBase?: string;
  /** Used when the server has no artifact. Without one, a miss is an error. */
  localRenderer?: LocalRenderer | null;
  cache?: ArtifactCache | null;
  fetchImpl?: typeof fetch;
  /**
   * Whether to re-ask with an attached render request after a 404. True is
   * right for a dev server; on a static host the retry just 404s again.
   */
  allowServerRender?: boolean;
  onLog?: (message: string) => void;
}

/**
 * Resolves an artifact to bytes: local cache, then the server, then a local
 * render.
 *
 * The key is computed here from the digest the manifest publishes — the browser
 * never assembles SCAD source to hash it, so there's no way for the two sides to
 * drift into addressing different bytes.
 */
export function createArtifactClient(options: ArtifactClientOptions) {
  const { manifest } = options;
  const base = options.artifactBase ?? manifest.artifactBase;
  const cache = options.cache === null ? null : (options.cache ?? createIdbCache());
  const doFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const allowServerRender = options.allowServerRender ?? true;
  const log = options.onLog ?? (() => {});

  // Builds of one model share a file only when it is the same source, so any
  // one copy of it answers for digest, schema and format.
  const parts = new Map<string, RuntimePart>();
  for (const model of manifest.models) {
    for (const part of allParts(model)) {
      parts.set(`${model.slug}/${part.file.replace(/\.\w+$/, '')}`, part);
    }
  }

  function partFor(req: ArtifactRequest): RuntimePart {
    const part = parts.get(`${req.slug}/${req.target}`);
    if (!part) throw new UnknownTargetError(req.slug, req.target);
    return part;
  }

  async function keyFor(req: ArtifactRequest): Promise<string> {
    const part = partFor(req);
    // No params means the lib defaults, and the manifest already carries that
    // key — skip the hash.
    if (!req.params || Object.keys(req.params).length === 0) return part.defaultKey;
    return artifactKey({
      slug: req.slug,
      target: req.target,
      format: part.format,
      sourceDigest: part.sourceDigest,
      schema: part.paramSchema,
      params: req.params,
    });
  }

  /**
   * `force` skips the cache and the server and renders locally, replacing the
   * cached copy: the way out when a cached artifact is suspect.
   */
  async function get(req: ArtifactRequest, init: { signal?: AbortSignal; force?: boolean } = {}): Promise<ArtifactResult> {
    const part = partFor(req);
    const format = part.format;
    const key = await keyFor(req);

    if (init.force) {
      if (!options.localRenderer) throw new ArtifactUnavailableError(key, 'a forced render needs a local renderer');
      log(`local render ${req.slug}/${req.target} (forced)`);
      const bytes = await options.localRenderer.render({ ...req, format, part });
      await cache?.put(key, bytes);
      return { key, format, bytes, source: 'local' };
    }

    const cached = await cache?.get(key);
    if (cached) {
      log(`cache ${req.slug}/${req.target}`);
      return { key, format, bytes: cached, source: 'cache' };
    }

    const url = artifactUrl(key, format, base);

    // Asked without a query string first: on a hit that's a clean, immutable,
    // CDN-friendly URL, which is the overwhelmingly common case.
    log(`fetch ${req.slug}/${req.target}`);
    let response = await doFetch(url, { signal: init.signal }).catch(() => null);

    if (!response?.ok && allowServerRender) {
      log(`server render ${req.slug}/${req.target}`);
      const payload = encodeRenderRequest({ slug: req.slug, target: req.target, format, params: req.params });
      response = await doFetch(`${url}?r=${payload}`, { signal: init.signal }).catch(() => null);
    }

    if (response?.ok) {
      const bytes = await response.arrayBuffer();
      await cache?.put(key, bytes);
      log(`network ${req.slug}/${req.target} (${response.headers.get('x-forge-status') ?? 'static'})`);
      return { key, format, bytes, source: 'network' };
    }

    if (options.localRenderer) {
      log(`local render ${req.slug}/${req.target}`);
      const bytes = await options.localRenderer.render({ ...req, format, part });
      await cache?.put(key, bytes);
      return { key, format, bytes, source: 'local' };
    }

    throw new ArtifactUnavailableError(key, `server returned ${response?.status ?? 'no response'} and no local renderer is configured`);
  }

  return {
    manifest,
    artifactBase: base,
    keyFor,
    get,

    async urlFor(req: ArtifactRequest): Promise<string> {
      return artifactUrl(await keyFor(req), partFor(req).format, base);
    },

    partFor,

    /**
     * Warn loudly when the bundle and the manifest disagree on the key schema.
     * Without this the symptom is every request silently 404ing forever.
     */
    assertKeySchema(expected: string): void {
      if (manifest.keySchema !== expected) throw new KeySchemaMismatchError(expected, manifest.keySchema);
    },
  };
}

export type ArtifactClient = ReturnType<typeof createArtifactClient>;
