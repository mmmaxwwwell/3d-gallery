$fn = 64;

fan_length = 161;
fan_od = 98.5;
fan_wall_thickness = 2;
// Base is a circular plate. base_d is the outer diameter; sized so the
// clamp feet (outer edge at r = foot_center_r + foot_footprint/2) sit fully
// on the plate with a few mm of margin.
base_d = 150;
base_thickness = 8;

gap = 0.2;

screw_clearance_d = 4.5;
screw_head_d = 8;
screw_head_depth = 4;

base_gasket_thickness = 1;

fan_gasket_gap = 0.15;
fan_gasket_thickness = 2;

fan_sunk_depth = 3;

fan_taper_z_start = 33.2;
fan_taper_z_end = fan_taper_z_start + 6.5;
fan_taper_d_reduction = 3;

clamp_height = fan_taper_z_end - fan_taper_z_start;
clamp_id_large = fan_od;
clamp_id_small = fan_od - fan_taper_d_reduction;
clamp_wall = 5;
clamp_gap = 0.2;
clamp_top_round_r = 2.5;

m5_passthrough_d = 5.3;
m5_bite_d = 4.2;
m5_head_d = 9.5;
m5_head_h = 3;

// Foot mounting (clamp -> base): N feet around the clamp at angles below.
// Each foot is a half-stadium in plan view: square on the inner (radial)
// half, semicircle on the outer half, both 19 mm radially. The screw
// passes through the center of the semicircle, which is also the local
// origin used by _clamp_foot_block. Total radial extent = foot_footprint.
foot_footprint = 19;
foot_semicircle_r = foot_footprint / 2;
foot_inner_square_len = foot_footprint / 2;
foot_width = foot_footprint;
// Skirt outer wall radius; inner edge of the foot bites this by
// clamp_foot_inward_bite (declared here so foot_center_r resolves cleanly).
clamp_foot_inward_bite = 1;
foot_skirt_r = (fan_od + fan_wall_thickness * 5) / 2;
foot_center_r = foot_skirt_r + foot_inner_square_len - clamp_foot_inward_bite;
foot_angles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
foot_receiver_d = 4.2;

// Perimeter mount screws share the same ring as the clamp foot receivers
// (foot_center_r). screw_inset is derived so they sit at that radius.
screw_inset = base_d / 2 - foot_center_r;

// Cylinder/disk with the top rim rounded by radius r. Flat bottom on the
// bed, vertical sides up to (h - r), then a torus-profile fillet up to a
// flat top of diameter (d - 2r). Used for the base.
module rounded_top_cylinder(d, h, r){
    rotate_extrude(convexity = 4)
        polygon(points = concat(
            [[0, 0], [d/2, 0], [d/2, h - r]],
            [for (i = [0 : $fn/4]) let(a = i * 90 / ($fn/4))
                [d/2 - r + r * cos(a), h - r + r * sin(a)]],
            [[0, h]]
        ));
}

// Truncated cone (d1 at z=0, d2 at z=h) with the top *outer* edge rounded
// by radius r. Bottom and inner bore are sharp; the fillet is tangent to
// the slanted outer wall and to the flat top face. For a narrowing-up
// cone (d1 > d2) the fillet center sits inside the solid, offset r from
// each surface along its inward normal.
module rounded_top_cone(d1, d2, h, r){
    R1 = d1/2;
    R2 = d2/2;
    L  = sqrt((R1 - R2) * (R1 - R2) + h * h);
    // Inward normal of the slanted outer wall = (-h, R2-R1)/L
    // Offset wall point at z=0 in that direction; walk along wall to z=h-r.
    base_off = [R1 - r * h / L, r * (R2 - R1) / L];
    t = (L * (h - r) - r * (R2 - R1)) / h;
    cx = base_off[0] + t * (R2 - R1) / L;     // arc center x (z = h - r)
    // Tangent point on the slanted wall: center + r * outward-normal
    wall_tan = [cx + r * h / L, (h - r) + r * (R1 - R2) / L];
    // Arc sweeps from the wall-tangent angle up to 90° (top tangent).
    a_start = atan2(R1 - R2, h);
    a_end   = 90;
    steps   = max(2, floor($fn / 4));
    rotate_extrude(convexity = 4)
        polygon(points = concat(
            [[0, 0], [R1, 0], wall_tan],
            [for (i = [0 : steps])
                let(a = a_start + (a_end - a_start) * i / steps)
                [cx + r * cos(a), (h - r) + r * sin(a)]],
            [[0, h]]
        ));
}

