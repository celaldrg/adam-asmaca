/**
 * Renders the board: stats, category, misses, the gallows drawing, the hidden
 * word, the status line and the hint / next-word buttons. The on-screen
 * keyboard and the result dialog have their own modules.
 */

import { toDisplayUpper } from './alphabet.js';
import { byId, h } from './dom.js';
import { translate } from './i18n.js';
import { MAX_WRONG, canUseHint, getLivesLeft, getMistakes, getSlots } from './round.js';
import { getCategoryLabel } from './words.js';

/**
 * Collects the board elements of the page.
 * @returns {{
 *   render: (state: import('./game.js').GameState, uiLang: 'en'|'tr', message: import('./feedback.js').Message) => void,
 *   endIntro: () => void,
 * }}
 */
export function createView() {
  const stage = byId('stage');
  const gallows = byId('gallows');
  const parts = [...gallows.querySelectorAll('.part')];
  const misses = byId('misses');
  const missBoxes = Array.from({ length: MAX_WRONG }, () => h('span', { class: 'miss', 'data-kind': 'empty' }));
  misses.replaceChildren(...missBoxes);
  const word = byId('word');
  const els = {
    category: byId('category'),
    status: byId('status'),
    hint: byId('hint'),
    next: byId('next'),
    wordList: byId('word-list'),
    score: byId('stat-score'),
    streak: byId('stat-streak'),
    best: byId('stat-best'),
  };
  let wordKey = '';

  /**
   * Draws one figure part per mistake and sets the win/lose look.
   * @param {import('./round.js').Round} round
   * @param {'en'|'tr'} uiLang
   */
  function renderStage(round, uiLang) {
    const mistakes = getMistakes(round);
    stage.dataset.status = round.status;
    stage.dataset.face = faceOf(round, mistakes);
    parts.forEach((part, index) => part.classList.toggle('is-drawn', index < mistakes));
    gallows.setAttribute('aria-label', translate(uiLang, 'gallowsLabel', { n: mistakes, max: MAX_WRONG }));
    els.category.textContent = getCategoryLabel(round.category, uiLang);
  }

  /**
   * Fills one box per mistake: wrong letters first, then letters bought with hints.
   * @param {import('./round.js').Round} round
   * @param {'en'|'tr'} uiLang
   */
  function renderMisses(round, uiLang) {
    const marks = [
      ...round.wrong.map((letter) => ['wrong', letter]),
      ...round.hinted.map((letter) => ['hint', letter]),
    ];
    missBoxes.forEach((box, index) => {
      const [kind, letter] = marks[index] ?? ['empty', ''];
      box.dataset.kind = kind;
      box.textContent = toDisplayUpper(letter, round.lang);
    });
    misses.lang = round.lang;
    const letters = round.wrong.map((letter) => toDisplayUpper(letter, round.lang)).join(', ');
    misses.setAttribute('aria-label', translate(uiLang, 'missesLabel', { n: getLivesLeft(round), letters }));
  }

  /**
   * Shows the word slot by slot; a lost round reveals the missing letters.
   * @param {import('./round.js').Round} round
   * @param {'en'|'tr'} uiLang
   */
  function renderWord(round, uiLang) {
    const letters = [...round.word];
    const key = `${round.lang}:${round.word}`;
    if (key !== wordKey || round.correct.length + round.wrong.length === 0) {
      word.replaceChildren(...letters.map((_, index) => h('span', { class: 'slot', style: `--i: ${index}` })));
      word.style.setProperty('--n', String(letters.length));
      word.lang = round.lang;
      wordKey = key;
    }
    const slots = getSlots(round);
    [...word.children].forEach((slot, index) => {
      const shown = slots[index] ?? (round.status === 'lost' ? toDisplayUpper(letters[index], round.lang) : '');
      if (slot.textContent !== shown) slot.textContent = shown;
      slot.classList.toggle('is-revealed', slots[index] !== null);
      slot.classList.toggle('is-hinted', round.hinted.includes(letters[index]));
      slot.classList.toggle('is-missed', slots[index] === null && round.status === 'lost');
    });
    word.classList.toggle('is-won', round.status === 'won');
    const pattern = slots.map((slot) => slot ?? translate(uiLang, 'blank')).join(' ');
    word.setAttribute('aria-label', translate(uiLang, 'wordLabel', { n: letters.length, pattern }));
  }

  /**
   * Shows the hint button while the round runs and the next-word button after it.
   * @param {import('./round.js').Round} round
   * @param {'en'|'tr'} uiLang
   */
  function renderActions(round, uiLang) {
    const playing = round.status === 'playing';
    const hintable = canUseHint(round);
    els.hint.hidden = !playing;
    els.next.hidden = playing;
    els.hint.disabled = !hintable;
    els.hint.title = translate(uiLang, hintable ? 'hintTitle' : 'hintUnavailable');
  }

  return Object.freeze({
    render(state, uiLang, message) {
      const { round, stats, lang } = state;
      els.wordList.value = lang;
      els.score.textContent = String(stats.score);
      els.streak.textContent = String(stats.streak);
      els.best.textContent = String(stats.bestStreak);
      renderStage(round, uiLang);
      renderMisses(round, uiLang);
      renderWord(round, uiLang);
      renderActions(round, uiLang);
      // The status line is a live region: only a changed text is announced again.
      const text = translate(uiLang, message.key, message.params);
      if (els.status.textContent !== text) els.status.textContent = text;
      els.status.dataset.tone = message.tone;
    },
    /** Ends the page-load drawing sequence, so later strokes start at once. */
    endIntro() {
      stage.classList.remove('is-intro');
    },
  });
}

/**
 * Picks the face of the figure: sad when lost, happy when won with a head drawn.
 * @param {import('./round.js').Round} round
 * @param {number} mistakes
 * @returns {'none'|'won'|'lost'}
 */
function faceOf(round, mistakes) {
  if (round.status === 'lost') return 'lost';
  return round.status === 'won' && mistakes > 0 ? 'won' : 'none';
}
