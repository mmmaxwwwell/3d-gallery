// SPDX-License-Identifier: MIT
// Imports a model from Printables into library/<slug>/, or re-imports it.
//
//   node scripts/import-library.mjs https://www.printables.com/model/411201-molle-stick [--slug molle-stick]
//
// The first import writes item.json, README.md (the model's description) and
// the files under library/<slug>/<version>/. A re-import refreshes the
// provenance in item.json and adds a new version only when the files changed;
// README.md is ours after the first import and is left alone.

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIBRARY_DIR, readItem, sha256 } from './library.mjs';

const API = 'https://api.printables.com/graphql/';

// Everything here is republished on the gallery's public site, so a licence
// that forbids sharing the files (Printables' "Standard Digital File License")
// can't come in.
const SHAREABLE = /^(CC|GNU|GPL|LGPL|BSD|MIT|Public Domain)/i;

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Printables API: HTTP ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`Printables API: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data;
}

const PRINT_QUERY = `query($id: ID!) { print(id: $id) {
  id name slug summary description datePublished firstPublish
  license { name abbreviation }
  user { publicUsername handle }
  tags { name } category { name }
  stls { id name fileSize created }
} }`;

const LINK_MUTATION = `mutation($id: ID!, $printId: ID!) {
  getDownloadLink(id: $id, printId: $printId, fileType: stl, source: model_detail) {
    ok errors { field messages } output { link }
  }
}`;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s) {
  return s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/**
 * Printables' description HTML as Markdown. Only text, emphasis, lists,
 * headings and https links survive; images, embeds and markup are dropped, so
 * the page never loads anything from the source site.
 */
export function htmlToMarkdown(html) {
  let s = html.replace(/\r?\n/g, ' ');
  s = s.replace(/<(script|style|iframe)[^>]*>.*?<\/\1>/gis, '');
  s = s.replace(/<a\s[^>]*href="(https:\/\/[^"]+)"[^>]*>(.*?)<\/a>/gis, (_, href, text) => `[${text}](${href})`);
  s = s.replace(/<h([1-4])[^>]*>(.*?)<\/h\1>/gis, (_, n, text) => `\n\n${'#'.repeat(Math.min(+n + 1, 4))} ${text}\n\n`);
  s = s.replace(/<(strong|b)>(.*?)<\/\1>/gis, (_, _t, text) => (text.trim() ? `**${text.trim()}**` : ''));
  s = s.replace(/<(em|i)>(.*?)<\/\1>/gis, (_, _t, text) => (text.trim() ? `*${text.trim()}*` : ''));
  s = s.replace(/<li[^>]*>/gi, '\n- ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|ul|ol|div)>/gi, '\n\n');
  s = decode(s.replace(/<[^>]+>/g, ''));
  return s
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseArgs(argv) {
  const args = { url: null, slug: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug') args.slug = argv[++i];
    else args.url = argv[i];
  }
  const m = args.url?.match(/printables\.com\/(?:[a-z]{2}\/)?model\/(\d+)(?:-([a-z0-9-]+))?/);
  if (!m) throw new Error('usage: node scripts/import-library.mjs <printables model URL> [--slug <slug>]');
  return { id: m[1], slug: args.slug ?? m[2] ?? `printables-${m[1]}` };
}

async function download(fileId, printId) {
  const data = await gql(LINK_MUTATION, { id: fileId, printId });
  const out = data.getDownloadLink;
  if (!out?.ok || !out.output?.link) throw new Error(`no download link for file ${fileId}: ${JSON.stringify(out?.errors)}`);
  const res = await fetch(out.output.link);
  if (!res.ok) throw new Error(`download ${out.output.link}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const day = (iso) => iso.slice(0, 10);

/** A new version's id: the day its newest file appeared upstream, made unique. */
function versionId(files, taken) {
  const base = files.map((f) => day(f.sourceDate)).sort().at(-1);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

function sameFiles(a, b) {
  const key = (fs) => fs.map((f) => `${f.file}:${f.sha256}`).sort().join('\n');
  return key(a) === key(b);
}

async function main() {
  const { id, slug } = parseArgs(process.argv.slice(2));
  const { print } = await gql(PRINT_QUERY, { id });
  if (!print) throw new Error(`Printables has no model ${id}`);
  const license = { name: print.license?.name ?? 'unknown', id: print.license?.abbreviation ?? 'unknown' };
  if (!SHAREABLE.test(license.id)) {
    throw new Error(`${print.name} is licensed "${license.name}", which doesn't allow republishing its files.`);
  }
  if (!print.stls?.length) throw new Error(`${print.name} has no STL files`);

  const itemDir = join(LIBRARY_DIR, slug);
  const existing = existsSync(join(itemDir, 'item.json')) ? readItem(LIBRARY_DIR, slug).item : null;

  const files = [];
  for (const stl of print.stls) {
    const bytes = await download(stl.id, id);
    files.push({ file: stl.name, bytes, sha256: sha256(bytes), size: bytes.length, sourceId: stl.id, sourceDate: stl.created });
  }
  const record = files.map(({ bytes, ...f }) => f);

  const versions = existing?.versions ?? [];
  const latest = versions.at(-1);
  const today = new Date().toISOString().slice(0, 10);
  if (!latest || !sameFiles(latest.files, record)) {
    const vid = versionId(record, new Set(versions.map((v) => v.id)));
    mkdirSync(join(itemDir, vid), { recursive: true });
    for (const f of files) writeFileSync(join(itemDir, vid, f.file), f.bytes);
    versions.push({ id: vid, imported: today, files: record });
    console.log(`${slug}: new version ${vid} (${record.length} files)`);
  } else {
    console.log(`${slug}: files unchanged since ${latest.id}`);
  }

  const item = {
    slug,
    title: print.name,
    summary: print.summary || print.name,
    source: { site: 'Printables', url: `https://www.printables.com/model/${id}-${print.slug}`, id },
    author: { name: print.user.publicUsername, url: `https://www.printables.com/@${print.user.handle}` },
    license,
    tags: print.tags.map((t) => t.name),
    category: print.category?.name ?? null,
    published: print.firstPublish ?? print.datePublished,
    checked: today,
    versions,
  };
  mkdirSync(itemDir, { recursive: true });
  writeFileSync(join(itemDir, 'item.json'), JSON.stringify(item, null, 2) + '\n');

  const readmePath = join(itemDir, 'README.md');
  if (!existsSync(readmePath)) {
    const by = `By [${item.author.name}](${item.author.url}) on [Printables](${item.source.url}), ${license.name} (${license.id}).`;
    writeFileSync(readmePath, `# ${item.title}\n\n${by}\n\n${htmlToMarkdown(print.description ?? '')}\n`);
  }
  readItem(LIBRARY_DIR, slug);
  console.log(`${slug}: ${join(itemDir, 'item.json')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
