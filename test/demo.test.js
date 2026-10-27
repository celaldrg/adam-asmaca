// The ?demo state used for the README screenshot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoGame } from '../src/demo.js';
import { getMistakes, getSlots } from '../src/round.js';
import { getWords } from '../src/words.js';

test('the demo is a Turkish word about half solved with three wrong guesses', () => {
  const { lang, round, stats, points } = createDemoGame().getState();
  assert.equal(lang, 'tr');
  assert.equal(round.lang, 'tr');
  assert.equal(round.status, 'playing');
  assert.equal(round.wrong.length, 3);
  assert.equal(getMistakes(round), 3);
  const slots = getSlots(round);
  const share = slots.filter((slot) => slot !== null).length / slots.length;
  assert.ok(share >= 0.4 && share <= 0.6, String(share));
  assert.ok(getWords('tr').some((entry) => entry.word === round.word && entry.category === round.category));
  assert.equal(points, 0);
  assert.ok(stats.score > 0 && stats.streak > 0 && stats.bestStreak >= stats.streak);
});

test('the demo shows the dotless I next to a wrong dotted i', () => {
  const { round } = createDemoGame().getState();
  assert.deepEqual(getSlots(round), [null, 'I', 'R', null, 'A', null, null, 'I', 'Ç']);
  assert.deepEqual(round.wrong, ['e', 'i', 's']);
});

test('the demo is deterministic and plays on normally', () => {
  const a = createDemoGame();
  const b = createDemoGame();
  assert.deepEqual(a.getState(), b.getState());
  const next = a.newRound();
  assert.equal(next.round.word, b.newRound().round.word);
  assert.notEqual(next.round.word, 'kırlangıç');
  assert.equal(next.lang, 'tr');
});
