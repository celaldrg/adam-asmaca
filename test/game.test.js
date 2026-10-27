// Game session: word order, stats booking, abandoning rounds, hints, word-list switch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAlphabet } from '../src/alphabet.js';
import { createGame } from '../src/game.js';
import { MAX_WRONG, getMistakes } from '../src/round.js';
import { getWords } from '../src/words.js';

/** Guesses every distinct letter of the answer; returns the last guess result. */
function solve(game) {
  let result;
  for (const letter of new Set(game.getState().round.word)) result = game.guess(letter);
  return result;
}

/** Guesses letters that are not in the answer until the round is lost; returns the last result. */
function fail(game) {
  const { word, lang } = game.getState().round;
  const misses = getAlphabet(lang).filter((letter) => !word.includes(letter));
  let result;
  for (const letter of misses.slice(0, MAX_WRONG)) result = game.guess(letter);
  return result;
}

test('a seed fixes the word order', () => {
  const words = (seed) => {
    const game = createGame({ lang: 'tr', seed });
    return [game.getState().round.word, game.newRound().round.word, game.newRound().round.word];
  };
  assert.deepEqual(words(11), words(11));
  assert.notDeepEqual(words(11), words(12));
});

test('rounds come from the chosen word list, English by default', () => {
  assert.equal(createGame({ seed: 1 }).getState().lang, 'en');
  for (const lang of ['tr', 'en']) {
    const state = createGame({ lang, seed: 3 }).getState();
    assert.equal(state.lang, lang);
    assert.equal(state.round.lang, lang);
    assert.ok(getWords(lang).some((entry) => entry.word === state.round.word && entry.category === state.round.category));
  }
});

test('a session never repeats a word', () => {
  const game = createGame({ lang: 'en', seed: 99 });
  const total = getWords('en').length;
  const seen = new Set([game.getState().round.word]);
  for (let i = 1; i < total; i += 1) seen.add(game.newRound().round.word);
  assert.equal(seen.size, total);
});

test('a win is booked exactly once', () => {
  const game = createGame({ lang: 'tr', seed: 1 });
  const result = solve(game);
  assert.equal(result.outcome, 'correct');
  assert.equal(result.finished, true);
  const state = game.getState();
  assert.equal(state.round.status, 'won');
  assert.equal(state.points, 40);
  assert.deepEqual(state.stats, { score: 40, streak: 1, bestStreak: 1, wins: 1, losses: 0 });
  assert.deepEqual(game.guess('a'), { outcome: 'over', letter: null, finished: false });
  assert.equal(game.getState(), state);
});

test('a loss resets the streak and earns nothing', () => {
  const game = createGame({ lang: 'en', seed: 2, stats: { score: 50, streak: 3, bestStreak: 3, wins: 3, losses: 0 } });
  const result = fail(game);
  assert.equal(result.outcome, 'wrong');
  assert.equal(result.finished, true);
  const state = game.getState();
  assert.equal(state.round.status, 'lost');
  assert.equal(state.points, 0);
  assert.deepEqual(state.stats, { score: 50, streak: 0, bestStreak: 3, wins: 3, losses: 1 });
});

test('only the finishing guess reports finished', () => {
  const game = createGame({ lang: 'tr', seed: 21 });
  const letters = [...new Set(game.getState().round.word)];
  const results = letters.map((letter) => game.guess(letter));
  assert.deepEqual(
    results.map((result) => result.finished),
    letters.map((_, index) => index === letters.length - 1),
  );
});

test('leaving a started round counts as a loss, skipping an untouched one is free', () => {
  const saved = { score: 30, streak: 2, bestStreak: 2, wins: 2, losses: 0 };
  const game = createGame({ lang: 'tr', seed: 4, stats: saved });
  game.newRound();
  assert.deepEqual(game.getState().stats, saved);
  game.guess(game.getState().round.word[0]);
  game.newRound();
  assert.deepEqual(game.getState().stats, { score: 30, streak: 0, bestStreak: 2, wins: 2, losses: 1 });
  solve(game);
  const next = game.newRound();
  assert.equal(next.stats.losses, 1);
  assert.equal(next.stats.streak, 1);
  assert.equal(next.points, 0);
});

test('hints follow the seed and cost a life', () => {
  const a = createGame({ lang: 'tr', seed: 8 });
  const b = createGame({ lang: 'tr', seed: 8 });
  const hint = a.hint();
  assert.deepEqual(b.hint(), hint);
  assert.ok(a.getState().round.word.includes(hint.letter));
  assert.equal(hint.finished, false);
  assert.equal(getMistakes(a.getState().round), 1);
});

test('no hint after the round is over', () => {
  const game = createGame({ lang: 'en', seed: 6 });
  fail(game);
  const state = game.getState();
  assert.deepEqual(game.hint(), { letter: null, finished: false });
  assert.equal(game.getState(), state);
});

test('switching the word list starts a round in the new language', () => {
  const game = createGame({ lang: 'en', seed: 5 });
  const state = game.setLanguage('tr');
  assert.equal(state.lang, 'tr');
  assert.equal(state.round.lang, 'tr');
  assert.ok(getWords('tr').some((entry) => entry.word === state.round.word));
  assert.equal(game.setLanguage('tr'), state);
  assert.throws(() => game.setLanguage('de'), RangeError);
  assert.equal(game.getState(), state);
});

test('switching word lists back and forth never repeats a word', () => {
  const game = createGame({ lang: 'en', seed: 13 });
  const total = getWords('en').length;
  const seen = [game.getState().round.word];
  while (seen.length < total) {
    if (seen.length % 10 === 0) {
      assert.equal(game.setLanguage('tr').round.lang, 'tr');
      seen.push(game.setLanguage('en').round.word);
    } else {
      seen.push(game.newRound().round.word);
    }
  }
  assert.equal(new Set(seen).size, total);
});

test('switching the word list mid-round counts as leaving the round', () => {
  const game = createGame({ lang: 'en', seed: 5 });
  game.guess(game.getState().round.word[0]);
  assert.equal(game.setLanguage('tr').stats.losses, 1);
});

test('saved stats are repaired and snapshots are frozen', () => {
  const state = createGame({ seed: 1, stats: 'oops' }).getState();
  assert.deepEqual(state.stats, { score: 0, streak: 0, bestStreak: 0, wins: 0, losses: 0 });
  assert.ok(Object.isFrozen(state) && Object.isFrozen(state.round) && Object.isFrozen(state.stats));
});

test('an unsupported word-list language is rejected', () => {
  assert.throws(() => createGame({ lang: 'de', seed: 1 }), RangeError);
});
