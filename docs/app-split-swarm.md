# App split — swarm brief

Self-contained brief for the agent swarm that turns the single gallery SPA
into five loosely coupled views (Home, Models, Project, Printers, Operator)
and builds the Printers fleet dashboard. The target is in `CLAUDE.md` →
*App shape*. The user-facing description is `docs/user-guide.md`.

Everything below **ORCHESTRATOR** is for the agent that runs the swarm.
Everything below **SHARED CONTEXT** is prepended to every task agent's
prompt, followed by that agent's one `## T#` section.

```
Wave 1   T1 moonraker API   T2 moonraker sim   T3 shell + Home   T4 cross-page stores
            │                  │                  │                 │
Wave 2      └──── T5a Printers page ──┬── T5b printer controls      T6 Operator page
                                      │                              │
Wave 3                 T8 dispatch → Printers        T7 Project + Settings pages
                                      │                              │
Wave 4                          T9 integration, docs, QA (serial)
```

| Wave | Tasks (parallel) | Needs merged |
|------|------------------|--------------|
| 1 | T1, T2, T3, T4 | baseline |
| 2 | T5a, T5b, T6 | wave 1 |
| 3 | T7, T8 | wave 2 |
| 4 | T9 | wave 3 |

Nine agents in all, and never more than four at once.

---

# ORCHESTRATOR

You run the swarm. You do not write feature code yourself, except to resolve
merge conflicts and fix a failing gate after a merge.

## Before wave 1

1. **Start from a committed tree.** `git status` must be clean. If it isn't,
   stop and ask the user to commit or stash. Never commit their WIP for them.
2. Create the integration branch `app-split` from `main`.
3. **Baseline the gates** on `app-split` and write the results to
   `.cache/app-split/baseline.md`, listing any test that already fails. A
   later failure only counts against a task if it isn't on that list.
   - `npm run typecheck -w @3d-gallery/gallery-app`
   - `npm test -w @3d-gallery/gallery-app`
   - `npm test -w @3d-gallery/print-toolkit`
   - `npm run test:e2e`
4. Make sure the slicer WASM is present (`npm run fetch-wasm -w @3d-gallery/print-toolkit`).
   The e2e slice specs need it.

## Running a wave

- **One agent per task, in its own worktree** (`isolation: "worktree"`),
  branched from the current tip of `app-split`. Launch every task in the wave
  in a single message so they run concurrently. Each prompt is the SHARED
  CONTEXT section plus that task's section, verbatim.
- **Merge** each finished branch into `app-split` in table order. Resolve
  conflicts by keeping both sides' intent. Each task's *Owns* list says who
  wins a file.
- **Gate after every wave:** typecheck, both vitest suites, `npm run test:e2e`.
  A new failure goes back to the task that caused it: `SendMessage` to that
  agent with the failing output. Don't start the next wave on a red gate.
- **Hand-off notes.** Every agent ends its report with a *Contract* block
  (exports, file paths, URL params, events it added). Paste the previous
  waves' Contract blocks under "Contracts from earlier waves" in the next
  wave's prompts.
- **Never push, never open a PR, never touch the real printers with a write.**
  When T9 is green, report to the user with the checklist from T9 step 6.
  Pushing goes through the user's YubiKey.

---

# SHARED CONTEXT (read this before your task)

## Mission

The app is one Vite SPA (`packages/gallery-app/`): the model gallery, with
the print UI mounted as query-routed panels over it (`src/print/mount.tsx`:
`?projects=`, `?plate=`, `?project=`, `?dispatch=`, `?operator=`,
`?settings=`). We are splitting it into five **Vite pages**, each with its own
entry and bundle, all under base `/3d-gallery/`:

