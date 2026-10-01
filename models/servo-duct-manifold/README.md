# Duct Airflow Modules (100 mm)

A kit of airflow modules for 100 mm (4") dryer duct. It pulls exhaust, and a
slight vacuum, from printer enclosures and picks which run the fan draws on.
Every module joins every other the same way, so you build a system out of
them: tubes, elbows, valves, manifolds and sensors.

## The joint

Each module has a **socket** at one end and a **plug** at the other.

1. Line the plug's two lugs up with the two openings in the socket's rim,
   20° short of where they lock, and push it in.
2. Turn the plug-side piece **clockwise, seen from its side of the joint**,
   by 20°, like tightening a screw. The lugs ride a ramp that pulls the plug
   in 0.8 mm, and its tip presses into the TPU liner in the socket's floor.
   The last 4° are flat, so it stays locked.
3. Drop the printed **key** (`clip.stl`) into the notch in the rims. The
   notches only line up once the plug has turned home, and while the key is
   in, the joint can't turn back.
   - There are notches on both sides, because the two lugs lock at either
     half turn. Use whichever pair lines up.

For a joint that has to take load, add M3 × 10 cap screws. There are eight
spots round each joint. The head goes in the socket's counterbore and the
screw threads into the plug. `m3_grip` picks what it bites into:

- `thread` (default): a 2.5 mm pilot it cuts its own thread in.
- `nut`: a clearance hole with an M3 nut in a hex pocket. Use M3 × 12 for
  this.

A cube cell's own sockets have no screw spots, because the heads would be
inside the cube.

The liners are TPU 75A, printed in place with the part that holds them, so
the sockets need a multi-material printer (the Snapmaker U1). The key and
every other part are plain PETG.

## Modules

| Module | Parts | Notes |
|---|---|---|
| Straight tube | `tube` | `tube_length` joint face to joint face |
| 45° elbow | `elbow-45` | Two make a 90° bend, the second locked a half turn round |
| Duct spigot on a socket | `spigot-adapter` | End of a run: the duct slides over it, hose clamp behind the bead |
| Duct spigot with a plug | `duct-plug` | Start of a run, or to close a socket with a duct |
| Socket coupler | `socket-coupler` | Joins two plugs |
| Butterfly valve | `valve-body`, `valve-disc`, `valve-coupler` | SG90 on the disc's axis |
| Iris valve | `iris-body`, `iris-blade` ×9, `iris-ring`, `iris-lid`, `iris-arm` | SG90 turns the blade ring through an arm |
| Polar manifold | `hub` | A trunk socket with 2–5 plug branches leaning out 45° |
| Cubic manifold | `cube-cell-N` | Cells laid out on a grid, a plug or socket on any face |
| Sensor section | `sensor-section`, `sensor-cap` | Holds a breakout board against a window into the duct |
| Venturi flow section | `venturi`, `sensor-tray` | Pressure taps for a differential pressure sensor |

Every part with a socket has a `-gasket` part beside it: its TPU liner, in
the same frame, to print with it.

## Builds

| Build | What |
|---|---|
| 3-port hub, 2 valves (default) | Polar hub, a valve on each branch, a duct on the trunk |
| 3-port hub, all valved | The trunk valve hangs upside down on its own plug |
| 4-port hub, 3 valves | |
| Inline valve | One butterfly valve with a duct end each side |
| Cubic 1 × 4, 4 valves | Four cube cells in a row, a valve on each top, a duct socket in the end |
| Iris valve | |
| Temperature / humidity sensor | Sensor section with a GY-BME280 |
| VOC sensor | Sensor section with an ENS160 + AHT21 |
| Airflow (venturi) | Venturi section and the pressure sensor's tray |
| A run of modules | Duct plug, tube, sensor, venturi, two elbows making 90°, duct spigot |

## Cubic manifold

Lay the cells out in `cubic_cells` as boxes, six numbers per box: the
corners `x0, y0, z0, x1, y1, z1`, counted in cells. `0, 0, 0, 0, 3, 0` is
four cells in a row along y. A cube is `cube_u` on a side (135 mm at
100 mm duct), just big enough for a joint to sit on its face.

Put ports on the outside faces in `cubic_ports`, five numbers per port:
the cell's `x, y, z`, the face (`1` = +x, `-1` = −x, `2` = +y, `-2` = −y,
`3` = +z, `-3` = −z), and `1` for a plug or `0` for a socket. The default
puts a plug on each cell's top and a socket in the −y end.

Each cell prints on its own and twists onto the first earlier cell it
touches. That cell carries the plug and the new one the socket. So:

- **Assembly order is the order of `cubic_cells`.** Each new cell goes on
  before anything else is attached to it.
- **No loops.** A cell can only touch the cell it twists onto and the ones
  twisting onto it. A 2 × 2 block can't be assembled, because the last cell
  couldn't turn.
- **Two axes at most.** A cell prints standing on an edge, so every face
  with a joint sits at 45°. The edge runs along the one axis no joint in
  the manifold uses.
- **No plugs on opposite faces of one cell.** Two faces point down as it
  stands, and a plug there would stand below the edge it prints on.

The lib's asserts name the cell that breaks a rule.

## Polar manifold

