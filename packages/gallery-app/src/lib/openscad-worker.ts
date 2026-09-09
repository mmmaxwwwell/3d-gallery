type OutputFormat = 'stl' | '3mf';

interface RenderRequest {
  type: 'render';
  id: string;
  scadSource: string;
  outputFormat: OutputFormat;
  args?: string[];
}

interface MulticolorRenderRequest {
  type: 'render-multicolor';
  id: string;
  scadSource: string;
}

interface InitRequest {
  type: 'init';
  id: string;
}

export type WorkerRequest = RenderRequest | MulticolorRenderRequest | InitRequest;

interface SuccessResponse {
  type: 'success';
  id: string;
  output: ArrayBuffer;
}

interface ErrorResponse {
  type: 'error';
  id: string;
  error: string;
  logs: string[];
}

interface InitResponse {
  type: 'init';
  id: string;
  success: boolean;
  error?: string;
}

interface LogResponse {
  type: 'log';
  id: string;
  logs: string[];
}

export type WorkerResponse = SuccessResponse | ErrorResponse | InitResponse | LogResponse;

let cachedModules: {
  OpenSCAD: any;
  addFonts: any;
  addMCAD: any;
  addBOSL2: any;
  addQR: any;
} | null = null;

async function loadModules() {
  if (cachedModules) return cachedModules;

  const base = 'https://mmmaxwwwell.github.io/openscad-web-generator';
  // @ts-ignore — runtime-resolved public assets
  const openscadModule = await import(/* @vite-ignore */ `${base}/wasm/openscad.js`);
  // @ts-ignore
  const fontsModule = await import(/* @vite-ignore */ `${base}/wasm/openscad.fonts.js`);
  // @ts-ignore
  const mcadModule = await import(/* @vite-ignore */ `${base}/wasm/openscad.mcad.js`);
  // @ts-ignore
  const bosl2Module = await import(/* @vite-ignore */ `${base}/wasm/openscad.bosl2.js`);
  // @ts-ignore
  const qrModule = await import(/* @vite-ignore */ `${base}/wasm/openscad.qr.js`);

  cachedModules = {
    OpenSCAD: openscadModule.default,
    addFonts: fontsModule.addFonts,
    addMCAD: mcadModule.addMCAD,
    addBOSL2: bosl2Module.addBOSL2,
    addQR: qrModule.addQR,
  };
  return cachedModules;
}

async function createInstance(
  onStdout: (text: string) => void,
  onStderr: (text: string) => void,
): Promise<any> {
  const { OpenSCAD, addFonts, addMCAD, addBOSL2, addQR } = await loadModules();
  const inst = await OpenSCAD({
    noInitialRun: true,
    print: onStdout,
    printErr: onStderr,
  });
  addFonts(inst);
  addMCAD(inst);
  addBOSL2(inst);
  addQR(inst);
  return inst;
}

async function runOpenSCAD(
  source: string,
  args: string[],
  inputPath: string,
  outputPath: string | null,
  onStdout: (text: string) => void,
  onStderr: (text: string) => void,
): Promise<{ exitCode: number; output: Uint8Array | null }> {
  const inst = await createInstance(onStdout, onStderr);
  inst.FS.writeFile(inputPath, source);
  for (const dir of ['/tmp', '/libraries', '/locale', '/home', '/home/web_user', '/home/web_user/.local', '/home/web_user/.local/share']) {
    try { inst.FS.mkdir(dir); } catch (_) { /* already exists */ }
  }

  let exitCode: number;
  try {
    const ret = inst.callMain(args);
    exitCode = typeof ret === 'number' ? ret : 0;
  } catch (e: any) {
    if (e?.name === 'ExitStatus') {
      exitCode = e.status ?? 0;
    } else if (e instanceof WebAssembly.RuntimeError) {
      throw new Error(`OpenSCAD WASM crashed: ${e.message}`);
    } else if (typeof e === 'number') {
      throw new Error('OpenSCAD crashed with an internal error (C++ exception)');
    } else {
      throw e;
    }
  }

  let output: Uint8Array | null = null;
  if (exitCode === 0 && outputPath) {
    let exists = false;
    try { inst.FS.stat(outputPath); exists = true; } catch (_) { /* ENOENT */ }
    if (exists) {
      try {
        const raw = inst.FS.readFile(outputPath) as Uint8Array;
        output = new Uint8Array(raw.byteLength);
        output.set(raw);
      } catch (readErr: any) {
        throw new Error(`Render succeeded but failed to read output: ${readErr?.message ?? readErr}`);
      }
    }
  }

  return { exitCode, output };
}

