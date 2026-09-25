// SPDX-License-Identifier: MIT
// Read-only view of a local OrcaSlicer install. Node only — reads the config
// tree, the app config, and sliced 3MF projects. Nothing here writes.

export { resolveOrcaPaths, searchedRoots, hasConf, type OrcaPaths } from './paths.ts';
export {
  indexPresets,
  resolvePreset,
  findPreset,
  diffFields,
  relPath,
  METADATA_KEYS,
  type PresetKind,
  type PresetScope,
  type PresetRef,
  type PresetJson,
  type PresetIndex,
  type ResolvedPreset,
  type FieldDiff,
  type DiffKind,
} from './presets.ts';
export {
  readConf,
  readUsage,
  summarizeConf,
  readLogSummary,
  type OrcaConfSummary,
  type LocalMachine,
  type UsageCombo,
  type LogSummary,
} from './conf.ts';
export {
  readOrcaProject,
  type OrcaProject,
  type ProjectObject,
  type ProjectPlate,
  type ProjectPresetIds,
} from './project.ts';
export {
  readStore,
  storePath,
  upsertPreset,
  removePreset,
  replaceAll,
  clearStore,
  presetId,
  type GalleryPreset,
  type GalleryStore,
} from './store.ts';
export { createDevStoreMiddleware } from './devstore.ts';
