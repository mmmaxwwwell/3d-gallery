# @3d-gallery/agent-bridge

Lets an MCP client (Claude Code, any agent) use the gallery as its person
does: see what a tab shows, click, type, switch views, and call each view's
own actions, from finding a model to starting the print.

The person's presets, projects, slices and printers live in their browser
(IndexedDB and `localStorage`, per origin), and slicing runs in the page's
WASM. So the agent drives a **real open tab**, not a copy of the app in
Node. The person can watch it work, and everything it does goes through
the code paths their clicks would use.

Dev server only. Nothing here is built into the published site.

## How it fits together

```
MCP client ──POST /3d-gallery/__mcp──▶ dev server (orca-bridge's MCP server)
                                          │ extra tools from this package
                                          ▼
                                       TabHub ──Vite HMR socket──▶ gallery tab
                                                 agent:call / agent:reply      │
                                                                                ▼
                                                     src/agent/bridge.ts (every page, via the shell)
                                                     ├─ snapshot.ts   the screen as an outline with refs
                                                     ├─ act.ts        click / fill / hold / press / capture
                                                     ├─ shared-actions.ts  presets, printers, projects, planner
                                                     └─ registry.ts   what the current view registered
```

- **One MCP endpoint.** The tools are served by the existing orca-bridge
  server at `/3d-gallery/__mcp` (`extraTools`), so the repo's `.mcp.json`
  already points a client at them.
- **The socket is Vite's.** Each page's shell starts `src/agent/bridge.ts`
  behind `import.meta.hot`, so the bridge isn't bundled into a build. Tabs
  say hello with an id kept in `sessionStorage`. A view switch is a full page
  load, so the id stays the same while the socket changes, and the hub
  follows it across the reload.
- **Native dialogs are answered, not shown.** A `confirm()` would freeze the
  page and the socket with it. While the agent acts, the bridge answers each
  dialog (no, unless the call passed `confirm: true`) and returns the
  question, so the agent can put it to the person.

## Tools

| Tool | What it does |
|------|--------------|
| `ui_tabs` | Connected tabs, their view and URL, and which one the person is looking at. |
| `ui_open` | Opens a new tab in the default browser (`xdg-open` / `open`) and waits for it to connect. |
| `ui_screen` | The page as an outline: headings, text, every control with label, value, state and a ref. `within` / `find` narrow it. |
| `ui_click`, `ui_fill`, `ui_press` | Act on a ref with the events a person's input fires. Return the screen after the page settles. |
| `ui_hold` | Press and hold a hold-to-confirm control (cancel, reboot, power off…). |
| `ui_navigate` | Go to a view, a path under the gallery, or back. |
| `ui_capture` | PNG of a canvas: the model viewer, a plate, a G-code preview. |
| `app_state` | The current view's state as data, the actions it offers, and the actions every view offers. |
| `app_action` | Run one of those actions. |
| `models_list`, `model_get` | The catalogue, straight from `models/manifest.json`. Need no tab. |
| `presets_import` | Settings → Import without a file picker. Reads the local Orca install's user printer and filament presets with their inheritance chains (orca-bridge's `galleryImportRecords`), or takes exported files' contents, and stores them in the tab's browser. Re-imports keep gallery edits. |

Refs (`[kq12]`) carry a per-page-load prefix. A ref read before a reload
is refused instead of silently naming a control on the new page.

### View actions

Each view registers its own state and actions through
`registerAgentView` (`gallery-app/src/agent/registry.ts`), calling the
same functions its buttons do:

| View | Actions |
|------|---------|
| Models | `models.open`, `models.load_project`, `models.add_to_project` |
| Project | `project.set_plate` (material, colour, skip, parts), `planner.update`, `project.wait_until_sliced`, `project.save`, `project.send` |
| Printers | `printers.start` (asks about the bed until `confirm: true`), `printers.upload_all`, `printers.set_loaded` |
| Any | `presets.list`, `printers.status` (live, plus AMS trays from bambu-klipper-proxy's `bambu_ams`), `projects.list`, `planner.settings`, `planner.update` |
| Any (presets) | `presets.audit` (duplicates: identical printing values, near-identical names with the keys they differ in, printers sharing an address; and per filament which printers it's offered to vs. what its `@ …` name suggests), `presets.set_compatible`, `presets.delete` (asks until `confirm: true`), `presets.import` |

Anything without an action is still reachable through the `ui_*` tools.

## Safety

- The MCP server advertises `destructiveHint` on `app_action` and
  `ui_hold`, so a client prompts before them. Read-only tools are marked
  read-only.
- `printers.start` refuses until it's called with `confirm: true`, and the
  refusal carries the page's own bed question. The agent is told to ask the
  person and pass `confirm` only for the question they answered.
- The agent can't pick files from the person's disk (`ui_fill` refuses a
  file input). `presets_import` reads only the Orca config folder, which
  the orca tools already read. Anything else, the agent passes as file
  contents.
- No auth, the same as the rest of the dev server: single user, and the
  caller is whoever started it.

## Testing

- `npm test -w @3d-gallery/agent-bridge`: the hub (tab choice, relaying,
  reloads, timeouts) and the tools against fake tabs.
- `packages/gallery-app/tests/e2e/agent-mcp.spec.ts`: a real tab driven
  only through `/__mcp`. It adds a part to a project, makes the plate black
  PCTG, slices it, sends it, uploads and starts it on the Moonraker
  simulator. It also covers the ui tools across a view switch and a
  `confirm()`, and the preset tools: import, audit, set compatible, delete.

## Notes for maintainers

- Imports carry explicit `.ts` extensions, and there are no constructor
  parameter properties: `vite.config.ts` loads this package through Node's
  type stripping.
- `npm run dev` watches `agent-bridge/src` and restarts the dev server on an
  edit. Open tabs reconnect and say hello again.
- `protocol.ts` is imported by the page too. Keep it free of Node and DOM.
