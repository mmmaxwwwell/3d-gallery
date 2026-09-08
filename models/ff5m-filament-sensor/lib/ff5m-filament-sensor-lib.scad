include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// Filament runout sensor for the Flashforge Adventurer 5M. Two parts,
// both printed in 64D TPU:
//   body — sleeve that slips over the 7 mm print-head boss (held by
//     an M3 self-tapping screw), houses the ball cavity, and accepts
//     a 4 mm-OD PTFE tube on top with a 45° funnel down to the
//     1.75 mm filament bore.
//   cap — small block that mounts against the body's flat pocket face
//     with two M2 screws that also fasten the D2F-01F pin-plunger
//     microswitch through its own mount holes. The switch's flat body
//     face registers against the mount face, so the plunger depth is
//     set automatically. The M2 hole spacing indexes the button onto
//     the ball's pocket axis translated to the mount face.
//
// The ball cavity is the hull() of two slightly-oversized spheres at
// the actuated and released ball centers — one boolean, both lateral
// retention (0.119 mm all around) and axial travel.
// END_DESCRIPTION

// BEGIN_PARAMS
// Diameter of the ball bearing in mm. A typical 608 skateboard
// bearing uses ~4 mm (5/32") balls, but cheap bearings vary — measure
// yours. All cavity dimensions scale from this value.
ball_diameter = 4.0;
// END_PARAMS

// ── Fixed geometry ──────────────────────────────────────────────────
// Change here, not in consumers.

// Printer boss / sleeve grip (bottom)
tube_diameter    = 7;
grip_length      = 7;
wall_thickness   = 4;

// PTFE tube receiver (top)
ptfe_od          = 4;      // 4 mm-OD PTFE for 1.75 mm filament
ptfe_grip_length = 12;     // 10–15 mm generous grip

// Filament + sensor geometry
filament_radius  = 0.875;  // 1.75 mm filament
bore_diameter    = 2.1;    // 0.175 mm slip fit per side around the filament
ball_clearance   = 0.119;  // radial cavity-to-ball gap
// NOTE: pocket_angle appeared twice in the original spec (40° in the
// "Fixed values" block, 14° in a later message). 40° is what the D2F
// stroke budget was computed for; 14° would over-travel the switch
// and land the mount face nearly on top of the print head. Kept at 40°.
pocket_angle     = 40;

// Plunger stroke along the pocket axis (= ball travel present → absent
// projected onto the pocket axis). This IS what the switch plunger sees.
// 0.5 mm D2F pretravel + 0.15 mm past = 0.65 mm; 0.10 mm short of the
// 0.75 mm max travel.
switch_stroke    = 0.650;

// D2F-01F pin-plunger microswitch (Omron)
d2f_length              = 12.8;
d2f_width               = 6.5;
d2f_thickness           = 5.8;  // body face-to-back
d2f_mount_spacing       = 6.5;
d2f_plunger_extension   = 1.3;  // typical free-position pin extension past body face

// Fasteners
m3_pilot_diameter     = 2.5;   // self-tap into TPU
m2_pilot_diameter     = 1.6;
m2_clearance_diameter = 2.4;
m2_pilot_depth        = 6;

// Angular layout around the ring
screw_azimuth_deg  = 0;    // M3 exits at +X
pocket_azimuth_deg = 45;   // pocket 45° around ring from the screw

// Sensor block sizing
sensor_extra_h   = 10;     // straight-bore section above the grip

// Cap dimensions
cap_length            = 16;   // along switch L / M2 spacing axis
cap_width             = 10;   // along switch W
cap_inner_wall        = 0.3;  // thin wall so the pin plunger reaches into the cavity
cap_thickness         = 6.1;  // cap_inner_wall + d2f_thickness
plunger_hole_diameter = 2.2;  // clearance for the pin plunger

// ── Derived ─────────────────────────────────────────────────────────

ball_r     = ball_diameter / 2;
cavity_r   = ball_r + ball_clearance;
sleeve_od  = tube_diameter + 2 * wall_thickness;

// 45° funnel from filament bore up to PTFE ID (rise = run).
funnel_h   = (ptfe_od - bore_diameter) / 2;

// Section boundaries along Z (from the bed up):
z_grip_top    = grip_length;                          // 7
z_sensor_top  = z_grip_top + sensor_extra_h;          // 17
z_funnel_top  = z_sensor_top + funnel_h;              // ~17.95
z_top         = z_funnel_top + ptfe_grip_length;      // ~29.95

// Present-position ball center: tangent to the filament surface.
ball_perp_present  = filament_radius + ball_r;
ball_along_present = ball_perp_present / sin(pocket_angle);

