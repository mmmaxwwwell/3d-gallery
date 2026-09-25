include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// The holder, assembled, with a spool seated in every lane.
// Each part comes in two shades, alternating piece to piece, so copies
// read apart and touching ones stay separate solids.
// One lane has one tile and one beam, and a colour pass with nothing in it
// fails the whole 3MF, so their second shade only exists past one lane.
echo(gallery_instances = stand_instances());
color("#1fedff") stand_tiles(parity = 0);
if (lanes > 1) color("#73f3ff") stand_tiles(parity = 1);
color("#ffdb27") stand_walls(parity = 0);
color("#ffe878") stand_walls(parity = 1);
color("#ff7d1f") stand_rollers(parity = 0);
color("#ffae73") stand_rollers(parity = 1);
color("#ff33ce") stand_pegs(parity = 0);
color("#ff7fe0") stand_pegs(parity = 1);
color("#c0c4cc") stand_bearings();
color("#51ff30") stand_beams(parity = 0);
if (lanes > 1) color("#92ff7e") stand_beams(parity = 1);
color("#8a8f98") spools();
