// SPDX-License-Identifier: MIT
// Locating an OrcaSlicer install. Read-only: nothing in this package ever
// writes under the config root.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface OrcaPaths {
  /** Config root — the dir holding `OrcaSlicer.conf`, `user/`, `system/`. */
  root: string;
  conf: string;
  /** One dir per Orca account/profile id under `user/` (e.g. `3010331269`, `default`). */
  userDirs: string[];
  systemDir: string;
  logDir: string;
}

/** Candidate roots per platform, most likely first. */
function candidateRoots(): string[] {
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return [join(home, 'Library', 'Application Support', 'OrcaSlicer')];
    case 'win32': {
      const appData = process.env['APPDATA'];
      return appData ? [join(appData, 'OrcaSlicer')] : [];
    }
    default:
      return [join(home, '.config', 'OrcaSlicer')];
  }
}

function isDir(p: string): boolean {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

/** Resolve the install: an explicit root if given, otherwise the platform
 *  default. Returns null when the root does not exist — callers report that as
 *  a precondition, not a crash. */
export function resolveOrcaPaths(override?: string): OrcaPaths | null {
  const root = searchedRoots(override).find((r) => isDir(r));
  if (!root) return null;

  const userRoot = join(root, 'user');
  const userDirs = isDir(userRoot)
    ? readdirSync(userRoot)
        .map((d) => join(userRoot, d))
        .filter(isDir)
        .sort()
    : [];

  return {
    root,
    conf: join(root, 'OrcaSlicer.conf'),
    userDirs,
    systemDir: join(root, 'system'),
    logDir: join(root, 'log'),
  };
}

/** The roots resolution will consider, in order. Also drives error messages.
 *
 *  An explicitly named root is authoritative — it is never supplemented with
 *  the platform default, because silently answering about a *different* install
 *  than the caller named is worse than reporting that theirs is missing. */
export function searchedRoots(override?: string): string[] {
  const explicit = override?.trim() || process.env['ORCA_CONFIG_DIR']?.trim();
  return explicit ? [explicit] : candidateRoots();
}

export function hasConf(paths: OrcaPaths): boolean {
  return existsSync(paths.conf);
}
