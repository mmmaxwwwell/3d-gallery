# Build Plates — interface contract

Status: implementation spec. Every agent working on plates reads this file and
implements **exactly** these signatures. Do not invent alternatives; if a
signature here is wrong, note it in your report rather than silently diverging.

## Concept

A **project** is a folder holding the plates for one job. A **plate** is a
named, persistent, printer-agnostic collection of parts belonging to exactly
one project. The per-part `Print` button is replaced by `Add to plate`, which
targets the active plate of the active project. Plates are sliced and sent to
any printer whose bed they physically fit.

Print setup — printer, filament, process template, layer height, bed surface —
is **global**, not owned by a project or a plate. It lives in localStorage
(`3dg:print:last-selections`) and is shared by every plate.

**Save vs. slice.** Inside the plate dialog, edits (qty, remove, drag,
re-arrange) are held in a working copy and only reach IndexedDB on `Save
plate`. An `Unsaved changes to this plate` marker sits above the action bar,
and the slice button reads `Save & slice` while changes are pending —
slicing always commits the plate first. The two other save controls are named
for what they save (`Save as slice preset`, `Save as process template`), so
exactly one control in the UI saves the plate.

**A plate owns its arrangement.** (This supersedes the original design, in
which the plate stored no layout and one was derived per printer. That model
could not survive a hand-authored 3D layout: if the packer is free to move
things, the user's arrangement is not the artifact, and "the size of the plate"
has no stable meaning.)

The user lays parts out once, in **plate space** — origin-centred, Z up, mm,
with no printer in it. Each copy carries a full pose: position, orientation as
a quaternion, and per-axis scale. Auto-arrange still exists, as a button inside
the editor, but it is a tool the user reaches for rather than the source of
truth.

What the arrangement occupies is the **size of the plate**, and that size is
what gates printers. "Physically fits printer P" is a rigid-body question:
translate the whole arrangement — never re-pack it — and see whether it lands
inside P's bed, clear of P's exclusion zones, under P's height limit.
`evaluateAuthoredPlateFit` answers it, and the slice path uses the same offset
it returns, so the fit badge cannot disagree with what gets sliced.

### Pose is baked, not passed

A slice job carries only a Z rotation and world-axis scale factors. Those do
not compose the same way once a part is tipped onto a face, so the editor's
6-DOF pose is **baked into the mesh bytes** at slice time and the job is handed
an already-posed mesh with `rotZ: 0` and `scale: 1`. There is then exactly one
interpretation of the geometry, and it is the one the editor drew.

Consequences:

- `mesh-bounds.ts` owns the transform: ASCII STL, binary STL, and 3MF (by
  composing into the build-item matrix rather than rewriting vertices). Facet
  normals go through the inverse-transpose, so non-uniform scale does not tilt
  them. print-toolkit's older `applyRotationToSTL` is binary-only and is not
  used on this path — the gallery's own artifacts are ASCII.
- Measuring is separated from baking. `meshBboxPosed` measures the real posed
  hull without touching the bytes, and that is what the fit oracle and both
  canvases run on. A bounding-box-corner estimate would overstate a tipped part
  and block beds it actually fits.
- The 3D canvas places parts with `Box3.setFromObject(obj, true)` for the same
  reason: the loose box would float a rotated part above a bed the oracle says
  it rests on.

## Mesh sourcing (important)

Plate items store a **recipe** plus a **mesh snapshot** captured at add time.
The gallery already has resolved bytes on screen when the user clicks
`Add to plate`, so we cache those bytes and never re-run OpenSCAD-WASM inside
the print UI. On a cache miss:

- stock part (no `params`) -> re-fetch `models/<slug>/<file>` from the site
- parametric variant -> mark the item `stale`; UI tells the user to reopen the
  model to rebuild it. Re-rendering from the print UI is explicitly out of scope.

Cache key: `stock:<slug>/<file>` for stock parts, otherwise the customizer's
existing scheme `SHA-256(scadSource \0 moduleName \0 JSON.stringify(sortedValues))`
(see `computeCacheKey` in `packages/gallery-app/src/main.ts`). Do **not** use
`artifactKey()` from model-core here — it requires a `sourceDigest` the browser
does not have.

---

# Part 1 — print-toolkit (framework-free, no DOM beyond feature-detects)

## 1.1 `packages/print-toolkit/src/plate-slicer.ts`

Add these exports. **Leave the existing `autoArrangeObjects` exactly as it is**
(existing tests depend on its overflow-fallback behavior); the new function is
separate.