The hub is a trunk socket pointing down and `ports − 1` plug branches
leaning `branch_tilt` out of vertical, spread evenly round it. It prints
standing on its trunk socket. Branch length and junction height are solved
so a hex key reaches every screw. Where the branches point comes from one
layout function (`polar_cone`), so a different arrangement is a different
function.

## Sensors

The sensor cap holds a breakout board in a pocket, sensor side to the duct
and header edge down. The window in the section's pad is the board's size
less a 1 mm lip, and when the cap is screwed on, the board is clamped
between that lip and a ledge in the pocket on three edges. No board screws
are needed, and cheap clones' holes don't matter.

- `sensor_board` picks the board: `bme280` (GY-BME280), `aht20_bmp280`,
  `sht31` (GY-SHT31-D), `sgp30` (GY-SGP30), `ens160_aht21`, `adafruit`
  (any 1" × 0.7" STEMMA QT board: SHT4x, SGP30, SGP40, AHT20), or
  `custom` with `board_custom = [length, width]`.
- Solder the header or wires on the back of the board. Pins on the front,
  at the header edge, sit below the window.
- The wire leaves through a 5 mm hole in the bottom of the cap. Seal it
  round the cable with a dab of silicone, or the duct's vacuum draws air
  in there.
- A TPU bead in the cap's face seals it to the pad. Four M3 × 12 cap screws
  hold it.

Clone boards have no drawings. The sizes are from community footprints and
photos, ±0.5 mm. Measure yours, and if it's off use `custom`.

### Airflow

The venturi narrows the 94 mm bore to a `venturi_throat` of 65 mm at 21°, then
opens back out at 15°. Print and fit it with the **inlet (socket) upstream**.
Taps at the inlet and the throat come out to barbs for 3 mm silicone tube:

- Put the XGZP6897D's **high port on the lower (inlet) barb** and its low
  port on the throat's.
- The ±500 Pa version (XGZP6897D005HPDPN) suits 50–150 CFM, which gives
  about 30–300 Pa.
- Zero it with the fan off.

Flow is Q = Cd · A_throat · √(2 ΔP / (ρ (1 − β⁴))), with β = 65 / 94 and
Cd ≈ 0.98 for a smooth venturi. A BME280 elsewhere in the run gives
temperature and pressure for ρ, and ρQ is the mass flow.

The sensor board sits on the tray on the far side with two cable ties. Its
breakout has no drawing either, so the tray only has a shallow pocket.

## Assembling a butterfly valve

1. Lower the **coupler** into the servo bracket, long way vertical, down
   through the slot in the top joint's flange.
   - Keep its head through the slot in the servo plate and its key tip
     outside the tube wall.
   - Push it in until the square key sits flush with the inside of the
     bore.
2. Slide the **disc** down the bore edge-on, rib toward the servo side, until
   the rib lines up with the key. Push the coupler the rest of the way in so
   the key seats in the rib.
3. Run the **M3 × 16** through the boss opposite the servo. It threads into
   the boss and the wall, and the disc turns on its end.
4. Drive the servo to the angle you want as "shut". Set the horn in the
   coupler's pocket, then press the servo's spline into the horn through the
   plate and screw its tabs to the plate. The horn's centre screw isn't
   needed: the coupler holds the horn on.

A servo turns the disc 1:1, so 90° of servo travel runs it from shut to fully
open. The disc runs 0.5 mm clear of the bore (`disc_clearance`), so a shut
valve leaks a little. That's fine for balancing a fan, but it isn't an
airtight seal.

## Assembling the iris valve

1. Set the nine **blades** on the housing floor's pins, drive pins up, each
   one shingled over the last.
2. Lay the **ring** on its ledge with every drive pin in its slot and the
   tab out through the notch in the housing wall.
3. Screw the **lid** down with six M3 × 10s.
4. Screw the SG90 into the tower beside the housing. Push the **arm** onto
   its horn with the arm's pin in the tab's slot.

The ring turns 25° for the blades' 75° swing, which is 117° of servo. Shut,
a 6 mm hole stays open in the middle, about 2.4 % of the bore.

## Print

Print it in PETG with 4 walls, gyroid infill, no supports and no brim. Print
the TPU 75A liners in place: load the part and its `-gasket` together and
give the gasket the TPU extruder.

Every part prints in the pose it is exported in:

- modules: on their bottom socket
- the duct plug: on its duct spigot
- cube cells: standing on a chamfered edge
- the sensor cap and tray: on their backs
- the valve disc: flat, rib up
- the coupler and iris arm: pocket down
- blades and ring: flat
- the key: on its side

Nothing overhangs more than 45°.

The legacy flat bolt flange is `joint = "bolt"`. It covers the hub, the
butterfly valve and the duct spigot only.

## Before you print a batch

- **Print one joint first.** Two tubes are enough.
  - `fit` sets the plug's clearance in the socket.
  - `gasket_squeeze` sets how hard the tip presses the liner. The twist
    scrubs the liner as it turns, so start low.
  - Neither has been test-fitted.
- **Measure the servo.** `servo_horn_face` is the distance from the servo
  tabs' face to the horn's far face once it's pressed on. SG90 datasheets
  disagree on it by about 1.5 mm.
- **Test the iris blades.** They are 0.6 mm and shingle up to four deep in a
  3 mm gap, which relies on PETG flexing. That hasn't been printed yet.
