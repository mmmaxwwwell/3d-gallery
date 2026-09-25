include <../lib/filament-spool-roller-lib.scad>;
$fn = 32;

// Reference view: the stand and its spools inside the dry box.
echo(gallery_instances = stand_instances());
color("#1fedff") stand_tiles(parity = 0);
if (lanes > 1) color("#73f3ff") stand_tiles(parity = 1);
color("#ffdb27") stand_walls(parity = 0);
color("#ffe878") stand_walls(parity = 1);
color("#ff7d1f") stand_rollers(parity = 0);
color("#ffae73") stand_rollers(parity = 1);
color("#51ff30") stand_beams(parity = 0);
if (lanes > 1) color("#92ff7e") stand_beams(parity = 1);
color("#8a8f98") spools();
color("#3a3f48") box();
