// SPDX-License-Identifier: MIT
/**
 * The bridge's remote transport: this tab dials out to claude-runner's relay
 * (runner.<domain>/api/relay, behind carme's kanidm edge) so the person's
 * assistant agent can drive it from anywhere. The contract is claude-runner
 * docs/assistant-protocol.md §2.
 *
 * Off until the person signs in with kanidm and presses Connect. Kanidm only
 * redirects to https or localhost, so this works from http://localhost:5173
 * and the published https site, not from a LAN or tailnet address (owner,
 * 2026-10-17).
 */

import type { TabCall, TabHello, TabReply } from '@3d-gallery/agent-bridge/protocol';

const STORE = '3dg:agent:remote';
const PENDING = '3dg:agent:remote-pkce';

export interface RemoteConfig {
  /** claude-runner's web origin. */
  runner: string;
  /** kanidm's origin. */
  idm: string;
  /** The kanidm public client. */
  clientId: string;
}

export const DEFAULT_CONFIG: RemoteConfig = {
  runner: 'https://runner.a110c8.net',
  idm: 'https://idm.a110c8.net',
  clientId: 'gallery',
};

interface Tokens {
  /**
   * The OIDC ID token: carme's oauth2-proxy checks a bearer as an ID token of a
   * kanidm client it trusts (homelab modules/runner-portal), as for runner-cli.
   */
  access: string;
  refresh: string | null;
  /** ms since epoch. */
  expires: number;
}

interface Stored {
  config: RemoteConfig;
  tokens: Tokens | null;
  /** The person pressed Connect; a page load reconnects on its own. */
  connected: boolean;
}

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function write(s: Stored | null): void {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s));
    else localStorage.removeItem(STORE);
  } catch {
    // No storage: the connection lasts this page only.
  }
}

export function remoteState(): { signedIn: boolean; connected: boolean; config: RemoteConfig } {
  const s = read();
  return { signedIn: !!s?.tokens, connected: !!s?.connected, config: s?.config ?? DEFAULT_CONFIG };
}

/** Whether the shell should start the bridge for the remote relay on this page. */
export function remoteWanted(): boolean {
  const s = read();
  return !!s?.tokens && !!s.connected;
}

/** Connect again after Disconnect, while still signed in. */
export function reconnectRemote(): void {
  const s = read();
  if (s?.tokens) write({ ...s, connected: true });
}

export function disconnectRemote(): void {
  const s = read();
  if (s) write({ ...s, connected: false });
}

export function signOutRemote(): void {
  write(null);
}

// ── kanidm sign-in (OAuth 2.0 auth code + PKCE, public client) ──────────

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** RFC 7636 S256: base64url(SHA-256(verifier)). */
export async function challengeFor(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}

export async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return { verifier, challenge: await challengeFor(verifier) };
}

/** Where kanidm sends the browser back: the Settings page, which finishes sign-in. */
export function redirectUri(): string {
  return `${location.origin}${import.meta.env.BASE_URL}settings/`;
}

/** Sends the browser to kanidm. Settings calls `completeSignIn` when it comes back. */
export async function startSignIn(config: RemoteConfig = DEFAULT_CONFIG): Promise<void> {
  const { verifier, challenge } = await pkcePair();
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem(PENDING, JSON.stringify({ verifier, state, config }));
  const url = new URL(`${config.idm}/ui/oauth2`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri());
  // groups: the edge admits the bearer only for members of runner.<domain>'s gate groups.
  url.searchParams.set('scope', 'openid profile groups');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  location.assign(url.toString());
}

async function tokenRequest(config: RemoteConfig, form: Record<string, string>, f: typeof fetch = fetch): Promise<Tokens> {
  const res = await f(`${config.idm}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, ...form }),
  });
  if (!res.ok) throw new Error(`kanidm refused the sign-in (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { id_token?: string; refresh_token?: string };
  if (!body.id_token) throw new Error('kanidm sent no ID token; is the client asked for "openid"?');
  return { access: body.id_token, refresh: body.refresh_token ?? null, expires: jwtExpiry(body.id_token) };
}

/** A JWT's exp, ms since epoch; now when it can't be read (so it's refreshed at once). */
function jwtExpiry(jwt: string): number {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return Date.now();
  }
}

/**
 * On the Settings page: if kanidm just sent the browser back with a code,
 * trade it for tokens and connect. Returns true when it did.
 */
export async function completeSignIn(): Promise<boolean> {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const raw = sessionStorage.getItem(PENDING);
  if (!code || !raw) return false;
  sessionStorage.removeItem(PENDING);
  const pending = JSON.parse(raw) as { verifier: string; state: string; config: RemoteConfig };
  // Leave the code out of the address bar and history either way.
  history.replaceState(null, '', location.pathname);
  if (params.get('state') !== pending.state) throw new Error('The sign-in reply did not match this browser\'s request.');
  const tokens = await tokenRequest(pending.config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: pending.verifier,
  });
  write({ config: pending.config, tokens, connected: true });
  return true;
}

