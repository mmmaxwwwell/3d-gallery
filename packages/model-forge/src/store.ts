import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ArtifactFormat, ScadValue } from '@3d-gallery/model-core';

/**
 * Recorded alongside every artifact. Everything here was deliberately kept out
 * of the key so that a natively-built artifact still satisfies a request on a
 * WASM-only machine — but it's still needed to answer "what produced this?"
 * and to drive a deliberate re-verify.
 */
export interface Sidecar {
  key: string;
  slug: string;
  target: string;
  format: ArtifactFormat;
  params: Record<string, ScadValue>;
  sourceDigest: string;
  externalIncludes: string[];
  engine: string;
  engineVersion: string;
  args: string[];
  byteLength: number;
  renderMs: number;
  builtAt: string;
}

export interface CachedError {
  key: string;
  message: string;
  logs: string[];
  builtAt: string;
}

function shard(key: string): string {
  return key.slice(0, 2);
}

/**
 * Content-addressed artifact store.
 *
 * Bytes and their sidecar sit next to each other on disk — there's no index to
 * corrupt and no database to migrate, and the whole store can be rebuilt by
 * deleting it. Writes go through a temp file and a rename so a crashed render
 * can't leave a truncated artifact that later reads as a cache hit.
 */
export function createStore(dir: string) {
  const errorsDir = join(dir, 'errors');

  function dirFor(key: string): string {
    return join(dir, shard(key));
  }

  function pathFor(key: string, format: ArtifactFormat): string {
    return join(dirFor(key), `${key}.${format}`);
  }

  function sidecarPath(key: string): string {
    return join(dirFor(key), `${key}.json`);
  }

  function errorPath(key: string): string {
    return join(errorsDir, `${key}.json`);
  }

  function writeAtomic(path: string, data: Uint8Array | string): void {
    mkdirSync(join(path, '..'), { recursive: true });
    const tmp = `${path}.${process.pid}.${createHash('sha1').update(path).update(String(Math.random())).digest('hex').slice(0, 8)}.tmp`;
    writeFileSync(tmp, data);
    renameSync(tmp, path);
  }

  return {
    dir,

    pathFor,

    has(key: string, format: ArtifactFormat): boolean {
      return existsSync(pathFor(key, format));
    },

    read(key: string, format: ArtifactFormat): Buffer {
      return readFileSync(pathFor(key, format));
    },

    write(key: string, format: ArtifactFormat, bytes: Uint8Array, sidecar: Sidecar): string {
      const path = pathFor(key, format);
      writeAtomic(path, bytes);
      writeAtomic(sidecarPath(key), `${JSON.stringify(sidecar, null, 2)}\n`);
      return path;
    },

    sidecar(key: string): Sidecar | null {
      const path = sidecarPath(key);
      if (!existsSync(path)) return null;
      try {
        return JSON.parse(readFileSync(path, 'utf8')) as Sidecar;
      } catch {
        return null;
      }
    },

    /**
     * Remember a failed render. Without this, a model with a SCAD error re-runs
     * a full render on every page refresh, which turns a typo into a dev-server
     * stall.
     */
    writeError(key: string, error: CachedError): void {
      writeAtomic(errorPath(key), `${JSON.stringify(error, null, 2)}\n`);
    },

    readError(key: string, ttlMs: number): CachedError | null {
      const path = errorPath(key);
      if (!existsSync(path)) return null;
      try {
        const cached = JSON.parse(readFileSync(path, 'utf8')) as CachedError;
        if (Date.now() - Date.parse(cached.builtAt) > ttlMs) {
          rmSync(path, { force: true });
          return null;
        }
        return cached;
      } catch {
        return null;
      }
    },

    clearError(key: string): void {
      rmSync(errorPath(key), { force: true });
    },

    /** Every artifact currently stored, newest first. */
    list(): Sidecar[] {
      if (!existsSync(dir)) return [];
      const out: Sidecar[] = [];
      for (const bucket of readdirSync(dir)) {
        if (bucket === 'errors') continue;
        const bucketDir = join(dir, bucket);
        if (!statSync(bucketDir).isDirectory()) continue;
        for (const file of readdirSync(bucketDir)) {
          if (!file.endsWith('.json')) continue;
          try {
            out.push(JSON.parse(readFileSync(join(bucketDir, file), 'utf8')) as Sidecar);
          } catch {
            // A half-written sidecar is not worth failing a listing over.
          }
        }
      }
      return out.sort((a, b) => Date.parse(b.builtAt) - Date.parse(a.builtAt));
    },

    remove(key: string, format: ArtifactFormat): void {
      rmSync(pathFor(key, format), { force: true });
      rmSync(sidecarPath(key), { force: true });
    },

    /**
     * Trim the store to a byte budget, oldest first. `keep` is exempt — it's the
     * set the current manifest still declares, which should survive eviction
     * regardless of age.
     */
    evict(maxBytes: number, keep: ReadonlySet<string> = new Set()): { removed: number; freed: number } {
      const all = this.list();
      let total = all.reduce((n, s) => n + s.byteLength, 0);
      let removed = 0;
      let freed = 0;

      for (const sidecar of [...all].reverse()) {
        if (total <= maxBytes) break;
        if (keep.has(sidecar.key)) continue;
        this.remove(sidecar.key, sidecar.format);
        total -= sidecar.byteLength;
        freed += sidecar.byteLength;
        removed++;
      }

      return { removed, freed };
    },

    stats(): { count: number; bytes: number } {
      const all = this.list();
      return { count: all.length, bytes: all.reduce((n, s) => n + s.byteLength, 0) };
    },
  };
}

export type Store = ReturnType<typeof createStore>;