// Absent-position ball center: moved switch_stroke back along the
// pocket axis (this is what the plunger sees).
ball_along_absent  = ball_along_present - switch_stroke;
ball_perp_absent   = ball_along_absent * sin(pocket_angle);

// Pocket / filament axis crossing point (world Z).
crossing_z = z_grip_top + 2;

// Mount-face position along the pocket axis, derived so the plunger
// tip lands on the ball outer face at the released position (zero
// preload). At the present position the plunger is compressed by
// exactly `switch_stroke`, inside the D2F budget.
mount_face_z = ball_along_absent + ball_r
             - cap_inner_wall + d2f_plunger_extension;

// ── Body helpers ────────────────────────────────────────────────────

module _m3_screw_hole() {
    z_center = grip_length / 2;
    rotate([0, 0, screw_azimuth_deg])
        translate([tube_diameter / 2 - 0.5, 0, z_center])
            rotate([0, 90, 0])
                cylinder(d = m3_pilot_diameter,
                         h = wall_thickness + 1,
                         $fn = 24);
}

// Pocket-local frame: +Z = along the pocket axis outward from the
// filament-axis crossing point.
module _sensor_local() {
    hull() {
        translate([0, 0, ball_along_absent])  sphere(r = cavity_r, $fn = 40);
        translate([0, 0, ball_along_present]) sphere(r = cavity_r, $fn = 40);
    }
    // Plunger-access channel outward through the mount face.
    translate([0, 0, ball_along_present])
        cylinder(r = cavity_r, h = 40, $fn = 40);
}

module _boss_local() {
    // Rectangular boss along the pocket axis from the axes-crossing
    // point out to Z_local = mount_face_z, providing a flat mount
    // face perpendicular to the pocket. Only extends in +Z_local so
    // the "back" of the boss doesn't punch out the opposite side of
    // the sleeve.
    translate([-cap_length/2, -cap_width/2, 0])
        cube([cap_length, cap_width, mount_face_z]);
}

module _m2_pilots_local() {
    for (dx = [-d2f_mount_spacing/2, d2f_mount_spacing/2])
        translate([dx, 0, mount_face_z - m2_pilot_depth])
            cylinder(d = m2_pilot_diameter,
                     h = m2_pilot_depth + 0.5,
                     $fn = 20);
}

module _at_pocket() {
    translate([0, 0, crossing_z])
        rotate([0, 0, pocket_azimuth_deg])
            rotate([0, pocket_angle, 0])
                children();
}

// 45° funnel + PTFE receiver (subtracted from the top of the body).
module _ptfe_receiver_neg() {
    translate([0, 0, z_sensor_top])
        cylinder(d1 = bore_diameter, d2 = ptfe_od, h = funnel_h, $fn = 32);
    translate([0, 0, z_funnel_top - 0.01])
        cylinder(d = ptfe_od, h = ptfe_grip_length + 0.02, $fn = 32);
}

// ── Public ──────────────────────────────────────────────────────────

module body() {
    difference() {
        union() {
            cylinder(d = sleeve_od, h = z_top, $fn = 64);
            _at_pocket() _boss_local();
        }
        // Grip cavity — 7 mm ID hole for the printer boss.
        translate([0, 0, -1])
            cylinder(d = tube_diameter, h = grip_length + 1.01, $fn = 64);
        // Straight filament bore all the way up; the funnel + PTFE
        // pocket below overrides the top portion.
        translate([0, 0, -1])
            cylinder(d = bore_diameter, h = z_top + 2, $fn = 32);
        _ptfe_receiver_neg();
        _m3_screw_hole();
        _at_pocket() _sensor_local();
        _at_pocket() _m2_pilots_local();
    }
}

// Cap sits inner-face down (Z=0) against the body's mount face; the
// switch pocket opens through the outer face for easy install. Two
// M2 through-holes match the body pilots and the D2F mount-hole
// spacing, so a single pair of screws holds cap + switch + body.
module cap() {
    difference() {
        translate([-cap_length/2, -cap_width/2, 0])
            cube([cap_length, cap_width, cap_thickness]);

        translate([-d2f_length/2, -d2f_width/2, cap_inner_wall])
            cube([d2f_length, d2f_width, cap_thickness - cap_inner_wall + 0.5]);

        translate([0, 0, -0.5])
            cylinder(d = plunger_hole_diameter,
                     h = cap_inner_wall + 1,
                     $fn = 20);

        for (dx = [-d2f_mount_spacing/2, d2f_mount_spacing/2])
            translate([dx, 0, -0.5])
                cylinder(d = m2_clearance_diameter,
                         h = cap_thickness + 1,
                         $fn = 20);
    }
}
