// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, decodeValue, encodeValue, parseBackup } from '../../src/print/backup.js';

describe('backup encoding', () => {
  it('round-trips the values the stores hold through JSON', async () => {
    const photo = new Blob([new Uint8Array([0xff, 0xd8, 0x00, 0x7f])], { type: 'image/jpeg' });
    const record = {
      id: 'p1',
      name: 'Plate 1',
      qty: 2,
      skip: false,
      items: [{ id: 'i1', key: 'abc' }],
      at: new Date(1_790_000_000_000),
      photo,
      bytes: new Uint8Array([1, 2, 3]),
      gone: undefined,
    };
    const json = JSON.parse(JSON.stringify(await encodeValue(record)));
    const back = decodeValue(json) as typeof record;

    expect(back.id).toBe('p1');
    expect(back.items).toEqual([{ id: 'i1', key: 'abc' }]);
    expect(back.at).toBeInstanceOf(Date);
    expect(back.at.getTime()).toBe(1_790_000_000_000);
    expect(back.photo).toBeInstanceOf(Blob);
    expect(back.photo.type).toBe('image/jpeg');
    expect([...new Uint8Array(await back.photo.arrayBuffer())]).toEqual([0xff, 0xd8, 0x00, 0x7f]);
    expect([...back.bytes]).toEqual([1, 2, 3]);
    expect('gone' in back).toBe(false);
  });

  it('keeps a large blob intact across chunk boundaries', async () => {
    const big = new Uint8Array(200_000).map((_, i) => i % 251);
    const back = decodeValue(JSON.parse(JSON.stringify(await encodeValue(new Blob([big]))))) as Blob;
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(big);
  });
});

describe('parseBackup', () => {
  const file = { format: BACKUP_FORMAT, version: 1, exportedAt: 0, origin: 'x', databases: {}, localStorage: {} };

  it('accepts a backup file', () => {
    expect(parseBackup(JSON.stringify(file)).format).toBe(BACKUP_FORMAT);
  });

  it('refuses something else, or a newer format', () => {
    expect(() => parseBackup('{"presets":[]}')).toThrow(/Not a 3d-gallery backup/);
    expect(() => parseBackup(JSON.stringify({ ...file, version: 99 }))).toThrow(/version 99/);
  });
});
