// SPDX-License-Identifier: MIT
import { spawn } from 'node:child_process';
import { TabHub, type TabSocket } from './hub.ts';
import { EVENT_HELLO, EVENT_REPLY, type TabHello, type TabReply } from './protocol.ts';
import { createBridgeTools, type BridgeToolOptions } from './tools.ts';

export { TabHub, NoTabError, type TabInfo, type TabSocket } from './hub.ts';
export { createBridgeTools, type BridgeTool, type ToolOutput, type CatalogModel } from './tools.ts';
export * from './protocol.ts';

/** The slice of Vite's `server.ws` this needs, so the package doesn't depend on Vite. */
export interface HotChannel {
  on(event: string, listener: (data: any, client: HotClient) => void): void;
}

export interface HotClient {
  send(event: string, data?: unknown): void;
  socket?: { on(event: 'close', listener: () => void): void };
}

/**
 * Wires the hub to the dev server's HMR socket. Vite hands a client object per
 * message, so tabs are tracked by the raw socket underneath it.
 */
export function attachHub(ws: HotChannel, hub = new TabHub()): TabHub {
  const sockets = new WeakMap<object, TabSocket>();
  const adapt = (client: HotClient): TabSocket => {
    const key = client.socket ?? client;
    let socket = sockets.get(key);
    if (!socket) {
      const adapted: TabSocket = { send: (event, data) => client.send(event, data) };
      sockets.set(key, adapted);
      client.socket?.on('close', () => hub.disconnect(adapted));
      socket = adapted;
    }
    return socket;
  };
  ws.on(EVENT_HELLO, (data: TabHello, client) => {
    if (data && typeof data.tab === 'string') hub.hello(data, adapt(client));
  });
  ws.on(EVENT_REPLY, (data: TabReply) => {
    if (data && typeof data.id === 'string') hub.reply(data);
  });
  return hub;
}

/** Opens a URL in the desktop's default browser. */
export function openInBrowser(url: string): Promise<void> {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  return new Promise((resolve, reject) => {
    const child = spawn(command, [url], { detached: true, stdio: 'ignore' });
    child.once('error', (err) => reject(new Error(`Could not run ${command}: ${err.message}`)));
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

export function createAgentBridge(ws: HotChannel, options: Omit<BridgeToolOptions, 'hub' | 'openUrl'> & Partial<Pick<BridgeToolOptions, 'openUrl'>>) {
  const hub = attachHub(ws);
  const tools = createBridgeTools({ openUrl: openInBrowser, ...options, hub });
  return { hub, tools };
}

/** Appended to the MCP server's instructions: how to work the gallery as its user. */
export const AGENT_INSTRUCTIONS = [
  'This server also drives the 3D gallery open in the person\'s browser, as that person would.',
  'Their presets, projects and printers live in that browser, so everything here goes through a',
  'connected tab: call ui_tabs first, and ui_open if none is connected. The person can watch the',
  'tab while you work.',
  '',
  'Look before acting: ui_screen shows the page with a ref on every control, app_state shows the',
  'view\'s data and the actions it offers. Prefer an app_action when one fits; fall back to',
  'ui_click / ui_fill / ui_hold for anything else a person could do on screen.',
  '',
  'A typical print: models_list / model_get to find the model → ui_navigate to',
  '"gallery/?model=<slug>" → models.load_project (opens a project of its print plates) →',
  'on Project, app_state shows each plate\'s material, printer, slice and the plan; set the plate',
  'material/colour and the printer, wait for slices → project.send hands the plan to the',
  'printers (nothing prints yet) → on Printers, printers.status shows what each printer has',
  'loaded and whether it is ready → printers.start starts the next queued plate.',
  '',
  'Bambu printers (behind bambu-klipper-proxy) pick the AMS tray by material family AND exact',
  'colour, and refuse a plate that matches no tray. Read the trays from printers.status and give',
  'the plate that tray\'s type and colour (e.g. PCTG #161616, not a guessed #000000).',
  '',
  'Before project.send, run slices.inspect and read it back against what the person asked for:',
  'printer, filament type and colour, nozzle and bed temperatures (a bed at 0 means the wrong',
  'bed type), layer height, and for a Bambu printer the AMS tray mapping. Tell them what you found.',
  '',
  'Safety: starting a print, cancelling one and the hold-to-confirm controls act on real',
  'machines. Ask the person before each, and pass confirm: true only for the question they',
  'answered (e.g. the bed is clear). Emergency stop needs no confirmation and must never be',
  'delayed when they ask for it.',
].join('\n');
