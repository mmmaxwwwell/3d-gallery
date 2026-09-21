import { ManifestError } from './errors.ts';
import { isValidParamName } from './inject.ts';
import { ARTIFACT_FORMATS, type ArtifactFormat, type ScadParam, type ScadValue } from './types.ts';

export interface SourceRef {
  url: string;
  vendor?: string;
}

export interface LegendEntry {
  color: string;
  label: string;
}

export interface ComponentEntry {
  part: string;
  qty: number;
}

/**
 * A named parameter set worth baking at build time. This is how "cache the
 * default models" extends to the non-default configurations people actually use.
 */
export interface VariantEntry {
  label: string;
  params: Record<string, ScadValue>;
}

export interface ManifestPart {
  file: string;
  format: ArtifactFormat;
  label: string;
  default?: boolean;
  /** Lib module to render. Required for anything the customizer can re-render. */
  module?: string;
  assembly?: boolean;
  legend?: LegendEntry[];
  components?: ComponentEntry[];
  variants?: VariantEntry[];
}

export interface FilamentHint {
  material: string;
  color: string;
  note?: string;
}

export interface HardwareEntry {
  qty: number;
  label: string;
  source?: SourceRef;
}

/**
 * A product the model is designed around rather than built from — the collar it
 * clips to, the purifier it shelves, the bits it holds. Distinct from
 * `hardware`, which is fasteners and raw mechanical parts.
 */
export interface CompatibleProduct {
  label: string;
  /** Only rendered when greater than one; most companions are a single unit. */
  qty?: number;
  note?: string;
  source?: SourceRef;
}

export interface ManifestModel {
  slug: string;
  title: string;
  description: string;
  customizable?: boolean;
  /** Opened when the gallery loads without a route. At most one model may set it. */
  default?: boolean;
  /**
   * Work in progress: served by a dev server, never built or published. The
   * production build drops it from the manifest it emits, so nothing
   * downstream — artifacts, fingerprint baseline, e2e coverage — sees it.
   */
  devOnly?: boolean;
  filament?: FilamentHint[];
  previews?: ManifestPart[];
  parts?: ManifestPart[];
  hardware?: HardwareEntry[];
  worksWith?: CompatibleProduct[];
}

export interface Manifest {
  models: ManifestModel[];
}

// --- runtime manifest --------------------------------------------------------

/** A part/preview enriched with everything a browser needs to address the cache. */
export interface RuntimePart extends ManifestPart {
  /** sha256 of the include-inlined source. The browser hashes with this, never recomputes it. */
  sourceDigest: string;
  paramSchema: ScadParam[];
  /** Artifact key at default parameters. */
  defaultKey: string;
  variants?: (VariantEntry & { key: string })[];
}

export interface RuntimeModel extends ManifestModel {
  previews?: RuntimePart[];
  parts?: RuntimePart[];
}

/**
 * Generated, served to the browser, never hand-edited. `keySchema` lets a stale
 * client fail loudly instead of 404-looping against keys it can no longer compute.
 */
export interface RuntimeManifest {
  keySchema: string;
  artifactBase: string;
  models: RuntimeModel[];
}

// --- validation --------------------------------------------------------------

/** Slugs land in filesystem paths and URLs, so they're restricted, not just non-empty. */
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * `module` is overloaded in the authored manifest: on a single-color part it is
 * a SCAD module name that gets called directly, but on a multicolor preview it
 * names the `previews/<name>.scad` source to concatenate (e.g. "assembled-2x2",
 * which is not a legal SCAD identifier). Both are just "which source to
 * resolve", so hyphens are allowed and path separators are not.
 */
