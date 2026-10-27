// Alphabets and input normalization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, getAlphabet, isLanguage, normalizeLetter, normalizeWord } from '../src/alphabet.js';

test('the Turkish alphabet has 29 letters with ç ğ ı ö ş ü and without q, w, x', () => {
  const tr = getAlphabet('tr');
  assert.equal(tr.join(''), 'abcçdefgğhıijklmnoöprsştuüvyz');
  assert.equal(tr.length, 29);
  assert.equal(new Set(tr).size, 29);
  for (const letter of ['q', 'w', 'x']) assert.ok(!tr.includes(letter), letter);
});

test('the English alphabet has the 26 letters a-z', () => {
  assert.equal(getAlphabet('en').join(''), 'abcdefghijklmnopqrstuvwxyz');
});

test('Turkish input folds I to ı and İ to i', () => {
  const cases = [
    ['I', 'ı'],
    ['İ', 'i'],
    ['ı', 'ı'],
    ['i', 'i'],
    ['Ş', 'ş'],
    ['Ç', 'ç'],
    ['Ğ', 'ğ'],
    ['Ö', 'ö'],
    ['Ü', 'ü'],
    ['A', 'a'],
  ];
  for (const [input, letter] of cases) assert.equal(normalizeLetter(input, 'tr'), letter, input);
});

test('English input folds I to i', () => {
  assert.equal(normalizeLetter('I', 'en'), 'i');
  assert.equal(normalizeLetter('Q', 'en'), 'q');
});

test('anything but one letter of the alphabet is rejected', () => {
  for (const input of ['q', 'W', 'x', '1', ' ', '', 'ab', 'Enter', 'é', 'â', null, undefined, 7]) {
    assert.equal(normalizeLetter(input, 'tr'), null, String(input));
  }
  for (const input of ['ş', 'ı', 'ç', 'ğ', 'ö', 'ü', 'İ']) {
    assert.equal(normalizeLetter(input, 'en'), null, input);
  }
});

test('decomposed input is composed before matching', () => {
  assert.equal(normalizeLetter('ş', 'tr'), 'ş');
  assert.equal(normalizeWord('şeftali', 'tr'), 'şeftali');
});

test('normalizeWord lower-cases with the language locale', () => {
  assert.equal(normalizeWord('IĞDIR', 'tr'), 'ığdır');
  assert.equal(normalizeWord('İZMİR', 'tr'), 'izmir');
  assert.equal(normalizeWord('Paris', 'en'), 'paris');
  assert.equal(normalizeWord('new york', 'en'), null);
  assert.equal(normalizeWord('waffle', 'tr'), null);
  assert.equal(normalizeWord('', 'tr'), null);
});

test('only the supported languages are accepted', () => {
  assert.deepEqual([...LANGUAGES].sort(), ['en', 'tr']);
  assert.ok(isLanguage('tr') && isLanguage('en'));
  for (const value of ['de', 'TR', '', undefined, 'toString']) assert.equal(isLanguage(value), false, String(value));
  assert.throws(() => getAlphabet('de'), RangeError);
  assert.throws(() => normalizeLetter('a', 'de'), RangeError);
});
