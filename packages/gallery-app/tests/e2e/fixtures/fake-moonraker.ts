// SPDX-License-Identifier: MIT
//
// Puts a MoonrakerSim behind a Playwright route, so a page's fetches to a
// printer address reach the simulator instead of the network. Route a page for
// one tab, or a BrowserContext when several pages must see the same printer.
// The sim's clock only moves when a test calls `sim.tick(seconds)`.

import type { BrowserContext, Page, Route } from '@playwright/test';
import { MoonrakerSim, type SimOptions } from '../../fixtures/moonraker-sim.ts';

export { MoonrakerSim } from '../../fixtures/moonraker-sim.ts';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': '*',
};

export interface FakeMoonrakerOptions extends SimOptions {
  /** The printer's address as a preset stores it (default `http://printer.test:7125`). */
  address?: string;
}

/** Route `address` to a fresh simulator and return it. */
export async function fakeMoonraker(
  target: Page | BrowserContext,
  { address = 'http://printer.test:7125', ...options }: FakeMoonrakerOptions = {},
): Promise<MoonrakerSim> {
  const origin = new URL(address.includes('://') ? address : `http://${address}`).origin;
  const sim = new MoonrakerSim({ name: new URL(origin).hostname, origin, ...options });
  await target.route((url) => url.origin === origin, (route) => serve(sim, route));
  return sim;
}

async function serve(sim: MoonrakerSim, route: Route): Promise<void> {
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS });
    return;
  }
  const url = new URL(request.url());
  const res = sim.handle({
    method: request.method(),
    url: url.pathname + url.search,
    headers: await request.allHeaders(),
    body: request.postDataBuffer() ?? undefined,
  });
  if (res.kind === 'unreachable') {
    await route.abort('connectionrefused');
    return;
  }
  if (res.delayMs) await new Promise((r) => setTimeout(r, res.delayMs));
  await route.fulfill({
    status: res.status,
    contentType: res.contentType,
    headers: CORS,
    body: typeof res.body === 'string' ? res.body : Buffer.from(res.body),
  });
}
