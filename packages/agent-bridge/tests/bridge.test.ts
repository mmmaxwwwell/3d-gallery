// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { attachHub, createBridgeTools, NoTabError, TabHub, type HotChannel, type HotClient } from '../src/index.ts';
import type { TabCall, TabHello } from '../src/protocol.ts';

/** A fake Vite ws server plus page clients that answer calls. */
function harness() {
  const listeners = new Map<string, (data: any, client: HotClient) => void>();
  const ws: HotChannel = { on: (event, fn) => listeners.set(event, fn) };
  const hub = attachHub(ws);

  function page(hello: Omit<TabHello, 'load'> & { load?: string }, answer: (call: TabCall) => unknown) {
    const closers: Array<() => void> = [];
    const client: HotClient = {
      send(event, data) {
        if (event !== 'agent:call') return;
        const call = data as TabCall;
        queueMicrotask(async () => {
          try {
            listeners.get('agent:reply')!({ id: call.id, tab: call.tab, ok: true, result: await answer(call) }, client);
          } catch (err) {
            listeners.get('agent:reply')!({ id: call.id, tab: call.tab, ok: false, error: (err as Error).message }, client);
          }
        });
      },
      socket: { on: (_e, fn) => closers.push(fn) },
    };
    listeners.get('agent:hello')!({ load: 'l1', ...hello }, client);
    return { client, close: () => closers.forEach((fn) => fn()), hello: (h: Partial<TabHello>) => listeners.get('agent:hello')!({ load: 'l1', ...hello, ...h }, client) };
  }
  return { hub, page };
}

const base = { view: 'home', origin: 'http://localhost:5173', url: '/3d-gallery/', title: 'Home', visible: true, focused: false };

describe('TabHub', () => {
  it('picks the focused tab, then the visible one, then the newest', () => {
    let now = 1000;
    const { hub, page } = harness();
    (hub as unknown as { now: () => number }).now = () => now++;
    page({ ...base, tab: 'a', visible: false }, () => null);
    page({ ...base, tab: 'b' }, () => null);
    page({ ...base, tab: 'c', visible: false }, () => null);
    expect(hub.pick().tab).toBe('b');
    page({ ...base, tab: 'c', focused: true }, () => null);
    expect(hub.pick().tab).toBe('c');
    expect(hub.pick('a').tab).toBe('a');
  });

  it('says how to get a tab when none is connected', () => {
    expect(() => new TabHub().pick()).toThrow(NoTabError);
    expect(() => new TabHub().pick()).toThrow(/ui_open/);
  });

  it('relays a call and its answer', async () => {
    const { hub, page } = harness();
    page({ ...base, tab: 'a' }, (call) => ({ echoed: call.op, args: call.args }));
    await expect(hub.call('a', 'screen', { x: 1 }, 1000)).resolves.toEqual({ echoed: 'screen', args: { x: 1 } });
  });

  it('passes a page error back as a rejection', async () => {
    const { hub, page } = harness();
    page({ ...base, tab: 'a' }, () => { throw new Error('Ref e9 is gone'); });
    await expect(hub.call('a', 'click', {}, 1000)).rejects.toThrow('Ref e9 is gone');
  });

  it('fails pending calls when the tab reloads, and keeps the tab until it returns', async () => {
    const { hub, page } = harness();
    const p = page({ ...base, tab: 'a' }, () => new Promise(() => {}));
    const pending = hub.call('a', 'click', {}, 5000);
    p.close();
    await expect(pending).rejects.toThrow(/reloaded or closed/);
    expect(hub.tabs()).toEqual([expect.objectContaining({ tab: 'a', connected: false })]);
    const back = hub.waitFor('a', (h) => h.load === 'l2', 1000);
    page({ ...base, tab: 'a', load: 'l2', view: 'project' }, () => null);
    await expect(back).resolves.toMatchObject({ view: 'project' });
    expect(hub.pick().connected).toBe(true);
  });

  it('times out a call the page never answers', async () => {
    const { hub, page } = harness();
    page({ ...base, tab: 'a' }, () => new Promise(() => {}));
    await expect(hub.call('a', 'screen', {}, 20)).rejects.toThrow(/did not answer "screen"/);
  });
});

