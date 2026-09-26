# spool-drybox

A sealed single-spool dry-box module. `devOnly: true`. Printed on a
Snapmaker U1 (270 mm cube, tool changer), so a part and its 75A TPU
gasket print together.

The previous square-box design (floor, flat walls, blistered panels,
lid, rollers on pegs) was replaced on 2026-09-25. A copy is in
`.cache/spool-drybox-before-drum/`, which is gitignored and never
committed. Its `roller()`/`peg()` are the starting point for the roller
modules.

## Construction (what the user asked for)

- Two round walls, radius ≈ spool + `spool_clearance` + `wall_thickness`
  (3 mm: "trust me, we'll reinforce later"). Round the ring from the top:
  **spring module, lid, front panel, front roller module, underneath
  panel, rear roller module, back panel.** The modules will be separate
  pieces bolted between the walls. For now they are gaps sized by
  `module_arc`, at `module_angles` (0, 180 ± `roller_angle`). The lid
  seam is at `lid_seam_angle`.
- Screws go **straight through the middle of the TPU channel** (the user
  was emphatic). The pad round each screw is pilot-sized, so the screw
  threads through the TPU.
- Where the 3 mm won't hold the seal, parts flare and step outward, never
  into the spool's space. Each panel flares at 45° to `seal_land` (the
  ridge's base, 4.2) along all four edges, and gets a boss round every
  screw pilot. Each wall has a rib inside it under the panel edges, deep
  enough for the gland, `seal_skin` and a counterbore. The rib starts
  just inside `ring_r`, clear of the spool's rim, and the wall's rim
  grows to `disc_r` to hold it.

## Frames

Y is the spool axis, X front, Z up. Angle `a` runs round the axis from
straight up toward the front. Parts are drawn in the ring's local frame
(`_on_axis()`: local Z = world Y, phi = a − 90). A panel is drawn from
phi = 0 to its span, standing on its −Z edge, which is its print pose.
Walls print on their outside face. The left wall is the right one
mirrored, because front and back aren't symmetric.

## Seals

One section, `_ridge_2d` / `_groove_2d` / `_gasket_2d`, in (u, v) with
the TPU part on v < 0. The walls hold the TPU and the panels carry the
ridges. Every TPU channel then opens upward or sideways as printed,
never onto the bed. **Change the seal there, never per part.**

Seams: every panel end facing a module holds TPU (`_seam_gasket`: a
channel plus a tip-wide column `joint_fit + gasket_squeeze` proud), so
the modules can have plain ends. At the lid seam the front panel holds
it. The strip runs out through the ridge to its tip, touching the
wall's TPU so the loop is continuous.

## Checks worth re-running

Zero-volume pairwise intersections among `module_walls`, `module_panels`
(each pair) and `spool`. Only these overlap, on purpose: the wall
gaskets with the panels' ridges, the lid-seam strip with the lid, and
the seam strips with the wall gaskets (TPU on TPU). Every plate's bbox
must stay inside ±130 mm.

## Manifest

Multi-material plates are previews **without `plate: true`**. Validation
holds a plate to one material family.
