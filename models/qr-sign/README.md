QR Sign
=======

A two-color QR sign that encodes any URL. Print on a multi-material printer
(or with a manual filament swap at the section-height boundary) — no glue,
no assembly.

Set `qr_url_text` in the customizer to your URL. Short URLs produce larger,
more reliable QR modules. The default size is 235mm square; reduce
`sign_size` if your bed is smaller.

Parts
-----

| File | Description | Material |
|------|-------------|----------|
| `assembled.3mf` | Two-color sign (plate + QR modules) | Two filaments — light plate, dark QR |

Hardware
--------

None — single print.

Library
-------

`qr-sign-lib.scad` holds all geometry and parameters. It depends on
two system OpenSCAD libraries: [BOSL2](https://github.com/BelfrySCAD/BOSL2)
and [qr.scad](https://github.com/marius/qrcode). Install them into your
OpenSCAD library path before rendering locally.

See [CLAUDE.md](CLAUDE.md) for assembly conventions and editing rules.
