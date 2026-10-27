/**
 * Score and streak bookkeeping. Pure functions on plain objects; loading and
 * saving go through the storage helper (storage.js), passed in by the caller.
 */

import { getLivesLeft } from './round.js';

/** Points for every won round. */
export const POINTS_PER_WIN = 10;

/** Extra points for each life left when the word is solved. */
export const POINTS_PER_LIFE = 5;

/**
 * @typedef {object} Stats
 * @property {number} score       Total points.
 * @property {number} streak      Wins in a row.
 * @property {number} bestStreak  Longest streak so far.
 * @property {number} wins
 * @property {number} losses
 */

const FIELDS = Object.freeze(['score', 'streak', 'bestStreak', 'wins', 'losses']);

const STATS_KEY = 'stats';

/**
 * Reads the saved stats; missing, corrupt or unreadable data gives zeroed stats.
 * @param {import('./storage.js').KeyValueStore} store The storage helper.
 * @returns {Readonly<Stats>}
 */
export function loadStats(store) {
  return normalizeStats(store.get(STATS_KEY, null));
}

/**
 * Saves the stats.
 * @param {import('./storage.js').KeyValueStore} store The storage helper.
 * @param {Readonly<Stats>} stats
 * @returns {boolean} False when storage is unavailable (the game goes on without saving).
 */
export function saveStats(store, stats) {
  return store.set(STATS_KEY, stats);
}

/**
 * Turns untrusted data (for example a value read from storage) into valid stats:
 * every field becomes a non-negative integer and bestStreak is at least streak.
 * @param {unknown} raw
 * @returns {Readonly<Stats>}
 */
export function normalizeStats(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {};
  const stats = Object.fromEntries(FIELDS.map((field) => [field, toCount(source[field])]));
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  return Object.freeze(stats);
}

/**
 * Points a round is worth: POINTS_PER_WIN plus POINTS_PER_LIFE for each life left, or 0 unless won.
 * @param {import('./round.js').Round} round
 * @returns {number}
 */
export function scoreRound(round) {
  return round.status === 'won' ? POINTS_PER_WIN + POINTS_PER_LIFE * getLivesLeft(round) : 0;
}

/**
 * Adds a finished round to the stats; a round still in play changes nothing.
 * @param {Readonly<Stats>} stats
 * @param {import('./round.js').Round} round
 * @returns {Readonly<Stats>}
 */
export function recordResult(stats, round) {
  if (round.status === 'won') {
    const streak = stats.streak + 1;
    return Object.freeze({
      ...stats,
      score: stats.score + scoreRound(round),
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
      wins: stats.wins + 1,
    });
  }
  if (round.status === 'lost') return recordLoss(stats);
  return stats;
}

/**
 * Counts a loss (also used when a started round is abandoned) and resets the streak.
 * @param {Readonly<Stats>} stats
 * @returns {Readonly<Stats>}
 */
export function recordLoss(stats) {
  return Object.freeze({ ...stats, streak: 0, losses: stats.losses + 1 });
}

/**
 * Keeps safe non-negative integers and turns anything else into 0.
 * @param {unknown} value
 * @returns {number}
 */
function toCount(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}
