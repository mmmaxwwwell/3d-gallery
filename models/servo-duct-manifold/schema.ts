import { z, between, wholeBetween } from '../schema-kit.ts';

// Ranges are what a duct manifold could plausibly be built at; whether the
// pieces fit together and on the bed is the lib's asserts' job.
const wholes = z.array(z.number().int('must be whole numbers'));
const faces = [-3, -2, -1, 1, 2, 3];

export default z.strictObject({
  duct_d: between(50, 160),
  wall: between(1.2, 6),
  joint: z.enum(['twist', 'bolt'], { message: 'must be twist or bolt' }),
  twist_angle: between(10, 30),
  gasket_squeeze: between(0.1, 1.1),
  m3_grip: z.enum(['thread', 'nut'], { message: 'must be thread or nut' }),
  flange_thickness: between(5, 12),
  nut_af: between(5, 8),
  pocket_depth: between(2, 5),
  spigot_length: between(20, 100),
  bead: between(0, 3),
  tube_length: between(40, 200),
  ports: wholeBetween(3, 6),
  valved_ports: wholeBetween(0, 6),
  branch_tilt: between(15, 45),
  cubic_cells: wholes.refine((v) => v.length >= 6 && v.length % 6 === 0, 'must be runs of six numbers, one box each'),
  cubic_ports: wholes
    .refine((v) => v.length % 5 === 0, 'must be runs of five numbers, one port each')
    .refine((v) => v.every((n, i) => i % 5 !== 3 || faces.includes(n)), 'must give each face as 1, 2 or 3, signed')
    .refine((v) => v.every((n, i) => i % 5 !== 4 || n === 0 || n === 1), 'must end each port with 1 (plug) or 0 (socket)'),
  sensor_board: z.enum(['bme280', 'aht20_bmp280', 'sht31', 'sgp30', 'ens160_aht21', 'adafruit', 'custom'],
    { message: 'must be one of the listed boards' }),
  board_custom: z.tuple([between(8, 40), between(6, 30)], { message: 'must be [length, width]' }),
  venturi_throat: between(50, 84),
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
  iris_blade_t: between(0.4, 1),
  iris_open: between(0, 100),
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
