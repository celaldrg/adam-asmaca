// The localStorage helper must never throw.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/storage.js';

/** In-memory stand-in for localStorage. */
function memoryBackend() {
  const items = new Map();
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
}

test('values round-trip as JSON under a prefixed key', () => {
  const backend = memoryBackend();
  const storage = createStorage(() => backend);
  assert.equal(storage.set('stats', { score: 5, streak: 1 }), true);
  assert.equal(storage.set('lang', 'tr'), true);
  assert.deepEqual(storage.get('stats', null), { score: 5, streak: 1 });
  assert.equal(storage.get('lang', 'en'), 'tr');
  assert.deepEqual([...backend.items.keys()].sort(), ['adam-asmaca:lang', 'adam-asmaca:stats']);
});

test('missing keys and corrupt data give the fallback', () => {
  const backend = memoryBackend();
  const storage = createStorage(() => backend);
  assert.equal(storage.get('lang', 'en'), 'en');
  backend.setItem('adam-asmaca:lang', '{not json');
  assert.equal(storage.get('lang', 'en'), 'en');
});

test('blocked, failing or missing storage never throws', () => {
  const backends = [
    () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
    () => ({
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    }),
    () => undefined,
  ];
  for (const getBackend of backends) {
    const storage = createStorage(getBackend);
    assert.equal(storage.get('x', 1), 1);
    assert.equal(storage.set('x', 2), false);
  }
});

test('the shared helper looks up localStorage lazily and survives a throwing getter', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let reads = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      reads += 1;
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });
  try {
    const { storage } = await import('../src/storage.js?lazy');
    assert.equal(reads, 0);
    assert.equal(storage.get('lang', 'en'), 'en');
    assert.equal(storage.set('lang', 'tr'), false);
    assert.equal(reads, 2);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
