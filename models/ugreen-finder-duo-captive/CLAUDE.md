# ugreen-finder-duo-captive

The `fi-mini-case-captive` geometry re-sized for the UGREEN Finder Duo Air. The
collar threads through a channel along the underside, enclosed at both ends and
held by a lip along the middle; the tracker presses up through the same slot.

**Keep this model and `fi-mini-case-captive` structurally identical.** They are
the same design with different tracker dimensions, and a fix applied to one
almost always belongs in the other. Read
[`../fi-mini-case-captive/CLAUDE.md`](../fi-mini-case-captive/CLAUDE.md) first —
everything there about the channel/cavity split, the lip, the end strips, the
cut-overlap rule and the probe method applies here unchanged. Only the
differences are repeated below.

## File layout

```
lib/
  ugreen-finder-duo-captive-lib.scad   all geometry modules + every parameter
parts/
  case.scad                            renders case() -> case.stl
previews/
  assembled.scad                       colored body + QR -> multicolor 3MF
```

## What differs from the Fi Mini version

| | `fi-mini-case-captive` | this model |
|---|---|---|
| Tracker | 43 x 31 x 11.5, r9 | 36 x 36 x 9.8, r8 |
| Corner radius | fixed `fi_corner_r` | **`tag_corner_r` is a parameter** — measured off photos, not a spec sheet |
| Case | 55.8 x 35.8 x 18.3 | 48.8 x 40.8 x 16.6 |
| Cavity | 43.8 x 31.8 x 11.9 | 36.8 x 36.8 x 10.2 |
| Shoulder | 2.8mm | **5.3mm** — square tracker, same strap |
| Tracker vs `slot_w` | 4.4mm a side | **6.9mm a side** |
| USB-C cutout | -Y side, 14 x 8 | -Y side, 14 x **7** — thinner tracker, so a shorter port keeps 1.4mm of wall above the cavity floor |
| Cavity module | `fi_cavity()` | `tag_cavity()` |
| `qr_size` | 30 | 32 |

The `6.9mm a side` row is the one that matters. `slot_w` is derived from the
strap, but the tracker squeezed through it is 36mm wide, so this model asks far
more of the filament than the Fi Mini one does. If a fit complaint comes in,
that is where to look first — not at `tag_clearance`.

## Probe signature

Same method, this model's numbers:

```
vertical, z crossed at:
  (21.5,  0.0)  END STRIP    0.02, 1.20, 4.20, 16.58   ← floor AND roof: enclosed
  ( 0.0,  0.0)  mid of slot  14.40, 16.58              open floor to ceiling
  ( 0.0, 12.0)  strap lip     0.02, 1.20, 14.40, ...   lip present (a QR recess
                                                        may truncate the last hit)
  ( 0.0, 15.0)  SHOULDER      0.02, 4.20, 14.40, 16.58 ← carries the tracker
  ( 0.0, 17.5)  under tag edge 0.02, 4.20, 14.40, 16.58 ← 18.0 is the tag's edge

horizontal across Y, y crossed at:
  z= 2.70 x=  0.0  channel, middle  ±13.10, ±20.38  channel_w; shoulders solid to the wall
  z= 2.70 x= 21.5  channel, strip   ±13.10, ±17.37  channel bored through the strip
  z= 0.60 x=  0.0  slot, middle     ±11.21, ±19.82  slot_w + the lead-in chamfer
  z= 0.60 x= 21.5  slot, strip      ±16.55          SOLID — no slot under the strip
```

## Build / render

```bash
openscad -o build/case.stl parts/case.scad
```

`devOnly` in the manifest, so the publishing build skips it. Flip that flag to
ship it.
