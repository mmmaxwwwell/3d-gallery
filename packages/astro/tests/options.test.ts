import { describe, it, expect } from 'vitest';
import { normalizeBase, withSiteBase, resolveOptions } from '../src/options.ts';

describe('normalizeBase', () => {
  it.each([
    ['a', '/a/'],
    ['/a', '/a/'],
    ['a/', '/a/'],
    ['/a/', '/a/'],
    ['/deep/path', '/deep/path/'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeBase(input)).toBe(expected);
  });
});

describe('withSiteBase', () => {
  // Astro's `base` is a URL prefix, not an output directory, so these have to
  // compose without ever producing a doubled slash.
  it.each([
    ['/', '/a/', '/a/'],
    ['/demo/', '/a/', '/demo/a/'],
    ['/demo', '/a/', '/demo/a/'],
    ['/demo/', 'a/', '/demo/a/'],
    ['/3d-gallery/', '/models/manifest.json', '/3d-gallery/models/manifest.json'],
  ])('joins base %s with %s', (base, path, expected) => {
    expect(withSiteBase(base, path)).toBe(expected);
  });
});

describe('resolveOptions', () => {
  it('defaults everything off the project root', () => {
    const resolved = resolveOptions({}, '/project');
    expect(resolved.root).toBe('/project');
    expect(resolved.modelsDir).toBe('/project/models');
    expect(resolved.cacheDir).toBe('/project/.cache/forge');
    expect(resolved.artifactBase).toBe('/a/');
    expect(resolved.prerender).toBe('referenced');
  });

  it('lets an explicit root override the project root', () => {
    expect(resolveOptions({ root: '/elsewhere' }, '/project').modelsDir).toBe('/elsewhere/models');
  });

  it('keeps an inline manifest and ignores a path', () => {
    const manifest = { models: [] };
    expect(resolveOptions({ manifest }, '/p').manifest).toBe(manifest);
    expect(resolveOptions({ manifest: './some.json' }, '/p').manifest).toBeUndefined();
  });

  it('honours an explicit prerender mode', () => {
    expect(resolveOptions({ prerender: 'declared' }, '/p').prerender).toBe('declared');
    expect(resolveOptions({ prerender: false }, '/p').prerender).toBe(false);
  });

  it('normalizes a hand-written artifact base', () => {
    expect(resolveOptions({ artifactBase: 'artifacts' }, '/p').artifactBase).toBe('/artifacts/');
  });
});
