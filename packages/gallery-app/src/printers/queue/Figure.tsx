// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// A number over its label, for what a plan asks of a printer or of the fleet.

import { formatDuration } from '../../print/planner-model.js';

export function formatHours(h: number): string {
  return h === 0 ? '0h' : formatDuration(h * 3600);
}

export function Figure({ value, label, title }: { value: string | number; label: string; title?: string }) {
  return (
    <div class="pq-figure" title={title}>
      <span class="pq-figure-value">{value}</span>
      <span class="pq-figure-label">{label}</span>
    </div>
  );
}