// Loft a 2D footprint (passed as children) from a flat bottom plate of
// height ~0 up to a top face inset by r and capped with a hemisphere
// trace, producing a flat bottom, vertical sides, and a torus-profile
// fillet along the entire top perimeter. Uses minkowski with a sphere
// for the top trace; the offset(r=-r) produces the inset top footprint.
module rounded_top_extrude(h, r){
    hull(){
        linear_extrude(height = 0.001) children();
        translate([0, 0, h - r])
            minkowski(){
                linear_extrude(height = 0.001) offset(r = -r) children();
                sphere(r = r);
            }
    }
}

// 2D footprint of one clamp foot in its local frame: half-stadium with
// the semicircle pointing in +X (radially outward in world after rotate).
// Origin = center of the semicircle = where the M5 screw passes.
module _clamp_foot_2d(){
    union(){
        // Inner-square half (−X)
        translate([-foot_inner_square_len/2, 0, 0])
            square([foot_inner_square_len, foot_width], center = true);
        // Outer-semicircle half (+X) — full circle; the rectangle hides the inner half
        circle(d = foot_footprint);
    }
}

module airflow_cutout(){
    cylinder(d = fan_od - fan_wall_thickness * 4, h = 10, center = true);
}

module mating_cutout(){
    translate([0, 0, base_thickness])
    difference() {
        cylinder(d = fan_od + gap, h = base_thickness * 2, center = true);
        cylinder(d = fan_od - fan_wall_thickness * 2 - gap, h = base_thickness * 3, center = true);
    }
}

// 8 mounting screws evenly around the perimeter at angles 0/45/90/...,
// inset from the rim by screw_inset. All get M5 passthrough + 10.5×3mm
// counterbore for socket-head bolts.
mount_screw_r = base_d / 2 - screw_inset;
mount_screw_angles = [0, 45, 90, 135, 180, 225, 270, 315];

module screw_hole_positions(){
    for (a = mount_screw_angles)
        rotate([0, 0, a]) translate([mount_screw_r, 0, 0]) children();
}

module screw_holes(){
    screw_hole_positions(){
        cylinder(d = m5_passthrough_d, h = base_thickness * 3, center = true);
        translate([0, 0, base_thickness / 2 - 3])
            cylinder(d = 10.5, h = 3 + 0.1);
    }
}

module foot_receiver_holes(){
    for (a = foot_angles)
        rotate([0, 0, a])
            translate([foot_center_r, 0, 0])
                cylinder(d = foot_receiver_d,
                         h = base_thickness * 3, center = true);
}

// Clamp-pocket geometry: the clamp drops into the base by clamp_interference,
// and the clamp footprint (skirt outer wall + all 8 feet, inflated by
// clamp_pocket_gap for printing clearance) is subtracted from the base top.
clamp_interference = 1;
clamp_pocket_gap = 0.03;

// Full 360° footprint of both assembled clamp halves at the skirt level.
module _clamp_pocket_2d(){
    skirt_od = fan_od + fan_wall_thickness * 5;
    union(){
        circle(d = skirt_od);
        for (a = foot_angles)
            rotate([0, 0, a])
                translate([foot_center_r, 0])
                    _clamp_foot_2d();
    }
}

module clamp_pocket_cutout(){
    pocket_top_z = base_thickness/2 + clamp_pocket_gap;
    pocket_bottom_z = base_thickness/2 - clamp_interference - clamp_pocket_gap;
    translate([0, 0, pocket_bottom_z])
        linear_extrude(height = pocket_top_z - pocket_bottom_z)
            offset(r = clamp_pocket_gap)
                _clamp_pocket_2d();
}

base_top_round_r = 2.5;

module base(){
    difference(){
        translate([0, 0, -base_thickness/2])
            rounded_top_cylinder(d = base_d, h = base_thickness, r = base_top_round_r);
        airflow_cutout();
        mating_cutout();
        screw_holes();
        foot_receiver_holes();
        clamp_pocket_cutout();
    }
}

module base_gasket(){
    difference(){
        cylinder(d = base_d, h = base_gasket_thickness, center = true);
        cylinder(d = fan_od - fan_wall_thickness * 4, h = base_gasket_thickness * 3, center = true);
        screw_hole_positions()
            cylinder(d = m5_passthrough_d, h = base_gasket_thickness * 3, center = true);
    }
}

