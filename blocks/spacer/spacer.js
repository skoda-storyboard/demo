/*
 * Spacer: an authored vertical gap, the source's spacer widget (`skoda-offset`,
 * `padding-top: 1em` at the widget's 24px, shown from 720px), or with `line` a blank editor
 * line (shown at every width). One cell, the height in px (`24px`); a missing or malformed
 * value leaves the block empty, so it takes no space. Decorative only: hidden from assistive
 * tech.
 */

const HEIGHT = /^(\d{1,3})(?:px)?$/;

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const value = block.textContent.trim().toLowerCase();
  block.replaceChildren();
  block.setAttribute('aria-hidden', 'true');
  const match = HEIGHT.exec(value);
  if (match) block.style.setProperty('--spacer-height', `${Number(match[1])}px`);
}
