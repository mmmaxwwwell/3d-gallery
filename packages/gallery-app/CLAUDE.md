# @3d-gallery/gallery-app

The web UI package. Vite + Preact + Three.js + Playwright. Deployed to GitHub Pages at `/3d-gallery/`.

Start with the repo-root `CLAUDE.md` for the model / manifest / build-pipeline conventions — this file only covers the gallery-app-specific quirks that changed when the app moved into a workspace.

## Package-specific quirks

- **Preact via `react` alias.** `vite.config.ts` aliases `react → preact/compat`, `react-dom → preact/compat`, `react/jsx-runtime → preact/jsx-runtime`. Any component that imports from `react` is really Preact at runtime. Don't add a real React dependency; don't add `@types/react` (Preact's types resolve through the alias). Any new print UI wired up under `src/print/` is Preact too.
- **Vite base path is `/3d-gallery/`.** Local dev serves under the same prefix as production so relative URLs behave identically. Assets loaded via `import.meta.env.BASE_URL` still resolve correctly.
- **`models/manifest.json` is served from the repo root via middleware.** `liveManifestPlugin` in `vite.config.ts` intercepts `GET /3d-gallery/models/manifest.json` in dev and streams `../../models/manifest.json` off disk, so edits show up on refresh without `npm run build:models`. In production, `scripts/build-models.mjs` (repo root) mirrors it to `public/models/manifest.json` — the middleware doesn't run there.
- **`publicDir` points at the repo-root `public/`.** `scripts/build-models.mjs` (root) writes STL/3MF into `../../public/models/`; PWA icons and WASM live there too. Don't duplicate `public/` inside this package.
- **`scadWatcherPlugin` watches `../../models/**/*.scad` in dev** and rebuilds the affected slug via `buildModel(model)` from the root `scripts/build-models.mjs`. This is why the build pipeline stays at the repo root: both this dev-server plugin and CI invoke it directly.
- **Playwright config lives here.** `webServer` runs `npm run dev -- --host 127.0.0.1 --port 5173`, which the workspace resolves to `vite`. `playwright-report/` and `test-results/` land in this package, not the repo root — CI uploads them from `packages/gallery-app/{playwright-report,test-results}/`.
- **Delegated scripts.** Root `npm run dev`, `build`, `preview`, and `test:e2e*` all wrap `-w @3d-gallery/gallery-app`. Prefer running from the repo root so the wrappers stay honest; if you invoke `npx vite …` directly, do it from inside this package (the config's `resolve(__dirname, '..', '..', …)` paths assume that CWD).

## Moonraker simulator (no real printer needed)

Never test a printer write against the fleet. Test it against the simulator.

- **`tests/fixtures/moonraker-sim.ts`**: `MoonrakerSim`, one Klipper + Moonraker printer as a pure state machine. There's no I/O and no timers. `handle({ method, url, headers, body })` returns `{ kind: 'http', status, contentType, body, delayMs, stream? }` or `{ kind: 'unreachable' }`, and `tick(seconds)` moves heaters, the print and restarts. Its object list, macro list and response shapes copy read-only GETs of the fleet (ZMOD, Moonraker API 1.4.0). What each ZMOD macro does is a stand-in, because the macros' bodies weren't read.
  - **What tests read:** `sim.scripts` is every G-code script Klippy ran, verbatim. It includes the `SDCARD_PRINT_FILE` / `PAUSE` / `RESUME` / `CANCEL_PRINT` that Moonraker sends for `/printer/print/*`. `sim.requests` is `METHOD /path` for every request. Getters: `klippyState`, `state`, `filename`, `temperatures`, `excludedObjects`, `fileNames()`.
  - **Setup:** `addFile(name, { estimatedTime, layers, objects, material, nozzleTemp, bedTemp, … })`, `startPrint(name)`, `finish()` and `tick(s)`. The option `missing: ['gcode_macro COLDPULL']` models a printer without that macro. `origin` lists the camera on the sim's own port. The real cameras sit on port 80 behind nginx.
  - **Faults:** set `sim.faults.unreachable`, `.latencyMs`, `.failUploads` (with `.uploadError`), or call `klippyError(msg)` or `runout(sensor?)`. `/printer/emergency_stop` or `M112` puts Klipper in `shutdown`. `FIRMWARE_RESTART` makes it `disconnected` (503 on `/printer/*`), and it comes back `ready` after 2 s of `tick`. `REBOOT` (or `POST /machine/reboot`) takes the host off the network for 30 s. `SHUTDOWN` (or `POST /machine/shutdown`) keeps it off until `powerOn()`. Klipper refuses the macros while it's shut down, but not the `/machine/*` endpoints.
  - **Klipper's answers:** an unknown command answers `// Unknown command:"X"` in the console with HTTP 200. Any command except `FIRMWARE_RESTART` fails with HTTP 400 while Klipper isn't ready. A cold extrude or a move on an unhomed axis also fails with 400.
- **e2e: `tests/e2e/fixtures/fake-moonraker.ts`**. `const sim = await fakeMoonraker(pageOrContext, { address: 'http://printer.test:7125', name: 'Left' })` routes that origin to a new sim. Route the `BrowserContext` when two pages must see one printer. The clock moves only when the test calls `sim.tick()`. `print-dispatch.spec.ts` shows the pattern.
- **By hand: `node packages/gallery-app/scripts/fake-printers.ts [basePort]`** (Node's type stripping; the port also comes from `FAKE_PRINTERS_PORT`, default 17125). It serves `Left` (printing), `Right` (idle) and `Center` (paused on filament runout) on `127.0.0.1:basePort…+2`, ticking in real time, with CORS `*` and an MJPEG camera. It writes one Orca printer preset per printer to `.cache/fake-printers/<basePort>/Sim <Name>.json` and prints them to stdout. Import them in Settings. Agents running in parallel each pick their own base port.

## Where the toolkit fits

`@3d-gallery/print-toolkit` (in `packages/print-toolkit/`) is framework-free — this package is the only consumer wiring it into a Preact UI. When adding print-related features, keep pure logic in the toolkit and put Preact glue under `src/print/`.
