include <../lib/fixture-cube-lib.scad>;
$fn = 16;

// Hex colour literals, which OpenSCAD does not resolve to a vector when the
// source is compiled directly. The CLI path regex-scans for these; the WASM
// engine discovers them by echoing str(c). Both must handle the hex form.
color("#3a7ad9") box();
color("#d65f9a") translate([0, 0, size]) lid();
