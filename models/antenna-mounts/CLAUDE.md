# antenna-mounts

A bulkhead RF jack (SMA or N extension cable) held facing up in a shroud on a plate that bolts to MOLLE clips on the Kanix bolt grid. One part, `mount.stl`, in PCTG, built three ways: `sma-1x2` (default), `sma-1x3`, `n-3x2`. The builds differ only by `connector`, `kanix_cols` and `kanix_rows`. Customizable (`schema.ts`, `customizable-sources.ts`).

Not yet printed. Not `devOnly`: the first task asked for `build:models` and baselines, which skip dev-only models.

## Origin

v1 (2026-10-20, as `kanix-antenna-mounts`) was a port of the user's Kanix-repo prototype: a shelf across the pad's top, the jack through it, open gussets underneath. The user rejected it the same day, saying "these are going to be abused". They asked for:
- "a cylinder mounted to a base plate with a hole at the bottom, antenna on the top and spots to zip tie the antenna cable down. the bottom of the antenna cable needs to be protected"
- "if you're looking at it from above it's a half circle with an antenna in the center then a square to the plate", everything rounded
- a shroud to the top, ties "at the end and halfway for the 1x2 and 3 for the 1x3"
- the N with "the same rounded flange at the bottom plus a little bigger with zip tie anchors", and a thicker body
- sized to the MOLLE clip, which is wider than the Kanix plate
- not named Kanix: "these aren't kanix antennas they're just antennas"
- customizable, since bigger cables need a bigger pass-through.

They dropped the idea of a hole through the plate into the pack ("forget about the hole through the bottom idea"). Don't bring it back.

Only Kanix interface numbers are used, never Kanix code (CC BY-NC-ND); see [[kanix-off-limits]] in memory. The grid and pilots follow `meshology-l1-holster`'s `kanix_*` names.

## Geometry

- Frame: Z = 0 is the clip side and the bed. X is across, +Y the way the connector faces. Prints as modelled; `in_use()` stands it up for the previews.
- `profile2d()`, seen down the antenna: the plate (`w` × `pad_t`), the shroud (circle `shroud_r` round the axis, hulled down to the bed) and the flange's concave fillets. `body()` runs it the plate's length, erodes it by `round_r` and minkowskis it back. That rounds every edge, and the erode grows the fillets by `round_r` first, so they come out at `flange`. The profile runs below the bed by `round_r` and is trimmed at Z = 0, so the bed face is whole.
- `w` = pitch × (cols − 1) + `molle_clip_w`: the plate covers every column's clip (26.4 for SMA, 64.5 for N). `h` is the Kanix plate height (38 / 52).
- The bore sits on the plate's face (`axis_z` = `pad_t` + `bore_r`), so its floor has `kanix_skin` over the pilots. It runs from the top's underside out the bottom end, with a 45° `mouth_chamfer`. Its roof is peaked at 45° but flattened at `bore_roof` = min(peak, max(r + 1, `shroud_r` − wall)), so the top keeps a wall's thickness. On the N that's 1 mm over the circle, an 8.8 mm bridge.
- `cap_t` is the panel the jack clamps: N 4, SMA 2.5 + the 3 mm hex pocket. The pocket is corner up with its roof peaked at 45°.
- Tie stations (`tie_ys`): `kanix_rows` of them, from `tie_y0` at the bottom end up to `tie_y1` below the jack's body (`*_body_len`). Each station is two vertical slots (vertical in the print, so no overhang) through the top of the shroud into the bore, `tie_x` either side of the cable.
- Asserts cover: bore vs hex and cable + tie, the hole and nut vs the top, the shroud + flange vs the plate, and tie spacing.

## Checks

- Faces past 45° on the STL should be only the blind pilots' tops (z ≈ 8.6) and the bore's flat roof.
- `--backend=CGAL` renders the N in about 50 s natively (the customizer's WASM is CGAL); no errors.

## My picks, not the user's

- 6 walls, 40% gyroid.
- Bore 10.5 (SMA) / 26 (N), walls 3 / 5, flanges 3 / 8. The SMA flange is as big as the 26.4 plate allows.
- The tie slot design (pairs through the top, tie under the cable).
- `on-molle.3mf` uses the clips' top two holes.
- N hardware lists the MOLLE path (4 screws, 2 clips); the label says the belt clip takes 6.

## Unmeasured

These are from other gallery models, not these cables:
- SMA: `sma_hole` 6.6, `sma_hex` 8.3, `sma_hex_depth` 3, `sma_panel` 2.5, `sma_nut_af` 8, `sma_body_d` 6, `sma_body_len` 12, `sma_cable_d` 3. From `kobo-meshcore-case` / `heltec-ht-hc33-case`; the body and cable are guesses.
- N: `n_thread_d` 15.9, `n_nut_af` 19.05, `n_body_d` 24, `n_body_len` 15, `n_panel` 4 (the user confirmed 4 for the drybag node), `n_cable_d` 7 (a guess). From `apache-case-modules` / `meshtastic-drybag-node`. Whether the thread has an anti-rotation flat is unknown.
- The far-end plug has to pass up the bore: SMA male under 10.5.
- Reference only: the SMA stub antenna (generic), the AOA-915-5ACM (the drybag's numbers), the MOLLE clip plate.
