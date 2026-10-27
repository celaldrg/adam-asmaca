/**
 * DOM helpers shared by the UI modules. Text always goes in through
 * textContent or text nodes, never through HTML parsing.
 */

import { translate } from './i18n.js';

/**
 * Returns the element with the given id.
 * @param {string} id
 * @returns {HTMLElement}
 * @throws {Error} When the page markup lacks the element.
 */
export function byId(id) {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Missing element #${id}`);
  return element;
}

/**
 * Creates an element with attributes and children.
 * @param {string} tag
 * @param {Record<string, string>} [attrs] Attribute values, set with setAttribute.
 * @param {(Node|string)[]} [children] Child nodes; strings become text nodes.
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

/**
 * Translates the static strings of the page: text of [data-i18n] elements,
 * aria-label of [data-i18n-label] and title of [data-i18n-title] elements.
 * @param {ParentNode} root
 * @param {'en'|'tr'} lang Interface language.
 */
export function applyTranslations(root, lang) {
  for (const element of root.querySelectorAll('[data-i18n]')) {
    element.textContent = translate(lang, element.dataset.i18n);
  }
  for (const element of root.querySelectorAll('[data-i18n-label]')) {
    element.setAttribute('aria-label', translate(lang, element.dataset.i18nLabel));
  }
  for (const element of root.querySelectorAll('[data-i18n-title]')) {
    element.title = translate(lang, element.dataset.i18nTitle);
  }
}

/**
 * Tells whether the system asks for less motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
