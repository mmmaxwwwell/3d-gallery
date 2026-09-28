// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { LEGACY_ROUTES, legacyTarget } from '../../src/home/legacy-routes.js';
import { PRINT_ROUTE_PARAMS } from '../../src/print/mount.js';

describe('legacy routes', () => {
  it('leaves Home alone when the query names no old route', () => {
    expect(legacyTarget('')).toBeNull();
    expect(legacyTarget('?utm_source=mastodon')).toBeNull();
  });

  it('forwards a model link to the gallery with its whole query', () => {
    expect(legacyTarget('?model=cube&build=4x&part=lid&width=40')).toBe(
      'gallery/?model=cube&build=4x&part=lid&width=40',
    );
  });

  it.each([
    ['?projects=1', 'gallery/?projects=1'],
    ['?project=p1', 'gallery/?project=p1'],
    ['?plate=pl1', 'gallery/?plate=pl1'],
    ['?dispatch=p1', 'gallery/?dispatch=p1'],
    ['?operator=p1', 'operator/?id=p1'],
    ['?settings=1', 'gallery/?settings=1'],
    ['?model=cube&plate=pl1', 'gallery/?model=cube&plate=pl1'],
  ])('forwards %s', (search, target) => {
    expect(legacyTarget(search)).toBe(target);
  });

  it('has a row for every panel route the gallery ever answered', () => {
    const params = LEGACY_ROUTES.map((r) => r.param);
    for (const name of [...PRINT_ROUTE_PARAMS, 'model']) expect(params).toContain(name);
  });
});
