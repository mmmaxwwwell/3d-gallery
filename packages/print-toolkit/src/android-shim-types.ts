// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Contract between the Android WebView host and this toolkit.
 *
 * The host may inject any of these globals; the toolkit feature-detects
 * them at runtime. All three are optional — the toolkit runs unmodified
 * in a plain browser without them.
 *
 * Method signatures here MUST match the `@JavascriptInterface` classes
 * exposed by the Android shell. Do not change without updating both sides.
 */

/** Native OrcaSlicer bridge — skips the WASM path when present. */
export interface NativeSlicerBridge {
  isAvailable(): boolean;
  engineName(): string;
  sliceAsync(inputPath: string, configJson: string, callbackId: string): void;
  cancelSlice(callbackId: string): void;
  writeInputFile(base64Data: string, fileName: string): string;
  readOutputFile(path: string): string;
}

/** mDNS/NSD-backed LAN scan for Moonraker hosts + cleartext-traffic hint. */
export interface AndroidPrinterDiscoveryBridge {
  /**
   * Whether the WebView is allowed to reach `http://…` endpoints even
   * when the page itself is served over HTTPS. When true, the toolkit
   * skips its mixed-content guard for Moonraker requests.
   */
  allowsCleartextTraffic?(): boolean;
}

/** Storage Access Framework file picker for Orca config imports. */
export interface AndroidFileBridge {
  /** Opens the SAF file picker and resolves with the file bytes as base64. */
  openFile?(mimeTypes: string): Promise<string>;
  /** Saves bytes to a user-chosen location via SAF. */
  saveFile?(mimeType: string, base64Data: string, suggestedName?: string): Promise<string>;
}

declare global {
  interface Window {
    NativeSlicer?: NativeSlicerBridge;
    AndroidPrinterDiscovery?: AndroidPrinterDiscoveryBridge;
    AndroidFileBridge?: AndroidFileBridge;
    /** Progress callback invoked by the native slicer while slicing. */
    onSlicerProgress?: (callbackId: string, stage: string, progress: number) => void;
    /** Success callback invoked by the native slicer with the GCode path. */
    onSlicerResult?: (callbackId: string, gcodePath: string) => void;
    /** Error callback invoked by the native slicer. */
    onSlicerError?: (callbackId: string, message: string) => void;
  }
}

export {};