import { NAMED_COLORS, parseColorString } from './color-utils';

async function discoverColors(
  scadSource: string,
  log: (text: string) => void,
): Promise<[number, number, number, number][]> {
  const stderrLines: string[] = [];
  const colorIdTag = `colorid_${Date.now()}`;

  await runOpenSCAD(
    scadSource,
    ['/input.scad', '-o', '/output.stl', '-D', `module color(c) {echo(${colorIdTag}=str(c));}`],
    '/input.scad',
    null,
    () => {},
    (text) => stderrLines.push(text),
  );

  const prefix = `ECHO: ${colorIdTag} = `;
  const colorStrings = new Set<string>();
  for (const line of stderrLines) {
    if (line.startsWith(prefix)) {
      colorStrings.add(line.slice(prefix.length).trim());
    }
  }

  log(`Discovery stderr (${stderrLines.length} lines): ${stderrLines.slice(0, 10).join(' | ')}`);
  log(`Raw color strings: ${[...colorStrings].join(', ')}`);

  if (colorStrings.size === 0) {
    throw new Error('No colors found in model. Make sure geometry is wrapped in color() calls.');
  }

  const colors: [number, number, number, number][] = [];
  for (const s of colorStrings) {
    const rgba = parseColorString(s);
    if (rgba) colors.push(rgba);
    else log(`Warning: could not parse color: ${s}`);
  }

  colors.sort((a, b) => {
    for (let i = 0; i < 4; i++) { if (a[i] !== b[i]) return a[i] - b[i]; }
    return 0;
  });

  log(`Discovered ${colors.length} unique color(s)`);
  return colors;
}

async function renderSingleColor(
  scadSource: string,
  color: [number, number, number, number],
  _log: (text: string) => void,
): Promise<Uint8Array> {
  const colorStr = `[${color.join(', ')}]`;
  const collectedLogs: string[] = [];

  const [r, g, b, a] = color;
  const eps = 0.001;

  const namedColorChecks = Object.entries(NAMED_COLORS)
    .map(([name, [cr, cg, cb]]) => `c == "${name}" ? [${cr}, ${cg}, ${cb}, 1]`)
    .join(' : ');

  const colorFilter = [
    '$colored = false;',
    `function _resolve_color(c) = is_list(c) ? c : ${namedColorChecks} : [0,0,0,1];`,
    'module color(c) {',
    '  if ($colored) { children(); }',
    '  else {',
    '    $colored = true;',
    '    _c = _resolve_color(c);',
    `    _ca = len(_c) > 3 ? _c[3] : 1;`,
    `    if (abs(_c[0] - ${r}) < ${eps} && abs(_c[1] - ${g}) < ${eps} && abs(_c[2] - ${b}) < ${eps} && abs(_ca - ${a}) < ${eps}) children();`,
    '  }',
    '}',
  ].join(' ');

  const { exitCode, output } = await runOpenSCAD(
    scadSource,
    ['/input.scad', '-o', '/output.stl', '-D', colorFilter],
    '/input.scad',
    '/output.stl',
    (text) => collectedLogs.push(text),
    (text) => collectedLogs.push(text),
  );

  _log(`Filter logs for ${colorStr}: ${collectedLogs.join(' | ')}`);

  if (exitCode !== 0) throw new Error(`Render for color ${colorStr} failed (exit code ${exitCode})`);
  if (!output || output.byteLength === 0) {
    throw new Error(`Render for color ${colorStr} produced empty output (exit was ${exitCode}, ${collectedLogs.length} log lines)`);
  }

  return output;
}

