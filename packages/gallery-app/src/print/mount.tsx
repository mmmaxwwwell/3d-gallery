// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { PrintDialog, type PrintDialogModel, type PrintDialogPart } from './PrintDialog.js';
import { SettingsPanel } from './SettingsPanel.js';

/**
 * Preact print UI lives in a single portal div appended to <body>. Each open
 * call clears the portal, renders the modal, and returns a `close` handle so
 * the imperative host (`src/main.ts`) doesn't need to hold a Preact ref.
 */
function ensurePortal(): HTMLDivElement {
  let portal = document.getElementById('print-portal') as HTMLDivElement | null;
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'print-portal';
    document.body.appendChild(portal);
  }
  return portal;
}

function clearPortal() {
  const portal = ensurePortal();
  render(null, portal);
}

export function openPrintDialog(model: PrintDialogModel, part: PrintDialogPart): void {
  const portal = ensurePortal();
  render(
    <PrintDialog model={model} part={part} onClose={clearPortal} />,
    portal,
  );
}

export function openSettingsPanel(): void {
  const portal = ensurePortal();
  render(<SettingsPanel onClose={clearPortal} />, portal);
}
