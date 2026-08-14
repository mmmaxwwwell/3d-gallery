# osmo-remote-belt-mount

Belt-mount cradle for the YDW Bluetooth Remote Control for DJI Osmo
Action cameras (Amazon B0GF1RWSR2). Holds the remote against a belt
via a rear belt-loop slot.

## File layout

```
lib/
  osmo-remote-belt-mount-lib.scad   all params + belt_mount() module
parts/
  belt-mount.scad                    3-line: include, $fn, belt_mount()
```

No `previews/` — single-color part, no multicolor 3MF.

## Status

**Scaffold only.** The `belt_mount()` module currently renders a
placeholder cuboid pocket sized to nominal `remote_w × remote_d ×
remote_h`. Real geometry (measured device envelope, retention lip,
belt loop / clip) is TODO — to be co-designed with the user.

## Parameters (placeholders)

- `remote_w / remote_d / remote_h` — device envelope. Not measured
  yet; current values are guesses.
- `wall`, `fit_clearance`, `corner_r` — cradle wall / fit / corner
  rounding.
- `belt_slot_w`, `belt_slot_h`, `belt_backing` — belt loop opening
  and rear material. Not yet wired into geometry.

## Editing rules

- **Change dimensions in the lib**, not in `parts/belt-mount.scad`.
  The consumer stays three lines.
- Once real geometry lands, remove the placeholder TODOs and update
  this file with the same section structure as
  `../vrig-camera-mount-retention-guard/CLAUDE.md`.
