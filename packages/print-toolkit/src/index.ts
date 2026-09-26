// SPDX-License-Identifier: AGPL-3.0-or-later
// Public API surface for @3d-gallery/print-toolkit.
// Internal-only files (slicer-worker.ts is referenced via `new URL`, not imported
// here) intentionally stay out of this barrel.

// ─── Slicer engine + backends ───────────────────────────────────────────────
export {
  createSlicerEngine,
  supportsMemory64,
  parsePrintTimeStr,
  checkCrossOriginIsolation,
} from './slicer-engine.js';
export type { SlicerEngine } from './slicer-engine.js';

export { createSlicerBackend } from './slicer-backend.js';
export type { SlicerBackend, ProgressCallback } from './slicer-backend.js';

// ─── OrcaSlicer config builders ─────────────────────────────────────────────
export { buildOrcaConfig, getModelHeightFromSTL } from './orca-slicer-settings.js';

export {
  buildPlateSliceConfig,
  mergeObjectSettings,
  validatePlateForSlicing,
  computePrimeTowerDepth,
  computeRecommendedPrimeTowerWidth,
  getMaxFlushVolume,
  computeSTLBoundingBox,
  compute3MFBoundingBox,
  computeMeshBoundingBox,
  autoArrangeObjects,
  arrangeObjects,
  findLayFlatRotation,
  extractSTLFaces,
  applyRotationToSTL,
  extract3MFFaces,
  applyRotationTo3MF,
  layFlatMesh,
} from './plate-slicer.js';
export type {
  MeshBounds,
  Rect2,
  AutoArrangeOptions,
  ArrangeOptions,
  ArrangeResult,
  PlateValidationOptions,
} from './plate-slicer.js';

export { printerBedFromConfig, evaluatePlateFit } from './plate-fit.js';
export type {
  PrinterBed,
  FitStatus,
  PlateFitResult,
  PlateFitOptions,
} from './plate-fit.js';

export {
  plateBounds,
  placePlateOnBed,
  evaluateAuthoredPlateFit,
  findPlateOverlaps,
} from './plate-layout.js';
export type {
  PlateFootprint,
  PlateBounds,
  PlatePlacement,
  PlateLayoutOptions,
  AuthoredFitResult,
} from './plate-layout.js';

// ─── Klipper / gcode helpers ────────────────────────────────────────────────
export { convertKlipperGcode } from './slicer-settings.js';
export {
  parseGcodeStats,
  parseGCode,
  filamentByType,
  MOVE_TYPE_COLORS,
  type MoveType,
  type GCodeSegment,
  type GCodeLayer,
  type ParsedGCode,
} from './gcode-parser.js';
export {
  parsePrintableArea,
  gcodeXYBounds,
  translateGcodeXY,
  postProcessGcode,
  type BedBounds,
  type PostProcessOptions,
  type PostProcessReport,
} from './gcode-post.js';
export {
  parseGcodeMetadata,
  formatDuration,
  type GcodeMetadata,
} from './gcode-metadata.js';
export {
  buildProvenanceComment,
  parseProvenanceComment,
  hashConfig,
  type Provenance,
  type ProvenancePart,
} from './gcode-provenance.js';
export {
  parseBedExcludeArea,
  excludeAreaBboxes,
  isDegenerateExcludeArea,
  sanitizeBedExcludeArea,
  forceStripBedExcludeArea,
  type Point2,
  type Polygon2,
} from './bed-exclude.js';

// ─── Moonraker HTTP client ──────────────────────────────────────────────────
export {
  buildMoonrakerUrl,
  fetchConfigfile,
  fetchToolhead,
  fetchRawPrinterCfg,
  fetchPrinterConfig,
  parsePrinterConfig,
  extractGcodeBlock,
  extractGcodeSection,
  startPrint,
  uploadGcode,
  fetchPrintStatus,
  fetchKlippyState,
  fileExists,
  fetchJobHistory,
  listWebcams,
  resolveWebcamUrl,
  type PrintStatus,
  type KlippyState,
  type HistoryJob,
  type Webcam,
} from './moonraker-api.js';

// ─── Print scheduling ───────────────────────────────────────────────────────
export {
  planSchedule,
  simulate,
  dailyBlocks,
  nextAvailable,
  type ScheduleJob,
  type SchedulePrinter,
  type OperatorBlock,
  type ScheduleObjective,
  type ScheduleOptions,
  type ScheduledJob,
  type Visit,
  type Schedule,
} from './print-schedule.js';

// ─── Storage ────────────────────────────────────────────────────────────────
export { createStorage } from './storage.js';
export { BrowserStorageAdapter, BrowserParamSetStorage } from './storage-browser.js';

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  // Storage
  StorageAdapter,
  FileInfo,
  ScadValue,
  ScadParam,
  ScadParamType,
  // Print profile
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
  // Build plate
  BuildPlate,
  BuildPlateObject,
  BuildPlateObjectType,
  MeshFormat,
  PrimeTowerConfig,
  FlushVolumeConfig,
  PlateSliceJob,
  PlateSliceJobObject,
  // Filament
  FilamentSettings,
  ResolvedFilamentSettings,
  PrinterFilamentOverride,
  // Printer
  PrinterSettings,
  PrinterConfig,
  BedExcludeArea,
  PrinterStructureType,
  NozzleType,
  // Slice result
  SliceResult,
} from './types.js';

export { DEFAULT_PRINT_PROFILE } from './types.js';

// ─── Android shim contract (side-effect import for ambient Window decls) ───
import './android-shim-types.js';
export type {
  NativeSlicerBridge,
  AndroidPrinterDiscoveryBridge,
  AndroidFileBridge,
} from './android-shim-types.js';
