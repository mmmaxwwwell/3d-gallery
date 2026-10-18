import type { ManifestPart } from './manifest.ts';

export type SupportChoice = 'none' | 'normal' | 'tree';

export const SUPPORT_CHOICES: readonly SupportChoice[] = ['none', 'normal', 'tree'];

/**
 * How a model is meant to be printed. Every model has one: `printProfile` in
 * the manifest overrides fields of `DEFAULT_PRINT_PROFILE`, and the CI
 * estimator, the gallery and the print planner all slice with the result.
 */
export interface RecommendedProfile {
  walls: number;
  /** Sparse infill, percent. */
  infillDensity: number;
  /** An OrcaSlicer `sparse_infill_pattern` value. */
  infillPattern: string;
  supports: SupportChoice;
  /** Supports may only start on the bed, never on the part (Orca "On build plate only"). */
  supportsOnBuildPlateOnly: boolean;
  brim: boolean;
  /**
   * What a piece prints in when no `filament` entry names it. Filament entries
   * with `parts` still decide the material of the pieces they name.
   */
  material: string;
}

export type PrintProfileHint = Partial<RecommendedProfile>;

export const DEFAULT_PRINT_PROFILE: RecommendedProfile = {
  walls: 4,
  infillDensity: 15,
  infillPattern: 'gyroid',
  supports: 'none',
  supportsOnBuildPlateOnly: false,
  brim: false,
  material: 'PETG',
};

interface ProfiledModel {
  printProfile?: PrintProfileHint;
  filament?: Array<{ material: string; color?: string; parts?: string[] }>;
}

/**
 * The model's profile with defaults filled in. Without an explicit
 * `printProfile.material`, a filament entry that names no parts is what the
 * rest of the model prints in.
 */
export function recommendedProfile(model: ProfiledModel): RecommendedProfile {
  const catchAll = model.filament?.find((f) => !f.parts)?.material;
  return {
    ...DEFAULT_PRINT_PROFILE,
    ...(catchAll ? { material: catchAll } : {}),
    ...model.printProfile,
  };
}

/** The material one printed file is in. */
export function materialFor(model: ProfiledModel, file: string): string {
  return model.filament?.find((f) => f.parts?.includes(file))?.material ?? recommendedProfile(model).material;
}

/** "TPU 64D" → "TPU": the family flow rates and densities are keyed by. */
export function materialFamily(material: string): string {
  return material.trim().split(/\s+/)[0].toUpperCase();
}

/**
 * A print plate's material: its first piece's. A plate that lists no pieces
 * is the file itself. `plateFilaments` has every filament a plate uses.
 */
export function plateMaterial(model: ProfiledModel, plate: ManifestPart): string {
  const files = plate.components?.map((c) => c.part) ?? [];
  return files.length > 0 ? materialFor(model, files[0]) : materialFor(model, plate.file);
}

/** One filament a plate prints with, and the colours of its 3MF that it prints. */
export interface PlateFilament {
  material: string;
  /** The `filament` entry's colour, when it names one ("black"; never "any"). */
  color?: string;
  /** Lowercase `#rrggbb` of every legend colour (and shade) this filament prints. */
  hexes: string[];
}

/**
 * The filaments a print plate needs, in the order its legend first uses them:
 * what an AMS printer loads, one slot each. A legend colour belongs to the
 * `filament` entry naming one of its parts; legend rows that name no part pair
 * with part-less filament entries by position when there are as many of each
 * (two-colour QR models list body then modules in both); anything else is the
 * model's catch-all filament. Colours that come to the same filament share it,
 * so a plate drawn in four shades of one PETG needs one slot.
 */
