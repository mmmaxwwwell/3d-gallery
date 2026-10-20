# kanix-antenna-mounts

A bulkhead RF jack (SMA or N extension cable) held facing up on a Kanix bolt grid. One part, `mount.stl`, in PCTG, built three ways: `sma-1x2` (default), `sma-1x3`, `n-3x2`. The builds differ only by `connector`, `kanix_cols` and `kanix_rows`.

Not yet printed. Not `devOnly`: the task asked for `build:models` and baselines, which skip dev-only models.

## Origin

Ported from the user's own prototype, written in the Kanix repo and since removed from there. Only the shape and the Kanix interface numbers came over, not Kanix code (CC BY-NC-ND); see [[kanix-off-limits]] in memory. The Kanix pad and pilots follow `meshology-l1-holster`'s `kanix_*` params and wording.

## Geometry

- Frame: Z = 0 is the clip side and the bed. X is across, +Y the way the connector faces. Prints as modelled; `in_use()` stands it up for the previews.
- `body_core()` is the wedge (the pad hulled to the shelf at +Y) minus the slot, shrunk by `round_r`. `mount()` minkowskis it with a sphere and trims at Z = 0. The slot is a hull of spheres of `fillet_r + round_r`, so its edges along the pad and under the shelf come out as `fillet_r` fillets. It runs past the part out the bottom and front.
- `axis_z`: the jack's body (or the SMA's hex pocket) clears the pad face by `body_clear`. `tip_z`: the shelf reaches past the nut's corners, the hole's 45° peak and the hex pocket's peak by `shelf_rim`.
- SMA hex pocket: corner up the print, and the roof is peaked at 45° from the side corners (a corner-up hex's roof is 30° off flat). The cut starts `fillet_r` below the shelf, so the fillets don't catch the jack's hex.
- The SMA slot must pass the hex (asserted). That's why `sma_gusset` is 2.5: at 3 (the prototype's) the 14 mm pad leaves an 8 mm slot, narrower than the hex. The prototype only checked the body.
- Pilots: `kanix_pilot_depth` is 8.6 (MOLLE reach 8 + 0.6), `kanix_skin` 1.5 (my pick; the holster's 0.8 only had to stop a screw). `pad_t` = 10.1.
- Tie tunnel (`tie_tunnel()`): across the whole pad, 4 × 2 with a 45° peaked roof, 2 mm off the bed. On 2-row pads it sits below the bottom pilots, since 38 tall leaves room. The 1×3's 7 mm margin doesn't leave room there, so it goes between the bottom two rows. Positions are asserted against the pilots.

## Overhangs

On the STL, faces past 45° should be only the blind pilots' tops (z ≈ 8.6) and a sliver at the tunnel's peak. The prototype used teardrops on the shelf holes; the user has dropped teardrops elsewhere (holster pilots, drybag), so if they object, the shelf holes go round and bridge.

## My picks, not the user's

- 6 walls, 40% gyroid (`printProfile`); the task asked for more walls than the default.
- `n_gusset` 4, `kanix_skin` 1.5, tie tunnel size and place.
- `on-molle.3mf` puts the N mount on the clips' top two holes. The task didn't say which two.
- N hardware lists the MOLLE path (4 screws, 2 clips); the label says the belt clip takes 6.

## Unmeasured

These are from other gallery models, not these cables:
- SMA: `sma_hole` 6.6, `sma_hex` 8.3 (8 mm hex), `sma_hex_depth` 3, `sma_panel` 2.5, `sma_nut_af` 8, `sma_nut_h` 2, `sma_body_d` 6. From `kobo-meshcore-case` / `heltec-ht-hc33-case`.
- N: `n_thread_d` 15.9, `n_hole_clear` 0.5, `n_nut_af` 19.05, `n_body_d` 24, `n_body_len` 15, `n_panel` 4 (the user confirmed 4 for the drybag node). From `apache-case-modules` / `meshtastic-drybag-node`. Whether the thread has an anti-rotation flat is unknown.
- Reference only: the SMA stub antenna (generic), the AOA-915-5ACM (the drybag's numbers), the MOLLE clip plate (26.4 wide, 4 thick, plate only).
