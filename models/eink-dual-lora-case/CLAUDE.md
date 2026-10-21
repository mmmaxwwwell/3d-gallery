# eink-dual-lora-case

A handheld case in the Meshnology N37's shape for the user's own build. It holds a 2.13" e-paper HAT, a pinless hand-wired XIAO Sense, two SX1262 radios, an L76K GPS, two sealed box switches and two front tact switches, a PMW3610 optical sensor for swipes, a speaker with an I2C amp, a strong vibration motor and a 5 Ah battery. devOnly, unprinted. Started 2026-10-20 from scratch; the user called the kobo-meshcore-case "complete garbage", so take nothing from it.

## The user's brief (2026-10-20)

- "i like the look and feel of the current meshology n37 … take inspiration from their design, but make it better". Their name for it is "meshology"; the maker is Meshnology. The N37 is a Wio Tracker L1 in a clamshell case: 66 × 24 × 78 body (from their dimension photo), a GPS "wing" at the top left reaching 110 mm overall, an SMA bump at the top right, a screen window over a framed lower front panel. Don't copy their branding.
- "the example blank is like 3mm to short … start with that shape but add 3mm". Once the HAT went portrait, the 3 mm went into the height: the 65 mm board plus its ~1.2 mm ribbon fold needs 81 mm.
- The e-ink is a LAFVIN 2.13" e-Paper HAT (Waveshare clone, 65 × 30.2 board; the user sent a photo). "have the hat be vertical on the left side on the front".
- XIAO nRF52840 **Sense** (IMU + mic), no pins, hand-wired. It "goes above where the buttons are on the existing N37s": the right column, above the N37's joystick spot. Its mic needs the port.
- Two SX1262 radios. Their module isn't named; XIAO-size boards (21 × 17.8) are assumed.
- Two side buttons are **sealed box switches, 12.5 × 12.8 × 15.3, 4 mm throw, two leads**. They need "a multi material waterproof button". They go "on the left side behind the screen".
- I2C speaker module: speaker box 15.2 × 28 × 31, "facing the front in the bottom right hand corner"; amp board 22.5 × 38.6 wired to the XIAO.
- Later asks:
  - pin holes for the XIAO's program and reset buttons;
  - "two buttons on the right side of the mouse sensor";
  - "a powerful vibration motor. Find one": I picked the Precision Microdrives 312-107 (12 × 15.1, 3 V, 14.3 G, 450 mA; needs a MOSFET);
  - a GPS, "the same one that's included in the meshology N37 … L7K": Quectel L76K, so Seeed's L76K module for XIAO (18 × 21) plus its active patch, the patch "in that top left high lobe" (the wing);
  - the 103030's space "for something else" and "a solid big battery at the bottom like a 5ah battery. add height and fill it": the L76K board took the space;
  - "i really liked how the other module had that angled part around with the rounded edges everywhere" (the L1 holster's band), then "beveled more";
  - "more screw holes", from the user's stock of M3 SHCS in many lengths.
- "a usb mouse sensor we detect swipes with instead of a dpad", then "you find the swipe sensor man go".
  - I picked a **PMW3610 breakout**: Trent Rand's ($25, Lectronz), the same 31.5 × 23.5 board as siderakb's open design. It's PixArt's low-power laser mouse sensor on an LM18-LSI lens, SPI at 3.3 V, with a ZMK driver for the nRF52840.
  - Rejected: BlackBerry optical trackpads (many variants and pinouts, flex pads, 2.85 V) and the Parallax OFN module (out of stock).
  - Geometry from siderakb's KiCad file: M3 holes 3 in from each edge, sensor 2.99 off-centre along the long side.
  - From PixArt's datasheet, measured from the tracking surface: lens underside 2.4, board underside 5.8 (7.4 to its top), sensor top 9.05.
  - The LM18-LSI's footprint (19 × 13) is my estimate.

## Frame (read this first)

The lib lays out with X right as seen from the front, Y up, Z from the front face (0) to the back (`case_t`). With Z running away from a viewer in front, that frame is a **mirror image**: the first renders came out with the wing top-right. Every `*_part` module mirrors X once. The assembled preview goes through `upright()`, which mirrors X and stands the device up (Y up becomes Z up, front toward -Y, which is what the gallery's camera faces). So in the lib, `-x` is the user's left (display, buttons) and `+x` the right (XIAO, sensor, speaker). Keep new geometry in the layout frame and let the mirror do the rest. For a true front view, render with `--camera=0,15,0,0,180,0,300` on a `mirror([1,0,0])` wrapper.

## Body

- `outline()` is the inside's reference: the walls are `wall` in from it, and every internal position is laid out against it.
- The outside is `outer_outline()`, `skin` (2) bigger all round. That's what lets the band and rounds be big without thinning walls round the display, the seals or the corners.
- `solid_body()` sweeps the outer outline with `body_kernel()`, a rounded double frustum. That gives the angled band round each face at `bevel_angle` (57.5°, the holster's measured 122.5°), `bevel_depth` (6) deep, with every edge rounded `edge_round` (2).
- The cavity's edges against the front and back walls are 45° chamfered `cavity_chamfer` (1), which keeps the walls under the bands thick.
- The checks `the front band thins the wall beside the display` and `the back band thins the wall behind the side buttons' seals` guard the two tight spots.
- Holes through the side and top walls run `wall + skin` deep, and the side boots' sleeves are `wall + skin + sw_throw` long.
- The body runs down from the old bottom line (`-inner_y`) into the battery bay, to `bottom`: low enough that the bottom corner screws clear the battery.

## Parts and assembly

- **Front cover** (`front_cover`, PETG, face down): the front wall plus the first `cover_depth` (3.6) of the sides, including the front chamfer. It carries the window (45° flare), the speaker grille, the mic port and duct, and the swipe window with the pocket for its clear disc. It also has the lens pads, the HAT's right-edge fence, the speaker fences (none along the speaker's top, where the lens sits), and free-standing screw bosses with pilots. Its tongue (the inner half of the wall) rises into the tub's rebate.
- **Tub** (`tub`, PETG, back face down): sides and back. It has bosses from the back wall forward to the midframe, the switch pockets (ribs plus a back wall slotted for leads, slot open to the front so it has no roof), the seal beads, posts holding the speaker and battery forward, and fences round the amp. The counterbores are in the back.
- **Midframe** (PETG, back face down): a plate behind the display and XIAO (`mid_z0`…`mid_z1`), cut away over the speaker, the sensor board, the GPS and the battery. Everything it carries is on its front: ribs pressing the HAT's long edges, fences round the XIAO (left and top only; its USB-C end and the lens rule out the others) and radio 2 (no top, under the wing screw). It also has wire holes and zip slots for both radios.
- **Front cradles** (×2, PETG, ring face down): the same idea for 6×6 SMD tact switches, notched at the back for their flat legs. The sensor board's underside holds them forward. Fences on the cover sit above the upper one, below the lower one and left of each (they're too close together for one between); the right wall's chamfer sets how close to the wall they can go.
- **Cradles** (×2, PETG, ring face down): a sleeve round each switch box, open behind for the leads, its front a ring the plunger passes through.
- **Buttons** (×2, plate 2, TPU + PETG): see *Waterproof buttons*.
- Assembly: into the tub from the front go the side cradles with their switches (the ring's lead-in rides over the boot flange), the battery, amp, motor, L76K board and radios, then the midframe with the XIAO and the HAT, then the speaker. Onto the cover go the disc, the front buttons and cradles, the sensor board (M3x6 into its posts) and the GPS antenna. Then the cover closes on, and eight M3x20 from the back clamp the midframe between the tub's bosses and the cover's. `screw_head_z = screw_skin + screw_len`, so the counterbores are 5.3 deep.

## Layout

- **Depth stack, left:** front wall, panel, HAT board, its parts (`disp_parts` 2.2, a guess; the JST is at the bottom end), midframe, switch cradles (12.5 of the box across Z), back wall. That stack is why `case_t` is 26.3, the N37's 24.3 + 2.
- **Why the seam is at the front.** Each boot's flange (z 9…23) needs one solid wall.
- **Left, behind the display:** the two side switches (upper), then the L76K board on tub posts where the 103030 used to be.
- **Right column, top to bottom:**
  - the XIAO Sense, with USB-C out the right side, a mic port at `mic_offset` (a guess) and pin holes plus guides over its buttons (`xiao_buttons`, a guess);
  - the PMW3610 board lying across the whole column (`sns_board_c`), finger side forward, its regulator end left so the sensor (`sns_c`, the window) is left of centre. Its left holes take M3x6 into posts on the cover; its right holes sit on backing posts from the tub.
  - the two front buttons, under the board's right end, which presses their cradles forward (`fsw_back_z` = `sns_pcb_z0`). That's why they're SMD tact switches, legs flat;
  - the speaker, on the battery bay's top edge and against the right wall.
  - The column is full: the speaker, board and XIAO stack with 0.1–0.25 mm gaps, and the XIAO's top right corner just clears the inside corner arc.
- **Behind the right column:**
  - radio 1 behind the XIAO, on the midframe's back;
  - radio 2 behind the sensor board, above its screw heads, on tub posts;
  - the amp on the back wall behind the speaker.
- **Wing:** the GPS patch faces the front (midframe cut round it). Behind it the motor lies up the wing in a saddle on the back wall, held by two zip ties through tunnels under it. SMA 2 sits on the wing's top, nudged left for the motor; SMA 1 is in the bump.
- **Battery bay:** full depth across the bottom, 60 × 40 × 20 (`batt`). The midframe stops above it. Ribs from the back hold it forward.
- **Screws** (`screws`, all M3x20, since every boss runs the same depth):
  - wing, top middle, middle (between display and XIAO);
  - the old bottom left corner and bottom middle (now above the battery);
  - both new bottom corners and the bottom middle, under the battery.
  - There are none down the right side: the XIAO, the front buttons and the speaker fill it, so that side relies on the tongue. None fit down the left either (the display), or in the bump (tested).
  - Cover bosses are free circles clear of the walls; the tub's lean into them.

## Waterproof buttons

- The **TPU boot** (`boot_tpu`) is printed flange down: a flange (14 × 1.2), a sleeve (OD 9, wall 0.8) through the wall's teardrop hole, and a roof `wall + skin + sw_throw` above the flange, so it stands 4 mm proud. Pressed, the sleeve buckles and gives the full throw before the roof reaches the wall.
- The **PETG plunger** (`boot_stem`) stands free inside it on the bed and fuses into the roof through a 45° head (`stem_head_d`). Its tip is at the flange plane, where the switch's plunger tip sits.
- **Seal:** the cradle's ring squeezes the flange `flange_squeeze` (0.3) onto a half-round bead round the hole. The flange-into-wall overlap you see in an interference check is that squeeze.
- The front buttons (`fboot_tpu`, `fboot_stem`) are the same at tact-switch scale. Their flange (7.6) sits on a bead round a hole in the front wall; the front cradle's ring is the switch plunger's height, so the stem's tip meets the plunger at the flange plane.
- `sw_plunger_out` (2) is a guess: it sets the ring's thickness. The case seams themselves aren't sealed; only the buttons are (and the swipe window, with silicone).

## Checks

- **Interference:** intersect each pair (cover/tub, midframe with each, cradles with tub/midframe, each `ref_*` with each part). Only zero-volume contacts and the boot squeeze should remain.
- **Overhangs:** check the exported `parts/*.scad` STLs' facet normals.
  - Front cover: only its 0.8 mm decorative grooves (bridged).
  - Tub: the counterbore floors (bridged rings), the motor saddle's 3 mm zip-tie tunnels (bridged), the flat tips of the teardrop holes, and the 0.4 mm seal beads.
  - Front cradles: 1.6 mm² in the leg notches.
  - Midframe and side cradles: none.
- **Plate 1** fits a 220 bed at about 214 × 169 with no piece over another.

## Unmeasured / guesses

The HAT's active area (assumed centred), `disp_parts`, the radios (XIAO-size), the XIAO Sense mic position, the switch plunger height, which box face is 12.5 vs 12.8, the speaker's outlet (assumed centred on its 28 × 31 face), the amp's height, the GPS patch's size, the front tact switches, and the LM18-LSI lens's footprint.
