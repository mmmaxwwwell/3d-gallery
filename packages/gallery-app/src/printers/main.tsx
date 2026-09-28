// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Printers page's entry.

import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { syncFromServerOnce } from '../print/server-store.js';
import { PrintersApp } from './PrintersApp.js';
import './printers.css';

registerServiceWorker();
mountShell(document.getElementById('shell-nav')!, 'printers');
// Printers come from the presets, and the optional server store may hold newer ones.
void syncFromServerOnce();
render(<PrintersApp />, document.getElementById('page')!);
