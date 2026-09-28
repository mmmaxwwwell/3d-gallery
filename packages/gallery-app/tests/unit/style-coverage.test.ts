// SPDX-License-Identifier: MIT
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../src', import.meta.url));

/**
 * Every class a view renders must have a rule somewhere.
 *
 * A stylesheet edit that removes the wrong range is silent: the markup still
 * renders, just unstyled, and only a screenshot catches it. This is the cheap
 * version of that screenshot. Classes listed as known-unstyled are ones that
 * were already decorative-only before this check existed.
 */
const KNOWN_UNSTYLED = new Set([
  'planner-trips',
  'print-settings-export',
  'print-settings-import',
  'print-settings-item-actions',
  'print-settings-new-template-toggle',
  'project-row-open',
  'slice-progress-message',
]);

/**
 * Each directory that renders markup, with the class prefix that marks its
 * own classes (anything else it renders is a state word or a shared class).
 * A new view directory must be added here, which the last test enforces.
 */
const RENDERERS: Record<string, RegExp> = {
  print: /^(pd|plate3d|slice|print)-/,
  project: /^(pd|plate3d|slice|print|planner|project|plates?|gantt|gcode)-/,
  settings: /^print-(settings|preset)(-|$)/,
  shell: /^shell-/,
  home: /^home(-|$)/,
  printers: /^(printers|pc)(-|$)/,
  operator: /^op(-|$)/,
};

function classesUsed(dir: string, prefix: RegExp): Set<string> {
  const used = new Set<string>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue;
    const source = readFileSync(join(dir, name), 'utf8');
    for (const m of source.matchAll(/class=[{"`]([^"`}]*)/g)) {
      for (const raw of m[1].split(/[\s${}?:()'"]+/)) {
        const cls = raw.trim();
        if (prefix.test(cls)) used.add(cls);
      }
    }
  }
  return used;
}

/** Every stylesheet the app ships: the gallery's, plus one beside each view. */
function allCss(): string {
  const sheets = [readFileSync(join(ROOT, 'style.css'), 'utf8')];
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const name of readdirSync(join(ROOT, entry.name))) {
      if (name.endsWith('.css')) sheets.push(readFileSync(join(ROOT, entry.name, name), 'utf8'));
    }
  }
  return sheets.join('\n');
}

describe('style coverage', () => {
  const css = allCss();

  for (const dir of Object.keys(RENDERERS)) {
    it(`every ${dir} class has a rule`, () => {
      const used = classesUsed(join(ROOT, dir), RENDERERS[dir]);
      expect(used.size).toBeGreaterThan(0);
      const missing = [...used].filter((c) => !KNOWN_UNSTYLED.has(c) && !new RegExp(`\\.${c}(?![\\w-])`).test(css));
      expect(missing).toEqual([]);
    });
  }

  it('covers every directory that renders markup', () => {
    const rendering = readdirSync(ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && readdirSync(join(ROOT, e.name)).some((n) => n.endsWith('.tsx')))
      .map((e) => e.name);
    expect(rendering.filter((d) => !(d in RENDERERS))).toEqual([]);
  });
});
