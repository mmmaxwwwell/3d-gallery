// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Generate src/orca-schema.generated.ts from an OrcaSlicer source tree.
 *
 * The preset editor needs to know, for every printer and filament field, what
 * libslic3r thinks it is: its option type (coFloats, coEnum, coPercent, …),
 * units, bounds, enum choices, default, and where Orca's own settings tabs put
 * it. That knowledge lives in C++ — `PrintConfigDef` in PrintConfig.cpp, the
 * per-kind key lists in Preset.cpp, and the page/group layout in Tab.cpp — so
 * this reads those files and writes it down as data. Nothing is hand-copied, so
 * a newer Orca is a re-run away.
 *
 * Usage:
 *   node scripts/gen-orca-schema.mjs <path-to-OrcaSlicer-source>
 *
 * Any checkout works (`git clone --depth 1 -b v2.3.2
 * https://github.com/SoftFever/OrcaSlicer`). The tree the committed file was
 * built from is recorded in its header.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'orca-schema.generated.ts');

// ---------------------------------------------------------------------------
// C++ lexing — just enough to walk statements without tripping on strings or
// comments. `"http://…"` inside a tooltip is why comments can't be stripped
// with a regex.

/** Split source into top-level statements (`;`-terminated at paren/brace depth
 *  zero relative to the start), with comments removed and strings kept. */
function statements(src) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      cur += '\n';
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      cur += src.slice(i, j + 1);
      i = j;
      continue;
    }
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if ((c === ';' || c === '{' || c === '}') && depth <= 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      depth = 0;
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function unescape(body) {
  return body.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, e) => {
    if (e[0] === 'u' && e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === 'x' && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '', '"': '"', "'": "'", '\\': '\\' }[e] ?? e;
  });
}

/** Every string literal in `expr`, concatenated — C++ joins adjacent literals,
 *  and `L("a" "b")` / `u8"…"` are just wrappers around them. */
function stringValue(expr) {
  const parts = [...expr.matchAll(/(?:u8)?"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1]));
  return parts.length ? parts.join('') : undefined;
}

function stringList(expr) {
  return [...expr.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1]));
}

/** Slice out the body of a function, by name, from its opening brace to its
 *  matching close. */
function functionBody(src, signature) {
  const start = src.indexOf(signature);
  if (start < 0) throw new Error(`Function not found: ${signature}`);
  let i = src.indexOf('{', start);
  let depth = 0;
  const from = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"') { i++; while (src[i] !== '"') i += src[i] === '\\' ? 2 : 1; continue; }
    if (c === '/' && src[i + 1] === '/') { while (src[i] !== '\n') i++; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return src.slice(from + 1, i);
  }
  throw new Error(`Unbalanced body: ${signature}`);
}

// ---------------------------------------------------------------------------
// Enums: `s_keys_map_SeamPosition { {"nearest", spNearest}, … }` maps the C++
// enumerator a default is written with back to the string Orca stores.

function parseEnumMaps(src) {
  const maps = new Map();
  for (const m of src.matchAll(/static\s+(?:const\s+)?t_config_enum_values\s+s_keys_map_(\w+)\s*(?:=\s*)?\{([\s\S]*?)\n\};/g)) {
    const byId = new Map();
    for (const e of m[2].matchAll(/\{\s*"([^"]+)"\s*,\s*(?:int\()?\s*([\w:]+)\s*\)?\s*\}/g)) {
      const id = e[2].split('::').pop();
      if (!byId.has(id)) byId.set(id, e[1]);
    }
    maps.set(m[1], byId);
  }
  return maps;
}

// ---------------------------------------------------------------------------
// Defaults. `set_default_value(new ConfigOptionFloats{ 0.4 })` becomes the
// value Orca would write to a preset file: scalars as strings, vectors as
// string arrays, bools as "1"/"0", percents with their "%". Anything built
// from a named constant or an expression is left out rather than guessed.

const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?f?$/i;

function num(tok) {
  const t = tok.trim().replace(/f$/i, '');
  if (!NUM.test(tok.trim())) return undefined;
  return String(Number(t));
}

