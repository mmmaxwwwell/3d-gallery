import { z, between, wholeBetween } from '../schema-kit.ts';

// Ranges are what a duct manifold could plausibly be built at; whether the
// pieces fit together and on the bed is the lib's asserts' job.
export default z.strictObject({
  duct_d: between(50, 160),
  wall: between(1.2, 6),
  flange_thickness: between(5, 12),
  nut_af: between(5, 8),
  pocket_depth: between(2, 5),
  spigot_length: between(20, 100),
  bead: between(0, 3),
  ports: wholeBetween(3, 6),
  valved_ports: wholeBetween(0, 6),
  branch_tilt: between(15, 45),
  disc_thickness: between(1.5, 6),
  disc_clearance: between(0.2, 2),
  hub_width: between(8, 20),
  key_size: between(3, 6),
  fit: between(0, 0.5),
  servo_body_length: between(15, 45),
  servo_body_width: between(8, 25),
  servo_shaft_offset: between(3, 15),
  servo_tab_holes: between(20, 55),
  servo_horn_face: between(8, 25),
  horn_length: between(15, 60),
  horn_width: between(4, 12),
  horn_thickness: between(1, 4),
  preview_open: between(0, 90),
  print_bed: between(150, 400),
})
  .refine((p) => p.valved_ports <= p.ports, {
    path: ['valved_ports'],
    message: 'must be at most ports',
  })
  .refine((p) => p.servo_tab_holes > p.servo_body_length, {
    path: ['servo_tab_holes'],
    message: 'must be longer than servo_body_length',
  });
