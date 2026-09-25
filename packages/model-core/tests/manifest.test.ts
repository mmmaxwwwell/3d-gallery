import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest, allParts, buildViews, selectBuild } from '../src/manifest.ts';
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

  it('rejects more than one default model', () => {
    const issues = issuesOf({ models: [model({ default: true }), model({ slug: 'other', default: true })] });
    expect(issues.some((i) => i.includes('models marked "default"'))).toBe(true);
  });

  it('rejects a non-boolean devOnly', () => {
    expect(issuesOf({ models: [model({ devOnly: 'yes' })] })).toEqual(['thing: "devOnly" must be a boolean']);
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

describe('validateManifest — instances and hardware attribution', () => {
  const assembly = (components: unknown[]) =>
    part({ file: 'asm.3mf', format: '3mf', default: true, components });
  const withBom = (components: unknown[], extra: Record<string, unknown> = {}) =>
    model({ previews: [assembly(components)], parts: [part()], ...extra });

  it('accepts instances with a where on the main assembly', () => {
    const m = withBom([{ part: 'a.stl', qty: 2, instances: [{ id: 'A1', where: 'left' }, { id: 'A2', where: 'right' }] }]);
    expect(issuesOf({ models: [m] })).toEqual([]);
  });

  it('rejects an instance count that disagrees with qty', () => {
    const m = withBom([{ part: 'a.stl', qty: 2, instances: [{ id: 'A1', where: 'left' }] }]);
    expect(issuesOf({ models: [m] })).toEqual(['thing.previews[0].components[0]: 1 instances for a qty of 2']);
  });

  it('rejects a duplicate instance id', () => {
    const m = withBom([{ part: 'a.stl', qty: 2, instances: [{ id: 'A1', where: 'l' }, { id: 'A1', where: 'r' }] }]);
    expect(issuesOf({ models: [m] })).toEqual(['thing.asm.3mf: instance id "A1" is used twice']);
  });

  it('lets another view borrow where from the main assembly, but only for ids it defines', () => {
    const plate = (id: string) =>
      part({ file: `p-${id}.3mf`, format: '3mf', components: [{ part: 'a.stl', qty: 1, instances: [{ id }] }] });
    const m = model({
      previews: [
        assembly([{ part: 'a.stl', qty: 1, instances: [{ id: 'A1', where: 'left' }] }]),
        plate('A1'),
        plate('Z9'),
      ],
      parts: [part()],
    });
    expect(issuesOf({ models: [m] })).toEqual([
      'thing.p-Z9.3mf: instance "Z9" has no "where" and the main assembly does not define it',
    ]);
  });

  it('accepts hardware attributed within its qty', () => {
    const m = withBom([{ part: 'a.stl', qty: 3 }], {
      hardware: [{ qty: 7, label: 'M3', usedBy: [{ part: 'a.stl', each: 2 }] }],
    });
    expect(issuesOf({ models: [m] })).toEqual([]);
  });

  it('rejects hardware attributed beyond its qty', () => {
    const m = withBom([{ part: 'a.stl', qty: 3 }], {
      hardware: [{ qty: 5, label: 'M3', usedBy: [{ part: 'a.stl', each: 2 }] }],
    });
    expect(issuesOf({ models: [m] })).toEqual(['thing.hardware[0]: "usedBy" accounts for 6 but "qty" is 5']);
  });

  it('rejects usedBy naming a part the model does not have, or one outside the BOM', () => {
    const m = model({
      previews: [assembly([{ part: 'a.stl', qty: 1 }])],
      parts: [part(), part({ file: 'b.stl', label: 'B' })],
      hardware: [{ qty: 9, label: 'M3', usedBy: [{ part: 'nope.stl', each: 1 }, { part: 'b.stl', each: 1 }] }],
    });
    expect(issuesOf({ models: [m] })).toEqual([
      'thing.hardware[0]: "usedBy" names "nope.stl", which is not one of the model\'s parts',
      'thing.hardware[0]: "usedBy" b.stl is not in the main assembly\'s components, so it has no piece count',
    ]);
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

describe('builds', () => {
  function build(over: Record<string, unknown> = {}) {
    return { id: 'one', label: '1×', params: { lanes: 1 }, parts: [part()], ...over };
  }

  it('accepts a model whose entries live in its builds', () => {
    const m = model({ builds: [build({ default: true }), build({ id: 'four', label: '4×', params: { lanes: 4 } })] });
    expect(issuesOf({ models: [m] })).toEqual([]);
  });

  it('rejects entries at the top level alongside builds', () => {
    const issues = issuesOf({ models: [model({ parts: [part()], builds: [build()] })] });
    expect(issues).toEqual(['thing: "parts" belongs in each build once a model has "builds"']);
  });

  it('rejects an empty builds list', () => {
    expect(issuesOf({ models: [model({ builds: [] })] })).toEqual(['thing: "builds" must be a non-empty array']);
  });

  it('rejects duplicate ids, two defaults and a bad param name', () => {
    const issues = issuesOf({
      models: [model({ builds: [build({ default: true }), build({ default: true, params: { 'no-dash': 1 } })] })],
    });
    expect(issues).toEqual([
      'thing.builds[1]: duplicate build id "one"',
      'thing.builds[1]: "no-dash" is not a valid SCAD identifier',
      'thing: 2 builds marked "default" — at most one is allowed',
    ]);
  });

  it('checks each build\'s entries on their own, so builds may share a file', () => {
    const m = model({ builds: [build(), build({ id: 'four', parts: [part(), part()] })] });
    expect(issuesOf({ models: [m] })).toEqual([
      'thing.builds.four.parts[1]: base name "a" already used by thing.builds.four.parts[0]',
    ]);
  });

  it('rejects a shared name that means a different file or module in another build', () => {
    const m = model({ builds: [build(), build({ id: 'four', parts: [part({ module: 'other' })] })] });
    expect(issuesOf({ models: [m] })).toEqual([
      'thing.builds.four: "a.stl" differs in file or module from the same name in thing.builds.one',
    ]);
  });

  it('checks hardware against the build\'s own main assembly', () => {
    const m = model({
      builds: [build({
        previews: [part({ file: 'all.3mf', format: '3mf', components: [{ part: 'a.stl', qty: 2 }] })],
        hardware: [{ qty: 3, label: 'Screw', usedBy: [{ part: 'a.stl', each: 2 }] }],
      })],
    });
    expect(issuesOf({ models: [m] })).toEqual(['thing.builds.one.hardware[0]: "usedBy" accounts for 4 but "qty" is 3']);
  });

  it('views a model without builds as one view with no params', () => {
    const { models: [validated] } = validateManifest({ models: [model({ parts: [part()] })] });
    expect(buildViews(validated)).toEqual([{ params: {}, previews: [], parts: [part()], hardware: [] }]);
  });

  it('selects the named build, else the default, else the first', () => {
    const one = build();
    const four = build({ id: 'four', params: { lanes: 4 }, default: true });
    const { models: [validated] } = validateManifest({ models: [model({ builds: [one, four] })] });
    expect(selectBuild(validated, 'one').build?.id).toBe('one');
    expect(selectBuild(validated, 'nope').build?.id).toBe('four');
    expect(selectBuild(validated).params).toEqual({ lanes: 4 });
    expect(allParts(validated)).toHaveLength(2);
  });
});

describe('validateManifest — legend shades', () => {
  const withLegend = (entry: Record<string, unknown>) =>
    model({ previews: [part({ file: 'asm.3mf', format: '3mf', legend: [{ color: '#39ff14', label: 'Beams', ...entry }] })] });

  it('accepts alternate shades beside the colour', () => {
    expect(issuesOf({ models: [withLegend({ shades: ['#1f8f0b'] })] })).toEqual([]);
  });

  it('rejects shades that are not #rrggbb colours', () => {
    for (const shades of [[], ['green'], '#1f8f0b']) {
      expect(issuesOf({ models: [withLegend({ shades })] }))
        .toEqual(['thing.previews[0].legend[0]: "shades" must be a non-empty array of #rrggbb colours']);
    }
  });
});

describe('validateManifest — filament parts', () => {
  const withFilament = (filament: unknown[]) =>
    model({ parts: [part({ file: 'peg.stl' }), part({ file: 'wall.stl' })], filament });

  it('accepts filament entries naming the parts they are for', () => {
    expect(issuesOf({ models: [withFilament([
      { material: 'PETG', color: 'any' },
      { material: 'TPU 64D', color: 'any', parts: ['peg.stl'] },
    ])] })).toEqual([]);
  });

  it('accepts a part named in any build', () => {
    const m = model({
      builds: [{ id: 'one', label: '1×', params: {}, parts: [part({ file: 'peg.stl' })] }],
      filament: [{ material: 'TPU', color: 'any', parts: ['peg.stl'] }],
    });
    expect(issuesOf({ models: [m] })).toEqual([]);
  });

  it('rejects parts the model does not print, and an empty list', () => {
    expect(issuesOf({ models: [withFilament([{ material: 'TPU', color: 'any', parts: ['nope.stl'] }])] }))
      .toEqual(['thing.filament[0]: "parts" names "nope.stl", which is not one of the model\'s parts']);
    expect(issuesOf({ models: [withFilament([{ material: 'TPU', color: 'any', parts: [] }])] }))
      .toEqual(['thing.filament[0]: "parts" must be a non-empty array of part files']);
  });
});
