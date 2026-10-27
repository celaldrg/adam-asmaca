// Saved interface and word-list languages, and the ?demo switch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFS, isDemo, loadPrefs, savePrefs } from '../src/prefs.js';
import { createStorage } from '../src/storage.js';

/** Storage helper over an in-memory map. */
function memoryStore() {
  const items = new Map();
  const store = createStorage(() => ({
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, value),
  }));
  return { items, store };
}

test('a first visit uses English for both the interface and the words', () => {
  assert.deepEqual(DEFAULT_PREFS, { ui: 'en', words: 'en' });
  assert.deepEqual(loadPrefs(memoryStore().store), DEFAULT_PREFS);
});

test('both languages are saved and loaded independently', () => {
  const { store } = memoryStore();
  assert.equal(savePrefs(store, { ui: 'tr', words: 'en' }), true);
  assert.deepEqual(loadPrefs(store), { ui: 'tr', words: 'en' });
  savePrefs(store, { ui: 'en', words: 'tr' });
  assert.deepEqual(loadPrefs(store), { ui: 'en', words: 'tr' });
});

test('unknown or corrupt saved values fall back to the defaults', () => {
  const { items, store } = memoryStore();
  items.set('adam-asmaca:prefs', JSON.stringify({ ui: 'de', words: 'TR' }));
  assert.deepEqual(loadPrefs(store), DEFAULT_PREFS);
  items.set('adam-asmaca:prefs', JSON.stringify({ ui: 'tr', words: 42 }));
  assert.deepEqual(loadPrefs(store), { ui: 'tr', words: 'en' });
  for (const junk of ['"tr"', '[1,2]', 'null', '{oops']) {
    items.set('adam-asmaca:prefs', junk);
    assert.deepEqual(loadPrefs(store), DEFAULT_PREFS, junk);
  }
});

test('blocked storage (private mode) gives the defaults and reports a failed save', () => {
  const store = createStorage(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
  assert.deepEqual(loadPrefs(store), DEFAULT_PREFS);
  assert.equal(savePrefs(store, { ui: 'tr', words: 'tr' }), false);
});

test('only a ?demo query opens the demo', () => {
  for (const search of ['?demo', '?demo=1', '?x=1&demo', 'demo']) assert.equal(isDemo(search), true, search);
  for (const search of ['', '?', '?demos', '?x=demo']) assert.equal(isDemo(search), false, search);
});
