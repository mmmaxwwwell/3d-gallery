import { zipSync, unzipSync } from 'fflate';

export interface ColorGroup {
  index: number;
  colorHex: string;
}

export interface ColorMesh {
  extruder: number;
  colorHex: string;
  vertices: Float32Array;
}

export function extractColorMeshes(threeMfData: ArrayBuffer): ColorMesh[] {
  try {
    const unzipped = unzipSync(new Uint8Array(threeMfData));

    let modelXml: string | undefined;
    for (const [path, data] of Object.entries(unzipped)) {
      if (path.toLowerCase().endsWith('3dmodel.model')) {
        modelXml = new TextDecoder().decode(data);
        break;
      }
    }
    if (!modelXml) return [];

    const colorGroupMap = new Map<string, string>();
    const colorGroupOrder: string[] = [];
    const cgRe = /<colorgroup\s+id="(\d+)"[^>]*>\s*<color\s+color="([^"]+)"\s*\/>\s*<\/colorgroup>/g;
    let cgMatch: RegExpExecArray | null;
    while ((cgMatch = cgRe.exec(modelXml)) !== null) {
      colorGroupMap.set(cgMatch[1], cgMatch[2]);
      colorGroupOrder.push(cgMatch[1]);
    }
    if (colorGroupMap.size < 2) return [];

    const hasPerTrianglePid = /<triangle\s+[^>]*pid="/.test(modelXml);

    if (hasPerTrianglePid) {
      const verticesMatch = modelXml.match(/<vertices>([\s\S]*?)<\/vertices>/);
      const trianglesMatch = modelXml.match(/<triangles>([\s\S]*?)<\/triangles>/);
      if (!verticesMatch || !trianglesMatch) return [];

      const vertexData: number[] = [];
      const vertexRe = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"\s*\/>/g;
      let vMatch: RegExpExecArray | null;
      while ((vMatch = vertexRe.exec(verticesMatch[1])) !== null) {
        vertexData.push(parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3]));
      }

      const objPidMatch = modelXml.match(/<object\s+[^>]*pid="(\d+)"/);
      const defaultPid = objPidMatch ? objPidMatch[1] : null;

      const triVertsByColor = new Map<string, number[]>();
      const triRe = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"(?:\s+pid="(\d+)")?(?:\s+p1="\d+")?\s*\/>/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = triRe.exec(trianglesMatch[1])) !== null) {
        const pid = tMatch[4] || defaultPid;
        if (!pid || !colorGroupMap.has(pid)) continue;

        let verts = triVertsByColor.get(pid);
        if (!verts) {
          verts = [];
          triVertsByColor.set(pid, verts);
        }
        for (const vi of [parseInt(tMatch[1]), parseInt(tMatch[2]), parseInt(tMatch[3])]) {
          verts.push(vertexData[vi * 3], vertexData[vi * 3 + 1], vertexData[vi * 3 + 2]);
        }
      }

      const meshes: ColorMesh[] = [];
      for (const pid of colorGroupOrder) {
        const verts = triVertsByColor.get(pid);
        if (!verts || verts.length === 0) continue;
        meshes.push({
          extruder: colorGroupOrder.indexOf(pid),
          colorHex: colorGroupMap.get(pid)!,
          vertices: new Float32Array(verts),
        });
      }
      return meshes;
    }

    const objectRe = /<object\s+[^>]*id="(\d+)"[^>]*pid="(\d+)"[^>]*>[\s\S]*?<vertices>([\s\S]*?)<\/vertices>\s*<triangles>([\s\S]*?)<\/triangles>[\s\S]*?<\/object>/g;
    const meshes: ColorMesh[] = [];
    let objMatch: RegExpExecArray | null;
    while ((objMatch = objectRe.exec(modelXml)) !== null) {
      const pid = objMatch[2];
      const colorHex = colorGroupMap.get(pid);
      if (!colorHex) continue;

      const extruder = colorGroupOrder.indexOf(pid);

      const vertexData: number[] = [];
      const vertexRe = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"\s*\/>/g;
      let vMatch: RegExpExecArray | null;
      while ((vMatch = vertexRe.exec(objMatch[3])) !== null) {
        vertexData.push(parseFloat(vMatch[1]), parseFloat(vMatch[2]), parseFloat(vMatch[3]));
      }

      const triangleVerts: number[] = [];
      const triRe = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"\s*\/>/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = triRe.exec(objMatch[4])) !== null) {
        for (const vi of [parseInt(tMatch[1]), parseInt(tMatch[2]), parseInt(tMatch[3])]) {
          triangleVerts.push(vertexData[vi * 3], vertexData[vi * 3 + 1], vertexData[vi * 3 + 2]);
        }
      }

      if (triangleVerts.length > 0) {
        meshes.push({ extruder, colorHex, vertices: new Float32Array(triangleVerts) });
      }
    }

    return meshes;
  } catch {
    return [];
  }
}

export interface ColoredModel {
  color: [number, number, number, number];
  data: Uint8Array;
}

interface Mesh {
  vertices: { x: number; y: number; z: number }[];
  triangles: { v1: number; v2: number; v3: number }[];
}

