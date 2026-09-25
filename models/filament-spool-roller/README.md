# Spool Roller Stand (Dry Box)

Four Bambu Lab spools in a 300 × 200 × 240 mm dry box, each on its own pair of
rollers so they unwind independently — or one spool, on a one-lane stand built
from the same design. The gallery's `4× | 1×` switch picks which. Filament leaves the bottom of each spool
into a PTFE tube whose mouth sits just behind the spool, clear of it, then runs
straight back under the back roller and up to a bulkhead.

Everything fits a 220 mm bed. The four-lane stand measures **296 × 196 mm**,
the one-lane stand **80 × 196 mm**.

## Print list — four lanes

| Part | Qty | Size | Notes |
|------|-----|------|-------|
| `tile-left.stl` | 1 | 196 × 84 × 9 | Floor tile, left edge |
| `tile-middle.stl` | 2 | 196 × 81.5 × 9 | Floor tile, middle |
| `tile-right.stl` | 1 | 196 × 77.5 × 9 | Floor tile, right edge |
| `wall-left.stl` | 1 | 196 × 198 × 8 | Wall, left end |
| `wall-center.stl` | 3 | 196 × 198 × 8 | Wall, between lanes |
| `wall-right.stl` | 1 | 196 × 198 × 8 | Wall, right end |
| `roller.stl` | 8 | ⌀31.8 × 63.4 | **Prints on end** |
| `peg-inner.stl` | 6 | 11 × 23 × 8.3 | Through an inner wall — TPU, lies on its flat |
| `peg-end.stl` | 4 | 11 × 15.5 × 8.3 | Through an end wall — TPU, lies on its flat |
| `beam.stl` | 4 | 23 × 26 × 80 | **Prints standing** on its flange end |
| `lock-pin.stl` | 5 | 28 × 2.5 × 2 | Only if you'd rather not use M3 screws |
| `template-left.stl` / `template-right.stl` | 1 each | ≤156 × 62 × 0.5 | Bulkhead drilling template, dovetails together |
| `floor-template-left.stl` / `floor-template-right.stl` | 1 each | 196 × ≤156 × 0.5 | Floor drilling template, dovetails together |

### Print plates

Twelve plates, each laid out for a 220 × 220 × 220 mm bed, print one of
everything above. The optional lock pins aren't on them.

| Plate | What's on it |
|-------|--------------|
| 1–5 | One wall each — left, three centre, right |
| 6 | All 8 rollers, on end, and all 4 beams, on their flange ends |
| 7 | All 10 pegs, lying on their flats — **print these in TPU** |
| 8 | Floor tiles 1 and 2 |
| 9 | Floor tiles 3 and 4 |
| 10 | The bulkhead drilling template |
| 11 | Floor drilling template, left half |
| 12 | Floor drilling template, right half |

Every part is also its own STL, in its print orientation, for printing one at
a time.

## Print list — one lane

The same walls, rollers, pegs and beam, with no centre walls. The single tile
is open at both sides, and both drilling templates print whole.

| Part | Qty | Notes |
|------|-----|-------|
| `tile-single.stl` | 1 | Floor tile, 196 × 80 × 9 |
| `wall-left.stl` / `wall-right.stl` | 1 each | End walls |
| `roller.stl` | 2 | **Prints on end** |
| `peg-end.stl` | 4 | TPU, lies on its flat |
| `beam.stl` | 1 | **Prints standing** on its flange end |
| `lock-pin.stl` | 2 | Only if you'd rather not use M3 screws |
| `template.stl` | 1 | Bulkhead drilling template |
| `floor-template.stl` | 1 | Floor drilling template |

| Plate | What's on it |
|-------|--------------|
| 1 | The left wall |
| 2 | The right wall |
| 3 | Both rollers, on end, and the beam |
| 4 | All 4 pegs — **print these in TPU** |
| 5 | The floor tile |
| 6 | Both drilling templates |

Hardware: 4 × 608ZZ, one PTFE tube and bulkhead, 2 × M3 × 25, 6 × M3 × 8 and
4 × M4 (optional).

### Fit test

Before committing a few kilos of filament, print `plate-fit`: every joint in
the stand at full size, with the lengths between them cut out, to test and
throw away.

- A **disc of a centre wall's back tip**: the beam's socket hole,
  the flange countersink and the lock hole
- The **two outer thirds of a beam**: the socket end goes through the wall
  disc and the spigot end pushes into it, which is the joint every centre wall
  makes. Lock them with the pin or an M3 through the wall
- A **disc round a peg hole** and a **short roller** with both bearing
  pockets. Press a peg into the disc until its flange seats, put a 608 on
  it against the shoulder, and seat the bearing in the roller
- A **lock pin**
- An **inner peg**, in its own colour. Give it TPU like the real ones, or
  print it in whatever the plate is in if it's only the fit you're after. It
  tests both kinds of spacing, the flange on one side and the step on the
  other
