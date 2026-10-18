// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The plate on the bed. libslic3r heats the bed to the filament's temperature
 * for the plate named by `curr_bed_type`, and an unknown name is silently
 * dropped, leaving its default, the Cool Plate.
 *
 * Pure: no DOM, no fetch.
 */

/** libslic3r's `curr_bed_type` names, and the filament setting each heats the bed to. */
export const BED_TEMP_KEYS: Readonly<Record<string, string>> = {
  'Cool Plate': 'cool_plate_temp',
  'Engineering Plate': 'eng_plate_temp',
  'High Temp Plate': 'hot_plate_temp',
  'Textured PEI Plate': 'textured_plate_temp',
  'Supertack Plate': 'supertack_plate_temp',
  'Textured Cool Plate': 'textured_cool_plate_temp',
};

/**
 * Why a slice on `bedType` would print on a cold bed, or null. A filament
 * preset says 0 °C for a plate it isn't meant for (Bambu's PCTG on a Cool
 * Plate), and libslic3r writes that straight into `M140 S0` / `M190 S0`.
 */
export function bedTemperatureProblem(
  bedType: string,
  filaments: Array<{ name: string; config: Record<string, string> }>,
): string | null {
  const key = BED_TEMP_KEYS[bedType];
  if (!key) return `"${bedType}" isn't a plate type the slicer knows (${Object.keys(BED_TEMP_KEYS).join(', ')}).`;
  for (const { name, config } of filaments) {
    for (const k of [`${key}_initial_layer`, key]) {
      const first = Number((config[k] ?? '').split(/[;,]/)[0]);
      if (!(first > 0)) {
        return `${name} has no bed temperature for a ${bedType} (${k} is ${config[k] || 'not set'}) — choose the plate that's on the printer, or another filament preset.`;
      }
    }
  }
  return null;
}
