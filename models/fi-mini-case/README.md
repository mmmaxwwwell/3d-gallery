# Fi Mini GPS Case

A protective case for the Fi Mini GPS tracker:

- A top cap that covers the tracker, with an optional QR code surface.
- A bottom base with a collar channel for strap pass-through and screw counterbores.
- Held together by 6 M3x6 socket head cap screws.

## Where the QR comes from

These cases go with two products. The
[Fi Mini tracker](https://www.amazon.com/dp/B0FMGRT8YK) (GPS, Wi-Fi, Bluetooth,
LTE) rides inside the case. The
[Wagtopia Smart Tag](https://www.wagtopia.com/smarttag) is only a source for its
QR code: scan it, put that link in `qr_code_text`, and throw the tag away.
Wagtopia hosts the page the code opens; the case just carries the code.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `cap.scad` -> `cap.stl` | Top half with QR code recesses | PLA / PETG |
| `base.scad` -> `base.stl` | Bottom half with collar channel | PLA / PETG |
| `assembled.scad` -> `assembled.3mf` | Multi-color preview of the full assembly | -- |

## Hardware

- 6x M3x6 socket head cap screw (DIN 912 / ISO 4762)

## Library

`fi-mini-case-lib.scad` holds all geometry modules and shared parameters
(Fi dimensions, fastener constants, case geometry, QR code generation).
Each consumer `.scad` is intentionally thin -- `include` the lib and call one module.

See [CLAUDE.md](CLAUDE.md) for the assembly conventions, lib layout, and
build/render commands.
