// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Library: printable files from elsewhere, searchable, each with where it
// came from, its licence, every version imported, and a 3D view of each file.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createViewer, type Viewer } from '@3d-gallery/viewer/viewer';
import { fileUrl, loadLibrary, searchLibrary, type LibraryItem, type LibraryIndex } from './library.js';
import { renderReadme } from './markdown.js';
import { registerAgentView } from '../agent/registry.js';

interface Route {
  item: string | null;
  version: string | null;
  file: string | null;
  q: string;
}

function readRoute(): Route {
  const p = new URLSearchParams(location.search);
  return { item: p.get('item'), version: p.get('v'), file: p.get('file'), q: p.get('q') ?? '' };
}

function writeRoute(r: Route, push: boolean): void {
  const p = new URLSearchParams();
  if (r.item) p.set('item', r.item);
  if (r.version) p.set('v', r.version);
  if (r.file) p.set('file', r.file);
  if (r.q) p.set('q', r.q);
  const url = `${location.pathname}${p.size ? `?${p}` : ''}`;
  if (url === location.pathname + location.search) return;
  if (push) history.pushState(null, '', url);
  else history.replaceState(null, '', url);
}

const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} kB`);

function ModelView({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | string>('loading');

  useEffect(() => {
    viewer.current = createViewer(host.current!);
    return () => viewer.current?.dispose();
  }, []);

  useEffect(() => {
    let live = true;
    setState('loading');
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (!live) return;
        viewer.current?.load(buf, url.toLowerCase().endsWith('.3mf') ? '3mf' : 'stl');
        setState('ready');
      })
      .catch((e: Error) => live && setState(`Couldn't load this file: ${e.message}`));
    return () => {
      live = false;
    };
  }, [url]);

  return (
    <div class="lib-viewer" data-state={state === 'loading' || state === 'ready' ? state : 'error'}>
      <div class="lib-viewer-canvas" ref={host} />
      {state === 'loading' && <p class="lib-viewer-note">Loading…</p>}
      {state !== 'loading' && state !== 'ready' && <p class="lib-viewer-note" role="alert">{state}</p>}
    </div>
  );
}

