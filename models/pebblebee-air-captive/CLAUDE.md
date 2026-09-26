# pebblebee-air-captive

The `ugreen-finder-duo-captive` geometry re-sized for the Pebblebee Air, with
the QR code and USB-C cutout taken out. The text stays, laid along the strap. The collar threads through a
channel along the underside, enclosed at both ends and held by a lip along the
middle; the tracker presses up through the same slot.

Read [`../fi-mini-case-captive/CLAUDE.md`](../fi-mini-case-captive/CLAUDE.md)
first — the channel/cavity split, the lip, the end strips, the cut-overlap rule
and the probe method all apply here unchanged. A structural fix to one of the
captive cases almost always belongs in the others.

## File layout

```
lib/
  pebblebee-air-captive-lib.scad   all geometry modules + every parameter
parts/
  case.scad                        renders case() -> case.stl
previews/
  assembled.scad                   black body + white text -> multicolor 3MF
```

## What differs from the UGREEN version

| | `ugreen-finder-duo-captive` | this model |
|---|---|---|
| Tracker | 36 x 36 x 9.8, r8 | 41.1 x 26 x 4.8, r1.75 plan, 1.5 edge (not modelled) |
| Orientation | square | **long side along the strap** |
| Case | 48.8 x 40.0 x 16.6 | 53.8 x 29.9 x 11.2 |
| Top | 1.4 QR/text recess + 0.8 backing | 1.0 text recess + 0.8 backing |
| Text | across the case, after the QR; font choice | **along the strap**, centred on what the top cut leaves; Liberation Sans Bold only |
| Top cut | none | charger window, `top_cut_l` (10) long, stopping `top_end_capture` (1.5) short of the tracker's +X end: x = 9.05 to 19.05, full width (sides open by design), down to the tracker's face (z 9.0), every edge rounded 0.7. The top over the tracker's last 1.5 keeps that end captive |
| Shoulder | 5.3mm | **0.3mm** — the strap is the tracker's floor |
| Tracker vs `slot_w` | 6.9mm a side | 1.9mm a side |
| USB-C cutout | -Y side | none — the tracker comes out to charge |
| `tag_corner_r` | parameter | fixed, measured |

**The orientation is load-bearing.** Across the strap, the 41.1mm length would
have to pass the 22.2mm slot (9.5mm a side) and the case would be 45mm wide on
a 25mm strap. Don't turn it.

`strap_width` is capped by `shoulder_w > 0` at 26mm; the tracker leaves no
room for a wider strap.

## Probe signature

```
vertical, z crossed at:
  (24.0,  0.0)  +X STRIP     0.03, 1.20, 4.20, 11.17   ← floor AND roof: enclosed
  (20.0,  5.0)  end capture  9.40, 11.17               ← roof over the tracker's last 1.5
  (15.0,  5.0)  window       (none)                    ← open top and bottom
  (15.0, 14.2)  wall top     0.65, 8.99                ← wall beside the window, rounded
  (-24.0, 0.0)  -X STRIP     0.03, 1.20, 4.20, 11.17
  ( 0.0, 12.0)  strap lip    0.03, 1.22, 4.18, 4.20, 9.40, 11.17
  (the last hit drops to 10.2 wherever a ray lands on a letter)

horizontal across Y, y crossed at:
  z= 2.70 x=  0.0  channel, middle  ±13.10, ±14.97  channel_w
  z= 6.50 x=  0.0  cavity           ±13.40, ±14.97  cavity_w; 0.3 shoulder under it
  z= 8.90 x= 15.0  wall at window   ±13.76, ±14.62  both top edges of the wall rounded
  z= 0.60 x=  0.0  slot, middle     ±11.10, ±14.12  slot_w
  z= 0.60 x= 24.0  slot, strip      ±14.07          SOLID — no slot under the strip

horizontal along X, x crossed at:
  z=10.00 y= 10.0  window           -26.59, 9.04, 19.06, 26.59
  z= 0.60 y=  0.0  slot, centreline ±20.95, ±26.07  full cavity length
```

**The cut is not a subtraction.** `case_outer()` builds the notched shell as a
morphological opening — erode the shell by `top_cut_rounding`, split it into
the three convex pieces the notch leaves, grow each back with a sphere — so
every convex edge of the notch comes out round and the shell away from it is
exact. Keep the pieces convex: that is what keeps `minkowski()` fast under
CGAL (the customizer), ~18s for the case. `top_cut_rim()` rounds the edges the
cavity makes with the notch floor, which the opening can't see.

`top_thickness = text_thickness + text_backing`, as on the Duo — never set the
top back to a literal, or the recess opens into the cavity.

## Build / render

```bash
openscad -o build/case.stl parts/case.scad
```
