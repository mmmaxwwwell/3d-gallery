# E-ink Dual-LoRa Handheld

A handheld case shaped after the Meshnology N37. It has a rounded body with a wing at the top left and an antenna bump at the top right, and the N37's angled band round the front and back faces, with every edge rounded. A 2.13" e-paper HAT stands upright down the left of the front, and the body runs on down into a bay for a big 5 Ah battery. It's 70 × 135 × 26.3 mm, and 167 mm tall with the wing.

## What goes in

- 2.13" e-paper HAT (Waveshare-style, 65 × 30.2 mm), behind the window on the left.
- Seeed XIAO nRF54L15 Sense, facing the front at the top right. Its microphone hears through a small port; its USB-C comes out the right side.
- Pin holes over the XIAO's program and reset buttons, for a paperclip.
- A swipe sensor below the XIAO, where the N37 has its joystick: a [PMW3610 breakout](https://lectronz.com/products/pmw3610-breakout-board) (31.5 × 23.5 mm, a low-power laser mouse sensor on SPI). Swipe a finger across the round window, a 12 mm clear disc sealed into the front. The board screws to two posts with M3x6 screws, regulator end to the left.
- Two smaller waterproof buttons right of the swipe window, on 6 × 6 mm SMD tact switches (legs lying flat), held in by the sensor board.
- Speaker (28 × 31 × 15.2 mm), facing the front in the bottom right corner behind a grille, sitting on the battery. Its I2C amp board lies on the back wall behind it.
- Two SX1262 radios (XIAO-size boards): one behind the XIAO, one behind the swipe sensor. Each has its own SMA jack: one on top of the wing, one in the bump.
- GPS: a Seeed L76K module behind the display, its patch antenna facing the front in the wing (as on the N37).
- A strong vibration motor (Precision Microdrives 312-107) lying up the wing behind the GPS antenna, held in a saddle with two zip ties. It draws 450 mA, so drive it through a MOSFET, not straight from the XIAO.
- Two sealed box switches (12.5 × 12.8 × 15.3 mm) behind the display, worked by waterproof buttons in the left side.
- A 5 Ah battery in a full-depth bay across the bottom, 60 × 40 × 20 mm: for example two 104060 cells (2.5 Ah each) side by side front to back, in parallel.

## Waterproof buttons

Each side button is printed in two materials on one plate: a TPU boot with a PETG plunger fused into its roof. The boot's flange sits against the inside of the left wall, round the hole. The switch's printed cradle squeezes it onto a ridge there, so water can't get past. The boot stands 4 mm out of the side; pressing it folds the boot and the plunger pushes the switch through its full 4 mm. The front buttons work the same way at a smaller size, sealed against the inside of the front.

## Printing

- **Plate 1, PETG:** the front cover (face down), the tub (back face down), the midframe and four switch cradles. No supports.
- **Plate 2, TPU + PETG:** the four buttons, flange down, on a printer that can do two materials.

## Assembly

Into the tub, from the front:

1. Side switches in their cradles, pushed into the pockets behind the side buttons. Fit the buttons first.
2. Battery, amp, motor, the L76K board and both radios.
3. The midframe, carrying the XIAO and the display.
4. The speaker.

Onto the front cover, from the inside:

1. Seal the clear disc into the swipe window.
2. Put the front buttons in their holes, and the front switches in their cradles over them.
3. Screw the sensor board onto its two posts over the cradles (M3x6).
4. Seat the GPS antenna in its fences.

Then close the cover onto the tub. Eight M3x20 cap screws go in from the back.

Not yet printed. These are all estimates to check:

- the display's view area;
- the radio boards;
- the microphone's position and the XIAO's button positions;
- the switch plunger height;
- the GPS antenna's size;
- the swipe sensor's lens size.
