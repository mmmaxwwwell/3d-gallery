import type { IncomingMessage, ServerResponse } from 'node:http';
import { decodeRenderRequest, type ArtifactFormat, type RenderRequest } from '@3d-gallery/model-core';
import { CachedRenderError, type Forge } from './forge.ts';

const CONTENT_TYPE: Record<ArtifactFormat, string> = {
  stl: 'model/stl',
  '3mf': 'model/3mf',
};

/** Content-addressed, so a stored artifact is valid forever. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

export interface MiddlewareOptions {
  /** URL prefix to serve under. Defaults to the forge's `artifactBase`. */
  base?: string;
  onLog?: (message: string) => void;
}

type Next = (err?: unknown) => void;

function send(res: ServerResponse, status: number, body: string, contentType = 'text/plain'): void {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

/**
 * Serves `/{base}/{key}.{ext}` out of the artifact store, rendering on a miss.
 *
 * This is the deferred-generation path: nothing is built until something asks
 * for it. Because the key is derived from the source, an edited `.scad` simply
 * produces a key that isn't in the store yet — no invalidation step exists, and
 * none is needed.
 */
export function createArtifactMiddleware(forge: Forge, options: MiddlewareOptions = {}) {
  const base = (options.base ?? forge.artifactBase).replace(/\/*$/, '/');
  const log = options.onLog ?? (() => {});

  return async function artifactMiddleware(req: IncomingMessage, res: ServerResponse, next: Next): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(base)) return next();

    const name = url.pathname.slice(base.length);
    const match = name.match(/^([0-9a-f]{64})\.(stl|3mf)$/);
    if (!match) return next();

    const [, key, format] = match as [string, string, ArtifactFormat];
    const encoded = url.searchParams.get('r');

    try {
      // Serve a stored artifact without needing to know what produced it.
      if (forge.store.has(key, format)) {
        const bytes = forge.store.read(key, format);
        res.statusCode = 200;
        res.setHeader('Content-Type', CONTENT_TYPE[format]);
        res.setHeader('Content-Length', String(bytes.byteLength));
        res.setHeader('Cache-Control', IMMUTABLE);
        res.setHeader('X-Forge-Status', 'hit');
        res.end(bytes);
        return;
      }

      if (!encoded) {
        send(res, 404, `No artifact ${key}.${format} in the store, and no render request was attached.`);
        return;
      }

      // Decoded separately so a malformed payload reports as the client error
      // it is, rather than as a render failure.
      let request: RenderRequest;
      try {
        request = decodeRenderRequest(encoded);
      } catch (err) {
        send(res, 400, `Malformed render request: ${(err as Error).message}`);
        return;
      }

      const started = Date.now();
      const result = await forge.ensureByKey(key, format, request);
      log(`${result.status} ${result.sidecar.slug}/${result.sidecar.target}.${format} in ${Date.now() - started}ms`);

      res.statusCode = 200;
      res.setHeader('Content-Type', CONTENT_TYPE[format]);
      res.setHeader('Content-Length', String(result.bytes.byteLength));
      res.setHeader('Cache-Control', IMMUTABLE);
      res.setHeader('X-Forge-Status', result.status);
      res.end(result.bytes);
    } catch (err) {
      const e = err as Error & { code?: string; logs?: string[] };
      // A mismatched key or a malformed payload is the caller's fault; a render
      // that blew up is ours. Distinguish them so a dev sees which to fix.
      const isClientFault = e.code === 'E_KEY_MISMATCH' || e.code === 'E_FORMAT_MISMATCH';
      const status = isClientFault ? 400 : 500;
      const detail = e instanceof CachedRenderError || e.logs?.length ? `\n\n${(e.logs ?? []).join('\n')}` : '';
      log(`error ${key}.${format}: ${e.message}`);
      send(res, status, `${e.message}${detail}`);
    }
  };
}

export interface ManifestMiddlewareOptions {
  /**
   * Base the *client* should fetch artifacts from, when it differs from where
   * the middleware is mounted — e.g. behind a site base prefix that the dev
   * server strips before middlewares see the URL.
   */
  artifactBase?: string;
}

/** Serves the runtime manifest — the authored manifest plus digests and keys. */
export function createManifestMiddleware(forge: Forge, options: ManifestMiddlewareOptions = {}) {
  return async function manifestMiddleware(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const manifest = await forge.runtimeManifest();
      if (options.artifactBase) manifest.artifactBase = options.artifactBase;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      // Digests move whenever a .scad does, so this must never be cached.
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(manifest));
    } catch (err) {
      send(res, 500, (err as Error).message);
    }
  };
}