- A **tile seam**: one tail and one socket

## Hardware

| Qty | Item |
|-----|------|
| 16 | 608ZZ bearing, 8 × 22 × 7 mm — two per roller |
| 5 | M3 × 25 socket-head cap screw — one per wall, locks the beams in it |
| 15 | M3 × 8 socket-head cap screw — up through the floor into every wall, front, middle and back |
| 4 | PTFE tube, 4 mm OD × 2 mm ID |
| 4 | Push-fit bulkhead connector for 4 mm tube |
| 16 | M4 screw, if you want the tiles fixed down |

## The walls

Each wall is one crescent, open to the top and toward the front. It's tall at
the back (198 mm), where it squares a spool up as it goes in and carries the
beam. It drops to a 30 mm strip through the middle, where nothing needs
guiding. Then it rises again to 78 mm at the front to catch a spool coming
down from the front. The bottom edge runs the full depth, so the ridges, the
floor screws and both pegs have wall all round them. Both faces are flat —
no pockets — so a wall prints flat with nothing to bridge. Every outside
corner is rounded and every inside corner filleted.

The walls come as three parts, the same way the tiles do. The two end walls
are mirror images, not one part turned round: the beam and floor joints
differ at the two ends. The left wall's beam hole is smaller, because only a
spigot sits in it.

## Where a wall meets the floor

Each wall sits on the tiles on full-length **V ridges**, one riding in a
groove in each tile it stands on. A centre wall straddles two tiles, so it
has two ridges; an end wall has one. The ridges keep the long run straight;
three screws hold it down.

All three are M3 × 8 cap screws, up from underneath: one in the middle and
one 8 mm in from each end. Each head sinks 3.2 mm into the 5 mm floor, and the
thread runs through the rest of the floor and about 6 mm into the wall.
Under a centre wall the two tiles lap at every screw, splitting the floor's
thickness between them along a 45° plane through the screw, so each tile
holds half the floor under the head and neither needs support to print.

The screw length is a parameter (`base_screw_length`), and the holes follow
it.

## The beams

Four hex beams run across the top back of the stand, one per lane, nested end
to end into a single bar. They sit 3 mm clear of a seated spool.

Each beam is, end to end:

- a **socket**, one wall thick, whose open end flares at 45° into a
  **flange**;
- the **bar**, which spans the lane, full size right up to each wall;
- a 45° step down to a **spigot**, one wall thick. The step sits inside the
  wall, in a matching funnel in the mouth of the socket it goes into.

It prints standing on the flange, the big end, so it only ever narrows going
up and nothing overhangs. The socket opens onto the bed, so its far end is a
45° roof rather than a flat ceiling; the spigot stops short of it.

The spigot sits inside the socket of the beam before it. The flange sinks
flush into a countersink in the far face of the wall the socket sits in,
which indexes that wall along the beam.

An M3 × 25 cap screw goes in through the back edge of each wall, head sunk in a counterbore, on
the beam's centre line. It passes through the socket and the spigot inside
it, locking the wall to both beams. The 2.8 mm hole lets the screw self-tap
the whole way. A printed `lock-pin` pushes into the same hole if you don't
have screws.

Every hex has rounded corners, and every change of size on a beam steps out
at 45° measured at the corners. Nothing on it overhangs past 45° as printed.

## Assembly

The beams tie the walls together, so the walls, rollers and beams go
together as one frame, off the floor, and then drop onto the tiles.

In the assembly view each kind of part alternates between two shades of its
colour, piece to piece, so neighbouring copies are easy to tell apart. The
shades are only there to tell pieces apart on screen; print them in whatever
filament you like. Hover a piece id in the parts list (T1, W3, B2…) to see
exactly which piece it names.

1. Dovetail the four tiles together: left, two middles, right.
2. Press a 608 into each end of all eight rollers.
3. Press every peg into its wall first. A peg goes in body first until its
   flange seats on the face: a `peg-end` from the lane side of an end wall,
   a `peg-inner` from the left face of a centre wall.
4. Start with `wall-left` and hang a roller on each of its pegs.
5. Push a beam, spigot first, through the next wall's beam hole from its
   right-hand face, until the flange seats in the countersink. Then bring
   that wall up to the one before it: the beam's spigot goes into that
   wall's hole and the pegs' left ends go into the rollers' free bearings.
   Hang the next pair of rollers on the pegs' right ends.
6. Repeat across the stand, finishing with `wall-right`.
7. Drive an M3 screw into the back edge of each wall.
8. Lower the whole frame onto the tiles, ridges into grooves, then drive
   the fifteen floor screws up from underneath.
9. Feed a PTFE tube down through the back end clip, under the back roller and
   through the loops until it is flush with the front face of the front end
   clip. Take the other end up to the bulkhead.