module fan_gasket(){
    difference(){
        cylinder(d = fan_od + gap - fan_gasket_gap,
                 h = fan_gasket_thickness, center = true);
        cylinder(d = fan_od - fan_wall_thickness * 2 - gap + fan_gasket_gap,
                 h = fan_gasket_thickness * 3, center = true);
    }
}

// Conical clamp ring whose inner surface mirrors the fan taper.
// At z=0 (bottom): ID = clamp_id_large; at z=clamp_height (top): ID = clamp_id_small.
// Outer wall is parallel to the bore so wall thickness stays constant.
module clamp_cone(){
    difference(){
        rounded_top_cone(d1 = clamp_id_large + 2*clamp_wall,
                         d2 = clamp_id_small + 2*clamp_wall,
                         h  = clamp_height,
                         r  = clamp_top_round_r);
        translate([0, 0, -0.1])
            cylinder(d1 = clamp_id_large + 2*clamp_gap,
                     d2 = clamp_id_small + 2*clamp_gap,
                     h = clamp_height + 0.2);
    }
}

// ---- Clamp half (+Y) -------------------------------------------------------
// Parameters local to the clamp; not shared with other parts so kept beside
// the module that uses them.
clamp_ear_size = 14;
clamp_ear_round_r = 3;
clamp_ear_head_inset = 2;
clamp_foot_size = 5;
clamp_foot_head_inset = 3;
clamp_foot_head_d = 10.5;
clamp_skirt_drop = fan_taper_z_start - 4;
clamp_foot_z_center = -clamp_skirt_drop + clamp_foot_size / 2;
// Per-ear hole diameters: x+ ear gets 5.2 (clearance for self-tapping into
// the receiver below), x- ear gets m5_bite_d for thread bite into plastic.
clamp_ear_hole_d_xplus = 5.2;
clamp_ear_hole_d_xminus = m5_bite_d;

clamp_foot_top_round_r = 2;

// Smooth rounded box: hull of 8 spheres of radius r at the corners of a
// box with side s, inset by r so the overall bounding box stays s×s×s.
module _rounded_box(s, r){
    hull()
        for (x = [-1, 1], y = [-1, 1], z = [-1, 1])
            translate([x, y, z] * (s/2 - r))
                sphere(r = r);
}

// Smooth ear + support: one hull spanning the ear box at the top and a
// foot tangent to the skirt outer cylinder below. The bottom spheres are
// placed so their outer surface is externally tangent to the cylinder of
// radius skirt_r (about the Z axis), which means each center sits at
// radial distance (skirt_r + r) from Z.
//   ear_center_x : world X of the ear cube center (+X side).
//   ear_s        : ear cube side length.
//   skirt_r      : outer radius of the skirt cylinder (about Z axis).
//   bottom_z     : world Z at the bottom of the support (skirt bottom).
//   r            : sphere radius (corner fillet).
module _clamp_ear_support_hull(ear_center_x, ear_s, skirt_r, bottom_z, r){
    ear_min_x = ear_center_x - ear_s/2 + r;
    ear_max_x = ear_center_x + ear_s/2 - r;
    ear_y     = ear_s/2 - r;
    ear_min_z = -ear_s/2 + r;
    ear_max_z =  ear_s/2 - r;
    foot_z    = bottom_z + r;
    // For each Y of the foot spheres, solve for cx so that
    // sqrt(cx^2 + cy^2) == skirt_r - r — the sphere sits just inside the
    // skirt outer wall so its outer edge meets the skirt surface (no gap).
    foot_R    = skirt_r - r;
    hull(){
        // 8 ear corners
        for (x = [ear_min_x, ear_max_x],
             y = [-ear_y, ear_y],
             z = [ear_min_z, ear_max_z])
            translate([x, y, z]) sphere(r = r);
        // Support foot: spheres tangent to the skirt outer cylinder
        for (y = [-ear_y, ear_y]){
            cx = sqrt(foot_R * foot_R - y * y);
            translate([cx, y, foot_z]) sphere(r = r);
        }
    }
}

module _clamp_foot_block(angle){
    rotate([0, 0, angle])
        translate([foot_center_r, 0, clamp_foot_z_center - clamp_foot_size/2])
            rounded_top_extrude(h = clamp_foot_size, r = clamp_foot_top_round_r)
                _clamp_foot_2d();
}

