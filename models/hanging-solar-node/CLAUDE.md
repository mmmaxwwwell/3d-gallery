# hanging-solar-node — agent notes

- **Frame:** +X across the panel, +Y up as it hangs, +Z out of the panel's back.
  Z = 0 is the panel's back face, the panel's face is at Z = −`panel_t`, origin at the
  panel's centre. `in_use()` turns Y up for the previews.
- **The panel is the front.** No bezel: the shroud's walls run forward to the panel's
  face round its edge (`glue_gap`), and the lip (`lip_w`, 45° underside so it prints
  shroud-on-its-back) is what the panel's back sits on. The seal is adhesive on the lip
  and in the gap. The hanging tube is glued to the panel round its hole, so the cord
  through it carries both.
- **Card holds to the shroud, not the panel.** Posts on the card stop `post_gap` short
  of cups on the shroud's back; M3x8 from outside pulls the card up. The card's
  underside lies on the panel; zip ties run in grooves under it so it stays flat.
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
