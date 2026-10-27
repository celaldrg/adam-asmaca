/**
 * Rules of a single hangman round. Rounds are immutable snapshots:
 * every action returns a new round and leaves the old one untouched.
 * Letters are compared exactly, character by character, so ı/i, ö/o,
 * ü/u, ş/s, ç/c and ğ/g are all different letters.
 */

import { normalizeLetter, normalizeWord, toDisplayUpper } from './alphabet.js';
import { randomInt } from './rng.js';

/** Mistakes (wrong guesses plus hints) that lose a round: head, body, two arms, two legs. */
export const MAX_WRONG = 6;

/**
 * @typedef {'playing'|'won'|'lost'} RoundStatus
 */

/**
 * @typedef {'correct'|'wrong'|'repeat'|'invalid'|'over'} GuessOutcome
 * correct/wrong: the letter was new; repeat: already tried (free);
 * invalid: not a letter of the alphabet (free); over: the round has ended.
 */

/**
 * @typedef {object} Round
 * @property {string} word                 Lower-case answer.
 * @property {string} category             Category id of the answer ('' when unknown).
 * @property {'en'|'tr'} lang              Word-list language: decides the alphabet and casing.
 * @property {readonly string[]} correct   Letters found so far, in order (hinted ones included).
 * @property {readonly string[]} wrong     Wrong letters, in order.
 * @property {readonly string[]} hinted    Letters revealed by hints, in order.
 * @property {RoundStatus} status
 */

/**
 * Starts a round for one word.
 * @param {object} options
 * @param {string} options.word Answer in any case; letters of `lang` only.
 * @param {'en'|'tr'} options.lang Word-list language.
 * @param {string} [options.category] Category id shown as a clue.
 * @returns {Round}
 * @throws {RangeError} If the word is empty or has characters outside the alphabet.
 */
export function createRound({ word, lang, category = '' }) {
  const answer = normalizeWord(word, lang);
  if (answer === null) throw new RangeError(`Not a word of the ${lang} alphabet: ${String(word)}`);
  return freezeRound({ word: answer, category, lang, correct: [], wrong: [], hinted: [], status: 'playing' });
}

/**
 * Applies one guess. Repeated, invalid and late guesses return the same round,
 * so they never cost a life.
 * @param {Round} round
 * @param {string} input Letter in any case, e.g. a KeyboardEvent.key value.
 * @returns {{ round: Round, outcome: GuessOutcome, letter: string|null }}
 *   letter is the normalized letter, or null for invalid and late guesses.
 */
export function guessLetter(round, input) {
  if (round.status !== 'playing') return { round, outcome: 'over', letter: null };
  const letter = normalizeLetter(input, round.lang);
  if (letter === null) return { round, outcome: 'invalid', letter: null };
  if (round.correct.includes(letter) || round.wrong.includes(letter)) {
    return { round, outcome: 'repeat', letter };
  }
  if ([...round.word].includes(letter)) {
    return { round: settle({ ...round, correct: [...round.correct, letter] }), outcome: 'correct', letter };
  }
  return { round: settle({ ...round, wrong: [...round.wrong, letter] }), outcome: 'wrong', letter };
}

/**
 * Tells whether a hint can be bought: the round is running and more than one
 * life is left, so paying for a hint can never lose the round.
 * @param {Round} round
 * @returns {boolean}
 */
export function canUseHint(round) {
  return round.status === 'playing' && getLivesLeft(round) > 1;
}

/**
 * Spends one life to reveal a random hidden letter (every copy of it).
 * @param {Round} round
 * @param {() => number} rng Seeded generator from rng.js.
 * @returns {{ round: Round, letter: string|null }} letter is null when no hint was available.
 */
export function useHint(round, rng) {
  if (!canUseHint(round)) return { round, letter: null };
  const hidden = getHiddenLetters(round);
  const letter = hidden[randomInt(rng, hidden.length)];
  return {
    round: settle({ ...round, correct: [...round.correct, letter], hinted: [...round.hinted, letter] }),
    letter,
  };
}

/**
 * Counts mistakes: wrong guesses plus hints. This is the number of figure parts to draw.
 * @param {Round} round
 * @returns {number} 0 to {@link MAX_WRONG}.
 */
export function getMistakes(round) {
  return round.wrong.length + round.hinted.length;
}

/**
 * Counts the mistakes still allowed before the round is lost.
 * @param {Round} round
 * @returns {number} {@link MAX_WRONG} down to 0.
 */
export function getLivesLeft(round) {
  return MAX_WRONG - getMistakes(round);
}

/**
 * Returns the answer letter by letter for display: found letters upper-cased with
 * the word's locale (Turkish i → İ, ı → I), hidden letters as null.
 * @param {Round} round
 * @returns {(string|null)[]}
 */
export function getSlots(round) {
  return [...round.word].map((ch) => (round.correct.includes(ch) ? toDisplayUpper(ch, round.lang) : null));
}

/**
 * Returns the state of one letter for the on-screen keyboard.
 * @param {Round} round
 * @param {string} letter Lower-case letter of the round's alphabet.
 * @returns {'correct'|'wrong'|'unused'}
 */
export function getLetterState(round, letter) {
  if (round.correct.includes(letter)) return 'correct';
  if (round.wrong.includes(letter)) return 'wrong';
  return 'unused';
}

/**
 * Tells whether a running round already has a guess or hint, so leaving it counts as a loss.
 * @param {Round} round
 * @returns {boolean}
 */
export function isInProgress(round) {
  return round.status === 'playing' && round.correct.length + round.wrong.length > 0;
}

/**
 * Lists the distinct letters of the answer that are still hidden, in word order.
 * @param {Round} round
 * @returns {string[]}
 */
function getHiddenLetters(round) {
  return [...new Set(round.word)].filter((ch) => !round.correct.includes(ch));
}

/**
 * Recomputes the status after a change and freezes the result.
 * @param {Round} round
 * @returns {Round}
 */
function settle(round) {
  return freezeRound({ ...round, status: statusOf(round) });
}

/**
 * Decides the status: won when no letter is hidden, lost at {@link MAX_WRONG} mistakes.
 * @param {Round} round
 * @returns {RoundStatus}
 */
function statusOf(round) {
  if (getHiddenLetters(round).length === 0) return 'won';
  if (getMistakes(round) >= MAX_WRONG) return 'lost';
  return 'playing';
}

/**
 * Freezes a round and its letter lists.
 * @param {Round} round
 * @returns {Round}
 */
function freezeRound(round) {
  return Object.freeze({
    ...round,
    correct: Object.freeze([...round.correct]),
    wrong: Object.freeze([...round.wrong]),
    hinted: Object.freeze([...round.hinted]),
  });
}
