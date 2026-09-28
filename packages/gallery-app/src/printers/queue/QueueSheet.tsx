// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The commands behind every printer's queue, in one sheet: what is queued,
// running or failed (Retry / Cancel / Dismiss), and the log of what they did.
// A bottom sheet on a phone, a centred panel on a wide screen.

import { useEffect, useRef, useState } from 'preact/hooks';
import { mergedLog, openTasks } from './queue-model.js';
import type { QueueEntry } from './queue-watch.js';
import './queue.css';

interface QueueSheetProps {
  entries: QueueEntry[];
  onClose: () => void;
}

function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function QueueSheet({ entries, onClose }: QueueSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<'queue' | 'log'>('queue');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const dispatches = entries.map((e) => e.snap.dispatch);
  const byId = new Map(entries.map((e) => [e.projectId, e]));
  const tasks = openTasks(dispatches);
  const failed = tasks.filter((t) => t.state === 'failed');
  const lines = mergedLog(dispatches);
  const several = entries.length > 1;
  const printerName = (projectId: string, printerId: string) =>
    byId.get(projectId)?.snap.printers.get(printerId)?.name ?? 'Unknown printer';

  const retryAll = () => {
    for (const e of entries) if (e.snap.dispatch.tasks.some((t) => t.state === 'failed')) e.daemon.retryAllFailed();
  };

  return (
    <dialog
      ref={dialog}
      class="pq-sheet"
      aria-label="Queue and log"
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
    >
      <header class="pq-sheet-head">
        <nav class="pq-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'queue'} class={tab === 'queue' ? 'is-on' : ''} onClick={() => setTab('queue')}>
            Queue ({tasks.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === 'log'} class={tab === 'log' ? 'is-on' : ''} onClick={() => setTab('log')}>
            Log ({lines.length})
          </button>
        </nav>
        <button type="button" class="pq-btn pq-sheet-close" aria-label="Close" onClick={() => dialog.current?.close()}>✕</button>
      </header>

      <div class="pq-sheet-body">
        {tab === 'queue' ? (
          <>
            {failed.length > 0 && (
              <button type="button" class="pq-btn" onClick={retryAll}>Retry failed ({failed.length})</button>
            )}
            {tasks.length === 0 ? <p class="pq-muted">Nothing queued.</p> : (
              <ol class="pq-tasks">
                {tasks.map((t) => {
                  const daemon = byId.get(t.projectId)?.daemon;
                  return (
                    <li key={t.id} class={`is-${t.state}`}>
                      <span class="pq-task-state">{t.state}</span>
                      <span>
                        {t.kind === 'upload' ? 'Upload' : 'Start'} <code>{t.file}</code> on <strong>{printerName(t.projectId, t.printerId)}</strong>
                        {several && <span class="pq-muted"> · {byId.get(t.projectId)?.name}</span>}
                        {t.attempts > 1 && <span class="pq-muted"> · try {t.attempts}</span>}
                        {t.error && <span class="pq-error"> — {t.error}</span>}
                      </span>
                      <span class="pq-task-actions">
                        {t.state === 'failed' && <button type="button" class="pq-btn" onClick={() => daemon?.retry(t.id)}>Retry</button>}
                        {(t.state === 'failed' || t.state === 'queued') && (
                          <button type="button" class="pq-btn" onClick={() => daemon?.cancel(t.id)}>{t.state === 'failed' ? 'Dismiss' : 'Cancel'}</button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        ) : (
          <ol class="pq-log">
            {[...lines].reverse().map((e, i) => (
              <li key={i} class={e.level === 'error' ? 'is-error' : ''}>
                <time>{clock(e.at)}</time>
                {e.printerId && <strong>{printerName(e.projectId, e.printerId)}</strong>}
                {several && <span class="pq-muted">{byId.get(e.projectId)?.name}</span>}
                <span>{e.text}</span>
              </li>
            ))}
            {lines.length === 0 && <li class="pq-muted">Nothing yet.</li>}
          </ol>
        )}
      </div>
    </dialog>
  );
}
