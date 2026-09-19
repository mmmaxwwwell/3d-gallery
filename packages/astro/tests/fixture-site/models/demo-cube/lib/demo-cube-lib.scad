// Minimal model for the Astro integration test. Kept trivial so `astro build`
// in CI spends its time on the integration, not on CSG.

// BEGIN_PARAMS

// Edge length (mm).
size = 10;

// Bevel the top edge.
beveled = false;

// END_PARAMS

module demo_cube() {
  if (beveled) {
    hull() {
      cube([size, size, size * 0.6]);
      translate([1, 1, 0]) cube([size - 2, size - 2, size]);
    }
  } else {
    cube([size, size, size]);
  }
}

// Declared in the manifest but never placed on a page, so the test can tell
// `prerender: 'referenced'` apart from `prerender: 'declared'`.
module demo_lid() {
  cube([size, size, 2]);
}
