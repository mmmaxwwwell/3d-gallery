// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { VIEWS, viewById, viewHref } from '../../src/shell/views.js';
import { lastOpen, lastOpenKey, recordLastOpen } from '../../src/shell/last-open.js';

const BASE = '/3d-gallery/';

/** Just enough of `Storage` for last-open; the unit env has no localStorage. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('view registry', () => {
  it('names the five views in bar order', () => {
    expect(VIEWS.map((v) => v.id)).toEqual(['home', 'models', 'project', 'printers', 'operator']);
  });

  it('gives every view its own path, and none under the artifact space', () => {
    const paths = VIEWS.map((v) => v.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path.startsWith('models/')).toBe(false);
    expect(viewById('models').path).toBe('gallery/');
  });

  it('sends a tab with no history to its front page', () => {
    expect(viewHref('printers', null, BASE)).toBe('/3d-gallery/printers/');
    expect(viewHref('home', null, BASE)).toBe('/3d-gallery/');
  });

  it('sends a tab back to the URL last seen in its view', () => {
    expect(viewHref('project', '/3d-gallery/project/?id=p1', BASE)).toBe('/3d-gallery/project/?id=p1');
    expect(viewHref('models', '/3d-gallery/gallery/?model=cube&part=lid', BASE)).toBe(
      '/3d-gallery/gallery/?model=cube&part=lid',
    );
  });

  it("won't let a remembered URL take a tab to another view", () => {
    expect(viewHref('operator', '/3d-gallery/project/?id=p1', BASE)).toBe('/3d-gallery/operator/');
    expect(viewHref('models', 'https://elsewhere.example/', BASE)).toBe('/3d-gallery/gallery/');
  });

  it('always opens Home at its front page', () => {
    expect(viewHref('home', '/3d-gallery/?anything=1', BASE)).toBe('/3d-gallery/');
  });
});

describe('last open', () => {
  it('remembers one URL per view', () => {
    const storage = memoryStorage();
    recordLastOpen('project', '/3d-gallery/project/?id=a', storage);
    recordLastOpen('operator', '/3d-gallery/operator/?id=b', storage);
    recordLastOpen('project', '/3d-gallery/project/?id=c', storage);
    expect(lastOpen('project', storage)).toBe('/3d-gallery/project/?id=c');
    expect(lastOpen('operator', storage)).toBe('/3d-gallery/operator/?id=b');
    expect(lastOpen('printers', storage)).toBeNull();
    expect(storage.getItem(lastOpenKey('project'))).toBe('/3d-gallery/project/?id=c');
  });

  it('shrugs off storage that throws', () => {
    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => recordLastOpen('models', '/3d-gallery/gallery/', broken)).not.toThrow();
    expect(lastOpen('models', broken)).toBeNull();
  });
});
