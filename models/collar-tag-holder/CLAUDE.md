# collar-tag-holder

One part, `holder()`.

## Frame

X runs along the collar, Y across it, Z from the back (z = 0, against the dog)
to the front face. `holder_body()` is drawn in that frame. `holder()` turns it
face down for printing. Don't print it back down: the lip would then be a flat
2 mm ring overhang. Face down, the only unsupported spans are the backing bars
bridging the channel.

## Why the back is open

The tag goes in and out through the back, so the pocket's cylinder cuts all
the way through the backing and the channel. The collar is what closes it.
That has two consequences:

- The collar has to be narrower than the tag (asserted). Otherwise nothing
  pins the tag.
- The backing only exists outside the tag's footprint. The body is just the
  tag plus `wall`, by request, so the collar is held by two `wall`-wide bars
  of rim. Keep it that size; don't grow loops back on.

## Rounds

Every edge is rounded, the back (dog side) most. The front sits on the bed,
so its outer round ends in a 45° chamfer and the window rim is chamfered, not
rounded. `back_round_r`/`front_round_r` must stay under `wall` (out of the
channel), and `channel_round_r` under `wall / 2`, since it rounds both sides of
the rim. All asserted.

## Fits

- Channel thickness is **exact** (`collar_thickness`): the strap is meant to
  press in and hold the tag against the lip. Only the width gets
  `collar_clearance`.
- `tag_depth_clearance` is kept small for the same reason: the strap, not the
  pocket, stops the tag rattling.
