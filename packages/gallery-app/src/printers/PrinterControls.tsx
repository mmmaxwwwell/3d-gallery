// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// Stand-in for the printer controls (task T5b owns this file and replaces it
// whole). It fixes the props every card passes, so the page builds before the
// controls land.

import type { PrinterLiveStatus } from '@3d-gallery/print-toolkit';

export interface PrinterControlsProps {
  printer: { id: string; name: string; address: string };
  live: PrinterLiveStatus | null;
  /** The page runs `run`, toasts how it went, and polls the printer again at once. */
  onCommand(label: string, run: () => Promise<void>): void;
}

export function PrinterControls(_props: PrinterControlsProps) {
  return null;
}
