# Fi Mini GPS Case (Captive Collar)

A one-piece cover for the Fi Mini GPS tracker. No cap, no screws.

The collar runs in a channel along the underside. For 6mm at each end the
underside is **solid** — the strap is fully enclosed there, which is what holds
the collar on. Along the middle the underside is open as a slot, and that slot
is narrower than the strap (22.2mm under a 25.4mm biothane) so a lip down each
side keeps the strap seated. Directly above the channel, sitting on it rather
than cut into it, is the cavity for the tracker. The tracker goes in through
that same slot; there is no other opening in the case.

**Print this in TPU.** The slot is 22.2mm and the tracker is 31mm, so it has to
be worked past the lip — roll one long edge in, then stretch the other side over
it, the way a phone case goes on.

## How it stacks up

Across the case, looking down the strap:

```
                 ┌───────────────────────────────┐
                 │                               │  top wall, QR recess
                 ├───────────────────────────────┤  16.1
                 │        Fi Mini tracker        │  cavity 31.8 wide
      ┌──────────┴───────────────────────────────┴──────────┐  4.2
      │ shoulder │        collar strap           │ shoulder │  channel 26.2
      │  2.8mm   ├──────┬─────────────────┬──────┤  2.8mm   │  1.2
      │          │ lip  │  slot 22.2mm    │ lip  │          │
      └──────────┴──────┘                 └──────┴──────────┘  0
```

The tracker never rests on the strap alone: it sits on the two **shoulders**
that run the full length either side of the channel, and on the strap between
them. That is what lets the cavity sit straight on top of the channel with no
printed floor in between — and a floor there would have to bridge the whole
26.2mm channel, in TPU, for the length of the case.

The underside, looking up at it:

```
   ┌──────────────────────────────────────────────────────┐
   │        │                              │              │
   │ solid  │      slot, 22.2 x 43.8       │    solid     │
   │  6mm   │                              │     6mm      │
   │        │                              │              │
   └──────────────────────────────────────────────────────┘
     strap fully              lip either side       strap fully
     enclosed                 of the slot           enclosed
```

## Assembly

1. Thread the collar through — in one end strip, along the channel, out the
   other. It is enclosed at both ends, so it cannot come off sideways.
2. Work the tracker up through the slot into the cavity. It seats on the
   shoulders, on top of the strap.

To get the tracker out, push it back down through the slot. The collar stays
threaded.

## Retention, compared to `fi-mini-case`

| | `fi-mini-case` | this model |
|---|---|---|
| Pieces | cap + base | one |
| Fasteners | 6x M3x6 SHCS | none |
| Collar | open channel across the base | enclosed at both ends, lipped in the middle |
| Tracker access | unscrew the cap | pressed through the bottom slot |
| Tracker held by | screws | the lip either side of the slot |
| Filament | any | TPU — the slot is an interference fit |

## Parts

| File | Description | Material |
|------|-------------|----------|
| `parts/case.scad` -> `case.stl` | The whole cover | TPU |
| `previews/assembled.scad` -> `assembled.3mf` | Two-color preview (body + QR) | -- |

## Fit

Sized for a 25.4mm (1in) x 3mm biothane strap by default. `strap_width` and
`strap_thickness` are customizer parameters.

The channel is exactly `strap_thickness` tall — no clearance in Z, on purpose.
Over the middle of the case the strap's top face *is* the tracker's floor, so
anything added in Z becomes slop under the tracker. Clearance is applied to the
strap's width only.

`capture_length` (default 6mm) is the solid strip at each end. This is what
actually holds the collar on; the lip along the middle only keeps it seated.
Longer grips better and resists twisting, shorter makes the case smaller.

`strap_lip_width` (default 2mm) is how far the lip reaches in from each side of
the slot. It is the only thing holding either part in: 1.6mm of interference a
side on the strap, 4.4mm a side on the tracker. It has to beat `strap_clearance`
(0.4mm) or the slot ends up wider than the strap and nothing holds it in.

## Print orientation

Authored bottom-down, sitting on z=0. The underside is a flat face with the
slot down the middle of it — good bed contact, and it is the face that sits
against the dog.

The cavity ceiling still bridges, but it bridges onto the shoulders rather than
onto nothing. Printing the other way up removes the bridge but stands the QR
code vertically, which costs scan quality.

## Known trade-offs

- **Getting the tracker in is a real stretch.** 31mm through a 22.2mm slot is
  39% on the lip span. It is fine in soft TPU and impossible in anything rigid.
  Drop `strap_lip_width` if it will not go; you lose grip on the strap for it.
- The tracker has to come out before the collar can be unthreaded, and the
  collar has to be unthreaded before the case comes off. That is the cost of
  enclosing the strap at both ends.
- Working the tracker in and out loads the same 1.2mm lip every time. If it
  takes a set and stops springing back, reprint.
- The USB-C cutout from the parent model is still in the side wall.
  Delete `usbc_cutout()` from `case()` to close it up.

See [CLAUDE.md](CLAUDE.md) for the lib layout and conventions.
