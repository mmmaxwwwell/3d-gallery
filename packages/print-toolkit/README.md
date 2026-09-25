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
