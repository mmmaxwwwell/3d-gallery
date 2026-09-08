// BEGIN_PARAMS
// Outer diameter (mm) — outer bound of the disc rim. Bump tips reach this
// diameter exactly when knurl_depth == knurl_base_offset. If knurl_depth
// exceeds knurl_base_offset the tips get clipped flat by the fillet at
// this diameter; if smaller, the tips fall short of the rim.
outer_diameter = 26;

// Overall height of the cap (mm)
thickness = 17.3;

// Solid material left above the central cutout (mm) — the flat top face
top_cap_thickness = 1;

// Fillet radius on the top and bottom outer edges (mm)
fillet_radius = 8;

// Diamond pitch (mm) — diagonal length of each raised diamond on the rim
knurl_size = 2;

// Radial height of each diamond bump above the base cylinder (mm)
knurl_depth = 3;

// Radial inset from outer_diameter/2 to the base cylinder under the bumps
// (mm). Kept independent of knurl_depth so the base cylinder doesn't
// shrink as bumps get taller (which would otherwise leave bumps sitting
// on a spindly core once knurl_depth grows past ~3 mm).
knurl_base_offset = 3;

// Central "circle + plus" cutout — circle diameter (mm)
cutout_diameter = 12;

// How far each "+" arm reaches past the circle rim (mm)
cross_extension = 1.5;

// Width of each "+" arm (mm)
cross_width = 1.85;

// Bottom pocket diameter (mm) — larger cylindrical bore from the underside
bottom_pocket_diameter = 14.1;

// Logo size — length in mm of the logo's longer side after scaling
logo_target_size = 8;

// Logo engraving depth (mm) — how deep the recess (and multicolor inlay)
// sits below the top face
logo_engrave_depth = 0.4;
// END_PARAMS

// Bottom pocket depth (mm) — hidden from the customizer.
bottom_pocket_depth = 4.8;
// Kanix logo geometry — hidden from the customizer. Lives in
// lib/logo-polygon-data.scad as pre-baked polygon points/paths (potrace-
// traced from assets/logo.svg then flattened to polylines). Using
// polygon() rather than import() means the WASM customizer can render the
// engraved cap and multicolor inlay without needing the SVG in its
// virtual filesystem.
// Bbox is measured in the polygon data's own coordinate space and used
// only to center-and-scale the logo — the final rendered size is
// governed by `logo_target_size` (mm). Re-measure and update if
// logo-polygon-data.scad is regenerated.
include <logo-polygon-data.scad>;
logo_bbox_w = 398.971;
logo_bbox_h = 363.034;
logo_bbox_cx = 200.233;
logo_bbox_cy = 182.117;

eps = 0.01;

// Public entry point — plain cap, no engraving.
module tactile_aide(kd = knurl_depth, bo = knurl_base_offset) {
    _filleted_disc() {
        difference() {
            union() {
                linear_extrude(height = thickness)
                    circle(r = outer_diameter / 2 - bo, $fn = 96);
                _knurl_bumps(kd, bo);
            }
            _cutouts_3d();
        }
    }
}

// Public entry point — cap with the logo engraved into the top face.
module tactile_aide_engraved(kd = knurl_depth, bo = knurl_base_offset) {
    difference() {
        tactile_aide(kd, bo);
        _logo_solid();
    }
}

// The inlay piece that fills the engraved recess — for the multicolor
// 3MF preview. Intersected with the plain (non-engraved) tactile_aide()
// so the inlay's outer edges follow the disc's fillets rather than
// hanging over them.
module logo_inlay(kd = knurl_depth, bo = knurl_base_offset) {
    intersection() {
        _logo_solid();
        tactile_aide(kd, bo);
    }
}

// Extruded 2D logo positioned just below the top face. Extruded slightly
// past the top so subtracting it leaves a clean top edge.
module _logo_solid() {
    translate([0, 0, thickness - logo_engrave_depth])
        linear_extrude(height = logo_engrave_depth + eps)
            _logo_2d();
}

// Logo scaled so the longer side is `logo_target_size` mm, centered on
// the origin using the *measured* bbox center. Y-axis is flipped so the
// logo reads right-side-up (source SVG was y-down, potrace/polygon data
// carries the same convention; OpenSCAD is y-up).
module _logo_2d() {
    s = logo_target_size / max(logo_bbox_w, logo_bbox_h);
    scale([s, -s, 1])
        translate([-logo_bbox_cx, -logo_bbox_cy, 0])
            polygon(points = logo_points, paths = logo_paths);
}

// Raised diamond bumps arranged in a staggered grid around the rim.
// Bumps sit on a base cylinder of radius `outer_diameter/2 - bo` (where
// `bo` = knurl_base_offset, independent of bump height) and rise `kd`
// outward. When kd == bo the tips land exactly at `outer_diameter/2`.
// Both the circumferential and axial half-diagonals stretch with `kd`
// (see `_bump_half`) so every face angle on the bump stays at ≤ 45° from
// vertical — printable without support in either print orientation
// (axis-vertical or axis-horizontal). Alternate rows are offset half a
// column so bumps tile in a diamond lattice.
module _knurl_bumps(kd = knurl_depth, bo = knurl_base_offset) {
    r_base = outer_diameter / 2 - bo;
    d = _bump_half(kd);
    n_cols = max(4, round(2 * PI * r_base / (2 * d)));
    dtheta = 360 / n_cols;
    n_rows = floor(thickness / d) + 2;
    for (row = [0 : n_rows]) {
        z = row * d - d;
        theta_off = (row % 2) * dtheta / 2;
        for (col = [0 : n_cols - 1]) {
            theta = col * dtheta + theta_off;
            rotate([0, 0, theta])
                translate([r_base - eps, 0, z])
                    _diamond_bump(kd);
        }
    }
}

