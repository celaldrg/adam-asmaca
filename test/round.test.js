// Round rules: win/lose after six mistakes, free repeats and invalid keys, hints.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import {
  MAX_WRONG,
  canUseHint,
  createRound,
  getLetterState,
  getLivesLeft,
  getMistakes,
  getSlots,
  guessLetter,
  isInProgress,
  useHint,
} from '../src/round.js';

/** Plays the letters in order; returns the last round and every outcome. */
function play(round, letters) {
  let current = round;
  const outcomes = letters.map((letter) => {
    const result = guessLetter(current, letter);
    current = result.round;
    return result.outcome;
  });
  return { round: current, outcomes };
}

const kedi = () => createRound({ word: 'kedi', lang: 'tr', category: 'animals' });

/** Six letters that are not in "kedi". */
const MISSES = ['a', 'b', 'c', 'ç', 'f', 'g'];

describe('win and lose', () => {
  test('finding every letter wins', () => {
    const { round, outcomes } = play(kedi(), ['k', 'e', 'd', 'i']);
    assert.deepEqual(outcomes, ['correct', 'correct', 'correct', 'correct']);
    assert.equal(round.status, 'won');
    assert.equal(getLivesLeft(round), MAX_WRONG);
  });

  test('the sixth wrong guess loses the round, not the fifth', () => {
    assert.equal(MAX_WRONG, 6);
    let round = kedi();
    MISSES.forEach((letter, index) => {
      const result = guessLetter(round, letter);
      round = result.round;
      assert.equal(result.outcome, 'wrong');
      assert.equal(getMistakes(round), index + 1);
      assert.equal(round.status, index < 5 ? 'playing' : 'lost', `after ${index + 1} misses`);
    });
    assert.equal(getLivesLeft(round), 0);
  });

  test('five mistakes still allow a win', () => {
    const { round } = play(kedi(), [...MISSES.slice(0, 5), 'k', 'e', 'd', 'i']);
    assert.equal(round.status, 'won');
    assert.equal(getLivesLeft(round), 1);
  });

  test('a finished round ignores further guesses', () => {
    const lost = play(kedi(), MISSES).round;
    const won = play(kedi(), ['k', 'e', 'd', 'i']).round;
    for (const round of [lost, won]) {
      const result = guessLetter(round, 'k');
      assert.equal(result.outcome, 'over');
      assert.equal(result.round, round);
    }
  });
});

describe('inputs that cost nothing', () => {
  test('repeated guesses do not cost a life', () => {
    const { round } = play(kedi(), ['a', 'k']);
    for (const input of ['a', 'A', 'k', 'K']) {
      const result = guessLetter(round, input);
      assert.equal(result.outcome, 'repeat', input);
      assert.equal(result.round, round);
    }
    assert.equal(getMistakes(round), 1);
  });

  test('keys outside the alphabet are ignored', () => {
    const round = kedi();
    for (const input of ['q', 'w', 'x', 'Q', '7', ' ', '', 'Enter', 'ab', 'é', undefined]) {
      const result = guessLetter(round, input);
      assert.equal(result.outcome, 'invalid', JSON.stringify(input));
      assert.equal(result.round, round);
    }
  });
});

