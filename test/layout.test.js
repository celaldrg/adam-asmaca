// On-screen keyboard layout: balanced rows and tap cells of at least 40 px.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAlphabet } from '../src/alphabet.js';
import { MAX_KEYS_PER_ROW, MIN_KEY_CELL, keysPerRow, splitRows } from '../src/layout.js';

/** Row lengths of an alphabet laid out in a row of `width` pixels. */
function rowLengths(lang, width) {
  return splitRows(getAlphabet(lang), keysPerRow(width)).map((row) => row.length);
}

test('rows are balanced, longer rows first', () => {
  assert.deepEqual(splitRows([...'abcdefghij'], 4).map((row) => row.join('')), ['abcd', 'efg', 'hij']);
  assert.deepEqual(splitRows([1, 2, 3], 10), [[1, 2, 3]]);
  assert.deepEqual(splitRows([], 5), []);
  assert.deepEqual(splitRows([1, 2], 0), [[1], [2]]);
});

test('no letter is lost or reordered', () => {
  for (const lang of ['tr', 'en']) {
    for (let perRow = 1; perRow <= 12; perRow += 1) {
      assert.deepEqual(splitRows(getAlphabet(lang), perRow).flat(), [...getAlphabet(lang)], `${lang} ${perRow}`);
    }
  }
});

test('a 375 px phone (351 px row) gets four rows with tap cells of at least 40 px', () => {
  assert.deepEqual(rowLengths('tr', 351), [8, 7, 7, 7]);
  assert.deepEqual(rowLengths('en', 351), [7, 7, 6, 6]);
  for (const lang of ['tr', 'en']) {
    const widest = Math.max(...rowLengths(lang, 351));
    assert.ok(351 / widest >= 40, `${lang}: ${351 / widest} px`);
  }
});

test('desktop rows hold at most ten keys', () => {
  assert.deepEqual(rowLengths('tr', 560), [10, 10, 9]);
  assert.deepEqual(rowLengths('en', 560), [9, 9, 8]);
  assert.equal(keysPerRow(5000), MAX_KEYS_PER_ROW);
});

test('every width keeps cells at least MIN_KEY_CELL wide', () => {
  assert.ok(MIN_KEY_CELL >= 40);
  for (let width = 200; width <= 1200; width += 7) {
    const perRow = keysPerRow(width);
    assert.ok(width / perRow >= MIN_KEY_CELL, `${width}px: ${perRow} per row`);
  }
  assert.equal(keysPerRow(20), 1);
  assert.equal(keysPerRow(0), MAX_KEYS_PER_ROW);
  assert.equal(keysPerRow(Number.NaN), MAX_KEYS_PER_ROW);
});
