# Getting started

3d-gallery is a browser-first tool for designing, slicing, printing and
queuing 3D prints. Models are written in OpenSCAD (for now). Everything
happens in your browser: no account, no server, no install. Your printers,
presets and projects are stored in this browser.

> **First pass.** This guide describes where the app is heading. Some views
> still open as panels inside Models rather than as their own pages. Where
> that's true today, it says so.

## The five views

A bar at the bottom of the screen switches between the views (on a wide
screen it's a rail down the left). Each tab reopens whatever you last had
open there.

### Home

This page. It also holds **Settings**, which is where you bring in your
slicer setup (see [Importing from OrcaSlicer](#importing-from-orcaslicer)).

### Models

Browse the models, spin them in 3D, and read their parts lists, filament
notes, hardware and print times.

- **Customizable** models have a parameter form. Change a value and the
  model re-renders in your browser. A bad value is outlined red with the
  reason, and nothing renders until it's fixed. Your values are part of the
  link, so you can share them.
- **Parts list.** Every printed piece, how many to make, what it's printed
  in, and the screws, magnets and other hardware it needs. Hover a piece's
  id to highlight it in the 3D view.
- **Getting parts into a project.** If the model comes with print plates,
  **Load project** opens a new project holding those plates, already laid
  out for the bed. Otherwise **Add to project** (➕) puts the part you're
  looking at onto the open project.

### Project

A project is a set of plates you want printed. There's always one open. It
starts as an unsaved draft; save it to keep it.

- **Plates.** Make, rename, duplicate and delete plates, and arrange parts
  on each one. Each plate prints in one material.
- **Leaving things out.** Untick a plate to keep it in the project but out
  of the plan: it isn't sliced, scheduled or sent. A plate with more than
  one part lists them under **Parts**. Untick a part to print the plate
  without it. Tick it again to put it back. Adding that part again from
  Models ticks it too.
- **Slicing is automatic.** Each plate is sliced in the background for the
  printer the plan gives it, using your imported presets and the model's
  recommended settings. If a plate changes, its slice is redone.
- **The plan.** The printers are scheduled around *you*: when you'll need
  to walk over, clear beds and start the next job. The plan respects your
  bedtime and time away, bundles filament changes together, and saves
  flexible filaments (TPU) for the end. Choose whether you want it all done
  soonest or with the fewest trips. It's shown as a timeline per printer
  and as a list of trips.
- **Send to printers** hands the plan to the printers. Uploads start in the
  background. Nothing prints until you start it.

*Today:* Project opens as a panel from Models (the **Project** button).

### Printers

The dashboard for every printer at once, built for a phone.

- **At a glance:** state (idle, printing, paused, error), nozzle and bed
  temperatures, the current file, layer, % done and time left, filament
  sensor, uptime and the camera.
- **Controls:** emergency stop, pause / resume / cancel, pause at the next
  layer, cancel a single object, start a file already on the printer,
  nozzle and bed temperature presets (or preheat by material), load /
  unload / purge filament, home, new bed mesh (saved), clean nozzle, cold
  pull, Z-offset nudge, speed / flow / fan, light, restart camera, firmware
  restart, reboot and power off.
- **Safety.** Emergency stop acts immediately. Cancel (the print or a
  single object), reboot, power off, firmware restart and bed mesh need a
  press-and-hold. Anything that would
  ruin a running print is greyed out while one is running.
- **Queue.** Each printer's card lists its plates from every plan you've
  sent, in the order it prints them, with what the plan asks of it
  (filament by spool, hours, stops). Uploads run in the background while
  the page is open; **Upload all** sends any that haven't gone. **Print**
  starts the plate at the head of the queue once the printer passes its
  checks (online, Klipper ready, idle, the file on it), and asks you first
  whether the bed is clear. **Skip** / **Mark done** takes a plate off the
  queue and **Put back** returns it. How each print ended is filled in from
  the printer.
- **One plan in front.** **Send to printers** opens Printers on that plan:
  its plates are highlighted, and a bar at the top shows its progress, the
  way back to the project and its runbook.
- **Queue sheet.** The **Queue** button at the top lists every upload and
  start still waiting, running or failed (Retry, Cancel, Dismiss) and the
  log of what happened.

### Operator

Your runbook for trips to the printers.

- **Home** counts down to the next trip.
- **A trip** (session) lists which printers you'll touch, which filament
  goes on, and what to bring: scraper, gloves, spare beds, bins, a cutter.
- **Each stop** walks one printer through its steps. Log how the last print
  went, with photos. Clear the bed. Swap filament if needed. Start the
  print. Check the first layer. Start / Stop timers record how long the
  work really took, so the plan's allowances get better.

The tab's badge counts down to the next trip, even with Operator closed.
**Runbook** on Project, and on Printers when it shows one plan, opens that project's runbook.

## Importing from OrcaSlicer

The app slices with the same engine as OrcaSlicer, and uses your own Orca
profiles rather than making you set them up twice.

1. Open **Settings → Import**.
2. **Recommended:** pick your whole OrcaSlicer config folder
   (`~/.config/OrcaSlicer` on Linux, `%APPDATA%\OrcaSlicer` on Windows,
   `~/Library/Application Support/OrcaSlicer` on macOS). The app finds your
   printer, filament and process presets and follows each one's `inherits`
   chain back to the vendor's system presets.
   Or pick individual `.orca_printer` / `.orca_filament` / `.orca_process`
   exports, or raw preset `.json` files.
3. Your printers appear under **Printers**. A printer preset's *print host*
   (its Moonraker address) is what the app uses to talk to that printer.
   Printers are keyed by name, so importing again updates them rather than
   duplicating them.

Good to know:

- **Your Orca files are never changed.** The app reads them and keeps its
  own copy.
- **Edits are kept on top.** Changes you make in the app's preset editor are
  stored separately from the imported file. A later re-import brings in
  Orca's changes and keeps yours on top.
- **Filament per material.** In the planner settings, choose which filament
  preset to use for each material family (PLA, PETG, TPU…). Plates are sliced
  with it.
- **Printers must allow the browser in.** Moonraker needs your page's origin
  in `cors_domains`, and a `trusted_clients` entry that covers your phone or
  computer.
- **Plain HTTP on your network.** Browsers won't let a secure (`https://`)
  page talk to a printer over `http://`. To control printers, open the app
  over `http://` on your network, or use the Android app.

## A workflow, start to finish

1. **Set up once.** In Home → Settings, import your OrcaSlicer folder.
   Your printers show up in Printers. Check each is online.
2. **Pick something to print.** In **Models**, open a model and customize
   it if you want. Press **Load project** to get its print plates, or
   **Add to project** for single parts.
3. **Plan it.** In **Project**, check the plates and save the project. Set
   your bedtime and the filament loaded in each printer. The app slices
   every plate and draws the plan: which printer prints what, when, and
   when you need to show up.
4. **Send it.** **Send to printers** uploads each plate to its printer.
5. **Walk the plan.** When **Operator** says a trip is due, bring what it
   lists. At each printer, follow its stop: log the last print, clear the
   bed, swap filament if asked, start the print, watch the first layer.
6. **Keep an eye on things.** **Printers** shows every machine live from
   your phone. Pause, check the camera, stop in an emergency, or fix a jam
   with unload / load without walking back to a computer.
7. **Re-plan whenever.** Change a plate, add a part or lose a printer, and
   the project re-slices and re-plans. Operator follows the new plan
   straight away.
