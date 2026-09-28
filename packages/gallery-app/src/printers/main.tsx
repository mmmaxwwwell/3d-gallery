// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Printers page's entry.

import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { PrintersApp } from './PrintersApp.js';
import './printers.css';

registerServiceWorker();
mountShell(document.getElementById('shell-nav')!, 'printers');
render(<PrintersApp />, document.getElementById('page')!);
