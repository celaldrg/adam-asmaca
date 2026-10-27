/**
 * Small deterministic pseudo-random number generator (mulberry32).
 * Every random choice in the game goes through an injected generator,
 * so the same seed always replays the same words and hints.
 */

/**
 * Creates a seeded generator that returns floats in [0, 1).
 * @param {number} seed Any number; its lowest 32 bits are used.
 * @returns {() => number} Generator; each call advances the sequence.
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks an integer in [0, max) with the given generator.
 * @param {() => number} rng Generator from {@link createRng}.
 * @param {number} max Exclusive upper bound, at least 1.
 * @returns {number}
 */
export function randomInt(rng, max) {
  return Math.floor(rng() * max);
}
