import { z, between, wholeBetween } from '../schema-kit.ts';

// Ranges are what a printed mast could plausibly be built at. Whether the
// joints fit at a given size is the lib's to check: its asserts work from
// the derived geometry, per joint.
export default z.strictObject({
  bottom_diameter: between(20, 300),
  top_diameter: between(10, 300),
  mast_length: between(100, 5000),
  wall: between(1.5, 10),
  section_height: between(60, 400),
  cell_pitch: between(6, 40),
  rib: between(0.8, 6),
  rim: between(0.5, 10),
  head_seat: between(0, 3),
  neck_length: between(0, 30),
  sleeve_round: between(0, 3),
  fit_slop: between(0, 1),
  lug_depth: between(0.2, 2),
  lug_width: between(1, 6),
  twist_preload: between(0, 0.5),
  twist_snap: between(0, 1),
  twist_lateral: between(0, 15),
  facets: wholeBetween(24, 360),
});
