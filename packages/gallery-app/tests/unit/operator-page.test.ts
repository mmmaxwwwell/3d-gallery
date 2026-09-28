// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { pickProject } from '../../src/operator/pick-project.js';
import { operatorUrl, projectUrl } from '../../src/shell/views.js';

describe('which project the Operator page opens', () => {
  const planned = new Set(['last', 'active', 'newest']);
  const hasPlan = (id: string) => planned.has(id);

  it('reopens the runbook last open', () => {
    expect(pickProject({
      lastOperatorUrl: '/3d-gallery/operator/?id=last', activeProjectId: 'active', latestPlanned: 'newest', hasPlan,
    })).toBe('last');
  });

  it('falls back to the project open in Project, then to the one planned last', () => {
    expect(pickProject({ lastOperatorUrl: '/3d-gallery/operator/', activeProjectId: 'active', latestPlanned: 'newest', hasPlan }))
      .toBe('active');
    expect(pickProject({ lastOperatorUrl: null, activeProjectId: 'unplanned', latestPlanned: 'newest', hasPlan }))
      .toBe('newest');
  });

  it('skips a remembered project whose plan is gone', () => {
    expect(pickProject({ lastOperatorUrl: '/3d-gallery/operator/?id=gone', activeProjectId: null, latestPlanned: 'newest', hasPlan }))
      .toBe('newest');
  });

  it('opens nothing when no project has a plan', () => {
    expect(pickProject({ lastOperatorUrl: null, activeProjectId: 'unplanned', latestPlanned: null, hasPlan })).toBeNull();
  });
});

describe('runbook and project links', () => {
  it('address a project by id under the base', () => {
    expect(operatorUrl('a b', '/3d-gallery/')).toBe('/3d-gallery/operator/?id=a%20b');
    expect(projectUrl('p1', '/3d-gallery/')).toBe('/3d-gallery/project/?id=p1');
  });
});
