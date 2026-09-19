import type { ScadValue } from '@3d-gallery/model-core';
import type { WorkerRequest, WorkerResponse } from './openscad-worker.ts';

export type OutputFormat = 'stl' | '3mf';

export interface OpenSCADApi {
  init(): Promise<void>;
  render(scadSource: string, format: OutputFormat, onLog?: (line: string) => void): Promise<ArrayBuffer>;
  renderMulticolor(scadSource: string, onLog?: (line: string) => void): Promise<ArrayBuffer>;
  dispose(): void;
}

let requestId = 0;
function nextId(): string {
  return String(++requestId);
}

// Parameter injection lives in @3d-gallery/model-core so the browser and the
// Node renderer share one implementation — the assembled source has to match
// on both sides or their artifact keys address different bytes.
export { injectParameters, formatScadValue } from '@3d-gallery/model-core';

export function createOpenSCADApi(): OpenSCADApi {
  const worker = new Worker(
    new URL('./openscad-worker.ts', import.meta.url),
    { type: 'module' },
  );

  const pending = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  const logCallbacks = new Map<string, (line: string) => void>();

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const msg = e.data;
    if (msg.type === 'log') {
      const cb = logCallbacks.get(msg.id);
      if (cb) {
        for (const line of msg.logs) cb(line);
      }
      return;
    }

    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    logCallbacks.delete(msg.id);

    if (msg.type === 'init') {
      if (msg.success) {
        console.log('[OpenSCAD] WASM initialized successfully');
        entry.resolve(undefined);
      } else {
        console.error('[OpenSCAD] WASM init failed:', msg.error);
        entry.reject(new Error(msg.error ?? 'WASM init failed'));
      }
    } else if (msg.type === 'success') {
      console.log('[OpenSCAD] Render succeeded');
      entry.resolve(msg.output);
    } else {
      console.error('[OpenSCAD] Render error:', msg.error);
      if (msg.logs.length > 0) {
        console.error('[OpenSCAD] Logs:\n' + msg.logs.join('\n'));
      }
      const err = new Error(msg.error);
      (err as any).logs = msg.logs;
      entry.reject(err);
    }
  };

  worker.onerror = (e) => {
    console.error('[OpenSCAD] Worker error:', e.message);
    const err = new Error(`Worker error: ${e.message}`);
    for (const entry of pending.values()) {
      entry.reject(err);
    }
    pending.clear();
  };

  function send<T>(request: WorkerRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      pending.set(request.id, { resolve, reject });
      worker.postMessage(request);
    });
  }

  return {
    async init() {
      await send<void>({ type: 'init', id: nextId() });
    },

    async render(scadSource: string, format: OutputFormat, onLog?: (line: string) => void) {
      const id = nextId();
      if (onLog) logCallbacks.set(id, onLog);
      return send<ArrayBuffer>({
        type: 'render',
        id,
        scadSource,
        outputFormat: format,
      });
    },

    async renderMulticolor(scadSource: string, onLog?: (line: string) => void) {
      const id = nextId();
      if (onLog) logCallbacks.set(id, onLog);
      return send<ArrayBuffer>({
        type: 'render-multicolor',
        id,
        scadSource,
      });
    },

    dispose() {
      worker.terminate();
      for (const entry of pending.values()) {
        entry.reject(new Error('Worker terminated'));
      }
      pending.clear();
    },
  };
}
