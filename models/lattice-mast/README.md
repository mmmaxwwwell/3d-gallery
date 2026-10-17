# Lattice Antenna Mast

A 20 ft (6.1 m) guyed antenna mast in 32 printed segments, sized for an Elecrow ThinkNode M6 solar node on top. It tapers from 100 mm at the foot to 35 mm at the top. The outside is a plain cone, and the wall (3.5 mm at the foot, 4 mm at the top) is a honeycomb whose ribs are sized to the wind.

## How the honeycomb is sized

The lib works out the wind load itself. It takes a design gust (`design_wind`, 35 m/s or 78 mph), the payload's wind area (`payload_area`), and the two guy points (`guy_low` 3 m, `guy_high` 5.8 m). It finds the bending along the mast, for a foot anywhere between pinned and clamped. Each segment's ribs then widen until the printed wall stays under `allowable_stress` (7 MPa, about a third of what PETG's layer bonds take). A segment that needs ribs wider than 0.6 of a cell prints solid. With the defaults, the ribs run 2–6 mm, and the two segments either side of the lower guy point are solid. The lib echoes each segment's rib width when it renders.

Change the length, diameters, walls, guy heights or wind, and the ribs follow.

## Printing

- 32 parts, `segment-01` (foot) to `segment-32` (top). Each prints standing, foot on the bed, about 209 mm tall, so they fit an Adventurer 5M (220 mm).
- PETG, 4 walls, no supports, no brim. Every overhang is 45° or steeper, the guy cord holes are teardrops, and the screw holes are plain round holes, which print fine at this size.
- About 3.7 kg of PETG in all.

## Assembly

Each segment is a honeycomb tube. At each joint, two solid rings overlap by one hexagon. The upper segment's foot is a solid ring. The segment below carries a full-thickness solid sleeve that stands inside it. The outside stays a plain cone apart from the screw heads.

1. Lower the upper segment over the sleeve below and turn it until the lugs (one between each pair of screws) drop into the channel mouths at its foot.
2. Keep turning. Each channel is an L:
   - **Diagonal:** a 45° climb, about 7 mm, draws the foot down onto the joint.
   - **Lateral:** a 4 mm level run, where the joint is seated and keeps turning, held tight.
   - **Pop:** it squeezes through a pinch and pops into the stop. At the stop the screw holes line up.
3. Drive an M3 × 6 socket-head cap screw into each hole: 7 per joint at the foot, falling to 3 at the top, 173 in all.

## Guys and mounting

- **Guys:** segment 16 (3 m) and segment 31 (5.8 m) each have a solid band with three pairs of cord holes. Thread each guy out of one hole and back in the other, round the post between them, before the next segment goes on. Anchor the guys 120° apart, at least half the guy height out. In the design gust, the lower guys pull up to about 215 N and the upper ones about 85 N, so paracord or 2 mm Dyneema is plenty.
- **Node:** the top 150 mm is solid. Clamp the ThinkNode's bracket to it with two hose clamps.

## Not done yet

- Base for the foot segment (a ground stake that the foot sleeves over).
- Not printed yet. Print one joint pair and pull-test it before building all 32.
- Joint strength: the lock screws bear on 2 mm of foot ring. The joints next to the foot and the guy points see the most bending.
