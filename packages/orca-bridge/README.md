# @3d-gallery/orca-bridge

Read-only reader for a local OrcaSlicer install, exposed two ways: an MCP HTTP
server mounted on the gallery dev server, and a CLI.

It exists to answer one question — *what did this person actually print, and with
what settings?* — so a finished Orca job can be reconstructed in the gallery.

**Nothing in this package writes to the Orca config.** The `orca_*` tools are all
advertised `readOnlyHint: true` and a test enforces that. The one thing that is
writable is the gallery's *own* store — see below.

## Why reconciliation, not import

A sliced `.3mf` names the presets it used and carries their fully resolved
values, but no lineage. `Metadata/project_settings.config` has ~600 flattened
keys with `inherits` already stripped, plus `printer_settings_id`,
`filament_settings_id` and `print_settings_id` — names only. Nothing records
which preset a given value came from, or where a source STL lived.

So every level arrives as *a name and some values, with no identity*:

| Level | What the project carries | What has to be recovered |
|-------|-------------------------|--------------------------|
| Printer | `printer_settings_id` | Which preset on disk, if any, still matches |
| Filament | `filament_settings_id[]` | Same, per extruder |
| Process | `print_settings_id` | Same |
| Config | ~600 resolved values | Which of them were deliberate choices |
| Objects | `source_file`, 4×4 matrix, offsets, extruder | Where the source geometry lives now |
| Plate | per-object bbox, area, layer height | Nothing — it's derived, not authored |

Matching by name alone is not enough: a preset can be renamed, deleted, or
duplicated. That is why `orca_get_preset` reports **overrides** — the fields a
preset declares relative to its inherited base. Six declared fields identify a
printer profile far better than 102 merged ones, most of which came from a
vendor file.

## Logs are not a change history

Orca's `log/` directory is not an audit trail. At the default
`log_severity_level` of `warning`, a session log is overwhelmingly one repeated
`get_version` warning and a handful of unrelated errors — no preset saves, no
slices, no uploads. `orca_logs` reports what is actually there and flags the
case where one message dominates, so a caller does not mistake volume for
signal.

Change detection comes from preset file contents and `OrcaSlicer.conf` instead.
Two keys in that file carry what the logs do not:

- `orca_presets` — printer + filament + process combinations actually used
  together. `orca_usage` dedupes and ranks these, which is the best available
  signal for which of a 5,000-preset library matters.
- `recent_projects` — the sliced 3MFs, most recent first.

## MCP server

Mounted by `orcaMcpPlugin` in `packages/gallery-app/vite.config.ts` at:

```
http://localhost:5173/3d-gallery/__mcp
```

Dev only — `configureServer` never runs during a build, so it cannot reach the
published site. Attach with the repo's `.mcp.json`.

Transport is **stateless Streamable HTTP**: POST JSON-RPC, get one
`application/json` response. No session ids and no server-initiated SSE, because
every tool is a synchronous read — so `GET` and `DELETE` are `405`. Notifications
get `202` with an empty body.

**No auth, by design.** Single user, bound to a dev server, and the MCP caller is
whoever started it. When this moves to a hosted multi-user model, the thing that
has to become per-user is the identity of the *config root* — every query already
takes an `OrcaPaths`, so that argument is where auth will land.

### Tools

| Tool | Purpose |
|------|---------|
| `orca_doctor` | Where the install is and what it holds. Call first. |
| `orca_list_presets` | Enumerate printer / filament / process presets. |
| `orca_get_preset` | Resolve one: chain, overrides, values. |
| `orca_machines` | Network machines Orca has registered. |
| `orca_usage` | Preset combos actually used, ranked. |
| `orca_list_projects` | Recently sliced 3MF projects. |
| `orca_read_project` | Extract objects, plates and preset names from a project. |
| `orca_logs` | What the logs actually contain. |

The `orca_*` tools are advertised `readOnlyHint: true`; the two `gallery_*`
writers are not, so a client can auto-approve reads of someone's slicer config
while still prompting before anything is written.

| Write tool | Purpose |
|------------|---------|
| `gallery_list_presets` | What the gallery store holds (read-only). |
| `gallery_add_printer` | Copy an Orca preset in with its inheritance chain. `as` + `address` duplicate it onto another machine, as overrides. |
| `gallery_remove_preset` | Drop a record from the store. |

A failed read — unknown preset name, missing file — comes back as a tool result
with `isError: true` and near-match suggestions, not a JSON-RPC error, so a model
can correct its arguments and retry. Protocol-level mistakes (unknown tool name,
unknown method) are JSON-RPC errors.