function linearToSRGB(linear: number): number {
  if (linear <= 0.0031308) return linear * 12.92;
  return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

function toHex(value: number): string {
  const byte = Math.round(Math.max(0, Math.min(1, value)) * 255);
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

function colorToHex(color: [number, number, number, number]): string {
  return `#${toHex(linearToSRGB(color[0]))}${toHex(linearToSRGB(color[1]))}${toHex(linearToSRGB(color[2]))}${toHex(color[3])}`;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractMeshFromSTL(data: Uint8Array): Mesh {
  const vertices: Mesh['vertices'] = [];
  const triangles: Mesh['triangles'] = [];
  const vertexMap = new Map<string, number>();

  function addVertex(x: number, y: number, z: number): number {
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const idx = vertices.length;
    vertices.push({ x, y, z });
    vertexMap.set(key, idx);
    return idx;
  }

  const header = new TextDecoder().decode(data.subarray(0, 5));
  if (header === 'solid') {
    const text = new TextDecoder().decode(data);
    const facetRe = /facet\s+normal\s+\S+\s+\S+\s+\S+\s+outer\s+loop\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+endloop\s+endfacet/g;
    let m: RegExpExecArray | null;
    while ((m = facetRe.exec(text)) !== null) {
      const v1 = addVertex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
      const v2 = addVertex(parseFloat(m[4]), parseFloat(m[5]), parseFloat(m[6]));
      const v3 = addVertex(parseFloat(m[7]), parseFloat(m[8]), parseFloat(m[9]));
      triangles.push({ v1, v2, v3 });
    }
  } else {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const numTriangles = view.getUint32(80, true);
    for (let i = 0; i < numTriangles; i++) {
      const offset = 84 + i * 50;
      const v1 = addVertex(view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true));
      const v2 = addVertex(view.getFloat32(offset + 24, true), view.getFloat32(offset + 28, true), view.getFloat32(offset + 32, true));
      const v3 = addVertex(view.getFloat32(offset + 36, true), view.getFloat32(offset + 40, true), view.getFloat32(offset + 44, true));
      triangles.push({ v1, v2, v3 });
    }
  }

  return { vertices, triangles };
}

export function merge3mf(inputs: ColoredModel[]): Uint8Array {
  if (inputs.length === 0) throw new Error('No inputs to merge');

  let nextId = 1;

  interface MeshEntry {
    colorGroupId: number;
    mesh: Mesh;
    color: [number, number, number, number];
    colorHex: string;
    colorLabel: string;
  }

  const entries: MeshEntry[] = [];
  for (const input of inputs) {
    const mesh = extractMeshFromSTL(input.data);
    if (mesh.vertices.length === 0) continue;
    const colorGroupId = nextId++;
    const colorHex = colorToHex(input.color);
    const colorLabel = `[${input.color.join(', ')}]`;
    entries.push({ colorGroupId, mesh, color: input.color, colorHex, colorLabel });
  }

  const objectIds: number[] = [];
  for (let i = 0; i < entries.length; i++) objectIds.push(nextId++);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">');
  lines.push('  <metadata name="Application">3D Gallery</metadata>');
  lines.push('  <resources>');

  for (const entry of entries) {
    lines.push(`    <colorgroup id="${entry.colorGroupId}">`);
    lines.push(`      <color color="${entry.colorHex}" />`);
    lines.push(`    </colorgroup>`);
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const objId = objectIds[i];
    lines.push(`    <object id="${objId}" type="model" pid="${entry.colorGroupId}" pindex="0">`);
    lines.push('      <mesh>');
    lines.push('        <vertices>');
    for (const v of entry.mesh.vertices) lines.push(`          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />`);
    lines.push('        </vertices>');
    lines.push('        <triangles>');
    for (const t of entry.mesh.triangles) lines.push(`          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`);
    lines.push('        </triangles>');
    lines.push('      </mesh>');
    lines.push('    </object>');
  }

  lines.push('  </resources>');
  lines.push('  <build>');
  for (const objId of objectIds) lines.push(`    <item objectid="${objId}" />`);
  lines.push('  </build>');
  lines.push('</model>');

  const modelXml = lines.join('\n');

  const metaLines: string[] = [];
  metaLines.push('<?xml version="1.0" encoding="UTF-8"?>');
  metaLines.push('<config>');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const objId = objectIds[i];
    metaLines.push(`  <object id="${objId}">`);
    metaLines.push(`    <metadata key="name" value="${escXml(entry.colorLabel)}" />`);
    metaLines.push(`    <metadata key="extruder" value="${i + 1}" />`);
    metaLines.push(`    <part id="0" subtype="normal_part">`);
    metaLines.push(`      <metadata key="name" value="${escXml(entry.colorLabel)}" />`);
    metaLines.push(`      <metadata key="extruder" value="${i + 1}" />`);
    metaLines.push('    </part>');
    metaLines.push('  </object>');
  }
  metaLines.push('</config>');

  const contentTypes = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />',
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />',
    '  <Default Extension="config" ContentType="application/vnd.openxmlformats-package.relationships+xml" />',
    '</Types>',
  ].join('\n');

  const rels = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />',
    '</Relationships>',
  ].join('\n');

  const enc = new TextEncoder();
  return zipSync({
    '[Content_Types].xml': enc.encode(contentTypes),
    '_rels': { '.rels': enc.encode(rels) },
    '3D': { '3dmodel.model': enc.encode(modelXml) },
    'Metadata': { 'model_settings.config': enc.encode(metaLines.join('\n')) },
  });
}
