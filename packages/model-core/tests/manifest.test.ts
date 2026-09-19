import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest, allParts } from '../src/manifest.ts';
import { ManifestError } from '../src/errors.ts';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function model(over: Record<string, unknown> = {}) {
  return { slug: 'thing', title: 'Thing', description: 'A thing.', ...over };
}

function part(over: Record<string, unknown> = {}) {
  return { file: 'a.stl', format: 'stl', label: 'A', ...over };
}

function issuesOf(raw: unknown): string[] {
  try {
    validateManifest(raw);
    return [];
  } catch (e) {
    if (e instanceof ManifestError) return e.issues;
    throw e;
  }
}

describe('validateManifest', () => {
  it('accepts a minimal manifest', () => {
    expect(() => validateManifest({ models: [model()] })).not.toThrow();
  });

  it('accepts the repo manifest', () => {
    const raw = JSON.parse(readFileSync(join(REPO_ROOT, 'models', 'manifest.json'), 'utf8'));
    expect(() => validateManifest(raw)).not.toThrow();
  });

  it('rejects a non-object', () => {
    expect(issuesOf('nope')).toHaveLength(1);
  });

  it('rejects a missing models array', () => {
    expect(issuesOf({})).toEqual(['manifest: "models" must be an array']);
  });

  it('reports every issue, not just the first', () => {
    const issues = issuesOf({ models: [{ slug: 'A B', title: '', description: '' }] });
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects a slug that could escape a path', () => {
    expect(issuesOf({ models: [model({ slug: '../etc' })] })).toHaveLength(1);
  });

  it('rejects duplicate slugs', () => {
    const issues = issuesOf({ models: [model(), model()] });
    expect(issues).toContain('models[1]: duplicate slug "thing"');
  });

  it('rejects a file that is not a bare filename', () => {
    const issues = issuesOf({ models: [model({ parts: [part({ file: '../x.stl' })] })] });
    expect(issues.some((i) => i.includes('bare filename'))).toBe(true);
  });

  it('rejects a format that contradicts the extension', () => {
    const issues = issuesOf({ models: [model({ parts: [part({ file: 'a.stl', format: '3mf' })] })] });
    expect(issues.some((i) => i.includes('but "format" is "3mf"'))).toBe(true);
  });

  it('rejects an unknown format', () => {
    const issues = issuesOf({ models: [model({ parts: [part({ file: 'a.obj', format: 'obj' })] })] });
    expect(issues.some((i) => i.includes('"format" must be one of'))).toBe(true);
  });

  it('rejects two entries whose base names collide, since both resolve to one .scad', () => {
    const issues = issuesOf({
      models: [model({ previews: [part({ file: 'a.3mf', format: '3mf' })], parts: [part({ file: 'a.stl' })] })],
    });
    expect(issues.some((i) => i.includes('base name "a" already used'))).toBe(true);
  });

  it('rejects more than one default entry', () => {
    const issues = issuesOf({
      models: [model({
        previews: [part({ file: 'a.3mf', format: '3mf', default: true })],
        parts: [part({ file: 'b.stl', default: true })],
      })],
    });
    expect(issues.some((i) => i.includes('at most one is allowed'))).toBe(true);
  });

  it('rejects a module name that could escape a path', () => {
    const issues = issuesOf({ models: [model({ parts: [part({ module: '../x' })] })] });
    expect(issues.some((i) => i.includes('"module" must match'))).toBe(true);
  });

  // `module` names a SCAD module on a part but a previews/<name>.scad source on
  // a preview, and the repo already ships hyphenated preview names.
  it('accepts a hyphenated module, since previews use it as a file base name', () => {
    expect(() => validateManifest({
      models: [model({ previews: [part({ file: 'a.3mf', format: '3mf', module: 'assembled-2x2' })] })],
    })).not.toThrow();
  });

  it('rejects a variant param name that is not a SCAD identifier', () => {
    const issues = issuesOf({
      models: [model({ parts: [part({ variants: [{ label: 'X', params: { 'a; cube(9)': 1 } }] })] })],
    });
    expect(issues.some((i) => i.includes('is not a valid SCAD identifier'))).toBe(true);
  });

  it('accepts a well-formed variant', () => {
    expect(() => validateManifest({
      models: [model({ parts: [part({ variants: [{ label: 'Hexagon', params: { shape: 'hexagon' } }] })] })],
    })).not.toThrow();
  });
});

describe('allParts', () => {
  it('returns previews before parts', () => {
    const m = model({
      previews: [part({ file: 'p.3mf', format: '3mf', label: 'P' })],
      parts: [part({ file: 'q.stl', label: 'Q' })],
    });
    const { models: [validated] } = validateManifest({ models: [m] });
    expect(allParts(validated).map((p) => p.label)).toEqual(['P', 'Q']);
  });

  it('handles a model with neither', () => {
    const { models: [validated] } = validateManifest({ models: [model()] });
    expect(allParts(validated)).toEqual([]);
  });
});
