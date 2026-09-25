// SPDX-License-Identifier: MIT
// Builds a throwaway OrcaSlicer config tree plus a synthetic 3MF project, so
// the suite never depends on a real install being present.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

export interface Fixture {
  root: string;
  projectPath: string;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/** A four-level machine chain mirroring how Orca ships Flashforge profiles:
 *  root common → vendor common → model+nozzle → user override. */
function writeMachines(root: string, userProfile: string): void {
  const systemDir = join(root, 'system', 'TestVendor', 'machine');
  mkdirSync(systemDir, { recursive: true });

  writeJson(join(systemDir, 'fdm_common.json'), {
    type: 'machine',
    name: 'fdm_common',
    from: 'system',
    gcode_flavor: 'klipper',
    printable_height: '200',
    retraction_length: ['0.5'],
    machine_start_gcode: 'G28',
    machine_end_gcode: 'M104 S0',
  });

  writeJson(join(systemDir, 'Test Printer 0.4 Nozzle.json'), {
    type: 'machine',
    name: 'Test Printer 0.4 Nozzle',
    inherits: 'fdm_common',
    from: 'system',
    printer_model: 'Test Printer',
    printer_variant: '0.4',
    nozzle_diameter: ['0.4'],
    printable_height: '220',
  });

  // Exists only to be shadowed by a user preset of the same name. Kept off the
  // 0.4 chain so the shadowing test can't perturb the resolution tests.
  writeJson(join(systemDir, 'Test Printer 0.6 Nozzle.json'), {
    type: 'machine',
    name: 'Test Printer 0.6 Nozzle',
    inherits: 'fdm_common',
    from: 'system',
    printer_variant: '0.6',
    printable_height: '220',
  });

  // A vendor bundle must be ignored rather than treated as a preset.
  writeJson(join(systemDir, 'TestVendor.json'), {
    name: 'TestVendor',
    machine_list: [{ name: 'Test Printer 0.4 Nozzle' }],
  });

  const userDir = join(root, 'user', userProfile, 'machine');
  mkdirSync(userDir, { recursive: true });

  writeJson(join(userDir, 'Test Printer Left.json'), {
    from: 'User',
    inherits: 'Test Printer 0.4 Nozzle',
    name: 'Test Printer Left',
    printer_settings_id: 'Test Printer Left',
    print_host: '10.0.0.11:7125',
    machine_start_gcode: 'START_PRINT',
    version: '2.3.2.60',
  });

  writeJson(join(userDir, 'Test Printer Right.json'), {
    from: 'User',
    inherits: 'Test Printer 0.4 Nozzle',
    name: 'Test Printer Right',
    printer_settings_id: 'Test Printer Right',
    print_host: '10.0.0.12:7125',
    version: '2.3.2.60',
  });

  // Same name as a system preset — the user copy must win.
  writeJson(join(userDir, 'Test Printer 0.6 Nozzle.json'), {
    from: 'User',
    inherits: 'fdm_common',
    name: 'Test Printer 0.6 Nozzle',
    printable_height: '999',
  });

  // Names a parent that does not exist anywhere.
  writeJson(join(userDir, 'Orphan Printer.json'), {
    from: 'User',
    inherits: 'No Such Parent',
    name: 'Orphan Printer',
    print_host: '10.0.0.13:7125',
  });
}

function writeFilamentsAndProcesses(root: string, userProfile: string): void {
  const sysFilament = join(root, 'system', 'TestVendor', 'filament');
  mkdirSync(sysFilament, { recursive: true });
  writeJson(join(sysFilament, 'Generic PETG.json'), {
    type: 'filament',
    name: 'Generic PETG',
    from: 'system',
    filament_type: ['PETG'],
    nozzle_temperature: ['240'],
  });

  const userFilament = join(root, 'user', userProfile, 'filament');
  mkdirSync(userFilament, { recursive: true });
  writeJson(join(userFilament, 'House PETG.json'), {
    from: 'User',
    inherits: 'Generic PETG',
    name: 'House PETG',
    filament_settings_id: 'House PETG',
    nozzle_temperature: ['250'],
    compatible_printers: ['Test Printer 0.4 Nozzle'],
  });

  const userProcess = join(root, 'user', userProfile, 'process');
  mkdirSync(userProcess, { recursive: true });
  writeJson(join(userProcess, 'Fast 0.28.json'), {
    from: 'User',
    name: 'Fast 0.28',
    print_settings_id: 'Fast 0.28',
    layer_height: '0.28',
  });
}

function writeConf(root: string, projectPath: string): void {
  writeJson(join(root, 'OrcaSlicer.conf'), {
    app: { log_severity_level: 'warning', version: '01.10.01.50' },
    presets: { machine: 'Test Printer Left', filaments: null },
    recent_projects: { '001': projectPath, '002': '/nonexistent/gone.3mf' },
    local_machines: {
      '10.0.0.11:7125': {
        dev_ip: '10.0.0.11:7125',
        dev_name: 'Left',
        printer_type: 'Test Printer',
      },
    },
    models: [{ model: 'Test Printer', vendor: 'TestVendor', nozzle_diameter: '0.4' }],
    orca_presets: [
      // Two identical rows — must collapse to one combo with count 2.
      { machine: 'Test Printer Left', filament: 'House PETG', process: 'Fast 0.28', curr_bed_type: '3' },
      { machine: 'Test Printer Left', filament: 'House PETG', process: 'Fast 0.28', curr_bed_type: '3' },
      { machine: 'Test Printer Right', filament: 'House PETG', filament_01: 'Generic PETG', process: 'Fast 0.28' },
    ],
  });

  const logDir = join(root, 'log');
  mkdirSync(logDir, { recursive: true });
  const spam = Array.from(
    { length: 50 },
    () => '[warning]\t2026-01-01 00:00:00.000000[Thread 0x1]:get_version not supported, return 0.0!',
  ).join('\n');
  writeFileSync(
    join(logDir, 'debug_Test.log.0'),
    `[info]\t2026-01-01 00:00:00.000000[Thread 0x1]:gui mode, Current OrcaSlicer Version 2.3.2\n${spam}\n`
      + '[error]\t2026-01-01 00:00:01.000000[Thread 0x1]:something broke at /some/path/file.txt\n',
  );
}

const MODEL_SETTINGS = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="2">
    <metadata key="name" value="widget.stl"/>
    <metadata key="extruder" value="1"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="widget.stl"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata key="source_file" value="widget.stl"/>
      <metadata key="source_offset_x" value="10.5"/>
      <metadata key="source_offset_y" value="20.25"/>
      <metadata key="source_offset_z" value="3"/>
    </part>
  </object>
  <object id="4">
    <metadata key="name" value="bracket.stl"/>
    <metadata key="extruder" value="2"/>
    <part id="3" subtype="normal_part">
      <metadata key="name" value="bracket.stl"/>
      <metadata key="source_file" value="bracket.stl"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Plate A"/>
    <metadata key="thumbnail_file" value="Metadata/plate_1.png"/>
    <model_instance>
      <metadata key="object_id" value="2"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
    <model_instance>
      <metadata key="object_id" value="4"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
  </plate>
</config>
`;

function writeProject(path: string): void {
  const projectSettings = {
    printer_settings_id: 'Test Printer Left',
    filament_settings_id: ['House PETG'],
    print_settings_id: 'Fast 0.28',
    printer_model: 'Test Printer',
    printer_variant: '0.4',
    nozzle_diameter: ['0.4'],
    filament_type: ['PETG'],
    layer_height: 0.28,
    curr_bed_type: 'High Temp Plate',
    version: '2.3.2',
    // Filler so configFieldCount is meaningfully > the identity fields.
    outer_wall_speed: 200,
    sparse_infill_density: '15%',
  };
  const plateJson = {
    bbox_all: [0, 0, 50, 50],
    bbox_objects: [
      { id: 101, name: 'widget.stl', bbox: [0, 0, 20, 20], area: 400, layer_height: 0.28 },
      { id: 102, name: 'bracket.stl', bbox: [25, 25, 50, 50], area: 625, layer_height: 0.28 },
    ],
  };

  const zip = zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types/>'),
    '3D/3dmodel.model': strToU8('<?xml version="1.0"?><model/>'),
    '3D/Objects/widget.stl_1.model': strToU8('<mesh/>'),
    '3D/Objects/bracket.stl_2.model': strToU8('<mesh/>'),
    'Metadata/project_settings.config': strToU8(JSON.stringify(projectSettings)),
    'Metadata/model_settings.config': strToU8(MODEL_SETTINGS),
    'Metadata/plate_1.json': strToU8(JSON.stringify(plateJson)),
    'Metadata/plate_1.png': strToU8('not-really-a-png'),
  });
  writeFileSync(path, zip);
}

export function makeFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'orca-bridge-'));
  const projectPath = join(root, 'demo.3mf');
  writeMachines(root, '12345');
  writeFilamentsAndProcesses(root, '12345');
  writeProject(projectPath);
  writeConf(root, projectPath);
  return { root, projectPath };
}
