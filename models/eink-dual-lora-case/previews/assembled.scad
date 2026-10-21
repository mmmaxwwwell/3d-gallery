include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// Front cover pulled forward 30 mm so the inside shows.
color("#3d4a3a") mirror([1, 0, 0]) translate([0, 0, -30]) front_cover();
color("#3d4a3a") mirror([1, 0, 0]) tub();
color("#c08a3e") mirror([1, 0, 0]) midframe();
color("#8a6a3a") mirror([1, 0, 0]) for (y = btn_y) cradle_in_place(y);
color("#e07b39") mirror([1, 0, 0]) for (y = btn_y) button_in_place(y, "tpu");
color("#d9d9d9") mirror([1, 0, 0]) for (y = btn_y) button_in_place(y, "stem");
color("#141414") mirror([1, 0, 0]) ref_display_board();
color("#e6e4dc") mirror([1, 0, 0]) ref_display_panel();
color("#7a3fb0") mirror([1, 0, 0]) ref_boards();
color("#2a6fdb") mirror([1, 0, 0]) ref_speaker();
color("#b03a6f") mirror([1, 0, 0]) ref_sensor();
color("#bfe6ff") mirror([1, 0, 0]) ref_disc();
color("#1e8f5a") mirror([1, 0, 0]) ref_amp();
color("#e8c547") mirror([1, 0, 0]) ref_battery();
color("#555555") mirror([1, 0, 0]) ref_switches();
color("#c9a227") mirror([1, 0, 0]) ref_smas();
