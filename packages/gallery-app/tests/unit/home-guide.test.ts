// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { headingId, renderGuide, sectionLead } from '../../src/home/guide.js';
import { VIEWS } from '../../src/shell/views.js';

const GUIDE = readFileSync(new URL('../../../../docs/user-guide.md', import.meta.url), 'utf8');

describe('home guide', () => {
  it('uses GitHub-style heading anchors', () => {
    expect(headingId('Importing from OrcaSlicer')).toBe('importing-from-orcaslicer');
    expect(headingId('A workflow, start to finish')).toBe('a-workflow-start-to-finish');
  });

  it('renders the guide with anchors its own links resolve to', () => {
    const html = renderGuide(GUIDE);
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
      expect(html).toContain(`id="${target}"`);
    }
  });

  // Home's cards take each view's blurb from the guide, so a renamed section
  // would leave a card blank without this.
  it('has a lead paragraph for every view Home links to', () => {
    for (const view of VIEWS.filter((v) => v.id !== 'home')) {
      expect(sectionLead(GUIDE, view.label), view.label).toBeTruthy();
    }
  });
});
