// SPDX-License-Identifier: MIT
// A plate's cached artifact keys follow the model's source, so its old slices
// go stale when the geometry changes.
import { describe, expect, it } from 'vitest';
import { setPlateArtifactClient, withCurrentKeys } from '../../src/print/plate-resolve';
import { plateSignature, type Plate } from '../../src/print/plate-store';

const plate = (key: string) => ({
  id: 'p1', projectId: 'pr1', name: 'Plate 1',
  items: [{ id: 'i1', slug: 'holster', target: 'holster', format: 'stl', label: 'Holster', modelTitle: 'Holster', key, qty: 1 }],
}) as unknown as Plate;

describe('withCurrentKeys', () => {
  it('re-keys an item whose source moved, changing the plate signature', async () => {
    setPlateArtifactClient({ keyFor: async () => 'new-key' } as never);
    const before = plate('old-key');
    const after = await withCurrentKeys(before);
    expect(after?.items[0]?.key).toBe('new-key');
    expect(plateSignature(after!)).not.toBe(plateSignature(before));
  });

  it('returns null when every key is current', async () => {
    setPlateArtifactClient({ keyFor: async () => 'same' } as never);
    expect(await withCurrentKeys(plate('same'))).toBeNull();
  });
});
