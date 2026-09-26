# collar-tag-holder

One part, `holder()`. Takes from `fi-mini-case-captive` its enclosed strap
channel and the idea of pressing the carried object in past an overlap in
the back.

## Frame

X runs along the collar, Y across it, Z from the back (z = 0, against the dog)
to the front face. `holder_body()` is drawn in that frame. `holder()` turns it
face down for printing. Don't print it back down: the front lip would then be
a flat 2 mm ring overhang, and the tag is a flat disc that needs a flat seat
(a 45° cone bezel was tried and rejected).

## Z stack

```
0           back, with the round opening through it
channel_z0  = lip_height                        strap rests on the back
channel_z1  = channel_z0 + collar_thickness
pocket_z1   = channel_z1 + pocket_depth         front lip, flat
body_h      = pocket_z1 + wall
```

## The back opening

A circle, `opening_r = tag_diameter / 2 - back_overlap` (15 at the defaults,
1 mm under the tag). No square slot: a slot narrower than the strap was
tried, and it was far too tight for a rigid tag. The opening is wider than
the strap, so the strap isn't held by it; the **end strips**
(`capture_length`) enclose the channel and hold the collar on.

The pocket runs down past the strap all the way to the back, so the tag's
edge only has the back overlap to get past. Beside the strap, the back's
inner face is a 45° cone from `opening_r` to `pocket_r`: face down, a flat
ring there would overhang. Inside the channel the channel cut takes the cone
away, and the back is part of the channel roof bridge.

`body_corner_r = pocket_r - channel_w / 2` keeps the end faces flat across
the channel plus a full `wall` each side.

## Verify with probes

Cast rays through the `holder_body()` STL. At the defaults:

```
vertical (19, 0)    end strip       0, 1.2, 3.7, 7.1   floor and roof: enclosed
vertical (0, 15.5)  back cone       0, 1.7, 5.1, 7.1   cone, then pocket up to the lip
vertical (14.5, 0)  front lip       5.1, 7.1           flat lip
across Y z=0.6 x=0  opening         ±15.0              opening_r
across Y z=0.6 x=19 strip floor     solid              closed under the strip
across Y z=2.4 x=21.9 at exit       ±13.3, ±15.92      wall beside the channel
```
