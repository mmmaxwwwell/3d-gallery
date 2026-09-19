import { describe, it, expect } from 'vitest';
import { canonicalizeParams, canonicalParamsJson, scadValuesEqual } from '../src/canonical.ts';
import type { ScadParam } from '../src/types.ts';

const SCHEMA: ScadParam[] = [
  { name: 'width', type: 'number', default: 40, help: '' },
  { name: 'shape', type: 'enum', default: 'circle', help: '', options: ['circle', 'hexagon'] },
  { name: 'engrave', type: 'boolean', default: true, help: '' },
  { name: 'offsets', type: 'vector', default: [1, 2, 3], help: '' },
  { name: 'split', type: 'enum', default: 2, help: '', options: ['2', '3'] },
];

describe('canonicalizeParams', () => {
  it('drops values equal to the lib default', () => {
    expect(canonicalizeParams({ width: 40, shape: 'circle' }, SCHEMA)).toEqual({});
  });

  it('collapses a full untouched value map to the same thing as no params', () => {
    const full = { width: 40, shape: 'circle', engrave: true, offsets: [1, 2, 3], split: 2 };
    expect(canonicalParamsJson(full, SCHEMA)).toBe(canonicalParamsJson(undefined, SCHEMA));
    expect(canonicalParamsJson(full, SCHEMA)).toBe('{}');
  });

  it('keeps values that differ from the default', () => {
    expect(canonicalizeParams({ width: 50, shape: 'circle' }, SCHEMA)).toEqual({ width: 50 });
  });

  it('drops names the schema does not declare', () => {
    expect(canonicalizeParams({ width: 50, bogus: 9 }, SCHEMA)).toEqual({ width: 50 });
  });

  it('drops names that are not legal SCAD identifiers', () => {
    expect(canonicalizeParams({ 'width; cube(99)': 1 }, SCHEMA)).toEqual({});
  });

  it('coerces URL strings before comparing, so "40" matches the default 40', () => {
    expect(canonicalizeParams({ width: '40' }, SCHEMA)).toEqual({});
    expect(canonicalizeParams({ width: '50' }, SCHEMA)).toEqual({ width: 50 });
  });

  it('coerces a numeric enum out of its string form', () => {
    expect(canonicalizeParams({ split: '3' }, SCHEMA)).toEqual({ split: 3 });
    expect(canonicalizeParams({ split: '2' }, SCHEMA)).toEqual({});
  });

  it('normalizes -0 to 0 so it matches a 0 default', () => {
    const schema: ScadParam[] = [{ name: 'z', type: 'number', default: 0, help: '' }];
    expect(canonicalizeParams({ z: -0 }, schema)).toEqual({});
  });

  it('compares vectors element-wise', () => {
    expect(canonicalizeParams({ offsets: [1, 2, 3] }, SCHEMA)).toEqual({});
    expect(canonicalizeParams({ offsets: [1, 2, 4] }, SCHEMA)).toEqual({ offsets: [1, 2, 4] });
  });

  it('emits keys in sorted order regardless of input order', () => {
    const a = canonicalParamsJson({ width: 50, engrave: false }, SCHEMA);
    const b = canonicalParamsJson({ engrave: false, width: 50 }, SCHEMA);
    expect(a).toBe(b);
    expect(a).toBe('{"engrave":false,"width":50}');
  });
});

describe('scadValuesEqual', () => {
  it('compares vectors by element and scalars by identity', () => {
    expect(scadValuesEqual([1, 2], [1, 2])).toBe(true);
    expect(scadValuesEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(scadValuesEqual('a', 'a')).toBe(true);
    expect(scadValuesEqual(1, true as never)).toBe(false);
  });
});
