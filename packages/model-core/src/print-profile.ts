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
  filament?: Array<{ material: string; parts?: string[] }>;
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
 * A print plate's material: its pieces', which validation holds to one
 * family. A plate that lists no pieces is the file itself.
 */
export function plateMaterial(model: ProfiledModel, plate: ManifestPart): string {
  const files = plate.components?.map((c) => c.part) ?? [];
  return files.length > 0 ? materialFor(model, files[0]) : materialFor(model, plate.file);
}

export function describeProfile(p: RecommendedProfile): string {
  const supports = p.supports === 'none' ? 'no supports'
    : `${p.supports} supports${p.supportsOnBuildPlateOnly ? ' (build plate only)' : ''}`;
  return `${p.walls} walls, ${p.infillDensity}% ${p.infillPattern}, ${supports}, ${p.brim ? 'brim' : 'no brim'}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validation for a model's `printProfile`, and for plates that would mix materials. */
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

  // A single-extruder printer can't swap filament mid-plate, so one plate is one material.
  const owners = Array.isArray(model.builds) ? model.builds.filter(isObject) : [model];
  const profiled = model as ProfiledModel;
  for (const owner of owners) {
    const previews = Array.isArray(owner.previews) ? owner.previews.filter(isObject) : [];
    for (const preview of previews) {
      if (preview.plate === undefined) continue;
      const where = `${label}.${String(preview.file)}`;
      if (typeof preview.plate !== 'boolean') {
        issues.push(`${where}: "plate" must be a boolean`);
        continue;
      }
      const files = (Array.isArray(preview.components) ? preview.components : [])
        .filter(isObject).map((c) => c.part).filter((p): p is string => typeof p === 'string');
      const families = [...new Set(files.map((f) => materialFamily(materialFor(profiled, f))))];
      if (families.length > 1) {
        issues.push(`${where}: a print plate mixes ${families.join(' and ')} — one plate prints in one material`);
      }
    }
  }
}
