# @3d-gallery/print-toolkit

Framework-agnostic slice-and-print stack. Extracted from `openscad-web-generator/src/lib`.

## Scope

- **OrcaSlicer WASM slicer** with an optional Android JNI-native backend (`window.NativeSlicer`)
- **Moonraker HTTP client** for Klipper (live status, controls, upload G-code + start print)
- **Orca config importer** (`.orca_printer` / `.orca_filament` / `.orca_process` bundles)
- **Storage adapter interface** with an IndexedDB implementation for browsers

No React, no Preact, no DOM assumptions beyond `window` feature-detection for Android shims. Consumers wire their own UI.

## Public API (target)

```ts
import {
  createSlicerEngine,          // WASM engine
  createSlicerBackend,          // auto-picks native if window.NativeSlicer exists
  buildOrcaConfig,              // PrintProfile + filament + printer → config dict
  buildPlateSliceConfig,        // multi-object build plate
  fetchPrinterConfig,           // Moonraker: fetch printer.cfg
  uploadGcode,                  // Moonraker: PUT to /server/files/upload
  startPrint,                   // Moonraker: POST /printer/print/start
  BrowserStorageAdapter,        // IndexedDB
  type StorageAdapter,
  type PrintProfile,
  type PrinterSettings,
  type PrinterConfig,
  type FilamentSettings,
  type ResolvedFilamentSettings,
} from "@3d-gallery/print-toolkit";
```

## Moonraker

`src/moonraker-api.ts` is the only way the gallery reaches a printer. Every
function takes the printer's `address` (`host:port`, protocol optional) first,
and every call refuses up front on an HTTPS page reaching an `http://` printer
(browsers block it; the Android shell can allow it).

- **Status.** `fetchPrinterLive(address)` is one `/printer/objects/query`
  (asking only for objects `/printer/objects/list` reports; the list is cached
  per address and re-read after a failed query) plus `/machine/proc_stats` for
  uptime, flattened into a `PrinterLiveStatus`. It still resolves while Klipper
  is down, with `klippyState` / `klippyMessage` and nothing else, and throws
  only when Moonraker can't be reached. `layer` / `totalLayers` stay null unless
  the slicer emits `SET_PRINT_STATS_INFO`.
- **Commands.** `sendGcode`, `emergencyStop`, `firmwareRestart`,
  `pausePrint`, `resumePrint`, `cancelPrint`, `startPrint`, `uploadGcode`.
  `sendGcode` resolves when Klipper has finished the script, so a mesh holds
  the request open for minutes.
- **Files.** `listGcodeFiles` (newest first, with the slicer estimate and the
  largest thumbnail), `fileExists`, `fetchJobHistory`, `fetchConsole` /
  `fetchConsoleTail`, `listWebcams`.

### Controls and the ZMOD macros

`macroScript` (`src/moonraker-control.ts`) builds the G-code for each
dashboard control; send it with `sendGcode`. `MACRO_NEEDS[control]` names the
`gcode_macro`s it calls, and `controlAvailable(control, live.macros)` says
whether a printer has them, so a UI hides a control the printer can't run.
Numbers are checked finite (a `RangeError` otherwise) and object names must be
one word, since the script is raw G-code.

The fleet's macros, read from `/printer/objects/query?configfile` on a ZMOD
Adventurer 5M (all three printers list the same set):

