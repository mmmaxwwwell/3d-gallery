import { describe, it, expect } from 'vitest';
import { parseInstanceEcho } from '../src/instances.ts';

describe('parseInstanceEcho', () => {
  it('reads the anchors off an OpenSCAD echo line', () => {
    const lines = [
      'WARNING: something unrelated',
      'ECHO: gallery_instances = [["B1", [-81.25, 1e-7, 0.333333]], ["B2", [0, 72, 185]]]',
    ];
    expect(parseInstanceEcho(lines)).toEqual([
      { id: 'B1', at: [-81.25, 1e-7, 0.333333] },
      { id: 'B2', at: [0, 72, 185] },
    ]);
  });

  it('finds the echo behind a log prefix', () => {
    expect(parseInstanceEcho(['[stderr] ECHO: gallery_instances = [["T1", [0, 0, 2.5]]]']))
      .toEqual([{ id: 'T1', at: [0, 0, 2.5] }]);
  });

  it('returns null when nothing is echoed', () => {
    expect(parseInstanceEcho(['ECHO: other = 1'])).toBeNull();
  });

  it('rejects a malformed echo rather than dropping it', () => {
    expect(() => parseInstanceEcho(['ECHO: gallery_instances = [["B1", [0, 0]]]'])).toThrow(/pairs/);
    expect(() => parseInstanceEcho(['ECHO: gallery_instances = [["B1", [0, undef, 0]]]'])).toThrow(/pairs/);
    expect(() => parseInstanceEcho(['ECHO: gallery_instances = "B1"'])).toThrow(/pairs/);
  });

  it('rejects an id echoed twice', () => {
    expect(() => parseInstanceEcho(['ECHO: gallery_instances = [["B1", [0, 0, 0]], ["B1", [1, 1, 1]]]']))
      .toThrow(/twice/);
  });
});
