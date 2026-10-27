/**
 * Entry point: connects the game session to the page, the storage helper and
 * the inputs (on-screen keys, physical keyboard, buttons). "?demo" opens a
 * fixed mid-game state for the README screenshot and never saves anything.
 */

import { createDemoGame } from './demo.js';
import { createResultDialog } from './dialog.js';
import { applyTranslations, byId, prefersReducedMotion } from './dom.js';
import { guessMessage, hintMessage, openingMessage, roundStartMessage } from './feedback.js';
import { createGame } from './game.js';
import { otherLanguage } from './i18n.js';
import { createKeyboard } from './keyboard.js';
import { DEFAULT_PREFS, isDemo, loadPrefs, savePrefs } from './prefs.js';
import { loadStats, saveStats } from './stats.js';
import { storage } from './storage.js';
import { createView } from './view.js';

/** Pause between the last move and the result dialog, so the final stroke can be seen. */
const RESULT_DELAY_MS = 750;

/** Outcomes that mean a physical key press was a guess, so the browser should not act on it. */
const HANDLED = new Set(['correct', 'wrong', 'repeat']);

const demo = isDemo(window.location.search);
const prefs = demo ? DEFAULT_PREFS : loadPrefs(storage);
const game = demo ? createDemoGame() : createGame({ lang: prefs.words, stats: loadStats(storage) });
const view = createView();
const keyboard = createKeyboard(byId('keyboard'), guess);
const dialog = createResultDialog(nextWord);
const wordList = byId('word-list');

let uiLang = prefs.ui;
let message = openingMessage(game.getState().round);
let resultTimer = 0;

/** Saves stats and preferences; the demo never saves, its numbers are made up. */
function persist() {
  if (demo) return;
  const { lang, stats } = game.getState();
  saveStats(storage, stats);
  savePrefs(storage, { ui: uiLang, words: lang });
}

/** Draws the board and the keyboard from the current state. */
function render() {
  const state = game.getState();
  view.render(state, uiLang, message);
  keyboard.render(state.round, uiLang);
}

/** Puts every static string of the page into the interface language. */
function renderTexts() {
  document.documentElement.lang = uiLang;
  applyTranslations(document, uiLang);
}

/**
 * Redraws after a guess or hint; a finished round is saved and its dialog follows.
 * @param {boolean} finished
 */
function afterMove(finished) {
  view.endIntro();
  render();
  if (!finished) return;
  persist();
  window.clearTimeout(resultTimer);
  resultTimer = window.setTimeout(
    () => dialog.show(game.getState(), uiLang),
    prefersReducedMotion() ? 0 : RESULT_DELAY_MS,
  );
}

/**
 * Plays one letter from the on-screen keyboard or a physical key.
 * @param {string} input
 * @returns {boolean} Whether the input counted as a guess (new or repeated letter).
 */
function guess(input) {
  const result = game.guess(input);
  message = guessMessage(result, game.getState(), input) ?? message;
  if (result.outcome === 'repeat') keyboard.shake(result.letter);
  afterMove(result.finished);
  return HANDLED.has(result.outcome);
}

/** Buys a hint for one life. */
function hint() {
  const result = game.hint();
  message = hintMessage(result, game.getState()) ?? message;
  afterMove(result.finished);
}

/**
 * Starts a new round through `change`; leaving a started round counts as a loss.
 * @param {() => void} change Calls game.newRound or game.setLanguage.
 */
function startRound(change) {
  const previous = game.getState().round;
  change();
  window.clearTimeout(resultTimer);
  dialog.close();
  message = roundStartMessage(previous);
  persist();
  view.endIntro();
  render();
}

/** Moves on to the next word of the current list. */
function nextWord() {
  startRound(() => game.newRound());
}

/**
 * Switches the word list (and starts a word from it).
 * @param {'en'|'tr'} lang
 */
function changeWordList(lang) {
  if (lang !== game.getState().lang) startRound(() => game.setLanguage(lang));
}

/** Switches the interface between English and Turkish. */
function toggleInterfaceLanguage() {
  uiLang = otherLanguage(uiLang);
  persist();
  renderTexts();
  render();
}

/**
 * Tells whether a key press belongs to a form control (the word-list select).
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
function isFormControl(target) {
  return target instanceof HTMLSelectElement || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

/**
 * Tells whether Enter would press a working button (used letter keys are marked aria-disabled).
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
function isWorkingButton(target) {
  return target instanceof HTMLButtonElement && target.getAttribute('aria-disabled') !== 'true';
}

/**
 * Physical keyboard: letters guess, Enter moves on after a finished round.
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (event.repeat || event.defaultPrevented || dialog.isOpen() || isFormControl(event.target)) return;
  // Leave browser shortcuts alone; AltGr (reported as Ctrl+Alt) still types letters.
  if (event.metaKey || event.ctrlKey !== event.altKey) return;
  if (event.key === 'Enter') {
    if (game.getState().round.status !== 'playing' && !isWorkingButton(event.target)) {
      event.preventDefault();
      nextWord();
    }
    return;
  }
  if ([...event.key].length === 1 && guess(event.key)) event.preventDefault();
}

byId('new-game').addEventListener('click', nextWord);
byId('ui-lang').addEventListener('click', toggleInterfaceLanguage);
byId('hint').addEventListener('click', hint);
byId('next').addEventListener('click', nextWord);
wordList.addEventListener('change', () => {
  changeWordList(wordList.value);
  wordList.blur();
});
document.addEventListener('keydown', onKeyDown);

renderTexts();
render();
