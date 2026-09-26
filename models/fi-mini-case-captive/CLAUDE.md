# fi-mini-case-captive

One-piece Fi Mini cover. The collar threads through a channel along the
underside, enclosed at both ends and held by a lip along the middle; the tracker
presses up through the same slot. Derived from `fi-mini-case`, which splits into
a screwed cap and base; this one does not split at all.

## File layout

```
lib/
  fi-mini-case-captive-lib.scad   all geometry modules + every shared parameter
parts/
  case.scad                       renders case() -> case.stl
previews/
  assembled.scad                  colored body + QR -> multicolor 3MF
```

Consumers are three lines: `include`, `$fn`, one module call.

## Coordinate frame

`z = 0` is the underside of the cover — the face against the dog. The part is
authored print-ready in that frame; no flip or translate in the consumers.

X runs along the strap. Y is across it. Origin is centered in X and Y. The case
is closed on every face; the only opening is the slot in the underside.

## The Z stack (bottom to top)

```
0            underside, with the strap slot down the middle of it
z_channel    = lip_height               strap rests on the lip
z_cavity     = z_channel + channel_h    tracker rests on the shoulders + strap
case_height  = z_cavity + fi_height + fi_clearance + top_thickness
```

Three derivations are load-bearing for the design, not cosmetic:

- **`channel_h = strap_thickness`, with no clearance added.** Clearance goes on
  the strap's *width* only. Over the middle of the case the strap's top face is
  the tracker's floor, so anything added in Z becomes slop under the tracker.
- **`top_thickness = qr_thickness + qr_backing`.** The QR is recessed into the
  top face, so a top wall thinner than the recess opens it straight into the
  cavity. Never hardcode `top_thickness` back to a literal.
- **`shoulder_w = (cavity_w - channel_w) / 2`.** See below — this is what makes
  the whole stack printable.

## Channel and cavity are adjacent, never intersecting

The two voids share the plane `z_cavity` and nothing else:

```
   z_cavity  ──┬──────────── cavity, cavity_w wide, cavity_l long ───────────┬──
               │                                                            │
   shoulder ───┤                    strap channel                           ├─── shoulder
   z_channel   └──────────────── channel_w wide, full length ───────────────┘
```

The channel is narrower than the cavity, so what is left either side of it —
`shoulder_w`, 2.8mm at the defaults — runs the full length of the case from
`z = 0` up to `z_cavity`. **The tracker rests on those shoulders**, and on the
strap between them.

That is the point of keeping the two cuts adjacent rather than stacking a
printed floor between them. A floor would have to bridge the full `channel_w`
(26.2mm), in TPU, for the length of the case. There is no floor, and no bridge:
the shoulders carry the tracker and the strap fills the gap.

An earlier revision had a single pocket that ran from `lip_height` all the way
up at full width, swallowing the channel. That left no shoulders at all and the
tracker hung on the strap alone. Don't merge them back.

**The channel's edges follow the strap's.** A biothane strap has a round on
each long edge (`strap_edge_d`, 2.5mm across), so all four of the channel's
long edges take that radius (`channel_rounding`). Under the cavity, the top two
leave a fillet along each shoulder, flush with the cavity floor, that cradles
the strap's top corners. The shell's `edge_rounding` is derived as
`channel_rounding + lip_height`, which makes it concentric with the channel's
bottom rounds, so the lip wraps the strap's edge at an even thickness. Where
the channel leaves each end face, `flared_edge()` flares it out at the same
radius.

## X regions

- `|x| < cavity_l/2` — the cavity, open downward onto the channel.
- `|x| > cavity_l/2` — the two end strips, `capture_length` long, with the
  channel bored through them and a solid `lip_height` floor underneath. This is
  what holds the collar on: `strap_slot()` is bounded to
  `slot_l = cavity_l`, so it never reaches them. It runs the cavity's full
  length so the tracker's ends clear it; an earlier revision stopped it 6mm short
  of each end and the tracker had to be forced past the floor there. A still earlier one ran the slot the full length
  of the case and nothing enclosed the strap at all.

## The lip does two different jobs

`slot_w = channel_w - 2 * strap_lip_width` = 22.2 at the defaults. That one
number is checked against two different parts:

| | strap | tracker |
|---|---|---|
| Width | 25.4 | 31 |
| Against `slot_w` = 22.2 | 1.6mm a side | 4.4mm a side |
| What it means | stays seated once pressed in | has to be rolled in, TPU only |

**This model is filament-specific — authored for TPU.** In PLA or PETG neither
part goes in at all. Lowering `strap_lip_width` to ease the tracker also loosens
the strap; there is no separate knob, and there should not be — they are the
same lip.

Asserted: `strap_clearance < strap_lip_width < (channel_w - 2·lip_rounding)/2`.
The lower bound is the one that matters: at or below `strap_clearance` the slot
comes out wider than the strap and nothing holds it in at all.

## Nothing opens out of an end face

An earlier revision cut the tracker's exit through the back wall. It worked, but
the tracker is 31 of the case's 35.8mm width and 11.9 of its 18.3mm height, so
the opening ate the whole back face — and it necessarily merges with the strap
channel below it, since the cavity floor *is* the channel roof. There is no bar
of material to leave between them. Don't try it again: any end-face exit for
this tracker is a hole most of the size of the face.

