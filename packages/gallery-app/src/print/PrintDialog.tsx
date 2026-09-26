// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  createSlicerBackend,
  evaluateAuthoredPlateFit,
  excludeAreaBboxes,
  findPlateOverlaps,
  isDegenerateExcludeArea,
  printerBedFromConfig,
  startPrint,
  uploadGcode,
  type AuthoredFitResult,
  type PlateFootprint,
  type PostProcessReport,
  type PrinterBed,
  type SlicerBackend,
} from '@3d-gallery/print-toolkit';
import { Modal } from './Modal.js';
import { Sheet } from './Sheet.js';
import { setPrintLeaveGuard } from './nav-guard.js';
import { SliceProgress } from './SliceProgress.js';
import { GcodePreview } from './GcodePreview.js';
import { PlateCanvas3D, type PlateCanvas3DObject } from './PlateCanvas3D.js';
import { listPresets, type PrintPreset } from './print-storage.js';
import { flattenPresetForSlicer } from './preset-flatten.js';
import {
  filamentSlotCount,
  filamentSpecs,
  nozzleSpec,
  processSpecs,
  speedSpecs,
  type SpecRow,
} from './preset-spec.js';
import {
  getPlate,
  getProject,
  instanceId,
  savePlate,
  type ObjectOverrides,
  type Plate,
  type PlateScale,
  type PlateTransform,
} from './plate-store.js';
import {
  arrangeInstances,
  buildInstances,
  instanceSize,
  toFootprints,
  withArrangedGaps,
  type PlateInstance,
} from './plate-geometry.js';
import { resolvePlate, type ResolveReport, type ResolvedPlateObject } from './plate-resolve.js';
import {
  BED_SURFACES,
  DEFAULT_BED_SURFACE,
  bedSurfaceTempKey,
  processFromProfile,
  sliceInstances,
  type BedSurface,
} from './plate-slice.js';
import {
  INFILL_PATTERNS,
  LAYER_HEIGHTS,
  buildProcessConfig,
  listTemplates,
  upsertUserTemplate,
  type ProcessSettings,
  type ProcessTemplate,
  type SupportStyle,
} from './process-templates.js';
import {
  deleteSlicePreset,
  listSlicePresets,
  saveLastPrintPreset,
  saveSlicePreset,
  type SlicePreset,
} from './slice-presets.js';
import type { Quat } from './mesh-bounds.js';

interface PrintDialogProps {
  plateId: string;
  onClose: () => void;
  /** Opens the OrcaSlicer preset panel; closing it returns to this plate. */
  onOpenSettings: () => void;
}

type Status = 'idle' | 'slicing' | 'preview' | 'uploading' | 'starting' | 'done' | 'error';

interface Progress {
  stage: string;
  pct: number;
  message?: string;
}

const LS_LAST_SELECTIONS = '3dg:print:last-selections';

// Post-process helpers (parsePrintableArea, gcodeXYBounds, translateGcodeXY,
// postProcessGcode) now live in @3d-gallery/print-toolkit — generic Klipper/
// Marlin logic, unit-tested in the toolkit's vitest suite.

const STANDARD_TEMPLATE_ID = 'builtin:standard';
const DEFAULT_LAYER_HEIGHT = '0.20';


/** Provenance keys copies the same way the plate does. */
function objectKey(o: ResolvedPlateObject): string {
  return `${o.itemId}:${o.copy}`;
}

/** `undefined` means "whatever the process says" — an untouched part adds no
 *  per-object config to the slice at all. */
const SUPPORT_CHOICES: Array<{ value: SupportStyle | undefined; label: string }> = [
  { value: undefined, label: 'Default' },
  { value: 'none', label: 'Off' },
  { value: 'normal', label: 'Normal' },
  { value: 'tree', label: 'Tree' },
];

/** Sentinel option value — no preset can collide with it. */
const ADD_FILAMENT = '__add-filament';

const BRIM_CHOICES: Array<{ value: boolean | undefined; label: string }> = [
  { value: undefined, label: 'Default' },
  { value: true, label: 'On' },
  { value: false, label: 'Off' },
];

function mm(value: number): string {
  return String(Math.round(value * 10) / 10);
}


function fitSummary(fit: AuthoredFitResult): string {
  if (fit.status === 'fits') return 'fits';
  if (fit.unplacedIds.length > 0) {
    const n = fit.unplacedIds.length;
    return n === 1 ? '1 object does not fit' : `${n} objects do not fit`;
  }
  if (fit.status === 'warn') {
    const n = fit.reasons.length;
    return `fits, ${n} warning${n === 1 ? '' : 's'}`;
  }
  return fit.reasons[0] ?? 'does not fit';
}

