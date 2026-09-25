import { ManifestError } from './errors.ts';
import { isValidParamName } from './inject.ts';
import { ARTIFACT_FORMATS, type ArtifactFormat, type ScadParam, type ScadValue } from './types.ts';

export interface SourceRef {
  url: string;
  vendor?: string;
}

export interface LegendEntry {
  color: string;
  /**
   * More colours the same entry is drawn in: alternate shades that tell
   * neighbouring copies of a part apart while reading as the same part.
   */
  shades?: string[];
  label: string;
  /** The part a click on this row opens. */
  part?: string;
  /** Every part drawn in this colour, when it is more than the one `part` opens. */
  parts?: string[];
  params?: Record<string, ScadValue>;
}

/** One physical piece of an assembly, named so a builder can tell copies apart. */
export interface ComponentInstance {
  id: string;
  /** Where the piece goes. May be left off anywhere but the model's main assembly, which supplies it by id. */
  where?: string;
}

export interface ComponentEntry {
  part: string;
  qty: number;
  /** One per piece, `qty` of them, when copies land in different places. */
  instances?: ComponentInstance[];
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
  /**
   * The printed files this filament is for. An entry without `parts` covers
   * every part no other entry names — so print-time estimates can time each
   * piece at its own material's flow.
   */
  parts?: string[];
}

/** How many of a hardware item go into every printed piece of `part`. */
export interface HardwareUse {
  part: string;
  each: number;
}

export interface HardwareEntry {
  qty: number;
  label: string;
  source?: SourceRef;
  /** Which printed parts the item goes into. Whatever `qty` is left over is tied to no part. */
  usedBy?: HardwareUse[];
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

/**
 * One configuration of a generator model — a lane count, a size — pinned by
 * `params`, with the entries and hardware that go with it. A different
 * configuration is a different set of pieces, not the same pieces with other
 * numbers, so a model with builds keeps all of its entries here and none at
 * the top level.
 */
export interface ModelBuild {
  /** Routed as `?build=<id>`, and the subdirectory its named outputs land in. */
  id: string;
  label: string;
  /** Opened when the route names no build. At most one build may set it. */
  default?: boolean;
  /** Lib parameters every entry in this build renders with. */
  params: Record<string, ScadValue>;
  previews?: ManifestPart[];
  parts?: ManifestPart[];
  hardware?: HardwareEntry[];
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
  /** In place of `previews`, `parts` and `hardware`, for a model built more than one way. */
  builds?: ModelBuild[];
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
  /**
   * Artifact key at the lib's default parameters. A build's entries render
   * with the build's params instead, so they are addressed with those.
   */
  defaultKey: string;
  variants?: (VariantEntry & { key: string })[];
}

export interface RuntimeBuild extends ModelBuild {
  previews?: RuntimePart[];
  parts?: RuntimePart[];
}

export interface RuntimeModel extends ManifestModel {
  previews?: RuntimePart[];
  parts?: RuntimePart[];
  builds?: RuntimeBuild[];
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

