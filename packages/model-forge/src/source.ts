import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { injectParameters, isValidParamName, parseParams, type ScadParam, type ScadValue } from '@3d-gallery/model-core';

/** `include <path>` — the repo uses no `use <>`, and the trailing semicolon is optional. */
const INCLUDE_RE = /^[ \t]*include[ \t]*<([^>]+)>[ \t]*;?[ \t]*$/gm;

/**
 * A target's source, split at the point where user parameters get injected.
 *
 * `pre` is everything up to and including the model's lib; `post` is the
 * consumer's own statements. Parameters land between them, which is what keeps
 * a preview's local overrides (e.g. `split = 3;` in assembled-3x3.scad)
 * authoritative over whatever the user picked.
 *
 * With no parameters, `pre + post` is byte-identical to inlining the on-disk
 * file, so a default render matches what the CLI has always produced.
 */
export interface SourceShape {
  slug: string;
  target: string;
  pre: string;
  post: string;
  /** Local files that contributed, repo-relative and sorted. Drives watch invalidation. */
  files: string[];
  /** Library-path includes left in place for OPENSCADPATH to resolve, e.g. "BOSL2/std.scad". */
  externalIncludes: string[];
  /** sha256 over the parameter-free source. Published to clients as `sourceDigest`. */
  digest: string;
  schema: ScadParam[];
}

export class SourceNotFoundError extends Error {
  readonly code = 'E_SOURCE_NOT_FOUND';
  constructor(slug: string, target: string, tried: string[]) {
    super(`No SCAD source for ${slug}/${target}. Tried:\n  - ${tried.join('\n  - ')}`);
    this.name = 'SourceNotFoundError';
  }
}

export class IncludeCycleError extends Error {
  readonly code = 'E_INCLUDE_CYCLE';
  constructor(chain: string[]) {
    super(`include cycle: ${chain.join(' -> ')}`);
    this.name = 'IncludeCycleError';
  }
}

/** Whether `source` declares `module <name>(...)` at any nesting level. */
function declaresModule(source: string, name: string): boolean {
  return new RegExp(`(^|[^\\w])module\\s+${name}\\s*\\(`).test(source);
}

interface InlineResult {
  text: string;
  files: Set<string>;
  externals: Set<string>;
}

function inlineFile(file: string, chain: string[], acc: InlineResult): string {
  if (chain.includes(file)) throw new IncludeCycleError([...chain, file]);
  acc.files.add(file);

  const source = readFileSync(file, 'utf8');
  const here = dirname(file);

  return source.replace(INCLUDE_RE, (line, ref: string) => {
    const local = resolve(here, ref);
    // Library-path includes (BOSL2/…, qr.scad) don't resolve relative to the
    // including file. Leave them for OPENSCADPATH — they're pinned by the flake.
    if (!existsSync(local)) {
      acc.externals.add(ref);
      return line;
    }
    return inlineFile(local, [...chain, file], acc);
  });
}

export interface ResolveOptions {
  modelsDir: string;
  slug: string;
  target: string;
  /** Repo root, used to make `files` relative and stable across machines. */
  root: string;
}

/**
 * Locate and inline a target's source.
 *
 * A target is either a `parts/` or `previews/` file base name, or — when
 * neither exists — a lib module name, in which case the three-line consumer the
 * convention would have used is synthesized.
 */
