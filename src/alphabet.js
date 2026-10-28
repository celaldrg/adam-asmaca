/**
 * Alphabets and letter handling for the word-list languages.
 * Turkish has its own case rules: i/İ and ı/I are two different letters,
 * so every case change goes through the language's locale ('tr' or 'en').
 */

/** Supported word-list languages; the codes double as locale tags. Exported as a test seam. */
export const LANGUAGES = Object.freeze(['en', 'tr']);

const ALPHABETS = Object.freeze({
  en: Object.freeze([...'abcdefghijklmnopqrstuvwxyz']),
  tr: Object.freeze([...'abcçdefgğhıijklmnoöprsştuüvyz']),
});

/**
 * Tells whether a value is a supported word-list language code.
 * @param {unknown} value
 * @returns {value is 'en'|'tr'}
 */
export function isLanguage(value) {
  return LANGUAGES.includes(value);
}

/**
 * Returns the alphabet of a language in alphabetical order:
 * 29 letters for Turkish (no q, w, x), 26 for English.
 * @param {'en'|'tr'} lang
 * @returns {readonly string[]} Lower-case letters.
 * @throws {RangeError} For an unsupported language.
 */
export function getAlphabet(lang) {
  return ALPHABETS[checkLanguage(lang)];
}

/**
 * Lower-cases text with the language's locale and checks that it only uses
 * letters of that language's alphabet.
 * @param {unknown} text Word or single letter, any case.
 * @param {'en'|'tr'} lang
 * @returns {string|null} The lower-case text, or null when it is empty or has other characters.
 * @throws {RangeError} For an unsupported language.
 */
export function normalizeWord(text, lang) {
  const alphabet = ALPHABETS[checkLanguage(lang)];
  if (typeof text !== 'string' || text.length === 0) return null;
  const lower = text.normalize('NFC').toLocaleLowerCase(lang);
  return [...lower].every((ch) => alphabet.includes(ch)) ? lower : null;
}

/**
 * Maps raw input (a KeyboardEvent.key value or an on-screen key) to one letter.
 * Case folding follows the language: in Turkish "I" becomes "ı" and "İ" becomes "i".
 * @param {unknown} input
 * @param {'en'|'tr'} lang
 * @returns {string|null} The lower-case letter, or null when the input is not exactly one letter of `lang`.
 * @throws {RangeError} For an unsupported language.
 */
export function normalizeLetter(input, lang) {
  const letter = normalizeWord(input, lang);
  return letter !== null && letter.length === 1 ? letter : null;
}

/**
 * Upper-cases text for display with the case rules of its language
 * (Turkish: i → İ, ı → I).
 * @param {string} text
 * @param {'en'|'tr'} lang
 * @returns {string}
 * @throws {RangeError} For an unsupported language.
 */
export function toDisplayUpper(text, lang) {
  return text.toLocaleUpperCase(checkLanguage(lang));
}

/**
 * Returns the language unchanged or throws when it is not supported.
 * @param {unknown} lang
 * @returns {'en'|'tr'}
 */
function checkLanguage(lang) {
  if (!isLanguage(lang)) throw new RangeError(`Unsupported language: ${String(lang)}`);
  return lang;
}
