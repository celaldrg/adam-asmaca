/**
 * On-screen keyboard: one button per letter of the word-list alphabet, in
 * balanced rows that keep every key cell at least MIN_KEY_CELL pixels wide.
 * Works with mouse, touch and pen (pointer events) and with Tab + Enter.
 */

import { getAlphabet, toDisplayUpper } from './alphabet.js';
import { h, prefersReducedMotion } from './dom.js';
import { translate } from './i18n.js';
import { keysPerRow, splitRows } from './layout.js';
import { getLetterState } from './round.js';

/** Screen-reader suffix per key state; unused keys get none. */
const STATE_LABELS = Object.freeze({ correct: 'keyInWord', hinted: 'keyInWord', wrong: 'keyNotInWord' });

const SHAKE = Object.freeze([
  { transform: 'translateX(0)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' },
]);

/**
 * Builds the keyboard inside a container and keeps it in sync with the round.
 * @param {HTMLElement} container
 * @param {(letter: string) => void} onLetter Receives the lower-case letter of a pressed key.
 * @returns {{ render: (round: import('./round.js').Round, uiLang: 'en'|'tr') => void, shake: (letter: string) => void }}
 */
export function createKeyboard(container, onLetter) {
  let layout = '';
  let shown = null;

  container.addEventListener('click', (event) => {
    const key = event.target.closest('.key');
    if (key) onLetter(key.dataset.letter);
  });
  liftPressedKeys(container);
  new ResizeObserver(() => {
    if (shown) window.requestAnimationFrame(() => render(shown.round, shown.uiLang));
  }).observe(container);

  /**
   * Rebuilds the rows when the alphabet or the row width changed, then updates every key.
   * @param {import('./round.js').Round} round
   * @param {'en'|'tr'} uiLang
   */
  function render(round, uiLang) {
    shown = { round, uiLang };
    const perRow = keysPerRow(container.clientWidth);
    const nextLayout = `${round.lang}:${perRow}`;
    if (nextLayout !== layout) buildRows(container, round.lang, perRow);
    layout = nextLayout;
    container.toggleAttribute('data-over', round.status !== 'playing');
    for (const key of container.querySelectorAll('.key')) updateKey(key, round, uiLang);
  }

  return Object.freeze({
    render,
    shake(letter) {
      const key = [...container.querySelectorAll('.key')].find((element) => element.dataset.letter === letter);
      if (key && !prefersReducedMotion()) key.firstChild.animate(SHAKE, { duration: 280, easing: 'ease-out' });
    },
  });
}

/**
 * Replaces the keys with balanced rows for an alphabet.
 * @param {HTMLElement} container
 * @param {'en'|'tr'} lang Word-list language.
 * @param {number} perRow Most keys per row.
 */
function buildRows(container, lang, perRow) {
  const rows = splitRows(getAlphabet(lang), perRow);
  container.style.setProperty('--cols', String(rows[0].length));
  container.replaceChildren(
    ...rows.map((letters) => h('div', { class: 'key-row' }, letters.map((letter) => createKey(letter, lang)))),
  );
}

/**
 * Creates one key: a full-cell button (the tap target) around the visible key face.
 * @param {string} letter Lower-case letter.
 * @param {'en'|'tr'} lang Word-list language, for the capital and the pronunciation.
 * @returns {HTMLElement}
 */
function createKey(letter, lang) {
  return h('button', { type: 'button', class: 'key', 'data-letter': letter, 'data-state': 'unused' }, [
    h('span', { class: 'key-face', lang }, [toDisplayUpper(letter, lang)]),
    h('span', { class: 'visually-hidden' }),
  ]);
}

/**
 * Shows whether a letter was found, missed, given by a hint or is still free.
 * Used keys stay focusable (aria-disabled) so keyboard users keep their place.
 * @param {HTMLElement} key
 * @param {import('./round.js').Round} round
 * @param {'en'|'tr'} uiLang
 */
function updateKey(key, round, uiLang) {
  const { letter } = key.dataset;
  const state = round.hinted.includes(letter) ? 'hinted' : getLetterState(round, letter);
  key.dataset.state = state;
  key.setAttribute('aria-disabled', String(state !== 'unused' || round.status !== 'playing'));
  key.lastChild.textContent = state === 'unused' ? '' : `, ${translate(uiLang, STATE_LABELS[state])}`;
}

/**
 * Lifts the key under a finger or pen while it is pressed, so the letter stays
 * visible above the fingertip. Mouse presses use the CSS :active style instead.
 * @param {HTMLElement} container
 */
function liftPressedKeys(container) {
  let pressed = null;
  const release = () => {
    pressed?.classList.remove('is-pressed');
    pressed = null;
  };
  container.addEventListener('pointerdown', (event) => {
    release();
    if (event.pointerType === 'mouse') return;
    pressed = event.target.closest('.key');
    pressed?.classList.add('is-pressed');
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) container.addEventListener(type, release);
}