export function resolveSourceShape(opts: ResolveOptions): SourceShape {
  const { modelsDir, slug, target, root } = opts;
  const modelDir = join(modelsDir, slug);
  const libPath = join(modelDir, 'lib', `${slug}-lib.scad`);

  const candidates = [join(modelDir, 'parts', `${target}.scad`), join(modelDir, 'previews', `${target}.scad`)];
  const consumer = candidates.find((p) => existsSync(p));

  const acc: InlineResult = { text: '', files: new Set(), externals: new Set() };

  let pre: string;
  let post: string;

  if (consumer) {
    const full = inlineFile(consumer, [], acc);
    // Split after the lib's inlined body so parameters override the lib but not
    // the consumer. The lib always ends with its own last line; locating it by
    // re-inlining the lib alone and finding that text is exact and cheap.
    const libAcc: InlineResult = { text: '', files: new Set(), externals: new Set() };
    const libText = existsSync(libPath) ? inlineFile(libPath, [], libAcc) : null;
    const at = libText ? full.indexOf(libText) : -1;
    if (at === -1) {
      // No lib, or the consumer doesn't include it. Parameters go last, which
      // is the only sound position when there's nothing to override.
      pre = full;
      post = '';
    } else {
      pre = full.slice(0, at + libText!.length);
      post = full.slice(at + libText!.length);
    }
  } else {
    // Falling back to a synthesized consumer only works when the target names a
    // SCAD module. A hyphenated target (legal for a preview file base name) has
    // no module to call, and emitting one anyway yields an opaque parser error.
    if (!existsSync(libPath) || !isValidParamName(target)) {
      throw new SourceNotFoundError(slug, target, [...candidates, libPath]);
    }
    pre = inlineFile(libPath, [], acc);
    // OpenSCAD only warns on an unknown module and renders nothing, so without
    // this check a typo — or an arbitrary `target` off the network — would
    // succeed and cache an empty mesh under a perfectly valid key.
    if (!declaresModule(pre, target)) {
      throw new SourceNotFoundError(slug, target, [...candidates, `module ${target}() in ${libPath}`]);
    }
    post = `\n$fn = 40;\n${target}();\n`;
  }

  const digest = createHash('sha256').update(pre).update('\0').update(post).digest('hex');

  return {
    slug,
    target,
    pre,
    post,
    files: [...acc.files].map((f) => relative(root, f)).sort(),
    externalIncludes: [...acc.externals].sort(),
    digest,
    schema: existsSync(libPath) ? parseParams(readFileSync(libPath, 'utf8')) : [],
  };
}

/** Renderable source for a given parameter set. With no params this is the on-disk source. */
export function assemble(shape: SourceShape, params: Record<string, ScadValue> = {}): string {
  return injectParameters(shape.pre, params) + shape.post;
}

/**
 * Caches shapes across requests, revalidating against every contributing file's
 * (mtime, size). A dev server resolves the same target on every reload, and
 * re-reading the include graph each time would dominate a cache hit.
 */
export function createSourceCache(root: string) {
  interface Entry {
    shape: SourceShape;
    stamps: Map<string, string>;
  }
  const entries = new Map<string, Entry>();

  function stamp(files: string[]): Map<string, string> {
    const out = new Map<string, string>();
    for (const f of files) {
      try {
        const s = statSync(join(root, f));
        out.set(f, `${s.mtimeMs}:${s.size}`);
      } catch {
        out.set(f, 'missing');
      }
    }
    return out;
  }

  function fresh(entry: Entry): boolean {
    const now = stamp(entry.shape.files);
    if (now.size !== entry.stamps.size) return false;
    for (const [f, s] of now) if (entry.stamps.get(f) !== s) return false;
    return true;
  }

  return {
    get(opts: ResolveOptions): SourceShape {
      const id = `${opts.slug}/${opts.target}`;
      const hit = entries.get(id);
      if (hit && fresh(hit)) return hit.shape;

      const shape = resolveSourceShape(opts);
      entries.set(id, { shape, stamps: stamp(shape.files) });
      return shape;
    },

    /** Drop a slug's memoized shapes. The watcher calls this; correctness doesn't depend on it. */
    invalidate(slug: string): void {
      for (const id of entries.keys()) {
        if (id.startsWith(`${slug}/`)) entries.delete(id);
      }
    },

    clear(): void {
      entries.clear();
    },
  };
}

export type SourceCache = ReturnType<typeof createSourceCache>;
