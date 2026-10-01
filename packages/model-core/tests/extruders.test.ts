import { describe, expect, it } from 'vitest';
import { assignExtruders, parseExtruderEcho } from '../src/extruders.ts';

describe('parseExtruderEcho', () => {
  it('reads the echoed slots', () => {
    expect(parseExtruderEcho(['ECHO: other = 1', 'ECHO: gallery_extruders = [["#222222", 3], ["#ff4757", 4]]']))
      .toEqual([{ hex: '#222222', extruder: 3 }, { hex: '#FF4757', extruder: 4 }]);
  });

  it('is null when nothing is echoed', () => {
    expect(parseExtruderEcho(['ECHO: other = 1'])).toBeNull();
  });

  it('refuses a malformed echo', () => {
    expect(() => parseExtruderEcho(['ECHO: gallery_extruders = [["red", 1]]'])).toThrow(/pairs/);
    expect(() => parseExtruderEcho(['ECHO: gallery_extruders = [["#222222", 0]]'])).toThrow(/pairs/);
    expect(() => parseExtruderEcho(['ECHO: gallery_extruders = [["#222222", 1.5]]'])).toThrow(/pairs/);
    expect(() => parseExtruderEcho(['ECHO: gallery_extruders = [["#222222", 1], ["#222222", 2]]'])).toThrow(/twice/);
  });
});

describe('assignExtruders', () => {
  const palette = [{ hex: '#222222FF', label: 'petg' }, { hex: '#FF4858FF', label: 'tpu' }, { hex: '#00FF00FF', label: 'x' }];

  it('pins matching colours, within a step per channel, and leaves the rest', () => {
    expect(assignExtruders(palette, [{ hex: '#222222', extruder: 3 }, { hex: '#FF4757', extruder: 4 }]).map((p) => p.extruder))
      .toEqual([3, 4, undefined]);
  });

  it('leaves the palette alone without an echo', () => {
    expect(assignExtruders(palette, null)).toBe(palette);
  });
});
