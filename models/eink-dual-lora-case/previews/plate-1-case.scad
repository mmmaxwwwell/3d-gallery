include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// PETG, one 220 mm bed: front cover face down, tub back down and the
// midframe back down, side by side 3 mm apart (the bed's width is nearly
// all used); the four cradles below the midframe, ring down.
cover_hw = case_w / 2 - 0.5;
tub_hw = case_w / 2 + skin;
mid_hw = inner_x;
cover_x = 1 + cover_hw;
tub_x = cover_x + cover_hw + 3 + tub_hw;
mid_x = tub_x + tub_hw + 3 + mid_hw;
color("#3d4a3a") {
  translate([cover_x, -bottom + skin + 2, 0]) front_cover_part();
  translate([tub_x, -bottom + skin + 2, 0]) tub_part();
  translate([mid_x, -bottom + skin + 2, 0]) midframe_part();
  for (i = [0, 1]) translate([mid_x - 12 + i * 22, 22, 0]) cradle_part();
  for (i = [0, 1]) translate([mid_x - 12 + i * 14, 42, 0]) front_cradle_part();
}
