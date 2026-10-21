# eink-dual-lora-case

A handheld case in the Meshnology N37's shape for the user's own build: a 2.13" e-paper HAT, a pinless hand-wired XIAO Sense, two SX1262 radios, two sealed box switches, an optical mouse sensor for swipes, and a speaker with an I2C amp. devOnly, unprinted. Started 2026-10-20 from scratch; the user called the kobo-meshcore-case "complete garbage", so take nothing from it.

## The user's brief (2026-10-20)

- "i like the look and feel of the current meshology n37 … take inspiration from their design, but make it better". Their name for it is "meshology"; the maker is Meshnology. The N37 is a Wio Tracker L1 in a clamshell case: 66 × 24 × 78 body (from their dimension photo), a GPS "wing" at the top left reaching 110 mm overall, an SMA bump at the top right, a screen window over a framed lower front panel. Don't copy their branding.
- "the example blank is like 3mm to short … start with that shape but add 3mm". Once the HAT went portrait, the 3 mm went into the height: the 65 mm board plus its ~1.2 mm ribbon fold needs 81 mm.
- The e-ink is a LAFVIN 2.13" e-Paper HAT (Waveshare clone, 65 × 30.2 board; the user sent a photo). "have the hat be vertical on the left side on the front".
- XIAO nRF52840 **Sense** (IMU + mic), no pins, hand-wired. It "goes above where the buttons are on the existing N37s": the right column, above the N37's joystick spot. Its mic needs the port.
- Two SX1262 radios. Their module isn't named; XIAO-size boards (21 × 17.8) are assumed.
- Two side buttons are **sealed box switches, 12.5 × 12.8 × 15.3, 4 mm throw, two leads**. They need "a multi material waterproof button". They go "on the left side behind the screen".
- I2C speaker module: speaker box 15.2 × 28 × 31, "facing the front in the bottom right hand corner"; amp board 22.5 × 38.6 wired to the XIAO.
- "a usb mouse sensor we detect swipes with instead of a dpad". Not bought yet: the sensor is a placeholder sized for a standard mouse lens (21.3 × 19.3, surface 2.4 mm from the lens and 7.4 mm from the PCB). The XIAO can't host USB, so it has to talk to the sensor chip over SPI. Resize the `sns_*` params when the part arrives.

## Frame (read this first)

