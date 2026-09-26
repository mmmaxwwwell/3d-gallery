// SPDX-License-Identifier: MIT
// Process templates encode "how strong / how supported" — walls, infill, and
// whether supports are on (and if so, tree vs normal). Layer height is
// intentionally NOT part of a template — it's a separate dropdown in the
// print dialog, since the same wall/support combo makes sense at every
// layer height for a given nozzle. Adaptive layer height is on in every
// built-in template — it is the editor's default, not a trait that tells one
// template from another. Acceleration and per-feature speed limits come from
// the printer preset, not from here.

export type SupportStyle = 'none' | 'normal' | 'tree';

export interface ProcessSettings {
  wallLoops: string;          // integer count
  topShells: string;          // solid layers on top (Orca top_shell_layers)
  bottomShells: string;       // solid layers on the bed (bottom_shell_layers)
  infillDensity: string;      // percentage, no "%" suffix ("15")
  infillPattern: string;      // Orca sparse_infill_pattern value
  supportStyle: SupportStyle; // 'none' | normal(auto) | tree(auto)
  supportOnBuildPlateOnly: boolean; // supports start on the bed only, never on the part
  brim: boolean;              // print an outer brim for first-layer adhesion
  skirt: boolean;             // print skirt loops (nozzle prime + bed-level check)
  adaptiveLayerHeight: boolean; // vary layer height per region (Orca "Adaptive layer height")
}

export interface ProcessTemplate {
  id: string;
  name: string;
  builtIn: boolean;
  settings: ProcessSettings;
}

export const INFILL_PATTERNS = [
  'gyroid',
  'grid',
  'cubic',
  'honeycomb',
  'triangles',
  'zig-zag',
  'concentric',
  'aligned rectilinear',
  'adaptivecubic',
];

export const LAYER_HEIGHTS = ['0.08', '0.12', '0.16', '0.20', '0.24', '0.28', '0.32'];

const BUILT_IN: ProcessTemplate[] = [
  {
    id: 'builtin:light',
    name: 'Light — 2 walls, no supports',
    builtIn: true,
    settings: { wallLoops: '2', topShells: '3', bottomShells: '3', infillDensity: '10', infillPattern: 'gyroid', supportStyle: 'none', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: true },
  },
  {
    id: 'builtin:standard',
    name: 'Standard — 3 walls',
    builtIn: true,
    settings: { wallLoops: '3', topShells: '3', bottomShells: '3', infillDensity: '15', infillPattern: 'gyroid', supportStyle: 'none', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: true },
  },
  {
    id: 'builtin:sturdy',
    name: 'Sturdy — 4 walls, no supports',
    builtIn: true,
    settings: { wallLoops: '4', topShells: '3', bottomShells: '3', infillDensity: '20', infillPattern: 'gyroid', supportStyle: 'none', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: true },
  },
  {
    id: 'builtin:tree',
    name: 'Tree supports — 3 walls',
    builtIn: true,
    settings: { wallLoops: '3', topShells: '3', bottomShells: '3', infillDensity: '15', infillPattern: 'gyroid', supportStyle: 'tree', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: true },
  },
  {
    id: 'builtin:normal-supports',
    name: 'Normal supports — 3 walls',
    builtIn: true,
    settings: { wallLoops: '3', topShells: '3', bottomShells: '3', infillDensity: '15', infillPattern: 'gyroid', supportStyle: 'normal', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: true },
  },
];

const LS_USER_TEMPLATES = '3dg:print:user-templates';

function loadUserTemplates(): ProcessTemplate[] {
  try {
    const raw = localStorage.getItem(LS_USER_TEMPLATES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProcessTemplate[];
    // Templates saved before the build-plate-only option existed lack it.
    return Array.isArray(parsed)
      ? parsed.map((t) => ({ ...t, settings: { ...t.settings, supportOnBuildPlateOnly: t.settings.supportOnBuildPlateOnly ?? false } }))
      : [];
  } catch { return []; }
}

function saveUserTemplates(list: ProcessTemplate[]): void {
  localStorage.setItem(LS_USER_TEMPLATES, JSON.stringify(list));
}

export function listTemplates(): ProcessTemplate[] {
  return [...BUILT_IN, ...loadUserTemplates()];
}

export function upsertUserTemplate(name: string, settings: ProcessSettings, id?: string): ProcessTemplate {
  const list = loadUserTemplates();
  const finalId = id ?? `user:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const record: ProcessTemplate = { id: finalId, name, builtIn: false, settings };
  const idx = list.findIndex((t) => t.id === finalId);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  saveUserTemplates(list);
  return record;
}

export function deleteUserTemplate(id: string): void {
  const list = loadUserTemplates().filter((t) => t.id !== id);
  saveUserTemplates(list);
}

/** The three keys a support style sets. Split out because a part can override
 *  the plate's choice, and a per-object config carries only its own diff. */
export function supportConfig(style: SupportStyle): Record<string, string> {
  return {
    enable_support: style !== 'none' ? '1' : '0',
    support_type: style === 'tree' ? 'tree(auto)' : 'normal(auto)',
    support_style: style === 'tree' ? 'tree_organic' : 'default',
  };
}

/** Brim on or off, as the two keys that say so. Per-object capable. */
export function brimConfig(on: boolean): Record<string, string> {
  return { brim_type: on ? 'outer_only' : 'no_brim', brim_width: on ? '5' : '0' };
}

/** Fields the print dialog emits into the slice config. Everything else —
 *  including acceleration, per-feature speeds, jerk, retraction — comes from
 *  the printer preset. Brim and skirt are always disabled: this is a gallery
 *  of small parts, adhesion is a printer-tuning problem, and the skirt was
 *  causing "move out of range" errors by expanding the XY bbox beyond the
 *  bed on center-origin printers. */
export function buildProcessConfig(s: ProcessSettings, layerHeight: string): Record<string, string> {
  return {
    ...brimConfig(s.brim),
    skirt_loops: s.skirt ? '1' : '0',
    skirt_distance: s.skirt ? '2' : '0',
    layer_height: layerHeight,
    initial_layer_print_height: layerHeight,
    adaptive_layer_height: s.adaptiveLayerHeight ? '1' : '0',
    wall_loops: s.wallLoops,
    top_shell_layers: s.topShells,
    bottom_shell_layers: s.bottomShells,
    sparse_infill_density: `${s.infillDensity}%`,
    sparse_infill_pattern: s.infillPattern,
    ...supportConfig(s.supportStyle),
    support_on_build_plate_only: s.supportOnBuildPlateOnly ? '1' : '0',
  };
}