function splitArgs(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') j += s[j] === '\\' ? 2 : 1;
      cur += s.slice(i, j + 1);
      i = j;
      continue;
    }
    if ('({['.includes(c)) depth++;
    if (')}]'.includes(c)) depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function scalarDefault(cls, tok, enumType, enumMaps) {
  tok = tok.trim();
  switch (cls) {
    case 'Float': case 'Int': return num(tok);
    case 'Percent': { const v = num(tok); return v === undefined ? undefined : `${v}%`; }
    case 'Bool':
      if (tok === 'true' || tok === '1') return '1';
      if (tok === 'false' || tok === '0') return '0';
      return undefined;
    case 'String':
      if (!tok) return '';
      return tok.startsWith('"') || tok.startsWith('u8"') || tok.startsWith('L(') ? stringValue(tok) ?? '' : undefined;
    case 'Enum': {
      const id = tok.split('::').pop();
      return enumMaps.get(enumType)?.get(id);
    }
    case 'Point': {
      const m = tok.match(/Vec2d\s*\(\s*([^,]+),\s*([^)]+)\)/);
      if (!m) return undefined;
      const x = num(m[1]); const y = num(m[2]);
      return x !== undefined && y !== undefined ? `${x}x${y}` : undefined;
    }
    default: return undefined;
  }
}

function parseDefault(expr, enumType, enumMaps) {
  const m = expr.match(/new\s+ConfigOption(\w+?)(?:Nullable)?(?:<(\w+)>)?\s*([({])([\s\S]*)[)}]\s*\)?\s*$/);
  if (!m) return undefined;
  let [, cls, tmpl, , inner] = m;
  const type = tmpl ?? enumType;
  inner = inner.trim();
  if (cls === 'FloatOrPercent') {
    const [v, pct] = splitArgs(inner);
    const n = num(v ?? '');
    if (n === undefined) return undefined;
    return pct === 'true' ? `${n}%` : n;
  }
  if (cls === 'EnumsGeneric' || cls === 'Enums') cls = 'Enums';
  const vector = /s$/.test(cls) && cls !== 'Points' ? cls.slice(0, -1) : cls === 'Points' ? 'Point' : null;
  if (!vector) return scalarDefault(cls, inner, type, enumMaps);
  // Vector: `{a, b}`, `(n, v)` meaning n copies, or `{ {a}, {b} }`.
  const body = inner.replace(/^\{([\s\S]*)\}$/, '$1');
  if (!body.trim()) return [];
  const args = splitArgs(body);
  if (vector === 'FloatOrPercent') {
    const vals = args.map((a) => {
      const [v, pct] = splitArgs(a.replace(/^FloatOrPercent\s*\(|^\{|\)$|\}$/g, ''));
      const n = num(v ?? '');
      return n === undefined ? undefined : pct === 'true' ? `${n}%` : n;
    });
    return vals.every((v) => v !== undefined) ? vals : undefined;
  }
  const vals = args.map((a) => scalarDefault(vector, a, type, enumMaps));
  return vals.every((v) => v !== undefined) ? vals : undefined;
}

// ---------------------------------------------------------------------------
// PrintConfigDef

const TYPE_NAMES = {
  coFloat: 'float', coFloats: 'floats', coInt: 'int', coInts: 'ints',
  coString: 'string', coStrings: 'strings', coPercent: 'percent', coPercents: 'percents',
  coFloatOrPercent: 'floatOrPercent', coFloatsOrPercents: 'floatsOrPercents',
  coPoint: 'point', coPoints: 'points', coPoint3: 'point3', coBool: 'bool', coBools: 'bools',
  coEnum: 'enum', coEnums: 'enums', coPointsGroups: 'pointsGroups', coNone: 'none',
};

const MODES = { comSimple: 'simple', comAdvanced: 'advanced', comDevelop: 'develop' };

