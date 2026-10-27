// Seeded generator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomInt } from '../src/rng.js';

/** Draws `count` values from a generator. */
function take(rng, count) {
  return Array.from({ length: count }, () => rng());
}

test('the same seed replays the same sequence', () => {
  assert.deepEqual(take(createRng(123), 20), take(createRng(123), 20));
  assert.notDeepEqual(take(createRng(123), 20), take(createRng(124), 20));
});

test('values stay in [0, 1) and randomInt covers its whole range', () => {
  const rng = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, String(value));
    const index = randomInt(rng, 29);
    assert.ok(Number.isInteger(index) && index >= 0 && index < 29, String(index));
    seen.add(index);
  }
  assert.equal(seen.size, 29);
});
