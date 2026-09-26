# Pebblebee Air Case (Captive Collar)

The captive-collar cover sized for the Pebblebee Air. One piece, no cap, no
screws. Optional text on the top, inlaid in a second colour.

The collar runs in a channel along the underside. For 6mm at each end the
underside is **solid** — the strap is fully enclosed there, which is what holds
the collar on. Along the middle the underside is open as a slot, and that slot
is narrower than the strap (22.2mm under a 25.4mm biothane) so a lip down each
side keeps the strap seated. Directly above the channel, sitting on it rather
than cut into it, is the cavity for the tracker. The tracker goes in through
that same slot; there is no other opening in the case.

The tracker lies **long side along the strap**. Its 26mm width is what has to
pass the 22.2mm slot — 1.9mm a side, an easier stretch than the Fi Mini case.
Turned the other way, its 41.1mm length would have to pass it instead.

Case: 53.8 x 29.9 x 11.2mm. Side walls are 1.6mm; the top is 1.8mm — a 1mm
text recess over 0.8mm of backing.

Near the +X end there is a 10mm window in the top (`top_cut_l`) for the
charging clip: cut down level with the tracker's face and open at both sides,
so the clip lies flat across the tracker. It stops 1.5mm short of the
tracker's end (`top_end_capture`) — the full-height top covers that last
1.5mm, so the end stays captive. Every edge the window leaves is rounded
(`top_cut_rounding`, 0.7mm).

## Text

`top_text` is multiline, bold sans (Liberation Sans Bold), and reads along the
strap; the lines are centered as one block. `text_size` (default 3.5mm) sets the
height of every line. The lines are centred on what the top cut leaves of the
flat top, about 33 x 25mm: an assert stops the lines stacking wider than 25mm,
and a line longer than ~33mm is cut off at the edge rather than running over
it. Around 13 characters fit on a line at 3.5mm.

Good things to put there: a phone number above all — it is what a finder can
act on without a phone that scans anything. `IF FOUND` or `CALL`, then the
number. The dog's name only if you are comfortable with strangers calling it
by name. A short second number or `REWARD` if there is room.

## How it stacks up

Across the case, looking down the strap:

```
          ┌─────────────────────────────┐
          │                             │  top wall, 1.8, text recess
          ├─────────────────────────────┤  9.4
          │        Pebblebee Air        │  cavity 26.8 wide
          ├┬───────────────────────────┬┤  4.2
          ││       collar strap        ││  channel 26.2
          │├─────┬───────────────┬─────┤│  1.2
          ││ lip │  slot 22.2mm  │ lip ││
          └┴─────┘               └─────┴┘  0
```

The tracker is barely wider than a 1in strap, so the shoulders either side of
the channel are only 0.3mm. The strap is the tracker's floor.

## Assembly

1. Thread the collar through — in one end strip, along the channel, out the
   other.
2. Work the tracker up through the slot into the cavity, long side along the
   strap. It sits on top of the strap.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `parts/case.scad` -> `case.stl` | The whole cover | TPU |
| `previews/assembled.scad` -> `assembled.3mf` | Two-color print: black body, white text | TPU |

## Fit

Sized for a 25.4mm (1in) x 3mm biothane strap by default. `strap_width`,
`strap_thickness`, `capture_length` and `strap_lip_width` are customizer
parameters. `strap_width` tops out at 26mm — any wider and the channel is
wider than the tracker's cavity.

Tracker: 41.1 x 26 x 4.8mm, 1.75mm plan-view corners, 1.5mm round on its
edges. The cavity takes the plan corners; the edge round is not modelled and
sits inside the 0.4mm clearance.

No charging cutout — the tracker comes out through the slot to charge.

## Print orientation

Authored bottom-down, sitting on z=0. The underside is flat with the slot down
the middle — good bed contact, and it is the face against the dog.

See [CLAUDE.md](CLAUDE.md) for the lib layout and conventions.