| View | Path | Entry | Owns |
|------|------|-------|------|
| Home | `/` | `index.html` | What the app is, the user guide, the link to Settings |
| Models | `/gallery/` | `gallery/index.html` | Today's gallery (`main.ts`) |
| Project | `/project/?id=` | `project/index.html` | Projects list, planner, plate editor |
| Printers | `/printers/` | `printers/index.html` | Fleet dashboard, controls, dispatch queues |
| Operator | `/operator/?id=` | `operator/index.html` | The runbook (`operator-app.tsx`) |
| Settings | `/settings/` | `settings/index.html` | Orca import, presets, templates. Not a tab; linked from Home and a gear icon |

Read `CLAUDE.md` (repo root) → *App shape*, `docs/user-guide.md` and
`docs/print-planner.md` before you start.

## Rules every task follows

1. **Views never import each other's components.** A page may import
   `src/shell/*` (nav bar, page frame), `src/print/*` stores and models, and
   workspace packages. It may not import another view's top-level component.
   One view reaches another only by a link or `location.assign`.
2. **Shared state lives in the stores** (`print-storage.ts`, `plate-store.ts`,
   `plan-snapshot.ts`, dispatch queue in `localStorage`, `operator-store.ts`,
   planner settings in `fleet-plan.ts`). All pages are one origin, so they see
   the same IndexedDB and `localStorage`. After T4, every store's `on*Change`
   also fires for writes made in another tab.
3. **Printers are only reached through `@3d-gallery/print-toolkit`'s Moonraker
   API.** `print-toolkit` stays framework-free: no Preact, no DOM beyond
   `window.*` feature-detects.
4. **Never write to a real printer.** The fleet is at `192.168.68.58`, `.60`,
   `.71` (port 7125). You may send read-only GETs there to confirm response
   shapes. Never send a POST, never call `/printer/gcode/script`, and never
   start or stop anything. Test every write against the Moonraker simulator
   (T2) or mocked `fetch`.
5. **Styles.** New UI gets its own stylesheet next to it
   (`src/shell/shell.css`, `src/printers/printers.css`, …). Don't append to the
   7,000-line `src/style.css`. Only move rules out of it, as part of moving the
   component they style. `tests/unit/style-coverage.test.ts` must cover every
   directory that renders classes (T3 extends it).
6. **Phone first** for Home, Printers and Operator. Design at 360 px wide:
   touch targets ≥ 48 px, a 16 px side gutter, no horizontal scroll, and
   `env(safe-area-inset-bottom)` under the bottom bar. Dark and light
   themes both work.
7. **Code style:** match the surrounding code. SPDX header, file-top comment
   saying why the file exists, `.js` import suffixes inside gallery-app and
   `.ts` inside workspace packages, as the neighbours do. Comments say *why*,
   never *what*. No features beyond your task. Follow `~/CLAUDE.md` →
   eng-standards (`coding-behavior.md` is the floor).
8. **Before you report:** `npm run typecheck -w @3d-gallery/gallery-app`,
   the vitest suites you touched, and the e2e specs your change could affect.
   Every one must pass, or be on the baseline's failing list. Commit on your
   branch with a message in the repo's style (`gallery: …`,
   `print-toolkit: …`). Don't push.
9. **End your report with a Contract block:** new exports and signatures,
   files created, routes and URL params, events and storage keys. Later
   agents build on exactly that.

## Contracts from earlier waves

*(The orchestrator pastes the Contract blocks here.)*

---

## T1 — Moonraker control and status API (`print-toolkit`)

**Owns:** `packages/print-toolkit/src/moonraker-api.ts`, a new
`packages/print-toolkit/src/moonraker-control.ts` if the file grows too big,
`src/index.ts` exports, `packages/print-toolkit/tests/moonraker-*.test.ts`,
and the package README's Moonraker section.

Add everything the dashboard needs. Keep the existing helpers
(`moonrakerGet/Post`, `checkMixedContent`, `buildMoonrakerUrl`). Each
function takes `address` first, like the existing ones.

