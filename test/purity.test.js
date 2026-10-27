// Logic modules must load without a browser: no window, document or localStorage at import time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

const LOGIC_MODULES = ['alphabet', 'demo', 'game', 'picker', 'rng', 'round', 'stats', 'storage', 'words'];
const ENTRY_POINT = 'main.js';
const BROWSER_GLOBALS = ['window', 'document', 'localStorage'];

// Every src module except the entry point, which is the one file allowed to start the page.
const MODULES = readdirSync(new URL('../src/', import.meta.url))
  .filter((file) => file.endsWith('.js') && file !== ENTRY_POINT)
  .map((file) => file.slice(0, -'.js'.length))
  .sort();

test('the check covers every logic module and every UI helper', () => {
  for (const name of LOGIC_MODULES) assert.ok(MODULES.includes(name), name);
  assert.ok(MODULES.length > LOGIC_MODULES.length, MODULES.join(', '));
});

test('every src module imports without touching browser globals', async () => {
  const originals = new Map(BROWSER_GLOBALS.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const touched = [];
  for (const name of BROWSER_GLOBALS) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        touched.push(name);
        throw new ReferenceError(`${name} is not available at import time`);
      },
    });
  }
  try {
    for (const name of MODULES) await import(`../src/${name}.js`);
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
  assert.deepEqual(touched, []);
});
