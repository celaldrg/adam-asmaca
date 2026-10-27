// Page markup: required meta tags, local files only, readable text sizes and translations for every UI string key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { STRINGS } from '../src/i18n.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const css = read('style.css');

test('index.html has the required head tags', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<title>Adam Asmaca<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta property="og:title" content="Adam Asmaca">/);
  assert.match(html, /<meta property="og:description" content="[^"]+">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/celaldrg\.github\.io\/adam-asmaca\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/celaldrg\.github\.io\/adam-asmaca\/docs\/screenshot\.png">/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(html, /<script type="module" src="src\/main\.js"><\/script>/);
});

test('scripts and styles load from the repository only', () => {
  for (const [, url] of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g)) {
    assert.ok(!/^(?:https?:)?\/\//.test(url), url);
  }
  assert.doesNotMatch(css, /@import|url\(\s*["']?(?:https?:)?\/\//);
});

test('no text is set smaller than 0.7rem (about 11 px), so small labels stay readable on phones', () => {
  const sizes = [...css.matchAll(/font-size:\s*([\d.]+)rem/g)].map(([, size]) => Number(size));
  assert.ok(sizes.length >= 10, `${sizes.length} sizes`);
  for (const size of sizes) assert.ok(size >= 0.7, `${size}rem`);
});

test('every translated element of the page has a string in both languages', () => {
  const keys = [...html.matchAll(/data-i18n(?:-label|-title)?="([^"]+)"/g)].map(([, key]) => key);
  assert.ok(keys.length >= 20, `${keys.length} keys`);
  for (const key of keys) {
    assert.ok(Object.hasOwn(STRINGS.en, key) && Object.hasOwn(STRINGS.tr, key), key);
  }
});

test('every string key the UI modules translate exists in both languages', () => {
  const keys = new Set(['keyInWord', 'keyNotInWord']);
  for (const file of readdirSync(new URL('../src/', import.meta.url))) {
    const source = read(`src/${file}`);
    for (const [, args] of source.matchAll(/translate\(([^)]*)\)/g)) {
      for (const [, key] of args.matchAll(/'([a-z][A-Za-z]{3,})'/g)) keys.add(key);
    }
  }
  assert.ok(keys.size >= 10, `${keys.size} keys`);
  for (const key of keys) {
    assert.ok(Object.hasOwn(STRINGS.en, key) && Object.hasOwn(STRINGS.tr, key), key);
  }
});