describe('tools', () => {
  const catalog = () => [
    { slug: 'meshology-l1-holster', title: 'Meshology L1 Holster', description: 'A TPU holster', devOnly: true, parts: [{ file: 'holster.stl' }] },
    { slug: 'fan-mount', title: 'Fan mount', previews: [{ file: 'plate-1.3mf', label: 'Plate 1', plate: true }] },
  ];

  function tools(hub: TabHub, openUrl: (url: string) => Promise<void> = async () => {}) {
    const list = createBridgeTools({ hub, appUrl: () => 'http://localhost:5173/3d-gallery/', catalog, openUrl, timeouts: { reload: 500 } });
    return (name: string) => list.find((t) => t.name === name)!;
  }

  it('lists and filters models without a tab', async () => {
    const tool = tools(new TabHub());
    const all = await tool('models_list').run({});
    expect(all.text).toContain('meshology-l1-holster — Meshology L1 Holster (dev)');
    expect(all.text).toContain('fan-mount — Fan mount · 1 plate(s)');
    const some = await tool('models_list').run({ find: 'holster' });
    expect((some.data as { models: unknown[] }).models).toHaveLength(1);
  });

  it('suggests a near slug for a model it cannot find', async () => {
    await expect(tools(new TabHub())('model_get').run({ slug: 'meshology' })).rejects.toThrow(/meshology-l1-holster/);
  });

  it('formats the screen with the dialogs a click answered', async () => {
    const { hub, page } = harness();
    page({ ...base, tab: 'a' }, (call) => ({
      view: 'printers', url: '/3d-gallery/printers/', title: 'Printers', snapshot: '- button "Print" [e4]',
      dialogs: [{ kind: 'confirm', message: 'Start 01-x.gcode? Check the bed is clear.', answered: call.args['confirm'] }],
    }));
    const out = await tools(hub)('ui_click').run({ ref: 'e4' });
    expect(out.text).toContain('! confirm: "Start 01-x.gcode? Check the bed is clear." → answered false');
    expect(out.text).toContain('- button "Print" [e4]');
  });

  it('follows a click that navigated, and shows the page it landed on', async () => {
    const { hub, page } = harness();
    const first = page({ ...base, tab: 'a' }, (call) => {
      if (call.op === 'click') {
        queueMicrotask(() => {
          first.close();
          page({ ...base, tab: 'a', load: 'l2', view: 'project' }, () => ({ view: 'project', url: '/3d-gallery/project/?id=p1', title: 'Project', snapshot: '# Project' }));
        });
        return new Promise(() => {});
      }
      return null;
    });
    const out = await tools(hub)('ui_click').run({ ref: 'e1' });
    expect(out.text).toContain('[project] Project');
    expect(out.text).toContain('note: The page navigated to /3d-gallery/project/?id=p1.');
  });

  it('waits for the reload after a view switch before reading the screen', async () => {
    const { hub, page } = harness();
    const first = page({ ...base, tab: 'a' }, (call) => {
      if (call.op !== 'navigate') return null;
      setTimeout(() => {
        first.close();
        page({ ...base, tab: 'a', load: 'l2', view: 'printers' }, () => ({ view: 'printers', url: '/3d-gallery/printers/', title: 'Printers', snapshot: '# Printers' }));
      }, 10);
      return { reloads: true };
    });
    const out = await tools(hub)('ui_navigate').run({ view: 'printers' });
    expect(out.text).toContain('[printers] Printers');
  });

  it('opens a new tab on the origin the person already uses', async () => {
    const { hub, page } = harness();
    page({ ...base, tab: 'a', origin: 'http://127.0.0.1:5191' }, () => null);
    const opened: string[] = [];
    await tools(hub, async (url) => {
      opened.push(url);
      setTimeout(() => page({ ...base, tab: 'b' }, () => null), 10);
    })('ui_open').run({ path: 'printers/' });
    expect(opened).toEqual(['http://127.0.0.1:5191/3d-gallery/printers/']);
  });

  it('opens the browser and returns the new tab', async () => {
    const { hub, page } = harness();
    const opened: string[] = [];
    const out = await tools(hub, async (url) => {
      opened.push(url);
      setTimeout(() => page({ ...base, tab: 'fresh' }, () => null), 10);
    })('ui_open').run({ path: '/printers/' });
    expect(opened).toEqual(['http://localhost:5173/3d-gallery/printers/']);
    expect(out.data).toMatchObject({ tab: 'fresh' });
  });

  it('marks only the printer-reaching tools destructive', () => {
    const list = createBridgeTools({ hub: new TabHub(), appUrl: () => '', catalog, openUrl: async () => {} });
    expect(list.filter((t) => t.destructive).map((t) => t.name).sort()).toEqual(['app_action', 'ui_hold']);
    for (const name of ['ui_tabs', 'ui_screen', 'app_state', 'models_list', 'model_get', 'ui_capture']) {
      expect(list.find((t) => t.name === name)!.readOnly).toBe(true);
    }
  });
});

describe('across a reload', () => {
  it('waits for a tab that is between pages, then asks it', async () => {
    const listeners = new Map<string, (data: any, client: HotClient) => void>();
    const hub = attachHub({ on: (event, fn) => listeners.set(event, fn) });
    const closers: Array<() => void> = [];
    const client = (answer: unknown): HotClient => {
      const c: HotClient = {
        send: (_e, data) => queueMicrotask(() => listeners.get('agent:reply')!({ id: (data as TabCall).id, tab: 'a', ok: true, result: answer }, c)),
        socket: { on: (_e, fn) => closers.push(fn) },
      };
      return c;
    };
    listeners.get('agent:hello')!({ ...base, tab: 'a', load: 'l1' }, client({ old: true }));
    closers.forEach((fn) => fn());
    const list = createBridgeTools({ hub, appUrl: () => '', catalog: () => [], openUrl: async () => {}, timeouts: { reload: 1000 } });
    const pending = list.find((t) => t.name === 'app_state')!.run({});
    setTimeout(() => listeners.get('agent:hello')!({ ...base, tab: 'a', load: 'l2', view: 'printers' }, client({ view: 'printers' })), 20);
    await expect(pending).resolves.toMatchObject({ data: { view: 'printers' } });
  });
});
