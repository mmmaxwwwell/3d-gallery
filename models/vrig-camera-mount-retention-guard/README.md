# VRIG Camera Mount Retention Guard

A rectangular sleeve, open on the top and bottom, that slides over the
VRIG AC-91 magnetic quick-release adapter at the camera-to-mount
interface. The four walls physically constrain the joint so a side
impact or vibration can't shear the magnetic connection apart.

Prints in **64D TPU** so the sleeve can flex slightly to install and
grip by friction once on.

## Dimensions

| | mm |
|---|---|
| Main inner cavity (long × short × tall) | 39 × 16.9 × 10.5 |
| Outer footprint | 48 × 20.9 |
| Long-wall thickness | 2 |
| Short-wall thickness (outside pocket) | 4.5 (`wall` + `bumpout_depth`) |
| Short-wall thickness (at pocket tip) | 2 |
| Outer vertical-corner radius | 2.5 |
| Inner vertical-corner radius | 1 |
| Long-side inner bump (each of the two long walls) | 23 × 4.2 × 0.3 protrusion into the cavity, centered on X, top flush with sleeve top |
| Short-side pocket (each short wall) | 11 wide (Y) × 2.5 deep (X) × full height, centered on Y — extends the cavity outward |
| Long-side bottom chamfer (each long wall) | 45° face, 1.25mm hypotenuse (legs ≈ 0.884mm), offset 0.2mm outward for clearance — matches wrapped object's chamfered bottom |

## Parts

| File | Description | Material |
|------|-------------|----------|
| `guard.scad` → `guard.stl` | Retention sleeve | 64D TPU |

## Hardware

- 1× [VRIG Magnetic Quick Release Adapter (AC-91)](https://www.amazon.com/dp/B0FL2GD2MN)

## Library

`vrig-camera-mount-retention-guard-lib.scad` holds every parameter and
the `guard()` module. The consumer under `parts/` is intentionally
three lines — see [CLAUDE.md](CLAUDE.md) for the conventions and edit
rules.
