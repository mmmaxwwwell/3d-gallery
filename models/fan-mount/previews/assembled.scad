include <../lib/fan-mount-lib.scad>;
$fn = 64;

// Stacked assembly for visualizing alignment between parts. base() already
// subtracts the full 360° clamp pocket via clamp_pocket_cutout() in the lib.
// Each part is wrapped in color() so the gallery's multicolor 3MF builder
// can split it into per-color meshes.
clamp_z = base_thickness/2 + clamp_skirt_drop - clamp_interference;

color("#3a7ad9") base();

color("#888888")
    translate([0, 0, -base_thickness/2 - base_gasket_thickness/2])
        base_gasket();

color("#666666")
    translate([0, 0, base_thickness/2 + fan_gasket_thickness/2])
        fan_gasket();

color("#5fb3d6")
    translate([0, 0, clamp_z])
        fan_clamp_half();

color("#d65f9a")
    translate([0, 0, clamp_z])
        rotate([0, 0, 180])
            fan_clamp_half();
