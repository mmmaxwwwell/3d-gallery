// SPDX-License-Identifier: MIT
/**
 * The library's index as the page sees it (built by `scripts/library.mjs`),
 * and the search over it.
 */

export interface LibraryFile {
  file: string;
  sha256: string;
  size: number;
  sourceId?: string;
  sourceDate?: string;
}

export interface LibraryVersion {
  id: string;
  imported: string;
  note?: string;
  files: LibraryFile[];
}

export interface LibraryItem {
  slug: string;
  title: string;
  summary: string;
  source: { site: string; url: string; id?: string };
  author?: { name: string; url?: string };
  license: { name: string; id: string };
  tags?: string[];
  category?: string | null;
  published?: string;
  checked?: string;
  /** Newest first. */
  versions: LibraryVersion[];
  readme: string;
}

export interface LibraryIndex {
  items: LibraryItem[];
}

export const LIBRARY_BASE = `${import.meta.env.BASE_URL}library-files/`;

export async function loadLibrary(): Promise<LibraryIndex> {
  const res = await fetch(`${LIBRARY_BASE}index.json`);
  if (!res.ok) throw new Error(`The library index didn't load (HTTP ${res.status}).`);
  return res.json();
}

export function fileUrl(item: LibraryItem, version: LibraryVersion, file: LibraryFile): string {
  return `${LIBRARY_BASE}${item.slug}/${version.id}/${encodeURIComponent(file.file)}`;
}

function fields(item: LibraryItem): { weight: number; text: string }[] {
  return [
    { weight: 8, text: item.title },
    { weight: 4, text: (item.tags ?? []).join(' ') },
    { weight: 3, text: item.summary },
    { weight: 2, text: [item.author?.name, item.source.site, item.license.id, item.category].filter(Boolean).join(' ') },
    { weight: 2, text: item.versions.flatMap((v) => v.files.map((f) => f.file)).join(' ') },
    { weight: 1, text: item.readme },
  ].map((f) => ({ ...f, text: f.text.toLowerCase() }));
}

/**
 * Items holding every word of the query somewhere (title, tags, summary,
 * author, licence, file names, README), best matches first. An empty query
 * keeps them all, in title order.
 */
export function searchLibrary(items: LibraryItem[], query: string): LibraryItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const byTitle = [...items].sort((a, b) => a.title.localeCompare(b.title));
  if (words.length === 0) return byTitle;
  const scored: { item: LibraryItem; score: number }[] = [];
  for (const item of byTitle) {
    const fs = fields(item);
    let score = 0;
    let all = true;
    for (const w of words) {
      const s = fs.reduce((sum, f) => sum + (f.text.includes(w) ? f.weight : 0), 0);
      if (s === 0) {
        all = false;
        break;
      }
      score += s;
    }
    if (all) scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