describe('hints', () => {
  test('a hint costs one life and reveals every copy of one hidden letter', () => {
    const word = 'kelebek';
    const { round, letter } = useHint(createRound({ word, lang: 'tr' }), createRng(1));
    assert.ok(['k', 'e', 'l', 'b'].includes(letter));
    assert.equal(getMistakes(round), 1);
    assert.deepEqual(round.hinted, [letter]);
    assert.deepEqual(round.wrong, []);
    assert.equal(getLetterState(round, letter), 'correct');
    const expected = [...word].map((ch) => (ch === letter ? ch.toLocaleUpperCase('tr-TR') : null));
    assert.deepEqual(getSlots(round), expected);
  });

  test('hints follow the seed and never pick a letter that is already found', () => {
    const start = guessLetter(createRound({ word: 'kelebek', lang: 'tr' }), 'e').round;
    assert.equal(useHint(start, createRng(7)).letter, useHint(start, createRng(7)).letter);
    for (let seed = 0; seed < 40; seed += 1) {
      assert.notEqual(useHint(start, createRng(seed)).letter, 'e');
    }
  });

  test('no hint with one life left, so a hint can never lose the round', () => {
    const { round } = play(kedi(), MISSES.slice(0, 5));
    assert.equal(getLivesLeft(round), 1);
    assert.equal(canUseHint(round), false);
    const result = useHint(round, createRng(1));
    assert.equal(result.letter, null);
    assert.equal(result.round, round);
  });

  test('hints and wrong guesses share the six lives', () => {
    const rng = createRng(5);
    let { round } = play(createRound({ word: 'kaplumbağa', lang: 'tr' }), ['e', 'i', 'o']);
    round = useHint(round, rng).round;
    round = useHint(round, rng).round;
    assert.equal(getMistakes(round), 5);
    assert.equal(canUseHint(round), false);
    assert.equal(round.status, 'playing');
    round = guessLetter(round, 'z').round;
    assert.equal(round.status, 'lost');
  });

  test('a hint that reveals the last hidden letter wins', () => {
    const { round } = play(kedi(), ['k', 'e', 'd']);
    const result = useHint(round, createRng(3));
    assert.equal(result.letter, 'i');
    assert.equal(result.round.status, 'won');
    assert.equal(getLivesLeft(result.round), MAX_WRONG - 1);
  });

  test('no hints once the round is over', () => {
    assert.equal(canUseHint(play(kedi(), ['k', 'e', 'd', 'i']).round), false);
    assert.equal(canUseHint(play(kedi(), MISSES).round), false);
  });
});

test('createRound lower-cases with the word locale and rejects foreign letters', () => {
  assert.equal(createRound({ word: 'IĞDIR', lang: 'tr' }).word, 'ığdır');
  assert.equal(createRound({ word: 'İZMİR', lang: 'tr' }).word, 'izmir');
  assert.equal(createRound({ word: 'Paris', lang: 'en' }).word, 'paris');
  for (const [word, lang] of [
    ['waffle', 'tr'],
    ['kuş', 'en'],
    ['new york', 'en'],
    ['', 'tr'],
  ]) {
    assert.throws(() => createRound({ word, lang }), RangeError, word);
  }
  assert.throws(() => createRound({ word: 'kedi', lang: 'de' }), RangeError);
});

test('rounds are immutable snapshots', () => {
  const round = kedi();
  const next = guessLetter(round, 'a').round;
  assert.ok(Object.isFrozen(round) && Object.isFrozen(round.wrong) && Object.isFrozen(next.correct));
  assert.deepEqual(round.wrong, []);
  assert.deepEqual(next.wrong, ['a']);
  assert.equal(next.category, 'animals');
});

test('keyboard state and progress helpers', () => {
  const fresh = kedi();
  assert.equal(isInProgress(fresh), false);
  const { round } = play(fresh, ['k', 'a']);
  assert.equal(getLetterState(round, 'k'), 'correct');
  assert.equal(getLetterState(round, 'a'), 'wrong');
  assert.equal(getLetterState(round, 'ı'), 'unused');
  assert.equal(isInProgress(round), true);
  assert.equal(isInProgress(play(fresh, ['k', 'e', 'd', 'i']).round), false);
});

test('English rounds use the English alphabet and casing', () => {
  const round = createRound({ word: 'giraffe', lang: 'en' });
  const result = guessLetter(round, 'I');
  assert.equal(result.outcome, 'correct');
  assert.equal(result.letter, 'i');
  assert.deepEqual(getSlots(result.round), [null, 'I', null, null, null, null, null]);
  assert.equal(guessLetter(round, 'ı').outcome, 'invalid');
  assert.equal(guessLetter(round, 'ş').outcome, 'invalid');
});