// Half-diagonal of one diamond bump — used for BOTH the circumferential
// and axial directions so the bump stays square in the rim's tangent plane.
// Never less than `knurl_depth`, so the slope from any base corner up to
// the apex stays at ≤ 45° (rise/run of knurl_depth / d ≤ 1). At default
// `knurl_size/2 ≥ knurl_depth` the bump matches the visual pitch
// (`d = knurl_size/2`); when depth exceeds that the bump stretches in
// both directions together.
function _bump_half(kd = knurl_depth) = max(knurl_size / 2, kd);

// A single 4-sided pyramid pointing +X. Base is a square diamond in the
// Y-Z plane with half-diagonal `_bump_half()`. Apex sits `knurl_depth`
// outward. Base is triangulated (not a raw quad) so CGAL doesn't reject
// it as non-planar under numerical noise.
module _diamond_bump(kd = knurl_depth) {
    d = _bump_half(kd);
    tip = kd + eps;
    polyhedron(
        points = [
            [0,  0, -d],
            [0,  d,  0],
            [0,  0,  d],
            [0, -d,  0],
            [tip, 0, 0],
        ],
        faces = [
            [0, 1, 4],
            [1, 2, 4],
            [2, 3, 4],
            [3, 0, 4],
            [3, 2, 1],
            [3, 1, 0],
        ],
        convexity = 2
    );
}

// The two stacked bores through the cap: the "circle + plus" runs from the
// bottom face up to `thickness - top_cap_thickness` (leaving `top_cap_thickness`
// of solid material as the cap's top face), and a wider plain cylinder
// `bottom_pocket_depth` deep opens the underside to `bottom_pocket_diameter`.
module _cutouts_3d() {
    translate([0, 0, -eps])
        linear_extrude(height = thickness - top_cap_thickness + eps)
            _knob_cutout_2d();
    translate([0, 0, -eps])
        cylinder(d = bottom_pocket_diameter,
                 h = bottom_pocket_depth + eps,
                 $fn = 64);
}

// 2D "circle + plus" cross-section.
module _knob_cutout_2d() {
    arm_length = cutout_diameter + 2 * cross_extension;
    union() {
        circle(d = cutout_diameter, $fn = 64);
        square([arm_length, cross_width], center = true);
        square([cross_width, arm_length], center = true);
    }
}

// Fillet the top-outer and bottom-outer edges of a 3D disc body.
module _filleted_disc() {
    intersection() {
        children();
        rotate_extrude($fn = 96) _fillet_profile_2d();
    }
}

// Explicit polygon for the fillet bounding r-z cross-section — using an
// arc + straight segments rather than `offset(r=+f) offset(r=-f) square()`,
// because that idiom produces near-axis vertices that crash rotate_extrude
// → CGAL in the customizer.
// The bottom edge fillet is automatically capped so the outer rim stays
// flat on the print bed even when the top fillet is large. Without this
// cap, a big `fillet_radius` combined with the cutouts (cross-plus arms
// reach cutout_diameter/2 + cross_extension; bottom pocket reaches
// bottom_pocket_diameter/2) would eat the entire z=0 face, and the
// slicer would report an empty first layer.
module _fillet_profile_2d() {
    r_max = outer_diameter / 2;
    fr_top = fillet_radius;
    fr_bot = _bottom_fillet_radius();
    n = 16;
    arc_br = [
        for (i = [0 : n])
            let (a = -90 + 90 * i / n)
            [r_max - fr_bot + fr_bot * cos(a), fr_bot + fr_bot * sin(a)]
    ];
    arc_tr = [
        for (i = [0 : n])
            let (a = 0 + 90 * i / n)
            [r_max - fr_top + fr_top * cos(a), thickness - fr_top + fr_top * sin(a)]
    ];
    polygon(concat(
        [[0, 0]],
        arc_br,
        arc_tr,
        [[0, thickness]]
    ));
}

// Largest bottom fillet that still leaves at least `min_bottom_rim` mm of
// solid annular material on the print bed, given the biggest cutout that
// reaches down to z=0 (cross-plus arms and the bottom pocket both do).
// Clamped to the user-facing `fillet_radius` at the top so setting a
// small fillet still gives a small bottom fillet, not a bigger one.
min_bottom_rim = 0.5;
function _bottom_fillet_radius() =
    let (max_cutout_r = max(cutout_diameter / 2 + cross_extension,
                            bottom_pocket_diameter / 2))
    let (safe = outer_diameter / 2 - max_cutout_r - min_bottom_rim)
    max(0, min(fillet_radius, safe));