Only the bearings' inner races touch the stand. Every peg holds its bearings
0.5 mm off the wall. On the side it goes in from, its flange does it. On an
inner peg's far side, the body runs 0.5 mm past the wall face and steps down
to the shaft, and that step does it. Both are 11 mm across or less, so they
bear on the inner race and clear the shield, and the roller's end face runs
0.3 mm off the flat wall. Nothing wider than the body goes through the wall,
which is what lets a peg go in at all.

The pegs print lying on a flat cut along one side, just deep enough that
the shaft's underside stays within 45°. Standing on end, the flange and the
shoulder would both be flat overhangs.

## The rollers

The whole flange fits in the 2 mm of lane slack beside the roller: 0.3 mm
running gap to the wall, a 0.6 mm flat rim at the roller's end, then a taper
40° off the roller's axis in to the edge of the spool — so standing on end it
prints as a 40° overhang. The spool's rims land on the flat, and anything
off-centre meets a slope toward the middle.

That makes the flange only about 0.9 mm tall. A taller one would need a wider
lane, and the width budget has 4 mm left for the whole stand; the walls do
the real guiding. The whole roller clears the tile by 2 mm.

## Why the rollers stand where they do

The stance is solved, not chosen. A spool resting on two rollers has its
centre exactly `spool_r + roller_r` from each roller axis. Once you say how
high off the floor you want the spool, the horizontal offset falls out of the
triangle:

```
roller_x = sqrt((spool_r + roller_r)² − (spool_z − peg_z)²)
```

At the defaults, that gives **156.4 mm between roller axes**, with the rims
meeting the rollers **42.8° off vertical**. The defaults are a 200 mm spool,
⌀30 rollers, the peg axis 23.7 mm up and the spool 8 mm off the floor. The
spool tops out at 208 mm in a 240 mm box.

## The width budget

Four spools in 300 mm is the constraint the whole stand is shaped by:

```
4 lanes  x (60 spool + 2x2 slack)   256 mm
5 walls  x 8                         40 mm
                                    -------
                                    296 mm   (4 mm spare)
```

There's no room for a support outboard of each roller, which is why the walls
themselves carry the pegs.

A Bambu refill spool measures up to about 68 mm across its flanges. At 68,
four lanes don't fit a 300 mm box: `spool_width = 68` fails the width assert.
Measure yours before printing.

## The PTFE run

The tube lies in a round-bottomed groove sunk half the tile's thickness, and
the one row of lattice cells the channel runs down is filled solid. It runs
flat between two end clips, longer than the loops and flared at the foot.
Between them, three closed loops with rounded tops arch over the tube in
front of the back roller (none under the roller itself), so the tube is
captive rather than snapped in.

The front end clip sits about 17 mm behind the spool centre (`ptfe_end_x`).
That is as far forward as a clip 9 mm tall can go and still clear a 200 mm
spool by 0.5 mm (`ptfe_clip_clearance`), so no part of the tube is inside the
spool's cylinder. Filament leaves the bottom of the spool almost level with
the tube's mouth. The back end clip is tucked just behind the back roller,
clearing it by the same 0.5 mm, and the tube passes under the roller between
the two. Past each end clip the groove scoops up in a curve to the tile top.
In front of the mouth it turns up a full 45°, so nothing square stands in the
filament's way. At the back the curve is steeper, so the tube can leave the
tile there with the tile's back border left whole.

Every tile also has a second route. Right behind the front clip, a slot turns
down through the floor and leaves the underside at 45°, for taking the tube
down to something built under the stand. Feed it through the front clip and
down the slot instead of along the groove. The knee is as round as the
2.5 mm of floor under the groove allows. The slot is open from the top, with
a 45° face over the tube's far side, so the tile still prints flat. It passes
under the flat groove for about 12 mm, and a tube run to the back just spans
it.

Every loop and clip closes over the tube at 45°, so the tile still prints
flat with no support. To mark the bulkhead holes, hook the
template's lip over the walls at the back of the stand, stand it against the
back wall, and mark through the four holes.

To fix the stand down, lay the two halves of the floor template, dovetailed
together, where the stand will go — centred, with 2 mm to the box wall
either side — and mark the floor through its 16 holes. The pattern is the
same turned end for end, so it can go down either way. Both templates are
0.5 mm sheets, thin enough to lie flat and mark through.

## Print notes

- **Rollers print on end**, so the bearing pockets come out round.
- **Beams print standing** on their flange end, with no support.
- **Tiles and walls print flat.** Nothing needs support; the ridges and the
  laps are 45°.
- **Pegs print lying on their flats**, in TPU.
- Every tile carries the same honeycomb, lined up on its lane.

## Customizing

Lane count, spool size, ride height, roller and flange, bearing fits, the wall
shape, the beams, the lattice, the dovetails, the PTFE run and the box are all
parameters. Change `spool_diameter`, `spool_width` or `lanes` and the whole
stand re-solves. The asserts will tell you if the result no longer fits the
box.
