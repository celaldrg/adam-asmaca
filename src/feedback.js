/**
 * Status-line messages for game events. Each message is a string key of
 * i18n.js plus its parameters, so it can be shown again in the other
 * interface language. Letters and words are upper-cased with the rules of the
 * word list (Turkish i → İ, ı → I).
 */

import { toDisplayUpper } from './alphabet.js';
import { getLivesLeft, isInProgress } from './round.js';

/**
 * @typedef {'info'|'good'|'bad'|'warn'} Tone
 * @typedef {{ key: string, params: Readonly<Record<string, string|number>>, tone: Tone }} Message
 */

/** A single character that is a letter in any script, e.g. "q", "é" or "Ş". */
const ANY_LETTER = /^\p{L}$/u;

/**
 * Builds a frozen message.
 * @param {string} key
 * @param {Record<string, string|number>} params
 * @param {Tone} tone
 * @returns {Message}
 */
function message(key, params, tone) {
  return Object.freeze({ key, params: Object.freeze(params), tone });
}

/**
 * Message for the start of a page visit: an untouched round asks for a letter,
 * a round already under way (the demo) tells how many lives are left.
 * @param {import('./round.js').Round} round
 * @returns {Message}
 */
export function openingMessage(round) {
  return isInProgress(round) ? message('msgContinue', { n: getLivesLeft(round) }, 'info') : message('msgStart', {}, 'info');
}

/**
 * Message for a new round; leaving a started round reveals its word and says it counts as a loss.
 * @param {import('./round.js').Round} previous The round that was on screen before.
 * @returns {Message}
 */
export function roundStartMessage(previous) {
  if (!isInProgress(previous)) return message('msgStart', {}, 'info');
  return message('msgSkipped', { word: toDisplayUpper(previous.word, previous.lang) }, 'warn');
}

/**
 * Message for the end of a round. Exported as a test seam; the UI reaches it through guessMessage and hintMessage.
 * @param {import('./round.js').Round} round A won or lost round.
 * @param {number} points Points the round earned.
 * @returns {Message}
 */
export function finishMessage(round, points) {
  if (round.status === 'won') return message('msgWon', { points }, 'good');
  return message('msgLost', { word: toDisplayUpper(round.word, round.lang) }, 'bad');
}

/**
 * Message for a guess.
 * @param {import('./game.js').GuessResult} result What game.guess returned.
 * @param {import('./game.js').GameState} state The state after the guess.
 * @param {unknown} input The raw input (a KeyboardEvent.key value or an on-screen letter).
 * @returns {Message|null} null when nothing should be said (a late guess or a non-letter key).
 */
export function guessMessage(result, state, input) {
  const { round, points } = state;
  if (result.finished) return finishMessage(round, points);
  switch (result.outcome) {
    case 'correct':
      return message('msgCorrect', { letter: toDisplayUpper(result.letter, round.lang) }, 'good');
    case 'wrong':
      return message('msgWrong', { letter: toDisplayUpper(result.letter, round.lang), n: getLivesLeft(round) }, 'bad');
    case 'repeat':
      return message('msgRepeat', { letter: toDisplayUpper(result.letter, round.lang) }, 'warn');
    case 'invalid':
      return typeof input === 'string' && ANY_LETTER.test(input)
        ? message('msgNotInAlphabet', { letter: toDisplayUpper(input, round.lang), lang: round.lang }, 'warn')
        : null;
    default:
      return null;
  }
}

/**
 * Message for a hint.
 * @param {import('./game.js').HintResult} result What game.hint returned.
 * @param {import('./game.js').GameState} state The state after the hint.
 * @returns {Message|null} null when no hint was given.
 */
export function hintMessage(result, state) {
  if (result.letter === null) return null;
  if (result.finished) return finishMessage(state.round, state.points);
  return message('msgHint', { letter: toDisplayUpper(result.letter, state.round.lang) }, 'warn');
}
