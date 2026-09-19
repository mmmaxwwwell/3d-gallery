// SPDX-License-Identifier: AGPL-3.0-or-later
// OrcaSlicer's `bed_exclude_area` is a list of coordinate strings that form
// polygons on the bed the slicer refuses to place geometry over (probe
// points, magnetic corners, purge buckets, etc.).
//
// Presets frequently ship with degenerate placeholders like `["0x0"]` — a
// single-point "polygon" that's meaningless as an exclusion but that the
// slicer still combines with `extruder_clearance_radius` (often 47 mm) to
// build a keepout circle at the bed corner. Any part occupying the corner
// then hits "too close to exclusion area" and slicing fails.
//
// This helper parses the field, drops polygons with fewer than 3 points, and
// returns a serialized form suitable for the flat slicer config.

export interface Point2 { x: number; y: number }
export type Polygon2 = Point2[];

/** Parse a flattened `bed_exclude_area` field. In the raw JSON, this field is
 *  a string array where each STRING is one polygon (points inside the string
 *  are comma-separated `"XxY"`). Our preset flattener joins the array with
 *  `;` to fit `Record<string, string>` — so the on-wire format is
 *  `poly1;poly2;...` and each poly is `X0xY0,X1xY1,...`. */
export function parseBedExcludeArea(field: string | undefined | null): Polygon2[] {
  if (!field) return [];
  const polys: Polygon2[] = [];
  for (const polyStr of field.split(';')) {
    const points: Point2[] = [];
    for (const pt of polyStr.split(',')) {
      const trimmed = pt.trim();
      if (!trimmed) continue;
      const [xs, ys] = trimmed.split('x');
      const x = parseFloat(xs);
      const y = parseFloat(ys);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      points.push({ x, y });
    }
    if (points.length > 0) polys.push(points);
  }
  return polys;
}

/** Compute the axis-aligned bounding box of every exclusion polygon. */
export function excludeAreaBboxes(field: string | undefined | null): Array<{ minX: number; maxX: number; minY: number; maxY: number }> {
  return parseBedExcludeArea(field).map((poly) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of poly) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY };
  });
}

/** Return `true` if the exclusion field has no polygon with >= 3 unique
 *  points — placeholder like `["0x0"]` from fdm_qidi_common. */
export function isDegenerateExcludeArea(field: string | undefined | null): boolean {
  const polys = parseBedExcludeArea(field);
  if (polys.length === 0) return true;
  return polys.every((poly) => {
    const uniq = new Set(poly.map((p) => `${p.x},${p.y}`));
    return uniq.size < 3;
  });
}

/** Return a cleaned-up config where `bed_exclude_area` is stripped iff it's
 *  degenerate. Real polygons pass through untouched. */
export function sanitizeBedExcludeArea<T extends Record<string, string>>(config: T): T {
  const field = config['bed_exclude_area'];
  if (field === undefined) return config;
  if (!isDegenerateExcludeArea(field)) return config;
  const { bed_exclude_area: _drop, ...rest } = config;
  return rest as unknown as T;
}

/** Force-strip `bed_exclude_area` regardless of whether it's degenerate.
 *  For user-driven "trust me, the corner is safe" overrides. */
export function forceStripBedExcludeArea<T extends Record<string, string>>(config: T): T {
  if (!('bed_exclude_area' in config)) return config;
  const { bed_exclude_area: _drop, ...rest } = config;
  return rest as unknown as T;
}
