# E-ink Dual-LoRa Handheld

A handheld case shaped after the Meshnology N37: a rounded body with a wing at the top left and an antenna bump at the top right. It is 3 mm taller (66 × 81 mm, plus the wing) so a 2.13" e-paper HAT stands upright down the left of the front, and 26.3 mm thick.

## What goes in

- 2.13" e-paper HAT (Waveshare-style, 65 × 30.2 mm), behind the window on the left.
- Seeed XIAO nRF52840 Sense, facing the front at the top right. Its microphone hears through a small port; its USB-C comes out the right side.
- An optical mouse sensor below the XIAO, where the N37 has its joystick. Swipe a finger across the round window. The window is a 12 mm clear disc sealed into the front. The sensor hasn't been chosen yet, so its space is sized for a standard mouse lens.
- Speaker (28 × 31 × 15.2 mm), facing the front in the bottom right corner behind a grille. Its I2C amp board lies on the back wall behind it.
- Two SX1262 radios (XIAO-size boards): one behind the XIAO, one in the wing. Each has its own SMA jack: one on top of the wing, one in the bump.
- Two sealed box switches (12.5 × 12.8 × 15.3 mm) behind the display, worked by waterproof buttons in the left side.
- A 103030 LiPo (about 1000 mAh) behind the display, under the switches.

## Waterproof buttons

Each button is printed in two materials on one plate: a TPU boot with a PETG plunger fused into its roof. The boot's flange sits against the inside of the left wall, round the hole. The switch's printed cradle squeezes it onto a ridge there, so water can't get past. The boot stands 4 mm out of the side; pressing it folds the boot and the plunger pushes the switch through its full 4 mm.

## Printing

- **Plate 1, PETG:** the front cover (face down), the tub (back face down), the midframe and two switch cradles. No supports.
- **Plate 2, TPU + PETG:** the two buttons, flange down, on a printer that can do two materials.

## Assembly

Everything goes into the tub from the front:

1. Switches in their cradles, pushed into the pockets behind the buttons. Fit the buttons first.
2. Battery, amp and the first radio.
3. The midframe, carrying the XIAO, the second radio and the display.
4. The speaker and the mouse sensor.
5. The front cover.

Five M3x20 cap screws go in from the back.

Not yet printed. The display's view area, the radio boards, the microphone's position, the switch plunger height and the mouse sensor are all estimates to check.
