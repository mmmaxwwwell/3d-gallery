# UGREEN Finder Duo Air Case (Captive Collar)

The captive-collar cover sized for the UGREEN Finder Duo Air. One piece, no cap,
no screws.

The collar runs in a channel along the underside. For 12mm at each end the
underside is **solid** — the strap is fully enclosed there, which is what holds
the collar on. Along the middle the underside is open as a slot, and that slot
is narrower than the strap (22.2mm under a 25.4mm biothane) so a lip down each
side keeps the strap seated. Directly above the channel, sitting on it rather
than cut into it, is the cavity for the tracker. The tracker goes in through
that same slot; there is no other opening in the case.

The QR is 32.3mm and sits 4.5mm from one end of the top, just inside the
flat top and clear of the case's rounded corners. The text follows it along
the rest of the top.
Test that it scans before you rely on it. The other end carries text
(`top_text`) — as many lines as fit, centered as one block — with a choice of
font and size.

**Print this in TPU, soft.** See the warning under Fit — this tracker is 36mm
square and the slot is 22.2mm, which is a much bigger stretch than on the Fi
Mini version of the same design.

## How it stacks up

Across the case, looking down the strap:

```
              ┌─────────────────────────────────────┐
              │                                     │  top wall, QR recess
              ├─────────────────────────────────────┤  14.4
              │        UGREEN Finder Duo Air        │  cavity 36.8 wide
   ┌──────────┴─────────────────────────────────────┴──────────┐  4.2
   │ shoulder │            collar strap             │ shoulder │  channel 26.2
   │  5.3mm   ├──────┬───────────────────────┬──────┤  5.3mm   │  1.2
   │          │ lip  │     slot 22.2mm       │ lip  │          │
   └──────────┴──────┘                       └──────┴──────────┘  0
```

The tracker never rests on the strap alone: it sits on the two **shoulders**
that run the full length either side of the channel, and on the strap between
them. At 5.3mm these are wider than the Fi Mini version's, because the tracker
is square and the strap is not.

The underside, looking up at it:

```
   ┌──────────────────────────────────────────────────────┐
   │        │                              │              │
   │ solid  │      slot, 22.2 x 24.8       │    solid     │
   │  12mm  │                              │     12mm     │
   └──────────────────────────────────────────────────────┘
     strap fully              lip either side       strap fully
     enclosed                 of the slot           enclosed
```

## Assembly

1. Thread the collar through — in one end strip, along the channel, out the
   other. It is enclosed at both ends, so it cannot come off sideways.
2. Work the tracker up through the slot into the cavity. It seats on the
   shoulders, on top of the strap.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `parts/case.scad` -> `case.stl` | The whole cover | TPU |
| `previews/assembled.scad` -> `assembled.3mf` | Two-color preview (body + QR) | -- |

## Fit

Sized for a 25.4mm (1in) x 3mm biothane strap by default. `strap_width` and
`strap_thickness` are customizer parameters.

`tag_corner_r` (default 8mm) was measured off product photos rather than a spec
sheet. If the tracker rocks in the cavity or will not seat, that is the number
to adjust.

`capture_length` (default 6mm) is the solid strip at each end. This is what
actually holds the collar on; the lip along the middle only keeps it seated.
The slot runs the full length of the tracker's cavity, so the tracker slides
straight up through it; only the lip along the sides has to be worked past.

The USB-C cutout is on the **-Y side face**. The tracker is square, so the only
real choice is a side or an end, and an end would have to be bored through a
`capture_length` strip — the one part of the case that has a job to do. It is
7mm tall rather than the Fi Mini case's 8mm, and sits 1.25mm below the tracker's
mid-height.

> **`strap_lip_width` is the awkward one on this model.** The slot width is set
> by the strap, but the part squeezed through it is a 36mm square tracker —
> 6.9mm of interference a side, against 4.4mm on the Fi Mini case. That is a
> 62% stretch across the lip span. Soft TPU (85A) or drop `strap_lip_width`
> toward 1mm, which costs grip on the strap. There is no separate knob: the lip
> that holds the strap and the lip the tracker passes is the same lip.

The channel is exactly `strap_thickness` tall — no clearance in Z, on purpose.
Over the middle of the case the strap's top face *is* the tracker's floor, so
anything added in Z becomes slop under the tracker.

## Print orientation

Authored bottom-down, sitting on z=0. The underside is a flat face with the
slot down the middle of it — good bed contact, and it is the face that sits
against the dog. The cavity ceiling bridges onto the shoulders.

## Known trade-offs

- **The stretch to get the tracker in.** See the note above; this is the
  weakest point of porting the Fi Mini geometry to a square tracker.
- The tracker has to come out before the collar can be unthreaded. That is the
  cost of enclosing the strap at both ends.
- The USB-C cutout is centred on one side face with no adjustment parameter.
  If the port sits off-centre on your tracker, move the `translate()` in
  `usbc_cutout()`.

See [CLAUDE.md](CLAUDE.md) for the lib layout and conventions.