## CLI

Same queries, same implementation — both shells call `queries.ts`.

```bash
node packages/orca-bridge/src/cli.ts doctor
node packages/orca-bridge/src/cli.ts printers --detail
node packages/orca-bridge/src/cli.ts presets filament --name PETG
node packages/orca-bridge/src/cli.ts preset printer "Flashforge Adventurer 5M 0.4 Klipper Left"
node packages/orca-bridge/src/cli.ts usage --limit 10
node packages/orca-bridge/src/cli.ts projects
node packages/orca-bridge/src/cli.ts project ~/some-project.3mf --config-fields layer_height,sparse_infill_density
node packages/orca-bridge/src/cli.ts logs
```

JSON on stdout, diagnostics on stderr.

## Locating the install

Platform defaults: `~/.config/OrcaSlicer` (Linux),
`~/Library/Application Support/OrcaSlicer` (macOS), `%APPDATA%/OrcaSlicer`
(Windows). Override with `--config <dir>` or `ORCA_CONFIG_DIR`.

An explicit root is **authoritative** — it is never supplemented with the
platform default. Answering about a different install than the caller named
would be worse than reporting that theirs is missing.

## Notes for maintainers

- Imports carry explicit `.ts` extensions so bare `node` runs them via type
  stripping, per the repo convention. That rules out constructor **parameter
  properties** and anything else strip-only mode rejects.
- `presets.ts` reports an override set containing only keys the preset itself
  declares. A key it omits is *inherited*, not removed — Orca has no way to
  negate an inherited field, so emitting `removed` diffs would restate the
  entire parent chain as though a human had chosen it.
- `project.ts` parses `model_settings.config` with regexes rather than an XML
  dependency. The format is small, fixed, and written by one producer.
- The ids in `plate_N.json` are internal identifiers and do **not** match the
  object ids in `model_settings.config`. Plate geometry is folded onto objects
  by name.
- `app.version` in `OrcaSlicer.conf` is the Bambu network plugin's version, not
  Orca's. The slicer version only appears inside project files — `doctor`
  reports it as `networkPluginVersion` to avoid the confusion.

## The gallery store, and why it exists

MCP runs in Node. The gallery's presets live in **browser IndexedDB**. Neither
can reach the other, so an agent cannot create a printer the UI will show — that
gap is what this store closes.

`store.ts` keeps records at `.cache/orca-bridge/gallery-presets.json` in exactly
the shape `print-storage.ts` persists, so the browser upserts them verbatim.
A record keeps the preset file verbatim as `raw` and a snapshot of each parent
in its chain as `parents`, which lets it survive without the vendor presets
while still saying which layer every value came from. Gallery edits live in a
separate `overrides` object over `raw` — a duplicate made with `as` / `address`
is just the source file plus overrides for `print_host`, `name` and
`printer_settings_id`. Each record carries its provenance (`source`) and the
time it was written (`updatedAt`).

The browser's automatic pull on page load is **newer-wins per record**: a
preset edited in the browser after the server copy was written is left alone,
so a reload can't undo an edit. **Use server values** forces the pull.

### Local-first, server optional

IndexedDB is the real store. The server store is something you opt into by
running your own, which is the whole point: someone using a hosted gallery
without a server keeps everything in their browser and never sees these
endpoints, so nobody pays to host what they do not use.

`__devstore` exposes three verbs, matching the three decisions a user can make,
and the Import tab renders one button for each:

| Verb | Button | Behaviour |
|------|--------|-----------|
| `GET` | — | What does the server have? Also the availability probe. |
| `PUT` | **Export to server** | Take my local records. **Replaces**, never merges — a merge would resurrect presets deleted locally. |
| `GET` → upsert | **Use server values** | Copy the server's records into IndexedDB. **Additive** — never deletes a local preset. |
| `DELETE` | **Delete from server, use local** | Empty the server store and stop syncing. Local records are untouched. |

"Use server values" also sets an opt-in flag, so later loads pick up anything
added server-side — including by an agent over MCP — without another click.
"Delete from server, use local" clears it.

### Detecting the endpoint is genuinely absent

A deployment without a server store serves the **SPA fallback**, which answers
`200` with `text/html`. Status alone proves nothing, so `probeServerStore` requires
a JSON content-type *and* `available: true` before showing any of this UI. Verified
against a real `vite preview`: both `__mcp` and `__devstore` come back as
`200 text/html` there, and the UI stays hidden.
