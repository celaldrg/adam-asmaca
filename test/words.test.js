// Word lists: alphabet, duplicates, size and categories.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, getAlphabet } from '../src/alphabet.js';
import { CATEGORIES, getCategoryLabel, getWords } from '../src/words.js';

for (const lang of LANGUAGES) {
  test(`${lang}: every word uses only letters of its alphabet`, () => {
    const alphabet = new Set(getAlphabet(lang));
    for (const { word } of getWords(lang)) {
      for (const ch of word) assert.ok(alphabet.has(ch), `"${word}" has "${ch}"`);
    }
  });

  test(`${lang}: no word appears twice`, () => {
    const words = getWords(lang).map((entry) => entry.word);
    const duplicates = words.filter((word, index) => words.indexOf(word) !== index);
    assert.deepEqual(duplicates, []);
  });

  test(`${lang}: about 150 words spread over the four categories`, () => {
    const entries = getWords(lang);
    assert.ok(entries.length >= 140 && entries.length <= 170, `${entries.length} words`);
    for (const category of CATEGORIES) {
      const count = entries.filter((entry) => entry.category === category).length;
      assert.ok(count >= 30, `${category}: ${count}`);
    }
    for (const entry of entries) assert.ok(CATEGORIES.includes(entry.category), entry.word);
  });

  test(`${lang}: words have 4 to 12 letters and at least two different ones`, () => {
    for (const { word } of getWords(lang)) {
      assert.ok(word.length >= 4 && word.length <= 12, word);
      assert.ok(new Set(word).size >= 2, word);
    }
  });
}

test('the Turkish list uses every special Turkish letter', () => {
  const text = getWords('tr')
    .map((entry) => entry.word)
    .join('');
  for (const ch of 'çğıöşü') assert.ok(text.includes(ch), ch);
});

test('the lists are frozen', () => {
  const entries = getWords('tr');
  assert.ok(Object.isFrozen(entries) && Object.isFrozen(entries[0]));
  assert.throws(() => getWords('de'), RangeError);
});

test('category labels exist in both interface languages', () => {
  for (const category of CATEGORIES) {
    for (const uiLang of LANGUAGES) {
      const label = getCategoryLabel(category, uiLang);
      assert.ok(typeof label === 'string' && label.length > 0 && label !== category, `${category}/${uiLang}`);
    }
  }
  assert.equal(getCategoryLabel('animals', 'tr'), 'Hayvanlar');
  assert.equal(getCategoryLabel('cities', 'en'), 'Cities');
  assert.equal(getCategoryLabel('mystery', 'en'), 'mystery');
  assert.equal(getCategoryLabel('food', 'de'), 'food');
});