| Control | Sends | What the macro does | Mid-print |
|---|---|---|---|
| `home()` | `G28` | ZMOD overrides G28: homes only the axes not yet homed; a no-op when all are | No |
| `loadFilament(temp?)` | `[M109 S<temp>]` `LOAD_FILAMENT` | Feeds `load_distance` (125 mm) at 450 mm/min. **Doesn't heat**: pass a temperature, or Klipper refuses the cold extrude | No |
| `unloadFilament(temp?)` | `[M109 S<temp>]` `UNLOAD_FILAMENT` | Retracts `unload_distance` (75 mm). Doesn't heat either | No |
| `purge(mm?)` | `[SET_GCODE_VARIABLE … purge_distance]` `PURGE_FILAMENT` | Extrudes `purge_distance` (25 mm). Takes no length, so a length sets the variable, which sticks until Klipper restarts | No |
| `meshAndSave()` | `AUTO_FULL_BED_LEVEL` `NEW_SAVE_CONFIG` | Cleans the nozzle (`CLEAR_NOZZLE`, unless ZMOD's `disable_cleaning`), heats to 240/80, homes, meshes into profile `auto`, then turns heaters and fans off. **Doesn't save**: `NEW_SAVE_CONFIG` does (ZMOD's SAVE_CONFIG that doesn't freeze the stock screen); it restarts Klipper | No |
| `clearNozzle()` | `CLEAR_NOZZLE` | Homes, heats to 230/80, probes and wipes the nozzle on the bed's rear strip, cools to `clear_cooldown_temp` | No |
| `coldPull(temps?)` | `COLDPULL` or `_COLDPULL_LOAD_MATERIAL TEMP= COLD=` | `COLDPULL` only raises an action prompt (PLA 220/100, PETG 250/100, ABS 260/105, NYLON 265/120) that Mainsail, Fluidd or the screen must answer. With temps it starts the pull: homes, heats, extrudes 100 mm, cools with the fan on, pulls back 70 mm | No |
| `pauseNextLayer()` | `SET_PAUSE_NEXT_LAYER ENABLE=1` | Arms a `PAUSE` at the next `SET_PRINT_STATS_INFO` layer change; cleared by cancel. Needs the slicer to emit layer changes | Yes |
| `excludeObject(name)` | `EXCLUDE_OBJECT NAME=` | Klipper built-in | Yes |
| `zOffsetAdjust(mm)` | `SET_GCODE_OFFSET Z_ADJUST= MOVE=1` | ZMOD overrides SET_GCODE_OFFSET: applies it, **and saves the new Z offset** (`SET_MOD z_offset`) for later prints. `MOVE=1` needs homed axes | Yes |
| `speed(pct)` / `flow(pct)` | `M220` / `M221` | Built-ins | Yes |
| `fan(pct)` | `M106 S<0–255>` | ZMOD's M106 routes to `fan_generic fanM106` (P2 / P101 would be the chamber fan) | Yes |
| `light(on)` | `LED_ON` / `LED_OFF` | `SET_LED LED=chamber_light WHITE=1/0` | Yes |
| `restartCamera()` | `CAMERA_RESTART` | Restarts the camera service (`S98camera restart`) | Yes |
| `reboot()` | `REBOOT` | Clears the mesh, syncs, reboots the host | No |
| `powerOff()` | `SHUTDOWN` | Clears the mesh, syncs, cuts power (`power_off` pin) | No |
| `disableMotors()` | `M84` | Built-in | No |
| `extrude(mm)` / `retract(mm)` | `_CLIENT_EXTRUDE` / `_CLIENT_RETRACT LENGTH=` | Mainsail's client macros: move the extruder only if it's hot enough, else say so on the console | Paused only |
| `park()` | `_TOOLHEAD_PARK_PAUSE_CANCEL` | Retracts, lifts 10 mm and parks at the fleet's custom position (105, 105); refuses unless homed. What PAUSE and CANCEL use | Paused only |
| `setNozzle(c)` / `setBed(c)` | `M104` / `M140` | Built-ins, no wait | No (as presets) |

`pausePrint` / `resumePrint` / `cancelPrint` go through Moonraker's
`/printer/print/*`, which run the fleet's `PAUSE` (parks, keeps the nozzle
temperature to restore), `RESUME` (reheats if idle timed out, and, with ZMOD's
`filament_switch_sensor` on, refuses while `e0_sensor` sees no filament) and `CANCEL_PRINT` (parks, retracts, heaters off).

## Orca option schema

`@3d-gallery/print-toolkit/orca-schema-data` is libslic3r's own table of printer
and filament settings — type (`floats`, `enum`, `percent`, …), label, tooltip,
units, bounds, enum choices, default — plus the pages and groups Orca's settings
tabs lay them out in. It is **generated** from an OrcaSlicer source tree, never
hand-edited:

```bash
git clone --depth 1 -b v2.3.2 https://github.com/SoftFever/OrcaSlicer /tmp/orca
npm run gen:orca-schema -w @3d-gallery/print-toolkit -- /tmp/orca
```

The generator reads `PrintConfigDef` (PrintConfig.cpp), the per-kind key lists
(Preset.cpp) and the tab layout (Tab.cpp, PhysicalPrinterDialog.cpp). Keys the
tabs never place land on an "Other" page by category, so every key of a kind is
reachable. The committed file records the Orca version it came from.

`@3d-gallery/print-toolkit/orca-schema` has the types and the value rules:
`toCells` / `fromCells` between Orca's on-disk shapes and editable cells,
`validateCell` for type and bounds, `describeValue` for display. The data file
is ~100 kB, so import it lazily.

## WASM assets

`libslic3r.js` + `libslic3r.wasm` are fetched into `assets/` by `scripts/fetch-wasm.mjs` from the OrcaSlicer-WASM GitHub releases. Consumers must serve these at `${BASE_URL}/wasm/` in production; a Vite plugin is provided (`@3d-gallery/print-toolkit/vite-plugin`) that copies them into the consumer's build automatically.

## Node

`@3d-gallery/print-toolkit/node` exports `createNodeSlicerEngine()`: the same `SlicerEngine`, loaded straight from `assets/` for build-time slicing (the gallery's print-time estimates). Node only — never import it from a browser bundle. The print-time estimate is filled in by the G-code processor, so call `exportGCode()` before `getSliceStats()`.

## Android integration

The toolkit is fully usable in an Android WebView. If the host injects any of these globals (all optional), the toolkit uses them instead of the browser fallback:

| Global                          | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `window.NativeSlicer`           | Native OrcaSlicer via JNI (skips WASM path)          |
| `window.AndroidPrinterDiscovery`| mDNS/NSD LAN scan for Moonraker hosts                 |
| `window.AndroidFileBridge`      | Storage Access Framework file picker for Orca configs|

TypeScript declarations live in `src/android-shim-types.ts` — that file is the durable contract between the WebView and the Android shell.
