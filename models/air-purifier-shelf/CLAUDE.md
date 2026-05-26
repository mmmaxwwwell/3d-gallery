# air-purifier-shelf

A wall-mounted round shelf sized for the Levoit Core 200S air purifier (186mm dia, ~2.5 kg). Single-part print.

## File layout

```
lib/
  air-purifier-shelf-lib.scad   all geometry + every shared parameter
parts/
  shelf.scad                    renders shelf() — complete one-piece shelf
previews/
  assembled.scad                colored shelf() → 3MF preview
```

Each consumer file is intentionally thin — three lines: `include`, `$fn`, one module call.

## Geometry overview

The shelf is a single union of:

- **Round plate** (`base()`) — `shelf_diameter` × `shelf_thickness` disk.
- **Back wall plate** — rectangular strip along `−Y` of the disk, same thickness, that the struts brace against.
- **Two diagonal truss struts** (`strut()`) — at the top and bottom of the plate, each a 45° beam plus a vertical back leg.
- **One bottom support strut** — a third strut positioned below the plate for extra rigidity under load.

Everything below the base plane is trimmed by a final `difference()` so the part sits flat on the bed.

## Working with the lib

`air-purifier-shelf-lib.scad` exposes:

- Parameters: `shelf_diameter`, `shelf_thickness`, `screw_hole_radius`, `screw_hole_thru_radius`
- Helpers: `strut()`, `base()`
- Public modules: `shelf()`

## `include` vs `use`

Consumers use `include <../lib/air-purifier-shelf-lib.scad>;` — the lib needs its top-level params visible in the consumer scope, and the lib has no top-level render calls so `include` is safe.

## Sizing constraints

- `shelf_diameter` is what the customizer should change first. For the Core 200S (186mm) the default 230mm is a good fit. For other purifiers, measure the base diameter and add ~40mm.
- `shelf_thickness` controls both plate rigidity and strut beam thickness. 10mm in PLA is rated for ~3 kg loads at the default diameter. Drop to 8mm for PETG; raise to 12mm if you scale `shelf_diameter` past 280mm.
- `screw_hole_radius` is the counterbore radius (head pocket). `screw_hole_thru_radius` is the shank clearance. Both punch through the back leg of each strut from the wall side.

## Editing rules

- **Don't redefine lib parameters in consumer files.** Change values in the lib.
- **Don't add `translate()` in consumer files.** Modules render with their natural origin; the lib already positions struts on the plate.
- **The trim at the bottom uses a scaled copy of `base()`.** If you change the back plate shape, the trim needs to track it — or just delete the `difference()` wrapper and use a manifold bed-aligned trim instead.

## Build / render

```bash
openscad -o build/shelf.stl parts/shelf.scad
```

Confirm `Volumes: 2` (solid + void) in the trailing output for a clean manifold render.