self.addEventListener('error', (e) => console.error('[OpenSCAD worker] Unhandled error:', e.message, e));
self.addEventListener('unhandledrejection', (e) => console.error('[OpenSCAD worker] Unhandled rejection:', e.reason));

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;

  if (req.type === 'init') {
    try {
      await loadModules();
      self.postMessage({ type: 'init', id: req.id, success: true } satisfies InitResponse);
    } catch (err: any) {
      self.postMessage({ type: 'init', id: req.id, success: false, error: err?.message ?? String(err) } satisfies InitResponse);
    }
    return;
  }

  if (req.type === 'render') {
    const collectedLogs: string[] = [];
    const sendLog = (text: string) => {
      collectedLogs.push(text);
      self.postMessage({ type: 'log', id: req.id, logs: [text] } satisfies LogResponse);
    };

    try {
      const { exitCode, output } = await runOpenSCAD(
        req.scadSource,
        ['/input.scad', '-o', '/output.stl'],
        '/input.scad',
        '/output.stl',
        (text) => { console.log('[OpenSCAD stdout]', text); sendLog(text); },
        (text) => { console.warn('[OpenSCAD stderr]', text); sendLog(`[stderr] ${text}`); },
      );

      if (exitCode !== 0 || !output) {
        const errorMsg = exitCode > 255
          ? `OpenSCAD crashed (code ${exitCode}). This may be caused by high memory usage — try reducing $fn or model complexity.`
          : `OpenSCAD exited with code ${exitCode}`;
        self.postMessage({ type: 'error', id: req.id, error: errorMsg, logs: collectedLogs } satisfies ErrorResponse);
        return;
      }

      let finalOutput: Uint8Array;
      if (req.outputFormat === '3mf') {
        const { merge3mf } = await import('./merge-3mf');
        const defaultColor: [number, number, number, number] = [0.29, 0.56, 0.85, 1];
        finalOutput = merge3mf([{ color: defaultColor, data: output }]);
      } else {
        finalOutput = output;
      }

      const buf = new ArrayBuffer(finalOutput.byteLength);
      new Uint8Array(buf).set(finalOutput);
      self.postMessage({ type: 'success', id: req.id, output: buf } satisfies SuccessResponse, { transfer: [buf] });
    } catch (err: any) {
      console.error('[OpenSCAD worker] Unexpected error:', err);
      self.postMessage({ type: 'error', id: req.id, error: err?.message ?? String(err), logs: collectedLogs } satisfies ErrorResponse);
    }
  }

  if (req.type === 'render-multicolor') {
    const collectedLogs: string[] = [];
    const sendLog = (text: string) => {
      collectedLogs.push(text);
      self.postMessage({ type: 'log', id: req.id, logs: [text] } satisfies LogResponse);
    };

    try {
      sendLog('Rendering to CSG (resolving colors)...');
      const { exitCode: csgExit, output: csgOutput } = await runOpenSCAD(
        req.scadSource,
        ['/input.scad', '-o', '/output.csg'],
        '/input.scad',
        '/output.csg',
        () => {},
        (text) => sendLog(`[stderr] ${text}`),
      );

      if (csgExit !== 0 || !csgOutput) throw new Error(`CSG render failed (exit code ${csgExit})`);

      const csgSource = new TextDecoder().decode(csgOutput);
      sendLog('CSG render complete.');

      const csgLines = csgSource.split('\n');
      sendLog(`CSG: ${csgLines.length} lines total`);
      const colorLines = csgLines.filter(l => l.toLowerCase().includes('color'));
      sendLog(`CSG color lines: ${colorLines.slice(0, 5).join(' | ')}`);

      sendLog('Discovering colors...');
      const colors = await discoverColors(csgSource, sendLog);

      const { merge3mf } = await import('./merge-3mf');
      const coloredModels: { color: [number, number, number, number]; data: Uint8Array }[] = [];

      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        sendLog(`Rendering color ${i + 1}/${colors.length}: [${color.join(', ')}]`);
        const data = await renderSingleColor(csgSource, color, sendLog);
        coloredModels.push({ color, data });
      }

      sendLog('Merging into multi-color 3MF...');
      const merged = merge3mf(coloredModels);

      const buf = merged.buffer.byteLength === merged.byteLength
        ? merged.buffer as ArrayBuffer
        : merged.slice().buffer as ArrayBuffer;

      sendLog('Multi-color 3MF complete!');
      self.postMessage({ type: 'success', id: req.id, output: buf } satisfies SuccessResponse, { transfer: [buf] });
    } catch (err: any) {
      console.error('[OpenSCAD worker] Multicolor render error:', err);
      self.postMessage({ type: 'error', id: req.id, error: err?.message ?? String(err), logs: collectedLogs } satisfies ErrorResponse);
    }
  }
};
