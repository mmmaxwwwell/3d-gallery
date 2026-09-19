import type { Manifest } from '@3d-gallery/model-core';
import type { EngineChoice } from '@3d-gallery/model-forge';

export interface GalleryOptions {
  /** Directory containing `models/`. Defaults to the Astro project root. */
  root?: string;
  /** Defaults to `<root>/models`. */
  modelsDir?: string;
  /** A manifest object, or a path to one. Defaults to `<modelsDir>/manifest.json`. */
  manifest?: Manifest | string;
  /** Defaults to `<root>/.cache/forge`. Persist it in CI to skip rebuilds. */
  cacheDir?: string;
  /**
   * URL prefix for artifacts, relative to the site base. Content-addressed, so
   * whatever is served from here can be cached forever.
   */
  artifactBase?: string;
  /** Where the runtime manifest is served and emitted. */
  manifestPath?: string;
  engine?: EngineChoice;
  concurrency?: number;
  timeoutMs?: number;
  /**
   * Which artifacts to bake into the static output.
   *
   * - `'referenced'` (default) — only what a `<ModelViewer>` on some page
   *   actually asked for, plus the declared variants of those same parts. A
   *   site that embeds three models shouldn't ship all forty-three.
   * - `'declared'` — everything in the manifest. Right for a dedicated gallery.
   * - `false` — nothing, leaving the site with no prebuilt models.
   */
  prerender?: 'referenced' | 'declared' | false;
}

export interface ResolvedGalleryOptions extends Required<Omit<GalleryOptions, 'manifest' | 'root' | 'modelsDir' | 'cacheDir'>> {
  root: string;
  modelsDir: string;
  cacheDir: string;
  manifest?: Manifest;
}

export function resolveOptions(options: GalleryOptions, projectRoot: string): ResolvedGalleryOptions {
  const root = options.root ?? projectRoot;
  return {
    root,
    modelsDir: options.modelsDir ?? `${root}/models`,
    cacheDir: options.cacheDir ?? `${root}/.cache/forge`,
    artifactBase: normalizeBase(options.artifactBase ?? '/a/'),
    manifestPath: options.manifestPath ?? '/models/manifest.json',
    engine: options.engine ?? 'auto',
    concurrency: options.concurrency ?? 4,
    timeoutMs: options.timeoutMs ?? 120_000,
    prerender: options.prerender ?? 'referenced',
    manifest: typeof options.manifest === 'object' ? options.manifest : undefined,
  };
}

/** Leading and trailing slash, so joins are unambiguous everywhere downstream. */
export function normalizeBase(base: string): string {
  const withLeading = base.startsWith('/') ? base : `/${base}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

/** Join the site base with a gallery-relative path, collapsing duplicate slashes. */
export function withSiteBase(siteBase: string, path: string): string {
  return `/${`${siteBase}/${path}`.split('/').filter(Boolean).join('/')}${path.endsWith('/') ? '/' : ''}`;
}
