# servo-duct-manifold

A kit of airflow modules for 100 mm dryer duct. They all join with one twist
joint: a plug turns 20° into a socket, a ramp pulls it onto a TPU liner, and
a printed key holds it. Published (no longer `devOnly`), though no joint,
servo or duct has been test-fitted yet. Customizable, with `schema.ts`. It has ten
`builds`:

- polar: y, y-all, x4
- inline
- cubic
- iris
- sensors: th, voc, flow
- run

The slug is historical. The title is "Duct Airflow Modules".

## History

- 2026-09-27: redrawn from scratch as servo butterfly valves on a polar hub,
  with a 4-bolt flat flange. The user's earlier attempt, in
  `~/git/printer/openscad/extras/butterfly valve manifold/`, used a
  third-party STL with no license, so nothing derives from it.
- 2026-09-28: the user asked for a system of modules and said "keep what we
  have". They asked for:
  - the twist joint, with the rotation compressing the seals and a clip to
    stop it turning back
  - 8 optional M3 cap screws with a thread-or-nut option
  - a cubic manifold of 1U cubes, laid out by cell ranges with faces picked
    for ports
  - polar as one layout algorithm fed to a generic hub
  - an iris valve
  - sensors: mass airflow, temperature/humidity, TVOC, "any cheap board you
    can screw in"

  The flat flange survives as `joint = "bolt"`, for the hub, the butterfly
  valve and the spigot adapter only, and renders byte-for-byte what it did.
  Everything else assumes `twist`.

## The joint (read before touching any port)

Every port is drawn in a **port frame**: joint face at z = 0, +z out of the
part.

- `frame(p, d, lug)` builds one: +y along the lug axis, +x = y × z.
- `mate(m, f)` places a part so its frame `f` meets frame `m` locked:
  `F = M · flip_x`.
- Plugs and sockets both have lugs at ±y and key notches at ±x.
- The plug turns +twist about its own z to lock, which is clockwise seen
  from the plug's side.

Printability, not taste, drives nearly every detail. What holds 45° depends
on the port's tilt t in the print pose:

- **Lug axis level.** A port tilted 45° must have its lugs level
  (`level_lug(d)`). Hook faces within ~65° of downhill overhang. With lugs
  level, both plug and socket print at t = 0, 45 and 135, and the socket
  also on the bed.
  - Hook faces are 50° and lug tops 55° off the joint plane, not 45°, for
    margin at 0° and 45°.
  - The socket's slots are the lug swept along the ramp by chained hulls
    (`_socket_slots`), clipped at the bore.
- **The seal floor depends on tilt.** A 45° cone floor on a socket tilted
  45° has a generator pointing straight down. So:
  - Only on-bed sockets get the cone (`floor = "cone"`, the default).
  - Every other socket gets `floor = "flat"`: the coupler's top and every
    cube socket.
  - The plug tip has both a 1.2 mm flat land and a 45° chamfer
    (`tip_c`), so one plug seals in either kind of socket.
- **Plugs are never on the bed.** The shoulder would be a ceiling. Every
  module is therefore socket at the bottom, plug on top. The trunk valve in
  y-all hangs by its plug.
- **The flange back depends on the port.** `back = "cone"` for an upright
  plug or socket, where the flange would overhang. `"flat"` on the bed or
  at 45°. `"none"` inside a cube wall.
- **Pockets.** Screw-head and nut pockets that print facing down get a
  45° roof, measured at the corners, via `_pocket`.
  - `_pocket` is **one rotate_extrude solid**. A cylinder plus a separate
    cone cut, with coincident faces, silently failed to cut in Manifold
    when siblings like the slots were in the same difference.
  - Leave it as one solid.
- **Screws.** Heads go in the socket's counterbore; the plug is the thread
  side.
  - Cube sockets get none, since the heads would be inside the cube.
  - Modules drop the spots a hex key can't reach past their own bosses:
    `valve_socket_spots` and `spots_clear_of()`.
- **Two notch pairs.** Two lugs lock at either half turn, and one notch
  pair would make one of them unkeyable. That's what stops two 45° elbows
  being a 90° bend.

### Proven numbers (redo them if the joint changes)

- Plug in socket at lock: 0.00 mm³ PETG overlap.
- 0.3 mm deeper: 1479 mm³. The faces are the hard stop.
- Turned −10°: 104 mm³, which shows the sweep test is sensitive.
- Insertion path, entry → 20° → 4° → lock, lift following `_ramp`: PETG
  overlap 0 throughout.
- TPU squeeze ramps from 0 at entry to 0.4 cm³ at lock.

## Modules