## Two cuts must never meet on a shared plane

`cut_overlap` (1mm) exists for this. Every cut that ends where another begins
runs past it by that much instead.

The cut in question once stopped exactly where the next began, and the result
was a **film of plastic ~8 microns thick sealing the whole bottom opening**. It
was built with `minkowski() { cuboid(...); sphere(r, $fn = 16); }` and assumed
the result would reach `r` above the cuboid. It does not: a `$fn = 16` sphere is
a polyhedron whose pole sits at `r * cos(180/16)`, so the cut topped out at
1.1923 instead of 1.2 and left a skin against the floor at 1.2.

Two rules follow, and they are cheap to honour:

- **Overlap every adjacent cut.** Never rely on one ending exactly where the
  next begins. `strap_slot()` overruns into the channel, and `fi_cavity()`
  reaches down into it. `strap_channel()` is the exception and must stay one:
  it reaches the outside faces, so slack added to it shows up as a loose strap
  slot on the end of the case.
- **Never treat a low-`$fn` `minkowski` sphere as reaching its nominal radius.**
  `case_shell()` still uses one, which is why the finished case measures about
  0.05 mm under its nominal outside dimensions. That is cosmetic there. It was
  not cosmetic here.

## Editing rules

- **Don't redefine lib parameters in consumer files.** Change values in the lib.
- **Don't add geometry in consumer files.** They stay 3-line entry points.
- **The QR runs off the flat top, on purpose.** It is 33mm on a 35.8mm-wide
  case (flat top 31.8mm), `qr_end_margin` (4mm) from the -X end, so its sides
  wrap onto the rounded edges and the rounded corners just clip its two -X
  corners. The
  user chose size over a clean quiet zone knowing it may not scan.
  `qr_dark_modules()` intersects with `case_shell()` so the white inlay never
  stands proud of the case. Don't pull it back onto the flat without asking.
- **Text fills the +X end** (`top_text`, `font_style`, `text_size`).
  `top_text` is multiline: it is split on `\n` with BOSL2's `str_split` and
  the lines are centered as one block in `text_room` — what the QR leaves of
  the flat top. An assert rejects a `text_size` that would run into the QR.
  QR and text are inlaid together by `top_inlay()`, one colour.
- **The QR is not mirrored.** `fi-mini-case` wraps its `qr()` in
  `mirror([0, 1, 0])`, which flips the code so it will not scan. This model
  deliberately omits that. Verify with `projection() qr_dark_modules()` from
  +Z — the finder-free corner belongs at bottom-right.
- **Verify geometry changes with probes, not renders.** A render of a closed
  cavity hides exactly the failures that matter here. Cast a ray through the
  mesh and list every z (or y) it crosses a surface at. The signature:

  ```
  vertical, z crossed at:
    (25.0,  0.0)  END STRIP    0.03, 1.20, 4.20, 18.27   ← floor AND roof: enclosed
    ( 0.0,  0.0)  mid of slot  16.10, 16.91              open floor to ceiling
    ( 0.0, 12.0)  strap lip     0.03, 1.22, 4.18, 16.10, 18.27 lip present; 1.22 and 4.18
                                                        are the channel's edge rounds
    ( 0.0, 14.5)  SHOULDER      0.03, 4.20, 16.10, 18.27 ← carries the tracker
    ( 0.0, 15.4)  under Fi edge 0.03, 4.20, 16.10, 18.27 ← 15.5 is the Fi's edge
    (14.0,  0.0)  inside slot  16.10, 16.91              slot still open here

  horizontal across Y, y crossed at:
    z= 2.70 x=  0.0  channel, middle  ±13.10, ±17.87  channel_w; shoulders solid to the wall
    z= 2.70 x= 25.0  channel, strip   ±13.10, ±14.26  channel bored through the strip
    z= 0.60 x=  0.0  slot, middle     ±11.10, ±17.02  slot_w; the edge rounding stops at lip_rounding
    z= 0.05 x=  0.0  slot, underside  ±11.49, ±15.89  rounded dog-facing edge flares out
    z= 0.60 x= 25.0  slot, strip      ±12.95         SOLID — no slot under the strip

  horizontal along X, x crossed at:
    z= 0.60 y=  0.0  slot, centreline ±21.90, ±27.02  full cavity length
    z= 0.60 y= 10.5  slot, corner     ±21.33, ±26.33  slot_corner_r (2mm) rounds the corners in plan
    z=12.10 y=-16.5  usbc, in wall    ±7.00, ±22.16    usbc_width
    x=0.0   y=-16.5  usbc, vertical   0.25, 8.10, 16.10, 16.91   top edge flush with the cavity ceiling (16.10)
    z=12.10 y=-17.85 usbc, at face    ±7.39, ±17.15    usbc_entry_rounding flares the outside edge
  ```

  The END STRIP line and the last horizontal are what catch a slot that has
  crept back to full length. The shoulder lines catch a regression into the old
  single-pocket geometry. The `(0, 0.0)` line is the film check.

## Build / render

```bash
openscad -o build/case.stl parts/case.scad
```

`assembled.3mf` is built by the gallery's `build-multicolor-3mf.mjs` via
`build-models.mjs`.