- **`fetchPrinterLive(address): Promise<PrinterLiveStatus>`**: one
  `/printer/objects/query` for `print_stats`, `virtual_sdcard`,
  `display_status`, `extruder`, `heater_bed`, `toolhead` (homed axes, position),
  `gcode_move` (speed/extrude factor, Z offset from `homing_origin`),
  `fan`/`fan_generic fanM106`, `filament_switch_sensor e0_sensor`/`e1_sensor`,
  `exclude_object`, `idle_timeout`, `pause_resume`, `led chamber_light`,
  `system_stats`, and `print_stats.info` (current/total layer). Ask only for
  objects that `/printer/objects/list` reports, and cache the list per
  address. Add `/machine/proc_stats` for host uptime. Return a flat, typed
  object: state, klippy state and message, file, progress, layer n/N,
  elapsed, time left (reuse `fetchPrintStatus`'s estimate logic), each heater
  target and actual, fan %, speed %, flow %, Z offset, homed axes, each
  sensor's state, light on/off, objects (with the excluded ones marked),
  uptime, and `macros: Set<string>`.
- **Commands:** `sendGcode(address, script)` (`/printer/gcode/script`),
  `emergencyStop` (`/printer/emergency_stop`), `firmwareRestart`
  (`/printer/firmware_restart`), `pausePrint`, `resumePrint`, `cancelPrint`
  (`/printer/print/*`).
- **Files:** `listGcodeFiles(address)` returns the gcodes root, newest first,
  with size, modified time, slicer estimate and the largest thumbnail's URL
  (from `/server/files/metadata`, resolved under `/server/files/gcodes/`).
- **`fetchConsoleTail`**: reuse `fetchConsole` with a small count.
- **Macro wrappers.** For each control the dashboard has, a function that
  builds its G-code string: `macroScript.home()`, `.loadFilament(temp?)`,
  `.unloadFilament(temp?)`, `.purge(mm?)`, `.meshAndSave()`,
  `.clearNozzle()`, `.coldPull()`, `.pauseNextLayer()`, `.excludeObject(name)`,
  `.zOffsetAdjust(mm)`, `.speed(pct)`, `.flow(pct)`, `.fan(pct)`,
  `.light(on)`, `.restartCamera()`, `.reboot()`, `.powerOff()`,
  `.disableMotors()`, `.extrude(mm)`, `.retract(mm)`, `.park()`,
  `.setNozzle(c)`, `.setBed(c)`. Keep them pure and unit tested.
  **Read each ZMOD macro's G-code first** with a read-only GET of
  `/printer/objects/query?configfile` (`settings["gcode_macro <name>"].gcode`)
  on one printer. Record each macro's parameters, what it does (does
  `AUTO_FULL_BED_LEVEL` save the mesh? does `LOAD_FILAMENT` heat? does ZMOD
  override `SET_GCODE_OFFSET`?), and whether it is safe mid-print, as a table
  in the README. Wrap macros, don't reimplement them. Each wrapper declares
  the macro it needs, so the UI can hide a control on a printer without it.
- **Unit tests** with `fetch` mocked: query shape, parsing, each script
  string, a missing object, mixed-content refusal.

## T2 — Moonraker simulator

**Owns:** `packages/gallery-app/tests/fixtures/moonraker-sim.ts` (pure
state machine, no I/O), `tests/e2e/fixtures/fake-moonraker.ts` (a Playwright
`page.route` adapter over the sim), `packages/gallery-app/scripts/fake-printers.ts`
(a Node HTTP server with CORS `*`, runnable with `node` type stripping), and
the migration of `tests/e2e/print-dispatch.spec.ts` onto the shared fixture.

`print-dispatch.spec.ts` already has an inline `fakeMoonraker`. Extract it
and extend it into a simulator of the real Moonraker HTTP API as the fleet
runs it. Mirror the object list, macro list and response shapes you get from
read-only GETs against `192.168.68.58:7125`. Model:

- Klippy states (`ready`, `shutdown` after emergency stop, back to `ready` on
  firmware restart), print states (standby / printing / paused / complete /
  cancelled / error), progress and layers advancing on a tick, heaters moving
  toward their target, sensors, fans, light, the object list with excluded
  objects, files with metadata and thumbnails, job history, and the gcode
  store.
