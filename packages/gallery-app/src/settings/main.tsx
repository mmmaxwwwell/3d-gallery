// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Settings page's entry: OrcaSlicer import, presets and process templates.
// Not a tab — it's reached from Home, the rail's gear, a gear in Project and
// Printers, and every empty state that asks for an import — so closing it goes
// back to whichever page that was.

import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { guardPageUnload, setPrintLeaveGuard } from '../print/nav-guard.js';
import { SettingsPanel } from './SettingsPanel.js';
import './settings.css';

/** Back to the page that opened Settings, or Home when it was opened cold. */
function leave(): void {
  // The panel has already asked about unsaved edits; the unload mustn't ask again.
  setPrintLeaveGuard(null);
  const base = new URL(import.meta.env.BASE_URL, location.href).href;
  if (history.length > 1 && document.referrer.startsWith(base)) history.back();
  else location.assign(import.meta.env.BASE_URL);
}

registerServiceWorker();
mountShell(document.getElementById('shell-nav')!, 'settings');
guardPageUnload();
render(<SettingsPanel onClose={leave} />, document.getElementById('page')!);