function parseDefs(src, enumMaps) {
  const body = ['init_common_params', 'init_fff_params']
    .map((f) => functionBody(src, `void PrintConfigDef::${f}()`))
    .join('\n;\n');
  const defs = new Map();
  const vars = new Map();
  let cur = null;

  for (const st of statements(body)) {
    const add = st.match(/^(?:(?:auto|ConfigOptionDef\s*\*)\s*(\w+)\s*=\s*)?def\s*=\s*this->add(_nullable)?\(\s*(.+?)\s*,\s*(co\w+)\s*\)$/s);
    if (add) {
      const [, varName, nullable, keyExpr, type] = add;
      const key = /^"[^"]+"$/.test(keyExpr) ? keyExpr.slice(1, -1) : null;
      if (!key) { cur = null; continue; }
      cur = { key, type: TYPE_NAMES[type] ?? type };
      if (nullable) cur.nullable = true;
      defs.set(key, cur);
      if (varName) vars.set(varName, cur);
      continue;
    }
    const alias = st.match(/^(?:auto|ConfigOptionDef\s*\*)?\s*(\w+)\s*=\s*def$/);
    if (alias && cur) { vars.set(alias[1], cur); continue; }
    if (!cur) continue;

    const set = st.match(/^def->(\w+)\s*=\s*([\s\S]+)$/);
    if (set) {
      const [, field, rhs] = set;
      switch (field) {
        case 'label': case 'full_label': case 'category': case 'tooltip': case 'sidetext': {
          const v = stringValue(rhs);
          if (v !== undefined) cur[{ full_label: 'fullLabel' }[field] ?? field] = v;
          break;
        }
        case 'min': case 'max': { const v = num(rhs); if (v !== undefined) cur[field] = Number(v); break; }
        case 'mode': if (MODES[rhs.trim()]) cur.mode = MODES[rhs.trim()]; break;
        case 'multiline': case 'readonly': case 'full_width': if (rhs.trim() === 'true') cur[{ full_width: 'fullWidth' }[field] ?? field] = true; break;
        case 'gui_type': cur.guiType = rhs.trim().split('::').pop(); break;
        case 'enum_keys_map': { const m = rhs.match(/ConfigOptionEnum<(\w+)>/); if (m) cur.enumType = m[1]; break; }
        case 'enum_values': case 'enum_labels': {
          const src = rhs.match(/^(\w+)->(enum_values|enum_labels)$/);
          const from = src && vars.get(src[1]);
          const list = from ? from[src[2] === 'enum_values' ? 'enumValues' : 'enumLabels'] : stringList(rhs);
          if (list?.length) cur[field === 'enum_values' ? 'enumValues' : 'enumLabels'] = [...list];
          break;
        }
      }
      continue;
    }
    const push = st.match(/^def->(enum_values|enum_labels)\.push_back\(([\s\S]+)\)$/);
    if (push) {
      const k = push[1] === 'enum_values' ? 'enumValues' : 'enumLabels';
      const v = stringValue(push[2]);
      if (v !== undefined) (cur[k] ??= []).push(v);
      continue;
    }
    const dflt = st.match(/^def->set_default_value\(([\s\S]+)\)$/);
    if (dflt) {
      const v = parseDefault(dflt[1], cur.enumType, enumMaps);
      if (v !== undefined) cur.default = v;
    }
  }

  // Built in a loop over axes — see PrintConfig.cpp. Reproduced from the same
  // table rather than skipped, because these are the machine-limits page.
  const axes = { x: [[500, 200], [1000, 1000], [10, 10]], y: [[500, 200], [1000, 1000], [10, 10]], z: [[12, 12], [500, 200], [0.2, 0.4]], e: [[120, 120], [5000, 5000], [2.5, 2.5]] };
  for (const [axis, [speed, accel, jerk]] of Object.entries(axes)) {
    const A = axis.toUpperCase();
    const mk = (key, fullLabel, tooltip, sidetext, def) => defs.set(key, {
      key, type: 'floats', fullLabel, label: fullLabel, category: 'Machine limits', tooltip, sidetext,
      min: 0, mode: 'simple', default: def.map(String),
    });
    mk(`machine_max_speed_${axis}`, `Maximum speed ${A}`, `Maximum speed of ${A} axis`, 'mm/s', speed);
    mk(`machine_max_acceleration_${axis}`, `Maximum acceleration ${A}`, `Maximum acceleration of the ${A} axis`, 'mm/s²', accel);
    mk(`machine_max_jerk_${axis}`, `Maximum jerk ${A}`, `Maximum jerk of the ${A} axis`, 'mm/s', jerk);
  }

  // Filament-side copies of extruder retraction settings: same type, made
  // nullable, where null means "use the printer's value".
  const overrideList = src.match(/filament_extruder_override_keys\s*=\s*\{([\s\S]*?)\};/);
  for (const key of overrideList ? stringList(overrideList[1]) : []) {
    const base = defs.get(key.replace(/^filament_/, ''));
    if (!base) continue;
    const { default: d, mode: _m, category: _c, ...rest } = base;
    const mode = ['filament_retraction_length', 'filament_z_hop', 'filament_long_retractions_when_cut',
      'filament_retraction_distances_when_cut'].includes(key) ? 'simple' : 'advanced';
    defs.set(key, { ...rest, key, nullable: true, mode, ...(d !== undefined ? { default: d } : {}) });
  }

  return defs;
}

