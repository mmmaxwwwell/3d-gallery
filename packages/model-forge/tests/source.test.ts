import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSourceShape, assemble, createSourceCache, SourceNotFoundError, IncludeCycleError } from '../src/source.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');

function shape(target: string, root = FIXTURES) {
  return resolveSourceShape({ modelsDir: join(root, 'models'), slug: 'fixture-cube', target, root });
}

describe('resolveSourceShape', () => {
  it('finds a part by its file base name', () => {
    expect(shape('box').files).toContain('models/fixture-cube/parts/box.scad');
  });

  it('finds a preview by its file base name', () => {
    expect(shape('duo').files).toContain('models/fixture-cube/previews/duo.scad');
  });

  it('inlines local includes recursively', () => {
    const text = assemble(shape('box'));
    expect(text).toContain('NOTCH = 2;');          // from lib/shared-constants.scad
    expect(text).toContain('module box()');        // from the lib
    expect(text).not.toMatch(/include\s*</);       // nothing local left behind
  });

  it('reports every contributing file, repo-relative and sorted', () => {
    expect(shape('box').files).toEqual([
      'models/fixture-cube/lib/fixture-cube-lib.scad',
      'models/fixture-cube/lib/shared-constants.scad',
      'models/fixture-cube/parts/box.scad',
    ]);
  });

  it('parses the lib parameter schema', () => {
    expect(shape('box').schema.map((p) => p.name)).toEqual(['size', 'height_mult', 'corner', 'notched']);
  });

  it('splits so that post holds only the consumer statements', () => {
    expect(shape('box').post.trim()).toBe('$fn = 16;\nbox();');
  });

  it('produces the on-disk source verbatim when no parameters are given', () => {
    const s = shape('box');
    expect(assemble(s)).toBe(s.pre + s.post);
  });

  it('digests the parameter-free source, so it is stable across parameter sets', () => {
    expect(shape('box').digest).toBe(shape('box').digest);
    expect(shape('box').digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gives different targets different digests', () => {
    expect(shape('box').digest).not.toBe(shape('duo').digest);
  });

  it('synthesizes a consumer for a lib module with no file', () => {
    const s = shape('lid');
    expect(s.post).toContain('lid();');
    expect(assemble(s)).toContain('module lid()');
  });

  it('refuses to synthesize for a target that is not a SCAD identifier', () => {
    // A hyphenated target is legal as a preview file base name but can never be
    // a module call, and emitting one produces an opaque openscad parse error.
    expect(() => shape('not-an-identifier')).toThrow(SourceNotFoundError);
  });

  it('refuses a target the lib declares no module for', () => {
    // openscad only warns on an unknown module and renders nothing, so
    // accepting this would cache an empty mesh under a valid-looking key.
    expect(() => shape('nope_at_all')).toThrow(SourceNotFoundError);
  });

  it('names what it tried when the source is missing', () => {
    try {
      shape('nope_at_all');
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain('parts/nope_at_all.scad');
      expect((e as Error).message).toContain('previews/nope_at_all.scad');
      expect((e as Error).message).toContain('module nope_at_all()');
    }
  });
});

describe('parameter injection placement', () => {
  it('puts parameters after the lib so a preview-local override still wins', () => {
    const s = shape('duo-tall');
    const text = assemble(s, { height_mult: 99 });
    expect(text.indexOf('height_mult = 99;')).toBeLessThan(text.lastIndexOf('height_mult = 3;'));
  });

  it('leaves the source untouched for an empty parameter set', () => {
    const s = shape('box');
    expect(assemble(s, {})).toBe(assemble(s));
  });
});

describe('external includes', () => {
  it('leaves library-path includes in place and records them', () => {
    const root = mkdtempSync(join(tmpdir(), 'forge-src-'));
    cpSync(FIXTURES, root, { recursive: true });
    const lib = join(root, 'models', 'fixture-cube', 'lib', 'fixture-cube-lib.scad');
    writeFileSync(lib, `include <BOSL2/std.scad>\n${readFileSync(lib, 'utf8')}`);

    const s = shape('box', root);
    expect(s.externalIncludes).toEqual(['BOSL2/std.scad']);
    expect(assemble(s)).toContain('include <BOSL2/std.scad>');
    rmSync(root, { recursive: true, force: true });
  });
});

describe('include cycles', () => {
  it('throws rather than recursing forever', () => {
    const root = mkdtempSync(join(tmpdir(), 'forge-cycle-'));
    cpSync(FIXTURES, root, { recursive: true });
    const dir = join(root, 'models', 'fixture-cube', 'lib');
    writeFileSync(join(dir, 'shared-constants.scad'), 'include <fixture-cube-lib.scad>;\nNOTCH = 2;\n');

    expect(() => shape('box', root)).toThrow(IncludeCycleError);
    rmSync(root, { recursive: true, force: true });
  });
});

describe('createSourceCache', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-cache-'));
    cpSync(FIXTURES, root, { recursive: true });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function get(cache: ReturnType<typeof createSourceCache>, target = 'box') {
    return cache.get({ modelsDir: join(root, 'models'), slug: 'fixture-cube', target, root });
  }

  it('returns the same object on a repeat resolve', () => {
    const cache = createSourceCache(root);
    expect(get(cache)).toBe(get(cache));
  });

  it('re-resolves after a contributing file changes', async () => {
    const cache = createSourceCache(root);
    const before = get(cache).digest;

    // A transitively-included file, to prove the whole graph is watched.
    const shared = join(root, 'models', 'fixture-cube', 'lib', 'shared-constants.scad');
    await new Promise((r) => setTimeout(r, 10));
    writeFileSync(shared, 'NOTCH = 4;\nLID_THICKNESS = 1.5;\n');

    expect(get(cache).digest).not.toBe(before);
  });

  it('drops a slug on demand', () => {
    const cache = createSourceCache(root);
    const first = get(cache);
    cache.invalidate('fixture-cube');
    expect(get(cache)).not.toBe(first);
  });
});
