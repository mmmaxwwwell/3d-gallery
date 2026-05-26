// BEGIN_DESCRIPTION
// A wall-mounted round shelf for the Levoit Core 200S air purifier
// (Amazon B08FJ678YK — 186mm dia × 312mm tall, ~2.5 kg).
//
// The shelf is a disk with two diagonal truss struts that brace it
// against a flat wall. Two screws per strut anchor it; the
// counterbored holes accept the screw head and a thru-pass for a
// #6 wood screw or M3.5 wall anchor.
//
// A 230mm shelf gives the purifier ~22mm of margin all around — enough
// for the rubberized base feet to sit fully on the plate without
// overhanging.
// END_DESCRIPTION

// BEGIN_PARAMS
// Outer diameter of the shelf plate, in mm.
// 230mm fits the Levoit Core 200S (186mm) with a 22mm margin.
// Increase for larger purifiers; check that your wall has space.
shelf_diameter = 230;

// Plate / truss material thickness, in mm.
// 10mm is rigid enough for ~3 kg loads in PLA when printed solid;
// drop to 8mm for PETG or to save filament.
shelf_thickness = 10;

// Screw head counterbore radius, in mm.
// 3.5mm fits a #6 pan-head wood screw or an M3.5 anchor.
screw_hole_radius = 3.5;

// Screw shank thru-hole radius, in mm.
// 2mm clears an M3 / #6 screw shank cleanly.
screw_hole_thru_radius = 2;
// END_PARAMS

// ============================================================
// Helper modules
// ============================================================

// Truss strut: a 45° diagonal beam plus a vertical back leg that
// presses against the wall. Two screw holes punch through the back
// leg — counterbored from the wall side, thru-hole all the way.
module strut() {
    difference() {
        union() {
            rotate([0, 45, 0])
                cube([shelf_thickness, shelf_thickness, shelf_diameter]);
            translate([shelf_diameter / 2, 0, -shelf_diameter / 2])
                cube([shelf_thickness, shelf_thickness, shelf_diameter]);
        }

        // Counterbore + thru-hole through the back leg
        translate([(shelf_diameter / 2) - shelf_thickness - (shelf_thickness / 4),
                   shelf_thickness / 2,
                   shelf_diameter / 2]) {
            rotate([0, 90, 0]) {
                cylinder(h = shelf_thickness * 2, r = screw_hole_radius);
                cylinder(h = shelf_thickness * 4, r = screw_hole_thru_radius);
            }
        }

        // Clip the strut to the back of the wall plane
        translate([(shelf_diameter / 2) + shelf_thickness, 0, 0])
            cube([shelf_diameter, shelf_diameter, shelf_diameter]);
    }
}

// The shelf plate plus the wall-side back plate that the struts attach to.
module base() {
    union() {
        linear_extrude(shelf_thickness)
            circle(shelf_diameter / 2);
        translate([0, -shelf_diameter / 2, 0])
            cube([(shelf_diameter / 2) + shelf_thickness,
                  shelf_diameter,
                  shelf_thickness]);
    }
}

// ============================================================
// Public modules
// ============================================================

// Complete shelf assembly: round plate + two diagonal struts + bottom
// support strut, with everything below the base plane trimmed.
module shelf() {
    difference() {
        union() {
            base();

            // Left truss (top of plate)
            translate([0, (shelf_diameter / 2) - shelf_thickness, shelf_thickness])
                strut();

            // Right truss (bottom of plate)
            translate([0, -(shelf_diameter / 2), shelf_thickness])
                strut();

            // Right-bottom support strut
            translate([0,
                       -(shelf_diameter / 2),
                       shelf_thickness / 2 + shelf_thickness - (shelf_diameter / 2)])
                strut();
        }

        // Trim everything below the base plane
        translate([0, 0, -shelf_thickness * 11])
            scale([1, 1, 11])
                base();
    }
}
