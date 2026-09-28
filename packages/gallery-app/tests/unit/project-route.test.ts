// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { projectRoutePath, readProjectRoute, type ProjectRoute } from '../../src/project/route.js';

const PAGE = '/3d-gallery/project/';

describe('project page routes', () => {
  it.each<[string, ProjectRoute]>([
    ['', { view: 'projects' }],
    ['?id=p1', { view: 'project', projectId: 'p1' }],
    ['?id=p1&plate=pl1', { view: 'plate', projectId: 'p1', plateId: 'pl1' }],
    ['?plate=pl1', { view: 'find-plate', plateId: 'pl1' }],
  ])('reads %s', (search, route) => {
    expect(readProjectRoute(search)).toEqual(route);
  });

  it('writes each route back to the URL it was read from', () => {
    for (const search of ['', '?id=p1', '?id=p1&plate=pl1', '?plate=pl1']) {
      expect(projectRoutePath(readProjectRoute(search), PAGE)).toBe(PAGE + search);
    }
  });

  it('escapes ids', () => {
    const path = projectRoutePath({ view: 'project', projectId: 'a b&c' }, PAGE);
    expect(readProjectRoute(new URL(path, 'http://x').search)).toEqual({ view: 'project', projectId: 'a b&c' });
  });
});
