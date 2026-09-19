import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function sources(): { file: string; text: string }[] {
  return readdirSync(SRC)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({ file: f, text: readFileSync(join(SRC, f), 'utf8') }));
}

// This package is imported by the browser bundle *and* by Node. Anything
// platform-specific here would either break the bundle or silently diverge
// between the two sides, which is exactly what the shared key computation
// cannot tolerate.
describe('the public surface stays isomorphic', () => {
  it('imports no Node builtins', () => {
    const offenders = sources()
      .filter(({ text }) => /from\s+['"](node:|fs|path|crypto|url)['"]/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('references no Node-only globals', () => {
    const offenders = sources()
      .filter(({ text }) => /\b(process\.|Buffer\.|__dirname|__filename|require\()/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('references no DOM-only globals, so it runs headless too', () => {
    const offenders = sources()
      .filter(({ text }) => /\b(document\.|window\.|localStorage|navigator\.)/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('has no non-relative imports, so it stays dependency-free', () => {
    const offenders = sources()
      .flatMap(({ file, text }) =>
        [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)]
          .filter((m) => !m[1].startsWith('.'))
          .map((m) => `${file} -> ${m[1]}`));
    expect(offenders).toEqual([]);
  });
});
