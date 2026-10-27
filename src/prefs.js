/**
 * Saved preferences (interface language and word-list language) and the
 * "?demo" switch. Storage goes through the storage helper passed in by the caller.
 */

import { isLanguage } from './alphabet.js';

const PREFS_KEY = 'prefs';

/**
 * @typedef {object} Prefs
 * @property {'en'|'tr'} ui     Interface language.
 * @property {'en'|'tr'} words  Word-list language.
 */

/** Preferences of a first visit: English interface, English words. */
export const DEFAULT_PREFS = Object.freeze({ ui: 'en', words: 'en' });

/**
 * Reads the saved preferences; anything missing or unknown falls back to the default.
 * @param {import('./storage.js').KeyValueStore} store The storage helper.
 * @returns {Readonly<Prefs>}
 */
export function loadPrefs(store) {
  const raw = store.get(PREFS_KEY, null);
  const source = raw !== null && typeof raw === 'object' ? raw : {};
  return Object.freeze({
    ui: isLanguage(source.ui) ? source.ui : DEFAULT_PREFS.ui,
    words: isLanguage(source.words) ? source.words : DEFAULT_PREFS.words,
  });
}

/**
 * Saves the preferences.
 * @param {import('./storage.js').KeyValueStore} store The storage helper.
 * @param {Prefs} prefs
 * @returns {boolean} False when storage is unavailable.
 */
export function savePrefs(store, prefs) {
  return store.set(PREFS_KEY, { ui: prefs.ui, words: prefs.words });
}

/**
 * Tells whether a URL query string asks for the demo state ("?demo").
 * @param {string} search For example window.location.search.
 * @returns {boolean}
 */
export function isDemo(search) {
  return new URLSearchParams(search).has('demo');
}
