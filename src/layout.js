/**
 * Arithmetic for the on-screen keyboard: how many keys fit in a row, and how
 * to split an alphabet into rows of nearly equal length.
 */

/** Narrowest tap cell for one key, in CSS pixels; the visible key is drawn inside it. */
export const MIN_KEY_CELL = 42;

/** Most keys in one row, so rows stay compact on wide screens. */
export const MAX_KEYS_PER_ROW = 10;

/**
 * Counts how many key cells of at least `minCell` pixels fit in a row.
 * @param {number} width Row width in CSS pixels.
 * @param {number} [minCell] Narrowest allowed cell.
 * @param {number} [max] Most keys per row.
 * @returns {number} 1 to `max`; `max` when the width is unknown (0 or not a number).
 */
export function keysPerRow(width, minCell = MIN_KEY_CELL, max = MAX_KEYS_PER_ROW) {
  if (!(width > 0)) return max;
  return Math.min(max, Math.max(1, Math.floor(width / minCell)));
}

/**
 * Splits items into the fewest rows of at most `perRow` items, as even as
 * possible with the longer rows first (29 letters, 8 per row: 8, 7, 7, 7).
 * @template T
 * @param {readonly T[]} items
 * @param {number} perRow Most items per row; values below 1 count as 1.
 * @returns {T[][]}
 */
export function splitRows(items, perRow) {
  const count = Math.ceil(items.length / Math.max(1, perRow));
  const rows = [];
  let start = 0;
  for (let row = 0; row < count; row += 1) {
    const size = Math.floor(items.length / count) + (row < items.length % count ? 1 : 0);
    rows.push(items.slice(start, start + size));
    start += size;
  }
  return rows;
}
