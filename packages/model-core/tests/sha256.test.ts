import { describe, it, expect } from 'vitest';
import { sha256Bytes, toHex } from '../src/sha256.ts';
import { artifactKey } from '../src/key.ts';
import type { ScadParam } from '../src/types.ts';

async function webcrypto(text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))));
}

function pure(text: string): string {
  return toHex(sha256Bytes(new TextEncoder().encode(text)));
}

describe('sha256Bytes', () => {
  it('matches the published digest for the empty string', () => {
    expect(pure('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches the published digest for "abc"', () => {
    expect(pure('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  // Anything that disagrees with WebCrypto would silently give insecure-context
  // clients their own private cache that the server never populates.
  it.each([
    ['empty', ''],
    ['short', 'a'],
    ['55 bytes — one below the padding boundary', 'x'.repeat(55)],
    ['56 bytes — forces a second block', 'x'.repeat(56)],
    ['63 bytes', 'x'.repeat(63)],
    ['64 bytes — exactly one block', 'x'.repeat(64)],
    ['65 bytes', 'x'.repeat(65)],
    ['long', 'y'.repeat(5000)],
    ['unicode', 'café — 日本語 🐕'],
    ['nulls, as used in the key preimage', 'a\0b\0c'],
  ])('agrees with WebCrypto: %s', async (_name, input) => {
    expect(pure(input)).toBe(await webcrypto(input));
  });
});

describe('artifactKey without a secure context', () => {
  const schema: ScadParam[] = [{ name: 'width', type: 'number', default: 40, help: '' }];
  const input = {
    slug: 'collar-tag', target: 'multicolor', format: '3mf' as const,
    sourceDigest: 'a'.repeat(64), schema, params: { width: 41 },
  };

  it('produces the same key with and without crypto.subtle', async () => {
    const secure = await artifactKey(input);

    const real = globalThis.crypto;
    // Simulate an insecure context, where `crypto.subtle` is undefined.
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...real, subtle: undefined }, configurable: true, writable: true,
    });
    try {
      expect(await artifactKey(input)).toBe(secure);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: real, configurable: true, writable: true });
    }
  });
});
