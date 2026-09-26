// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { OperatorBlock, Schedule } from '@3d-gallery/print-toolkit';
import type { PrintPreset } from './print-storage.js';
import type { Plate } from './plate-store.js';
import { plateMaterial } from './planner-model.js';

const HOUR = 3600_000;
const TICK_STEPS = [1, 2, 3, 6, 12, 24].map((h) => h * HOUR);

interface GanttProps {
  plan: Schedule;
  now: number;
  printers: PrintPreset[];
  plates: Map<string, Plate>;
  numbers: Map<string, number>;
  unavailable: OperatorBlock[];
  collisions: Set<string>;
  /** Plate id under the pointer, in the list or here. */
  hovered: string | null;
  onHover: (plateId: string | null) => void;
}

/** One row per printer the plan uses, bars in plate number order. */
export function PlannerGantt({ plan, now, printers, plates, numbers, unavailable, collisions, hovered, onHover }: GanttProps) {
  const end = Math.max(plan.collect, plan.finish) + HOUR / 2;
  const span = end - now;
  const pct = (t: number) => `${(Math.min(Math.max(t, now), end) - now) / span * 100}%`;
  const width = (a: number, b: number) => `${(Math.min(b, end) - Math.max(a, now)) / span * 100}%`;
  const step = TICK_STEPS.find((s) => span / s <= 10) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: number[] = [];
  for (let t = Math.ceil(now / step) * step; t < end; t += step) ticks.push(t);
  const rows = printers.filter((p) => plan.jobs.some((j) => j.printerId === p.id));
  const blocks = unavailable.filter((b) => b.end > now && b.start < end);

  return (
    <div class="gantt" role="img" aria-label="Print timeline by printer">
      <div class="gantt-axis">
        <div class="gantt-label" />
        <div class="gantt-track">
          {ticks.map((t) => (
            <span key={t} class="gantt-tick" style={{ left: pct(t) }}>
              {new Date(t).getHours() === 0 || step >= 24 * HOUR
                ? new Date(t).toLocaleDateString([], { weekday: 'short' })
                : new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ))}
          {plan.visits.map((v, i) => (
            <span key={i} class="gantt-visit-flag" style={{ left: pct(v.at) }} title={`Trip ${i + 1}`}>{i + 1}</span>
          ))}
        </div>
      </div>
      {rows.map((printer) => (
        <div key={printer.id} class="gantt-row">
          <div class="gantt-label" title={printer.name}>{printer.name}</div>
          <div class="gantt-track">
            {blocks.map((b, i) => (
              <div key={i} class="gantt-away" style={{ left: pct(b.start), width: width(b.start, b.end) }} />
            ))}
            {plan.visits.map((v, i) => <div key={i} class="gantt-visit" style={{ left: pct(v.at) }} />)}
            {plan.jobs.filter((j) => j.printerId === printer.id).map((j) => {
              const plate = plates.get(j.jobId);
              const family = plate ? plateMaterial(plate) : 'PETG';
              const classes = [
                'gantt-bar',
                `is-${family.toLowerCase()}`,
                j.swapFrom ? 'has-swap' : '',
                collisions.has(j.jobId) ? 'is-collision' : '',
                hovered === j.jobId ? 'is-hovered' : '',
              ].filter(Boolean).join(' ');
              return (
                <div
                  key={j.jobId}
                  class={classes}
                  style={{ left: pct(j.start), width: width(j.start, j.end) }}
                  title={`#${numbers.get(j.jobId)} ${plate?.name} — ${new Date(j.start).toLocaleString()} → ${new Date(j.end).toLocaleString()}`}
                  onMouseEnter={() => onHover(j.jobId)}
                  onMouseLeave={() => onHover(null)}
                >
                  <span>#{numbers.get(j.jobId)} {plate?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
