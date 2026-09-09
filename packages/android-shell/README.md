# @3d-gallery/android-shell

A thin WebView host for `@3d-gallery/gallery-app`. The app's Vite build
output is bundled into `app/src/main/assets/webapp/` and served to the
WebView via `WebViewAssetLoader` at `https://appassets.androidplatform.net/`.
Serving the SPA from a same-origin `https://` URL is what lets the WebView
enable `SharedArrayBuffer` (via COOP/COEP headers) so the WASM slicer can
use pthreads when the native slicer isn't installed.

Seeded from `openscad-web-generator/android/` (OWG stays untouched on disk).

## Build

```bash
# From the workspace root:
npm run apk           # gradle assembleDebug — produces app-debug.apk
npm run apk:install   # assembleDebug + adb install + launch
npm run apk:debug     # apk:install + tail logcat
```

Or directly:

```bash
cd packages/android-shell
gradle assembleDebug
```

The `preBuild` task chains to `buildGalleryApp` (which runs
`npm run build -w @3d-gallery/gallery-app` at the workspace root) and
`copyGalleryAppAssets` (which mirrors `packages/gallery-app/dist/**`
into `app/src/main/assets/webapp/`). No manual copy step is required.

## Prerequisites

- Android SDK 35, build-tools 34.0.0+ / 35.0.0.
- Android NDK **26.1.10909125** (matches OWG's Nix input; required only
  if you want to build the native slicer JNI wrapper).
- JDK 17.
- Node 20+ and a working `npm install` at the workspace root (so the
  `buildGalleryApp` Gradle task can build the WebView content).

The 3d-gallery `flake.nix` does **not** yet pin the Android toolchain
(the upstream OWG flake does, but requires `config.allowUnfree = true`
and `config.android_sdk.accept_license = true`). If you're on NixOS,
either accept those in your own flake overlay, or install the Android
SDK/NDK via `sdkmanager` and set `ANDROID_HOME` before running gradle.

## JS bridge contract

The activity injects three `@JavascriptInterface` classes that mirror
the TypeScript declarations in
`packages/print-toolkit/src/android-shim-types.ts`. **Kotlin/Java method
signatures must stay in lock-step with that file — it is the durable
contract between the WebView (`@3d-gallery/gallery-app`) and this
shell.**

| Global (`window.…`)         | Kotlin/Java class            | Purpose                                                                 |
| --------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `NativeSlicer`              | `SlicerBridge`               | Native OrcaSlicer via JNI. Skipped if `libslic3r.so` isn't installed.   |
| `AndroidPrinterDiscovery`   | `AndroidPrinterDiscoveryBridge` | mDNS/NSD LAN scan for Moonraker + cleartext-traffic hint.               |
| `AndroidFileBridge`         | `AndroidFileBridgeBridge`    | Storage Access Framework file open/save (Orca config imports/exports). |

`AndroidFileBridge.openFile`/`saveFile` are async: the shell records a
`callbackId → resolver` mapping, launches the SAF intent, and on
`onActivityResult` invokes `window.___androidFileBridgeResolve(id, …)`
or `window.___androidFileBridgeReject(id, …)`. The toolkit's runtime
shim (in `@3d-gallery/print-toolkit`) wraps that into a `Promise<string>`
returned to callers.

`NativeSlicer.sliceAsync` fires results back via
`window.onSlicerProgress`, `window.onSlicerResult`, and
`window.onSlicerError` — all three declared in `android-shim-types.ts`.

## Native slicer path (optional)

The Nix flake in `openscad-web-generator/` builds
`orcaslicer-android-arm64` and `orcaslicer-android-arm32` — copy the
resulting `libslic3r.so` into
`app/src/main/jniLibs/<abi>/libslic3r.so` and the matching headers into
`app/src/main/jni/include/` before running `gradle assembleDebug`.
Without those files, `hasNativeLibs` in `app/build.gradle.kts` is false
and the CMake step is skipped — the shell still builds, the WebView
loads, and the toolkit falls back to the WASM slicer.

## Package coordinates

- `applicationId`: `com.mmmaxwwwell.gallery3d`
- `namespace`:     `com.mmmaxwwwell.gallery3d`
- App label:       "3D Gallery" (`res/values/strings.xml`)

## References

- Shim contract: [`packages/print-toolkit/src/android-shim-types.ts`](../print-toolkit/src/android-shim-types.ts)
- Migration brief: [`docs/migration-swarm.md`](../../docs/migration-swarm.md) → task T9