```ts
export interface Rect2 { minX: number; minY: number; maxX: number; maxY: number }

export interface ArrangeOptions {
  /** Bed rectangle in slicer coordinates. Required. */
  bed: Rect2;
  /** Forbidden rectangles (bed_exclude_area bboxes, etc.). Default []. */
  keepouts?: Rect2[];
  /** Edge + inter-object gap, mm. Default 10. */
  spacing?: number;
  /** Footprint used when a mesh bbox cannot be computed. Default 30. */
  fallbackSize?: number;
  /** Allow the arranger to add 90 deg to an object's rotation. Default true. */
  tryRotation?: boolean;
  /** Treated as an additional keepout when enabled. */
  primeTower?: PrimeTowerConfig;
}

export interface ArrangeResult {
  /** Objects that fit, with `position` and `rotation` updated. Input order. */
  placed: BuildPlateObject[];
  /** Objects that did not fit. Positions left untouched. */
  unplaced: BuildPlateObject[];
}

/**
 * Bottom-left-fill packing against an explicit bed rect with keepouts.
 * Unlike `autoArrangeObjects`, never places an object outside the bed —
 * it reports it as unplaced instead.
 */
export function arrangeObjects(
  objects: BuildPlateObject[],
  options: ArrangeOptions,
): ArrangeResult;
```

Implementation notes:
- Reuse the existing footprint math (`computeMeshBoundingBox`, rotated-bbox
  expansion) and the existing `rectsOverlap` helper. Keepouts and the prime
  tower seed the `placed` rect list, exactly like the prime tower does today.
- Sort largest-footprint-first, same as today.
- Keep the 1 mm scan grid.
- `spacing` applies both to bed edges and between objects. Keepouts also
  honour `spacing`.

### `validatePlateForSlicing` upgrade

Current version checks each object's *center point* against bed bounds, so an
object hanging half off the bed passes. Change to footprint-based, and add an
optional second argument. Single-argument calls must keep working.

```ts
export interface PlateValidationOptions {
  /** Overrides the bed derived from plate.bedWidth/bedDepth/originCenter. */
  bed?: Rect2;
  keepouts?: Rect2[];
  /** Minimum gap between object footprints, mm. Default 0 (touching is ok). */
  spacing?: number;
}

export function validatePlateForSlicing(
  plate: BuildPlate,
  options?: PlateValidationOptions,
): string[];
```

New checks, in addition to what it does today:
- object *footprint* (rotated bbox, scaled) fully inside the bed rect
- footprint does not intersect any keepout
- no pairwise footprint overlap between objects
- object height (scaled bbox Z extent) <= `plate.maxHeight`

Messages stay human-readable and name the object: `Object "cap.stl" overhangs
the bed on X.`

## 1.2 `packages/print-toolkit/src/plate-fit.ts` (NEW)

The fit oracle. Pure, no DOM, no fetch.

```ts
import type { Rect2, ArrangeResult } from './plate-slicer.js';

export interface PrinterBed {
  /** Printable area rectangle in slicer coordinates. */
  bed: Rect2;
  /** bed_exclude_area bboxes, already sanitized. */
  keepouts: Rect2[];
  /** printable_height, mm. */
  maxHeight: number;
  /** Number of extruders the machine has. >= 1. */
  extruderCount: number;
}

/**
 * Derive a PrinterBed from a flattened OrcaSlicer printer config
 * (the `Record<string,string>` produced by flattening a printer preset).
 * Uses parsePrintableArea + excludeAreaBboxes + isDegenerateExcludeArea
 * from this package. Degenerate `["0x0"]` exclusions are dropped.
 * Returns null when `printable_area` is missing or unparseable.
 */
export function printerBedFromConfig(
  config: Record<string, string>,
  opts?: { ignoreExclusions?: boolean },
): PrinterBed | null;

export type FitStatus = 'fits' | 'warn' | 'blocked';

export interface PlateFitResult {
  status: FitStatus;
  /** Human-readable, one per problem. Empty when status === 'fits'. */
  reasons: string[];
  /** ids of objects that could not be placed. */
  unplacedIds: string[];
  /** Derived layout, keyed by object id. Only for objects that were placed. */
  layout: Record<string, { x: number; y: number; rot: number }>;
}

export interface PlateFitOptions {
  spacing?: number;
  primeTower?: PrimeTowerConfig;
  /** Pinned manual positions, keyed by object id. When every object has an
   *  entry, arrange is skipped and the pinned layout is validated instead. */
  pinned?: Record<string, { x: number; y: number; rot: number }>;
}

/**
 * Decide whether `objects` fit `printer`, and produce the layout they would
 * use. `blocked` = cannot print (does not pack, too tall).
 * `warn` = prints, but degraded (more colors than extruders).
 */
export function evaluatePlateFit(
  objects: BuildPlateObject[],
  printer: PrinterBed,
  options?: PlateFitOptions,
): PlateFitResult;
```

