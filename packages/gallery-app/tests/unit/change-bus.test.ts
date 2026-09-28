// SPDX-License-Identifier: MIT
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChangeBus, type ChangeBus } from '../../src/print/change-bus.js';

/** Two buses on one channel name stand in for two tabs. */
function tabs(name: string): [ChangeBus, ChangeBus] {
  return [createChangeBus(name), createChangeBus(name)];
}

const open: ChangeBus[] = [];
afterEach(() => { for (const bus of open.splice(0)) bus.close(); });

describe('change bus', () => {
  it('tells this tab at once and the other tab by message', async () => {
    const [a, b] = tabs('t1');
    open.push(a, b);
    const inA = vi.fn();
    const inB = vi.fn();
    a.subscribe('plates', inA);
    b.subscribe('plates', inB);

    a.publish({ store: 'plates', key: 'p1' });
    expect(inA).toHaveBeenCalledWith('p1', false);
    await vi.waitFor(() => expect(inB).toHaveBeenCalledWith('p1', true));
    expect(inA).toHaveBeenCalledTimes(1);
  });

  it('only wakes subscribers of the store written', async () => {
    const [a, b] = tabs('t2');
    open.push(a, b);
    const plates = vi.fn();
    const dispatch = vi.fn();
    b.subscribe('plates', plates);
    b.subscribe('dispatch', dispatch);

    a.publish({ store: 'dispatch', key: 'p1' });
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith('p1', true));
    expect(plates).not.toHaveBeenCalled();
  });

  it('stops calling a listener once unsubscribed', async () => {
    const [a, b] = tabs('t3');
    open.push(a, b);
    const gone = vi.fn();
    const kept = vi.fn();
    b.subscribe('operator', gone)();
    b.subscribe('operator', kept);

    a.publish({ store: 'operator', key: 'p1' });
    await vi.waitFor(() => expect(kept).toHaveBeenCalled());
    expect(gone).not.toHaveBeenCalled();
  });

  it('keeps separate channel names apart', async () => {
    const a = createChangeBus('t4a');
    const b = createChangeBus('t4b');
    const c = createChangeBus('t4a');
    open.push(a, b, c);
    const inB = vi.fn();
    const inC = vi.fn();
    b.subscribe('presets', inB);
    c.subscribe('presets', inC);

    a.publish({ store: 'presets', key: 'printer' });
    await vi.waitFor(() => expect(inC).toHaveBeenCalledWith('printer', true));
    expect(inB).not.toHaveBeenCalled();
  });
});
