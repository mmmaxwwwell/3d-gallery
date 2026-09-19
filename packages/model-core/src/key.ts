import { canonicalParamsJson } from './canonical.ts';
import { KeyMismatchError } from './errors.ts';
import { sha256Bytes, toHex } from './sha256.ts';
import type { ArtifactFormat, RenderRequest, ScadParam } from './types.ts';

/**
 * Key schema version. Every artifact key is prefixed with it, so bumping this
 * invalidates every cached artifact everywhere at once — including the copies
 * sitting in browsers' IndexedDB. Bump it when the key inputs change meaning,
 * or when the renderer starts producing different bytes for inputs that hash
 * the same (the pipeline is not in the key). Not when a model changes —
 * content hashing already covers that.
 *
 * /2: the multicolour 3MF writer stopped gamma-encoding OpenSCAD's already-sRGB
 * colour channels, so every stored .3mf carried washed-out mid-tones.
 */
export const KEY_SCHEMA = '3dg-artifact/2';

const NUL = '\0';

export interface ArtifactKeyInput extends RenderRequest {
  /** sha256 of the include-inlined SCAD source. Computed by the Node side only. */
  sourceDigest: string;
  /** Parsed `BEGIN_PARAMS` schema, used to canonicalize `params`. */
  schema: readonly ScadParam[];
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  // WebCrypto is unavailable outside a secure context — plain HTTP on a LAN or
  // tailscale IP. The fallback must produce the *same* digest, not merely some
  // digest, because these keys address a cache the server also writes.
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
  }
  return toHex(sha256Bytes(bytes));
}

/**
 * The preimage of an artifact key. Exported for debugging a key mismatch —
 * diffing two preimages tells you which input diverged, which a hash can't.
 */
export function artifactKeyPreimage(input: ArtifactKeyInput): string {
  return [
    KEY_SCHEMA,
    input.slug,
    input.target,
    input.format,
    input.sourceDigest,
    canonicalParamsJson(input.params, input.schema),
  ].join(NUL);
}

/**
 * Content address for one rendered artifact.
 *
 * Deliberately excludes the render engine, its version, and its CLI flags —
 * those live in the cache sidecar instead. Putting them in the address would
 * mean a natively-built artifact misses on a WASM-only machine and every
 * toolchain bump cold-starts the whole cache, which defeats the point of
 * sharing a cache between build time and request time.
 */
export function artifactKey(input: ArtifactKeyInput): Promise<string> {
  return sha256Hex(artifactKeyPreimage(input));
}

export { sha256Hex };

/** `/a/<key>.<format>` — content-addressed, so safe to serve `immutable`. */
export function artifactUrl(key: string, format: ArtifactFormat, base = '/a/'): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${key}.${format}`;
}

// --- render request transport ------------------------------------------------
//
// A key is one-way, so a cache miss can't tell the server what to render. The
// client therefore attaches the request it hashed, and the server recomputes
// the key and refuses anything that doesn't match. On a static host the query
// string is ignored, the file 404s, and the client falls back to rendering in
// the browser.

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeRenderRequest(req: RenderRequest): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(req)));
}

export function decodeRenderRequest(encoded: string): RenderRequest {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as RenderRequest;
}

/** Throws unless `req` + `sourceDigest` + `schema` hash to `key`. */
export async function assertRequestMatchesKey(
  key: string,
  input: ArtifactKeyInput,
): Promise<void> {
  const actual = await artifactKey(input);
  if (actual !== key) throw new KeyMismatchError(key, actual);
}