Rules:
- too tall -> `blocked`, reason `"<name> is 210 mm tall; printer max is 200 mm."`
- unplaced -> `blocked`, reason `"2 of 6 objects do not fit on the bed."`
- object `colorGroups.length > printer.extruderCount` -> `warn`, reason
  `"<name> has 4 colors; printer has 1 extruder — it will print in one color."`
- `fits` otherwise.

## 1.3 `packages/print-toolkit/src/gcode-provenance.ts`

A plate has many parts, so provenance must carry a list.

```ts
export interface ProvenancePart {
  file: string;
  label: string;
  qty: number;
  /** Customizer params for this specific item, if parametric. */
  params?: Record<string, string | number>;
}

export interface Provenance {
  // ... all existing fields stay ...
  /** Plate name, when the gcode came from a multi-object plate. */
  plateName?: string;
  /** Every part on the plate. Supersedes partFile/partLabel/customizerParams. */
  parts?: ProvenancePart[];
}
```

- Keep `partFile`, `partLabel`, `customizerParams` as deprecated optional
  fields so existing single-part callers keep compiling.
- `buildProvenanceComment` renders `parts` as an indented list under a
  `; Parts:` heading, one line per part: `;   2x cap.stl — "Cap" (piece_i=0, piece_j=1)`.
  When `parts` is absent, fall back to today's single-part rendering.
- `parseProvenanceComment` round-trips the list.

## 1.4 Barrel

Do **not** edit `packages/print-toolkit/src/index.ts` or `types.ts` — a
dedicated integration step owns those files. Just export from your own module.

---

# Part 2 — gallery-app

## 2.1 `packages/gallery-app/src/print/plate-store.ts` (NEW)

IndexedDB, using `idb` exactly like `print-storage.ts` does.
DB name `3dg:print:plates`, version 1, two stores: `plates` (keyPath `id`) and
`meshes` (keyPath `key`).

```ts
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlateItem {
  /** Stable per-item id (crypto.randomUUID). */
  id: string;
  slug: string;
  /** Manifest file name, e.g. 'piece.stl'. */
  file: string;
  format: 'stl' | '3mf';
  /** Display label, e.g. 'Tray piece (0,1)'. */
  label: string;
  /** Model title, for grouping in the UI. */
  modelTitle: string;
  /** Customizer params, absent for stock parts. */
  params?: Record<string, string>;
  /** Key into the `meshes` store. See "Mesh sourcing" above. */
  meshKey: string;
  qty: number;
}

export interface PlateScale { x: number; y: number; z: number }

/** Where one copy sits, in plate space. `rot` is a full orientation, baked
 *  into the mesh at slice time. */
export interface PlateTransform {
  x: number;
  y: number;
  rot: { x: number; y: number; z: number; w: number };
  scale: PlateScale;
}

/** `<itemId>:<copy>` — an item with qty 3 has copies 0..2. */
export function instanceId(itemId: string, copy: number): string;

export interface Plate {
  id: string;
  /** Owning project. Every plate has one. */
  projectId: string;
  name: string;
  items: PlateItem[];
  /** instanceId -> where it sits on the plate. A missing entry means the copy
   *  has not been arranged yet; the editor places it on open. */
  transforms?: Record<string, PlateTransform>;
  createdAt: number;
  updatedAt: number;
}

export function listProjects(): Promise<Project[]>;          // newest first
export function getProject(id: string): Promise<Project | undefined>;
export function saveProject(project: Project): Promise<Project>;
export function createProject(name: string): Promise<Project>;
/** Cascades: a plate has no home outside its project. */
export function deleteProject(id: string): Promise<void>;

/** All plates, or one project's, newest first. */
export function listPlates(projectId?: string): Promise<Plate[]>;
export function getPlate(id: string): Promise<Plate | undefined>;
export function savePlate(plate: Plate): Promise<Plate>;      // stamps updatedAt
export function deletePlate(id: string): Promise<void>;
export function createPlate(name: string, projectId: string): Promise<Plate>;
/** "Plate 3" — next free ordinal within a project. */
export function nextPlateName(projectId: string): Promise<string>;
/** Appends, or bumps qty when an identical (slug,target,key) item exists. */
export function addItemToPlate(plateId: string, item: Omit<PlateItem, 'id'>): Promise<Plate>;

/** localStorage: what `Add to plate` targets by default. */
export function getActivePlateId(): string | null;
export function setActivePlateId(id: string | null): void;
export function getActiveProjectId(): string | null;
export function setActiveProjectId(id: string | null): void;
/** Resolves the target, creating a project and/or plate on first use. */
export function ensureTargetPlate(
  fallbackProjectName: string,
): Promise<{ project: Project; plate: Plate }>;
```

