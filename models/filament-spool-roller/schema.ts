import { z, between, wholeBetween } from '../schema-kit.ts';

// Each range is what a spool stand could plausibly be built at, not what
// fits together: how the pieces meet is the lib's to check, and its asserts
// already do it from the derived geometry. The refinements below are only
// the relations between raw inputs that the lib takes on trust.
export default z.strictObject({
  spool_diameter: between(100, 350),
  spool_width: between(20, 120),
  ground_clearance: between(0, 100),
  lanes: wholeBetween(1, 8),
  lane_slack: between(0.5, 10),
  wall_thickness: between(3, 20),
  peg_shoulder: between(0, 5),
  wall_front_fraction: between(0.05, 1),
  wall_trough_height: between(0, 200),
  roller_diameter: between(10, 80),
  flange_taper_angle: between(10, 60),
  roller_clearance: between(0, 20),
  base_height: between(1, 20),
  base_depth: between(50, 400),
  hex_size: between(4, 40),
  hex_wall: between(0.8, 10),
  panel_clearance: between(0, 20),
  bearing_outer_diameter: between(5, 60),
  bearing_inner_diameter: between(2, 30),
  bearing_width: between(2, 30),
  bearing_fit: between(0, 0.5),
  peg_fit: between(0, 0.5),
  peg_press: between(0, 0.5),
  dovetail_length: between(2, 30),
  dovetail_root_width: between(2, 60),
  dovetail_tip_width: between(2, 60),
  dovetail_clearance: between(0, 1),
  dovetail_offset: between(0, 150),
  base_screw_length: between(4, 30),
  lock_screw_length: between(6, 50),
  base_screw_x: between(-100, 100),
  wall_ridge_height: between(0, 5),
  joint_fit: between(0, 1),
  ptfe_od: between(2, 8),
  ptfe_fit: between(0, 2),
  ptfe_clips: wholeBetween(1, 10),
  beam_hex: between(4, 30),
  beam_socket_wall: between(1, 10),
  beam_fit: between(0, 1),
  beam_flange: between(0, 10),
  beam_clearance: between(0, 30),
  lock_hole_diameter: between(1, 6),
  screw_hole_diameter: between(2, 10),
  screw_pad_diameter: between(4, 30),
  print_bed: between(100, 500),
  box_height: between(100, 1000),
  box_wall: between(0.5, 20),
  bulkhead_hole_diameter: between(2, 30),
  bulkhead_height: between(0, 300),
})
  .refine((p) => p.dovetail_tip_width > p.dovetail_root_width, {
    path: ['dovetail_tip_width'],
    message: 'must be wider than dovetail_root_width, or the tiles pull apart',
  })
  .refine((p) => p.bearing_inner_diameter < p.bearing_outer_diameter, {
    path: ['bearing_inner_diameter'],
    message: 'must be smaller than bearing_outer_diameter',
  })
  .refine((p) => p.screw_pad_diameter > p.screw_hole_diameter, {
    path: ['screw_pad_diameter'],
    message: 'must be wider than screw_hole_diameter',
  });
