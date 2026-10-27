/**
 * Seeded word picking without repeats: every word is used once before any
 * word comes back, and the same word never comes twice in a row.
 */

import { randomInt } from './rng.js';

/**
 * Creates a word picker over a list of entries.
 * @template {{ word: string }} T
 * @param {readonly T[]} entries Entries to draw from; must not be empty.
 * @param {() => number} rng Seeded generator from rng.js.
 * @param {Iterable<string>} [exclude] Words already used this session, skipped until the list runs out.
 * @returns {{ next: () => T }} next() draws the following entry.
 * @throws {RangeError} When `entries` is empty.
 */
export function createWordPicker(entries, rng, exclude = []) {
  if (entries.length === 0) throw new RangeError('createWordPicker needs at least one entry');
  const used = new Set(exclude);
  let pool = entries.filter((entry) => !used.has(entry.word));
  let last = null;
  return {
    next() {
      if (pool.length === 0) pool = refill(entries, last);
      const [entry] = pool.splice(randomInt(rng, pool.length), 1);
      last = entry.word;
      return entry;
    },
  };
}

/**
 * Starts a new cycle with every entry except the word drawn last.
 * @template {{ word: string }} T
 * @param {readonly T[]} entries
 * @param {string|null} last
 * @returns {T[]}
 */
function refill(entries, last) {
  const fresh = entries.filter((entry) => entry.word !== last);
  return fresh.length > 0 ? fresh : [...entries];
}
