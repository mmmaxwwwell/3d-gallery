// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  MOVE_TYPE_COLORS,
  formatDuration,
  parseGCode,
  parseGcodeMetadata,
  parseGcodeStats,
  type BedBounds,
  type GCodeLayer,
  type GcodeMetadata,
  type MoveType,
  type ParsedGCode,
  type PostProcessReport,
} from '@3d-gallery/print-toolkit';

interface GcodePreviewProps {
  gcode: string;
  report?: PostProcessReport | null;
}

// Sensible defaults for the visibility toggles. Travel off by default keeps
// the render readable — travels dominate the segment count on complex parts.
const DEFAULT_VISIBLE: Record<MoveType, boolean> = {
  wall: true,
  'solid-fill': true,
  infill: true,
  support: true,
  travel: false,
  brim: true,
  skirt: true,
  'purge-tower': true,
  shield: true,
  other: true,
};

function formatFilament(mm: number | undefined): string {
  if (!mm || !Number.isFinite(mm)) return '—';
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(0)} mm`;
}

function formatGrams(g: number | undefined): string {
  if (!g || !Number.isFinite(g)) return '—';
  return `${g.toFixed(2)} g`;
}

function formatVolume(cm3: number | undefined): string {
  if (!cm3 || !Number.isFinite(cm3)) return '—';
  return `${cm3.toFixed(2)} cm³`;
}

function formatCost(c: number | undefined): string {
  if (!c || !Number.isFinite(c) || c <= 0) return '—';
  return `$${c.toFixed(2)}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtBounds(b: BedBounds | null): string {
  if (!b) return '—';
  return `X:[${b.minX.toFixed(1)}, ${b.maxX.toFixed(1)}] Y:[${b.minY.toFixed(1)}, ${b.maxY.toFixed(1)}]`;
}