/** A current access token, refreshed when it's about to run out. Null once signed out. */
export async function accessToken(f: typeof fetch = fetch): Promise<string | null> {
  const s = read();
  if (!s?.tokens) return null;
  if (s.tokens.expires - Date.now() > 30_000) return s.tokens.access;
  if (!s.tokens.refresh) {
    write({ ...s, tokens: null });
    return null;
  }
  try {
    const tokens = await tokenRequest(s.config, { grant_type: 'refresh_token', refresh_token: s.tokens.refresh }, f);
    write({ ...s, tokens: { ...tokens, refresh: tokens.refresh ?? s.tokens.refresh } });
    return tokens.access;
  } catch {
    write({ ...s, tokens: null });
    return null;
  }
}

// ── the relay connection ────────────────────────────────────────────────

/** Splits an SSE byte stream into events. Tolerates frames split across chunks. */
export function sseParser(onEvent: (type: string, data: string) => void): (chunk: string) => void {
  let buf = '';
  return (chunk) => {
    buf += chunk.replace(/\r\n/g, '\n');
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let type = 'message';
      const data: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'event') type = value;
        else if (field === 'data') data.push(value);
      }
      if (data.length) onEvent(type, data.join('\n'));
    }
  };
}

export interface RelayLink {
  hello(h: TabHello): void;
  stop(): void;
}

/**
 * Keeps this tab's call stream open, answers each call with `handle`, and
 * reconnects with backoff. Stops for good when the person is signed out.
 */
export function connectRelay(
  hello: () => TabHello,
  handle: (call: TabCall) => Promise<unknown>,
  opts: { fetch?: typeof fetch; config?: RemoteConfig; onState?: (s: 'connecting' | 'connected' | 'retrying' | 'signed-out') => void } = {},
): RelayLink {
  const f = opts.fetch ?? fetch.bind(globalThis);
  const config = opts.config ?? remoteState().config;
  let stopped = false;
  let controller: AbortController | null = null;
  let delay = 1000;

  const post = async (tab: string, body: unknown) => {
    const token = await accessToken(f);
    if (!token) return;
    await f(`${config.runner}/api/relay/tabs/${encodeURIComponent(tab)}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  };

  async function run() {
    while (!stopped) {
      const token = await accessToken(f);
      if (!token) {
        opts.onState?.('signed-out');
        return;
      }
      const h = hello();
      const q = new URLSearchParams({
        view: h.view, url: h.url, title: h.title, origin: h.origin, load: h.load,
        visible: String(h.visible), focused: String(h.focused),
      });
      controller = new AbortController();
      opts.onState?.('connecting');
      try {
        const res = await f(`${config.runner}/api/relay/tabs/${encodeURIComponent(h.tab)}/calls?${q}`, {
          headers: { authorization: `Bearer ${token}`, accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`relay answered ${res.status}`);
        opts.onState?.('connected');
        delay = 1000;
        const feed = sseParser((type, data) => {
          if (type !== 'call') return;
          const call = { ...(JSON.parse(data) as Omit<TabCall, 'tab'>), tab: h.tab } as TabCall;
          void handle(call).then(
            (result): TabReply => ({ id: call.id, tab: h.tab, ok: true, result }),
            (err: unknown): TabReply => ({ id: call.id, tab: h.tab, ok: false, error: err instanceof Error ? err.message : String(err) }),
          ).then((reply) => post(h.tab, { type: 'reply', ...reply }));
        });
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          feed(value);
        }
      } catch {
        // Dropped, refused or unreachable: try again shortly.
      }
      if (stopped) return;
      opts.onState?.('retrying');
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 30_000);
    }
  }
  void run();

  return {
    hello(h) {
      void post(h.tab, { type: 'hello', ...h });
    },
    stop() {
      stopped = true;
      controller?.abort();
    },
  };
}
