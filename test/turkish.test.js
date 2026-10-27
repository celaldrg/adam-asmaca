// Turkish letter handling: ı/i, ö/o, ü/u, ş/s, ç/c and ğ/g are separate letters,
// and upper case follows Turkish rules (i → İ, ı → I).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { toDisplayUpper } from '../src/alphabet.js';
import { createRound, getMistakes, getSlots, guessLetter } from '../src/round.js';

/** Plays the letters in order on a Turkish word; returns the last round and every outcome. */
function play(word, letters) {
  let round = createRound({ word, lang: 'tr' });
  const outcomes = letters.map((letter) => {
    const result = guessLetter(round, letter);
    round = result.round;
    return result.outcome;
  });
  return { round, outcomes };
}

/** The word as the player sees it, "_" for hidden letters. */
function shown(round) {
  return getSlots(round)
    .map((slot) => slot ?? '_')
    .join('');
}

// [Turkish letter, look-alike, word with only the Turkish letter, word with only the look-alike]
const PAIRS = [
  ['ı', 'i', 'kırlangıç', 'kedi'],
  ['ö', 'o', 'köpek', 'koyun'],
  ['ü', 'u', 'üzüm', 'uçurtma'],
  ['ş', 's', 'şeftali', 'salatalık'],
  ['ç', 'c', 'çilek', 'ceviz'],
  ['ğ', 'g', 'yoğurt', 'geyik'],
];

describe('guesses never confuse a Turkish letter with its look-alike', () => {
  for (const [special, plain, specialWord, plainWord] of PAIRS) {
    test(`${special} and ${plain} are different letters`, () => {
      assert.ok(specialWord.includes(special) && !specialWord.includes(plain), 'fixture word');
      assert.ok(plainWord.includes(plain) && !plainWord.includes(special), 'fixture word');

      const special1st = play(specialWord, [plain, special]);
      assert.deepEqual(special1st.outcomes, ['wrong', 'correct']);
      assert.equal(getMistakes(special1st.round), 1);

      const plain1st = play(plainWord, [special, plain]);
      assert.deepEqual(plain1st.outcomes, ['wrong', 'correct']);
      assert.equal(getMistakes(plain1st.round), 1);
    });
  }

  test('in "kırşehir" ı, i, ş and s each reveal only their own positions', () => {
    const steps = [
      ['i', '______İ_'],
      ['ı', '_I____İ_'],
      ['s', '_I____İ_'],
      ['ş', '_I_Ş__İ_'],
    ];
    let round = createRound({ word: 'kırşehir', lang: 'tr' });
    for (const [letter, expected] of steps) {
      round = guessLetter(round, letter).round;
      assert.equal(shown(round), expected, `after ${letter}`);
    }
    assert.deepEqual(round.wrong, ['s']);
  });
});

describe('Turkish upper case for display', () => {
  test('i becomes İ and ı becomes I', () => {
    assert.equal(toDisplayUpper('i', 'tr'), 'İ');
    assert.equal(toDisplayUpper('ı', 'tr'), 'I');
  });

  test('whole words keep their dots and marks', () => {
    assert.equal(toDisplayUpper('istanbul', 'tr'), 'İSTANBUL');
    assert.equal(toDisplayUpper('ığdır', 'tr'), 'IĞDIR');
    assert.equal(toDisplayUpper('kırlangıç', 'tr'), 'KIRLANGIÇ');
    assert.equal(toDisplayUpper('şeftali', 'tr'), 'ŞEFTALİ');
    assert.equal(toDisplayUpper('gözlükçü', 'tr'), 'GÖZLÜKÇÜ');
  });

  test('English keeps the plain I', () => {
    assert.equal(toDisplayUpper('i', 'en'), 'I');
    assert.equal(toDisplayUpper('istanbul', 'en'), 'ISTANBUL');
  });

  test('revealed letters are shown with Turkish capitals', () => {
    const { round } = play('kırşehir', ['ı', 'i']);
    assert.deepEqual(getSlots(round), [null, 'I', null, null, null, null, 'İ', null]);
  });
});

describe('typed capitals follow Turkish case rules', () => {
  test('I means ı and İ means i', () => {
    const first = guessLetter(createRound({ word: 'ığdır', lang: 'tr' }), 'I');
    assert.equal(first.outcome, 'correct');
    assert.equal(first.letter, 'ı');
    const second = guessLetter(first.round, 'İ');
    assert.equal(second.outcome, 'wrong');
    assert.equal(second.letter, 'i');
    assert.equal(shown(second.round), 'I__I_');
  });

  test('a capital repeats only its own lower-case letter', () => {
    const { round } = play('kırşehir', ['ı']);
    assert.equal(guessLetter(round, 'I').outcome, 'repeat');
    assert.equal(guessLetter(round, 'İ').outcome, 'correct');
  });

  test('capitals of ç, ğ, ö, ş and ü map to their own letters', () => {
    assert.deepEqual(play('gözlükçü', ['Ö', 'Ü', 'Ç']).outcomes, ['correct', 'correct', 'correct']);
    assert.deepEqual(play('yağışlı', ['Ğ', 'Ş', 'I']).outcomes, ['correct', 'correct', 'correct']);
    assert.deepEqual(play('kedi', ['Ö', 'Ü', 'Ç', 'Ğ', 'Ş']).outcomes, ['wrong', 'wrong', 'wrong', 'wrong', 'wrong']);
  });
});
