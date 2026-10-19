# Kobo Clara HD MeshCore Grip

A handheld grip that turns a Kobo Clara HD into a MeshCore device without modifying it. 71 × 117 × 24.4 mm, two PETG pieces, three M3x8 cap screws.

- **The Kobo stays whole.** Hold it in landscape and slide its chin (the wide bezel at its bottom edge) sideways into the grip's slot. It slides out the same way.
  - A 90° micro USB plug in the slot's end goes into the Kobo's port, so the Kobo charges while it's in.
  - A tab cut free in the slot's floor has a ridge that presses the Kobo into the lip, so it clicks home.
- **The slot.** A 2 mm lip covers the chin in front, stopping 2 mm short of the screen. The grip's floor reaches about 40 mm in behind. The grip's top and bottom walls close its ends.
- **The power button is covered.** The slot's end wall is relieved over it so it isn't held down.
- **Cylinder.** An 18650 (with wire leads) lies in a cylinder up the right side, flush with the front and standing out at the back. A half-ring above the bay stops the cell sliding up, and the leads pass inside it.
- **Inside.** The grip's depth carries on inward behind the Kobo to a rounded inner end, closed by a back cover.
  - A **TP4056 USB-C charger** lies on the floor just above the cell, its USB-C through the right side under the first antenna. A rib behind it takes the plug's push.
  - Three **Seeed XIAO boards** (an nRF and two SX1262 radios) stand on end on the floor behind the chin, one under the other, left of the charger.
- **Two SMA bulkheads** stand in the top wall, the jack's hex under the wall and the nut on top:
  - over the cylinder: the jack goes up the cylinder from below, its hex in a hex hole;
  - in the top of the rounded inner end: the jack slides in from behind before the cover goes on.
- **Strip antenna.** One radio can use an internal strip antenna instead, stuck inside the rounded inner end below the second SMA.
- **Back cover.** It has 45° chamfered edges and three counterbored M3 screws: one into the first SMA's mount, two into bosses at the bottom.

The Kobo's outline and thickness (159.6 × 110 × 8.35 mm) are Kobo's spec. Some positions are **estimates from Kobo's drawing**:
- the screen's position, which sets where the lip stops;
- the power button and the micro USB port along the bottom edge.

Measure them before printing. The micro USB plug has to line up with the port within a fraction of a millimetre.

## Printing

| Piece | Orientation | Plate |
|---|---|---|
| Grip | standing on its bottom end | 1 |
| Back cover | outer face down, pads up | 2 |

No supports:
- Every wall of the grip runs straight up.
- The slot's top end bridges 8.65 mm between the lip and the floor.
- Both SMA mounts rise at 45°, the cell stop's underside is a 45° cone, and the bottom corners and screw seats are octagonal.
