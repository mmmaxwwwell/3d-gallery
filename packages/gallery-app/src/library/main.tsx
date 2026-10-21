// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Library page's entry. Not a tab: reached from the Models list.

import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { LibraryPage } from './LibraryPage.js';
import './library.css';

registerServiceWorker();
mountShell(document.getElementById('shell-nav')!, 'library');
render(<LibraryPage />, document.getElementById('page')!);