Item-level mutation helpers (`setItemQty`, `removeItemFromPlate`) deliberately
do **not** exist: the dialog edits a working copy and commits with `savePlate`,
which is what makes `Save` mean something.

DB version 4. v1 rows were dropped (mesh-keyed, unmigratable); v2 rows are
adopted into a single `My prints` project rather than dropped; v3's per-printer
`layout` is dropped on upgrade, because it held bed coordinates for one machine
and plate space has no way to mean that.

`savePlate` prunes transforms for copies that no longer exist — otherwise
lowering qty and raising it again would resurrect a position the user never
chose.

## 2.2 `packages/gallery-app/src/print/plate-resolve.ts` (NEW)

```ts
export interface ResolvedPlateObject {
  itemId: string;
  label: string;
  format: 'stl' | '3mf';
  /** Recentered so the XY bbox center is (0,0) and minZ is 0. */
  data: ArrayBuffer;
  bbox: Bbox3;
  /** Copy index within the item's qty, 0-based. */
  copy: number;
}

export interface ResolveReport {
  objects: ResolvedPlateObject[];
  /** Items whose mesh could not be recovered (parametric + cache miss). */
  stale: Array<{ itemId: string; label: string; reason: string }>;
}

/** One entry per copy: an item with qty 3 yields 3 ResolvedPlateObjects. */
export function resolvePlate(
  plate: Plate,
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<ResolveReport>;
```

Resolution order per item: `getCachedMesh(meshKey)`; on miss and no `params`,
`fetch(<base>models/<slug>/<file>)` and re-cache; on miss with `params`, stale.
Use `meshBbox` + `recenterMeshXY` from `./mesh-bounds.js`.
Base path: reuse whatever `import.meta.env.BASE_URL` gives.

## 2.3 `packages/gallery-app/src/print/PlateCanvas3D.tsx`

The plate editor. Three.js, `TransformControls` for the gizmo, `OrbitControls`
for the camera. The only view — the flat top-down SVG canvas it once shared the
dialog with is gone, along with the `3D | 2D` switch and its
`3dg:print:plate-view` preference.

The component positions itself absolutely and fills its container; its toolbar
and status line float over the viewport rather than stacking above and below
it. `toolbarExtra` lets the dialog put plate-level tools (`Arrange`) in the
same floating rail as the per-object ones. `onDelete` takes the selected copy
off the plate — bound to `Delete`/`Backspace` and to a toolbar button.

```ts
export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface PlateCanvas3DProps {
  bed: Rect2;
  keepouts: Rect2[];
  maxHeight: number;
  /** Rigid plate-space to bed-space translation, from the fit oracle. */
  plateOffset: { dx: number; dy: number };
  objects: PlateCanvas3DObject[];
  selectedId?: string;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, next: { x: number; y: number; rot: Quat; scale: PlateScale }) => void;
}
```

- Model space is turned into Three space (a -90 deg turn about X) in exactly
  two places: baked into each geometry once at parse time, and applied to
  transforms as they cross the boundary. Because the geometry is pre-turned, a
  Three object's local axes *are* the model axes permuted — which is why the
  gizmo needs no special casing.
- The vertical translate handle is hidden: parts live on the bed, and placement
  re-drops them every time the pose changes.
- Toolbar: Move / Rotate / Scale (`G` / `E` / `S`), 90 deg turn (`R`), Lay flat
  (`F`), Reset, Snap, Uniform. Lay flat clusters facet normals by area and
  turns the dominant one to face down.
- Geometry is parsed once per artifact key and cloned per copy; materials are
  cloned per copy so one can be tinted without the others.

## 2.4 `packages/gallery-app/src/print/PlatesPanel.tsx` (NEW)

