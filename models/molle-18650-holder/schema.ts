import { z, between, wholeBetween } from '../schema-kit.ts';

// Ranges are what a cell holder could plausibly be built at; whether the
// cells fit the plate and the stick fits the webbing is the lib's asserts' job.
export default z.strictObject({
  cells: wholeBetween(1, 6),
  cell_d: between(10, 33),
  cell_len: between(30, 75),
  cell_clear: between(0, 1),
  rib_squeeze: between(0, 0.6),
  stick_inches: wholeBetween(3, 7),
  wall: between(0.8, 4),
  grip: between(0, 30),
  drain_d: between(1, 8),
});
