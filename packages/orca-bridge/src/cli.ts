// SPDX-License-Identifier: MIT
// Enumeration CLI over a local OrcaSlicer install. A thin shell over
// `queries.ts` — the same functions the MCP server exposes. Prints JSON on
// stdout and diagnostics on stderr. Read-only by construction.

import { resolveOrcaPaths, searchedRoots, type OrcaPaths } from './paths.ts';
import type { PresetKind } from './presets.ts';
import { OrcaQueryError, PRESET_KINDS } from './queries.ts';
import * as q from './queries.ts';

const argv = process.argv.slice(2);
const command = argv[0];
const positionals = argv.slice(1).filter((a) => !a.startsWith('--'));

function flag(name: string): string | undefined {
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const idx = argv.indexOf(`--${name}`);
  if (idx < 0) return undefined;
  const next = argv[idx + 1];
  return next && !next.startsWith('--') ? next : '';
}

function has(name: string): boolean {
  return flag(name) !== undefined;
}

function list(name: string): string[] | undefined {
  return flag(name)?.split(',').map((s) => s.trim()).filter(Boolean);
}

function fail(message: string, hint?: string): never {
  process.stderr.write(`${message}\n`);
  if (hint) process.stderr.write(`${hint}\n`);
  process.exit(1);
}

function emit(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function paths(): OrcaPaths {
  const resolved = resolveOrcaPaths(flag('config'));
  if (!resolved) {
    fail(
      'No OrcaSlicer config directory found.',
      `Searched:\n${searchedRoots(flag('config')).map((r) => `  ${r}`).join('\n')}\n`
        + 'Pass --config <dir> or set ORCA_CONFIG_DIR.',
    );
  }
  return resolved;
}

function parseKind(value: string | undefined): PresetKind {
  if (value && (PRESET_KINDS as string[]).includes(value)) return value as PresetKind;
  fail(`Expected a preset kind (${PRESET_KINDS.join(' | ')}), got ${value ?? '<nothing>'}.`);
}

const USAGE = `orca-bridge — read-only enumeration of a local OrcaSlicer install

  doctor                         where the install is and what it holds
  printers  [--detail]           user printer presets (--scope system for vendor machines)
  presets   <kind> [--detail]    enumerate printer | filament | process presets
                                 filters: --scope user|system  --name <substring>
  preset    <kind> <name>        resolve one preset: chain, overrides, values
                                 --fields a,b   only these keys
                                 --raw          this file's own keys
                                 --merged       full resolved values
  machines                       network machines Orca has registered
  usage     [--limit N]          printer+filament+process combos actually used, most-used first
  projects                       recently sliced 3MF projects
  project   <path.3mf>           extract objects, plates and preset names from a project
                                 --config-fields a,b   pick keys from the flattened config
                                 --full-config         emit all ~600 keys
  logs      [--files N]          what the Orca logs actually contain

Global: --config <dir> (or ORCA_CONFIG_DIR) to point at a non-default install.
`;

async function main(): Promise<void> {
  switch (command) {
    case 'doctor':
      emit(q.doctor(paths()));
      break;
    case 'printers':
      emit(q.listPresets(paths(), {
        kind: 'printer',
        // A bare listing of 218 vendor machines is never what was wanted.
        scope: (flag('scope') as 'user' | 'system' | undefined) ?? 'user',
        name: flag('name'),
        detail: has('detail'),
      }));
      break;
    case 'presets':
      emit(q.listPresets(paths(), {
        kind: parseKind(positionals[0]),
        scope: flag('scope') as 'user' | 'system' | undefined,
        name: flag('name'),
        detail: has('detail'),
      }));
      break;
    case 'preset': {
      const name = positionals.slice(1).join(' ');
      if (!name) fail(`Usage: preset <${PRESET_KINDS.join('|')}> <name> [--fields a,b] [--raw] [--merged]`);
      emit(q.getPreset(paths(), {
        kind: parseKind(positionals[0]),
        name,
        fields: list('fields'),
        raw: has('raw'),
        merged: has('merged'),
      }));
      break;
    }
    case 'machines':
      emit(q.machines(paths()));
      break;
    case 'usage':
      emit(q.usage(paths(), Number(flag('limit') ?? 20)));
      break;
    case 'projects':
      emit(q.projects(paths()));
      break;
    case 'project':
      emit(await q.project({
        path: positionals.join(' '),
        configFields: list('config-fields'),
        fullConfig: has('full-config'),
      }));
      break;
    case 'logs':
      emit(q.logs(paths(), Number(flag('files') ?? 1)));
      break;
    case undefined:
    case 'help':
    case '--help':
      process.stdout.write(USAGE);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
      process.exit(1);
  }
}

try {
  await main();
} catch (err) {
  if (err instanceof OrcaQueryError) {
    fail(err.message, err.suggestions.length
      ? `Did you mean:\n${err.suggestions.map((s) => `  ${s}`).join('\n')}`
      : undefined);
  }
  throw err;
}