export function GcodePreview({ gcode, report }: GcodePreviewProps) {
  const [parsed, setParsed] = useState<ParsedGCode | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [layerIdx, setLayerIdx] = useState<number>(0);
  const [visible, setVisible] = useState<Record<MoveType, boolean>>(DEFAULT_VISIBLE);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heightStripRef = useRef<HTMLCanvasElement | null>(null);

  const stats = useMemo(() => parseGcodeStats(gcode), [gcode]);
  const metadata: GcodeMetadata = useMemo(() => parseGcodeMetadata(gcode), [gcode]);
  const size = gcode.length;

  // Prefer slicer-embedded values over derived ones — the slicer knew about
  // accel/jerk so its estimate beats what we can reconstruct.
  const printTime = metadata.printTimeSeconds ?? stats.printTime;
  const filamentMm = metadata.filamentMm ?? stats.filamentUsed;

  useEffect(() => {
    let cancelled = false;
    setParsed(null);
    setParseError('');
    setParseProgress(0);
    // Parse on the next tick so the busy indicator has a chance to paint.
    const t = setTimeout(() => {
      try {
        const p = parseGCode(gcode, (pct) => { if (!cancelled) setParseProgress(pct); });
        if (!cancelled) {
          setParsed(p);
          // Land on a mid-height layer for a representative preview.
          setLayerIdx(Math.floor(p.layers.length / 2));
        }
      } catch (err) {
        if (!cancelled) setParseError(err instanceof Error ? err.message : String(err));
      }
    }, 20);
    return () => { cancelled = true; clearTimeout(t); };
  }, [gcode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsed) return;
    drawLayer(canvas, parsed, layerIdx, visible);
  }, [parsed, layerIdx, visible]);

  const layer: GCodeLayer | undefined = parsed?.layers[layerIdx];
  const segmentTypeCounts = useMemo(() => {
    if (!layer) return {} as Record<MoveType, number>;
    const c: Record<string, number> = {};
    for (const s of layer.segments) c[s.type] = (c[s.type] ?? 0) + 1;
    return c as Record<MoveType, number>;
  }, [layer]);

  // Per-layer height = z[i] - z[i-1]. Layer 0 uses its own z (first-layer
  // height). Rounded to 3 decimals so floating-point noise from the parser
  // doesn't classify every layer as unique.
  const layerHeights: number[] = useMemo(() => {
    if (!parsed) return [];
    const zs = parsed.layers.map((l) => l.z);
    return zs.map((z, i) => Math.round((i === 0 ? z : z - zs[i - 1]) * 1000) / 1000);
  }, [parsed]);
  const heightRange = useMemo(() => {
    if (layerHeights.length === 0) return null;
    // Skip layer 0 for the range (first-layer height is often much taller
    // than the rest and would wash out the color scale).
    const rest = layerHeights.slice(1);
    if (rest.length === 0) return { min: layerHeights[0], max: layerHeights[0] };
    let min = Infinity, max = -Infinity;
    for (const h of rest) { if (h < min) min = h; if (h > max) max = h; }
    return { min, max };
  }, [layerHeights]);
  const isAdaptive = !!heightRange && (heightRange.max - heightRange.min) > 0.005;

  useEffect(() => {
    const canvas = heightStripRef.current;
    if (!canvas || layerHeights.length === 0 || !heightRange) return;
    drawHeightStrip(canvas, layerHeights, heightRange, layerIdx);
  }, [layerHeights, heightRange, layerIdx]);

  // Health strip summary: outOfBounds is the failure state we most care about.
  const health: { level: 'ok' | 'warn' | 'danger'; text: string } = (() => {
    if (!report) return { level: 'ok', text: 'Sliced.' };
    if (report.outOfBounds) return { level: 'danger', text: 'Toolpath escapes the bed even after auto-center — Klipper will reject "move out of range".' };
    if (report.translated) return { level: 'warn', text: `Toolpath was auto-centered on the bed (Δx=${report.translation.dx.toFixed(1)} Δy=${report.translation.dy.toFixed(1)}). Original slicer output was outside printable_area.` };
    return { level: 'ok', text: 'Everything sits inside the bed.' };
  })();

  return (
    <div class="gcode-preview">
      <div class={`gcode-health gcode-health-${health.level}`}>
        <span class="gcode-health-icon" aria-hidden>
          {health.level === 'ok' ? '✓' : health.level === 'warn' ? '⚠' : '✗'}
        </span>
        <span>{health.text}</span>
      </div>

      <div class="gcode-preview-stats">
        <div><strong>{formatDuration(printTime)}</strong><span>Print time</span></div>
        <div><strong>{metadata.bedTempC !== undefined ? `${metadata.bedTempC} °C` : '—'}</strong><span>Bed temp</span></div>
        <div><strong>{metadata.nozzleTempC !== undefined ? `${metadata.nozzleTempC} °C` : '—'}</strong><span>Nozzle temp</span></div>
        <div><strong>{formatGrams(metadata.filamentGrams)}</strong><span>Filament weight</span></div>
        <div><strong>{formatVolume(metadata.filamentCm3)}</strong><span>Volume</span></div>
        <div><strong>{formatFilament(filamentMm)}</strong><span>Length</span></div>
        <div><strong>{metadata.layerCount ?? parsed?.layers.length ?? '…'}</strong><span>Layers</span></div>
        <div><strong>{metadata.maxZ !== undefined ? `${metadata.maxZ.toFixed(1)} mm` : '—'}</strong><span>Height</span></div>
      </div>

      {!parsed && !parseError && (
        <div class="gcode-preview-parsing">
          Parsing G-code… {Math.round(parseProgress * 100)}%
        </div>
      )}
      {parseError && <div class="gcode-preview-error">Preview parse failed: {parseError}</div>}

      {parsed && (
        <>
          <div class="gcode-preview-canvas-wrap">
            <canvas ref={canvasRef} class="gcode-preview-canvas" width={520} height={520} />
          </div>

          <div class="gcode-preview-controls">
            <label class="gcode-preview-slider">
              <span>Layer {layerIdx + 1} / {parsed.layers.length}</span>
              <input
                type="range"
                min={0}
                max={parsed.layers.length - 1}
                step={1}
                value={layerIdx}
                onInput={(e) => setLayerIdx(parseInt((e.target as HTMLInputElement).value, 10))}
              />
              <span class="gcode-preview-z">
                z = {layer?.z.toFixed(2)} mm
                {layerHeights[layerIdx] !== undefined && (
                  <> · Δz = {layerHeights[layerIdx].toFixed(3)} mm</>
                )}
              </span>
            </label>

            {heightRange && (
              <div class="gcode-preview-height-strip">
                <div class="gcode-preview-height-strip-label">
                  {isAdaptive
                    ? <>Layer height: <strong>{heightRange.min.toFixed(2)}</strong>–<strong>{heightRange.max.toFixed(2)} mm</strong> (adaptive)</>
                    : <>Layer height: <strong>{heightRange.max.toFixed(2)} mm</strong> (uniform)</>}
                </div>
                <canvas
                  ref={heightStripRef}
                  class="gcode-preview-height-strip-canvas"
                  width={520}
                  height={24}
                  title="Layer height across the print. Click to seek."
                  onClick={(e) => {
                    const c = heightStripRef.current;
                    if (!c) return;
                    const rect = c.getBoundingClientRect();
                    const x = (e as unknown as MouseEvent).clientX - rect.left;
                    const idx = Math.max(0, Math.min(parsed.layers.length - 1, Math.floor((x / rect.width) * parsed.layers.length)));
                    setLayerIdx(idx);
                  }}
                />
                {isAdaptive && (
                  <div class="gcode-preview-height-strip-scale">
                    <span class="gcode-preview-height-strip-swatch" style={{ background: heightColor(0) }} />
                    <span>{heightRange.min.toFixed(2)}</span>
                    <span class="gcode-preview-height-strip-gradient" />
                    <span>{heightRange.max.toFixed(2)} mm</span>
                    <span class="gcode-preview-height-strip-swatch" style={{ background: heightColor(1) }} />
                  </div>
                )}
              </div>
            )}

            <div class="gcode-preview-legend">
              {(Object.keys(MOVE_TYPE_COLORS) as MoveType[]).map((t) => {
                const count = segmentTypeCounts[t] ?? 0;
                if (count === 0 && t !== 'travel') return null;
                const on = visible[t];
                return (
                  <label
                    key={t}
                    class={`gcode-preview-legend-chip${on ? ' on' : ''}`}
                    style={{ borderColor: MOVE_TYPE_COLORS[t] }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setVisible((v) => ({ ...v, [t]: !v[t] }))}
                    />
                    <span class="gcode-preview-legend-swatch" style={{ background: MOVE_TYPE_COLORS[t] }} />
                    <span>{t}</span>
                    <span class="gcode-preview-legend-count">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {report && (
        <div class={`gcode-preview-diagnostic${report.outOfBounds ? ' danger' : report.translated ? ' warn' : ''}`}>
          <div class="gcode-preview-diagnostic-row">
            <span>Bed bounds</span>
            <span>{fmtBounds(report.bedBounds)}</span>
          </div>
          <div class="gcode-preview-diagnostic-row">
            <span>Slicer emitted</span>
            <span>{fmtBounds(report.originalGcodeBounds)}</span>
          </div>
          {report.translated && (
            <div class="gcode-preview-diagnostic-row">
              <span>Translated by</span>
              <span>Δx = {report.translation.dx.toFixed(2)} mm, Δy = {report.translation.dy.toFixed(2)} mm → {fmtBounds(report.finalGcodeBounds)}</span>
            </div>
          )}
          {report.outOfBounds && (
            <div class="gcode-preview-diagnostic-msg">
              ⚠ G-code still contains X/Y outside <code>printable_area</code> after post-processing —
              print will trigger "move out of range" on Klipper. Consider re-slicing with the object
              closer to bed center, or adjust <code>position_min/max</code> in your <code>printer.cfg</code>.
            </div>
          )}
          {!report.outOfBounds && report.translated && (
            <div class="gcode-preview-diagnostic-msg">
              ✓ Toolpath auto-shifted to sit inside the bed. If your prime line still misses,
              the START_PRINT macro's prime coords are probably corner-relative — edit them in <code>printer.cfg</code>.
            </div>
          )}
        </div>
      )}

      <details class="gcode-preview-source">
        <summary>Show G-code head ({gcode.split('\n').length.toLocaleString()} lines)</summary>
        <pre>{gcode.split('\n').slice(0, 80).join('\n')}</pre>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2D top-down layer render. Simple line-segment plot in the layer's own bounds.

function drawLayer(
  canvas: HTMLCanvasElement,
  parsed: ParsedGCode,
  layerIdx: number,
  visible: Record<MoveType, boolean>,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#07001a';
  ctx.fillRect(0, 0, width, height);

  const layer = parsed.layers[layerIdx];
  if (!layer) return;

  const b = parsed.bounds;
  const spanX = Math.max(1, b.maxX - b.minX);
  const spanY = Math.max(1, b.maxY - b.minY);
  const pad = 12;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const offX = (width - spanX * scale) / 2 - b.minX * scale;
  const offY = (height - spanY * scale) / 2 - b.minY * scale;

  // Y is flipped so the print bed matches the way people view it in a slicer.
  const px = (x: number) => x * scale + offX;
  const py = (y: number) => height - (y * scale + offY);

  ctx.lineWidth = 1;
  ctx.lineCap = 'round';

  // Draw travel first so it sits under extrusion lines.
  const drawOrder: MoveType[] = ['travel', 'skirt', 'brim', 'support', 'infill', 'solid-fill', 'wall', 'purge-tower', 'shield', 'other'];
  for (const t of drawOrder) {
    if (!visible[t]) continue;
    ctx.strokeStyle = MOVE_TYPE_COLORS[t];
    ctx.beginPath();
    for (const seg of layer.segments) {
      if (seg.type !== t) continue;
      ctx.moveTo(px(seg.x1), py(seg.y1));
      ctx.lineTo(px(seg.x2), py(seg.y2));
    }
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Layer-height strip. One column per layer, coloured by Δz. Lets the user
// eyeball adaptive vs. uniform at a glance, and click to seek.

/** Map [0..1] → colour on a cool→hot neon ramp. 0 = thin (cyan), 1 = thick (yellow). */
function heightColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  // Cyan (#00eaff) → magenta (#ff17c7) → yellow (#ffd60a)
  const stops = [
    { at: 0.0, r: 0x00, g: 0xea, b: 0xff },
    { at: 0.5, r: 0xff, g: 0x17, b: 0xc7 },
    { at: 1.0, r: 0xff, g: 0xd6, b: 0x0a },
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const span = b.at - a.at || 1;
  const u = (clamped - a.at) / span;
  const r = Math.round(a.r + (b.r - a.r) * u);
  const g = Math.round(a.g + (b.g - a.g) * u);
  const bl = Math.round(a.b + (b.b - a.b) * u);
  return `rgb(${r}, ${g}, ${bl})`;
}

function drawHeightStrip(
  canvas: HTMLCanvasElement,
  heights: number[],
  range: { min: number; max: number },
  currentIdx: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const n = heights.length;
  if (n === 0) return;
  const span = Math.max(1e-6, range.max - range.min);

  // Column-per-layer. When there are more layers than pixels, each column
  // spans ceil(n/width) layers and picks the max height in the bin — matches
  // the "hottest wins" instinct for spotting thin regions.
  const colW = width / n;
  for (let i = 0; i < n; i++) {
    const h = heights[i];
    // Layer 0 is often much taller than the rest (first-layer height). Show
    // it distinctly but don't let it dominate the ramp — clamp to [min..max].
    const t = i === 0 ? 1 : Math.max(0, Math.min(1, (h - range.min) / span));
    ctx.fillStyle = heightColor(t);
    ctx.fillRect(i * colW, 0, Math.max(1, colW + 1), height);
  }

  // Current-layer marker.
  const markerX = (currentIdx + 0.5) * colW;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(markerX, 0);
  ctx.lineTo(markerX, height);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(markerX - 1, 0);
  ctx.lineTo(markerX - 1, height);
  ctx.stroke();
}
