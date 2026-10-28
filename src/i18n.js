/**
 * Interface strings in English and Turkish. The interface language is chosen
 * separately from the word-list language, so any interface can be played with
 * either word list. An entry is a plain string or a function of named
 * parameters (for letters, words and numbers inside a sentence).
 */

import { isLanguage } from './alphabet.js';

/** Interface language of a first visit. Exported as a test seam. */
export const DEFAULT_UI_LANG = 'en';

/**
 * English count of lives.
 * @param {number} n
 * @returns {string}
 */
function livesEn(n) {
  return n === 1 ? '1 life left' : `${n} lives left`;
}

const EN = Object.freeze({
  appTitle: 'Adam Asmaca',
  newGame: 'New game',
  newGameTitle: 'Skip to a new word',
  langToggle: 'TR',
  langToggleLabel: 'TR: switch the interface to Turkish',
  wordList: 'Words',
  langEnglish: 'English',
  langTurkish: 'Turkish',
  score: 'Score',
  streak: 'Streak',
  best: 'Best',
  category: 'Category',
  hint: 'Hint',
  hintCost: '−1 life',
  hintTitle: 'Reveal one letter for one life',
  hintUnavailable: 'A hint needs at least two lives left',
  nextWord: 'Next word',
  keyboardLabel: 'Letters',
  footerLicense: 'MIT',
  footerSource: 'Source on GitHub',
  theWordWas: 'The word was',
  resultWon: 'You got it!',
  resultLost: 'Out of lives',
  resultPoints: ({ points }) => `+${points} points`,
  resultNoPoints: 'No points this round',
  blank: 'blank',
  keyInWord: 'in the word',
  keyNotInWord: 'not in the word',
  gallowsLabel: ({ n, max }) => `Hangman drawing: ${n} of ${max} parts`,
  missesLabel: ({ n, letters }) => (letters ? `${livesEn(n)}. Misses: ${letters}.` : `${livesEn(n)}.`),
  wordLabel: ({ n, pattern }) => `${n}-letter word: ${pattern}`,
  msgStart: 'Pick a letter to start.',
  msgContinue: ({ n }) => `${livesEn(n)}. Pick a letter.`,
  msgCorrect: ({ letter }) => `${letter} is in the word.`,
  msgWrong: ({ letter, n }) => `No ${letter}. ${livesEn(n)}.`,
  msgRepeat: ({ letter }) => `You already tried ${letter}.`,
  msgNotInAlphabet: ({ letter, lang }) => `${letter} is not in the ${lang === 'tr' ? 'Turkish' : 'English'} alphabet.`,
  msgHint: ({ letter }) => `Hint: ${letter}. It cost one life.`,
  msgWon: ({ points }) => `Solved! +${points} points.`,
  msgLost: ({ word }) => `Out of lives. The word was ${word}.`,
  msgSkipped: ({ word }) => `The last word was ${word}. It counts as a loss.`,
});

const TR = Object.freeze({
  appTitle: 'Adam Asmaca',
  newGame: 'Yeni oyun',
  newGameTitle: 'Yeni bir kelimeye geç',
  langToggle: 'EN',
  langToggleLabel: 'EN: arayüzü İngilizceye çevir',
  wordList: 'Kelimeler',
  langEnglish: 'İngilizce',
  langTurkish: 'Türkçe',
  score: 'Puan',
  streak: 'Seri',
  best: 'En iyi',
  category: 'Kategori',
  hint: 'İpucu',
  hintCost: '−1 can',
  hintTitle: 'Bir can karşılığında bir harf aç',
  hintUnavailable: 'İpucu için en az iki can gerekir',
  nextWord: 'Sonraki kelime',
  keyboardLabel: 'Harfler',
  footerLicense: 'MIT',
  footerSource: "Kaynak kodu GitHub'da",
  theWordWas: 'Kelime',
  resultWon: 'Bildin!',
  resultLost: 'Canın kalmadı',
  resultPoints: ({ points }) => `+${points} puan`,
  resultNoPoints: 'Bu turda puan yok',
  blank: 'boş',
  keyInWord: 'kelimede var',
  keyNotInWord: 'kelimede yok',
  gallowsLabel: ({ n, max }) => `Adam çizimi: ${max} parçadan ${n} tanesi`,
  missesLabel: ({ n, letters }) => (letters ? `${n} can kaldı. Hatalar: ${letters}.` : `${n} can kaldı.`),
  wordLabel: ({ n, pattern }) => `${n} harfli kelime: ${pattern}`,
  msgStart: 'Başlamak için bir harf seç.',
  msgContinue: ({ n }) => `${n} can kaldı. Bir harf seç.`,
  msgCorrect: ({ letter }) => `${letter} harfi kelimede var.`,
  msgWrong: ({ letter, n }) => `${letter} harfi yok. ${n} can kaldı.`,
  msgRepeat: ({ letter }) => `${letter} harfini zaten denedin.`,
  msgNotInAlphabet: ({ letter, lang }) => `${letter} harfi ${lang === 'tr' ? 'Türk' : 'İngiliz'} alfabesinde yok.`,
  msgHint: ({ letter }) => `İpucu: ${letter} harfi açıldı, bir can gitti.`,
  msgWon: ({ points }) => `Bildin! +${points} puan.`,
  msgLost: ({ word }) => `Canın kalmadı. Kelime: ${word}.`,
  msgSkipped: ({ word }) => `Önceki kelime ${word} idi, kayıp sayıldı.`,
});

/** Every interface string, per language. Both tables have the same keys. Exported as a test seam. */
export const STRINGS = Object.freeze({ en: EN, tr: TR });

/**
 * Looks up an interface string.
 * @param {'en'|'tr'} lang Interface language; anything else falls back to English.
 * @param {string} key String id, e.g. 'newGame'.
 * @param {Record<string, unknown>} [params] Values for sentences with letters, words or numbers.
 * @returns {string} The text, or the key itself when it is unknown.
 */
export function translate(lang, key, params = {}) {
  const table = STRINGS[isLanguage(lang) ? lang : DEFAULT_UI_LANG];
  if (!Object.hasOwn(table, key)) return key;
  const entry = table[key];
  return typeof entry === 'function' ? entry(params) : entry;
}

/**
 * Returns the language the toggle button switches to.
 * @param {'en'|'tr'} lang Current interface language.
 * @returns {'en'|'tr'}
 */
export function otherLanguage(lang) {
  return lang === 'tr' ? 'en' : 'tr';
}
