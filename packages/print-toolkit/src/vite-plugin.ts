// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { basename, extname, resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

export interface CopyPrintToolkitAssetsOptions {
  /** Sub-path (relative to Vite's outDir / dev base) where assets are exposed. Default: 'wasm'. */
  dest?: string;
}

const MIME_BY_EXT: Record<string, string> = {
  '.wasm': 'application/wasm',
  '.js': 'application/javascript',
};

function resolveAssetsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/vite-plugin.ts → ../assets ; dist/vite-plugin.js → ../assets. Both walk one up.
  return resolve(here, '..', 'assets');
}

function listAssets(assetsDir: string): string[] {
  if (!existsSync(assetsDir)) return [];
  return readdirSync(assetsDir)
    .filter((name) => {
      const full = join(assetsDir, name);
      if (!statSync(full).isFile()) return false;
      const ext = extname(name);
      return ext === '.js' || ext === '.wasm';
    })
    .sort();
}

function assertAssetsPresent(assetsDir: string, files: string[]): void {
  if (files.length === 0) {
    throw new Error(
      `[@3d-gallery/print-toolkit] No WASM assets found in ${assetsDir}. ` +
        `Run: npm run fetch-wasm -w @3d-gallery/print-toolkit`
    );
  }
}

export function copyPrintToolkitAssets(options: CopyPrintToolkitAssetsOptions = {}): Plugin {
  const dest = (options.dest ?? 'wasm').replace(/^\/+|\/+$/g, '');
  const assetsDir = resolveAssetsDir();

  return {
    name: '@3d-gallery/print-toolkit:copy-assets',

    buildStart() {
      const files = listAssets(assetsDir);
      assertAssetsPresent(assetsDir, files);
      for (const name of files) {
        const source = readFileSync(join(assetsDir, name));
        this.emitFile({
          type: 'asset',
          fileName: `${dest}/${basename(name)}`,
          source,
        });
      }
    },

    configureServer(server) {
      const files = listAssets(assetsDir);
      assertAssetsPresent(assetsDir, files);
      const base = server.config.base.replace(/\/+$/, '');
      const prefix = `${base}/${dest}/`;
      const byName = new Map(files.map((name) => [name, join(assetsDir, name)]));

      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(prefix)) return next();
        const rest = req.url.slice(prefix.length).split('?')[0];
        const filePath = byName.get(rest);
        if (!filePath) return next();
        const mime = MIME_BY_EXT[extname(rest)] ?? 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        // Long-cache in dev is fine — file names are stable and dev doesn't hash them.
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(filePath));
      });
    },
  };
}

export default copyPrintToolkitAssets;