module _clamp_foot_screw_cutout(angle){
    rotate([0, 0, angle])
        translate([foot_center_r, 0, clamp_foot_z_center]){
            cylinder(d = m5_passthrough_d,
                     h = clamp_foot_size * 3, center = true);
            top_face_z = clamp_foot_size/2;
            pocket_depth = clamp_foot_head_inset;
            translate([0, 0, top_face_z - pocket_depth])
                cylinder(d = clamp_foot_head_d, h = pocket_depth + clamp_foot_size);
        }
}

module _clamp_ear_screw_cutout(x_sign, head_y_sign){
    bore_h = fan_od + clamp_ear_size * 2;
    hole_d = x_sign > 0 ? clamp_ear_hole_d_xplus : clamp_ear_hole_d_xminus;
    // Head side: hole from y=0 outward through the head-side ear
    translate([x_sign * (fan_od/2 + 8), 0, 0])
        rotate([head_y_sign > 0 ? -90 : 90, 0, 0])
            cylinder(d = hole_d, h = bore_h);
    // Bite side: hole from y=0 outward through the opposite ear
    translate([x_sign * (fan_od/2 + 8), 0, 0])
        rotate([head_y_sign > 0 ? 90 : -90, 0, 0])
            cylinder(d = hole_d, h = bore_h);
    // Head pocket on the chosen Y face, sunk inset deep, extending outward.
    pocket_depth = clamp_ear_head_inset;
    pocket_extrude = pocket_depth + clamp_ear_size * 5;
    inner_y = head_y_sign * (clamp_ear_size/2 - pocket_depth);
    translate([x_sign * (fan_od/2 + 8), inner_y, 0])
        rotate([head_y_sign > 0 ? -90 : 90, 0, 0])
            cylinder(d = m5_head_d, h = pocket_extrude);
}

// The +Y half of the two-piece conical clamp. Mirror in slicer (or with
// mirror([0,1,0]) in a derived file) to get the other half.
//   - Clamp ring at z = 0..clamp_height with its conical bore for the fan taper.
//   - Skirt extending from z = 0 down to z = -clamp_skirt_drop, wrapping the
//     fan body and ending flush with the base top face when assembled.
//   - 8 feet around the skirt bottom at foot_angles, with vertical M5
//     passthroughs that align with foot_receiver_holes() in the base.
//   - 2 ears at ±X (kept in +Y) bolted together to clamp the two halves.
module fan_clamp_half(){
    intersection(){
        // Keep the +Y half (split along the X axis at y=0)
        translate([-fan_od, 0, -clamp_skirt_drop - 1])
            cube([fan_od * 2, fan_od, clamp_skirt_drop + clamp_height + 2]);
        difference(){
            union(){
                // Conical clamp ring (bore subtracted below) with the
                // top outer rim rounded by clamp_top_round_r.
                rounded_top_cone(d1 = clamp_id_large + 2*clamp_wall,
                                 d2 = clamp_id_small + 2*clamp_wall,
                                 h  = clamp_height,
                                 r  = clamp_top_round_r);
                // Ears + integrated support: one smooth sphere-hull per
                // side spanning the ear box and a foot against the skirt
                // outer wall below.
                for (mir = [0, 1]){
                    mirror([mir, 0, 0]){
                        _clamp_ear_support_hull(
                            ear_center_x = fan_od/2 + 8,
                            ear_s        = clamp_ear_size,
                            skirt_r      = foot_skirt_r,
                            bottom_z     = -clamp_skirt_drop,
                            r            = clamp_ear_round_r);
                    }
                }
                // Bottom skirt (inner bore subtracted below)
                translate([0, 0, -clamp_skirt_drop/2])
                    cylinder(d = fan_od + fan_wall_thickness * 5,
                             h = clamp_skirt_drop, center = true);
                // Feet around the skirt
                for (a = foot_angles)
                    _clamp_foot_block(a);
            }
            // Conical bore through the clamp ring
            translate([0, 0, -0.1])
                cylinder(d1 = clamp_id_large + 2*clamp_gap,
                         d2 = clamp_id_small + 2*clamp_gap,
                         h = clamp_height + 0.2);
            // Inner cylinder bore through the bottom skirt
            translate([0, 0, -clamp_skirt_drop/2])
                cylinder(d = fan_od,
                         h = clamp_skirt_drop + gap / 2, center = true);
            _clamp_ear_screw_cutout( 1,  1);
            _clamp_ear_screw_cutout(-1, -1);
            for (a = foot_angles)
                _clamp_foot_screw_cutout(a);
        }
    }
}
