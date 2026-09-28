// SPDX-License-Identifier: MIT
//
// Mounts PrinterControls on its own, the way the Printers page hosts it: poll
// the printer, run each command, report it and poll again at once. The e2e
// spec loads this through Vite's /@fs/ so the controls are tested without
// depending on the page around them. Plain `h()`, as Vite compiles files
// outside src/ without the app's JSX settings.

import { fetchPrinterLive, type PrinterLiveStatus } from '@3d-gallery/print-toolkit';
import { h, render } from 'preact';
import { PrinterControls } from '../../../src/printers/PrinterControls.tsx';

export interface HarnessLog {
  label: string;
  error?: string;
}

export function mountControls(root: HTMLElement, printer: { id: string; name: string; address: string }): HarnessLog[] {
  const log: HarnessLog[] = [];
  let live: PrinterLiveStatus | null = null;

  const draw = () => render(h(PrinterControls, { printer, live, onCommand }), root);
  const poll = async () => {
    live = await fetchPrinterLive(printer.address).catch(() => null);
    draw();
  };
  function onCommand(label: string, run: () => Promise<void>): void {
    run().then(
      () => { log.push({ label }); },
      (err: unknown) => { log.push({ label, error: err instanceof Error ? err.message : String(err) }); },
    ).finally(poll);
  }

  draw();
  void poll();
  setInterval(poll, 250);
  return log;
}
