# servo-duct-manifold

Servo butterfly valves + manifolds for 100 mm dryer duct. `devOnly: true`
until the user test-fits a servo and a duct. Customizable, with `schema.ts`,
and four `builds` (y, y-all, x4, inline) that differ only in `ports` /
`valved_ports`.

## Where it came from

The user's earlier attempt is in `~/git/printer/openscad/extras/butterfly valve manifold/`:

- a 3-port hub that `import()`ed a downloaded butterfly-valve `Tube.stl`
- a crown-gear servo coupler
- a wall plate

That STL is third-party with no license, so nothing here derives from it:
everything was redrawn from scratch on 2026-09-27. The user chose:

- all three topologies (inline, N valved + 1 open, all valved)
- SG90
- direct coaxial drive, not the crown gear
- a spigot plus a bolt flange on every port

The wall plate and the ESP32 controller box were left out of scope.

## Geometry (why it's shaped this way)

- **One flange everywhere.** `flange()` is drawn joint-face-down with hex
  pockets on its back. Mating flanges are mirror images across the joint, and
  the 4 bolts on the diagonals are symmetric under that mirror.
  - The diagonals are also what keeps the bolts clear of the servo bracket
    (+x) and the pivot boss (−x). **Don't make the bolt count a param**
    without re-checking that.
  - M3 × 10 = 2 × (flange − pocket) + nut, exactly flush.
- **Hub frames.** `port_out(i)` is joint face at the origin, +z out of the
  hub. `port_in(i)` flips it, giving the frame `flange()` is drawn in.
  - Port 0 is the trunk, standing on the bed. Branches leave the trunk axis
    at `junction_z`, leaning `branch_tilt` out.
  - Branch bores start exactly at the junction, where together they cover the
    top of the trunk bore, so it never gets a ceiling. Every hub surface then
    overhangs by exactly `branch_tilt`, hence the assert `≤ 45`.
  - `junction_z` and `port_len` are **derived, not params**: hex-key room
    over the trunk bolts, and each branch flange's bolts clear of the
    neighbouring tube. The bed-fit assert limits ports to 4 at 100 mm.
- **Disc.** It prints flat with the rib on top, so the turning axis sits
  `hub_axis` above the disc's face.
  - Intersecting it with a sphere of `disc_r` about the axis makes it clear
    the bore at any angle.
  - The same property lets it slide down the bore edge-on.
  - Drive socket (+x) is a diamond. Idle socket (−x) is a teardrop for the
    M3 shank.
- **Coupler.** Printed head-down, so the horn pocket's floor is a 45° gable.
  - The head is only `horn_width + 2·fit + 2.4` wide. That's what lets the
    notch pass it between the servo's tab holes.
  - The cavity is shallower than the coupler is long, so assembly depends on
    the notch. The order is in README "Assembling a valve".
  - The key also sits flush in the wall bore while the disc goes in.
- **Servo.** Long axis across the tube (y), body toward −y. The tab plate is
  at `plate_out`, derived from `servo_horn_face`.
  - The cutout is peaked at 45°. The notch runs down the plate on the shaft
    line to `notch_bottom`, and the cavity is open at the top.
  - `sg90()` is a reference stand-in only. Its tower stops 3.5 mm under the
    horn arm, to allow for the horn's hub boss.

## Verification done (repeat after geometry changes)

- STL overhang scan: no downward face steeper than 45° off vertical, above
  the bed, on any part (hub at 3 and 4 ports). The spigot beads sit at
  exactly 45°.
- Interference, all zero-volume:
  - disc and coupler against the body at 0/±45/±90°
  - coupler against the horn and servo at matched angles
  - hub against valves and adapters in every build
  - neighbouring valves and servos on 3- and 4-port hubs
- Insertion sweeps, both clear:
  - the coupler lowered through the notch, pushed to flush, then seated
  - the disc lowered edge-on past the flush coupler
- All four builds render via the forge (Manifold). Every part and preview
  also renders with `--backend CGAL`, the customizer's engine.

## Open

- `servo_horn_face`, the horn dimensions, and the duct slip fit on the
  100 mm spigot are unmeasured. They come from datasheets and conventions.
- No baseline fingerprints: devOnly models are excluded. Once it ships,
  run `npm run test:build:baseline`.
