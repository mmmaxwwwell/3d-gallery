// SPDX-License-Identifier: MIT
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../src', import.meta.url));

/**
 * Every class the print UI renders must have a rule somewhere.
 *
 * A stylesheet edit that removes the wrong range is silent: the markup still
 * renders, just unstyled, and only a screenshot catches it. This is the cheap
 * version of that screenshot. Classes listed as known-unstyled are ones that
 * were already decorative-only before this check existed.
 */
const KNOWN_UNSTYLED = new Set([
  'print-settings-export',
  'print-settings-import',
  'print-settings-item-actions',
  'print-settings-new-template-toggle',
  'slice-progress-message',
]);

describe('style coverage', () => {
  it('every print-UI class has a rule', () => {
    const dir = join(ROOT, 'print');
    const used = new Set<string>();
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue;
      const source = readFileSync(join(dir, name), 'utf8');
      for (const m of source.matchAll(/class=[{"`]([^"`}]*)/g)) {
        for (const raw of m[1].split(/[\s${}?:()'"]+/)) {
          const cls = raw.trim();
          if (/^(pd|plate3d|slice|print)-/.test(cls)) used.add(cls);
        }
      }
    }
    expect(used.size).toBeGreaterThan(50);

    const css = readFileSync(join(ROOT, 'style.css'), 'utf8');
    const missing = [...used].filter((c) => !KNOWN_UNSTYLED.has(c) && !css.includes(`.${c}`));
    expect(missing).toEqual([]);
  });
});
