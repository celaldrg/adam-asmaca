/**
 * Fixed mid-game state behind the "?demo" query parameter, used only for the
 * README screenshot. Normal visits start with createGame instead.
 */

import { createGame } from './game.js';
import { createRound, guessLetter } from './round.js';

/** "kırlangıç" (swallow): its dotless ı sits next to a wrong dotted i, plus ç. */
const DEMO_WORD = 'kırlangıç';

/** Four hits (a, ı, r, ç) and three misses (e, i, s), in playing order. */
const DEMO_GUESSES = Object.freeze(['a', 'e', 'ı', 'r', 'i', 'ç', 's']);

/** Plausible stats: twelve wins in runs of 7, 1 and 4 around three losses. */
const DEMO_STATS = Object.freeze({ score: 310, streak: 4, bestStreak: 7, wins: 12, losses: 3 });

const DEMO_SEED = 2026;

/**
 * Creates the deterministic demo game: a Turkish animal word about half solved
 * with three wrong guesses. Its stats are made up, so the UI must not save them.
 * @returns {import('./game.js').Game}
 */
export function createDemoGame() {
  const start = createRound({ word: DEMO_WORD, category: 'animals', lang: 'tr' });
  const round = DEMO_GUESSES.reduce((current, letter) => guessLetter(current, letter).round, start);
  return createGame({ seed: DEMO_SEED, stats: DEMO_STATS, round });
}
