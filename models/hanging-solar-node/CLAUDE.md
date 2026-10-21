# hanging-solar-node — agent notes

- **Frame:** +X across the panel, +Y up as it hangs, +Z out of the panel's back.
  Z = 0 is the panel's back face, the panel's face is at Z = −`panel_t`, origin at the
  panel's centre. `in_use()` turns Y up for the previews.
- **The panel is captive in a channel** (user, 2026-10-21: "this design only works if
  there's a guided slot that the solar panel slides into"). Left, right and top walls
  run forward past the panel; it slides up from the open bottom. Behind it the ledge
  (`lip_w`, z ≥ 0); in front a lip whose inner face is 45° (`lip_d`) so the shroud
  still prints on its back, meeting the panel's face at its edge (≈0.7 play, filled by
  adhesive). Everything in z < 0 is cut along `swept_down()` so nothing at the bottom
  stops the panel. The hanging tube ends at z = 0, so the cord through panel + tube is
  what keeps the panel from sliding back out. First version (panel dropped onto a lip
  in a cup, glued) was rejected.
- **Card holds to the shroud, not the panel**, `card_lift` (3) off the panel's back so
  the tab solder blobs slide under. Posts stop `post_gap` short of cups on the shroud's
  back; M3x8 from outside pulls the card up.
- **Layout is fixed coordinates** (`holder_c`, `tp_c`, `xiao_c`, `posts`, `ties`),
  placed round the panel's solder tabs (`tabs_from_top`, under the card's window) and
  the SMA at `sma_x` in the bottom wall. Move them together.
- **User's brief (2026-10-21):** slide over the panel's back, sealed with adhesive at the
  sides; card with zip ties and adhesive; shroud locked "with the holes in the top and
  the bottom"; 18650 "facing down"; only watertight upright; as light as possible.
  My readings: top hole = the panel's hang hole carried through the shroud, bottom
  lock = the card's screws (one bottom right, one left, one at the top of the card);
  "facing down" = the holder lying along the bottom; antenna down through the bottom
  wall (keeps the top wall unbroken); 2 mm breather (mine). Panel measured by the user: 122 x 160, r10, 1.7 thick; hole and tabs still
  from a photo.
