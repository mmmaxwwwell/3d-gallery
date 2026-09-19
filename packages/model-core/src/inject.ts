import type { ScadValue } from './types.ts';

/**
 * SCAD identifiers we're willing to emit. Also the security boundary for the
 * network path: a name that doesn't match is dropped rather than injected,
 * so no caller can smuggle SCAD syntax through a parameter name.
 */
const VALID_PARAM_NAME = /^[a-zA-Z_]\w*$/;

export function isValidParamName(name: string): boolean {
  return VALID_PARAM_NAME.test(name);
}

/**
 * Append `name = value;` assignments to a lib source.
 *
 * Ordering is load-bearing: callers inject into the *lib* and concatenate the
 * consumer source afterwards, so a preview's own trailing assignments (e.g.
 * `split = 3;` in previews/assembled-3x3.scad) stay authoritative. OpenSCAD's
 * `-D` flag assigns after everything at top level and would override them,
 * which is why parameters are injected textually instead.
 */
export function injectParameters(source: string, params: Record<string, ScadValue>): string {
  const entries = Object.entries(params).filter(([name]) => VALID_PARAM_NAME.test(name));
  if (entries.length === 0) return source;
  const lines = entries.map(([name, value]) => `${name} = ${formatScadValue(value)};`);
  return source + '\n\n' + lines.join('\n') + '\n';
}

export function formatScadValue(value: ScadValue): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  return String(value);
}
