// SPDX-License-Identifier: MIT
// Keeps every printer's status fresh for the Printers page: one loop per
// printer, so a slow or dead one never holds up the rest, polling fast while
// the page is on screen and slowly behind another app.

import { fetchConsoleTail, fetchPrinterLive, listWebcams } from '@3d-gallery/print-toolkit';
import { EMPTY_POLL, pollDelayMs, type FleetPrinter, type PrinterPoll } from './fleet-model.js';

const CONSOLE_LINES = 20;

interface Loop {
  printer: FleetPrinter;
  poll: PrinterPoll;
  timer: number | null;
  running: boolean;
  /** Asked for again while a poll was in flight. */
  again: boolean;
  stopped: boolean;
}

export class FleetPoller {
  private loops = new Map<string, Loop>();
  private expanded = new Set<string>();
  private readonly onVisibility = () => {
    if (document.visibilityState === 'visible') for (const id of this.loops.keys()) this.pollNow(id);
  };

  constructor(private readonly onChange: (id: string, poll: PrinterPoll) => void) {
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Starts a loop for each new printer, and restarts one whose address moved. */
  setPrinters(printers: readonly FleetPrinter[]): void {
    const wanted = new Map(printers.map((p) => [p.id, p]));
    for (const [id, loop] of this.loops) {
      const next = wanted.get(id);
      if (!next || next.address !== loop.printer.address) this.drop(id);
      else loop.printer = next;
    }
    for (const printer of printers) {
      if (this.loops.has(printer.id)) continue;
      const loop: Loop = { printer, poll: EMPTY_POLL, timer: null, running: false, again: false, stopped: false };
      this.loops.set(printer.id, loop);
      this.onChange(printer.id, loop.poll);
      void this.run(loop);
    }
  }

  /** An open card also wants the console. */
  setExpanded(id: string, open: boolean): void {
    if (open) this.expanded.add(id);
    else this.expanded.delete(id);
    if (open) this.pollNow(id);
  }

  pollNow(id: string): void {
    const loop = this.loops.get(id);
    if (!loop) return;
    if (loop.running) {
      loop.again = true;
      return;
    }
    if (loop.timer !== null) window.clearTimeout(loop.timer);
    void this.run(loop);
  }

  stop(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    for (const id of [...this.loops.keys()]) this.drop(id);
  }

  private drop(id: string): void {
    const loop = this.loops.get(id);
    if (!loop) return;
    loop.stopped = true;
    if (loop.timer !== null) window.clearTimeout(loop.timer);
    this.loops.delete(id);
  }

  private async run(loop: Loop): Promise<void> {
    loop.timer = null;
    loop.running = true;
    const { address } = loop.printer;
    let poll: PrinterPoll;
    try {
      const live = await fetchPrinterLive(address);
      poll = { ...loop.poll, live, lastOkAt: Date.now(), failures: 0, error: null };
      if (poll.cams === null) poll.cams = await listWebcams(address).catch(() => []);
      if (this.expanded.has(loop.printer.id)) {
        poll.console = await fetchConsoleTail(address, CONSOLE_LINES).catch(() => poll.console);
      }
    } catch (e) {
      poll = { ...loop.poll, failures: loop.poll.failures + 1, error: e instanceof Error ? e.message : String(e) };
    }
    loop.running = false;
    if (loop.stopped) return;
    loop.poll = poll;
    this.onChange(loop.printer.id, poll);
    if (loop.again) {
      loop.again = false;
      void this.run(loop);
      return;
    }
    const delay = pollDelayMs(document.visibilityState === 'visible', poll.failures);
    loop.timer = window.setTimeout(() => void this.run(loop), delay);
  }
}
