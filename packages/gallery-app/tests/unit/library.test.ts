// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { searchLibrary, type LibraryItem } from '../../src/library/library.js';
import { renderReadme } from '../../src/library/markdown.js';

function item(slug: string, over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    slug,
    title: slug,
    summary: '',
    source: { site: 'Printables', url: 'https://example.test' },
    license: { name: 'CC-BY', id: 'CC-BY' },
    versions: [{ id: 'v1', imported: '2026-10-21', files: [{ file: `${slug}.stl`, sha256: '', size: 1 }] }],
    readme: '',
    ...over,
  };
}

describe('searchLibrary', () => {
  const items = [
    item('molle-stick', { title: 'Molle stick', tags: ['ifak'], author: { name: 'BigFootPL' } }),
    item('hook', { title: 'Wall hook', readme: 'Holds a molle pouch on the wall' }),
    item('clip', { title: 'Cable clip' }),
  ];

  it('keeps everything, by title, for an empty query', () => {
    expect(searchLibrary(items, '  ').map((i) => i.slug)).toEqual(['clip', 'molle-stick', 'hook']);
  });

  it('puts a title match ahead of a README match', () => {
    expect(searchLibrary(items, 'MOLLE').map((i) => i.slug)).toEqual(['molle-stick', 'hook']);
  });

  it('needs every word somewhere', () => {
    expect(searchLibrary(items, 'molle bigfoot').map((i) => i.slug)).toEqual(['molle-stick']);
    expect(searchLibrary(items, 'molle clip')).toEqual([]);
  });

  it('matches tags and file names', () => {
    expect(searchLibrary(items, 'ifak').map((i) => i.slug)).toEqual(['molle-stick']);
    expect(searchLibrary(items, 'clip.stl').map((i) => i.slug)).toEqual(['clip']);
  });
});

describe('renderReadme', () => {
  it('shows raw HTML as text', () => {
    const html = renderReadme('Hi <img src=x onerror="alert(1)"> there\n\n<script>alert(2)</script>');
    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain('&lt;img');
  });

  it('links only https, and never loads images', () => {
    const html = renderReadme('[a](https://ok.test) [b](javascript:alert(1)) ![pic](https://img.test/p.png)');
    expect(html).toContain('<a href="https://ok.test" target="_blank" rel="noopener noreferrer">a</a>');
    expect(html).not.toContain('javascript:');
    expect(html).not.toMatch(/<img/);
    expect(html).toContain('[pic]');
  });
});
