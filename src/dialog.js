/**
 * End-of-round dialog: the answer, the points of the round and the running
 * score and streak. Built on <dialog>, so focus stays inside while it is open
 * and Escape or a tap outside closes it.
 */

import { toDisplayUpper } from './alphabet.js';
import { byId } from './dom.js';
import { translate } from './i18n.js';
import { getCategoryLabel } from './words.js';

/**
 * Wires the result dialog of the page.
 * @param {() => void} onNext Called by the "Next word" button.
 * @returns {{
 *   show: (state: import('./game.js').GameState, uiLang: 'en'|'tr') => void,
 *   close: () => void,
 *   isOpen: () => boolean,
 * }}
 */
export function createResultDialog(onNext) {
  const dialog = byId('result');
  const fields = {
    title: byId('result-title'),
    word: byId('result-word'),
    category: byId('result-category'),
    points: byId('result-points'),
    score: byId('result-score'),
    streak: byId('result-streak'),
    best: byId('result-best'),
  };
  byId('result-next').addEventListener('click', onNext);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return Object.freeze({
    show(state, uiLang) {
      const { round, stats, points } = state;
      dialog.dataset.status = round.status;
      fields.title.textContent = translate(uiLang, round.status === 'won' ? 'resultWon' : 'resultLost');
      fields.word.textContent = toDisplayUpper(round.word, round.lang);
      fields.word.lang = round.lang;
      fields.category.textContent = getCategoryLabel(round.category, uiLang);
      fields.points.textContent = points > 0 ? translate(uiLang, 'resultPoints', { points }) : translate(uiLang, 'resultNoPoints');
      fields.score.textContent = String(stats.score);
      fields.streak.textContent = String(stats.streak);
      fields.best.textContent = String(stats.bestStreak);
      if (!dialog.open) dialog.showModal();
    },
    close() {
      if (dialog.open) dialog.close();
    },
    isOpen: () => dialog.open,
  });
}
