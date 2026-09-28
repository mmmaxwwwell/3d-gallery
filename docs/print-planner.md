# Print planner

A project's plates, scheduled across the printer fleet and sent to it.

## Flow

1. **There is always an open project.** It starts as an empty, unsaved
   draft (`Project.draft`), and the gallery sidebar's **Project** link opens
   it on the Project page (`project/?id=<id>`). The project view saves it
   (clears `draft`), starts a new one, and lists the saved ones
   (**Projects…**, `project/`). A plate opens in the plate editor at
   `project/?id=<id>&plate=<plateId>`. A draft
   lives only while it is open: whatever replaces it deletes it, and if any of
   its plates holds something, the operator is asked first
   (`current-project.ts`). Saved projects persist edits as they happen, so
   switching away from one asks nothing.
2. **Filling it.** On a view whose manifest has print plates (`plate: true`
   previews), the parts list's **Load project** makes a new draft named after
   the model and build, holding one plate per manifest plate. The plate 3MF is
   its single item at the plate origin, so the editor has nothing to arrange.
   The plate also records its material, colour and the model's recommended
   profile, and the parts list offers **Open project →**. Anywhere else, the
   header's **Add to project** (➕) drops the
   part on the plate picked in the project view (click a plate; it shows
   "Adding here"), else the newest plate, else a new one
   (`ensureTargetPlate`). The project view also makes, renames, duplicates
   and deletes plates. An empty plate is listed but not planned or sliced.
   The view owns the whole screen (`Page.tsx`, no title bar; ← and Esc go
   back). Across the top: the project bar with Send to printers, then three
   bars (plates sliced, the slice running now, plates printed) over the
   checks that gate Send. Below: the plan, a Gantt chart per printer, the
   operator's itinerary, the plates, the printers and the operator's hours.
   Every plan it draws is kept per project (`plan-snapshot.ts`) for the
   screens that don't recompute it.
3. **Slicing is automatic.** Whenever a plate has no fresh slice for the
   printer the plan gives it, the planner slices it, one plate at a time, in
   the background. A slice's real time can move a plate to another printer,
   which re-plans and slices it again there. A plate whose slice fails is
   left alone until its **Retry slice** button. Nothing slices while a plate
   has no filament preset for its material, nor before every printer has
   reported its status (a plan made before then counts busy printers as
   free). The slicer reports only its start and end, so the "Slicing now"
   bar runs on the clock against the plate's last slice time, or the median
   slicing rate times its print time (`expectedSliceMs`). Each plate is sliced at its
   recommended profile, with the filament preset matched to its material.
   Bed surface, layer height, preheat and centring are the print dialog's
   last selections. The G-code is kept in IndexedDB (plate store v5,
   `gcode`), keyed by plate and printer, and goes stale when the plate's
   items, arrangement or overrides change.
4. **Send to printers** writes the plan to the dispatch queue and opens the
   Printers page on it (`printers/?project=<id>`). Nothing reaches a printer
   yet.
   Each job is named `NN-<plate>.gcode`, with NN the plan's start order, and
   carries the `slicedAt` of the slice it sends. Sending again replaces the
   plan. Jobs that are the same slice of the same file on the same printer
   keep their uploads and outcomes, and queued commands for anything else are
   cancelled.

## Printers screen

