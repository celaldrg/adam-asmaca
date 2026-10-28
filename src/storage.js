/**
 * Tiny localStorage helper. Every read and write is wrapped in try/catch, so
 * private browsing, blocked storage or a full quota never crash the game.
 * localStorage is looked up only when a value is read or written, never at import time.
 */

const PREFIX = 'adam-asmaca:';

/**
 * @typedef {object} KeyValueStore
 * @property {(key: string, fallback: any) => any} get  Returns the stored value, or `fallback` when missing or unreadable.
 * @property {(key: string, value: any) => boolean} set  Stores a JSON-serializable value; returns false when it failed.
 */

/**
 * Creates a storage helper around a Web Storage-like backend. Exported as a test seam (tests inject a fake backend).
 * @param {() => (Pick<Storage, 'getItem'|'setItem'>|null|undefined)} [getBackend]
 *   Returns the backend when it is needed; defaults to the page's localStorage.
 * @returns {KeyValueStore}
 */
export function createStorage(getBackend = () => globalThis.localStorage) {
  return Object.freeze({
    get(key, fallback) {
      try {
        const raw = getBackend().getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        getBackend().setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  });
}

/** Shared helper bound to the page's localStorage. */
export const storage = createStorage();
