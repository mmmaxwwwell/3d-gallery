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
0           back, with the opening through it
channel_z0  = lip_height                        strap rests on the back
channel_z1  = channel_z0 + collar_thickness
pocket_z1   = channel_z1 + pocket_depth         front lip, flat
body_h      = pocket_z1 + wall
```

## Plan

Round, concentric with the tag: `body_r = pocket_r + capture_length`, so the
end strips are `capture_length` long on the strap's centre line. The round
rim is narrower than the channel beyond x ≈ 18, so the last few mm of each
end strip cover the strap front and back with no side walls; the walls
beside the channel run out to there. The channel's exit chamfer follows the
round rim (`_channel_flare()`): its cross-section widens 45° with plan
radius, not with x.

## The back opening

The pocket's full circle (`pocket_r`) along the strap, clipped to the
channel's width across it: nothing holds the tag at the collar's ends (a 1 mm
back-floor overlap there was dropped on request). Beside
the strap, the space behind the tag is filled in: a 45° cone from `fill_r0 =
pocket_r - tag_catch - collar_thickness` at `channel_z0` out to `pocket_r -
tag_catch` at the tag's back face, so the tag has ~3.35 mm of overlap top and
bottom (asked for, to hold it in). The `tag_catch` step (0.75) between the
cone and the pocket wall is a flat ledge the tag snaps behind; it is a small
flat overhang face down, accepted for the grip. The cone keeps it printable face down; where it meets the back
it leaves a 0.25 mm flat ledge beside the channel, coplanar with the channel
roof bridge. Inside the channel the channel cut takes the fill away.

History: a narrower-than-strap slot was once tried and was far too tight
for a rigid tag. The current opening is exactly the strap's width.

## Verify with probes

Cast rays through the `holder_body()` STL. At the defaults:

```
vertical (19, 0)    end strip       0, 1.2, 3.7, 7.1   floor and roof: enclosed
vertical (0, 15.5)  catch ledge     0, 3.7, 5.1, 7.1   solid to the tag's back, then pocket
vertical (14.5, 0)  front lip       5.1, 7.1           flat lip
across Y z=0.6 x=0  opening         ±12.65             channel_w / 2
across Y z=2.4 x=0  fill            ±14.1              cone
across Y z=3.6 x=0  fill            ±15.3              cone, 0.75 inside the pocket wall
across X z=0.6 y=0  opening         ±16.15             pocket_r
across X z=1.0 y=0  exit chamfer    ±21.75             body_r less the chamfer
```
