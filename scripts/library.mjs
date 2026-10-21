// SPDX-License-Identifier: MIT
// The library: printable files made somewhere else (Printables, …), kept with
// where they came from, their licence and every version imported.
//
// library/<slug>/item.json      provenance + versions (written by import-library.mjs)
// library/<slug>/README.md      the description, then our own notes
// library/<slug>/<version>/*    the files of that version, byte for byte as downloaded
//
// The Library page reads one index built from these (`buildIndex`), served at
// `library-files/index.json` with the files under `library-files/<slug>/<version>/`.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const LIBRARY_DIR = resolve(import.meta.dirname, '..', 'library');
/** Where the page finds the index and the files, under the site base. */
export const LIBRARY_URL_DIR = 'library-files';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_RE = /^[0-9A-Za-z][0-9A-Za-z._-]*$/;
const FILE_RE = /^[^/\\]+\.(stl|3mf|step|stp|obj)$/i;

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function fail(slug, msg) {
  throw new Error(`library/${slug}: ${msg}`);
}

/** Reads and checks one item. Throws on anything the page would trip over. */
export function readItem(dir, slug) {
  if (!SLUG_RE.test(slug)) fail(slug, 'directory name is not a slug');
  const itemDir = join(dir, slug);
  const item = JSON.parse(readFileSync(join(itemDir, 'item.json'), 'utf8'));
  if (item.slug !== slug) fail(slug, `item.json slug is "${item.slug}"`);
  for (const key of ['title', 'summary']) {
    if (typeof item[key] !== 'string' || !item[key]) fail(slug, `item.json needs a ${key}`);
  }
  if (!item.source?.url || !/^https:\/\//.test(item.source.url)) fail(slug, 'source.url must be an https link');
  if (!item.license?.id) fail(slug, 'license.id is missing');
  if (!Array.isArray(item.versions) || item.versions.length === 0) fail(slug, 'no versions');
  const ids = new Set();
  for (const v of item.versions) {
    if (!VERSION_RE.test(v.id ?? '')) fail(slug, `bad version id "${v.id}"`);
    if (ids.has(v.id)) fail(slug, `version ${v.id} listed twice`);
    ids.add(v.id);
    if (!Array.isArray(v.files) || v.files.length === 0) fail(slug, `version ${v.id} has no files`);
    for (const f of v.files) {
      if (!FILE_RE.test(f.file ?? '')) fail(slug, `version ${v.id}: bad file name "${f.file}"`);
      const path = join(itemDir, v.id, f.file);
      if (!existsSync(path)) fail(slug, `version ${v.id}: ${f.file} is missing`);
      if (sha256(readFileSync(path)) !== f.sha256) fail(slug, `version ${v.id}: ${f.file} doesn't match its sha256`);
    }
  }
  const readmePath = join(itemDir, 'README.md');
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
  return { item, readme };
}

export function listSlugs(dir = LIBRARY_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .sort();
}

/** What the page fetches: every item with its README, newest version first. */
export function buildIndex(dir = LIBRARY_DIR) {
  return {
    items: listSlugs(dir).map((slug) => {
      const { item, readme } = readItem(dir, slug);
      return { ...item, versions: [...item.versions].reverse(), readme };
    }),
  };
}

/** Every served file: its path under `library-files/` and where it lives on disk. */
export function servedFiles(dir = LIBRARY_DIR) {
  const out = [];
  for (const slug of listSlugs(dir)) {
    const { item } = readItem(dir, slug);
    for (const v of item.versions) {
      for (const f of v.files) out.push({ path: `${slug}/${v.id}/${f.file}`, abs: join(dir, slug, v.id, f.file) });
    }
  }
  return out;
}