export function plateFilaments(model: ProfiledModel, plate: ManifestPart): PlateFilament[] {
  const entries = model.filament ?? [];
  const partless = entries.filter((f) => !f.parts);
  const legend = plate.legend ?? [];
  const legendPartless = legend.filter((l) => !l.part && !l.parts?.length);
  const pairByPosition = partless.length > 1 && partless.length === legendPartless.length;
  const fallback = { material: plateMaterial(model, plate), color: partless[0]?.color };

  const out: Array<PlateFilament & { key: unknown }> = [];
  for (const row of legend) {
    const files = [...(row.part ? [row.part] : []), ...(row.parts ?? [])];
    const named = entries.find((f) => f.parts?.some((p) => files.includes(p)));
    const entry = named
      ?? (pairByPosition && files.length === 0 ? partless[legendPartless.indexOf(row)] : undefined);
    const material = entry?.material ?? (files.length > 0 ? materialFor(model, files[0]) : fallback.material);
    const color = entry ? entry.color : fallback.color;
    const key = entry ?? materialFamily(material);
    const hexes = [row.color, ...(row.shades ?? [])].map((h) => h.toLowerCase());
    const slot = out.find((f) => f.key === key);
    if (slot) slot.hexes.push(...hexes.filter((h) => !slot.hexes.includes(h)));
    else out.push({ key, material, ...(color && color !== 'any' ? { color } : {}), hexes });
  }
  if (out.length === 0) {
    return [{ material: fallback.material, ...(fallback.color && fallback.color !== 'any' ? { color: fallback.color } : {}), hexes: [] }];
  }
  return out.map(({ key: _, ...f }) => f);
}

export function describeProfile(p: RecommendedProfile): string {
  const supports = p.supports === 'none' ? 'no supports'
    : `${p.supports} supports${p.supportsOnBuildPlateOnly ? ' (build plate only)' : ''}`;
  return `${p.walls} walls, ${p.infillDensity}% ${p.infillPattern}, ${supports}, ${p.brim ? 'brim' : 'no brim'}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validation for a model's `printProfile`, and for each print plate's `plate` flag. */
export function checkPrintProfile(model: Record<string, unknown>, label: string, issues: string[]): void {
  const hint = model.printProfile;
  if (hint !== undefined) {
    const where = `${label}.printProfile`;
    if (!isObject(hint)) {
      issues.push(`${where}: expected an object`);
    } else {
      if (hint.walls !== undefined && (!Number.isInteger(hint.walls) || (hint.walls as number) < 1)) {
        issues.push(`${where}: "walls" must be a positive integer`);
      }
      if (hint.infillDensity !== undefined
        && (typeof hint.infillDensity !== 'number' || hint.infillDensity < 0 || hint.infillDensity > 100)) {
        issues.push(`${where}: "infillDensity" must be a number from 0 to 100`);
      }
      for (const field of ['infillPattern', 'material'] as const) {
        if (hint[field] !== undefined && (typeof hint[field] !== 'string' || (hint[field] as string).length === 0)) {
          issues.push(`${where}: "${field}" must be a non-empty string`);
        }
      }
      if (hint.supports !== undefined && !SUPPORT_CHOICES.includes(hint.supports as SupportChoice)) {
        issues.push(`${where}: "supports" must be one of ${SUPPORT_CHOICES.join(', ')}`);
      }
      for (const field of ['supportsOnBuildPlateOnly', 'brim'] as const) {
        if (hint[field] !== undefined && typeof hint[field] !== 'boolean') {
          issues.push(`${where}: "${field}" must be a boolean`);
        }
      }
      const known = new Set(Object.keys(DEFAULT_PRINT_PROFILE));
      for (const key of Object.keys(hint)) {
        if (!known.has(key)) issues.push(`${where}: unknown field "${key}"`);
      }
    }
  }

  // A plate may mix materials; the planner sends one that does only to a printer with an AMS.
  const owners = Array.isArray(model.builds) ? model.builds.filter(isObject) : [model];
  for (const owner of owners) {
    const previews = Array.isArray(owner.previews) ? owner.previews.filter(isObject) : [];
    for (const preview of previews) {
      if (preview.plate === undefined) continue;
      const where = `${label}.${String(preview.file)}`;
      if (typeof preview.plate !== 'boolean') issues.push(`${where}: "plate" must be a boolean`);
    }
  }
}
