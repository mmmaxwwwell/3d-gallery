import { describe, it, expect } from 'vitest';
import { parseParams, parseValue, coerceToParamType } from '../src/params.ts';
import { formatScadValue } from '../src/inject.ts';

const LIB = `
// BEGIN_PARAMS

// Overall width of the tag
width = 40;

// Body shape
shape = "circle";  // [circle, hexagon, bean]

// Emboss the name
engrave = true;

// Corner offsets
offsets = [1, 2.5, -3];

// Message shown on the back. // multiline
message = "hello";

// END_PARAMS

module thing() { cube(width); }
`;

describe('parseParams', () => {
  it('extracts every param between the markers', () => {
    const params = parseParams(LIB);
    expect(params.map((p) => p.name)).toEqual(['width', 'shape', 'engrave', 'offsets', 'message']);
  });

  it('infers types from the literal', () => {
    const byName = new Map(parseParams(LIB).map((p) => [p.name, p]));
    expect(byName.get('width')!.type).toBe('number');
    expect(byName.get('engrave')!.type).toBe('boolean');
    expect(byName.get('offsets')!.type).toBe('vector');
    expect(byName.get('offsets')!.default).toEqual([1, 2.5, -3]);
  });

  it('promotes a param with a bracketed comment to an enum', () => {
    const shape = parseParams(LIB).find((p) => p.name === 'shape')!;
    expect(shape.type).toBe('enum');
    expect(shape.options).toEqual(['circle', 'hexagon', 'bean']);
  });

  it('promotes a // multiline string to text', () => {
    expect(parseParams(LIB).find((p) => p.name === 'message')!.type).toBe('text');
  });

  it('returns nothing when the markers are absent', () => {
    expect(parseParams('module x() { cube(1); }')).toEqual([]);
  });
});

describe('parseValue', () => {
  it('reads each SCAD literal form', () => {
    expect(parseValue('true')).toEqual({ value: true, type: 'boolean' });
    expect(parseValue('"hi"')).toEqual({ value: 'hi', type: 'string' });
    expect(parseValue('[1, 2]')).toEqual({ value: [1, 2], type: 'vector' });
    expect(parseValue('3.5')).toEqual({ value: 3.5, type: 'number' });
  });

  it('unescapes string literals, inverting formatScadValue', () => {
    const raw = formatScadValue('IF FOUND\nsay "hi" \\o/');
    expect(parseValue(raw)).toEqual({ value: 'IF FOUND\nsay "hi" \\o/', type: 'string' });
    expect(parseValue('"A\\nB"').value).toBe('A\nB');
  });
});

describe('coerceToParamType', () => {
  it('converts URL strings to the declared type', () => {
    expect(coerceToParamType('12', 'number', 0)).toBe(12);
    expect(coerceToParamType('false', 'boolean', true)).toBe(false);
    expect(coerceToParamType('[1,2,3]', 'vector', [])).toEqual([1, 2, 3]);
  });

  it('falls back when the string does not parse', () => {
    expect(coerceToParamType('abc', 'number', 7)).toBe(7);
    expect(coerceToParamType('maybe', 'boolean', true)).toBe(true);
  });

  it('follows the fallback type for enums, so numeric enums stay numeric', () => {
    expect(coerceToParamType('2', 'enum', 3)).toBe(2);
    expect(coerceToParamType('hexagon', 'enum', 'circle')).toBe('hexagon');
  });
});
