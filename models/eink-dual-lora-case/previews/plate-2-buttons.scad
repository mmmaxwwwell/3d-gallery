include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// Two materials: TPU boots with PETG plungers fused into their roofs, flange
// down. Two side buttons, two front buttons.
for (i = [0, 1]) translate([20 + i * 20, 20, 0]) {
  color("#e07b39") boot_tpu();
  color("#d9d9d9") boot_stem();
}
for (i = [0, 1]) translate([20 + i * 14, 42, 0]) {
  color("#e07b39") fboot_tpu();
  color("#d9d9d9") fboot_stem();
}
