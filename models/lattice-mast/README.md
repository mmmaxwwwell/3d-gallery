# Lattice Antenna Mast

A 2 m antenna mast in eleven printed segments. It tapers from 100 mm at the foot to 15 mm at the top. The outside is a plain cone, and the 3.5 mm wall is an open honeycomb, so it's light and the wind blows through it.

## Printing

- Eleven parts, `segment-01` (foot) to `segment-11` (top). Each one prints standing, foot on the bed, and is about 200 mm tall, which fits an Adventurer 5M (220 mm).
- PETG, 4 walls, no supports, no brim. Every overhang is 45° or steeper: cell roofs, the steps inside each joint and the channel. The screw holes are plain round holes, which print fine at this size.

## Assembly

Each segment is a 3.5 mm honeycomb tube. At each joint, two solid rings overlap by one hexagon. The upper segment's foot is a solid ring. The segment below carries a solid sleeve, also 3.5 mm thick, that stands inside it. The outside stays a plain cone apart from the screw heads.

1. Lower the upper segment over the sleeve below and turn it until the lugs (one between each pair of screws) drop into the channel mouths at its foot.
2. Keep turning. Each channel is an L:
   - **Diagonal:** a 45° climb, about 7 mm, draws the foot down onto the joint.
   - **Lateral:** a 4 mm level run, where the joint is seated and keeps turning, held tight.
   - **Pop:** it squeezes through a pinch and pops into the stop. At the stop the screw holes line up.
3. Drive an M3 × 6 socket-head cap screw into each hole. The head seats 1.5 mm into the foot ring and stands 1.5 mm proud. It clamps the 2 mm of foot under it onto the sleeve, and the screw threads through the sleeve's full 3.5 mm.

The joints take 7 screws at the foot, falling to 2 at the top: 46 in all.

## Changing the shape

It's customizable in the gallery. `bottom_diameter`, `top_diameter` and `mast_length` set the cone, `wall` the wall thickness, and `section_height` how tall a segment can print, sleeve included: the mast splits into as few equal segments as fit. The gallery has a part for each of 11 segments; settings that make fewer leave the extra parts failing with "segment N doesn't exist", and settings that make more are only whole in the assembly.

## Not done yet

- Antenna mount on the top segment.
- Base for the foot segment.
- Not printed yet.
