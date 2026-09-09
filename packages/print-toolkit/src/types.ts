// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Shared types for the print-toolkit. Hoisted here so nothing else in the
 * toolkit needs to reach into a framework (React/Preact) hook or a consumer's
 * types module.
 */

export type {
  PrintProfile,
  SliceStats,
  PrintSequence,
  SeamPosition,
  SeamScarfType,
  WallSequence,
  WallGenerator,
  InfillPattern,
  SupportType,
  SupportStyle,
  AdhesionType,
  BrimType,
  ZHopType,
  FuzzySkinType,
  FuzzySkinMode,
  FuzzySkinNoiseType,
  IroningType,
  EnsureVerticalShellThickness,
  GapFillTarget,
  WallDirection,
  SupportBasePattern,
  SupportInterfacePattern,
  TimelapseType,
  SlicingMode,
} from './print-profile.js';

export { DEFAULT_PRINT_PROFILE } from './print-profile.js';

export type {
  BuildPlate,
  BuildPlateObject,
  BuildPlateObjectType,
  MeshFormat,
  PrimeTowerConfig,
  FlushVolumeConfig,
  PlateSliceJob,
  PlateSliceJobObject,
} from './build-plate.js';

// ─── Storage adapter ────────────────────────────────────────────────────────

/** File metadata for storage listing */
export interface FileInfo {
  id: string;
  name: string;
  lastModified: Date;
  size?: number;
}

/** Storage adapter interface — implemented by browser (IndexedDB) or native hosts */
export interface StorageAdapter {
  listFiles(): Promise<FileInfo[]>;
  loadFile(id: string): Promise<string>;
  saveFile(id: string, content: string): Promise<void>;
  deleteFile(id: string): Promise<void>;
}

/** Value types persisted in stored parameter sets */
export type ScadValue = number | string | boolean | number[];

/** Parameter kinds we recognize when parsing SCAD PARAMS blocks */
export type ScadParamType = 'number' | 'string' | 'text' | 'boolean' | 'vector' | 'enum';

/** A single parsed parameter from a .scad PARAMS section */
export interface ScadParam {
  name: string;
  type: ScadParamType;
  default: ScadValue;
  help: string;
  options?: string[];
}

// ─── Filament (hoisted from OWG useFilaments + usePrinterFilamentOverrides) ─

/**
 * Global filament settings — what "PLA at 210°C, 50 mm/s" looks like
 * independent of any printer. Corresponds to OWG's `FilamentProfile`.
 */
export interface FilamentSettings {
  id: string;
  name: string;
  /** Filament type key used for printer profile lookup (e.g. 'pla', 'petg') */
  type: string;
  nozzleTemp: number;
  bedTemp: number;
  fanSpeed: number; // 0-100 percentage
  printSpeed: number; // mm/s
  retractDist: number; // mm
  retractSpeed: number; // mm/s
  deretractionSpeed?: number; // mm/s (0 = same as retraction)
  firstLayerNozzleTemp: number; // °C
  firstLayerBedTemp: number; // °C
  minSpeed: number; // mm/s — cooling slowdown min speed
  minLayerTime: number; // seconds — min layer time for cooling
  notes: string;
  builtin: boolean; // true = non-deletable preset
  // OrcaSlicer filament fields (optional for backward compat with saved data)
  flowRatio?: number;
  enablePressureAdvance?: boolean;
  pressureAdvance?: number;
  adaptivePressureAdvance?: boolean;
  overhangFanSpeed?: number;
  overhangFanThreshold?: number;
  enableOverhangBridgeFan?: boolean;
  closeFanFirstLayers?: number;
  fanCoolingLayerTime?: number;
  slowDownLayerTime?: number;
  fanMaxSpeed?: number;
  // Multi-plate bed temps (default to bedTemp if not set)
  coolPlateTemp?: number;
  coolPlateTempInitialLayer?: number;
  engPlateTemp?: number;
  engPlateTempInitialLayer?: number;
  texturedPlateTemp?: number;
  texturedPlateTempInitialLayer?: number;
}

/**
 * Optional per-printer overrides for a filament profile. Each field
 * shadows the corresponding `FilamentSettings` field on that printer only.
 */
export interface PrinterFilamentOverride {
  nozzleTemp?: number;
  bedTemp?: number;
  fanSpeed?: number;
  firstLayerFan?: number;
  printSpeed?: number;
  retractDist?: number;
  retractSpeed?: number;
  deretractionSpeed?: number;
  firstLayerNozzleTemp?: number;
  firstLayerBedTemp?: number;
  minSpeed?: number;
  minLayerTime?: number;
  flowRatio?: number;
  enablePressureAdvance?: boolean;
  pressureAdvance?: number;
  adaptivePressureAdvance?: boolean;
  overhangFanSpeed?: number;
  overhangFanThreshold?: number;
  enableOverhangBridgeFan?: boolean;
  closeFanFirstLayers?: number;
  fanCoolingLayerTime?: number;
  slowDownLayerTime?: number;
  fanMaxSpeed?: number;
  coolPlateTemp?: number;
  coolPlateTempInitialLayer?: number;
  engPlateTemp?: number;
  engPlateTempInitialLayer?: number;
  texturedPlateTemp?: number;
  texturedPlateTempInitialLayer?: number;
}

/**
 * Fully-resolved filament values passed to the slicer: global filament
 * merged with any per-printer overrides. All fields required.
 */
export interface ResolvedFilamentSettings {
  nozzleTemp: number;
  bedTemp: number;
  fanSpeed: number;
  firstLayerFan: number;
  printSpeed: number;
  retractDist: number;
  retractSpeed: number;
  deretractionSpeed: number;
  firstLayerNozzleTemp: number;
  firstLayerBedTemp: number;
  minSpeed: number;
  minLayerTime: number;
  flowRatio: number;
  enablePressureAdvance: boolean;
  pressureAdvance: number;
  adaptivePressureAdvance: boolean;
  overhangFanSpeed: number;
  overhangFanThreshold: number;
  enableOverhangBridgeFan: boolean;
  closeFanFirstLayers: number;
  fanCoolingLayerTime: number;
  slowDownLayerTime: number;
  fanMaxSpeed: number;
  coolPlateTemp: number;
  coolPlateTempInitialLayer: number;
  engPlateTemp: number;
  engPlateTempInitialLayer: number;
  texturedPlateTemp: number;
  texturedPlateTempInitialLayer: number;
}

// ─── Printer settings + config ──────────────────────────────────────────────

export type {
  PrinterSettings,
  BedExcludeArea,
  PrinterStructureType,
  NozzleType,
} from './slicer-settings.js';

export type { PrinterConfig } from './moonraker-api.js';

// ─── Slice result + progress (hoisted from OWG useSlicer) ───────────────────

/** Progress callback signature used by every backend + engine */
export type ProgressCallback = (stage: string, progress: number, message?: string) => void;

export interface SliceResult {
  gcode: string;
  /** Estimated print time in seconds (from GCode parsing or native stats) */
  printTime?: number;
  /** Filament used in mm (parsed from gcode comments) */
  filamentUsed?: number;
  /** Rich print statistics from the slicer engine (available when using native stats API) */
  stats?: import('./print-profile.js').SliceStats;
  /** Resolved slicer config values for "auto" fields (available after slicing) */
  resolvedConfigs?: Record<string, string>;
  /** Engine name reported by the worker (e.g. "WASM", "WASM64") */
  engineName?: string;
}