Two-pane `Projects & plates` modal, using the existing `Modal` component:
projects on the left, the selected project's plates on the right. Selecting a
project makes it active; clicking a plate row makes it the `Add to plate`
target. Deleting a project confirms first and names the plate count it takes
with it.

```ts
export interface PlatesPanelProps {
  onClose: () => void;
  /** Opens the print dialog for a plate. */
  onOpenPlate: (plateId: string) => void;
}
export function PlatesPanel(props: PlatesPanelProps): JSX.Element;
```

Each plate row: plate name (inline-rename), item count, total object count, and
a fit summary computed by calling `evaluatePlateFit` for every printer preset
(`listPresets('printer')` -> `flattenPresetForSlicer` -> `printerBedFromConfig`).
Render as `Fits: Qidi Q2, Adventurer 5M` / `No printer fits this plate`.
Plate row actions: Open, Duplicate, Delete. Pane actions: New project, New
plate. Fit is only computed for the plates of the selected project.

## 2.5 `packages/gallery-app/src/print/mount.tsx`

Owns the portal *and* the print UI's place in the URL:

```ts
export const PRINT_ROUTE_PARAMS = ['plates', 'plate', 'settings'] as const;
export function openPlatesPanel(replace?: boolean): void;
export function openPlateDialog(plateId: string, replace?: boolean): void;
export function openSettingsPanel(onClose?: () => void, replace?: boolean): void;
export function closePrintUI(): void;
export function initPrintRouting(): void;
```

Which panel is open rides in the query alongside the gallery's own
`?model=&part=`: `?plates=1`, `?plate=<id>`, `?settings=1`. A plate is
therefore linkable, and Back closes a panel instead of leaving the app.
`initPrintRouting()` is called once at the end of `main.ts`'s `init()`; it
registers the `popstate` listener and opens whatever the URL already names.

`replace` is for a panel handing control back to the one that opened it —
pushing there would stack a Back step that only undoes the return.

Two things make this cohabit with the gallery router:

- `main.ts`'s `ROUTE_PARAMS` includes `PRINT_ROUTE_PARAMS`, so a `?plate=<id>`
  deep link is never swept up as a customizer parameter.
- `main.ts`'s `buildUrl` rebuilds the query from scratch and so must carry the
  print params across, or a part load would silently drop the open panel out
  of the URL and the next `popstate` would disagree with what is on screen.

`nav-guard.ts` is the seam for "are you sure": the plate editor registers a
guard while it is dirty, and the router asks before it repaints, because Back
is a close that never reaches the dialog's own Cancel path.

## 2.6 `packages/gallery-app/src/main.ts` + `index.html`

- `#print-btn` becomes `Add to plate` (keep the id, change the label + title).
  Clicking resolves the target with `ensureTargetPlate(model.title)` — which
  creates a project named after the model and/or a `Plate 1` inside it on
  first use — then adds the part. Show a brief inline confirmation reading
  `Added to <project> / <plate>` with an `Open plate` affordance.
- The mesh bytes currently behind `downloadLink.href` are written to the mesh
  cache via `putCachedMesh` before the item is added.
- `meshKey`: `stock:<slug>/<file>` when the route carries no customizer
  params, else the customizer cache hash already computed in `main.ts`.
- `params`: the same non-reserved URL query values `PrintDialog` reads today.
- New `#plates-btn` in the header next to `#print-settings-btn`, label
  `Plates`, opens `openPlatesPanel()`.
- Import surface changes from `openPrintDialog` to `openPlatesPanel` /
  `openPlateDialog`.

## 2.7 `packages/gallery-app/src/print/PrintDialog.tsx`

Props change from a single part to a plate:

```ts
interface PrintDialogProps { plateId: string; onClose: () => void }
```

- Load the plate, `resolvePlate` it, show progress while resolving.
- **3D-first at every width.** The dialog renders into a `bleed` `<Modal>` — a
  body with no padding that does not scroll — and lays out as three flex rows:
  `.pd-stage` (the canvas, `flex: 1`), `.pd-notices` (only when non-empty), and
  `.pd-rail` (pinned to the bottom edge). Nothing scrolls but a sheet body.
- **Every option lives behind a rail button.** `.pd-tab` opens one `<Sheet>` at
  a time over the canvas — Objects, Printer, Process, Presets, Advanced — each
  labelled with a one-line summary of its current state, so the rail reads as a
  status bar as well as a menu. A sheet is a bottom sheet below 720px and a
  docked right-hand panel above it.
- **The HUD** keeps what must survive every sheet being closed: fit verdict,
  overall plate size, effective bed/nozzle temps.
