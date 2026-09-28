// SPDX-License-Identifier: MIT
//
// Three simulated Moonraker printers on localhost, so the printers UI can be
// driven end to end with no real printer. Run with Node's type stripping:
//
//   node packages/gallery-app/scripts/fake-printers.ts [basePort]
//
// Left, Right and Center listen on basePort, +1, +2 (default 17125, or
// FAKE_PRINTERS_PORT) at 127.0.0.1. Left is printing, Right is idle, Center
// is paused (filament runout). Parallel runs (swarm agents) pick different
// base ports. It writes an Orca printer preset per printer to
// `.cache/fake-printers/<basePort>/` and prints them; import them in Settings.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { MoonrakerSim } from '../tests/fixtures/moonraker-sim.ts';

const HOST = '127.0.0.1';
const basePort = Number(process.argv[2] ?? process.env.FAKE_PRINTERS_PORT ?? 17125);
if (!Number.isInteger(basePort) || basePort < 1 || basePort > 65533) {
  console.error(`fake-printers: bad base port "${process.argv[2] ?? process.env.FAKE_PRINTERS_PORT}"`);
  process.exit(1);
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': '*',
};

function seed(sim: MoonrakerSim): void {
  sim.addFile('Base 75mm_PETG_4h12m.gcode', { estimatedTime: 15110, layers: 578, grams: 127, ageSec: 3 * 86400, objects: ['base_75mm'] });
  sim.addFile('hex-bit-holder-4.gcode', { estimatedTime: 2400, layers: 90, grams: 18, ageSec: 86400, objects: ['holder_1', 'holder_2', 'holder_3', 'holder_4'] });
  sim.addFile('test-cube-xyz.gcode', { estimatedTime: 900, layers: 100, grams: 6, ageSec: 3600, material: 'PLA', nozzleTemp: 215, bedTemp: 60 });
  sim.addFile('collar-tag-press-in.gcode', { estimatedTime: 1500, layers: 40, grams: 4, ageSec: 600, material: 'TPU', nozzleTemp: 230, bedTemp: 50, thumbnails: false });
}

const printers = [
  { name: 'Left', port: basePort, setup: (sim: MoonrakerSim) => { sim.startPrint('hex-bit-holder-4.gcode'); sim.tick(900); } },
  { name: 'Right', port: basePort + 1, setup: () => {} },
  { name: 'Center', port: basePort + 2, setup: (sim: MoonrakerSim) => { sim.startPrint('Base 75mm_PETG_4h12m.gcode'); sim.tick(4000); sim.runout(); } },
];

async function readBody(req: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function serve(sim: MoonrakerSim, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS).end();
    return;
  }
  const out = sim.handle({
    method: req.method ?? 'GET',
    url: req.url ?? '/',
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    body: await readBody(req),
  });
  if (out.kind === 'unreachable') {
    req.socket.destroy();
    return;
  }
  if (out.delayMs) await new Promise((r) => setTimeout(r, out.delayMs));
  if (out.stream) {
    const frame = Buffer.from(out.body);
    res.writeHead(200, { ...CORS, 'content-type': 'multipart/x-mixed-replace; boundary=frame', 'cache-control': 'no-store' });
    const send = () => res.write(Buffer.concat([
      Buffer.from(`--frame\r\ncontent-type: ${out.contentType}\r\ncontent-length: ${frame.length}\r\n\r\n`),
      frame,
      Buffer.from('\r\n'),
    ]));
    send();
    const timer = setInterval(send, 1000);
    res.on('close', () => clearInterval(timer));
    return;
  }
  res.writeHead(out.status, { ...CORS, 'content-type': out.contentType });
  res.end(typeof out.body === 'string' ? out.body : Buffer.from(out.body));
}

const presetDir = fileURLToPath(new URL(`../../../.cache/fake-printers/${basePort}/`, import.meta.url));
mkdirSync(presetDir, { recursive: true });

for (const p of printers) {
  const origin = `http://${HOST}:${p.port}`;
  const sim = new MoonrakerSim({ name: p.name, origin });
  seed(sim);
  p.setup(sim);
  setInterval(() => sim.tick(1), 1000).unref();
  const server = createServer((req, res) => {
    serve(sim, req, res).catch((err) => {
      console.error(`fake-printers ${p.name}:`, err);
      if (!res.headersSent) res.writeHead(500, CORS);
      res.end();
    });
  });
  server.listen(p.port, HOST);

  const presetName = `Sim ${p.name}`;
  const preset = {
    from: 'User',
    inherits: 'Flashforge Adventurer 5M 0.4 Nozzle',
    name: presetName,
    printer_settings_id: presetName,
    print_host: `${HOST}:${p.port}`,
    print_host_webui: origin,
    machine_start_gcode: 'START_PRINT EXTRUDER_TEMP=[nozzle_temperature_initial_layer] BED_TEMP=[bed_temperature_initial_layer_single]',
    machine_end_gcode: 'END_PRINT',
    version: '2.3.2.60',
  };
  const file = join(presetDir, `${presetName}.json`);
  writeFileSync(file, `${JSON.stringify(preset, null, 2)}\n`);
  console.log(`${p.name.padEnd(6)} ${origin}  (${sim.state})  preset: ${file}\n${JSON.stringify(preset)}`);
}
console.log(`\nImport the presets in Settings → Import (select all three .json files in ${presetDir}).`);
