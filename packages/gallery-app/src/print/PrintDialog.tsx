// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import {
  createSlicerBackend,
  startPrint,
  uploadGcode,
  type SlicerBackend,
} from '@3d-gallery/print-toolkit';
import { Modal } from './Modal.js';
import { listPresets, type PrintPreset } from './print-storage.js';

export interface PrintDialogModel {
  slug: string;
  title: string;
}

export interface PrintDialogPart {
  file: string;
  format: 'stl' | '3mf';
  label: string;
  /** Full URL Vite serves the built mesh from (or a blob URL for a customized render). */
  meshUrl: string;
}

interface PrintDialogProps {
  model: PrintDialogModel;
  part: PrintDialogPart;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'slicing' | 'uploading' | 'starting' | 'done' | 'error';

interface Progress {
  stage: string;
  pct: number;
  message?: string;
}

const LS_LAST_SELECTIONS = '3dg:print:last-selections';

interface LastSelections {
  printerId?: string;
  filamentId?: string;
  processId?: string;
  address?: string;
}

function loadLastSelections(): LastSelections {
  try {
    const raw = localStorage.getItem(LS_LAST_SELECTIONS);
    if (!raw) return {};
    return JSON.parse(raw) as LastSelections;
  } catch {
    return {};
  }
}

function saveLastSelections(sel: LastSelections): void {
  try {
    localStorage.setItem(LS_LAST_SELECTIONS, JSON.stringify(sel));
  } catch {
    /* localStorage full — ignore */
  }
}

export function PrintDialog({ model, part, onClose }: PrintDialogProps) {
  const [printers, setPrinters] = useState<PrintPreset[]>([]);
  const [filaments, setFilaments] = useState<PrintPreset[]>([]);
  const [processes, setProcesses] = useState<PrintPreset[]>([]);

  const initialSel = loadLastSelections();
  const [printerId, setPrinterId] = useState<string>(initialSel.printerId ?? '');
  const [filamentId, setFilamentId] = useState<string>(initialSel.filamentId ?? '');
  const [processId, setProcessId] = useState<string>(initialSel.processId ?? '');
  const [address, setAddress] = useState<string>(initialSel.address ?? '');

  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Progress>({ stage: '', pct: 0 });
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    void (async () => {
      const [p, f, pr] = await Promise.all([
        listPresets('printer'),
        listPresets('filament'),
        listPresets('process'),
      ]);
      setPrinters(p);
      setFilaments(f);
      setProcesses(pr);
      // Seed sensible defaults if the previous selection is gone but presets exist.
      setPrinterId((cur) => (cur && p.some((x) => x.id === cur) ? cur : p[0]?.id ?? ''));
      setFilamentId((cur) => (cur && f.some((x) => x.id === cur) ? cur : f[0]?.id ?? ''));
      setProcessId((cur) => (cur && pr.some((x) => x.id === cur) ? cur : pr[0]?.id ?? ''));
    })();
  }, []);

  useEffect(() => {
    // Inherit the printer's saved address whenever the printer changes and
    // the user hasn't manually overridden it.
    const printer = printers.find((p) => p.id === printerId);
    if (printer?.address && !address) setAddress(printer.address);
  }, [printerId, printers]);

  const canPrint = !!printerId && !!filamentId && !!processId && !!address && status === 'idle';
  const anyPresets = printers.length > 0 || filaments.length > 0 || processes.length > 0;

  const handleSliceAndSend = async () => {
    setErrorMsg('');
    saveLastSelections({ printerId, filamentId, processId, address });

    const printer = printers.find((p) => p.id === printerId);
    const filament = filaments.find((p) => p.id === filamentId);
    const process = processes.find((p) => p.id === processId);
    if (!printer || !filament || !process) {
      setErrorMsg('Missing preset selection.');
      setStatus('error');
      return;
    }

    let backend: SlicerBackend | null = null;
    try {
      setStatus('loading');
      setProgress({ stage: 'fetching', pct: 0, message: `Loading ${part.label}…` });
      const res = await fetch(part.meshUrl);
      if (!res.ok) throw new Error(`Failed to load mesh: HTTP ${res.status}`);
      const meshBuffer = await res.arrayBuffer();

      // Merge the three presets into a flat config dict. Later presets win.
      // Order matches OrcaSlicer's own layering (printer → filament → process).
      const config: Record<string, string> = {
        ...printer.config,
        ...filament.config,
        ...process.config,
      };

      backend = createSlicerBackend();
      setStatus('slicing');
      setProgress({ stage: 'slicing', pct: 0, message: `Slicing with ${backend.engineName}…` });
      const sliceResult = await backend.loadAndSlice(
        meshBuffer,
        config,
        part.format,
        (stage, pct, message) => {
          setProgress({ stage, pct, message });
        },
      );

      const encoder = new TextEncoder();
      const gcodeBytes = encoder.encode(sliceResult.gcode);
      const uploadName = `${model.slug}-${part.file.replace(/\.[^.]+$/, '')}.gcode`;

      setStatus('uploading');
      setProgress({ stage: 'upload', pct: 0, message: `Uploading ${uploadName} to ${address}…` });
      await uploadGcode(address, uploadName, gcodeBytes);

      setStatus('starting');
      setProgress({ stage: 'start', pct: 0, message: `Starting print on ${address}…` });
      await startPrint(address, uploadName);

      setStatus('done');
      setProgress({ stage: 'done', pct: 100, message: 'Print started.' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      backend?.destroy();
    }
  };

  return (
    <Modal title={`Print — ${model.title}`} onClose={onClose}>
      <div class="print-dialog">
        {!anyPresets && (
          <div class="print-dialog-empty">
            No presets stored yet. Open <strong>Print settings</strong> and import your OrcaSlicer preset files (.orca_printer, .orca_filament, .orca_process).
          </div>
        )}

        <div class="print-dialog-row">
          <label>Mesh</label>
          <span class="print-dialog-value">
            {part.label} <em>({part.format.toUpperCase()})</em>
          </span>
        </div>

        <label class="print-dialog-row">
          <span>Printer</span>
          <select
            value={printerId}
            onChange={(e) => setPrinterId((e.target as HTMLSelectElement).value)}
            disabled={status !== 'idle'}
          >
            <option value="">— select printer —</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label class="print-dialog-row">
          <span>Filament</span>
          <select
            value={filamentId}
            onChange={(e) => setFilamentId((e.target as HTMLSelectElement).value)}
            disabled={status !== 'idle'}
          >
            <option value="">— select filament —</option>
            {filaments.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label class="print-dialog-row">
          <span>Print profile</span>
          <select
            value={processId}
            onChange={(e) => setProcessId((e.target as HTMLSelectElement).value)}
            disabled={status !== 'idle'}
          >
            <option value="">— select profile —</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label class="print-dialog-row">
          <span>Moonraker address</span>
          <input
            type="text"
            placeholder="printer.local:7125"
            value={address}
            onInput={(e) => setAddress((e.target as HTMLInputElement).value)}
            disabled={status !== 'idle'}
          />
        </label>

        {status !== 'idle' && (
          <div class="print-dialog-progress">
            <div class="print-dialog-progress-bar">
              <div
                class="print-dialog-progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, progress.pct * 100))}%` }}
              />
            </div>
            <div class="print-dialog-progress-status">
              {progress.message ?? progress.stage}
            </div>
          </div>
        )}

        {errorMsg && <div class="print-dialog-error">{errorMsg}</div>}

        <div class="print-dialog-actions">
          <button type="button" class="btn btn-secondary" onClick={onClose}>
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            onClick={handleSliceAndSend}
            disabled={!canPrint}
          >
            {status === 'idle' ? 'Slice & Send' : status === 'done' ? 'Sent' : 'Working…'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
