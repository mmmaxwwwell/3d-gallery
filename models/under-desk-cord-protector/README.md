# Under-Desk Cord Protector

A modular cord cradle that screws to the underside of a desk. Cords
leaving the desk drop into it and are carried around a wide bend
instead of folding over a hard edge.

The cross-section drops **3 in (76.2 mm) straight down**, then wraps
the **outside of a 6 in (152.4 mm) circle for 135°** — 90° to bring it
horizontal, then 45° more so the free end curls back upward into a
retaining lip. The shell is **8 mm thick everywhere**.

Each segment covers **150 mm** of desk width and interlocks with the
next, so you print as many as your desk is wide.

## Dimensions

| | |
| --- | --- |
| Depth (out from the desk edge) | 144.9 mm |
| Height (desk underside to the lowest point) | 160.4 mm |
| Length along the desk | 150 mm pitch (154 mm including the rib) |
| Shell thickness | 8 mm |
| Cradle floor, below the desk underside | 152.4 mm |
| Retaining lip above the cradle floor | ~23 mm |

## Printing

Stand it **on the grooved end, rib pointing up** — the extrusion axis
runs vertically. Every layer is then an identical slice of the
profile, so it needs **no supports** and the layer lines run across
the profile rather than along it, which is the strong direction for
the load it carries.

Bed needed: ~145 × 161 mm footprint, 154 mm tall.

The screw recesses need no supports either: each is a round gap in a
band of layers, with the lip above it carried by the layers on both
sides. The props print the same way — stand them on either Z face.

## Mounting

Each segment has **3 screw recesses** in the vertical wall — one 15 mm
in from each end, one in the middle. Each is a round 7.4 mm bore angled
20° in toward the centre of the curve, so it opens onto the cord side
and **the outside face of the wall stays solid**. The screw sits in the
recess with its shank up through a 3.8 mm hole on the wall centreline,
and its head bears on the **2 mm of plastic between the recess and the
desk face**. Nothing protrudes into the cord channel.

Use **#6 × 5/8 in (16 mm) pan-head wood screws** — a 6–7 mm head, which
is what the 7.4 mm slot is sized for. With 2 mm of the length inside
the wall the screw bites ~14 mm into the desktop, safe in a 3/4 in top;
#6 × 3/4 in would leave only ~2 mm of wood above it.

Drop the screw into the recess from the cord side and drive it straight
down the bore — the 20° lean is there so the driver has a clear run at
it, and it means the pilot holes in the desk are drilled at the same
angle (use the part as the guide). `screws_per_segment` also takes 1,
2, or 4 — the end pair stays 15 mm in from the ends either way.

## Optional prop

A second, optional part finishes the half circle the cradle starts — the
last 45° of arc — and then runs **straight up** to the desk underside. It
bolts onto the cradle and screws to the desk, which turns each segment
from a cantilever into a two-point mount; that is what takes the sag out
of a long run.

Its desk screws sit in the riser exactly the way the wall's sit in the
wall — same angled recess, same 2 mm of plastic above the head — but
leaning the other way relative to the tube, so the bore opens onto the
**outside**. Once the tube is closed that is the only side a driver can
reach.

The two meet in a **half-lap that follows the honeycomb**. Over one cell
of the pattern the cradle keeps the inner half of the shell and the prop
takes the outer half, so the joint is the same 8 mm as the rest of the
tube — nothing stands proud, inside or out. Both parts end on the cell
walls rather than across them, so they interlock, the pattern carries
through the seam unbroken, and neither one ends in a sliver that a
printer would struggle with.

At each desk face **only the three cells carrying a screw are filled** —
the pattern runs to within a few mm of the desk everywhere else. The
joint column itself is solid in both parts, because splitting a 3 mm web
down the middle leaves each side about a millimetre to stand on once
clearance is allowed for; solid, it gives each part a honeycomb-edged
tongue half a cell wide with the bolts through the middle of it.

It bolts on with **M5 × 8 button-head cap screws driven straight into the
plastic**, one in each of those filled cells. Every segment carries three
4.2 mm pilots through its tongue (same spacing as the wall screws,
15 / 75 / 135 mm), so the screw cuts its own thread — no inserts, no
nuts. Use 8 mm, not longer: the stack at the joint is exactly 8 mm, and a
10 mm screw would push its tip through into the cord channel.

Fit it **after** the cradle is up and the cords are laid in: slide the
prop's half-lap over the cradle's tongue, drive the M5s through it into
the pilots, then drive the desk screws down the bores in the riser.

| Part | Width | M5 bolts | Desk screws | Use |
| --- | --- | --- | --- | --- |
| `prop-beam.stl` | 15 mm | 1 | 1 | Add one to three per segment, on any of the pilots. |
| `prop-panel.stl` | 150 mm | 3 | 3 | Closes the tube completely. |
| `prop-screen.stl` | 150 mm | 3 | 3 | Same, with hex openings so the run still breathes. |

The prop reaches past the cradle, because that is where the rest of the
circle goes: with one fitted the depth under the desk grows from
**144.9 mm to 168.4 mm**. Without one, nothing changes.

## Assembly

1. Screw the first segment to the underside of the desk.
2. Slide the next segment's grooved end onto the previous segment's
   rib and screw it down. The rib follows the entire profile, so the
   two segments stay aligned across the whole curve.
3. Repeat across the desk.
4. Lay the cords into the trough from the open side.

The joint is a locator, not a latch — the screws are what hold each
segment up.

## Parts

| File | Description |
| --- | --- |
| `segment.stl` | One segment. Print as many as you need. |
| `segment-screen.stl` | The same segment with hex openings. |
| `prop-beam.stl` | Optional 15 mm prop beam. |
| `prop-panel.stl` | Optional full-width prop panel. |
| `prop-screen.stl` | Optional full-width prop screen, hex openings. |
| `assembled.3mf` | Three chained segments, for the viewer. Not a print job. |
| `propped.3mf` | Three segments, one for each prop variant. Not a print job. |

## Customizing

Adjustable in the gallery's customizer: segment length, shell
thickness, drop height, arc diameter, arc sweep, screws per segment, and
`end_joints` — turn that off to print a segment with no rib and no
groove, for a run of one or for the last piece on a desk.

`arc_inner_diameter` is the **inside** face of the curve — the surface
cords actually rest on — because the material wraps the outside of
that circle.
