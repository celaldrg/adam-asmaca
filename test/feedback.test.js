// Status-line messages for guesses, hints and new rounds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoGame } from '../src/demo.js';
import { finishMessage, guessMessage, hintMessage, openingMessage, roundStartMessage } from '../src/feedback.js';
import { createGame } from '../src/game.js';
import { STRINGS } from '../src/i18n.js';
import { createRound, guessLetter } from '../src/round.js';

/** Starts a game whose current word is replaced by a known Turkish word. */
function gameWith(word) {
  return createGame({ seed: 1, round: createRound({ word, lang: 'tr', category: 'cities' }) });
}

/** Asserts that a message points at a string both languages define. */
function assertKnown(message) {
  assert.ok(Object.hasOwn(STRINGS.en, message.key) && Object.hasOwn(STRINGS.tr, message.key), message.key);
}

test('guesses are reported with Turkish capitals', () => {
  const game = gameWith('kırşehir');
  const correct = game.guess('i');
  const message = guessMessage(correct, game.getState(), 'i');
  assert.deepEqual(message, { key: 'msgCorrect', params: { letter: 'İ' }, tone: 'good' });

  const wrong = game.guess('o');
  assert.deepEqual(guessMessage(wrong, game.getState(), 'o'), { key: 'msgWrong', params: { letter: 'O', n: 5 }, tone: 'bad' });

  const first = game.guess('I');
  assert.equal(first.outcome, 'correct');
  assert.deepEqual(guessMessage(game.guess('ı'), game.getState(), 'ı'), { key: 'msgRepeat', params: { letter: 'I' }, tone: 'warn' });
});

test('a letter outside the alphabet is explained, other keys are ignored', () => {
  const game = gameWith('kedi');
  const state = game.getState();
  assert.deepEqual(guessMessage(game.guess('q'), state, 'q'), {
    key: 'msgNotInAlphabet',
    params: { letter: 'Q', lang: 'tr' },
    tone: 'warn',
  });
  for (const key of ['1', ' ', 'Shift', 'Enter', '?']) assert.equal(guessMessage(game.guess(key), state, key), null, key);
});

test('the finishing move reports the result instead of the letter', () => {
  const won = gameWith('kedi');
  let result;
  for (const letter of ['k', 'e', 'd', 'i']) result = won.guess(letter);
  assert.deepEqual(guessMessage(result, won.getState(), 'i'), { key: 'msgWon', params: { points: 40 }, tone: 'good' });
  assert.equal(guessMessage(won.guess('a'), won.getState(), 'a'), null);

  const lost = gameWith('kedi');
  for (const letter of ['a', 'b', 'c', 'ç', 'f']) lost.guess(letter);
  const last = lost.guess('g');
  assert.deepEqual(guessMessage(last, lost.getState(), 'g'), { key: 'msgLost', params: { word: 'KEDİ' }, tone: 'bad' });
});

test('hints name the revealed letter; no hint, no message', () => {
  const game = gameWith('ığdır');
  const result = game.hint();
  const message = hintMessage(result, game.getState());
  assert.equal(message.key, 'msgHint');
  assert.ok(['I', 'Ğ', 'D', 'R'].includes(message.params.letter), message.params.letter);
  assert.equal(hintMessage({ letter: null, finished: false }, game.getState()), null);
});

test('a hint that solves the word reports the win', () => {
  const game = gameWith('kedi');
  for (const letter of ['k', 'e', 'd']) game.guess(letter);
  const result = game.hint();
  assert.equal(result.finished, true);
  assert.deepEqual(hintMessage(result, game.getState()), { key: 'msgWon', params: { points: 35 }, tone: 'good' });
});

test('leaving a started round names its word; an untouched round just starts over', () => {
  const fresh = createRound({ word: 'izmir', lang: 'tr' });
  assert.deepEqual(roundStartMessage(fresh), { key: 'msgStart', params: {}, tone: 'info' });
  const started = guessLetter(fresh, 'z').round;
  assert.deepEqual(roundStartMessage(started), { key: 'msgSkipped', params: { word: 'İZMİR' }, tone: 'warn' });
  const done = ['i', 'm', 'r'].reduce((round, letter) => guessLetter(round, letter).round, started);
  assert.equal(roundStartMessage(done).key, 'msgStart');
});

test('the opening message asks for a letter, or counts lives in the demo', () => {
  assert.equal(openingMessage(createRound({ word: 'kedi', lang: 'tr' })).key, 'msgStart');
  assert.deepEqual(openingMessage(createDemoGame().getState().round), { key: 'msgContinue', params: { n: 3 }, tone: 'info' });
});

test('every message key exists in both languages', () => {
  const game = gameWith('kedi');
  const state = game.getState();
  const messages = [
    openingMessage(state.round),
    roundStartMessage(guessLetter(state.round, 'k').round),
    guessMessage(game.guess('k'), game.getState(), 'k'),
    guessMessage(game.guess('z'), game.getState(), 'z'),
    guessMessage(game.guess('z'), game.getState(), 'z'),
    guessMessage(game.guess('x'), game.getState(), 'x'),
    hintMessage(game.hint(), game.getState()),
    finishMessage(createRound({ word: 'kedi', lang: 'tr' }), 0),
    openingMessage(createDemoGame().getState().round),
  ];
  for (const message of messages) {
    assertKnown(message);
    assert.ok(Object.isFrozen(message) && Object.isFrozen(message.params), message.key);
  }
});
