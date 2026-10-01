# telescoping-mast

A print-in-place telescoping mast: `sections` round tubes printed nested, collapsed, all standing on the bed. `devOnly` until a print proves the gaps.

## How the tubes nest

Every tube is a plain round tube of `wall`, so each bore is round and smooth over its whole length. Nothing keys the tubes, so a section turns anywhere along its travel. That's what lets the lock live in two short places rather than in flutes or channels that would have to clear every tube inside them:

- **Inner tube's foot** (`skirt`): thickened *outward* to fill the outer tube's bore to within `gap`, for `skirt_length`. It is the joint's bearing, and its 45° shoulder is the pull-out stop. Three **lugs** sit above it, reaching the same radius.
- **Outer tube's top** (`teeth`): three teeth reach *inward* by `reach = gap + catch_depth`, to `gap` short of the next tube's body. Each tooth is a post, a dip, and a post, and the posts stand `lock_drop` higher than the dip.

Radii step by `tube_step = wall + 2·gap + catch_depth` per tube. Thickening goes outward on a foot and inward on a top, and those never meet: a collapsed inner tube's foot is at the bottom of the outer tube, and its plain body is at the top. Keep it that way. A feature that pokes into the gap anywhere else along a tube's length collides with the next tube as it slides.

Lugs print at the gap angles (`lock_turn` = 60° off the teeth), so a straight pull passes them between the teeth. `lug_z` is derived so that at the stop the lugs clear the posts by `turn_clearance`. `lock_rise` is how far a seated section stands above its outer one, and `stop_rise` is the stop.

Every slope is 45°: tooth underside and top, lug underside and top, skirt shoulder, thread flanks (`thread_angle = 90`), and the inward taper under the top thread. Lugs and teeth mate cone on cone.

## Threads

- The outer tube's foot (`foot_thread`) has an outward male thread. Nothing is outside tube 0, so it can grow.
- The inner tube's top (`top_thread`) has a male thread with its major diameter flush with the tube, cut into a wall thickened inward. It has to stay flush, because the next tube's teeth sit `gap` off its body when collapsed.
- `coupler` has a female thread for each, from BOSL2's `trapezoidal_threaded_rod(internal = true)` with `$slop = thread_slop`. BOSL2 phases a thread from the rod's centre, so a clash test that just stacks the parts can report a clash that a real screw-in wouldn't. Sweep the rotation before you believe it.

## Checking clearances

There are no build tests yet (devOnly). Check a geometry change by intersecting `tube(i)` with `translate([0,0,rise]) rotate([0,0,turn]) tube(i+1)` using the Manifold backend. Use numeric `-D` values: lib variables aren't in scope for `-D` expressions, and an undefined translate renders as empty, which looks like a pass. These should be empty:

- collapsed (0, 0)
- mid-travel
- just below `stop_rise`, unturned, at −30°, and at −60°
- `lock_rise` at −60°

These should clash: just above `stop_rise`, `lock_rise` turned only 45°, and below `lock_rise`.

## Not done yet

- Antenna mount on the top thread.
- A base for the foot thread.
- Print estimates: the part is too tall for the estimator's Adventurer 5M profile.
