// SPDX-License-Identifier: MIT
/**
 * The page's half of the agent bridge (`packages/agent-bridge` is the dev
 * server's). Connects over the Vite HMR socket, says which view it is, and
 * answers the server's calls: read the screen, act on it, report the view's
 * state, run a view's action.
 *
 * Dev only: the shell starts it behind `import.meta.hot`, which a build
 * replaces with `undefined`, so none of this ships.
 */

import {
  EVENT_CALL, EVENT_HELLO, EVENT_REPLY,
  type ActionInfo, type TabCall, type TabHello, type TabReply,
} from '@3d-gallery/agent-bridge/protocol';
import { viewById, viewHref, SETTINGS_PATH, type PageId, type ViewId } from '../shell/views.js';
import { lastOpen } from '../shell/last-open.js';
import { capture, click, fill, hold, press, settle, withDialogs, type DialogRecord } from './act.js';
import { registeredView, type AgentAction } from './registry.js';
import { SHARED_ACTIONS } from './shared-actions.js';
import { snapshot } from './snapshot.js';

const TAB_KEY = '3dg:agent:tab';
const BASE = import.meta.env.BASE_URL;

function tabId(): string {
  try {
    let id = sessionStorage.getItem(TAB_KEY);
    if (!id) {
      id = `t${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(TAB_KEY, id);
    }
    return id;
  } catch {
    // No sessionStorage: this load gets its own id, and a view switch looks like a new tab.
    return `t${Math.random().toString(36).slice(2, 8)}`;
  }
}

function screen(view: PageId, extra: { dialogs?: DialogRecord[]; within?: string; find?: string } = {}) {
  return {
    view,
    url: location.pathname + location.search,
    title: document.title,
    snapshot: snapshot({ within: extra.within, find: extra.find }),
    ...(extra.dialogs?.length ? { dialogs: extra.dialogs } : {}),
  };
}

function describe(actions: Record<string, AgentAction>): ActionInfo[] {
  return Object.entries(actions).map(([name, a]) => ({
    name,
    description: a.description,
    ...(a.args ? { args: a.args } : {}),
    ...(a.writes ? { writes: true } : {}),
  }));
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

function navigateTarget(args: Record<string, unknown>): string {
  const view = str(args['view']);
  if (view === 'settings') return BASE + SETTINGS_PATH;
  if (view) return viewHref(view as ViewId, lastOpen(view as ViewId));
  const path = str(args['path'])!;
  if (/^https?:/.test(path)) throw new Error('Give a path under the gallery, not a full URL.');
  return path.startsWith(BASE) ? path : BASE + path.replace(/^\//, '');
}

async function handle(view: PageId, call: TabCall): Promise<unknown> {
  const args = call.args ?? {};
  const confirm = args['confirm'] === true;
  const ref = str(args['ref']);
  const needRef = () => {
    if (!ref) throw new Error('This needs a ref from ui_screen, like "kq12".');
    return ref;
  };
  switch (call.op) {
    case 'screen':
      return screen(view, { within: str(args['within']), find: str(args['find']) });
    case 'click': {
      const r = needRef();
      return screen(view, { dialogs: await withDialogs(confirm, () => click(r)) });
    }
    case 'hold': {
      const r = needRef();
      return screen(view, { dialogs: await withDialogs(confirm, () => hold(r)) });
    }
    case 'fill': {
      const r = needRef();
      return screen(view, { dialogs: await withDialogs(confirm, () => fill(r, args['value'], args['submit'] === true)) });
    }
    case 'press': {
      const key = str(args['key']);
      if (!key) throw new Error('Name the key, e.g. "Enter" or "Escape".');
      return screen(view, { dialogs: await withDialogs(confirm, () => press(key, ref)) });
    }
    case 'navigate': {
      if (args['back'] === true) {
        // Answered before going: if Back leaves the page, this socket goes with it.
        setTimeout(() => history.back(), 50);
        return { reloads: 'maybe' };
      }
      const url = navigateTarget(args);
      setTimeout(() => location.assign(url), 50);
      return { reloads: true, url };
    }
    case 'capture':
      return capture(ref);
    case 'state': {
      const registered = registeredView();
      return {
        view,
        url: location.pathname + location.search,
        state: registered ? await registered.state() : null,
        actions: describe(registered?.actions ?? {}),
        everywhere: describe(SHARED_ACTIONS),
      };
    }
    case 'act': {
      const name = str(args['action']) ?? '';
      const own = registeredView()?.actions ?? {};
      const action = own[name] ?? SHARED_ACTIONS[name];
      if (!action) {
        throw new Error(
          `No action "${name}" on ${view}. Here: ${Object.keys(own).join(', ') || 'none'}. `
          + `Anywhere: ${Object.keys(SHARED_ACTIONS).join(', ')}.`,
        );
      }
      const actionArgs = (args['args'] && typeof args['args'] === 'object' ? args['args'] : {}) as Record<string, unknown>;
      let result: unknown;
      const dialogs = await withDialogs(confirm, async () => {
        result = await action.run(actionArgs, { confirmed: confirm });
      });
      return dialogs.length ? { result, dialogs } : result;
    }
    default:
      throw new Error(`Unknown op "${call.op}".`);
  }
}

export function startAgentBridge(view: PageId): void {
  const hot = import.meta.hot;
  if (!hot) return;
  const tab = tabId();
  const load = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const hello = () => {
    const message: TabHello = {
      tab,
      view,
      origin: location.origin,
      url: location.pathname + location.search,
      title: document.title || viewLabel(view),
      visible: document.visibilityState === 'visible',
      focused: document.hasFocus(),
      load,
    };
    hot.send(EVENT_HELLO, message);
  };

  hot.on(EVENT_CALL, async (call: TabCall) => {
    if (call.tab !== tab) return;
    let reply: TabReply;
    try {
      reply = { id: call.id, tab, ok: true, result: await handle(view, call) };
    } catch (err) {
      reply = { id: call.id, tab, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    hot.send(EVENT_REPLY, reply);
  });

  // A dev-server restart drops the socket; Vite reconnects it but the server
  // has forgotten this tab.
  hot.on('vite:ws:connect', hello);
  for (const event of ['focus', 'blur', 'popstate'] as const) window.addEventListener(event, hello);
  document.addEventListener('visibilitychange', hello);
  // Views route with pushState, which fires no event; the title moving is
  // the cheapest sign a route changed.
  const title = document.querySelector('title');
  if (title) new MutationObserver(hello).observe(title, { childList: true, characterData: true, subtree: true });
  void settle().then(hello);
  hello();
}

function viewLabel(view: PageId): string {
  return view === 'settings' ? 'Settings' : viewById(view).label;
}