const TARGET_RE = /^[A-Za-z_][\w-]*$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function checkPart(
  part: unknown,
  where: string,
  issues: string[],
  seenFiles: Map<string, string>,
): void {
  if (!isObject(part)) {
    issues.push(`${where}: expected an object`);
    return;
  }

  const file = part.file;
  if (typeof file !== 'string' || file.length === 0) {
    issues.push(`${where}: "file" must be a non-empty string`);
  } else if (file.includes('/') || file.includes('\\') || file.includes('..')) {
    issues.push(`${where}: "file" must be a bare filename, got "${file}"`);
  }

  const format = part.format;
  if (typeof format !== 'string' || !ARTIFACT_FORMATS.includes(format as ArtifactFormat)) {
    issues.push(`${where}: "format" must be one of ${ARTIFACT_FORMATS.join(', ')}`);
  } else if (typeof file === 'string' && !file.endsWith(`.${format}`)) {
    issues.push(`${where}: "file" is "${file}" but "format" is "${format}"`);
  }

  if (typeof part.label !== 'string' || part.label.length === 0) {
    issues.push(`${where}: "label" must be a non-empty string`);
  }

  // Source discovery matches the file's base name against parts/ then previews/,
  // so two entries sharing a base name would resolve to the same .scad.
  if (typeof file === 'string') {
    const base = file.replace(/\.\w+$/, '');
    const prior = seenFiles.get(base);
    if (prior) issues.push(`${where}: base name "${base}" already used by ${prior}`);
    else seenFiles.set(base, where);
  }

  if (part.module !== undefined && (typeof part.module !== 'string' || !TARGET_RE.test(part.module))) {
    issues.push(`${where}: "module" must match ${TARGET_RE}`);
  }

  if (part.variants !== undefined) {
    if (!Array.isArray(part.variants)) {
      issues.push(`${where}: "variants" must be an array`);
    } else {
      part.variants.forEach((variant, i) => {
        const vw = `${where}.variants[${i}]`;
        if (!isObject(variant)) {
          issues.push(`${vw}: expected an object`);
          return;
        }
        if (typeof variant.label !== 'string' || variant.label.length === 0) {
          issues.push(`${vw}: "label" must be a non-empty string`);
        }
        if (!isObject(variant.params)) {
          issues.push(`${vw}: "params" must be an object`);
        } else {
          for (const name of Object.keys(variant.params)) {
            if (!isValidParamName(name)) issues.push(`${vw}: "${name}" is not a valid SCAD identifier`);
          }
        }
      });
    }
  }
}

/**
 * Validate an authored manifest, reporting every problem rather than the first.
 *
 * @throws {ManifestError} with `.issues` listing each failure.
 */
export function validateManifest(raw: unknown): Manifest {
  const issues: string[] = [];

  if (!isObject(raw)) throw new ManifestError(['manifest: expected an object']);
  if (!Array.isArray(raw.models)) throw new ManifestError(['manifest: "models" must be an array']);

  const seenSlugs = new Set<string>();
  let defaultModels = 0;

  raw.models.forEach((model, i) => {
    const where = `models[${i}]`;
    if (!isObject(model)) {
      issues.push(`${where}: expected an object`);
      return;
    }

    const slug = model.slug;
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
      issues.push(`${where}: "slug" must match ${SLUG_RE} — got ${JSON.stringify(slug)}`);
    } else if (seenSlugs.has(slug)) {
      issues.push(`${where}: duplicate slug "${slug}"`);
    } else {
      seenSlugs.add(slug);
    }

    const label = typeof slug === 'string' ? slug : where;
    for (const field of ['title', 'description'] as const) {
      if (typeof model[field] !== 'string' || (model[field] as string).length === 0) {
        issues.push(`${label}: "${field}" must be a non-empty string`);
      }
    }

    for (const flag of ['default', 'devOnly'] as const) {
      if (model[flag] !== undefined && typeof model[flag] !== 'boolean') {
        issues.push(`${label}: "${flag}" must be a boolean`);
      }
    }
    if (model.default === true) defaultModels++;

    const seenFiles = new Map<string, string>();
    let defaults = 0;
    for (const group of ['previews', 'parts'] as const) {
      const list = model[group];
      if (list === undefined) continue;
      if (!Array.isArray(list)) {
        issues.push(`${label}: "${group}" must be an array`);
        continue;
      }
      list.forEach((part, j) => {
        checkPart(part, `${label}.${group}[${j}]`, issues, seenFiles);
        if (isObject(part) && part.default === true) defaults++;
      });
    }

    if (defaults > 1) {
      issues.push(`${label}: ${defaults} entries marked "default" — at most one is allowed`);
    }
  });

  if (defaultModels > 1) {
    issues.push(`manifest: ${defaultModels} models marked "default" — at most one is allowed`);
  }

  if (issues.length > 0) throw new ManifestError(issues);
  return raw as unknown as Manifest;
}

/** Every part and preview of a model, in the order the sidebar shows them. */
export function allParts(model: ManifestModel): ManifestPart[];
export function allParts(model: RuntimeModel): RuntimePart[];
export function allParts(model: ManifestModel): ManifestPart[] {
  return [...(model.previews ?? []), ...(model.parts ?? [])];
}
