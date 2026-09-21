# QR Leash Tag

A QR code you slide onto a leash. One piece, two filaments, no hardware — the
webbing threads through a slot across the middle and the tag stays wherever
you push it.

The code fills the whole face, so it stays scannable at the smallest size the
strap allows: put your phone number, your dog's name, or a link to a lost-pet
page on it.

## Print it face down

The QR face goes on the build plate. That puts the filament swap in the first
millimetre and prints the code dead flat against the sheet. `plate.3mf` is
already oriented that way — slice it as-is. `tag.3mf` is the same object
flipped code-up, for looking at.

No supports either way. The one thing the printer has to do unaided is bridge
the 1 mm back face over the 25 mm slot, which is inherent to a slot that runs
all the way through — flipping the tag over just moves the bridge to the other
side. Any printer that bridges at all will manage it.

## Dimensions

Every number below is a customizer parameter. The defaults are a 25 x 3 mm
leash with 2 mm walls, which gives a 29 mm square, 5.5 mm tall:

| Z range | What |
|---------|------|
| 0 – 1 mm | Back face (`back_thickness`) — the side the webbing presses against |
| 1 – 4 mm | Webbing slot (`leash_thickness`), 25 mm wide (`leash_width`) |
| 4 – 4.5 mm | Solid material (`front_thickness`) |
| 4.5 – 5.5 mm | Two-colour QR band (`qr_thickness`) |

The outer square is `leash_width + 2 * wall`, so widening the strap widens the
tag — and the code with it. Every edge is rounded: the four vertical ones by
`corner_r` (2 mm), and the eight around the QR face and the back by `edge_r`
(0.5 mm), so there is no sharp rim to catch on a hand or a pocket. Keep
`edge_r` under `qr_margin` and the code still lands on a dead-flat face.

`qr_polarity` picks which filament the modules print in. `Light on dark` (the
default) gives a black tag with white modules — an inverted code, which most
phones read without complaint. `Dark on light` is the standard arrangement and
scans on everything.

## Parts

| File | Description | Material |
|------|-------------|----------|
| `plate.3mf` | Print orientation — QR face on the plate | Two filaments — dark body, light modules |
| `tag.3mf` | Same tag, code-up, for viewing | -- |

## Hardware

None — single print, no fasteners.

## Library

`qr-leash-tag-lib.scad` holds all geometry and parameters. It depends on two
system OpenSCAD libraries — [qr.scad](https://github.com/xypwn/scadqr) for the
code and [BOSL2](https://github.com/BelfrySCAD/BOSL2) for the rounded edge
sweep; install both into your OpenSCAD library path before rendering locally.

See [CLAUDE.md](CLAUDE.md) for the lib layout and editing rules.
