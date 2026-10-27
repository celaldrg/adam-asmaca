// Seeded word picking without repeats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWordPicker } from '../src/picker.js';
import { createRng } from '../src/rng.js';
import { getWords } from '../src/words.js';

/** Draws `count` words from a picker. */
function draw(picker, count) {
  return Array.from({ length: count }, () => picker.next().word);
}

test('every word is drawn once before any word repeats', () => {
  for (const lang of ['tr', 'en']) {
    const entries = getWords(lang);
    const words = draw(createWordPicker(entries, createRng(42)), entries.length);
    assert.equal(new Set(words).size, entries.length, lang);
  }
});

test('the same seed gives the same order, another seed another order', () => {
  const order = (seed) => draw(createWordPicker(getWords('en'), createRng(seed)), 10);
  assert.deepEqual(order(5), order(5));
  assert.notDeepEqual(order(5), order(6));
});

test('a new cycle never starts with the word drawn last', () => {
  const entries = [{ word: 'kedi' }, { word: 'deve' }, { word: 'eşek' }];
  for (let seed = 0; seed < 30; seed += 1) {
    const words = draw(createWordPicker(entries, createRng(seed)), 6);
    assert.equal(new Set(words.slice(0, 3)).size, 3);
    words.forEach((word, index) => assert.notEqual(word, words[index - 1], `seed ${seed}`));
  }
});

test('excluded words wait until the list runs out', () => {
  const entries = getWords('tr');
  const picker = createWordPicker(entries, createRng(9), ['kırlangıç']);
  const firstCycle = draw(picker, entries.length - 1);
  assert.ok(!firstCycle.includes('kırlangıç'));
  assert.equal(new Set(firstCycle).size, entries.length - 1);
});

test('a one-word list keeps working and an empty list is rejected', () => {
  const picker = createWordPicker([{ word: 'kedi' }], createRng(1));
  assert.deepEqual(draw(picker, 3), ['kedi', 'kedi', 'kedi']);
  assert.throws(() => createWordPicker([], createRng(1)), RangeError);
});
