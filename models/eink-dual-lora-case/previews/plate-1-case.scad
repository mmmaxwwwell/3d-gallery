include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// PETG, one 220 mm bed: front cover face down, tub back down, the midframe
// back down, both cradles ring down.
color("#3d4a3a") {
  translate([case_w / 2 + 2, top + 2, 0]) front_cover_part();
  translate([case_w * 1.5 + 10, top + 2, 0]) tub_part();
  translate([case_w * 2.5 + 18, top + 2, 0]) midframe_part();
  for (i = [0, 1]) translate([case_w * 2 + 14 + i * 22, case_h + wing_h + 20, 0]) cradle_part();
}