- **Tube, elbow, duct plug, spigot adapter, coupler.**
  - The elbow's plug is at 45° with a flat back. Its bend is
    `rotate_extrude(angle = 45)` through a hand-built frame.
  - `run` is a chain of modules through `run_at(i)`. The second elbow has
    turn 180, and the two make exactly 90°: end direction [1, 0, 0] from
    [0, 0, 1].
- **Butterfly valve.** Its internals are unchanged since 2026-09-27.
  - With `twist` the disc sits above the socket (`valve_base`).
  - The top is a plug whose flange cone flares out right over the coupler
    cavity, so it is the cavity's 45° roof.
  - A slot through the flange at +x lets the coupler down. Lower it with
    its key tip outside x = `boss_face`; at x = 50.4 it grazes the bracket.
- **Iris.** Built by a helper agent and checked:
  - 9 blades, designed shut. Each is an annulus about O′, swung open about
    its pivot, and carved clear of every other blade's pivot and pin path.
  - The ring turns a third of the 75° swing.
  - The SG90 stands upright beside the housing, 118 mm off axis, with an
    arm pin in a radial slot on the ring's tab. That is 117° of servo.
  - Shut, it uncovers exactly the 6 mm centre hole (112.6 mm²). Open, no
    blade enters the bore.
  - The servo tower's web closes the body socket's +x key notch. The −x
    pair still works.
  - `iris_n`, the band and the pivot radius are derived but were only
    verified at 100 mm duct.
- **Sensors.**
  - Section: a pad on +x and a window, the board's size less the lip,
    peaked at 45°.
  - Cap: prints face up so the TPU bead is on top. The board clamps
    between the pad and a pocket ledge on three edges, open at the header
    edge. Its pocket is 0.2 shallower than the board.
  - Board sizes come from a research pass (Adafruit sizes exact, from their
    EAGLE files; clones ±0.5 mm). XGZP breakouts have no drawing, hence
    the tray with cable ties.
  - Venturi: 21° in, 15° out, inlet at the bottom.

## Cubic manifold

- Cells expand from boxes in list order, with duplicates dropped. Each cell
  after the first twists onto its parent, the first earlier cell it
  touches. The parent has the plug, the child the socket.
- The asserts forbid loops: a cell touching anything but its parent and
  children.
- Every cell prints standing on an edge along `cube_axis`, the one axis no
  joint uses. Its joints' lugs point along it, and socket lugs point the
  other way (`cell_joint_m`) so the notches meet.
- `_cell_roll` picks which of the 4 edges is the foot: one with no plug on
  the two faces that point down.
- Everything inside the cube, bosses included, is trimmed to the chamfered
  envelope. Only the plug spigots stand outside it, clipped to a cylinder
  round the spigot.
  - An earlier box clip at z = 0 left a zero-thickness flange sheet. CGAL
    called it non-manifold, and it stuck out of the foot.
- The gallery needs one module name per part, so `cubic_cell_1..4` are
  wrappers. A layout with more cells needs more wrappers and part files.

## Verification done (repeat after geometry changes)

The harness lives in the session scratchpad, not the repo. Any repeat needs:

- a pure-Python STL overhang scan: downward faces more than 45° off
  vertical, above the bed
- `intersection()` volumes
- an insertion sweep

Checks done:

- Overhang scan clean for every part, alone and unioned with its gasket, at
  default params. Also checked:
  - hub at 4 ports
  - `m3_grip = nut`
  - every `sensor_board`
  - cube cells 1–4
- Gasket against its part: 0 volume. A liner's underside rests on PETG, so
  scan it unioned with its part.
- Interference, all 0:
  - every polar build (hub, valves, servos, adapters)
  - cubic cells with each other and with valves, servos and the duct plug
  - neighbouring valves on the cube
  - the run, module by module
  - the sensor cap on its section
  - the tray on the venturi
  - tube → iris → valve
- Valve: coupler lowered through the top flange's slot, pushed to flush,
  seated; disc slid in edge-on past it; disc at 0/45/90°.
- `joint = "bolt"` hub, valve and adapter match the originals (volume,
  triangles, bbox).
- Every part and preview renders with `--backend CGAL`, the customizer's
  engine.
- `tests/build/param-schemas.test.mjs` passes; `validateManifest` accepts
  the manifest.

## Open

- Nothing has been printed. Unmeasured, to test-fit:
  - `fit`
  - `gasket_squeeze`, and how hard the twist is by hand: the TPU liner is
    scrubbed as the plug turns
  - the key's snugness
  - `servo_horn_face`
  - the iris blades' shingling
- With `branch_tilt` under 45 a branch's flat flange back overhangs more
  than 45°. The same was true of the original bolt flange.
- Particulate sensors (PMS5003, SPS30) were left out. Both makers say to
  keep them out of the flow, so they need a bleed pocket, not a window.
- Fingerprinted in `tests/build/baseline.json`. Re-capture with
  `npm run test:build:baseline` after an intentional change.
