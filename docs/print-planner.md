# Print planner

A project's plates, scheduled across the printer fleet and sent to it.

## Flow

1. **Parts list → Print it.** On a view whose manifest has print plates
   (`plate: true` previews), **+ New project** makes a project named after the
   model and build. **+ Add to project** adds to the active project instead.
   Each manifest plate becomes one print plate. The plate 3MF is its single
   item at the plate origin, so the editor has nothing to arrange. The plate
   also records its material family and the model's recommended profile.
   Above the buttons, the section sums up what the planner would make of those
   plates before a project exists: the plates' total print time, the
   wall-clock and trip count on the enabled printers under each objective
   (every printer idle now, the planner's operator settings, bed fit
   assumed), and the filament per material and colour, split into part,
   support and purge. It runs the planner's own `planFleet`
   (`gallery-app/src/print/fleet-plan.ts`) on the CI estimates.
2. **Planner** (`?project=<id>`, also **Plan & print** in Projects & plates).
   It shows the plan, a Gantt chart per printer, the operator's itinerary,
   the plates, the printers and the operator's hours.
3. **Slice all.** Slices every plate for the printer the plan gives it, at the
   plate's recommended profile. The filament is the preset matched to the
   plate's material. Bed surface, layer height, preheat and centring are the
   print dialog's last selections. The G-code is kept in IndexedDB (plate
   store v5, `gcode`), keyed by plate and printer, and goes stale when the
   plate's items, arrangement or overrides change.
4. **Send to printers.** Uploads each printer's jobs in plan order, named
   `NN-<plate>.gcode` with NN the plan's start order. It starts the first job
   on every printer the plan starts *now*, unless Moonraker says that printer
   is still printing. Later jobs are only uploaded. The operator starts them
   from the itinerary, since a bed has to be cleared first.

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
itinerary tells the operator to cancel the paused job. Send to printers will
not cancel it or start anything on a paused printer.

## Scheduling (`print-toolkit/src/print-schedule.ts`)

The operator is the constraint. A plan is a sequence of **visits**. At each
visit the operator clears every finished bed and starts the next job on it,
spending `changeover` per bed, plus `filament swap` when the material family
changes. Printers keep running through bedtime and away blocks, but nothing
starts during one.

`simulate(order, gather)` is a decoder. At each visit, each idle printer takes
the highest-priority job it may print, preferring its loaded material. The
next visit is when the first busy printer with work left finishes. With a
gather allowance, it is the last printer finishing within that allowance, so
one trip handles several printers. The time is then pushed out of any block.

TPU is held back until every other job has started, then printed as one
batch on at most two printers (`lastMaterials`), so no printer sits on a
flexible all day and the swap to it is paid once, near the end. A job that
needs a filament swap is never auto-started by **Send to printers**; the
itinerary shows the swap and the time allowed for it.

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
