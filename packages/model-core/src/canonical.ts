import { coerceToParamType } from './params.ts';
import { isValidParamName } from './inject.ts';
import type { ScadParam, ScadValue } from './types.ts';

/** Structural equality for SCAD values. Vectors compare element-wise. */
export function scadValuesEqual(a: ScadValue, b: ScadValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

/** `-0` and `0` are the same number to OpenSCAD but stringify differently. */
function normalizeNumber(n: number): number {
  return n === 0 ? 0 : n;
}

function normalizeValue(value: ScadValue): ScadValue {
  if (typeof value === 'number') return normalizeNumber(value);
  if (Array.isArray(value)) return value.map(normalizeNumber);
  return value;
}

/**
 * Reduce a raw value map to the minimal set that actually changes the render.
 *
 * This is what makes a customizer that holds every parameter address the same
 * artifact as the pre-built default:
 *
 *   1. names not in the schema are dropped — OpenSCAD would ignore them anyway,
 *   2. names that aren't legal SCAD identifiers are dropped — they'd never be injected,
 *   3. strings are coerced to the declared type (URL params arrive as strings),
 *   4. values equal to the lib default are dropped,
 *   5. remaining keys are sorted, and numbers normalized.
 *
 * Step 4 is the one that matters: `{}`, an untouched full value map, and the
 * pre-built default artifact all collapse to the same key.
 */
export function canonicalizeParams(
  values: Record<string, ScadValue> | undefined,
  schema: readonly ScadParam[],
): Record<string, ScadValue> {
  if (!values) return {};
  const byName = new Map(schema.map((p) => [p.name, p]));
  const out: Record<string, ScadValue> = {};

  for (const name of Object.keys(values).sort()) {
    if (!isValidParamName(name)) continue;
    const param = byName.get(name);
    if (!param) continue;

    const raw = values[name];
    const coerced = typeof raw === 'string'
      ? coerceToParamType(raw, param.type, param.default)
      : raw;
    const value = normalizeValue(coerced);

    if (scadValuesEqual(value, normalizeValue(param.default))) continue;
    out[name] = value;
  }

  return out;
}

/**
 * The exact string fed to the hash. Exported so the Node and browser sides can
 * be asserted against a shared vector file rather than trusted to agree.
 */
export function canonicalParamsJson(
  values: Record<string, ScadValue> | undefined,
  schema: readonly ScadParam[],
): string {
  return JSON.stringify(canonicalizeParams(values, schema));
}