The lib lays out with X right as seen from the front, Y up, Z from the front face (0) to the back (`case_t`). With Z running away from a viewer in front, that frame is a **mirror image**: the first renders came out with the wing top-right. Every `*_part` module mirrors X once. The assembled preview goes through `upright()`, which mirrors X and stands the device up (Y up becomes Z up, front toward -Y, which is what the gallery's camera faces). So in the lib, `-x` is the user's left (display, buttons) and `+x` the right (XIAO, sensor, speaker). Keep new geometry in the layout frame and let the mirror do the rest. For a true front view, render with `--camera=0,15,0,0,180,0,300` on a `mirror([1,0,0])` wrapper.

## Parts and assembly

- **Front cover** (`front_cover`, PETG, face down): the front wall plus the first `cover_depth` (3.6) of the sides, including the front chamfer. It carries the window (45° flare), the speaker grille, the mic port and duct, and the swipe window with the pocket for its clear disc. It also has the lens pads, the HAT's right-edge fence, the speaker fences (none along the speaker's top, where the lens sits), and free-standing screw bosses with pilots. Its tongue (the inner half of the wall) rises into the tub's rebate.
- **Tub** (`tub`, PETG, back face down): sides and back. It has bosses from the back wall forward to the midframe, the switch pockets (ribs plus a back wall slotted for leads, slot open to the front so it has no roof), the seal beads, posts holding the speaker and battery forward, and fences round the amp. The counterbores are in the back.
- **Midframe** (PETG, back face down): a plate behind the display and XIAO (`mid_z0`…`mid_z1`), cut away over the speaker and the sensor. Everything it carries is on its front: ribs pressing the HAT's long edges, fences round the XIAO (left and top only; its USB-C end and the lens rule out the others) and radio 2 (no top, under the wing screw). It also has wire holes and zip slots for both radios.
- **Cradles** (×2, PETG, ring face down): a sleeve round each switch box, open behind for the leads, its front a ring the plunger passes through.
- **Buttons** (×2, plate 2, TPU + PETG): see *Waterproof buttons*.
- Assembly, all from the front into the tub: cradles with switches into their pockets (the ring's lead-in rides over the boot flange), battery, amp, radio 1, then the midframe with the XIAO, radio 2 and the HAT, then the speaker and sensor, then the front cover. Five M3x20 from the back clamp the midframe between the tub's bosses and the cover's. `screw_head_z = screw_skin + screw_len`, so the counterbores are 5.3 deep.

## Layout

- **Depth stack, left:** front wall, panel, HAT board, its parts (`disp_parts` 2.2, a guess; the JST is at the bottom end), midframe, switch cradles (12.5 of the box across Z), back wall. That stack is why `case_t` is 26.3, the N37's 24.3 + 2: at 24.3 the boxes don't fit behind the display.
- **Why the seam is at the front.** Each boot's flange (z 9…23) needs one solid wall, so the seam can't be mid-depth. A back lid would put its tongue's rebate across the flange too.
- **Right column, top to bottom:** XIAO Sense (USB-C out the right side, mic port at `mic_offset`, a guess along the board), mouse sensor, speaker (its outer corner on the inside corner arc). Radio 1 sits behind the XIAO, the amp on the back wall behind the speaker. Radio 2 stands in the wing, with SMA 2 on the wing's top and SMA 1 in the bump.
- **Battery:** a 103030 (~1000 mAh) behind the display under the switches. The N37's 61 × 50 pack can't share the depth with 15 mm switch boxes. Its pocket takes up to about 30 × 32 × 15.
- **Screws** (`screws`): wing, top middle, right side, bottom left corner, bottom middle. There's no top right one: the XIAO fills that corner, so it's held by the top middle and right screws and the tongue. Cover bosses are free circles clear of the walls (the walls above the seam belong to the tub). The tub's lean into the walls.

## Waterproof buttons

- The **TPU boot** (`boot_tpu`) is printed flange down: a flange (14 × 1.2), a sleeve (OD 9, wall 0.8) through the wall's teardrop hole, and a roof `wall + sw_throw` above the flange, so it stands 4 mm proud. Pressed, the sleeve buckles and gives the full throw before the roof reaches the wall.
- The **PETG plunger** (`boot_stem`) stands free inside it on the bed and fuses into the roof through a 45° head (`stem_head_d`). Its tip is at the flange plane, where the switch's plunger tip sits.
- **Seal:** the cradle's ring squeezes the flange `flange_squeeze` (0.3) onto a half-round bead round the hole. The flange-into-wall overlap you see in an interference check is that squeeze.
- `sw_plunger_out` (2) is a guess: it sets the ring's thickness. The case seams themselves aren't sealed; only the buttons are (and the swipe window, with silicone).

## Checks

- **Interference:** intersect each pair (cover/tub, midframe with each, cradles with tub/midframe, each `ref_*` with each part). Only zero-volume contacts and the boot squeeze should remain.
- **Overhangs:** check the exported `parts/*.scad` STLs' facet normals.
  - Front cover: only its 0.8 mm decorative grooves (bridged).
  - Tub: the counterbore floors (bridged rings), the flat tips of the teardrop holes, and the 0.4 mm seal beads.
  - Midframe and cradles: none.

## Unmeasured / guesses

The HAT's active area (assumed centred), `disp_parts`, the radios (XIAO-size), the XIAO Sense mic position, the switch plunger height, which box face is 12.5 vs 12.8, the speaker's outlet (assumed centred on its 28 × 31 face), the amp's height, the battery, and the whole mouse sensor.
