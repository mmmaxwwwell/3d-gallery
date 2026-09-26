// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// Field-by-field editor for a stored printer or filament preset.
//
// Every field is typed from libslic3r's own option table (see print-toolkit's
// orca-schema) and laid out in Orca's pages and groups. Edits land in the
// preset's `overrides` — the imported file is never touched — so each changed
// field says what it was and where that came from, and can be put back.

import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  describeValue,
  elementType,
  fromCells,
  isVectorType,
  normalizeCell,
  ORCA_NIL,
  toCells,
  validateCells,
  type OrcaMode,
  type OrcaOptionDef,
  type OrcaSchema,
} from '@3d-gallery/print-toolkit/orca-schema';
import { savePreset, type OrcaJson, type OrcaValue, type PrintPreset } from './print-storage.js';
import {
  clearOverride,
  describeOrigin,
  describeSource,
  filterLayout,
  listChanges,
  resolveField,
  setOverride,
  unrecognisedKeys,
  type FieldState,
} from './preset-edit.js';
import { setPrintLeaveGuard } from './nav-guard.js';

type EditableKind = 'printer' | 'filament';

interface PresetEditorProps {
  preset: PrintPreset & { kind: EditableKind };
  onSaved: (preset: PrintPreset) => void;
  onBack: () => void;
  /** Lets the host ask before closing over unsaved edits. */
  onDirtyChange: (dirty: boolean) => void;
}

const MODE_LABEL: Record<OrcaMode, string> = { simple: 'Simple', advanced: 'Advanced', develop: 'Developer' };
const UNRECOGNISED = 'Not in Orca’s list';
const CHANGES = 'Changes';

/** A vector option edited as one list (a polygon, a set of names) rather than
 *  one value per extruder or filament slot. */
function isListLike(key: string, def: OrcaOptionDef, kind: EditableKind, extruderKeys: Set<string>): boolean {
  if (def.type === 'points' || def.type === 'pointsGroups') return !extruderKeys.has(key);
  if (def.type !== 'strings') return false;
  if (kind === 'printer') return !extruderKeys.has(key);
  return key.startsWith('compatible_') || key === 'filament_extruder_variant';
}

/** What each cell of a vector is: machine limits carry a Normal and a Silent
 *  column, extruder settings one per extruder. */
function cellLabel(key: string, index: number, count: number): string | null {
  if (count < 2) return null;
  if (key.startsWith('machine_max_') || key.startsWith('machine_min_')) return index === 0 ? 'Normal' : index === 1 ? 'Silent' : `#${index + 1}`;
  return `#${index + 1}`;
}

function isLongText(key: string, def: OrcaOptionDef): boolean {
  return !!def.multiline || !!def.fullWidth || key.endsWith('_gcode') || key.endsWith('notes');
}

