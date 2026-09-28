// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { Home } from './Home.js';
import './home.css';

export function mountHome(): void {
  registerServiceWorker();
  mountShell(document.getElementById('shell-nav')!, 'home');
  render(<Home />, document.getElementById('page')!);
}