- `/printer/gcode/script` understands the scripts T1's wrappers send. It
  records every script in a log the tests can assert on, and answers an
  unknown command the way Klipper does.
- **Fault injection:** unreachable, slow, upload failure, klippy error with a
  message, filament runout.
- `fake-printers.ts` serves three printers (`Left`, `Right`, `Center`) on
  `127.0.0.1:17125-17127` with different states (one printing, one idle, one
  paused). It also prints the Orca-style preset JSON to import, so a person or
  agent can drive the dashboard end to end with no real printer. Document it
  in the gallery-app `CLAUDE.md`.

T2 does not depend on T1's code. The contract between them is the real
Moonraker HTTP API.

## T3 — Multi-page shell, bottom bar, Home page

**Owns:** `vite.config.ts` (the build inputs, the PWA config, and URL
handling in the dev plugins), every new `*/index.html`, `src/shell/`,
`src/home/`, moving today's `index.html` to `gallery/index.html`, the
`legacy-routes.ts` redirect, `playwright.config.ts`,
`tests/unit/style-coverage.test.ts`, and e2e `helpers.ts` URL updates.

- **Pages.** Add Vite build inputs for `/`, `/gallery/`, `/project/`,
  `/printers/`, `/operator/`, `/settings/`. For now `project/`, `printers/`,
  `operator/` and `settings/` render a placeholder in the shell ("moving here
  soon") that links to the old panel route. Later tasks replace them.
- **Watch the URL collision.** `/3d-gallery/models/…` is the artifact URL
  space (`galleryModelsPlugin`, `public/models/`). The gallery page lives at
  `/gallery/`. Check that dev (`enforce: 'pre'` middleware, base-stripped and
  base-prefixed URLs) and production both still serve
  `models/<slug>/<file>`, and that each page's HTML is served at its own path
  in dev and preview.
- **Legacy links.** Home's entry script first runs `legacy-routes.ts`:
  `/?model=…&part=…` and every other gallery query, plus
  `?project= / ?projects= / ?plate= / ?dispatch= / ?operator= / ?settings=`,
  forward with `location.replace` to the page that owns them. Until T6/T7
  land, that page is `/gallery/` carrying the same query. The mapping is one
  table in `legacy-routes.ts`, and later tasks edit only their own row. Unit
  test the table. Move e2e specs to open `/gallery/` directly, and keep one
  spec that proves the legacy forward works.
- **PWA.** Precache every page's HTML. Replace the single
  `navigateFallback: '/3d-gallery/index.html'` so every page loads offline and
  a deep link opens the right page (`navigateFallbackAllowlist` per page, or
  no fallback plus a precached HTML for each page, whichever works with
  vite-plugin-pwa 1.x). Keep the manifest's `start_url` at `/3d-gallery/`.
- **`src/shell/`:** `views.ts` (one registry: id, label, icon, path, how to
  build the "last open" URL), `NavBar.tsx` (a bottom navigation bar under
  720 px, a left rail above it, and labels always shown), `last-open.ts`
  (per-view last URL in `localStorage`, so a tab returns to it), `badges.ts`
  (a tiny API `setBadge(viewId, text | null)` backed by `localStorage` +
  `storage` event. T5a and T6 feed it), and `mountShell(root, viewId)` for a
  page to call. Models is imperative today (`main.ts`). Give it a
  DOM-mounted bar that doesn't cover the viewer's controls or the sidebar
  footer. Full-screen panels (`Page.tsx`) leave room for the bar.
- **Home (`src/home/`):** render `docs/user-guide.md` at build time
  (`?raw` + a small markdown renderer — `marked` is fine as a dependency),
  with a hero line, one card per view linking to it, a link to Settings, and
  a banner on `https:` that explains printer control needs plain HTTP on the
  LAN. The guide stays the single source. Don't copy its text into TSX.
- **Tests:** a unit test for the registry and last-open. An e2e test that
  each page loads, the bar switches views at 360 px and at desktop width, a
  tab returns to its last URL, and the legacy forwards work.

## T4 — Stores that work across pages

**Owns:** change notification in `plate-store.ts`, `operator-store.ts`,
`print-storage.ts`, `fleet-plan.ts` (planner settings), the dispatch queue in
`dispatch-daemon.ts`, and a new `src/print/change-bus.ts`.

Today the `on*Change` listeners are in-page callbacks. `plan-snapshot.ts`
alone also listens for `storage`. Once views are separate pages, a change in
Project has to reach Printers and Operator open in other tabs.

- **`change-bus.ts`:** one `BroadcastChannel('3dg')`, falling back to the
  `storage` event. Every store publishes `{ store, key }` after its write
  commits, and its existing `on*Change` subscribers also fire for messages
  from other tabs. Keep each store's public API as it is.
- **One dispatch runner.** Two open pages must never both run uploads and
  starts. The daemon takes a Web Lock (`navigator.locks.request('3dg:dispatch:<projectId>', …)`)
  before it runs tasks. A page without the lock still reads the queue and
  shows it, and its commands are written to the queue for the lock holder to
  run. When the holder closes, another page picks the lock up. Status polling
  can run in every page. Uploads and starts run only in the lock holder.
- **Tests:** unit tests for the bus (two channels in one test), and one e2e
  test with two pages in one context. Queue an upload in page A with the
  printers screen open in page B. It runs exactly once (T2's fixture, or
  the existing inline fake if T2 hasn't merged — the orchestrator reconciles).

## T5a — Printers page: fleet status

**Needs:** T1, T2, T3, T4. **Owns:** `printers/index.html`'s entry,
`src/printers/` except the files T5b owns, `src/printers/fleet-model.ts`, and
`src/printers/printers.css`.

- **Printers** come from imported printer presets (`listPresets('printer')`,
  address from the preset's print host), the same list `dispatch-daemon`
  uses. Honour planner settings' "printer switched off". No printers → an
  empty state linking to Settings → Import.
- **Polling:** `fetchPrinterLive` every 2 s per printer while the page is
  visible, every 30 s while hidden. Back off on an unreachable printer.
  Everything the UI derives from the status (what needs attention, stale
  data) goes in a pure `fleet-model.ts` with unit tests.
- **Layout:** one card per printer, stacked on a phone and in a grid on
  desktop. The collapsed card shows name, a big state chip, nozzle and bed
  (actual → target), file, layer n/N, a progress bar with time left and a
  clock ETA, the filament sensor, and a camera snapshot thumbnail. Tap to
  expand: live MJPEG stream (only while expanded, to spare a phone's
  bandwidth), uptime, fans, speed and flow, Z offset, klippy message, and the
  last console lines. A sticky strip at the top: count printing / idle /
  needs attention.
- **Badge:** `setBadge('printers', n)` where n = printers in error, paused,
  runout, shutdown or unreachable.
- **Controls slot:** each card renders
  `<PrinterControls printer={…} live={…} onCommand={…} />` from
  `src/printers/PrinterControls.tsx`, which T5b owns. Agree the props type
  from this brief: `printer: { id, name, address }`,
  `live: PrinterLiveStatus | null`,
  `onCommand(label, run: () => Promise<void>)`. The page runs the command,
  shows a toast with the result, and re-polls at once. Until T5b merges,
  render a stub.
- **HTTPS:** on `https:` the page shows status only if the fetches work (they
  won't to `http://` printers). Show the explanation banner, not a wall of
  errors.

## T5b — Printer controls

**Needs:** T1, T2, T3. **Owns:** `src/printers/PrinterControls.tsx`,
`src/printers/HoldButton.tsx`, `src/printers/FilePicker.tsx`,
`src/printers/control-model.ts`, and `src/printers/controls.css`.

- **`control-model.ts` (pure, fully unit tested):** for a given
  `PrinterLiveStatus`, returns every control's `{ visible, enabled, reason,
  confirm: 'none' | 'hold' }`. Hide a control whose macro the printer lacks.
  Rules:
  - **Emergency stop:** always visible and enabled while klippy is ready.
    No confirm, and it's red.
  - **Hold to confirm** (about 1 s, with a visible fill): cancel, reboot,
    power off, firmware restart, mesh and save, and excluding an object.
  - **Disabled while printing or paused**, with the reason in text: home,
    mesh, load, unload, purge, clean nozzle, cold pull, park, disable motors,
    temperature presets, firmware restart, reboot, power off.
  - **Print-time only:** pause, resume, cancel, pause at next layer, exclude
    object, Z nudge ±0.01 / ±0.05, speed and flow %, fan %.
  - **Extrude and retract** need a hot nozzle (≥ the printer's min extrude
    temperature).
  - **Klippy in shutdown or error:** only firmware restart, reboot and
    power off are enabled, plus a clear "Emergency stopped — firmware
    restart to recover".
- **Groups on the card:** *Print* (pause/resume, cancel, pause next layer,
  objects, tune: Z/speed/flow/fan). *Heat* (nozzle 0 / 230 / 250 / 280, bed
  0 / 60 / 80 / 100, and preheat by material, which reads temperatures from
  the filament preset planner settings map to that material family).
  *Filament* (load, unload, purge, extrude, retract). *Machine* (home, mesh
  and save, clean nozzle, cold pull, park, disable motors, light, restart
  camera, firmware restart, reboot, power off). Collapse the groups on a
  phone. Only *Print* opens by default while printing, and only *Heat* and
  *Filament* while idle. Emergency stop sits outside every group, always
  visible.
- **Start print:** `FilePicker` lists `listGcodeFiles` with thumbnails,
  newest first, and a search box. Tap a file, then confirm with the name,
  estimate and a "bed is clear" checkbox, then `startPrint`.
- **Tests:** unit tests for every rule above. An e2e test at 360 px against
  T2's sim: each group's buttons send the right script (assert on the sim's
  log), hold-to-confirm doesn't fire on a tap, emergency stop puts the sim in
  shutdown and firmware restart brings it back, and a disabled control shows
  its reason.

## T6 — Operator page

**Needs:** T3, T4. **Owns:** `operator/index.html`'s entry, `src/operator/`
(move `operator-app.tsx`, `operator-model.ts` stays in `src/print/`), the
Operator row in `legacy-routes.ts`, and the operator branch of `mount.tsx`
(delete it).

- Mount `OperatorApp` in the Operator page with the shell. `?id=<projectId>`,
  and no id → the last-open project, else the newest project that has a
  plan snapshot, else an empty state linking to Project.
- `onOpenPlanner` → `location.assign` to the Project URL (the gallery panel
  route until T7 lands). **Runbook** buttons elsewhere become links to
  `/operator/?id=`.
- **Badge:** `setBadge('operator', countdown)` to the next trip,
  refreshed each minute. The badge also has to update while the Operator page
  isn't open. So the plan-snapshot write in Project computes it too (a small
  helper in `operator-model.ts`, unit tested), and T3's badge store carries
  it.
- Move the operator's CSS rules out of `style.css` into
  `src/operator/operator.css`.
- Update `project-planner.spec.ts` / `print-dispatch.spec.ts` where they
  opened the runbook, and add an operator page e2e test (a deep link, the
  countdown, ticking a step persists across reload).

## T7 — Project and Settings pages

**Needs:** wave 2. **Owns:** `project/` and `settings/` entries,
`src/project/`, `src/settings/`, the projects/project/plate/settings rows in
`legacy-routes.ts`, and every remaining branch of `mount.tsx` except dispatch.

- **Project page:** the projects list (`?id` absent), the planner
  (`?id=<projectId>`) and the plate editor (`?id=…&plate=<plateId>`, a
  sub-route in the page with Back). Keep `nav-guard.ts`'s draft protection:
  in-page navigation as today, and `beforeunload` when leaving the page
  with an unsaved draft that holds something.
- **Send to printers** writes the dispatch as today and then navigates to
  `/printers/?project=<id>`. Don't render `PrintDispatch` any more. Leave
  the file for T8.
- **The Models page talks to Project only through the store.** **Load
  project** and **Add to project** keep writing to `plate-store`, then offer
  "Open project →" (a link). The gallery's **Project** button becomes a link
  to `/project/`.
- **Settings page:** `SettingsPanel` and the preset editor. It is reached
  from Home, from a gear in Project and Printers, and from the empty states
  that ask for an import. `server-store.ts`'s `syncFromServerOnce` runs on
  every page that reads presets, not just the gallery.
- Move the planner, plate editor and settings CSS out of `style.css` into
  the page directories. Update `project-planner.spec.ts`,
  `plate-editor.spec.ts`, `preset-editor.spec.ts`, `slice-cancel.spec.ts`,
  `wasm-slice.spec.ts` and `parts-list.spec.ts` for the new URLs. Behaviour
  assertions stay the same.
- **Heavy imports:** check with `vite build`'s output that the Project
  page's bundle keeps the slicer and Three.js lazy-loaded where they are
  today, and that Home, Printers and Operator pull in neither.

## T8 — Dispatch queues move to Printers

**Needs:** wave 2. **Owns:** `src/printers/queue/`, deleting
`PrintDispatch.tsx` and the dispatch branch of `mount.tsx`, the dispatch row
in `legacy-routes.ts`, and `print-dispatch.spec.ts`.

- Every printer card on the Printers page gets its **queue**. The plates
  from every project's dispatch that has jobs for that printer come in
  belt order, with upload state, **Upload all**, **Print** (head of the belt,
  readiness checks, the bed question), Skip / Mark done / Put back, and job
  outcomes. Reuse `dispatch-model.ts` / `dispatch-daemon.ts` as they are.
  Only the view moves.
- `?project=<id>` on the Printers page focuses that project: its jobs are
  highlighted, and a header shows the plan's name with a link back to
  Project. The command queue and log that sat below the per-project screen
  go in a **Queue** sheet on the page (Retry / Cancel / Dismiss, and the last
  300 log lines).
- The per-printer "what the plan asks" block (filament by spool, hours,
  operator stops) comes from the plan snapshot, as today.
- Port `print-dispatch.spec.ts` to the Printers page. Every existing
  assertion about uploads, retries, starts, outcomes and replacing a plan
  keeps passing.

## T9 — Integration, docs, QA (serial, last)

**Needs:** everything.

1. Delete `mount.tsx` and any dead exports. `PRINT_ROUTE_PARAMS` becomes
   whatever the gallery's parameter sweep still has to skip.
   `legacy-routes.ts` is the only thing that still knows the old routes.
2. Run the full gates: typecheck, all vitest suites, `npm run test:e2e:full`,
   `npm run preflight`.
3. **Docs:** `docs/user-guide.md` (remove every *Today:* note, and describe
   the real controls and where they are). `CLAUDE.md` → *App shape* (drop
   "target — being migrated to", describe what is, add the gotchas found
   along the way). `docs/print-planner.md` (routes, the printers screen
   section moves under Printers, the Web Lock and the change bus). The
   gallery-app `CLAUDE.md`. `docs/module-architecture.md` if it describes the
   SPA.
4. **Visual QA with the simulator:** run `fake-printers.ts` and import its
   presets. Screenshot every page at 360 × 780 and 1440 × 900, light and dark,
   with Printers showing printing, paused, idle and shutdown. Put the
   screenshots in `.cache/app-split/qa/`. Fix anything overlapping, clipped or
   scrolling sideways.
5. **Read-only check against the real fleet:** load the Printers page served
   over HTTP from the dev server with the real presets. All three printers'
   status, temperatures, cameras and file lists come through. Press nothing.
6. **Report** to the orchestrator: a summary, and a **real-printer checklist**
   for the user to do by hand on one idle printer. Each control once, emergency
   stop then firmware restart, a start from the file picker, pause/resume/
   cancel on a short test print, and exclude an object. Note what to watch
   for with each.
