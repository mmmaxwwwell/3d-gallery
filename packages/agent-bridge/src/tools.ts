// SPDX-License-Identifier: MIT
/**
 * The MCP tools that drive a gallery tab.
 *
 * Two layers. The `ui_*` tools act on the screen the way a person does: read
 * what is shown, click, type, hold, navigate. They reach every control in
 * every view without the view knowing about them. The `app_*` tools are the
 * view's own vocabulary: each page registers its state and a few named
 * actions (load a model's plates, send a plan), which are steadier to drive
 * than a sequence of clicks. `models_*` read the catalogue straight from the
 * dev server and need no tab.
 */

import { NoTabError, type TabHub, type TabInfo } from './hub.ts';

type Json = Record<string, unknown>;

export interface ToolOutput {
  text: string;
  data?: unknown;
  images?: Array<{ mimeType: string; data: string }>;
}

export interface BridgeTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  readOnly: boolean;
  /** Reaches a printer or deletes something. Clients should ask first. */
  destructive?: boolean;
  run(args: Json): Promise<ToolOutput>;
}

/** What the page's ui ops return. */
interface ScreenResult {
  view: string;
  url: string;
  title: string;
  snapshot: string;
  /** confirm()/alert()/prompt() raised while acting, with how each was answered. */
  dialogs?: Array<{ kind: string; message: string; answered: unknown }>;
  note?: string;
}

export interface CatalogModel {
  slug: string;
  title: string;
  description?: string;
  devOnly?: boolean;
  [key: string]: unknown;
}

export interface BridgeToolOptions {
  hub: TabHub;
  /** The dev server's origin + base, e.g. http://localhost:5173/3d-gallery/ */
  appUrl: () => string;
  /** The authored manifest's models, current as of the last manifest reload. */
  catalog: () => CatalogModel[];
  /** Opens a URL in the person's browser. */
  openUrl: (url: string) => Promise<void>;
  /**
   * The person's Orca presets, each with its inheritance chain, as the
   * gallery's folder import reads them. Absent when no Orca install is wired.
   */
  orcaImport?: (input: { kinds?: Array<'printer' | 'filament'>; names?: string[] }) => {
    records: unknown[];
    notFound: string[];
    warnings: string[];
  };
  /** Overrides for tests. */
  timeouts?: Partial<typeof DEFAULT_TIMEOUTS>;
}

const DEFAULT_TIMEOUTS = {
  /** A ui op: act, then wait for the page to settle. */
  ui: 20_000,
  /** A view action may slice, which takes minutes for a big plate. */
  action: 10 * 60_000,
  /** A full page load after navigating. */
  reload: 30_000,
};

/** Ops that only read, so they can be repeated after a reload interrupts them. */
const READS = new Set(['screen', 'state', 'capture']);

const TAB_ARG = {
  tab: { type: 'string', description: 'Tab id from ui_tabs. Omit to use the tab the person is looking at.' },
};

const CONFIRM_ARG = {
  confirm: {
    type: 'boolean',
    description:
      'How to answer a confirm() dialog this raises. Omitted or false declines it and the result '
      + 'shows the question. Pass true only after the person has answered that question yes '
      + '(e.g. "Is the bed clear?").',
  },
};

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function screenText(r: ScreenResult): string {
  const lines = [`[${r.view}] ${r.title}`, r.url];
  for (const d of r.dialogs ?? []) {
    lines.push(`! ${d.kind}: ${JSON.stringify(d.message)} → answered ${JSON.stringify(d.answered)}`);
  }
  if (r.note) lines.push(`note: ${r.note}`);
  lines.push('', r.snapshot);
  return lines.join('\n');
}

function tabLine(t: TabInfo): string {
  const flags = [t.connected ? 'connected' : 'gone', t.focused && 'focused', t.visible && 'visible']
    .filter(Boolean)
    .join(', ');
  return `${t.tab}  [${t.view}] ${t.title} — ${t.url} (${flags})`;
}