- Printer `<select>` options are annotated with fit and `disabled` when
  `blocked`: `Qidi Q2 — fits`, `Ender 3 — 2 objects do not fit`. The Printer
  sheet also reports what the presets actually say — nozzle diameter and type,
  max Z, kinematics, feedrate and acceleration ceilings, filament type, max
  volumetric flow, temperatures for the installed plate (see
  `preset-spec.ts`).
- Item and layout edits mutate the in-memory plate and set a dirty flag. The
  `Save plate` button appears in the rail only while dirty; `Esc`, the backdrop
  and Back all confirm before discarding. Title reads
  `Plate — <project> / <plate>`.
- Slice: commit the plate if dirty, then build one `PlateObjectMsg` per
  resolved copy, position from the layout, and call the existing
  `backend.slicePlate(objects, config, ...)`. The single-object
  `[{ ... posX: bedCenterX ... }]` call goes away.
- Provenance: set `plateName` and `parts` instead of `partFile`/`partLabel`.
- Everything else — presets, templates, bed surface, post-process, upload,
  Moonraker start — is unchanged.

## 2.8 Style contract — `packages/gallery-app/src/style.css`

Owned by one agent. Append a plate block reusing the existing `--` custom
properties and the `.pd-*` visual language. Required classes:

```
.plate3d                 3D editor wrapper, absolutely fills .pd-stage
.plate3d-viewport        the WebGL canvas host
.plate3d-toolbar         mode + action buttons, floating top-left
.plate3d-tool
.plate3d-tool.is-active
.plate3d-tool.is-danger  Delete
.plate3d-tool-sep
.plate3d-toggle          snap / uniform checkboxes
.plate3d-status          selection + scale readout, floating bottom-left

.print-modal-body.is-bleed   unpadded, non-scrolling body (Modal `bleed`)
.pd-stage                the canvas, and the only thing that grows
.pd-stage-empty          "no printer picked" / "plate is empty"
.pd-hud                  floating readouts, top-right
.pd-hud-temps
.pd-plate-size           overall plate size, the printer-gating number
.pd-notices              in-flow warnings under the stage
.pd-notice{,.is-warn,.is-bad}
.pd-notice-link
.pd-rail                 bottom edge: tabs + actions
.pd-rail-tabs
.pd-tab{,.is-open,.is-alert}
.pd-tab-label
.pd-tab-hint             one-line summary of that sheet's state
.pd-rail-actions
.pd-sheet-scrim          overlay behind an open sheet
.pd-sheet                bottom sheet <720px, docked panel above
.pd-sheet-head / -close / -body
.pd-specs                preset readout block
.pd-specs-title / .pd-specs-list / .pd-spec

.pd-object-size          printed size of an item
.plate-row-size

.plates-panel            two-pane grid (projects | plates)
.plates-pane             one pane
.plates-pane-title       pane heading
.plates-pane-hint        which plate "Add to plate" targets
.projects-list           project rows container
.project-row             one project
.project-row.is-active   selected / active project
.project-row-name        inline-rename input
.project-row-delete      cascade-delete button

.pd-dirty                unsaved marker in the rail
.pd-saved

.plates-list             plate rows container
.plate-row               one plate
.plate-row.is-active
.plate-row-name
.plate-row-meta          item/object counts
.plate-row-fit           fit summary line
.plate-row-fit.is-blocked
.plate-row-actions
.plate-empty             empty state

.pd-objects              object list inside the print dialog
.pd-object-row
.pd-object-qty
.pd-object-stale         stale item warning
.pd-fit-badge
.pd-fit-badge.is-warn
.pd-fit-badge.is-blocked
```

---

# Ground rules for every agent

- Read `CLAUDE.md` at the repo root before editing. Follow it.
- No explanatory comments describing *what* code does. Only *why*, only when
  non-obvious.
- Do not add features, params, or options this spec does not call for.
- Only touch the files assigned to you. If you believe another file must
  change, say so in your report instead of editing it.
- print-toolkit stays framework-free: no React, no Preact, no DOM globals
  beyond `window.*` feature-detects.
- Imports inside the new packages carry explicit extensions, matching the
  files next to yours (`.js` specifiers in print-toolkit, per its existing code).
- Verify what you can: `npm run typecheck -w @3d-gallery/print-toolkit` and
  `npm test -w @3d-gallery/print-toolkit` for toolkit work. Report the actual
  command output. Do not claim a check passed if you did not run it.
