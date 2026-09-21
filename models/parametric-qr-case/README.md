# Parametric QR Case

A one-piece case for a small rectangular object — a GPS tracker, a key fob, a
battery, an AirTag. Type in the object's length, width and height and the
pocket sizes itself around it. The outer face carries a QR code.

The defaults are the Fi Mini's dimensions (43 x 31 x 11.5 mm, 9 mm corners),
which makes a 47.6 x 35.6 x 14.3 mm case.

## Print it face down

The QR face goes on the build plate and the pocket opens upward. Nothing
overhangs, nothing bridges, nothing needs support, and the filament swap lands
in the first millimetre so the code prints dead flat. `plate.3mf` is already
oriented that way — slice it as-is. `case.3mf` is the same object flipped
code-up, for looking at.

## Dimensions

Every number below is a customizer parameter:

| Parameter | Default | What |
|-----------|---------|------|
| `object_length` / `object_width` / `object_height` | 43 / 31 / 11.5 mm | The object the pocket is cut for |
| `object_corner_r` | 9 mm | Corner radius of the object; 0 gives a sharp-cornered pocket |
| `fit_clearance` | 0.3 mm | Slip fit per side — raise it if the object binds, lower it if it rattles |
| `wall` | 2 mm | Wall around the pocket |
| `face_thickness` | 1.5 mm | Solid material between the pocket and the QR band |
| `qr_thickness` | 1 mm | Height of the two-colour band |
| `qr_margin` | 2 mm | Gap between the code and the outer edge |

The outer shell is the pocket plus `wall` on every side, so the outer corner
radius tracks the object's. The code is square and sized to the shorter of the
two outer dimensions.

`qr_polarity` picks which filament the modules print in. `Light on dark` (the
default) gives a black case with white modules — an inverted code, which most
phones read without complaint. `Dark on light` is the standard arrangement and
scans on everything. Leave `qr_text` empty for a plain face with no code.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `plate.3mf` | Print orientation — QR face on the plate, pocket up | Two filaments — dark body, light modules |
| `case.3mf` | Same case, code-up, for viewing | -- |

## Hardware

None — single print, no fasteners.

## Library

`parametric-qr-case-lib.scad` holds all geometry and parameters. It depends on
the system OpenSCAD library [qr.scad](https://github.com/xypwn/scadqr); install
it into your OpenSCAD library path before rendering locally.

See [CLAUDE.md](CLAUDE.md) for the lib layout and editing rules.