function gcodeFileName(plateName: string): string {
  const safe = plateName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe || 'plate'}.gcode`;
}

// v1 blobs were written when adaptive layer height was one template's trait
// rather than the editor's default, so their stored `false` records the old
// default, not a choice. Bumped once, on read.
const SELECTIONS_VERSION = 2;

export interface LastSelections {
  v?: number;
  printerId?: string;
  filamentId?: string;
  templateId?: string;
  layerHeight?: string;
  address?: string;
  processOverride?: ProcessSettings;
  preheat?: boolean;
  centerOnBed?: boolean;
  bedSurface?: BedSurface;
  clearExclusionZones?: boolean;
}

export function loadLastSelections(): LastSelections {
  try {
    const raw = localStorage.getItem(LS_LAST_SELECTIONS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LastSelections;
    if ((parsed.v ?? 1) < SELECTIONS_VERSION && parsed.processOverride) {
      parsed.processOverride = { ...parsed.processOverride, adaptiveLayerHeight: true };
    }
    return { ...parsed, v: SELECTIONS_VERSION };
  } catch { return {}; }
}

function saveLastSelections(sel: LastSelections): void {
  try {
    localStorage.setItem(LS_LAST_SELECTIONS, JSON.stringify({ ...sel, v: SELECTIONS_VERSION }));
  } catch { /* ignore */ }
}

/** Kept in step with the `.pd-split` block in `style.css`: this decides which
 *  branch renders, that decides how it looks. */
const SPLIT_QUERY = '(min-width: 1100px)';

/**
 * True once the viewport is wide enough to show the plate and its print setup
 * at the same time. Below it the two stay separate screens — a phone has no
 * room for a 3D stage and a settings column at once.
 */
function useSplitLayout(): boolean {
  const [split, setSplit] = useState(() => window.matchMedia(SPLIT_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(SPLIT_QUERY);
    const onChange = () => setSplit(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return split;
}

export function PrintDialog({ plateId, onClose, onOpenSettings }: PrintDialogProps) {
  const [printers, setPrinters] = useState<PrintPreset[]>([]);
  const [filaments, setFilaments] = useState<PrintPreset[]>([]);
  const [templates, setTemplates] = useState<ProcessTemplate[]>(listTemplates());

  const initialSel = loadLastSelections();
  const [printerId, setPrinterId] = useState<string>(initialSel.printerId ?? '');
  const [filamentId, setFilamentId] = useState<string>(initialSel.filamentId ?? '');
  const [templateId, setTemplateId] = useState<string>(initialSel.templateId ?? STANDARD_TEMPLATE_ID);
  const [layerHeight, setLayerHeight] = useState<string>(initialSel.layerHeight ?? DEFAULT_LAYER_HEIGHT);
  const [address, setAddress] = useState<string>(initialSel.address ?? '');

  const currentTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0],
    [templates, templateId],
  );
  // Editable working copy of the template (user overrides via the inline
  // controls). Reset when template changes.
  const [proc, setProc] = useState<ProcessSettings>({
    ...(currentTemplate?.settings ?? templates[0].settings),
    ...initialSel.processOverride,
  });

  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Progress>({ stage: '', pct: 0 });
  const [busySince, setBusySince] = useState<number>(0);
  const [cancelling, setCancelling] = useState<boolean>(false);
  // The overlay's Cancel has to reach the backend that `handleSlice` created,
  // and it has to say "cancelled" rather than let the rejection land as an
  // error the user did not cause.
  const backendRef = useRef<SlicerBackend | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saveTemplateName, setSaveTemplateName] = useState<string>('');
  const [slicedGcode, setSlicedGcode] = useState<string>('');
  const [uploadName, setUploadName] = useState<string>('');
  const [preheat, setPreheat] = useState<boolean>(initialSel.preheat ?? true);
  const [centerOnBed, setCenterOnBed] = useState<boolean>(initialSel.centerOnBed ?? true);
  const [bedSurface, setBedSurface] = useState<BedSurface>(initialSel.bedSurface ?? DEFAULT_BED_SURFACE);
  const [clearExclusionZones, setClearExclusionZones] = useState<boolean>(initialSel.clearExclusionZones ?? false);
  const [postReport, setPostReport] = useState<PostProcessReport | null>(null);
  const [slicePresets, setSlicePresets] = useState<SlicePreset[]>(listSlicePresets());
  const [savePresetName, setSavePresetName] = useState<string>('');

  // `plate` is a working copy: qty, removals and drags edit it in memory and
  // only reach IndexedDB on Save, so the user can back out of a change.
  const [plate, setPlate] = useState<Plate | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [dirty, setDirty] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [plateError, setPlateError] = useState<string>('');
  const [resolved, setResolved] = useState<ResolveReport | null>(null);
  const [resolveProgress, setResolveProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [objectsOpen, setObjectsOpen] = useState(false);
  // Only consulted below the split breakpoint; wide layouts show both at once.
  const [screen, setScreen] = useState<'plate' | 'setup'>('plate');
  const split = useSplitLayout();
  const [processEditOpen, setProcessEditOpen] = useState(false);
  const [addFilamentOpen, setAddFilamentOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const [p, f] = await Promise.all([listPresets('printer'), listPresets('filament')]);
      setPrinters(p);
      setFilaments(f);
      setPrinterId((cur) => (cur && p.some((x) => x.id === cur) ? cur : p[0]?.id ?? ''));
      setFilamentId((cur) => (cur && f.some((x) => x.id === cur) ? cur : f[0]?.id ?? ''));
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await getPlate(plateId);
        if (cancelled) return;
        if (!p) { setPlateError(`Plate not found: ${plateId}`); return; }
        setPlate(p);
        setDirty(false);
        // A plate made from a model's print plates carries the model's
        // recommended profile; that, not the last plate's tweaks, is the start.
        if (p.profile) setProc(processFromProfile(p.profile));
        const project = await getProject(p.projectId);
        if (!cancelled) setProjectName(project?.name ?? '');
      } catch (err) {
        if (!cancelled) setPlateError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [plateId]);

  // Re-resolving is expensive (mesh reads + recentering), so it keys off the
  // item recipe only: moving an object rewrites `plate.transforms` and must
  // not throw the resolved geometry away.
  const itemsSignature = plate ? plate.items.map((i) => `${i.id}:${i.key}:${i.qty}`).join('|') : null;
  useEffect(() => {
    if (!plate || itemsSignature === null) return;
    let cancelled = false;
    const target = plate;
    setResolved(null);
    setResolveProgress({ done: 0, total: target.items.length, label: '' });
    void (async () => {
      try {
        const report = await resolvePlate(target, (done, total, label) => {
          if (!cancelled) setResolveProgress({ done, total, label });
        });
        if (cancelled) return;
        setResolved(report);
      } catch (err) {
        if (!cancelled) setPlateError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setResolveProgress(null);
      }
    })();
    return () => { cancelled = true; };
  }, [itemsSignature]);

  const resolvedObjects = resolved?.objects ?? [];

  // Copies paired with the pose the plate stores for them, each measured
  // under that pose. Everything below reads footprints, never raw meshes.
  const instances = useMemo<PlateInstance[]>(
    () => (plate ? buildInstances(plate, resolvedObjects) : []),
    [plate, resolved],
  );
  const footprints = useMemo<PlateFootprint[]>(() => toFootprints(instances), [instances]);

  // A copy the user has never positioned has nowhere to be. Placing it on open
  // is a real edit to the plate, so it shows up as unsaved rather than being
  // written behind the user's back.
  useEffect(() => {
    if (!plate || instances.length === 0 || status !== 'idle') return;
    const filled = withArrangedGaps(plate, instances);
    if (!filled) return;
    setPlate({ ...plate, transforms: filled });
    setDirty(true);
  }, [instances]);

  // Exclusion zones are stripped from the slice config when the user opts
  // out, so the fit oracle has to see the same bed the slicer will.
  const printerBeds = useMemo(() => {
    const map = new Map<string, PrinterBed>();
    for (const p of printers) {
      const bed = printerBedFromConfig(flattenPresetForSlicer(p), { ignoreExclusions: clearExclusionZones });
      if (bed) map.set(p.id, bed);
    }
    return map;
  }, [printers, clearExclusionZones]);

  // Every printer is asked the same question about the same arrangement, so
  // the dropdown's verdicts and the one the slice path uses cannot diverge.
  const fits = useMemo(() => {
    const map = new Map<string, AuthoredFitResult>();
    if (footprints.length === 0) return map;
    for (const [id, bed] of printerBeds) {
      map.set(id, evaluateAuthoredPlateFit(footprints, bed));
    }
    return map;
  }, [footprints, printerBeds]);

  const selectedBed = printerBeds.get(printerId) ?? null;
  const fit = fits.get(printerId) ?? null;
  const plateSize = fit?.bounds ?? null;
  const unplaced = useMemo(() => new Set(fit?.unplacedIds ?? []), [fit]);

  // A plate that will not go on this bed is still worth drawing, so it falls
  // back to centring — the user needs to see what is too big to place.
  const plateOffset = useMemo(() => {
    if (fit?.offset) return fit.offset;
    if (!selectedBed || !plateSize) return { dx: 0, dy: 0 };
    return {
      dx: (selectedBed.bed.minX + selectedBed.bed.maxX) / 2 - plateSize.centerX,
      dy: (selectedBed.bed.minY + selectedBed.bed.maxY) / 2 - plateSize.centerY,
    };
  }, [fit, selectedBed, plateSize]);

  // Parts interpenetrating on the plate is a plate problem, not a printer
  // one, so it is reported separately from fit — no bed will fix it.
  const overlaps = useMemo(() => {
    const names = new Map(footprints.map((f) => [f.id, f.name]));
    const pairs = findPlateOverlaps(footprints);
    return [...new Set(pairs.map(([a, b]) => `${names.get(a)} and ${names.get(b)}`))];
  }, [footprints]);

  const canvas3dObjects = useMemo<PlateCanvas3DObject[]>(
    () => instances.map((inst) => ({
      id: inst.id,
      label: inst.label,
      format: inst.format,
      data: inst.data,
      meshKey: plate?.items.find((i) => i.id === inst.itemId)?.key ?? inst.itemId,
      transform: inst.transform,
      ghost: unplaced.has(inst.id),
    })),
    [instances, unplaced, plate],
  );

  const selectedPrinter = printers.find((p) => p.id === printerId);
  const selectedFilament = filaments.find((p) => p.id === filamentId);
  const printerFlat = useMemo(
    () => (selectedPrinter ? flattenPresetForSlicer(selectedPrinter) : null),
    [selectedPrinter],
  );
  const filamentFlat = useMemo(
    () => (selectedFilament ? flattenPresetForSlicer(selectedFilament) : null),
    [selectedFilament],
  );

  // Bed exclusion notices come from the raw preset, not from `selectedBed` —
  // the user needs to see the real zones even while overriding them.
  const excludeField = printerFlat?.['bed_exclude_area'];
  const degenerateExclusion = excludeField ? isDegenerateExcludeArea(excludeField) : false;
  const realExclusions = excludeField && !degenerateExclusion ? excludeAreaBboxes(excludeField) : [];

  // When the user picks a different template, seed the inline controls from
  // its defaults. Skipped on mount, or the overrides restored from the last
  // session would be thrown away before they were ever shown.
  const seededTemplate = useRef(templateId);
  useEffect(() => {
    if (seededTemplate.current === templateId) return;
    seededTemplate.current = templateId;
    if (currentTemplate) setProc(currentTemplate.settings);
  }, [templateId]);

  useEffect(() => {
    const printer = printers.find((p) => p.id === printerId);
    if (printer?.address && !address) setAddress(printer.address);
  }, [printerId, printers]);

  const isCompatible = (compat: string[] | undefined): boolean => {
    if (!compat || compat.length === 0) return true;
    if (!selectedPrinter) return true;
    return compat.includes(selectedPrinter.name);
  };
  const compatibleFilaments = filaments.filter((f) => isCompatible(f.compatiblePrinters));
  // If the current selection isn't in the compat list (either because the
  // filament preset lists specific printers that don't include this one, or
  // because we loaded a saved slice preset with a printer/filament combo the
  // user wants regardless), prepend it so it stays selectable.
  const currentFilament = filaments.find((f) => f.id === filamentId);
  const filamentsForPrinter = currentFilament && !compatibleFilaments.some((f) => f.id === filamentId)
    ? [currentFilament, ...compatibleFilaments]
    : compatibleFilaments;

  // (Previously we auto-cleared filamentId when it wasn't in the compat list —
  // that nuked user selections whenever a saved preset restored a filament
  // Orca marked incompatible with the picked printer. Now we let the user
  // keep whatever they chose; the dropdown just shows the compat set + the
  // current selection if it's not already there.)

  const canPrint =
    !!printerId && !!filamentId && (status === 'idle' || status === 'error')
    && instances.length > 0 && fit?.status !== 'blocked';
  const anyPresets = printers.length > 0 || filaments.length > 0;

  const handleRemoveItem = (itemId: string) => {
    if (!plate || status !== 'idle') return;
    setPlate({ ...plate, items: plate.items.filter((i) => i.id !== itemId) });
    setDirty(true);
  };

  const setTransform = (id: string, next: Partial<PlateTransform>) => {
    if (!plate || status !== 'idle') return;
    const current = instances.find((inst) => inst.id === id)?.transform;
    if (!current) return;
    setPlate({
      ...plate,
      transforms: { ...(plate.transforms ?? {}), [id]: { ...current, ...next } },
    });
    setDirty(true);
  };

  /** The gizmo reports a whole pose, not a delta. */
  const handleTransform = (
    id: string,
    next: { x: number; y: number; rot: Quat; scale: PlateScale },
  ) => setTransform(id, next);

  /** Deleting one copy has to close the gap in the copy indices: the plate
   *  stores a pose under `<itemId>:<copy>` and rebuilds copies 0..qty-1, so a
   *  hole would silently hand every later copy the pose of its neighbour. */
  const handleDeleteObject = (id: string) => {
    if (!plate || status !== 'idle') return;
    const sep = id.lastIndexOf(':');
    const itemId = id.slice(0, sep);
    const copy = Number(id.slice(sep + 1));
    const item = plate.items.find((i) => i.id === itemId);
    if (!item || !Number.isInteger(copy)) return;

    // Both maps are keyed by copy, so both shift the same way.
    const shift = <T,>(map: Record<string, T> | undefined): Record<string, T> => {
      const out: Record<string, T> = {};
      for (const [key, value] of Object.entries(map ?? {})) {
        const at = key.lastIndexOf(':');
        const owner = key.slice(0, at);
        const index = Number(key.slice(at + 1));
        if (owner !== itemId) { out[key] = value; continue; }
        if (index === copy) continue;
        out[instanceId(owner, index > copy ? index - 1 : index)] = value;
      }
      return out;
    };

    setSelectedObjectId(null);
    setPlate({
      ...plate,
      items: item.qty > 1
        ? plate.items.map((i) => (i.id === itemId ? { ...i, qty: i.qty - 1 } : i))
        : plate.items.filter((i) => i.id !== itemId),
      transforms: shift(plate.transforms),
      overrides: shift(plate.overrides),
    });
    setDirty(true);
  };

  /** An object whose every override is back to "default" carries no entry, so
   *  "has this been tuned?" stays a question about the keys that exist. */
  const handleOverride = (id: string, patch: ObjectOverrides) => {
    if (!plate || status !== 'idle') return;
    const overrides = { ...(plate.overrides ?? {}) };
    const next: ObjectOverrides = { ...overrides[id], ...patch };
    for (const key of Object.keys(next) as Array<keyof ObjectOverrides>) {
      if (next[key] === undefined) delete next[key];
    }
    if (Object.keys(next).length === 0) delete overrides[id];
    else overrides[id] = next;
    setPlate({ ...plate, overrides });
    setDirty(true);
  };

  const handleArrange = () => {
    if (!plate || instances.length === 0 || status !== 'idle') return;
    const spots = arrangeInstances(instances);
    const transforms: Record<string, PlateTransform> = { ...(plate.transforms ?? {}) };
    for (const inst of instances) {
      const at = spots[inst.id];
      if (at) transforms[inst.id] = { ...inst.transform, x: at.x, y: at.y };
    }
    setPlate({ ...plate, transforms });
    setDirty(true);
  };

  const currentSelections = (): LastSelections => ({
    printerId, filamentId, templateId, layerHeight, address,
    processOverride: proc, preheat, centerOnBed, bedSurface, clearExclusionZones,
  });

  /** Save persists the plate — its parts and their arrangement. Printer,
   *  filament and process are global settings shared by every plate, so they
   *  ride along in localStorage rather than on the plate record. */
  const handleSave = async () => {
    saveLastSelections(currentSelections());
    if (!plate) return;
    setPlate(await savePlate(plate));
    setDirty(false);
    setSavedAt(Date.now());
  };

  const busy = status === 'slicing' || status === 'uploading' || status === 'starting';

  // Back closes this dialog through the router, which never reaches
  // `closeGuarded` — without this, the browser's Back button would discard
  // unsaved plate edits silently.
  //
  // The guard reads refs rather than closing over `dirty`/`busy`, and is
  // installed once rather than re-armed per change. Effects flush after paint,
  // so an effect keyed on `[dirty, busy]` leaves a window in which the rail
  // already reads "Saved" but the guard that clears on save has not run yet —
  // and Back inside that window prompts about changes that no longer exist.
  const dirtyRef = useRef(dirty);
  const busyRef = useRef(busy);
  dirtyRef.current = dirty;
  busyRef.current = busy;
  useEffect(() => {
    setPrintLeaveGuard(() => {
      if (busyRef.current) return false;
      if (!dirtyRef.current) return true;
      return confirm('Discard unsaved changes to this plate?');
    });
    return () => setPrintLeaveGuard(null);
  }, []);

  const closeGuarded = () => {
    // Closing mid-slice would strand the worker: the dialog owns the only
    // reference to it, so nothing would ever terminate it.
    if (busy) return;
    if (dirty && !confirm('Discard unsaved changes to this plate?')) return;
    onClose();
  };

  // Settings replaces this dialog in the portal, so it has to clear the same
  // bar closing does — the plate is re-read from the store on the way back.
  const openSettingsGuarded = () => {
    if (busy) return;
    if (dirty && !confirm('Discard unsaved changes to this plate?')) return;
    onOpenSettings();
  };

  /**
   * Stop an in-flight slice.
   *
   * `cancel()` alone is not enough: a running WASM slice blocks the worker
   * thread, so the cancel message is not read until the slice it was meant to
   * stop has already finished. Terminating the worker is what actually ends
   * it — `getWorker()` builds a fresh one on the next slice.
   */
  const handleCancelSlice = () => {
    if (!backendRef.current) return;
    setCancelling(true);
    cancelledRef.current = true;
    backendRef.current.cancel();
    backendRef.current.destroy();
    backendRef.current = null;
  };

  const handleSlice = async () => {
    setErrorMsg('');
    saveLastSelections(currentSelections());

    const printer = printers.find((p) => p.id === printerId);
    const filament = filaments.find((p) => p.id === filamentId);
    if (!printer || !filament || !printerFlat || !filamentFlat) {
      setErrorMsg('Missing preset selection.');
      setStatus('error');
      return;
    }
    if (!plate || resolvedObjects.length === 0) {
      setErrorMsg('Nothing on the plate to slice.');
      setStatus('error');
      return;
    }
    // Slicing what you can't reopen is the confusing part, so the plate is
    // committed before any g-code exists.
    if (dirty) await handleSave();

    let backend: SlicerBackend | null = null;
    cancelledRef.current = false;
    setCancelling(false);
    setBusySince(Date.now());
    try {
      const offset = fit?.offset;
      if (!offset) throw new Error('This plate does not fit the selected printer’s bed.');

      backend = createSlicerBackend();
      backendRef.current = backend;
      setStatus('slicing');
      setProgress({ stage: 'slicing', pct: 0, message: `Slicing with ${backend.engineName}…` });
      const sliced = await sliceInstances(
        backend,
        plate,
        instances,
        offset,
        { printer, filament, proc, layerHeight, bedSurface, preheat, centerOnBed, clearExclusionZones },
        (stage, pct, message) => setProgress({ stage, pct, message }),
      );
      const report = sliced.report;
      const gcodeWithProvenance = sliced.gcode;

      setSlicedGcode(gcodeWithProvenance);
      setPostReport(report);
      setUploadName(gcodeFileName(plate.name));
      setStatus('preview');

      // Pin the exact combo that just sliced as "Last print". Overwritten
      // on every successful slice — the chip is always your most recent
      // known-working configuration.
      saveLastPrintPreset({
        printerId, filamentId, templateId, layerHeight, proc, preheat, centerOnBed, bedSurface, clearExclusionZones,
      });
      setSlicePresets(listSlicePresets());
    } catch (err) {
      // A cancelled slice rejects too; that rejection is the user's own doing
      // and must not be reported back to them as a failure.
      if (cancelledRef.current) {
        setStatus('idle');
        setProgress({ stage: '', pct: 0 });
      } else {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    } finally {
      backend?.destroy();
      backendRef.current = null;
      setCancelling(false);
    }
  };

  const handleSend = async () => {
    setErrorMsg('');
    try {
      const encoder = new TextEncoder();
      const gcodeBytes = encoder.encode(slicedGcode);

      setBusySince(Date.now());
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
    }
  };

  const handleBackToConfig = () => {
    setSlicedGcode('');
    setStatus('idle');
    setProgress({ stage: '', pct: 0 });
  };

  const updateProc = <K extends keyof ProcessSettings>(k: K, v: ProcessSettings[K]) => {
    setProc((prev) => ({ ...prev, [k]: v }));
  };

  const handleSaveTemplate = () => {
    const name = saveTemplateName.trim();
    if (!name) return;
    const saved = upsertUserTemplate(name, proc);
    setTemplates(listTemplates());
    setTemplateId(saved.id);
    setSaveTemplateName('');
  };

  const loadSlicePreset = (p: SlicePreset) => {
    setPrinterId(p.config.printerId);
    setFilamentId(p.config.filamentId);
    setTemplateId(p.config.templateId);
    setLayerHeight(p.config.layerHeight);
    setProc(p.config.proc);
    setPreheat(p.config.preheat);
    setCenterOnBed(p.config.centerOnBed);
    if (p.config.bedSurface) setBedSurface(p.config.bedSurface as BedSurface);
    if (typeof p.config.clearExclusionZones === 'boolean') setClearExclusionZones(p.config.clearExclusionZones);
  };

  const handleSaveSlicePreset = () => {
    const name = savePresetName.trim();
    if (!name) return;
    saveSlicePreset(name, {
      printerId, filamentId, templateId, layerHeight, proc, preheat, centerOnBed, bedSurface, clearExclusionZones,
    });
    setSlicePresets(listSlicePresets());
    setSavePresetName('');
  };

  const handleDeleteSlicePreset = (id: string) => {
    if (!confirm('Delete this saved slice preset?')) return;
    deleteSlicePreset(id);
    setSlicePresets(listSlicePresets());
  };

  const plateTitle = projectName
    ? `${projectName} / ${plate?.name ?? 'plate'}`
    : plate?.name ?? 'plate';

  // Rendered in both branches: slicing happens on the config screen, uploading
  // and print-start on the preview screen, and all three can look like a hang.
  const busyOverlay = busy ? (
    <SliceProgress
      title={
        status === 'slicing' ? `Slicing ${plateTitle}`
          : status === 'uploading' ? 'Uploading g-code'
            : 'Starting print'
      }
      pct={progress.pct}
      message={progress.message ?? progress.stage}
      startedAt={busySince}
      cancelling={cancelling}
      onCancel={status === 'slicing' ? handleCancelSlice : undefined}
    />
  ) : null;

  // Once we have sliced g-code, swap the whole form for the preview screen.
  if (status === 'preview' || status === 'uploading' || status === 'starting' || status === 'done' || (status === 'error' && slicedGcode)) {
    const sending = status === 'uploading' || status === 'starting';
    const printersWithAddress = printers.filter((p) => (p.address ?? '').trim());
    const currentPrinterHasAddress = !!printers.find((p) => p.id === printerId)?.address;
    // Set of unique addresses from all printer presets — offer as a dropdown.
    const addressOptions: Array<{ label: string; value: string }> = [];
    const seen = new Set<string>();
    for (const p of printersWithAddress) {
      const a = p.address!;
      if (seen.has(a)) continue;
      seen.add(a);
      addressOptions.push({ label: `${p.name} (${a})`, value: a });
    }
    const isCustom = !!address && !seen.has(address);
    const done = status === 'done';

    return (
      <Modal title={`Preview — ${plateTitle}`} onClose={closeGuarded}>
        <GcodePreview gcode={slicedGcode} report={postReport} />
        <div class="print-dialog-send">
          <label class="print-dialog-row">
            <span>Send to</span>
            <select
              value={isCustom ? '__custom' : address}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                setAddress(v === '__custom' ? '' : v);
              }}
              disabled={sending || done}
            >
              {addressOptions.length === 0 && <option value="">(no saved printer addresses)</option>}
              {addressOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              <option value="__custom">Custom address…</option>
            </select>
          </label>
          {(isCustom || addressOptions.length === 0) && (
            <label class="print-dialog-row">
              <span>Moonraker address</span>
              <input
                type="text"
                placeholder="printer.local:7125"
                value={address}
                onInput={(e) => setAddress((e.target as HTMLInputElement).value)}
                disabled={sending || done}
              />
            </label>
          )}
          {!currentPrinterHasAddress && printers.find((p) => p.id === printerId) && (
            <div class="print-dialog-hint">
              The selected printer preset has no saved address. Set one in Print settings → Printers,
              or pick "Custom address…" above.
            </div>
          )}
        </div>
        {(sending || done) && (
          <div class="print-dialog-progress">
            <div class="print-dialog-progress-bar">
              <div class="print-dialog-progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress.pct * 100))}%` }} />
            </div>
            <div class="print-dialog-progress-status">{progress.message ?? progress.stage}</div>
          </div>
        )}
        {errorMsg && <div class="print-dialog-error">{errorMsg}</div>}
        <div class="print-dialog-actions">
          <button type="button" class="btn btn-secondary" onClick={handleBackToConfig} disabled={sending}>Back</button>
          <button
            type="button"
            class="btn btn-primary"
            onClick={handleSend}
            disabled={sending || done || !address.trim()}
          >
            {done ? 'Sent' : sending ? 'Sending…' : 'Send to printer'}
          </button>
        </div>
        {busyOverlay}
      </Modal>
    );
  }

  const objectCount = instances.length;

  const specList = (title: string, rows: SpecRow[]) =>
    rows.length === 0 ? null : (
      <div class="pd-specs">
        <div class="pd-specs-title">{title}</div>
        <dl class="pd-specs-list">
          {rows.map((row) => (
            <div key={row.label} class="pd-spec">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );

  // What the slicer will actually be handed, minus the bed-surface pins that
  // carry no speeds — so a speed shown here is a speed that gets sliced.
  const speedRows = speedSpecs({
    ...(printerFlat ?? {}),
    ...(filamentFlat ?? {}),
    ...buildProcessConfig(proc, layerHeight),
  });

  const tunedCount = Object.keys(plate?.overrides ?? {}).length;

  // Safe-zone and geometry checks, stated as verdicts rather than left for the
  // reader to infer from a scatter of warnings.
  const checks: Array<{ label: string; state: 'pass' | 'warn' | 'fail'; detail: string }> = [];
  checks.push(
    !selectedBed
      ? { label: 'Printer', state: 'fail', detail: 'none selected' }
      : !fit
        ? { label: 'Fits the bed', state: 'warn', detail: 'nothing to place' }
        : fit.status === 'blocked'
          ? { label: 'Fits the bed', state: 'fail', detail: fitSummary(fit) }
          : fit.status === 'warn'
            ? { label: 'Fits the bed', state: 'warn', detail: fitSummary(fit) }
            : { label: 'Fits the bed', state: 'pass', detail: plateSize
                ? `${mm(plateSize.width)} × ${mm(plateSize.depth)} × ${mm(plateSize.height)} mm`
                : 'fits' },
  );
  checks.push(
    realExclusions.length === 0
      ? { label: 'Exclusion zones', state: 'pass', detail: degenerateExclusion ? 'placeholder, stripped' : 'none' }
      : clearExclusionZones
        ? { label: 'Exclusion zones', state: 'warn', detail: `${realExclusions.length} ignored` }
        : { label: 'Exclusion zones', state: 'pass', detail: `${realExclusions.length} respected` },
  );
  checks.push(
    overlaps.length === 0
      ? { label: 'No overlaps', state: 'pass', detail: `${objectCount} object${objectCount === 1 ? '' : 's'}` }
      : { label: 'No overlaps', state: 'fail', detail: overlaps.join(', ') },
  );
  const failedCount = resolved?.failed.length ?? 0;
  checks.push(
    failedCount === 0
      ? { label: 'Models built', state: 'pass', detail: `${objectCount} object${objectCount === 1 ? '' : 's'}` }
      : { label: 'Models built', state: 'fail', detail: `${failedCount} could not be built` },
  );
  checks.push(
    filamentId
      ? { label: 'Filament', state: 'pass', detail: selectedFilament?.name ?? '' }
      : { label: 'Filament', state: 'fail', detail: 'none selected' },
  );

  const listButton = (
    <button
      type="button"
      class={`plate3d-tool${objectsOpen ? ' is-active' : ''}`}
      aria-expanded={objectsOpen}
      onClick={() => setObjectsOpen(!objectsOpen)}
      title="Objects on this plate"
    >
      <span aria-hidden="true">📋</span> {objectCount}
      {tunedCount > 0 && <span class="pd-tool-dot" aria-hidden="true" />}
    </button>
  );

  // Only the facts that change what you can print: what is on the toolhead,
  // how big the bed is, and how many materials the machine can hold.
  const printerStats: SpecRow[] = [];
  if (printerFlat) {
    const nozzle = nozzleSpec(printerFlat);
    if (nozzle) {
      const [size, ...rest] = nozzle.split(' · ');
      printerStats.push({ label: rest.join(' · ') || 'Nozzle', value: size });
    }
    if (selectedBed) {
      const w = selectedBed.bed.maxX - selectedBed.bed.minX;
      const d = selectedBed.bed.maxY - selectedBed.bed.minY;
      printerStats.push({ label: 'Bed (mm)', value: `${w.toFixed(0)}×${d.toFixed(0)}` });
      if (Number.isFinite(selectedBed.maxHeight)) {
        printerStats.push({ label: 'Max height', value: `${selectedBed.maxHeight.toFixed(0)}` });
      }
      printerStats.push({ label: 'Extruders', value: String(selectedBed.extruderCount) });
    }
    const slots = filamentSlotCount(printerFlat);
    if (slots !== undefined) printerStats.push({ label: 'Filaments', value: String(slots) });
  }

  // Headline numbers as chips, the long tail as a list — the chips are what
  // you check before pressing Slice.
  const filamentAll = filamentFlat
    ? filamentSpecs(filamentFlat, bedSurfaceTempKey(bedSurface))
    : [];
  const CHIPPED = new Set(['Type', 'Max flow', 'Nozzle temp', 'Bed temp']);
  const filamentStats = filamentAll
    .filter((r) => CHIPPED.has(r.label))
    .map((r) => ({
      label: r.label,
      value: r.value.replace(/ °C.*$/, '°').replace(/ mm³\/s$/, '').split(' · ')[0],
    }));
  const filamentRest = filamentAll.filter((r) => !CHIPPED.has(r.label));

  const passes = checks.filter((c) => c.state === 'pass').length;
  const warns = checks.filter((c) => c.state === 'warn').length;
  const fails = checks.filter((c) => c.state === 'fail').length;
  const checkState = fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass';
  const checkSummary = [
    fails > 0 && `${fails} failed`,
    warns > 0 && `${warns} warning${warns === 1 ? '' : 's'}`,
    `${passes} ok`,
  ].filter(Boolean).join(' · ');

  const processStats: Array<{ label: string; value: string }> = [
    { label: 'Layer', value: proc.adaptiveLayerHeight ? `${layerHeight}◇` : `${layerHeight}` },
    { label: 'Walls', value: proc.wallLoops },
    { label: 'Top / bottom', value: `${proc.topShells}/${proc.bottomShells}` },
    { label: proc.infillPattern, value: `${proc.infillDensity}%` },
    {
      label: 'Supports',
      value: proc.supportStyle === 'none' ? 'off'
        : `${proc.supportStyle === 'tree' ? 'tree' : 'normal'}${proc.supportOnBuildPlateOnly ? ' · plate only' : ''}`,
    },
  ];

  const printerPicker = (
    <label class="pd-printer-pick" title="Printer — decides the bed, its exclusion zones, and whether the plate fits">
      <span aria-hidden="true">🖨️</span>
      <select
        aria-label="Printer"
        value={printerId}
        onChange={(e) => setPrinterId((e.target as HTMLSelectElement).value)}
        disabled={status !== 'idle'}
      >
        <option value="">— select printer —</option>
        {printers.map((pr) => {
          const f = fits.get(pr.id);
          return (
            <option key={pr.id} value={pr.id}>
              {f ? `${pr.name} — ${fitSummary(f)}` : pr.name}
            </option>
          );
        })}
      </select>
    </label>
  );


  // ── Panels ──────────────────────────────────────────────────────────────
  // The plate screen shows the object list behind the tool rail's list button;
  // the setup screen stacks the rest, because that screen has nothing else
  // competing for the space.

  const objectsPanel = (
    <>
      {resolveProgress && (
        <div class="print-dialog-progress-status">
          Loading meshes… {resolveProgress.done}/{resolveProgress.total}
          {resolveProgress.label ? ` — ${resolveProgress.label}` : ''}
        </div>
      )}

      {plate && instances.length === 0 && !resolveProgress && (
        <div class="print-dialog-empty">
          This plate is empty. Use <strong>Add to plate</strong> on a part to fill it.
        </div>
      )}

      {instances.length > 0 && (
        <ul class="pd-objects">
          {instances.map((inst) => {
            const o = plate?.overrides?.[inst.id];
            const { w, d, h } = instanceSize(inst);
            return (
              <li key={inst.id} class="pd-object-row">
                <span class="pd-object-name" title={inst.label}>
                  {inst.label}
                  <em class="pd-object-size">{mm(w)} × {mm(d)} × {mm(h)} mm</em>
                </span>
                {/* Compact selects rather than segmented groups: a plate can
                    hold a dozen copies, and two rows of pills each would push
                    the list well past a phone screen. */}
                <select
                  class="pd-object-opt"
                  aria-label={`Supports for ${inst.label}`}
                  title="Supports for this object"
                  value={o?.supports ?? ''}
                  disabled={status !== 'idle'}
                  onChange={(e) => {
                    const v = (e.target as HTMLSelectElement).value;
                    handleOverride(inst.id, { supports: v === '' ? undefined : (v as SupportStyle) });
                  }}
                >
                  {SUPPORT_CHOICES.map((c) => (
                    <option key={String(c.value)} value={c.value ?? ''}>
                      {c.value === undefined ? 'Supports: default' : `Supports: ${c.label}`}
                    </option>
                  ))}
                </select>
                <select
                  class="pd-object-opt"
                  aria-label={`Brim for ${inst.label}`}
                  title="Brim for this object"
                  value={o?.brim === undefined ? '' : String(o.brim)}
                  disabled={status !== 'idle'}
                  onChange={(e) => {
                    const v = (e.target as HTMLSelectElement).value;
                    handleOverride(inst.id, { brim: v === '' ? undefined : v === 'true' });
                  }}
                >
                  {BRIM_CHOICES.map((c) => (
                    <option key={String(c.value)} value={c.value === undefined ? '' : String(c.value)}>
                      {c.value === undefined ? 'Brim: default' : `Brim: ${c.label}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  class="pd-object-remove"
                  aria-label={`Remove ${inst.label}`}
                  title="Take this object off the plate"
                  onClick={() => handleDeleteObject(inst.id)}
                  disabled={status !== 'idle'}
                >
                  🗑
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {resolved?.failed.map((f) => (
        <div key={f.itemId} class="pd-object-failed">
          <strong>⚠ {f.label}</strong> — could not be built: {f.reason} It is left off the
          plate. Reopen the plate to retry, or remove the item if that part no longer exists.
        </div>
      ))}
    </>
  );

  const processPanel = (
    <>
      <div class="pd-layer-row">
        <label class="print-dialog-row pd-layer-select">
          <span>Layer height (mm){proc.adaptiveLayerHeight ? ' · target' : ''}</span>
          <select
            value={layerHeight}
            onChange={(e) => setLayerHeight((e.target as HTMLSelectElement).value)}
            disabled={status !== 'idle'}
          >
            {LAYER_HEIGHTS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          class={`pd-adaptive-pill${proc.adaptiveLayerHeight ? ' on' : ''}`}
          onClick={() => updateProc('adaptiveLayerHeight', !proc.adaptiveLayerHeight)}
          disabled={status !== 'idle'}
          aria-pressed={!!proc.adaptiveLayerHeight}
          title={proc.adaptiveLayerHeight
            ? 'Slicer varies layer height per region. Click to disable.'
            : 'Slicer picks a single uniform layer height. Click to enable adaptive.'}
        >
          <span class="pd-adaptive-pill-dot" />
          Adaptive
        </button>
      </div>

      <fieldset class="print-dialog-process" disabled={status !== 'idle'}>
        <legend>Overrides</legend>
        <label class="print-dialog-row">
          <span>Walls</span>
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            value={proc.wallLoops}
            onInput={(e) => updateProc('wallLoops', (e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="print-dialog-row">
          <span>Top shells</span>
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={proc.topShells}
            onInput={(e) => updateProc('topShells', (e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="print-dialog-row">
          <span>Bottom shells</span>
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={proc.bottomShells}
            onInput={(e) => updateProc('bottomShells', (e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="print-dialog-row">
          <span>Infill pattern</span>
          <select value={proc.infillPattern} onChange={(e) => updateProc('infillPattern', (e.target as HTMLSelectElement).value)}>
            {INFILL_PATTERNS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label class="print-dialog-row">
          <span>Infill %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={proc.infillDensity}
            onInput={(e) => updateProc('infillDensity', (e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="print-dialog-row">
          <span>Supports</span>
          <div class="pd-segmented" role="radiogroup" aria-label="Supports">
            {([
              { value: 'none' as const, label: 'Off' },
              { value: 'normal' as const, label: 'Auto normal' },
              { value: 'tree' as const, label: 'Auto tree' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                class={`pd-segmented-btn${proc.supportStyle === opt.value ? ' on' : ''}`}
                aria-pressed={proc.supportStyle === opt.value}
                onClick={() => updateProc('supportStyle', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {proc.supportStyle !== 'none' && (
          <label class="print-dialog-row print-dialog-checkbox">
            <input
              type="checkbox"
              checked={proc.supportOnBuildPlateOnly}
              onChange={(e) => updateProc('supportOnBuildPlateOnly', (e.target as HTMLInputElement).checked)}
            />
            <span>On build plate only (supports never start on the part)</span>
          </label>
        )}
        <label class="print-dialog-row print-dialog-checkbox">
          <input
            type="checkbox"
            checked={proc.brim}
            onChange={(e) => updateProc('brim', (e.target as HTMLInputElement).checked)}
          />
          <span>Brim (5 mm outer, for first-layer adhesion)</span>
        </label>
        <label class="print-dialog-row print-dialog-checkbox">
          <input
            type="checkbox"
            checked={proc.skirt}
            onChange={(e) => updateProc('skirt', (e.target as HTMLInputElement).checked)}
          />
          <span>Skirt (1 loop, primes nozzle before print — off by default: expands XY bbox, can trigger "move out of range" on tight beds)</span>
        </label>
        <div class="print-dialog-row print-dialog-save-template">
          <input
            type="text"
            placeholder="Save these as new template…"
            value={saveTemplateName}
            onInput={(e) => setSaveTemplateName((e.target as HTMLInputElement).value)}
          />
          <button
            type="button"
            class="btn btn-secondary"
            onClick={handleSaveTemplate}
            disabled={!saveTemplateName.trim()}
          >
            Save as process template
          </button>
        </div>
      </fieldset>

      {speedRows.length > 0 ? (
        specList('Speeds', speedRows)
      ) : (
        <p class="print-dialog-hint">
          Per-feature speeds come from a process preset. Neither the printer nor
          the filament preset sets any, so the slicer's own defaults apply —
          capped by the printer's max feedrate and the filament's max flow, both
          under <strong>Printer</strong>.
        </p>
      )}
    </>
  );

  const presetsPanel = (
    <div class="slice-presets">
      <p class="print-dialog-hint">
        Printer + filament + process, reusable across plates.
      </p>
      <div class="slice-presets-row">
        {slicePresets.length === 0 && (
          <span class="slice-presets-empty">
            No saved presets — configure Printer and Process, then save here.
          </span>
        )}
        {slicePresets.map((p) => {
          // Show a printer:filament hint under the name so the user can
          // tell them apart at a glance.
          const printerName = printers.find((x) => x.id === p.config.printerId)?.name ?? '?';
          const filamentName = filaments.find((x) => x.id === p.config.filamentId)?.name ?? '?';
          return (
            <div key={p.id} class="slice-preset-chip-wrap">
              <button
                type="button"
                class="slice-preset-chip"
                title={`${printerName} · ${filamentName} · ${p.config.layerHeight}mm`}
                onClick={() => loadSlicePreset(p)}
                disabled={status !== 'idle'}
              >
                <span class="slice-preset-chip-name">{p.name}</span>
                <span class="slice-preset-chip-sub">
                  {p.config.layerHeight}mm · {p.config.proc.wallLoops}w · {p.config.proc.infillDensity}%
                </span>
              </button>
              <button
                type="button"
                class="slice-preset-chip-delete"
                title="Delete preset"
                onClick={() => handleDeleteSlicePreset(p.id)}
                disabled={status !== 'idle'}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <div class="slice-presets-save">
        <input
          type="text"
          placeholder="Save current as… (e.g. Flashforge / PETG / 0.2 Standard)"
          value={savePresetName}
          onInput={(e) => setSavePresetName((e.target as HTMLInputElement).value)}
          disabled={status !== 'idle'}
        />
        <button
          type="button"
          class="btn btn-secondary"
          onClick={handleSaveSlicePreset}
          disabled={!savePresetName.trim() || !printerId || !filamentId || status !== 'idle'}
        >
          Save as slice preset
        </button>
      </div>
    </div>
  );

  const advancedPanel = (
    <>
      <label class="print-dialog-row print-dialog-checkbox">
        <input
          type="checkbox"
          checked={preheat}
          onChange={(e) => setPreheat((e.target as HTMLInputElement).checked)}
          disabled={status !== 'idle'}
        />
        <span>Prepend <code>M140</code>/<code>M104</code> before <code>START_PRINT</code> (kicks bed and nozzle heat off before homing)</span>
      </label>

      <label class="print-dialog-row print-dialog-checkbox">
        <input
          type="checkbox"
          checked={centerOnBed}
          onChange={(e) => setCenterOnBed((e.target as HTMLInputElement).checked)}
          disabled={status !== 'idle'}
        />
        <span>Auto-center on bed if the slicer emitted coords outside <code>printable_area</code> (fixes corner-origin vs. center-origin mismatch — required if you get "move out of range" errors)</span>
      </label>

      <label class="print-dialog-row print-dialog-checkbox">
        <input
          type="checkbox"
          checked={clearExclusionZones}
          onChange={(e) => setClearExclusionZones((e.target as HTMLInputElement).checked)}
          disabled={status !== 'idle'}
        />
        <span>Clear printer <code>bed_exclude_area</code> (bypass Orca's "too close to exclusion area" check — needed when the corner exclusion is spurious or you're OK printing over the endstop bracket)</span>
      </label>
    </>
  );

  const notices: JSX.Element[] = [];
  if (plateError) notices.push(<div class="print-dialog-error">{plateError}</div>);
  if (errorMsg) notices.push(<div class="print-dialog-error">{errorMsg}</div>);
  if (!anyPresets) {
    notices.push(
      <div class="pd-notice">
        No printer or filament presets yet.{' '}
        <button type="button" class="pd-notice-link" onClick={openSettingsGuarded}>
          Import from OrcaSlicer
        </button>
      </div>,
    );
  }
  if (fit?.status === 'blocked') {
    notices.push(
      <div class="pd-notice is-bad">
        <strong>✗ This plate doesn't fit the selected printer.</strong> {fit.reasons.join(' ')}
      </div>,
    );
  }
  if (overlaps.length > 0) {
    notices.push(
      <div class="pd-notice is-warn">
        ⚠ Overlapping on the plate: {overlaps.join(', ')}. Move them apart before slicing.
      </div>,
    );
  }

  const noticeList = notices.length > 0 && (
    <div class="pd-notices">
      {notices.map((n, i) => <div key={i}>{n}</div>)}
    </div>
  );

  // ── Setup: everything about *how* it prints. Its own screen below the
  //    split breakpoint, the right-hand column above it.
  const setupCards = (
    <div class="pd-setup">
      {/* Checks first, and open by default: whether this plate can be
          printed at all is the one question that decides whether the rest
          of the screen matters. */}
      <details class="pd-card" open>
        <summary>
          <span class="pd-card-title">Checks</span>
          <span class={`pd-card-status is-${checkState}`}>{checkSummary}</span>
        </summary>
        <div class="pd-card-body">
          {checks.map((c) => (
            <div key={c.label} class={`pd-check is-${c.state}`}>
              <span class="pd-check-mark" aria-hidden="true">
                {c.state === 'pass' ? '✓' : c.state === 'warn' ? '⚠' : '✗'}
              </span>
              <span class="pd-check-label">{c.label}</span>
              <span class="pd-check-detail">{c.detail}</span>
            </div>
          ))}
        </div>
      </details>

      {!split && noticeList}

      <details class="pd-card">
        <summary>
          <span class="pd-card-title">Printer</span>
          <span class="pd-card-status">{selectedPrinter?.name ?? 'none selected'}</span>
          <button
            type="button"
            class="pd-edit"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSettingsGuarded(); }}
            disabled={busy}
            title="Edit this printer's preset"
            aria-label="Edit printer preset"
          >
            ✏️
          </button>
        </summary>
        <div class="pd-card-body">
          <div class="pd-stats">
            {printerStats.map((stat) => (
              <div key={stat.label} class="pd-stat">
                <span class="pd-stat-value">{stat.value}</span>
                <span class="pd-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <label class="print-dialog-row">
            <span>Installed plate</span>
            <select
              aria-label="Installed plate"
              value={bedSurface}
              onChange={(e) => setBedSurface((e.target as HTMLSelectElement).value as BedSurface)}
              disabled={status !== 'idle'}
              title="Which build plate is installed. Picks which per-filament temperature the slicer uses — leaving it wrong is why bed heat sometimes lands at 60 °C instead of the filament's expected temp."
            >
              {BED_SURFACES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <details class="pd-card">
        <summary>
          <span class="pd-card-title">Filament</span>
          <span class={`pd-card-status${filamentId ? '' : ' is-fail'}`}>
            {selectedFilament?.name ?? 'none selected'}
          </span>
        </summary>
        <div class="pd-card-body">
          <label class="print-dialog-row">
            <span>Filament</span>
            <select
              aria-label="Filament"
              value={filamentId}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                if (v === ADD_FILAMENT) { setAddFilamentOpen(true); return; }
                setFilamentId(v);
              }}
              disabled={status !== 'idle'}
            >
              <option value="">— select filament —</option>
              {filamentsForPrinter.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value={ADD_FILAMENT}>＋ Add filament…</option>
            </select>
          </label>
          {filamentFlat ? (
            <>
              <div class="pd-stats">
                {filamentStats.map((stat) => (
                  <div key={stat.label} class="pd-stat">
                    <span class="pd-stat-value">{stat.value}</span>
                    <span class="pd-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
              {specList('Everything else', filamentRest)}
            </>
          ) : (
            <p class="print-dialog-hint">Pick a filament to see what it specifies.</p>
          )}
        </div>
      </details>

      <details class="pd-card">
        <summary>
          <span class="pd-card-title">Process</span>
          <span class="pd-card-status">{currentTemplate?.name ?? 'custom'}</span>
          <button
            type="button"
            class="pd-edit"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProcessEditOpen(true); }}
            disabled={status !== 'idle'}
            title="Change values or save a new process"
            aria-label="Edit process"
          >
            ✏️
          </button>
        </summary>
        <div class="pd-card-body">
          <label class="print-dialog-row">
            <span>Template</span>
            <select
              aria-label="Process template"
              value={templateId}
              onChange={(e) => setTemplateId((e.target as HTMLSelectElement).value)}
              disabled={status !== 'idle'}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.builtIn ? '' : ' *'}</option>
              ))}
            </select>
          </label>
          <div class="pd-stats">
            {processStats.map((stat) => (
              <div key={stat.label} class="pd-stat">
                <span class="pd-stat-value">{stat.value}</span>
                <span class="pd-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <p class="pd-stat-foot">
            Brim {proc.brim ? 'on' : 'off'} · Skirt {proc.skirt ? 'on' : 'off'}
            {tunedCount > 0 && ` · ${tunedCount} object${tunedCount === 1 ? '' : 's'} override this`}
          </p>
        </div>
      </details>

      <details class="pd-card">
        <summary>
          <span class="pd-card-title">Slice presets</span>
          <span class="pd-card-status">
            {slicePresets.length === 0 ? 'none saved' : `${slicePresets.length} saved`}
          </span>
        </summary>
        <div class="pd-card-body">{presetsPanel}</div>
      </details>

      <details class="pd-card">
        <summary>
          <span class="pd-card-title">Advanced</span>
          <span class="pd-card-status">
            {clearExclusionZones ? 'exclusions cleared' : preheat ? 'preheat on' : 'preheat off'}
          </span>
        </summary>
        <div class="pd-card-body">{advancedPanel}</div>
      </details>
    </div>
  );

  const sliceButton = (
    <button
      type="button"
      class="btn btn-primary"
      onClick={handleSlice}
      disabled={!canPrint}
      title="Save the plate, then slice it into g-code."
    >
      {status === 'idle' || status === 'error'
        ? (dirty ? 'Save & slice' : 'Slice')
        : 'Slicing…'}
    </button>
  );

  // These belong to the setup cards, so they follow them into whichever
  // branch renders them.
  const setupSheets = (
    <>
      {processEditOpen && (
        <Sheet title="Process values" onClose={() => setProcessEditOpen(false)}>
          {processPanel}
        </Sheet>
      )}
      {addFilamentOpen && (
        <Sheet title="Add filament" onClose={() => setAddFilamentOpen(false)}>
          <p class="print-dialog-hint">
            Authoring a filament preset here is not built yet. For now, import one
            from your OrcaSlicer config — the importer walks the inheritance chain,
            so a vendor profile arrives complete.
          </p>
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => { setAddFilamentOpen(false); openSettingsGuarded(); }}
            disabled={busy}
          >
            Open print settings
          </button>
        </Sheet>
      )}
    </>
  );

  const plateStage = (
    <div class="pd-stage">
      {selectedBed && objectCount > 0 ? (
        <PlateCanvas3D
          bed={selectedBed.bed}
          keepouts={selectedBed.keepouts}
          maxHeight={Number.isFinite(selectedBed.maxHeight) ? selectedBed.maxHeight : 300}
          plateOffset={plateOffset}
          objects={canvas3dObjects}
          selectedId={selectedObjectId ?? undefined}
          disabled={status !== 'idle'}
          onSelect={setSelectedObjectId}
          onTransform={handleTransform}
          onDelete={handleDeleteObject}
          toolbarExtra={
            <>
              <button
                type="button"
                class="plate3d-tool"
                onClick={handleArrange}
                disabled={status !== 'idle'}
                title="Pack the plate automatically, discarding the positions you set."
              >
                Arrange
              </button>
              {printerPicker}
              {listButton}
            </>
          }
        />
      ) : (
        <div class="pd-stage-empty">
          {resolveProgress ? (
            <p>
              Loading meshes… {resolveProgress.done}/{resolveProgress.total}
              {resolveProgress.label ? ` — ${resolveProgress.label}` : ''}
            </p>
          ) : objectCount === 0 ? (
            <p>
              This plate is empty. Use <strong>Add to plate</strong> on a part to fill it.
            </p>
          ) : (
            <div class="pd-stage-pick">
              <p>Pick a printer to see the plate on its bed.</p>
              {printerPicker}
              {listButton}
            </div>
          )}
        </div>
      )}

      <div class="pd-hud">
        {fit && (
          <span
            class={`pd-fit-badge${fit.status === 'fits' ? '' : fit.status === 'warn' ? ' is-warn' : ' is-blocked'}`}
          >
            {fit.status === 'fits' ? '✓ Fits' : fit.status === 'warn' ? `⚠ ${fitSummary(fit)}` : `✗ ${fitSummary(fit)}`}
          </span>
        )}
        {plateSize && (
          <span
            class="pd-plate-size"
            title="Overall size of the arrangement — this is what decides which printers can take the plate."
          >
            {mm(plateSize.width)} × {mm(plateSize.depth)} × {mm(plateSize.height)} mm
          </span>
        )}
      </div>

      {objectsOpen && (
        <Sheet title="Objects on this plate" onClose={() => setObjectsOpen(false)}>
          {objectsPanel}
        </Sheet>
      )}
    </div>
  );

  // Below the split breakpoint the rail is also the way to setup; above it
  // setup is already on screen, so the save state is all that is left. It is
  // rendered either way even when it has nothing to say: dropping the bar on
  // a clean plate would resize the canvas on the first edit, and the two
  // columns' bottom bars would stop lining up.
  const plateRail = (
    <div class="pd-rail">
      <div class="pd-rail-actions">
        {dirty ? (
          <span class="pd-dirty" role="status">● Unsaved</span>
        ) : savedAt ? (
          <span class="pd-saved" role="status">✓ Saved {new Date(savedAt).toLocaleTimeString()}</span>
        ) : null}
        {dirty && (
          <button
            type="button"
            class="btn"
            onClick={() => void handleSave()}
            disabled={status !== 'idle'}
            title="Store this plate's parts and arrangement. Does not slice."
          >
            Save plate
          </button>
        )}
        {!split && (
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => setScreen('setup')}
            disabled={!printerId || objectCount === 0 || status !== 'idle'}
            title="Choose filament and process, then slice."
          >
            Slice →
          </button>
        )}
      </div>
    </div>
  );

  // ── Split: plate on the left, everything that slices it on the right ────
  if (split) {
    return (
      <Modal title={`Plate — ${plateTitle}`} onClose={closeGuarded} bleed>
        <div class="pd-split">
          <div class="pd-split-main">
            {plateStage}
            {noticeList}
            {plateRail}
          </div>
          <aside class="pd-split-side" aria-label="Print setup">
            <div class="pd-split-side-body">{setupCards}</div>
            <div class="print-dialog-actions">{sliceButton}</div>
          </aside>
          {setupSheets}
          {busyOverlay}
        </div>
      </Modal>
    );
  }

  if (screen === 'setup') {
    return (
      <Modal title={`Print setup — ${plateTitle}`} onClose={closeGuarded}>
        {setupCards}
        <div class="print-dialog-actions">
          <button
            type="button"
            class="btn btn-secondary"
            onClick={() => setScreen('plate')}
            disabled={busy}
          >
            Back to plate
          </button>
          {sliceButton}
        </div>
        {setupSheets}
        {busyOverlay}
      </Modal>
    );
  }

  // ── Plate: the arrangement, and only what changes it ─────────────────────
  return (
    <Modal title={`Plate — ${plateTitle}`} onClose={closeGuarded} bleed>
      <div class="print-dialog">
        {plateStage}
        {noticeList}
        {plateRail}
        {busyOverlay}
      </div>
    </Modal>
  );
}
