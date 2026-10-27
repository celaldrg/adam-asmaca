// Score and streak bookkeeping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRound, guessLetter } from '../src/round.js';
import {
  POINTS_PER_LIFE,
  POINTS_PER_WIN,
  loadStats,
  normalizeStats,
  recordLoss,
  recordResult,
  saveStats,
  scoreRound,
} from '../src/stats.js';
import { createStorage } from '../src/storage.js';

const ZERO = { score: 0, streak: 0, bestStreak: 0, wins: 0, losses: 0 };

/** Plays letters on a Turkish word and returns the resulting round. */
function play(word, letters) {
  return letters.reduce((round, letter) => guessLetter(round, letter).round, createRound({ word, lang: 'tr' }));
}

const WIN = play('kedi', ['k', 'e', 'd', 'i']);
const LOSS = play('kedi', ['a', 'b', 'c', 'ç', 'f', 'g']);

test('a win scores 10 points plus 5 for each life left', () => {
  assert.equal(POINTS_PER_WIN, 10);
  assert.equal(POINTS_PER_LIFE, 5);
  assert.equal(scoreRound(WIN), 40);
  assert.equal(scoreRound(play('kedi', ['a', 'b', 'k', 'e', 'd', 'i'])), 30);
  assert.equal(scoreRound(LOSS), 0);
  assert.equal(scoreRound(play('kedi', ['k'])), 0);
});

test('wins build the streak and a loss resets it', () => {
  let stats = normalizeStats(null);
  stats = recordResult(stats, WIN);
  stats = recordResult(stats, WIN);
  assert.deepEqual(stats, { score: 80, streak: 2, bestStreak: 2, wins: 2, losses: 0 });
  stats = recordResult(stats, LOSS);
  assert.deepEqual(stats, { score: 80, streak: 0, bestStreak: 2, wins: 2, losses: 1 });
  stats = recordResult(stats, WIN);
  assert.deepEqual(stats, { score: 120, streak: 1, bestStreak: 2, wins: 3, losses: 1 });
});

test('a round still in play leaves the stats unchanged', () => {
  const stats = normalizeStats(null);
  assert.equal(recordResult(stats, play('kedi', ['k'])), stats);
});

test('recordLoss resets the streak and counts a loss', () => {
  const stats = { ...ZERO, score: 5, streak: 3, bestStreak: 3, wins: 3 };
  assert.deepEqual(recordLoss(stats), { score: 5, streak: 0, bestStreak: 3, wins: 3, losses: 1 });
});

test('normalizeStats repairs untrusted saved data', () => {
  for (const junk of [null, undefined, 'junk', 42, []]) assert.deepEqual(normalizeStats(junk), ZERO);
  assert.deepEqual(normalizeStats({ score: -5, streak: 2.5, bestStreak: '9', wins: 3, losses: Number.NaN }), {
    ...ZERO,
    wins: 3,
  });
  assert.deepEqual(normalizeStats({ streak: 4, bestStreak: 2 }), { ...ZERO, streak: 4, bestStreak: 4 });
  assert.ok(Object.isFrozen(normalizeStats({})));
});

test('score and streak are saved and loaded through the storage helper', () => {
  const items = new Map();
  const store = createStorage(() => ({
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, value),
  }));
  assert.deepEqual(loadStats(store), ZERO);
  const stats = recordResult(recordResult(normalizeStats(null), WIN), WIN);
  assert.equal(saveStats(store, stats), true);
  assert.deepEqual(loadStats(store), stats);
  items.set('adam-asmaca:stats', '{"score":"lots","streak":-1}');
  assert.deepEqual(loadStats(store), ZERO);
});

test('stats survive storage that is blocked (private mode)', () => {
  const store = createStorage(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
  assert.deepEqual(loadStats(store), ZERO);
  assert.equal(saveStats(store, { ...ZERO, score: 10 }), false);
});
