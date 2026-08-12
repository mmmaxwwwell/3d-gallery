include <../lib/collar-tag-lib.scad>;
$fn = 72;

// Multicolor assembly preview. The gallery's build-multicolor-3mf.mjs
// scans top-level color() calls and emits one mesh per color into a
// single 3MF, one filament per object.

color("orange")  body();
color("#a5560a") emboss();