// ---------------------------------------------------------------------------
// Which keys belong to which preset kind (Preset.cpp), and the extruder keys
// the printer adds on top (PrintConfig.cpp).

function listLiteral(src, name) {
  const m = src.match(new RegExp(`${name}\\s*(?:=\\s*)?\\{([\\s\\S]*?)\\};`));
  if (!m) throw new Error(`List not found: ${name}`);
  return stringList(m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
}

// ---------------------------------------------------------------------------
// Tab.cpp: the pages and option groups Orca's settings dialog uses, in order.

function parseLayout(tabSrc, sources) {
  const pages = [];
  let page = null;
  let group = null;
  const placed = new Set();
  const place = (key) => {
    if (placed.has(key)) return;
    placed.add(key);
    group.keys.push(key);
  };
  // The last `std::vector<std::string> x{ "a", "b" }` seen, for loops that
  // append each of its keys through a variable.
  let keyList = [];
  const pageFor = (title) => {
    let p = pages.find((x) => x.title === title);
    if (!p) { p = { title, groups: [] }; pages.push(p); }
    return p;
  };
  for (const { sig, page: seedPage, group: seedGroup, placeLists } of sources) {
    if (seedPage) {
      page = pageFor(seedPage);
      group = { title: seedGroup, keys: [] };
      page.groups.push(group);
    }
    for (const st of statements(functionBody(tabSrc, sig))) {
      if (/^"\w+"(\s*,\s*"\w+")*\s*,?$/.test(st)) {
        keyList = stringList(st);
        continue;
      }
      const loop = placeLists && group && st.match(/^for\s*\([^{]*?:\s*\{([^}]*)\}/);
      if (loop) { stringList(loop[1]).forEach(place); continue; }
      const pg = st.match(/add_options_page\(\s*([^,]+)/);
      if (pg) {
        page = pageFor(stringValue(pg[1]) ?? 'Extruder');
        group = null;
        continue;
      }
      const og = st.match(/new_optgroup\(\s*(L\("[^"]*"\)|"[^"]*")/);
      if (og && page) {
        const title = stringValue(og[1]);
        group = page.groups.find((g) => g.title === title);
        if (!group) { group = { title, keys: [] }; page.groups.push(group); }
      }
      if (!group) continue;
      for (const m of st.matchAll(/(?:append_single_option_line|get_option|append_option_line\([^,]+,|create_line_with_widget\([^,]+,)\s*\(?\s*"(\w+)"/g)) {
        // `"machine_max_jerk_" + axis` inside a loop over x/y/z/e.
        if (/^\s*\+\s*axis\b/.test(st.slice(m.index + m[0].length))) for (const a of 'xyze') place(m[1] + a);
        else place(m[1]);
      }
      const viaVar = st.match(/append_option_line\(\s*\w+\s*,\s*(\w+)\s*,/);
      if (viaVar && viaVar[1] !== 'axis') for (const k of keyList) place(k);
    }
  }
  return pages;
}

/** Keys Orca's tabs never place (built from computed names, or shown through
 *  a custom dialog) go under their PrintConfigDef category, so nothing that
 *  belongs to the kind is unreachable. */
function completeLayout(pages, keys, defs) {
  const placed = new Set(pages.flatMap((p) => p.groups.flatMap((g) => g.keys)));
  const rest = keys.filter((k) => !placed.has(k) && defs.has(k));
  if (!rest.length) return pages;
  const byCat = new Map();
  for (const k of rest) {
    const cat = defs.get(k).category || 'General';
    (byCat.get(cat) ?? byCat.set(cat, []).get(cat)).push(k);
  }
  const other = { title: 'Other', groups: [...byCat].map(([title, ks]) => ({ title, keys: ks })) };
  return [...pages, other];
}

/** Drop layout keys that aren't the kind's own (Tab.cpp reuses some widgets
 *  across tabs) and groups left empty by that. */
function prune(pages, keys) {
  const own = new Set(keys);
  return pages
    .map((p) => ({ ...p, groups: p.groups.map((g) => ({ ...g, keys: g.keys.filter((k) => own.has(k)) })).filter((g) => g.keys.length) }))
    .filter((p) => p.groups.length);
}

// ---------------------------------------------------------------------------

export { statements, functionBody, stringValue, parseDefault, parseEnumMaps, parseLayout };

function main() {
  const root = process.argv[2];
  if (!root) {
    console.error('usage: node scripts/gen-orca-schema.mjs <path-to-OrcaSlicer-source>');
    process.exit(2);
  }
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const printConfig = read('src/libslic3r/PrintConfig.cpp');
  const presetCpp = read('src/libslic3r/Preset.cpp');
  const tabCpp = read('src/slic3r/GUI/Tab.cpp');
  const version = read('version.inc').match(/SoftFever_VERSION\s+"([^"]+)"/)?.[1] ?? 'unknown';

  const enumMaps = parseEnumMaps(printConfig);
  const defs = parseDefs(printConfig, enumMaps);

  const extruderKeys = listLiteral(printConfig, 'm_extruder_option_keys');
  const printerKeys = [...new Set([
    ...listLiteral(presetCpp, 's_Preset_printer_options'),
    ...listLiteral(presetCpp, 's_Preset_machine_limits_options'),
    ...extruderKeys,
  ])];
  const filamentKeys = [...new Set(listLiteral(presetCpp, 's_Preset_filament_options'))];

  const printerLayout = completeLayout(prune(parseLayout(tabCpp, [
    { sig: 'void TabPrinter::build_fff()' },
    { sig: 'PageShp TabPrinter::build_kinematics_page()' },
    { sig: 'void TabPrinter::build_unregular_pages(' },
  ]).concat(parseLayout(read('src/slic3r/GUI/PhysicalPrinterDialog.cpp'), [
    // Orca keeps the upload target in its separate physical-printer dialog,
    // which has no page of its own to name.
    { sig: 'void PhysicalPrinterDialog::build_printhost_settings(', page: 'Connection', group: 'Print host upload' },
  ])), printerKeys), printerKeys, defs);
  const filamentLayout = completeLayout(prune(parseLayout(tabCpp, [
    { sig: 'void TabFilament::build()' },
    // Appended from a `for (key : { … })` over a lambda, not an option-line call.
    { sig: 'void TabFilament::add_filament_overrides_page()', placeLists: true },
  ]), filamentKeys), filamentKeys, defs);

  const used = new Set([...printerKeys, ...filamentKeys]);
  const options = Object.fromEntries(
    [...defs].filter(([k]) => used.has(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, d]) => {
      const { key: _key, enumType: _t, ...rest } = d;
      return [k, rest];
    }),
  );

  const missing = [...used].filter((k) => !defs.has(k));
  if (missing.length) console.error(`No PrintConfigDef entry (left untyped): ${missing.join(', ')}`);

  const schema = {
    orcaVersion: version,
    options,
    kinds: {
      printer: { keys: printerKeys, extruderKeys, layout: printerLayout },
      filament: { keys: filamentKeys, layout: filamentLayout },
    },
  };

  writeFileSync(OUT, `// SPDX-License-Identifier: AGPL-3.0-or-later
// GENERATED by scripts/gen-orca-schema.mjs from OrcaSlicer ${version}. Do not edit.
// Labels, tooltips and defaults are OrcaSlicer's (AGPL-3.0).

import type { OrcaSchema } from './orca-schema.js';

export const ORCA_SCHEMA: OrcaSchema = ${JSON.stringify(schema, null, 1)};
`);
  console.error(`Wrote ${Object.keys(options).length} options (printer ${printerKeys.length}, filament ${filamentKeys.length}) from OrcaSlicer ${version} → ${OUT}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
