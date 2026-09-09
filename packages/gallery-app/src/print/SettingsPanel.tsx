// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { Modal } from './Modal.js';
import {
  deletePreset,
  listPresets,
  savePreset,
  type PrintPreset,
  type PresetKind,
} from './print-storage.js';
import { parseOrcaPresetFile } from './orca-import.js';

interface SettingsPanelProps {
  onClose: () => void;
}

const KIND_LABEL: Record<PresetKind, string> = {
  printer: 'Printers',
  filament: 'Filaments',
  process: 'Print profiles',
};

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [importedCount, setImportedCount] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  // Address editing is per-printer preset; kept in local state so we can save
  // without triggering a full re-fetch on every keystroke.
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({});

  const refresh = async () => {
    setPresets(await listPresets());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImportError('');
    setImportedCount(0);
    setBusy(true);
    let imported = 0;
    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        const parsed = parseOrcaPresetFile(file.name, text);
        await savePreset({
          kind: parsed.kind,
          name: parsed.name,
          config: parsed.config,
        });
        imported++;
      }
      setImportedCount(imported);
      await refresh();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    await deletePreset(id);
    await refresh();
  };

  const handleAddressSave = async (preset: PrintPreset) => {
    const draft = addressDrafts[preset.id];
    if (draft === undefined) return;
    await savePreset({
      id: preset.id,
      kind: preset.kind,
      name: preset.name,
      config: preset.config,
      address: draft.trim() || undefined,
    });
    setAddressDrafts((prev) => {
      const next = { ...prev };
      delete next[preset.id];
      return next;
    });
    await refresh();
  };

  const byKind: Record<PresetKind, PrintPreset[]> = {
    printer: presets.filter((p) => p.kind === 'printer'),
    filament: presets.filter((p) => p.kind === 'filament'),
    process: presets.filter((p) => p.kind === 'process'),
  };

  return (
    <Modal title="Print settings" onClose={onClose}>
      <div class="print-settings">
        <section class="print-settings-import">
          <h4>Import OrcaSlicer presets</h4>
          <p class="print-settings-help">
            Select one or more <code>.orca_printer</code>, <code>.orca_filament</code>,
            or <code>.orca_process</code> files exported from OrcaSlicer.
          </p>
          <input
            type="file"
            multiple
            accept=".orca_printer,.orca_filament,.orca_process,.ini,.json"
            disabled={busy}
            onChange={(e) => void handleFiles((e.target as HTMLInputElement).files)}
          />
          {importedCount > 0 && (
            <div class="print-settings-notice">Imported {importedCount} preset{importedCount === 1 ? '' : 's'}.</div>
          )}
          {importError && <div class="print-settings-error">{importError}</div>}
        </section>

        {(['printer', 'filament', 'process'] as PresetKind[]).map((kind) => (
          <section key={kind} class="print-settings-list">
            <h4>{KIND_LABEL[kind]}</h4>
            {byKind[kind].length === 0 && <div class="print-settings-empty">No {kind} presets yet.</div>}
            <ul>
              {byKind[kind].map((preset) => (
                <li key={preset.id} class="print-settings-item">
                  <div class="print-settings-item-header">
                    <span class="print-settings-item-name">{preset.name}</span>
                    <button
                      type="button"
                      class="btn btn-secondary print-settings-delete"
                      onClick={() => void handleDelete(preset.id)}
                    >
                      Delete
                    </button>
                  </div>
                  {kind === 'printer' && (
                    <div class="print-settings-item-address">
                      <label>
                        <span>Moonraker address</span>
                        <input
                          type="text"
                          placeholder="printer.local:7125"
                          value={addressDrafts[preset.id] ?? preset.address ?? ''}
                          onInput={(e) =>
                            setAddressDrafts((prev) => ({
                              ...prev,
                              [preset.id]: (e.target as HTMLInputElement).value,
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        class="btn btn-secondary"
                        disabled={addressDrafts[preset.id] === undefined}
                        onClick={() => void handleAddressSave(preset)}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div class="print-settings-actions">
          <button type="button" class="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}