export function createBridgeTools(options: BridgeToolOptions): BridgeTool[] {
  const { hub } = options;
  const timeouts = { ...DEFAULT_TIMEOUTS, ...options.timeouts };

  /**
   * Runs an op on a tab. If the op made the page navigate (a link, a view
   * switch) the socket drops before the answer arrives: wait for the same
   * tab to come back, then show the new screen.
   */
  async function onTab(args: Json, op: string, opArgs: Json, timeoutMs = timeouts.ui): Promise<unknown> {
    let tab = hub.pick(str(args['tab']));
    if (!tab.connected) tab = { ...tab, ...(await hub.waitFor(tab.tab, () => true, timeouts.reload)), connected: true };
    try {
      return await hub.call(tab.tab, op, opArgs, timeoutMs);
    } catch (err) {
      if (err instanceof NoTabError || !/reloaded or closed/.test((err as Error).message)) throw err;
      await hub.waitFor(tab.tab, (h) => h.load !== tab.load, timeouts.reload);
      // A read is simply asked again of the new page. An act already happened.
      if (READS.has(op)) return hub.call(tab.tab, op, opArgs, timeoutMs);
      const screen = (await hub.call(tab.tab, 'screen', {}, timeouts.ui)) as ScreenResult;
      return { ...screen, note: `The page navigated to ${screen.url}.` };
    }
  }

  async function screenOp(args: Json, op: string, opArgs: Json): Promise<ToolOutput> {
    const result = (await onTab(args, op, opArgs)) as ScreenResult;
    return { text: screenText(result), data: result };
  }

  const tools: BridgeTool[] = [
    {
      name: 'ui_tabs',
      title: 'Connected gallery tabs',
      description:
        'The gallery tabs open on this dev server, the view and URL each shows, and which one the '
        + 'person is looking at. Every ui_* and app_* tool acts on that one unless given a tab.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      readOnly: true,
      async run() {
        const tabs = hub.tabs();
        return {
          text: tabs.length ? tabs.map(tabLine).join('\n') : 'No gallery tab is connected. Call ui_open.',
          data: { tabs },
        };
      },
    },
    {
      name: 'ui_open',
      title: 'Open the gallery in the browser',
      description:
        'Opens a new gallery tab in the person\'s default browser and waits for it to connect. '
        + 'Use when ui_tabs shows none. The tab shares the person\'s presets, projects and printers.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path under the gallery, e.g. "gallery/?model=foo" or "printers/". Default: Home.',
          },
        },
        additionalProperties: false,
      },
      readOnly: false,
      async run(args) {
        const known = hub.tabs();
        const before = new Set(known.map((t) => t.tab));
        // localhost and 127.0.0.1 are different origins with different stores:
        // open where the person's tabs already are.
        const seen = known.sort((a, b) => b.seenAt - a.seenAt)[0];
        const base = seen ? new URL(options.appUrl()).pathname : '';
        const root = seen ? `${seen.origin}${base}` : options.appUrl();
        const url = root + (str(args['path']) ?? '').replace(/^\//, '');
        const arrived = new Promise<TabInfo>((resolve, reject) => {
          const started = Date.now();
          const poll = setInterval(() => {
            const fresh = hub.tabs().find((t) => t.connected && !before.has(t.tab));
            if (fresh) {
              clearInterval(poll);
              resolve(fresh);
            } else if (Date.now() - started > timeouts.reload) {
              clearInterval(poll);
              reject(new Error(`Opened ${url}, but no new tab connected within ${timeouts.reload / 1000} s.`));
            }
          }, 200);
        });
        await options.openUrl(url);
        const tab = await arrived;
        return { text: `Opened ${url}\n${tabLine(tab)}`, data: tab };
      },
    },
    {
      name: 'ui_screen',
      title: 'Read the screen',
      description:
        'What the tab shows right now, as an outline of the page: headings, text, and every control '
        + 'with its label, value and state. Each control carries a ref like [kq12]; pass that ref to '
        + 'ui_click, ui_fill, ui_hold or ui_press. Refs stay valid until the page reloads, which every view switch does. '
        + 'Off-screen content is included (marked "offscreen"); the person sees only what is on screen.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TAB_ARG,
          within: { type: 'string', description: 'Only the part of the page inside this ref.' },
          find: { type: 'string', description: 'Only lines containing this text (case-insensitive), with their section headings.' },
        },
        additionalProperties: false,
      },
      readOnly: true,
      run: (args) => screenOp(args, 'screen', { within: str(args['within']), find: str(args['find']) }),
    },
    {
      name: 'ui_click',
      title: 'Click a control',
      description:
        'Clicks the control with this ref, waits for the page to settle, and returns the new screen. '
        + 'A control marked "hold" is press-and-hold; use ui_hold for it.',
      inputSchema: {
        type: 'object',
        properties: { ...TAB_ARG, ref: { type: 'string' }, ...CONFIRM_ARG },
        required: ['ref'],
        additionalProperties: false,
      },
      readOnly: false,
      run: (args) => screenOp(args, 'click', { ref: str(args['ref']), confirm: args['confirm'] === true }),
    },
    {
      name: 'ui_fill',
      title: 'Set a field',
      description:
        'Sets a text box, number, slider, colour, dropdown or checkbox to a value, as if typed or '
        + 'picked, and fires the same events typing would. For a dropdown pass the option\'s label '
        + 'or value; for a checkbox or switch pass true/false. Returns the new screen.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TAB_ARG,
          ref: { type: 'string' },
          value: { type: ['string', 'number', 'boolean'] },
          submit: { type: 'boolean', description: 'Press Enter afterwards.' },
        },
        required: ['ref', 'value'],
        additionalProperties: false,
      },
      readOnly: false,
      run: (args) =>
        screenOp(args, 'fill', { ref: str(args['ref']), value: args['value'], submit: args['submit'] === true }),
    },
    {
      name: 'ui_hold',
      title: 'Press and hold a control',
      description:
        'Presses and holds a hold-to-confirm control until it fires. These guard actions that stop '
        + 'or throw away a print (cancel, reboot, power off, firmware restart, bed mesh). Only use '
        + 'one when the person has asked for exactly that action.',
      inputSchema: {
        type: 'object',
        properties: { ...TAB_ARG, ref: { type: 'string' }, ...CONFIRM_ARG },
        required: ['ref'],
        additionalProperties: false,
      },
      readOnly: false,
      destructive: true,
      run: (args) => screenOp(args, 'hold', { ref: str(args['ref']), confirm: args['confirm'] === true }),
    },
    {
      name: 'ui_press',
      title: 'Press a key',
      description:
        'Presses a key (Enter, Escape, Tab, ArrowDown, a letter…) on the control with this ref, or '
        + 'on the page if none. Escape closes dialogs and sheets.',
      inputSchema: {
        type: 'object',
        properties: { ...TAB_ARG, key: { type: 'string' }, ref: { type: 'string' } },
        required: ['key'],
        additionalProperties: false,
      },
      readOnly: false,
      run: (args) => screenOp(args, 'press', { key: str(args['key']), ref: str(args['ref']) }),
    },
    {
      name: 'ui_navigate',
      title: 'Go to a view or URL',
      description:
        'Switches the tab to a view (home, models, project, printers, operator, settings), to a path '
        + 'under the gallery (e.g. "gallery/?model=foo", "project/?id=…"), or back. Waits for the '
        + 'page to load and returns its screen.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TAB_ARG,
          view: { type: 'string', enum: ['home', 'models', 'project', 'printers', 'operator', 'settings', 'library'] },
          path: { type: 'string' },
          back: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      readOnly: true,
      async run(args) {
        let tab = hub.pick(str(args['tab']));
        if (!tab.connected) tab = { ...tab, ...(await hub.waitFor(tab.tab, () => true, timeouts.reload)), connected: true };
        const target = { view: str(args['view']), path: str(args['path']), back: args['back'] === true };
        if (!target.view && !target.path && !target.back) throw new Error('Give a view, a path, or back: true.');
        // The page answers first and navigates just after, so the answer isn't
        // lost with the old socket. Back may stay on the page (a pushState step).
        const answer = (await hub.call(tab.tab, 'navigate', target, timeouts.ui)) as { reloads: boolean | 'maybe' };
        if (answer.reloads) {
          const reloaded = hub.waitFor(tab.tab, (h) => h.load !== tab.load, answer.reloads === true ? timeouts.reload : 2_000);
          await (answer.reloads === true ? reloaded : reloaded.catch(() => undefined));
        }
        const screen = (await hub.call(tab.tab, 'screen', {}, timeouts.ui)) as ScreenResult;
        return { text: screenText(screen), data: screen };
      },
    },
    {
      name: 'ui_capture',
      title: 'Picture of the 3D view',
      description:
        'A picture (JPEG, at most 1280 px) of a canvas on the page: the model viewer, a plate preview, a G-code preview or a '
        + 'camera. Pass the canvas\'s ref from ui_screen, or omit it for the largest canvas.',
      inputSchema: {
        type: 'object',
        properties: { ...TAB_ARG, ref: { type: 'string' } },
        additionalProperties: false,
      },
      readOnly: true,
      async run(args) {
        const shot = (await onTab(args, 'capture', { ref: str(args['ref']) })) as {
          ref: string; width: number; height: number; mimeType: string; data: string;
        };
        return {
          text: `Canvas ${shot.ref}, ${shot.width}×${shot.height}`,
          images: [{ mimeType: shot.mimeType, data: shot.data }],
        };
      },
    },
    {
      name: 'app_state',
      title: 'What this view knows',
      description:
        'The current view\'s state as data (the open model and its parameters; the project\'s plates, '
        + 'printers, slices and plan; each printer\'s live status and queue…) and the actions it '
        + 'offers app_action, with their arguments. Actions that work on any view (presets, '
        + 'printers, projects, planner settings) are listed too. Prefer these over clicking when '
        + 'one fits.',
      inputSchema: { type: 'object', properties: { ...TAB_ARG }, additionalProperties: false },
      readOnly: true,
      async run(args) {
        const state = await onTab(args, 'state', {});
        return { text: JSON.stringify(state, null, 2), data: state };
      },
    },
    {
      name: 'app_action',
      title: 'Run a view action',
      description:
        'Runs one of the actions app_state lists for the current view, e.g. models.load_project on '
        + 'Models or project.send on Project. Some navigate on their own; the result says where to '
        + 'look next. Actions that reach a printer say so in their description: only run those when '
        + 'the person asked for that print or control.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TAB_ARG,
          action: { type: 'string' },
          args: { type: 'object', description: 'The action\'s arguments, per app_state.' },
          ...CONFIRM_ARG,
        },
        required: ['action'],
        additionalProperties: false,
      },
      readOnly: false,
      destructive: true,
      async run(args) {
        const action = str(args['action']);
        if (!action) throw new Error('Name the action. app_state lists them.');
        const result = await onTab(
          args,
          'act',
          {
            action,
            args: args['args'] && typeof args['args'] === 'object' ? args['args'] : {},
            confirm: args['confirm'] === true,
          },
          timeouts.action,
        );
        return { text: JSON.stringify(result, null, 2), data: result };
      },
    },
    {
      name: 'presets_import',
      title: 'Import Orca presets into the gallery',
      description:
        'Import the person\'s OrcaSlicer printer and filament presets into the gallery, as Settings → '
        + 'Import with the config folder would: each user preset with its inheritance chain, read '
        + 'from the local Orca install (orca_list_presets shows what is there). Omit names to import '
        + 'every user preset. Or pass files ([{name, text}]) holding exported .orca_printer / '
        + '.orca_filament / preset .json contents. Re-importing keeps edits made in the gallery. '
        + 'Afterwards, app_action presets.audit finds duplicates and checks which filament goes to '
        + 'which printer.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TAB_ARG,
          names: { type: 'array', items: { type: 'string' }, description: 'Exact Orca preset names. Default: all user presets.' },
          kinds: { type: 'array', items: { type: 'string', enum: ['printer', 'filament'] } },
          files: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' } }, required: ['name', 'text'] },
          },
        },
        additionalProperties: false,
      },
      readOnly: false,
      async run(args) {
        const files = Array.isArray(args['files']) ? args['files'] : [];
        let fromOrca: ReturnType<NonNullable<BridgeToolOptions['orcaImport']>> = { records: [], notFound: [], warnings: [] };
        if (!files.length) {
          if (!options.orcaImport) throw new Error('No OrcaSlicer install is wired to this server. Pass files instead.');
          const names = Array.isArray(args['names']) ? args['names'].map(String) : undefined;
          const kinds = Array.isArray(args['kinds'])
            ? args['kinds'].filter((k): k is 'printer' | 'filament' => k === 'printer' || k === 'filament')
            : undefined;
          fromOrca = options.orcaImport({ names, kinds });
          if (!fromOrca.records.length) {
            throw new Error(`Nothing to import.${fromOrca.notFound.length ? ` Not user presets in Orca: ${fromOrca.notFound.join(', ')}.` : ''}`);
          }
        }
        const result = await onTab(args, 'act', {
          action: 'presets.import',
          args: { presets: fromOrca.records, files },
        }, timeouts.action) as Record<string, unknown>;
        const data = { ...result, notFound: fromOrca.notFound, warnings: fromOrca.warnings };
        return { text: JSON.stringify(data, null, 2), data };
      },
    },
    {
      name: 'models_list',
      title: 'The model catalogue',
      description:
        'Every model in the gallery: slug, title, description, whether it is customizable, its '
        + 'filament hints and print plates. Needs no tab. Use model_get for one model in full.',
      inputSchema: {
        type: 'object',
        properties: { find: { type: 'string', description: 'Case-insensitive filter on slug, title and description.' } },
        additionalProperties: false,
      },
      readOnly: true,
      async run(args) {
        const find = str(args['find'])?.toLowerCase();
        const rows = options.catalog()
          .filter((m) => !find || [m.slug, m.title, m.description ?? ''].join(' ').toLowerCase().includes(find))
          .map((m) => ({
            slug: m.slug,
            title: m.title,
            description: m.description,
            customizable: m['customizable'] === true,
            devOnly: m.devOnly === true,
            filament: m['filament'],
            plates: plateLabels(m),
          }));
        return {
          text: rows.map((r) => `${r.slug} — ${r.title}${r.devOnly ? ' (dev)' : ''}${r.plates.length ? ` · ${r.plates.length} plate(s)` : ''}`).join('\n')
            || 'No model matches.',
          data: { models: rows },
        };
      },
    },
    {
      name: 'model_get',
      title: 'One model in full',
      description:
        'A model\'s manifest entry: parts, previews, plates with their components, filament, '
        + 'hardware, print profile and builds. Needs no tab.',
      inputSchema: {
        type: 'object',
        properties: { slug: { type: 'string' } },
        required: ['slug'],
        additionalProperties: false,
      },
      readOnly: true,
      async run(args) {
        const slug = str(args['slug']);
        const all = options.catalog();
        const model = all.find((m) => m.slug === slug);
        if (!model) {
          const near = all.filter((m) => slug && (m.slug.includes(slug) || m.title.toLowerCase().includes(slug.toLowerCase())));
          throw new Error(`No model "${slug}".${near.length ? ` Did you mean: ${near.map((m) => m.slug).join(', ')}?` : ''}`);
        }
        return { text: JSON.stringify(model, null, 2), data: model };
      },
    },
  ];
  return tools;
}

function plateLabels(model: Json): string[] {
  const previews = [
    ...((model['previews'] as Json[] | undefined) ?? []),
    ...(((model['builds'] as Json[] | undefined) ?? []).flatMap((b) => (b['previews'] as Json[] | undefined) ?? [])),
  ];
  return previews.filter((p) => p['plate'] === true).map((p) => String(p['label'] ?? p['file']));
}