  checkComponents(part, where, issues);
  checkLegendShades(part, where, issues);

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
 * The bill of materials that stands for the whole model: its default preview's,
 * else the first preview that has one. Views without a BOM of their own — a
 * reference render, a single part — are accounted against this.
 */
export function mainAssembly<P extends ManifestPart>(model: { previews?: P[] }): P | undefined {
  const withBom = (model.previews ?? []).filter((p) => Array.isArray(p.components) && p.components.length > 0);
  return withBom.find((p) => p.default) ?? withBom[0];
}

// Raw-manifest readers for cross-entry checks: malformed entries are reported
// by checkComponents, so these skip them rather than throw.
function bomEntries(part: ManifestPart | undefined): ComponentEntry[] {
  return Array.isArray(part?.components) ? part.components.filter(isObject) as unknown as ComponentEntry[] : [];
}

function instancesOf(comp: ComponentEntry): ComponentInstance[] {
  return Array.isArray(comp.instances)
    ? comp.instances.filter((i) => isObject(i) && typeof i.id === 'string')
    : [];
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function checkLegendShades(part: Record<string, unknown>, where: string, issues: string[]): void {
  if (!Array.isArray(part.legend)) return;
  part.legend.forEach((entry, i) => {
    if (!isObject(entry) || entry.shades === undefined) return;
    const shades = entry.shades;
    if (!Array.isArray(shades) || shades.length === 0 || !shades.every((c) => typeof c === 'string' && HEX_COLOR_RE.test(c))) {
      issues.push(`${where}.legend[${i}]: "shades" must be a non-empty array of #rrggbb colours`);
    }
  });
}

function checkComponents(part: Record<string, unknown>, where: string, issues: string[]): void {
  if (part.components === undefined) return;
  if (!Array.isArray(part.components)) {
    issues.push(`${where}: "components" must be an array`);
    return;
  }
  part.components.forEach((comp, i) => {
    const cw = `${where}.components[${i}]`;
    if (!isObject(comp)) {
      issues.push(`${cw}: expected an object`);
      return;
    }
    if (typeof comp.part !== 'string' || comp.part.length === 0) {
      issues.push(`${cw}: "part" must be a non-empty string`);
    }
    if (!Number.isInteger(comp.qty) || (comp.qty as number) < 1) {
      issues.push(`${cw}: "qty" must be a positive integer`);
    }
    if (comp.instances === undefined) return;
    if (!Array.isArray(comp.instances)) {
      issues.push(`${cw}: "instances" must be an array`);
      return;
    }
    if (comp.instances.length !== comp.qty) {
      issues.push(`${cw}: ${comp.instances.length} instances for a qty of ${String(comp.qty)}`);
    }
    for (const inst of comp.instances) {
      if (!isObject(inst) || typeof inst.id !== 'string' || inst.id.length === 0) {
        issues.push(`${cw}: every instance needs a non-empty "id"`);
      } else if (inst.where !== undefined && typeof inst.where !== 'string') {
        issues.push(`${cw}: instance "${inst.id}" has a non-string "where"`);
      }
    }
  });
}

/**
 * Instance ids are the builder's names for pieces, so within a BOM they must be
 * unique, and a view's ids must be ones the main assembly defines — that is
 * where a view without its own `where` text borrows it from.
 */
function checkInstances(model: Record<string, unknown>, label: string, issues: string[]): void {
  const previews = (Array.isArray(model.previews) ? model.previews.filter(isObject) : []) as unknown as ManifestPart[];
  const main = mainAssembly(model as { previews?: ManifestPart[] });
  const known = new Set<string>();
  for (const comp of bomEntries(main)) {
    for (const inst of instancesOf(comp)) {
      if (known.has(inst.id)) issues.push(`${label}.${main!.file}: instance id "${inst.id}" is used twice`);
      known.add(inst.id);
      if (!inst.where) issues.push(`${label}.${main!.file}: instance "${inst.id}" needs a "where" — it is the main assembly`);
    }
  }
  for (const preview of previews) {
    if (preview === main) continue;
    const seen = new Set<string>();
    for (const comp of bomEntries(preview)) {
      for (const inst of instancesOf(comp)) {
        if (seen.has(inst.id)) issues.push(`${label}.${String(preview.file)}: instance id "${inst.id}" is used twice`);
        seen.add(inst.id);
        if (!inst.where && !known.has(inst.id)) {
          issues.push(`${label}.${String(preview.file)}: instance "${inst.id}" has no "where" and the main assembly does not define it`);
        }
      }
    }
  }
}

/** A filament's `parts` must name files the model (in any of its builds) actually prints. */
function checkFilament(model: Record<string, unknown>, label: string, issues: string[]): void {
  if (model.filament === undefined) return;
  if (!Array.isArray(model.filament)) {
    issues.push(`${label}: "filament" must be an array`);
    return;
  }
  const owners = Array.isArray(model.builds) ? model.builds.filter(isObject) : [model];
  const files = new Set(
    owners.flatMap((o) => [o.previews, o.parts].flatMap((list) => (Array.isArray(list) ? list : [])))
      .filter(isObject)
      .map((p) => p.file),
  );
  model.filament.forEach((entry, i) => {
    if (!isObject(entry) || entry.parts === undefined) return;
    const where = `${label}.filament[${i}]`;
    if (!Array.isArray(entry.parts) || entry.parts.length === 0) {
      issues.push(`${where}: "parts" must be a non-empty array of part files`);
      return;
    }
    for (const part of entry.parts) {
      if (typeof part !== 'string' || !files.has(part)) {
        issues.push(`${where}: "parts" names ${JSON.stringify(part)}, which is not one of the model's parts`);
      }
    }
  });
}

/**
 * `usedBy` accounts hardware against the main assembly's piece counts, so an
 * attribution that claims more than the item's `qty` is a miscount somewhere.
 */
function checkHardware(model: Record<string, unknown>, label: string, issues: string[]): void {
  if (model.hardware === undefined) return;
  if (!Array.isArray(model.hardware)) {
    issues.push(`${label}: "hardware" must be an array`);
    return;
  }
  const partFiles = new Set(
    (Array.isArray(model.parts) ? model.parts : []).filter(isObject).map((p) => p.file),
  );
  const bom = new Map<string, number>();
  for (const comp of bomEntries(mainAssembly(model as { previews?: ManifestPart[] }))) {
    if (typeof comp.qty !== 'number') continue;
    bom.set(comp.part, (bom.get(comp.part) ?? 0) + comp.qty);
  }
  model.hardware.forEach((item, i) => {
    const hw = `${label}.hardware[${i}]`;
    if (!isObject(item)) {
      issues.push(`${hw}: expected an object`);
      return;
    }
    if (!Number.isInteger(item.qty) || (item.qty as number) < 1) {
      issues.push(`${hw}: "qty" must be a positive integer`);
    }
    if (typeof item.label !== 'string' || item.label.length === 0) {
      issues.push(`${hw}: "label" must be a non-empty string`);
    }
    if (item.usedBy === undefined) return;
    if (!Array.isArray(item.usedBy)) {
      issues.push(`${hw}: "usedBy" must be an array`);
      return;
    }
    let attributed = 0;
    for (const use of item.usedBy) {
      if (!isObject(use) || typeof use.part !== 'string' || !partFiles.has(use.part)) {
        issues.push(`${hw}: "usedBy" names ${JSON.stringify(isObject(use) ? use.part : use)}, which is not one of the model's parts`);
        continue;
      }
      if (!Number.isInteger(use.each) || (use.each as number) < 1) {
        issues.push(`${hw}: "usedBy" ${use.part} needs a positive integer "each"`);
        continue;
      }
      const pieces = bom.get(use.part);
      if (pieces === undefined) {
        issues.push(`${hw}: "usedBy" ${use.part} is not in the main assembly's components, so it has no piece count`);
        continue;
      }
      attributed += (use.each as number) * pieces;
    }
    if (typeof item.qty === 'number' && attributed > item.qty) {
      issues.push(`${hw}: "usedBy" accounts for ${attributed} but "qty" is ${item.qty}`);
    }
  });
}

/** A model's, or one build's, previews, parts and hardware. */
function checkEntries(owner: Record<string, unknown>, label: string, issues: string[]): void {
  const seenFiles = new Map<string, string>();
  let defaults = 0;
  for (const group of ['previews', 'parts'] as const) {
    const list = owner[group];
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

  checkInstances(owner, label, issues);
  checkHardware(owner, label, issues);

  if (defaults > 1) {
    issues.push(`${label}: ${defaults} entries marked "default" — at most one is allowed`);
  }
}

/**
 * Each build is checked as a model of its own. Across builds, one file name
 * must mean one thing: the browser addresses an artifact by slug and file
 * base name, and only the params tell two builds' copies apart.
 */
function checkBuilds(model: Record<string, unknown>, label: string, issues: string[]): void {
  for (const field of ['previews', 'parts', 'hardware'] as const) {
    if (model[field] !== undefined) {
      issues.push(`${label}: "${field}" belongs in each build once a model has "builds"`);
    }
  }
  if (!Array.isArray(model.builds) || model.builds.length === 0) {
    issues.push(`${label}: "builds" must be a non-empty array`);
    return;
  }

  const seenIds = new Set<string>();
  const firstUse = new Map<string, { file: unknown; module: unknown; where: string }>();
  let defaults = 0;

  model.builds.forEach((build, i) => {
    const bw = `${label}.builds[${i}]`;
    if (!isObject(build)) {
      issues.push(`${bw}: expected an object`);
      return;
    }
    if (typeof build.id !== 'string' || !SLUG_RE.test(build.id)) {
      issues.push(`${bw}: "id" must match ${SLUG_RE} — got ${JSON.stringify(build.id)}`);
    } else if (seenIds.has(build.id)) {
      issues.push(`${bw}: duplicate build id "${build.id}"`);
    } else {
      seenIds.add(build.id);
    }
    if (typeof build.label !== 'string' || build.label.length === 0) {
      issues.push(`${bw}: "label" must be a non-empty string`);
    }
    if (build.default !== undefined && typeof build.default !== 'boolean') {
      issues.push(`${bw}: "default" must be a boolean`);
    }
    if (build.default === true) defaults++;
    if (!isObject(build.params)) {
      issues.push(`${bw}: "params" must be an object`);
    } else {
      for (const name of Object.keys(build.params)) {
        if (!isValidParamName(name)) issues.push(`${bw}: "${name}" is not a valid SCAD identifier`);
      }
    }

    const where = typeof build.id === 'string' ? `${label}.builds.${build.id}` : bw;
    checkEntries(build, where, issues);

    for (const group of ['previews', 'parts'] as const) {
      const list = build[group];
      if (!Array.isArray(list)) continue;
      for (const part of list) {
        if (!isObject(part) || typeof part.file !== 'string') continue;
        const base = part.file.replace(/\.\w+$/, '');
        const prior = firstUse.get(base);
        if (!prior) {
          firstUse.set(base, { file: part.file, module: part.module, where });
        } else if (prior.file !== part.file || prior.module !== part.module) {
          issues.push(`${where}: "${part.file}" differs in file or module from the same name in ${prior.where}`);
        }
      }
    }
  });

  if (defaults > 1) {
    issues.push(`${label}: ${defaults} builds marked "default" — at most one is allowed`);
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

    if (model.builds === undefined) checkEntries(model, label, issues);
    else checkBuilds(model, label, issues);
    checkFilament(model, label, issues);
  });

  if (defaultModels > 1) {
    issues.push(`manifest: ${defaultModels} models marked "default" — at most one is allowed`);
  }

  if (issues.length > 0) throw new ManifestError(issues);
  return raw as unknown as Manifest;
}

/**
 * A model as one build of it presents: what the sidebar lists, the BOM and
 * hardware it shows, and the params its entries render with. A model without
 * builds has exactly one view, with no build and no params.
 */
export interface BuildView<P extends ManifestPart = ManifestPart> {
  build?: ModelBuild;
  params: Record<string, ScadValue>;
  previews: P[];
  parts: P[];
  hardware: HardwareEntry[];
}

interface BuildableModel<P extends ManifestPart> {
  previews?: P[];
  parts?: P[];
  hardware?: HardwareEntry[];
  builds?: (ModelBuild & { previews?: P[]; parts?: P[] })[];
}

/** One view per build, in manifest order, or the model's own entries as a single view. */
export function buildViews<P extends ManifestPart>(model: BuildableModel<P>): BuildView<P>[] {
  if (!model.builds) {
    return [{ params: {}, previews: model.previews ?? [], parts: model.parts ?? [], hardware: model.hardware ?? [] }];
  }
  return model.builds.map((build) => ({
    build,
    params: build.params,
    previews: build.previews ?? [],
    parts: build.parts ?? [],
    hardware: build.hardware ?? [],
  }));
}

/** The build `id` names, else the default build, else the first. */
export function selectBuild<P extends ManifestPart>(model: BuildableModel<P>, id?: string | null): BuildView<P> {
  const views = buildViews(model);
  return views.find((v) => id && v.build?.id === id)
    ?? views.find((v) => v.build?.default)
    ?? views[0]!;
}

/** Every part and preview of a model, in the order the sidebar shows them — every build's, in turn. */
export function allParts(model: RuntimeModel): RuntimePart[];
export function allParts(model: ManifestModel): ManifestPart[];
export function allParts(model: ManifestModel): ManifestPart[] {
  return buildViews(model).flatMap((v) => [...v.previews, ...v.parts]);
}
