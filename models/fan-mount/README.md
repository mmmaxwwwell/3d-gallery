# Fan Mount (120mm)

A 120mm-class fan mount assembly:

- A circular base plate that captures the fan into a counterbored seat.
- A TPU base gasket between the plate and the fan body.
- A TPU fan-body ring gasket that drops into the mating channel.
- A two-piece conical clamp that grips the fan's tapered upper body and bolts down through 8 feet into the base plate.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `fan-mount.scad` → `fan-mount.stl` | Base plate (round) with mounting holes, fan seat, and clamp pocket | PLA / PETG |
| `base-gasket.scad` → `base-gasket.stl` | Flat ring between plate and fan body | TPU |
| `fan-gasket.scad` → `fan-gasket.stl` | Short ring in the mating channel | TPU |
| `fan-clamp.scad` → `fan-clamp.stl` | One half of the conical clamp — **print twice** | PLA / PETG |
| `assembled.scad` → `assembled.3mf` | Multi-color preview of the full assembly (no print) | — |

## Hardware

- 8× M5 socket-head cap screws — perimeter mount (base plate to whatever surface)
- 8× M5 socket-head cap screws — clamp feet to base plate
- 2× M5 socket-head cap screws — clamp halves to each other (ears)

## Library

`fan-mount-lib.scad` holds all geometry modules and shared parameters
(fan dimensions, fastener constants, clamp geometry). Each consumer `.scad`
is intentionally thin — `include` the lib and call one module.

See [CLAUDE.md](CLAUDE.md) for the assembly conventions, lib layout, and
build/render commands.
