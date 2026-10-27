/**
 * Game session: a seeded word sequence without repeats, the current round and
 * the running stats. Pure logic with no DOM or storage access, so the browser
 * UI and the tests drive it the same way.
 */

import { createWordPicker } from './picker.js';
import { createRng } from './rng.js';
import { createRound, guessLetter, isInProgress, useHint } from './round.js';
import { normalizeStats, recordLoss, recordResult, scoreRound } from './stats.js';
import { getWords } from './words.js';

/**
 * @typedef {object} GameState  Immutable snapshot for the UI.
 * @property {'en'|'tr'} lang  Word-list language.
 * @property {import('./round.js').Round} round  Current round.
 * @property {Readonly<import('./stats.js').Stats>} stats  Score and streak; persist them with saveStats.
 * @property {number} points  Points the current round earned (0 until it is won).
 */

/**
 * @typedef {object} GuessResult
 * @property {import('./round.js').GuessOutcome} outcome
 * @property {string|null} letter  Normalized letter; null for invalid or late input.
 * @property {boolean} finished  True when this guess ended the round.
 */

/**
 * @typedef {object} HintResult
 * @property {string|null} letter  Revealed letter; null when no hint was available.
 * @property {boolean} finished  True when the hint solved the word.
 */

/**
 * @typedef {object} Game
 * @property {() => GameState} getState  Returns the current snapshot.
 * @property {(input: string) => GuessResult} guess  Guesses a letter (any case).
 * @property {() => HintResult} hint  Buys a hint for one life.
 * @property {() => GameState} newRound  Starts the next word; leaving a started round counts as a loss.
 * @property {(lang: 'en'|'tr') => GameState} setLanguage  Switches the word list and starts a new round
 *   (same rule for a started round); the same language changes nothing.
 */

/**
 * Creates a game session. Each word list keeps its own no-repeat cycle for the
 * whole session, also across switches between the lists.
 * @param {object} [options]
 * @param {'en'|'tr'} [options.lang] Word-list language, English by default.
 * @param {number} [options.seed] Seed for the word order and hints; defaults to the current time.
 * @param {unknown} [options.stats] Saved stats (e.g. from loadStats); repaired with normalizeStats.
 * @param {import('./round.js').Round} [options.round] Round to start with instead of drawing one
 *   (used by the demo); its language replaces `lang` and its word is not drawn again this cycle.
 * @returns {Game}
 * @throws {RangeError} For an unsupported language.
 */
export function createGame({ lang = 'en', seed = Date.now(), stats, round } = {}) {
  const rng = createRng(seed);
  /** @type {Map<string, { next: () => import('./words.js').WordEntry }>} */
  const pickers = new Map();
  if (round) pickers.set(round.lang, createWordPicker(getWords(round.lang), rng, [round.word]));
  let state = Object.freeze({
    lang: round ? round.lang : lang,
    round: round ?? drawRound(lang),
    stats: normalizeStats(stats),
    points: 0,
  });

  /**
   * Starts a round with the next word of a list, creating that list's picker on first use.
   * @param {'en'|'tr'} wordLang
   * @returns {import('./round.js').Round}
   */
  function drawRound(wordLang) {
    if (!pickers.has(wordLang)) pickers.set(wordLang, createWordPicker(getWords(wordLang), rng));
    const { word, category } = pickers.get(wordLang).next();
    return createRound({ word, category, lang: wordLang });
  }

  /**
   * Stores the round returned by an action and books its result when it just ended.
   * @param {import('./round.js').Round} next
   * @returns {boolean} Whether the round finished with this action.
   */
  function apply(next) {
    if (next === state.round) return false;
    const finished = next.status !== 'playing';
    state = Object.freeze({
      ...state,
      round: next,
      stats: finished ? recordResult(state.stats, next) : state.stats,
      points: scoreRound(next),
    });
    return finished;
  }

  /**
   * Draws the next round; a started, unfinished round is booked as a loss first.
   * @param {'en'|'tr'} nextLang
   * @returns {GameState}
   */
  function startRound(nextLang) {
    const nextStats = isInProgress(state.round) ? recordLoss(state.stats) : state.stats;
    state = Object.freeze({ lang: nextLang, round: drawRound(nextLang), stats: nextStats, points: 0 });
    return state;
  }

  return Object.freeze({
    getState: () => state,
    guess(input) {
      const { round: next, outcome, letter } = guessLetter(state.round, input);
      return { outcome, letter, finished: apply(next) };
    },
    hint() {
      const { round: next, letter } = useHint(state.round, rng);
      return { letter, finished: apply(next) };
    },
    newRound: () => startRound(state.lang),
    setLanguage: (nextLang) => (nextLang === state.lang ? state : startRound(nextLang)),
  });
}