function Detail({ item, route, go }: { item: LibraryItem; route: Route; go: (r: Partial<Route>) => void }) {
  const version = item.versions.find((v) => v.id === route.version) ?? item.versions[0];
  const file = version.files.find((f) => f.file === route.file) ?? version.files[0];
  const readme = useMemo(() => renderReadme(item.readme.replace(/^# .*\n+/, '')), [item]);
  const latest = version === item.versions[0];

  return (
    <article class="lib-detail" aria-labelledby="lib-title">
      <header class="lib-detail-head">
        <button type="button" class="lib-back" onClick={() => go({ item: null, version: null, file: null })}>
          ← All
        </button>
        <h2 id="lib-title">{item.title}</h2>
        <p class="lib-summary">{item.summary}</p>
      </header>

      <ModelView url={fileUrl(item, version, file)} />

      <section class="lib-files" aria-label="Files">
        <div class="lib-files-head">
          <label>
            Version{' '}
            <select
              value={version.id}
              onChange={(e) => go({ version: (e.target as HTMLSelectElement).value, file: route.file })}
            >
              {item.versions.map((v, i) => (
                <option value={v.id} key={v.id}>
                  {v.id}
                  {i === 0 ? ' (latest)' : ''}
                </option>
              ))}
            </select>
          </label>
          <span class="lib-muted">
            imported {version.imported}
            {!latest && ' · not the latest'}
          </span>
        </div>
        {version.note && <p class="lib-muted">{version.note}</p>}
        <ul class="lib-file-list">
          {version.files.map((f) => (
            <li key={f.file} class={f === file ? 'is-current' : ''}>
              <button type="button" class="lib-file-pick" aria-pressed={f === file} onClick={() => go({ file: f.file })}>
                {f.file}
              </button>
              <span class="lib-muted">{kb(f.size)}</span>
              <a class="lib-download" href={fileUrl(item, version, f)} download={f.file} aria-label={`Download ${f.file}`}>
                ⬇
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section class="lib-source" aria-label="Source">
        <dl>
          <dt>From</dt>
          <dd>
            <a href={item.source.url} target="_blank" rel="noopener noreferrer">
              {item.source.site}
            </a>
          </dd>
          {item.author && (
            <>
              <dt>By</dt>
              <dd>
                {item.author.url ? (
                  <a href={item.author.url} target="_blank" rel="noopener noreferrer">
                    {item.author.name}
                  </a>
                ) : (
                  item.author.name
                )}
              </dd>
            </>
          )}
          <dt>Licence</dt>
          <dd title={item.license.name}>{item.license.id}</dd>
          {item.checked && (
            <>
              <dt>Checked</dt>
              <dd>{item.checked}</dd>
            </>
          )}
        </dl>
        {item.tags && item.tags.length > 0 && (
          <ul class="lib-tags" aria-label="Tags">
            {item.tags.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => go({ item: null, version: null, file: null, q: t })}>
                  {t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="lib-readme" dangerouslySetInnerHTML={{ __html: readme }} />
    </article>
  );
}

export function LibraryPage() {
  const [index, setIndex] = useState<LibraryIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    loadLibrary().then(setIndex, (e: Error) => setError(e.message));
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: Partial<Route>, push = true) => {
    const r = { ...route, ...next };
    if (next.item !== undefined && next.item !== route.item) {
      r.version = next.version ?? null;
      r.file = next.file ?? null;
    }
    setRoute(r);
    writeRoute(r, push);
  };

  const items = index?.items ?? [];
  const hits = useMemo(() => searchLibrary(items, route.q), [items, route.q]);
  const open = items.find((i) => i.slug === route.item) ?? null;

  useEffect(() => {
    registerAgentView({
      state: () => ({
        query: route.q,
        results: hits.map((i) => i.slug),
        open: open && { slug: open.slug, version: route.version ?? open.versions[0].id, file: route.file },
        items: items.map((i) => ({ slug: i.slug, title: i.title, license: i.license.id, source: i.source.url, versions: i.versions.map((v) => v.id) })),
      }),
      actions: {
        search: {
          description: 'Search the library (title, tags, author, licence, file names, README).',
          args: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
          run: ({ query }) => {
            go({ q: String(query), item: null }, false);
            return searchLibrary(items, String(query)).map((i) => i.slug);
          },
        },
        open: {
          description: 'Open a library item, optionally at a version and file.',
          args: {
            type: 'object',
            properties: { slug: { type: 'string' }, version: { type: 'string' }, file: { type: 'string' } },
            required: ['slug'],
          },
          run: ({ slug, version, file }) => {
            if (!items.some((i) => i.slug === slug)) throw new Error(`No library item "${slug}".`);
            go({ item: String(slug), version: (version as string) ?? null, file: (file as string) ?? null });
            return { opened: slug };
          },
        },
      },
    });
  });

  if (error) return <p class="lib-empty" role="alert">{error}</p>;
  if (!index) return <p class="lib-empty">Loading the library…</p>;

  return (
    <div class={`lib-page${open ? ' has-open' : ''}`}>
      <aside class="lib-list-pane">
        <h1>Library</h1>
        <input
          type="search"
          class="lib-search"
          placeholder="Search title, tag, author, file…"
          aria-label="Search the library"
          value={route.q}
          onInput={(e) => go({ q: (e.target as HTMLInputElement).value }, false)}
        />
        <p class="lib-muted lib-count" aria-live="polite">
          {route.q ? `${hits.length} of ${items.length}` : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        </p>
        <ul class="lib-list">
          {hits.map((i) => (
            <li key={i.slug}>
              <a
                class={`lib-item${i === open ? ' is-open' : ''}`}
                href={`?item=${encodeURIComponent(i.slug)}`}
                data-slug={i.slug}
                onClick={(e) => {
                  e.preventDefault();
                  go({ item: i.slug });
                }}
              >
                <span class="lib-item-title">{i.title}</span>
                <span class="lib-muted">
                  {i.author?.name ? `${i.author.name} · ` : ''}
                  {i.license.id} · {i.versions[0].files.length} {i.versions[0].files.length === 1 ? 'file' : 'files'}
                </span>
              </a>
            </li>
          ))}
        </ul>
        {hits.length === 0 && <p class="lib-muted">Nothing matches “{route.q}”.</p>}
      </aside>
      <main class="lib-main">
        {open ? (
          <Detail item={open} route={route} go={go} />
        ) : (
          <p class="lib-empty">
            Pick something from the list. Each item keeps where it came from, its licence and every version imported.
          </p>
        )}
      </main>
    </div>
  );
}
