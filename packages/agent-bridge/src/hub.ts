// SPDX-License-Identifier: MIT
/**
 * Keeps track of the gallery tabs connected to the dev server and relays calls
 * to them.
 *
 * Transport-agnostic: the Vite plugin adapts each HMR client to a `TabSocket`,
 * and the tests hand in fakes.
 */

import { EVENT_CALL, type TabHello, type TabReply } from './protocol.ts';

export interface TabSocket {
  send(event: string, data: unknown): void;
}

export interface TabInfo extends TabHello {
  connected: boolean;
  /** ms since epoch of the last hello. */
  seenAt: number;
}

/** No tab could take the call. The message tells the agent what to do about it. */
export class NoTabError extends Error {}

interface Pending {
  tab: string;
  resolve(value: unknown): void;
  reject(err: Error): void;
  timer: ReturnType<typeof setTimeout>;
}

interface Waiter {
  tab: string;
  test(h: TabHello): boolean;
  resolve(h: TabHello): void;
}

/** A tab that went away is forgotten after this long. Switching views reconnects well within it. */
const GONE_AFTER_MS = 60_000;
/** A tab that dropped this recently is probably loading its next page. */
const RELOAD_GRACE_MS = 15_000;

export class TabHub {
  private readonly tabsById = new Map<string, { info: TabInfo; socket: TabSocket | null }>();
  private readonly pending = new Map<string, Pending>();
  private waiters: Waiter[] = [];
  private nextId = 1;

  // A plain field, not a parameter property: Node's type stripping rejects those.
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  hello(h: TabHello, socket: TabSocket): void {
    this.tabsById.set(h.tab, { info: { ...h, connected: true, seenAt: this.now() }, socket });
    this.waiters = this.waiters.filter((w) => {
      if (w.tab !== h.tab || !w.test(h)) return true;
      w.resolve(h);
      return false;
    });
  }

  /** The socket closed: the tab navigated, reloaded or was closed. */
  disconnect(socket: TabSocket): void {
    for (const [id, entry] of this.tabsById) {
      if (entry.socket !== socket) continue;
      entry.socket = null;
      entry.info = { ...entry.info, connected: false };
      for (const [callId, p] of this.pending) {
        if (p.tab !== id) continue;
        clearTimeout(p.timer);
        this.pending.delete(callId);
        p.reject(new Error('The tab reloaded or closed before it answered.'));
      }
    }
  }

  reply(r: TabReply): void {
    const p = this.pending.get(r.id);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(r.id);
    if (r.ok) p.resolve(r.result);
    else p.reject(new Error(r.error));
  }

  tabs(): TabInfo[] {
    const cutoff = this.now() - GONE_AFTER_MS;
    for (const [id, entry] of this.tabsById) {
      if (!entry.info.connected && entry.info.seenAt < cutoff) this.tabsById.delete(id);
    }
    return [...this.tabsById.values()].map((e) => e.info);
  }

  /**
   * The tab to act on: the one named, else the one the person is looking at
   * (focused, then visible, then the last to say hello).
   */
  pick(tab?: string): TabInfo {
    const all = this.tabs();
    if (tab) {
      const found = all.find((t) => t.tab === tab);
      if (!found) throw new NoTabError(`No tab "${tab}". Connected: ${all.map((t) => t.tab).join(', ') || 'none'}.`);
      return found;
    }
    const live = all.filter((t) => t.connected);
    // Mid view switch: the tab's socket is down for a moment. Callers wait for it.
    const reloading = all.filter((t) => !t.connected && t.seenAt > this.now() - RELOAD_GRACE_MS);
    if (!live.length && reloading.length) return reloading.sort((a, b) => b.seenAt - a.seenAt)[0]!;
    if (!live.length) {
      throw new NoTabError(
        'No gallery tab is connected. Call ui_open to open one in the browser, or ask the person '
        + 'to open the dev server (http://localhost:5173/3d-gallery/).',
      );
    }
    const rank = (t: TabInfo) => (t.focused ? 2 : 0) + (t.visible ? 1 : 0);
    return live.sort((a, b) => rank(b) - rank(a) || b.seenAt - a.seenAt)[0]!;
  }

  call(tab: string, op: string, args: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
    const entry = this.tabsById.get(tab);
    if (!entry?.socket) return Promise.reject(new NoTabError(`Tab "${tab}" is not connected.`));
    const id = String(this.nextId++);
    const socket = entry.socket;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`The tab did not answer "${op}" within ${Math.round(timeoutMs / 1000)} s.`));
      }, timeoutMs);
      this.pending.set(id, { tab, resolve, reject, timer });
      socket.send(EVENT_CALL, { id, tab, op, args });
    });
  }

  /**
   * Resolves once the tab is connected and its hello passes `test`, e.g. a new
   * `load` after a navigation. A tab that already came back counts: a fast
   * page can reconnect before the caller starts waiting.
   */
  waitFor(tab: string, test: (h: TabHello) => boolean, timeoutMs: number): Promise<TabHello> {
    const known = this.tabsById.get(tab)?.info;
    if (known?.connected && test(known)) return Promise.resolve(known);
    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        tab,
        test,
        resolve: (h) => {
          clearTimeout(timer);
          resolve(h);
        },
      };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((w) => w !== waiter);
        reject(new Error(`The tab did not come back within ${Math.round(timeoutMs / 1000)} s.`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
}
