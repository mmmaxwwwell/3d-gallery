// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Modal } from './Modal.js';
import {
  deletePreset,
  deletePresetsByKind,
  importPreset,
  listPresets,
  savePreset,
  type PrintPreset,
  type PresetKind,
} from './print-storage.js';
import { parseOrcaPresetFile, parseOrcaConfigTree, type ParsedPreset } from './orca-import.js';
import { PresetEditor } from './PresetEditor.js';
import { setOverride } from './preset-edit.js';
import { exportFilename, exportMergedJson, exportRawJson } from './preset-flatten.js';
import {
  clearServerAndUseLocal,
  probeServerStore,
  pullFromServer,
  pushToServer,
  syncFromServerOnce,
  type ServerStoreStatus,
} from './server-store.js';
import {
  INFILL_PATTERNS,
  deleteUserTemplate,
  listTemplates,
  upsertUserTemplate,
  type ProcessTemplate,
  type SupportStyle,
} from './process-templates.js';

interface SettingsPanelProps {
  onClose: () => void;
}

type Tab = 'import' | 'printer' | 'filament' | 'process';

const TAB_LABEL: Record<Tab, string> = {
  import: 'Import',
  printer: 'Printers',
  filament: 'Filaments',
  process: 'Process templates',
};

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [templates, setTemplates] = useState<ProcessTemplate[]>(listTemplates());
  const [tab, setTab] = useState<Tab>('import');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateWalls, setNewTemplateWalls] = useState<string>('3');
  const [newTemplateInfillDensity, setNewTemplateInfillDensity] = useState<string>('15');
  const [newTemplateInfillPattern, setNewTemplateInfillPattern] = useState<string>('gyroid');
  const [newTemplateSupports, setNewTemplateSupports] = useState<SupportStyle>('none');
  const [newTemplateBrim, setNewTemplateBrim] = useState<boolean>(false);
  const [newTemplateSkirt, setNewTemplateSkirt] = useState<boolean>(false);
  const [newTemplateAdaptiveLH, setNewTemplateAdaptiveLH] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [importedCount, setImportedCount] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({});
  const [server, setServer] = useState<ServerStoreStatus | null>(null);
  const [serverBusy, setServerBusy] = useState<boolean>(false);
  const [serverNotice, setServerNotice] = useState<string>('');
  const [serverError, setServerError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorDirty, setEditorDirty] = useState<boolean>(false);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Preact strips unknown attributes on <input>. Set them imperatively.
    const el = folderInputRef.current;
    if (!el) return;
    el.setAttribute('webkitdirectory', '');
    el.setAttribute('mozdirectory', '');
    el.setAttribute('directory', '');
  }, []);

  const refresh = async () => setPresets(await listPresets());
  // The page-load sync may still be pulling server records (an agent's newly
  // added printer, say) when the panel opens; list again once it lands.
  useEffect(() => { void refresh(); void syncFromServerOnce().then(refresh); }, []);

  const refreshServer = async () => setServer(await probeServerStore());
  useEffect(() => { void refreshServer(); }, []);

  /** One wrapper for all three server actions — each is "do the thing, say what
   *  happened, then re-read both stores so the panel can't show a stale count." */
  const runServerAction = async (label: string, action: () => Promise<string>) => {
    setServerBusy(true); setServerError(''); setServerNotice('');
    try {
      setServerNotice(await action());
    } catch (err) {
      setServerError(`${label} failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setServerBusy(false);
      await refreshServer();
      await refresh();
    }
  };

  // Re-importing refreshes the file and its chain but keeps gallery edits.
  const savePresetFromParsed = async (parsed: ParsedPreset) => {
    await importPreset(parsed);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImportError(''); setImportedCount(0); setWarnings([]); setBusy(true);
    let imported = 0;
    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        const parsed = parseOrcaPresetFile(file.name, text);
        await savePresetFromParsed(parsed);
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

  const handleFolder = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImportError(''); setImportedCount(0); setWarnings([]); setBusy(true);
    try {
      const { presets: parsed, warnings: warn, skipped } = await parseOrcaConfigTree(files);
      for (const p of parsed) await savePresetFromParsed(p);
      setImportedCount(parsed.length);
      setWarnings([...warn, ...skipped.map((s) => `Skipped: ${s}`)]);
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

  const handleExport = (preset: PrintPreset, variant: 'raw' | 'merged') => {
    const text = variant === 'raw' ? exportRawJson(preset) : exportMergedJson(preset);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename(preset, variant);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleDeleteAll = async (kind: PresetKind) => {
    const list = presets.filter((p) => p.kind === kind);
    if (list.length === 0) return;
    if (!confirm(`Delete all ${list.length} ${kind} preset${list.length === 1 ? '' : 's'}?`)) return;
    await deletePresetsByKind(kind);
    await refresh();
  };

  const handleAddressSave = async (preset: PrintPreset) => {
    const draft = addressDrafts[preset.id];
    if (draft === undefined) return;
    const address = draft.trim() || undefined;
    await savePreset({
      ...preset,
      // The address is the preset's `print_host`, so it's recorded as an edit
      // of that field — the editor then shows what it was imported as.
      overrides: setOverride(preset, preset.overrides ?? {}, 'print_host', address ?? '', undefined),
      address,
    });
    setAddressDrafts((prev) => { const next = { ...prev }; delete next[preset.id]; return next; });
    await refresh();
  };

  const toggleUniversalCompat = async (preset: PrintPreset, universal: boolean) => {
    await savePreset({
      ...preset,
      compatiblePrinters: universal ? [] : preset.compatiblePrinters?.length ? preset.compatiblePrinters : ['(none)'],
    });
    await refresh();
  };

  const printerNames = useMemo(() => presets.filter((p) => p.kind === 'printer').map((p) => p.name), [presets]);

  const setCompatPrinters = async (preset: PrintPreset, names: string[]) => {
    await savePreset({ ...preset, compatiblePrinters: names });
    await refresh();
  };

  const filtered = (kind: PresetKind): PrintPreset[] => {
    const q = search.trim().toLowerCase();
    let list = presets.filter((p) => p.kind === kind);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  };

  const counts = {
    printer: presets.filter((p) => p.kind === 'printer').length,
    filament: presets.filter((p) => p.kind === 'filament').length,
    process: templates.length,
  };

  const refreshTemplates = () => setTemplates(listTemplates());

  const handleSaveNewTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    upsertUserTemplate(name, {
      wallLoops: newTemplateWalls,
      topShells: '3',
      bottomShells: '3',
      infillDensity: newTemplateInfillDensity,
      infillPattern: newTemplateInfillPattern,
      supportStyle: newTemplateSupports,
      supportOnBuildPlateOnly: false,
      brim: newTemplateBrim,
      skirt: newTemplateSkirt,
      adaptiveLayerHeight: newTemplateAdaptiveLH,
    });
    setNewTemplateName('');
    refreshTemplates();
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm('Delete this template?')) return;
    deleteUserTemplate(id);
    refreshTemplates();
  };

  const editing = presets.find((p) => p.id === editingId);
  const guardedClose = () => {
    if (editorDirty && !confirm('Discard unsaved preset changes?')) return;
    onClose();
  };

  if (editing && (editing.kind === 'printer' || editing.kind === 'filament')) {
    return (
      <Modal title={`Edit ${editing.kind}`} onClose={guardedClose}>
        <PresetEditor
          key={editing.id}
          preset={editing as PrintPreset & { kind: 'printer' | 'filament' }}
          onBack={() => { setEditorDirty(false); setEditingId(null); }}
          onDirtyChange={setEditorDirty}
          onSaved={() => void refresh()}
        />
      </Modal>
    );
  }

  return (
    <Modal title="Print settings" onClose={onClose}>
      <div class="print-settings">
        <nav class="print-settings-tabs">
          {(['import', 'printer', 'filament', 'process'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              class={`print-settings-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABEL[t]}
              {t !== 'import' && <span class="print-settings-tab-count">{counts[t]}</span>}
            </button>
          ))}
        </nav>

        {tab === 'import' && (
          <section class="print-settings-import">
            <h4>Import from your OrcaSlicer config</h4>
            <p class="print-settings-help">
              <strong>Recommended:</strong> pick your <code>~/.config/OrcaSlicer</code> folder. We walk the tree,
              resolve each user preset's <code>inherits</code> chain against the vendor system presets, and save
              flattened printers, filaments, and processes.
            </p>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              disabled={busy}
              onChange={(e) => void handleFolder((e.target as HTMLInputElement).files)}
            />
            <p class="print-settings-help">
              Or pick individual <code>.orca_printer</code>/<code>.orca_filament</code>/<code>.orca_process</code>
              exports (or raw <code>.json</code> presets):
            </p>
            <input
              type="file"
              multiple
              accept=".orca_printer,.orca_filament,.orca_process,.ini,.json"
              disabled={busy}
              onChange={(e) => void handleFiles((e.target as HTMLInputElement).files)}
            />
            {busy && <div class="print-settings-notice">Working…</div>}
            {importedCount > 0 && (
              <div class="print-settings-notice">Imported {importedCount} preset{importedCount === 1 ? '' : 's'}.</div>
            )}

            {/* Only rendered where a server store actually answers. A deployment
                without one never shows this, which is what keeps hosting
                optional rather than something every user needs. */}
            {server?.available && (
              <div class="print-settings-server">
                <h4>Server store (optional)</h4>
                <p class="print-settings-help">
                  Your presets live in this browser. A server store is opt-in — use it to share
                  them between browsers or to let an agent manage them for you.{' '}
                  <strong>
                    {server.count === 0
                      ? 'The server is empty.'
                      : `The server holds ${server.count} preset${server.count === 1 ? '' : 's'}.`}
                  </strong>{' '}
                  {server.optedIn
                    ? 'Server values are synced into this browser on each load.'
                    : 'Not syncing — this browser is using its own values.'}
                </p>
                <div class="print-settings-server-actions">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    disabled={serverBusy}
                    title="Replace the server's set with everything in this browser"
                    onClick={() => void runServerAction('Export', async () => {
                      const { exported } = await pushToServer();
                      return `Exported ${exported} preset${exported === 1 ? '' : 's'} to the server.`;
                    })}
                  >
                    Export to server
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    disabled={serverBusy || server.count === 0}
                    title="Copy the server's presets into this browser. Never deletes local presets."
                    onClick={() => void runServerAction('Sync', async () => {
                      const { imported } = await pullFromServer({ force: true });
                      return `Using server values — ${imported} preset${imported === 1 ? '' : 's'} synced in.`;
                    })}
                  >
                    Use server values
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary print-settings-delete"
                    disabled={serverBusy}
                    title="Empty the server store and go back to this browser's own presets"
                    onClick={() => void runServerAction('Delete', async () => {
                      const { removed } = await clearServerAndUseLocal();
                      return `Server store emptied (${removed} removed). Using this browser's values; `
                        + 'nothing local was deleted.';
                    })}
                  >
                    Delete from server, use local
                  </button>
                </div>
                {serverBusy && <div class="print-settings-notice">Working…</div>}
                {serverNotice && <div class="print-settings-notice">{serverNotice}</div>}
                {serverError && <div class="print-settings-error">{serverError}</div>}
              </div>
            )}
            {warnings.length > 0 && (
              <details class="print-settings-warnings">
                <summary>{warnings.length} warning{warnings.length === 1 ? '' : 's'}</summary>
                <ul>
                  {warnings.slice(0, 40).map((w, i) => <li key={i}>{w}</li>)}
                  {warnings.length > 40 && <li>…and {warnings.length - 40} more</li>}
                </ul>
              </details>
            )}
            {importError && <div class="print-settings-error">{importError}</div>}
          </section>
        )}

        {tab === 'process' && (
          <section class="print-settings-list">
            <p class="print-settings-help">
              Templates capture <strong>walls</strong>, <strong>infill</strong>, and <strong>supports</strong>.
              Layer height, acceleration, and per-feature speeds come from the printer + filament preset at print time
              — one template applies across every layer height for a nozzle.
            </p>
            <ul>
              {templates.map((t) => (
                <li key={t.id} class="print-settings-item">
                  <div class="print-settings-item-header">
                    <span class="print-settings-item-name">
                      {t.name}
                      {t.builtIn && <em class="print-settings-badge">built-in</em>}
                    </span>
                    {!t.builtIn && (
                      <button
                        type="button"
                        class="btn btn-secondary print-settings-delete"
                        onClick={() => handleDeleteTemplate(t.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div class="print-settings-item-summary">
                    {t.settings.wallLoops} walls · {t.settings.infillDensity}% {t.settings.infillPattern} ·{' '}
                    {t.settings.supportStyle === 'none'
                      ? 'no supports'
                      : t.settings.supportStyle === 'tree'
                      ? 'tree supports'
                      : 'normal supports'}
                    {t.settings.brim ? ' · brim' : ''}
                    {t.settings.skirt ? ' · skirt' : ''}
                  </div>
                </li>
              ))}
            </ul>
            <details class="print-settings-new-template">
              <summary>New template</summary>
              <div class="print-settings-new-template-grid">
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    placeholder="e.g. 5 walls tree supports"
                    value={newTemplateName}
                    onInput={(e) => setNewTemplateName((e.target as HTMLInputElement).value)}
                  />
                </label>
                <label>
                  <span>Walls</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTemplateWalls}
                    onInput={(e) => setNewTemplateWalls((e.target as HTMLInputElement).value)}
                  />
                </label>
                <label>
                  <span>Infill pattern</span>
                  <select value={newTemplateInfillPattern} onChange={(e) => setNewTemplateInfillPattern((e.target as HTMLSelectElement).value)}>
                    {INFILL_PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label>
                  <span>Infill %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={newTemplateInfillDensity}
                    onInput={(e) => setNewTemplateInfillDensity((e.target as HTMLInputElement).value)}
                  />
                </label>
                <label>
                  <span>Supports</span>
                  <select value={newTemplateSupports} onChange={(e) => setNewTemplateSupports((e.target as HTMLSelectElement).value as SupportStyle)}>
                    <option value="none">None</option>
                    <option value="normal">Normal (auto)</option>
                    <option value="tree">Tree (auto)</option>
                  </select>
                </label>
                <label class="print-settings-new-template-toggle">
                  <input type="checkbox" checked={newTemplateBrim} onChange={(e) => setNewTemplateBrim((e.target as HTMLInputElement).checked)} />
                  <span>Brim</span>
                </label>
                <label class="print-settings-new-template-toggle">
                  <input type="checkbox" checked={newTemplateSkirt} onChange={(e) => setNewTemplateSkirt((e.target as HTMLInputElement).checked)} />
                  <span>Skirt</span>
                </label>
                <label class="print-settings-new-template-toggle">
                  <input type="checkbox" checked={newTemplateAdaptiveLH} onChange={(e) => setNewTemplateAdaptiveLH((e.target as HTMLInputElement).checked)} />
                  <span>Adaptive layer height</span>
                </label>
                <button
                  type="button"
                  class="btn btn-primary"
                  onClick={handleSaveNewTemplate}
                  disabled={!newTemplateName.trim()}
                >
                  Save template
                </button>
              </div>
            </details>
          </section>
        )}

        {(tab === 'printer' || tab === 'filament') && (
          <section class="print-settings-list">
            <div class="print-settings-toolbar">
              <input
                type="search"
                placeholder={`Search ${TAB_LABEL[tab].toLowerCase()}…`}
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="btn btn-secondary"
                onClick={() => void handleDeleteAll(tab)}
                disabled={counts[tab] === 0}
              >
                Delete all
              </button>
            </div>
            {filtered(tab).length === 0 && (
              <div class="print-settings-empty">
                {counts[tab] === 0 ? `No ${tab} presets yet — use the Import tab.` : 'No matches.'}
              </div>
            )}
            <ul>
              {filtered(tab).map((preset) => (
                <li key={preset.id} class="print-settings-item">
                  <div class="print-settings-item-header">
                    <span class="print-settings-item-name">
                      {preset.name}
                      {preset.parents.length > 0 && (
                        <span class="print-settings-item-hint" title={`Inherits from: ${preset.parents.map((p) => p.name).join(' → ')}`}>
                          {' '}(inherits · {preset.parents.length})
                        </span>
                      )}
                      {preset.overrides && (
                        <em class="print-settings-badge" title="Settings changed in the gallery, over the imported file">
                          {Object.keys(preset.overrides).length} edited
                        </em>
                      )}
                    </span>
                    <div class="print-settings-item-actions">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        onClick={() => setEditingId(preset.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary print-settings-export"
                        title="Download this preset's own fields with gallery edits applied (Orca can re-open it if the parent preset is installed)"
                        onClick={() => handleExport(preset, 'raw')}
                      >
                        Export
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary print-settings-export"
                        title="Download fully-merged JSON (self-contained — no parent preset needed on the receiving side)"
                        onClick={() => handleExport(preset, 'merged')}
                      >
                        Export merged
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary print-settings-delete"
                        onClick={() => void handleDelete(preset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {preset.kind === 'printer' && (
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
                  {(preset.kind === 'filament' || preset.kind === 'process') && (
                    <div class="print-settings-item-compat">
                      <label class="print-settings-compat-universal">
                        <input
                          type="checkbox"
                          checked={!preset.compatiblePrinters || preset.compatiblePrinters.length === 0}
                          onChange={(e) => void toggleUniversalCompat(preset, (e.target as HTMLInputElement).checked)}
                        />
                        <span>Compatible with all printers</span>
                      </label>
                      {preset.compatiblePrinters && preset.compatiblePrinters.length > 0 && (
                        <div class="print-settings-compat-list">
                          {printerNames.map((pn) => {
                            const on = preset.compatiblePrinters?.includes(pn) ?? false;
                            return (
                              <label key={pn} class={`print-settings-compat-chip${on ? ' on' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => {
                                    const cur = new Set(preset.compatiblePrinters ?? []);
                                    if (on) cur.delete(pn);
                                    else cur.add(pn);
                                    void setCompatPrinters(preset, Array.from(cur));
                                  }}
                                />
                                <span>{pn}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div class="print-settings-actions">
          <button type="button" class="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}