export function PresetEditor({ preset, onSaved, onBack, onDirtyChange }: PresetEditorProps) {
  const [schema, setSchema] = useState<OrcaSchema | null>(null);
  const [schemaError, setSchemaError] = useState('');
  const [draft, setDraft] = useState<OrcaJson>(preset.overrides ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<OrcaMode>('advanced');
  const [query, setQuery] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // ~100 kB of labels and tooltips; only worth fetching when someone edits.
    import('@3d-gallery/print-toolkit/orca-schema-data')
      .then((m) => setSchema(m.ORCA_SCHEMA))
      .catch((err: unknown) => setSchemaError(err instanceof Error ? err.message : String(err)));
  }, []);

  const saved = preset.overrides ?? {};
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    onDirtyChange(dirty);
    setPrintLeaveGuard(dirty ? () => confirm('Discard unsaved preset changes?') : null);
    return () => setPrintLeaveGuard(null);
  }, [dirty]);

  const kindSchema = schema?.kinds[preset.kind];
  const extruderKeys = useMemo(() => new Set(kindSchema?.extruderKeys ?? []), [kindSchema]);
  const changes = schema ? listChanges(preset, draft, schema) : [];

  const pages = useMemo(() => {
    if (!schema || !kindSchema) return [];
    const extra = unrecognisedKeys(preset, draft, kindSchema);
    const all = extra.length
      ? [...kindSchema.layout, { title: UNRECOGNISED, groups: [{ title: `Fields Orca ${schema.orcaVersion} doesn’t list for a ${preset.kind}`, keys: extra }] }]
      : kindSchema.layout;
    return filterLayout(all, schema, { mode, query, changedOnly }, (k) => k in draft);
  }, [schema, kindSchema, preset, draft, mode, query, changedOnly]);

  if (schemaError) return <div class="print-settings-error">Couldn’t load Orca’s setting definitions: {schemaError}</div>;
  if (!schema || !kindSchema) return <div class="print-settings-notice">Loading Orca’s setting definitions…</div>;

  const tabs = [...pages.map((p) => p.title), CHANGES];
  const current = Math.min(page, tabs.length - 1);
  const showingChanges = tabs[current] === CHANGES;

  const commit = (key: string, value: OrcaValue) => {
    setDraft((d) => setOverride(preset, d, key, value, schema.options[key]));
  };
  const reset = (key: string) => {
    setDraft((d) => clearOverride(d, key));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };
  const setError = (key: string, err: string | null) => {
    setErrors((e) => {
      if ((e[key] ?? null) === err) return e;
      const n = { ...e };
      if (err) n[key] = err; else delete n[key];
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      const effectiveHost = resolveField(preset, draft, 'print_host', schema.options['print_host']).value;
      const next = await savePreset({
        ...preset,
        overrides: draft,
        // The send-to-printer list reads `address`; keep it on the edited host.
        address: preset.kind === 'printer' && typeof effectiveHost === 'string' && effectiveHost.trim()
          ? effectiveHost.trim() : preset.kind === 'printer' ? undefined : preset.address,
      });
      onSaved(next);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const chain = preset.parents.map((p) => p.name);

  return (
    <section class="print-preset-editor">
      <header class="print-preset-editor-head">
        <button
          type="button"
          class="btn btn-secondary"
          onClick={() => { if (!dirty || confirm('Discard unsaved preset changes?')) onBack(); }}
        >
          ← Back
        </button>
        <div class="print-preset-editor-title">
          <h4>{preset.name}</h4>
          <p class="print-settings-help">
            {describeSource(preset)}
            {chain.length > 0 && <> · inherits {chain.join(' → ')}</>}
          </p>
        </div>
      </header>

      <div class="print-settings-toolbar print-preset-editor-toolbar">
        <input
          type="search"
          placeholder="Search settings…"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        <select
          value={mode}
          title="Which of Orca's option levels to show"
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as OrcaMode)}
        >
          {(Object.keys(MODE_LABEL) as OrcaMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
        </select>
        <label class="print-preset-editor-toggle">
          <input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly((e.target as HTMLInputElement).checked)} />
          <span>Changed only</span>
        </label>
      </div>

      <div class="print-preset-editor-body">
        <nav class="print-preset-editor-pages">
          {tabs.map((t, i) => (
            <button
              key={t}
              type="button"
              class={`print-preset-editor-page${i === current ? ' active' : ''}`}
              onClick={() => setPage(i)}
            >
              {t}
              {t === CHANGES && <span class="print-settings-tab-count">{changes.length}</span>}
            </button>
          ))}
        </nav>

        <div class="print-preset-editor-fields">
          {showingChanges ? (
            changes.length === 0 ? (
              <div class="print-settings-empty">No edits — this preset is exactly as imported.</div>
            ) : (
              <ul class="print-preset-editor-changes">
                {changes.map((c) => (
                  <li key={c.key}>
                    <span class="print-preset-field-label">{c.def?.fullLabel ?? c.def?.label ?? c.key}</span>
                    <span class="print-preset-editor-change">
                      <s>{describeValue(c.from, c.def)}</s> → <strong>{describeValue(c.to, c.def)}</strong>
                    </span>
                    <span class="print-preset-field-origin">was from {describeOrigin(c.fromOrigin)}</span>
                    <button type="button" class="btn btn-secondary" onClick={() => reset(c.key)}>Reset</button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            pages[current]?.groups.map((g) => (
              <fieldset key={g.title} class="print-preset-group">
                <legend>{g.title}</legend>
                {g.keys.map((key) => (
                  <FieldRow
                    key={key}
                    fieldKey={key}
                    def={schema.options[key]}
                    state={resolveField(preset, draft, key, schema.options[key])}
                    listLike={!!schema.options[key] && isListLike(key, schema.options[key], preset.kind, extruderKeys)}
                    error={errors[key]}
                    onCommit={(v) => commit(key, v)}
                    onReset={() => reset(key)}
                    onError={(err) => setError(key, err)}
                  />
                ))}
              </fieldset>
            ))
          )}
          {!showingChanges && pages.length === 0 && <div class="print-settings-empty">No settings match.</div>}
        </div>
      </div>

      <footer class="print-preset-editor-foot">
        <span class="print-preset-editor-status">
          {errorCount > 0
            ? `${errorCount} field${errorCount === 1 ? '' : 's'} need fixing`
            : dirty ? 'Unsaved changes' : `${changes.length} edit${changes.length === 1 ? '' : 's'} saved`}
        </span>
        {saveError && <span class="print-settings-error">{saveError}</span>}
        <button type="button" class="btn btn-secondary" disabled={!dirty || saving} onClick={() => { setDraft(saved); setErrors({}); }}>
          Discard
        </button>
        <button type="button" class="btn btn-primary" disabled={!dirty || saving || errorCount > 0} onClick={() => void handleSave()}>
          Save
        </button>
      </footer>
    </section>
  );
}

interface FieldRowProps {
  fieldKey: string;
  def: OrcaOptionDef | undefined;
  state: FieldState;
  listLike: boolean;
  error?: string;
  onCommit: (value: OrcaValue) => void;
  onReset: () => void;
  onError: (err: string | null) => void;
}

function FieldRow({ fieldKey, def, state, listLike, error, onCommit, onReset, onError }: FieldRowProps) {
  // Text being typed that doesn't parse yet. The draft only ever holds values
  // libslic3r would accept, so an invalid entry lives here until it's fixed.
  const [pending, setPending] = useState<string[] | null>(null);
  const label = def?.label || def?.fullLabel || fieldKey;

  const cells = pending ?? (def ? toCells(state.value, def.type) : [typeof state.value === 'string' ? state.value : JSON.stringify(state.value ?? '')]);

  const update = (next: string[]) => {
    if (!def) {
      setPending(next);
      let value: OrcaValue = next[0];
      // Unknown fields that held JSON (an array, a number) go back as JSON.
      if (typeof state.base !== 'string') { try { value = JSON.parse(next[0]) as OrcaValue; } catch { /* keep text */ } }
      onCommit(value);
      return;
    }
    const normalized = next.map((c) => normalizeCell(c, def));
    const err = validateCells(normalized, def);
    onError(err);
    if (err) { setPending(next); return; }
    setPending(null);
    onCommit(fromCells(normalized, def.type));
  };

  const setCell = (i: number, v: string) => update(cells.map((c, j) => (j === i ? v : c)));

  const handleReset = () => { setPending(null); onReset(); };

  const title = [def?.fullLabel && def.fullLabel !== label ? def.fullLabel : null, def?.tooltip, fieldKey].filter(Boolean).join('\n\n');

  return (
    <div class={`print-preset-field${state.overridden ? ' is-edited' : ''}${error ? ' is-invalid' : ''}`}>
      <div class="print-preset-field-head">
        <label class="print-preset-field-label" title={title}>{label}</label>
        <div class="print-preset-field-meta">
          {state.overridden ? (
            <>
              <span class="print-preset-field-origin is-edited">
                was {describeValue(state.base, def)} · {describeOrigin(state.baseOrigin)}
              </span>
              <button type="button" class="print-preset-field-reset" title="Put back the imported value" onClick={handleReset}>↺</button>
            </>
          ) : (
            <span class="print-preset-field-origin">{describeOrigin(state.origin)}</span>
          )}
        </div>
      </div>
      <div class="print-preset-field-input">
        {!def ? (
          <textarea rows={1} value={cells[0] ?? ''} onInput={(e) => update([(e.target as HTMLTextAreaElement).value])} />
        ) : listLike ? (
          <textarea
            rows={Math.min(8, Math.max(2, cells.length))}
            value={cells.join('\n')}
            placeholder="One per line"
            onInput={(e) => update((e.target as HTMLTextAreaElement).value.split('\n').filter((l) => l.trim() !== ''))}
          />
        ) : (
          (cells.length ? cells : ['']).map((cell, i) => (
            <span key={i} class="print-preset-cell">
              {cellLabel(fieldKey, i, cells.length) && <span class="print-preset-cell-label">{cellLabel(fieldKey, i, cells.length)}</span>}
              <CellInput fieldKey={fieldKey} def={def} value={cell} onChange={(v) => setCell(i, v)} />
            </span>
          ))
        )}
        {def?.sidetext && !listLike && <span class="print-preset-field-unit">{def.sidetext}</span>}
      </div>
      {error && <div class="print-preset-field-error">{error}</div>}
    </div>
  );
}

function CellInput({ fieldKey, def, value, onChange }: { fieldKey: string; def: OrcaOptionDef; value: string; onChange: (v: string) => void }) {
  const type = elementType(def.type);

  // Nullable vectors (a filament's retraction overrides): "nil" means use the
  // printer's value, so the switch is whether this filament sets one at all.
  if (def.nullable && isVectorType(def.type)) {
    const inherits = value === ORCA_NIL;
    return (
      <span class="print-preset-nullable">
        <label title="Set a value for this filament instead of using the printer's">
          <input
            type="checkbox"
            checked={!inherits}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked
              ? (Array.isArray(def.default) ? def.default[0] : def.default) ?? '0'
              : ORCA_NIL)}
          />
        </label>
        {inherits
          ? <span class="print-preset-field-origin">printer’s value</span>
          : <CellInput fieldKey={fieldKey} def={{ ...def, nullable: false }} value={value} onChange={onChange} />}
      </span>
    );
  }

  if (type === 'bool') {
    return <input type="checkbox" checked={value === '1'} onChange={(e) => onChange((e.target as HTMLInputElement).checked ? '1' : '0')} />;
  }
  if (type === 'enum' && def.enumValues?.length) {
    const known = def.enumValues.includes(value);
    return (
      <select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
        {!known && <option value={value}>{value || '(unset)'}</option>}
        {def.enumValues.map((v, i) => <option key={v} value={v}>{def.enumLabels?.[i] ?? v}</option>)}
      </select>
    );
  }
  if (def.guiType === 'color') {
    return (
      <span class="print-preset-color">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onInput={(e) => onChange((e.target as HTMLInputElement).value.toUpperCase())} />
        <input type="text" value={value} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />
      </span>
    );
  }
  if (type === 'string' && isLongText(fieldKey, def)) {
    return <textarea class="print-preset-code" rows={6} spellcheck={false} value={value} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />;
  }
  if (type === 'percent') {
    return (
      <input
        type="text"
        inputMode="decimal"
        class="print-preset-number"
        value={value.endsWith('%') ? value.slice(0, -1) : value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    );
  }
  const numeric = type === 'int' || type === 'float' || type === 'floatOrPercent';
  const listId = def.guiType === 'f_enum_open' && def.enumValues?.length ? `pe-${fieldKey}` : undefined;
  return (
    <>
      <input
        type="text"
        inputMode={numeric ? 'decimal' : undefined}
        class={numeric ? 'print-preset-number' : undefined}
        list={listId}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
      {listId && <datalist id={listId}>{def.enumValues!.map((v) => <option key={v} value={v} />)}</datalist>}
    </>
  );
}
