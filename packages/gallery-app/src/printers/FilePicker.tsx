// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { listGcodeFiles, type GcodeFile } from '@3d-gallery/print-toolkit';
import { useEffect, useRef, useState } from 'preact/hooks';

interface FilePickerProps {
  printerName: string;
  address: string;
  onStart: (file: GcodeFile) => void;
  onClose: () => void;
}

export function formatDuration(sec: number): string {
  const min = Math.round(sec / 60);
  const h = Math.floor(min / 60);
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}

function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/**
 * Starts a file already on the printer: pick one (newest first, searchable),
 * then confirm the bed is clear. A start on a dirty bed wrecks the nozzle or
 * the part left on it, so the checkbox is the point, not a formality.
 */
export function FilePicker({ printerName, address, onStart, onClose }: FilePickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<GcodeFile[] | { error: string } | null>(null);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<GcodeFile | null>(null);
  const [bedClear, setBedClear] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    let live = true;
    listGcodeFiles(address).then(
      (list) => { if (live) setFiles(list); },
      (err: unknown) => { if (live) setFiles({ error: err instanceof Error ? err.message : String(err) }); },
    );
    return () => { live = false; };
  }, [address]);

  const needle = query.trim().toLowerCase();
  const shown = Array.isArray(files) ? files.filter((f) => f.path.toLowerCase().includes(needle)) : [];

  return (
    <dialog ref={dialog} class="pc-picker" aria-label={`Print a file on ${printerName}`} onClose={onClose}>
      <header class="pc-picker-head">
        <h3>{picked ? 'Start this print?' : `Print on ${printerName}`}</h3>
        <button type="button" class="pc-picker-close" aria-label="Close" onClick={onClose}>×</button>
      </header>
      {picked ? (
        <div class="pc-picker-confirm">
          {picked.thumbnailUrl && <img class="pc-picker-thumb is-large" src={picked.thumbnailUrl} alt="" />}
          <p class="pc-picker-name">{baseName(picked.path)}</p>
          <p class="pc-picker-meta">
            {picked.estimatedSec ? `About ${formatDuration(picked.estimatedSec)}` : 'No time estimate'}
          </p>
          <label class="pc-picker-check">
            <input type="checkbox" checked={bedClear} onChange={(e) => setBedClear(e.currentTarget.checked)} />
            The bed is clear
          </label>
          <div class="pc-picker-actions">
            <button type="button" class="pc-btn" onClick={() => { setPicked(null); setBedClear(false); }}>Back</button>
            <button type="button" class="pc-btn is-primary" disabled={!bedClear} onClick={() => onStart(picked)}>
              Start print
            </button>
          </div>
        </div>
      ) : (
        <div class="pc-picker-browse">
          <input
            type="search"
            class="pc-picker-search"
            placeholder="Search files"
            aria-label="Search files"
            value={query}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
          {files === null && <p class="pc-picker-empty">Loading files…</p>}
          {files && !Array.isArray(files) && <p class="pc-picker-empty">Couldn't list files: {files.error}</p>}
          {Array.isArray(files) && shown.length === 0 && (
            <p class="pc-picker-empty">{files.length ? 'No file matches.' : 'No files on this printer.'}</p>
          )}
          <ul class="pc-picker-list">
            {shown.map((f) => (
              <li key={f.path}>
                <button type="button" class="pc-picker-file" onClick={() => setPicked(f)}>
                  {f.thumbnailUrl
                    ? <img class="pc-picker-thumb" src={f.thumbnailUrl} alt="" loading="lazy" />
                    : <span class="pc-picker-thumb is-blank" aria-hidden="true" />}
                  <span class="pc-picker-file-text">
                    <span class="pc-picker-name">{baseName(f.path)}</span>
                    <span class="pc-picker-meta">
                      {new Date(f.modified).toLocaleDateString()}
                      {f.estimatedSec ? ` · ${formatDuration(f.estimatedSec)}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  );
}
