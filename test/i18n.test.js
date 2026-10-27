// Interface strings: both languages complete, parameters filled in, Turkish-friendly sentences.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_UI_LANG, STRINGS, otherLanguage, translate } from '../src/i18n.js';

const SAMPLE = Object.freeze({ n: 3, max: 6, letter: 'İ', word: 'KIRLANGIÇ', points: 25, letters: 'E, İ, S', pattern: 'blank I R', lang: 'tr' });

test('English and Turkish define the same keys', () => {
  assert.deepEqual(Object.keys(STRINGS.tr).sort(), Object.keys(STRINGS.en).sort());
});

test('every string is non-empty, and every sentence uses its parameters', () => {
  for (const lang of ['en', 'tr']) {
    for (const [key, entry] of Object.entries(STRINGS[lang])) {
      const text = translate(lang, key, SAMPLE);
      assert.equal(typeof text, 'string', `${lang}.${key}`);
      assert.ok(text.trim().length > 0, `${lang}.${key}`);
      assert.ok(!text.includes('undefined'), `${lang}.${key}: ${text}`);
      assert.equal(typeof entry === 'function' || typeof entry === 'string', true, `${lang}.${key}`);
    }
  }
});

test('the interface is English by default, Turkish on request', () => {
  assert.equal(DEFAULT_UI_LANG, 'en');
  assert.equal(translate('en', 'newGame'), 'New game');
  assert.equal(translate('tr', 'newGame'), 'Yeni oyun');
  assert.equal(translate('de', 'newGame'), 'New game');
  assert.equal(translate('en', 'noSuchKey'), 'noSuchKey');
});

test('the language toggle shows the other language and its name starts with that label', () => {
  assert.equal(translate('en', 'langToggle'), 'TR');
  assert.equal(translate('tr', 'langToggle'), 'EN');
  for (const lang of ['en', 'tr']) {
    assert.ok(translate(lang, 'langToggleLabel').startsWith(translate(lang, 'langToggle')), lang);
  }
  assert.equal(otherLanguage('en'), 'tr');
  assert.equal(otherLanguage('tr'), 'en');
});

test('English counts lives in singular and plural; Turkish keeps the noun singular', () => {
  assert.equal(translate('en', 'msgWrong', { letter: 'E', n: 1 }), 'No E. 1 life left.');
  assert.equal(translate('en', 'msgWrong', { letter: 'E', n: 5 }), 'No E. 5 lives left.');
  assert.equal(translate('tr', 'msgWrong', { letter: 'E', n: 5 }), 'E harfi yok. 5 can kaldı.');
});

test('Turkish letters and words go into sentences unchanged', () => {
  assert.equal(translate('tr', 'msgRepeat', { letter: 'İ' }), 'İ harfini zaten denedin.');
  assert.equal(translate('en', 'msgLost', { word: 'IĞDIR' }), 'Out of lives. The word was IĞDIR.');
  assert.equal(translate('tr', 'msgNotInAlphabet', { letter: 'Q', lang: 'tr' }), 'Q harfi Türk alfabesinde yok.');
  assert.equal(translate('en', 'msgNotInAlphabet', { letter: 'Ş', lang: 'en' }), 'Ş is not in the English alphabet.');
});
