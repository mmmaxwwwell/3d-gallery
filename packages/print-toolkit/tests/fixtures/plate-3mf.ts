// SPDX-License-Identifier: AGPL-3.0-or-later
import { strToU8, zipSync } from 'fflate';

export type Box = [x0: number, x1: number, y0: number, y1: number, z0: number, z1: number];
export interface Part { color: string; extruder: number; box: Box }

function boxMesh([x0, x1, y0, y1, z0, z1]: Box): string {
  const v = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0]);
  const tris = [
    [0, 2, 1], [1, 2, 3], [4, 5, 6], [5, 7, 6], [0, 1, 4], [1, 5, 4],
    [2, 6, 3], [3, 6, 7], [0, 4, 2], [2, 4, 6], [1, 3, 5], [3, 7, 5],
  ];
  return '<mesh><vertices>' + v.map(([x, y, z]) => `<vertex x="${x}" y="${y}" z="${z}" />`).join('')
    + '</vertices><triangles>' + tris.map(([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}" />`).join('')
    + '</triangles></mesh>';
}

/** A gallery-style plate 3MF: one object per piece, a part per colour, extruders in model_settings. */
export function plate3mf(pieces: Part[][]): Uint8Array {
  let id = 1;
  const colors = [...new Set(pieces.flat().map((p) => p.color))];
  const group = new Map(colors.map((c) => [c, id++]));
  const res: string[] = colors.map((c) => `<colorgroup id="${group.get(c)}"><color color="${c}" /></colorgroup>`);
  const settings: string[] = [];
  const items: number[] = [];
  for (const piece of pieces) {
    const partIds = piece.map((part) => {
      const pid = id++;
      res.push(`<object id="${pid}" type="model" pid="${group.get(part.color)}" pindex="0">${boxMesh(part.box)}</object>`);
      return pid;
    });
    const objId = piece.length === 1 ? partIds[0] : id++;
    if (piece.length > 1) {
      res.push(`<object id="${objId}" type="model"><components>${partIds.map((p) => `<component objectid="${p}" />`).join('')}</components></object>`);
    }
    items.push(objId);
    settings.push(`<object id="${objId}"><metadata key="extruder" value="${piece[0].extruder}" />`
      + piece.map((part, i) => `<part id="${piece.length === 1 ? 0 : partIds[i]}" subtype="normal_part">`
        + `<metadata key="name" value="${part.color}" /><metadata key="extruder" value="${part.extruder}" /></part>`).join('')
      + '</object>');
  }
  const model = '<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'
    + `<resources>${res.join('')}</resources><build>${items.map((i) => `<item objectid="${i}" />`).join('')}</build></model>`;
  return zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    '3D/3dmodel.model': strToU8(model),
    'Metadata/model_settings.config': strToU8(`<?xml version="1.0" encoding="UTF-8"?><config>${settings.join('')}</config>`),
  });
}
