include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// PETG, one 220 mm bed: front cover face down, tub back down and the
// midframe back down, side by side; the four cradles below the midframe,
// ring down.
color("#3d4a3a") {
  translate([case_w / 2 + skin + 2, -bottom + skin + 2, 0]) front_cover_part();
  translate([case_w * 1.5 + 3 * skin + 6, -bottom + skin + 2, 0]) tub_part();
  translate([case_w * 2.5 + 4 * skin + 10, -bottom + skin + 2, 0]) midframe_part();
  for (i = [0, 1]) translate([case_w * 2.5 + 4 * skin - 12 + i * 22, 22, 0]) cradle_part();
  for (i = [0, 1]) translate([case_w * 2.5 + 4 * skin - 12 + i * 14, 42, 0]) front_cradle_part();
}
