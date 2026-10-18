// SPDX-License-Identifier: MIT
// The bridge's remote transport (src/agent/remote.ts): PKCE, the SSE parser,
// and the relay link against a fake runner, as claude-runner's
// docs/assistant-protocol.md §2 describes it.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('sessionStorage', new MemoryStorage());
});
afterEach(() => vi.unstubAllGlobals());

const remote = () => import('../../src/agent/remote');

/** An unsigned JWT with an exp an hour out: only its payload is read in the browser. */
const jwt = (sub: string) => `h.${Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.s`;
const TOK2 = jwt('max');

const hello = () => ({
  tab: 'tq1', view: 'printers', origin: 'http://localhost:5173', url: '/3d-gallery/printers/', title: 'Printers',
  visible: true, focused: true, load: 'l1',
});

function signIn(expiresInMs = 3_600_000) {
  localStorage.setItem('3dg:agent:remote', JSON.stringify({
    config: { runner: 'https://runner.test', idm: 'https://idm.test', clientId: 'gallery' },
    tokens: { access: 'tok-1', refresh: 'ref-1', expires: Date.now() + expiresInMs },
    connected: true,
  }));
}

/** A fake runner: one call stream that sends `calls`, and records every POST. */
function fakeRunner(calls: Array<{ id: string; op: string; args: object }>) {
  const posts: Array<{ url: string; auth: string | null; body: any }> = [];
  const streams: string[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const auth = new Headers(init.headers).get('authorization');
    if (url.startsWith('https://idm.test/oauth2/token')) {
      return new Response(JSON.stringify({ access_token: 'opaque', id_token: TOK2, refresh_token: 'ref-2' }), { status: 200 });
    }
    if (init.method === 'POST') {
      posts.push({ url, auth, body: JSON.parse(String(init.body)) });
      return new Response('{"ok":true}', { status: 200 });
    }
    streams.push(`${url} ${auth}`);
    if (streams.length > 1) return new Promise<Response>(() => {}); // later reconnects hang open
    const body = calls.map((c) => `id: 1\nevent: call\ndata: ${JSON.stringify(c)}\n\n`).join('') + ': ping\n\n';
    return new Response(new ReadableStream({
      start(ctl) {
        // Split mid-frame, as a network would.
        const bytes = new TextEncoder().encode(body);
        ctl.enqueue(bytes.slice(0, 17));
        ctl.enqueue(bytes.slice(17));
        ctl.close();
      },
    }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  });
  return { fetchFn, posts, streams };
}

describe('remote', () => {
  it('computes the S256 challenge as base64url(SHA-256(verifier)), unpadded', async () => {
    const { challengeFor, pkcePair } = await remote();
    const { createHash } = await import('node:crypto');
    const verifier = 'dBjftJeZ4CVP-mJ92K9cHR8bRkvA_n7Q-QeqDXuH3-7k';
    expect(await challengeFor(verifier)).toBe(createHash('sha256').update(verifier).digest('base64url'));
    const pair = await pkcePair();
    expect(pair.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pair.challenge).toBe(createHash('sha256').update(pair.verifier).digest('base64url'));
  });

  it('parses SSE frames split across chunks, skipping comments', async () => {
    const { sseParser } = await remote();
    const got: Array<[string, string]> = [];
    const feed = sseParser((t, d) => got.push([t, d]));
    feed('id: 1\nevent: ca');
    feed('ll\ndata: {"a":1}\n\n: ping\n\n');
    feed('data: x\r\n\r\n');
    expect(got).toEqual([['call', '{"a":1}'], ['message', 'x']]);
  });

  it('is off until signed in and connected', async () => {
    const { remoteWanted } = await remote();
    expect(remoteWanted()).toBe(false);
    signIn();
    expect(remoteWanted()).toBe(true);
  });

  it('opens the call stream with the token, answers each call, and posts the reply', async () => {
    signIn();
    const { connectRelay } = await remote();
    const runner = fakeRunner([{ id: '7', op: 'screen', args: {} }, { id: '8', op: 'click', args: { ref: 'zz1' } }]);
    const handle = vi.fn(async (call: { op: string }) => {
      if (call.op === 'click') throw new Error('Ref zz1 is gone');
      return { snapshot: '# Printers' };
    });
    const link = connectRelay(hello, handle as never, { fetch: runner.fetchFn as never });
    await vi.waitFor(() => expect(runner.posts.length).toBe(2));
    link.stop();
    expect(runner.streams[0]).toMatch(/^https:\/\/runner\.test\/api\/relay\/tabs\/tq1\/calls\?view=printers.*focused=true Bearer tok-1$/);
    const replies = runner.posts.map((p) => p.body).sort((a, b) => a.id.localeCompare(b.id));
    expect(replies).toEqual([
      { type: 'reply', id: '7', tab: 'tq1', ok: true, result: { snapshot: '# Printers' } },
      { type: 'reply', id: '8', tab: 'tq1', ok: false, error: 'Ref zz1 is gone' },
    ]);
    expect(runner.posts.every((p) => p.url === 'https://runner.test/api/relay/tabs/tq1' && p.auth === 'Bearer tok-1')).toBe(true);
  });

  it('refreshes a token about to expire before connecting', async () => {
    signIn(10_000);
    const { connectRelay } = await remote();
    const runner = fakeRunner([]);
    const link = connectRelay(hello, (async () => null) as never, { fetch: runner.fetchFn as never });
    await vi.waitFor(() => expect(runner.streams.length).toBeGreaterThan(0));
    link.stop();
    expect(runner.streams[0].endsWith(`Bearer ${TOK2}`)).toBe(true);
    const stored = JSON.parse(localStorage.getItem('3dg:agent:remote')!).tokens;
    expect(stored).toMatchObject({ access: TOK2, refresh: 'ref-2' });
    expect(stored.expires).toBeGreaterThan(Date.now() + 3_500_000);
  });

  it('stops for good when signed out', async () => {
    const { connectRelay } = await remote();
    const runner = fakeRunner([]);
    const states: string[] = [];
    connectRelay(hello, (async () => null) as never, { fetch: runner.fetchFn as never, onState: (s) => states.push(s) });
    await vi.waitFor(() => expect(states).toContain('signed-out'));
    expect(runner.fetchFn).not.toHaveBeenCalled();
  });
});

describe('printers.status', () => {
  it('names a Bambu print_error as its HMS code', async () => {
    const { hmsCode } = await import('../../src/agent/shared-actions');
    expect(hmsCode('83918908')).toBe('0500-803C');
    expect(hmsCode('0')).toBeNull();
    expect(hmsCode('Printing layer 3')).toBeNull();
  });
});
