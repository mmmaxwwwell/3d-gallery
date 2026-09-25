/**
 * Per-piece anchors: how a multicolour 3MF says where each named piece of an
 * assembly sits, so a viewer can point at B1 rather than at every beam.
 *
 * Every render path merges a colour's geometry into one mesh, so which lump
 * of it is B1 is not something the mesh can say. The model's lib can: it
 * placed B1. A preview echoes the lib's anchors at top level —
 *
 *     echo(gallery_instances = stand_instances());   // [["B1", [x, y, z]], …]
 *
 * — each point inside its piece's bounding box and near its middle, in the
 * preview's own frame. The builders lift that line off OpenSCAD's stderr and
 * carry it in the 3MF as JSON at INSTANCE_ANCHORS_PATH. Computing the points
 * in the lib keeps them right under any customizer params.
 */

export const INSTANCE_ECHO = 'gallery_instances';
export const INSTANCE_ANCHORS_PATH = 'Metadata/gallery_instances.json';

export interface InstanceAnchor {
  id: string;
  at: [number, number, number];
}

const ECHO_PREFIX = `ECHO: ${INSTANCE_ECHO} = `;

/**
 * The anchors echoed in a render's log, or null when the source echoes none.
 * A malformed echo throws: it is an authoring error, and dropping it quietly
 * would leave the viewer pointing at whole groups with no hint why.
 */
export function parseInstanceEcho(lines: Iterable<string>): InstanceAnchor[] | null {
  for (const line of lines) {
    const at = line.indexOf(ECHO_PREFIX);
    if (at === -1) continue;
    const raw = line.slice(at + ECHO_PREFIX.length).trim();
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error(`${INSTANCE_ECHO}: not a list of [id, [x, y, z]] pairs: ${raw}`);
    }
    return validateAnchors(value, raw);
  }
  return null;
}

function validateAnchors(value: unknown, raw: string): InstanceAnchor[] {
  const bad = () => new Error(`${INSTANCE_ECHO}: not a list of [id, [x, y, z]] pairs: ${raw}`);
  if (!Array.isArray(value)) throw bad();
  const seen = new Set<string>();
  return value.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw bad();
    const [id, at] = entry;
    if (typeof id !== 'string' || id === '') throw bad();
    if (!Array.isArray(at) || at.length !== 3 || !at.every((n) => typeof n === 'number')) throw bad();
    if (seen.has(id)) throw new Error(`${INSTANCE_ECHO}: ${id} is echoed twice`);
    seen.add(id);
    return { id, at: [at[0], at[1], at[2]] };
  });
}
