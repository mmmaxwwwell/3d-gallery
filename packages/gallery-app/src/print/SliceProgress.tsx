// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The busy overlay for slicing, uploading and starting a print.
//
// It exists because the progress bar it replaces lived at the bottom of a
// scrollable dialog: during a slice the user saw a sticky footer reading
// "Slicing…" and nothing else, which is indistinguishable from a hang. This
// sits above the dialog, so there is always something on screen that is
// visibly still moving — and, while the slicer is running, a way out.

import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export interface SliceProgressProps {
  title: string;
  /** 0..1. Values at or below 0 render an indeterminate bar. */
  pct: number;
  message: string;
  /** Absent when the step cannot be interrupted (upload, print start). */
  onCancel?: () => void;
  cancelling?: boolean;
  /** Shown under the bar so a long slice still looks alive. */
  startedAt: number;
}

function elapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

export function SliceProgress({
  title,
  pct,
  message,
  onCancel,
  cancelling,
  startedAt,
}: SliceProgressProps): JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // OrcaSlicer reports stage names long before it reports a number, so a
  // determinate bar parked at 0% would read as stuck. Below 1% we admit we
  // don't know and animate instead.
  const known = pct > 0.01;
  const clamped = Math.max(0, Math.min(100, pct * 100));

  return (
    <div class="slice-progress-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div class="slice-progress">
        <h4 class="slice-progress-title">{title}</h4>
        <div class={`slice-progress-bar${known ? '' : ' is-indeterminate'}`}>
          <div
            class="slice-progress-fill"
            style={known ? { width: `${clamped}%` } : undefined}
          />
        </div>
        <div class="slice-progress-meta">
          <span class="slice-progress-message">{message || 'Working…'}</span>
          <span class="slice-progress-elapsed">
            {known ? `${Math.round(clamped)}% · ` : ''}{elapsed(now - startedAt)}
          </span>
        </div>
        {onCancel ? (
          <button
            type="button"
            class="btn btn-secondary slice-progress-cancel"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        ) : (
          <p class="slice-progress-note">This step can’t be interrupted.</p>
        )}
      </div>
    </div>
  );
}