One row per printer. The printer's card is on the left: its camera
(Moonraker's `/server/webcams/list`, a snapshot refreshed with each probe),
its readiness checks and a **Print** button. Its plates are queued out to
the right in print order.

- **Upload all** queues an upload for every job not yet on its printer. The
  dispatch daemon (`dispatch-daemon.ts`, one per project at module scope)
  runs uploads one at a time per printer and printers in parallel. They carry
  on with the screen closed. An upload refuses a slice that isn't the one
  sent, and a plate that changed since it was sliced.
- **Readiness** is probed every 10 s while the screen is open: Moonraker
  reachable, Klipper `ready`, the printer idle, and the next file on it
  (`/server/files/metadata`). The loaded filament is only a warning.
- **Print** starts the head of the belt once every check passes. It asks
  about the bed first, since no probe can see it. The daemon checks again
  right before it sends the start.
- **How a print ended** comes from Moonraker's job history, or from the
  printer's live state when history isn't enabled. A finished job leaves the
  belt. **Skip** / **Mark done** takes a job off by hand, and **Put back**
  returns it.
- **Queue** lists commands that are queued, running or failed, with Retry,
  Cancel and Dismiss. **Log** is the last 300 events.

The queue and log persist in `localStorage['3dg:print:dispatch:<projectId>']`.
After a reload an interrupted upload runs again. An interrupted start fails,
because it may have reached the printer, so the operator decides.

## Operator runbook

The Operator page, `/operator/?id=<projectId>` (`src/operator/`, model in
`src/print/operator-model.ts`), linked from **Runbook** on the project and
printers screens. It is a phone screen for the trips to the printers. With no
`id` it opens the runbook last open, else the open project's, else the one
planned last. The Operator tab's badge is the time to the next trip
(`tripBadge`): the runbook rewrites it each minute, and the project view
rewrites it each time it keeps a plan (`operator-badge.ts`).

- **Where the plan comes from.** The project view keeps the plan it last
  drew in `localStorage['3dg:print:plan:<projectId>']` (`plan-snapshot.ts`).
  The runbook reads that and follows every re-plan, so it can be read
  while planning, before a session and during one.
- **Sessions.** Each visit in the plan is a session. The home page counts
  down to the next one that isn't done and gives its clock time, or shows
  `--:--` when nothing is planned. Below that is one card per session:
  when it is, how many printers, how many filament changes, and the
  planned minutes (or how long it really took).
- **A session's front page.** Start time, printers touched, filament
  changes, planned minutes, the filament going on (grams per
  material · colour), what to bring, and one card per stop ("Stop 1 ·
  Left — Clear bed · start #05"). A filament change is a print whose
  material or colour differs from the print before it on the same printer,
  or the plan's own swap from the loaded filament. What to bring covers
  only what the stops need: a scraper, gloves, spare beds, bins and a phone
  when a bed has to be cleared, and a cutter and glasses when there's a swap.
- **A stop** is one printer. **Start task** / **Stop task** time the
  operator, and stopping the last stop ends the session. Its steps, each a
  checkbox:
  1. Log the last print, with outcome flags (OK, stringing, layer shift,
     came off the bed, warping, spaghetti, under-extrusion, filament jam,
     power failure, unknown), a note and photos. Only shown when something
     is known to be on the bed: an earlier print in the plan, a recorded
     start, or a finished job that Moonraker reports.
  2. Clear the bed, by swapping in a spare bed or putting the parts in a
     bin (a photo of the parts in the bin and one of the bin's label or
     code, both kept raw and tagged with the plate).
  3. Fresh, clean bed.
  4. Filament: the filament and the grams this print needs, with cut /
     unload / load / purge steps when it's a change.
  5. Start the print (cancel a paused job first, if Moonraker reports one).
     Ticking this step records the start.
  6. Watch the first layer: **Went down OK** or **Problem**, and for a
     problem a note and a photo.
- **What's kept** is in its own IndexedDB database, `3dg:print:operator`
  (`operator-store.ts`): `prints` (every upload and start, from the dispatch
  daemon or the runbook: what, where, when), `stops` (timing, ticks, outcome,
  bin, first layer), `sessions` (actual start and end) and `photos` (Blobs).
  A stop's key is `projectId|plateId it starts|printerId`, and a session's is
  the plate id of its first start. Neither depends on the plan's visit
  numbers, so a re-plan keeps the operator's notes on the right stop.
- **What the printer says** (`print-report.ts`). Whenever the runbook or
  the printers screen loads, and each minute while the runbook is open,
  every recorded start that hasn't settled is checked against its printer:
  Moonraker's job history (the first run of that file since the start: how
  it ended, when, print time, filament used), the live state (progress and
  time left, or the outcome when history is off) and the console store
  (`!!` errors logged during the run). The answer is kept on the print
  record as `report`; a finished, cancelled or failed run is never asked
  about again. The runbook shows it in "Log the last print" and "Start the
  print"; the printers screen shows it on each job off the queue.

## Times

A plate's time is the slicer's own figure when it has a fresh slice (for any
printer). Otherwise it is the CI estimate: `print-estimates.json` by artifact
key, at the flow rate for the plate's material family, summed over its items.
A plate with neither is left out of the plan until it is sliced. Every printer
is assumed to take the same time. The fleet is identical Adventurer 5Ms; a
mixed fleet would want per-printer times.

Printers report their current job through Moonraker (`fetchPrintStatus`). A
busy printer joins the plan when its current print ends. A paused print never ends on
its own, so a paused printer is planned as free on the first trip, and the
itinerary tells the operator to cancel the paused job. The printers screen
won't cancel it or start anything on a paused printer.

## Scheduling (`print-toolkit/src/print-schedule.ts`)

The operator is the constraint. A plan is a sequence of **visits**. At each
visit the operator clears every finished bed and starts the next job on it,
spending `changeover` per bed, plus `filament swap` when the material family
changes. Printers keep running through bedtime and away blocks, but nothing
starts during one.

`simulate(order, gather)` is a decoder. At each visit, each idle printer takes
the highest-priority job it may print, preferring one it is already sliced
for (`preferred`) in its loaded material, then its loaded material. A printer
that finishes while the operator is still walking the fleet joins that visit
rather than making a second trip minutes later. The
next visit is when the first busy printer with work left finishes. With a
gather allowance, it is the last printer finishing within that allowance, so
one trip handles several printers. The time is then pushed out of any block.

TPU is held back until every other job has started, then printed as one
batch on at most two printers (`lastMaterials`), so no printer sits on a
flexible all day and the swap to it is paid once, near the end. The
itinerary shows each swap and the time allowed for it, and the printers
screen warns when the loaded filament doesn't match the next plate.

`planSchedule` seeds a few orders (longest first, grouped by material, and
others) across gather allowances from 0 to "wait for all". It then hill-climbs
on the order and the allowance with a seeded RNG, so the same inputs always
give the same plan. Objectives:

- **Lowest wall-clock**: last print done soonest, then fewest trips.
- **Fewest operator trips**: fewest visits, then earliest collection.

Plates only go to printers whose bed they fit (the same
`evaluateAuthoredPlateFit` the plate editor uses). A plate no enabled printer
fits is reported, not scheduled.

## Settings

Per browser (`localStorage['3dg:print:planner']`): the objective, bedtime and
wake time, changeover and swap minutes, one-off away blocks, printers switched
off, the material loaded in each printer, and the filament preset per
material family.
