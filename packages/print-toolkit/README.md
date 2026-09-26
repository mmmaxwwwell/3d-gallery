# @3d-gallery/print-toolkit

Framework-agnostic slice-and-print stack. Extracted from `openscad-web-generator/src/lib`.

## Scope

- **OrcaSlicer WASM slicer** with an optional Android JNI-native backend (`window.NativeSlicer`)
- **Moonraker HTTP client** for Klipper (upload G-code + start print)
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
