/*
 * Newsletter subscribe stub (SKODA-305, UI-only for M1).
 * Renders the Media Room footer "Subscribe" form (email + consent + submit + manage link).
 * Submitting sends NOTHING: the mailguide ESP wiring is SKODA-904 (M2). A valid submit
 * announces the authored message in a live region and dispatches `newsletter:subscribe`
 * (bubbling, detail { email, list, language }) as the hand-off point for the real service.
 *
 * Authored as a key/value table; every string is authored so localized fragments can translate:
 *   label       accessible (visually hidden) label for the email field
 *   placeholder email placeholder
 *   button      submit text
 *   consent     consent text (may contain a link); omitted → no checkbox
 *   manage      "Manage subscription" link; omitted → no link
 *   message     announced on submit
 *   list        mailguide list id (kept as data for SKODA-904)
 *   language    mailguide language code (kept as data for SKODA-904)
 */

const DEFAULTS = {
  label: 'Email address',
  placeholder: 'Enter your e-mail',
  button: 'Submit',
  message: 'Thank you for your interest. Newsletter sign-up will be available soon.',
};

let instance = 0;

/**
 * Reads two-cell rows into a map of lower-cased key → value cell.
 * @param {Element} block
 * @returns {Object<string, Element>}
 */
function readConfig(block) {
  const cfg = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const key = keyCell?.textContent.trim().toLowerCase();
    if (key && valueCell) cfg[key] = valueCell;
  });
  return cfg;
}

const text = (cell, fallback = '') => cell?.textContent.trim() || fallback;

/**
 * Moves a cell's inline content into target, unwrapping a single authored paragraph.
 * @param {Element} cell
 * @param {Element} target
 */
function moveInline(cell, target) {
  const only = cell.children.length === 1 ? cell.firstElementChild : null;
  const source = only?.tagName === 'P' ? only : cell;
  target.append(...source.childNodes);
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const cfg = readConfig(block);
  instance += 1;
  const id = `newsletter-stub-${instance}`;

  // native validation (required email + consent) gates the submit event
  const form = el('form', 'newsletter-stub-form');
  const list = text(cfg.list);
  const language = text(cfg.language);
  if (list) form.dataset.list = list;
  if (language) form.dataset.language = language;

  // email + submit row
  const row = el('div', 'newsletter-stub-row');
  const label = el('label', 'newsletter-stub-label', { for: `${id}-email` });
  label.textContent = text(cfg.label, DEFAULTS.label);
  const input = el('input', 'newsletter-stub-email', {
    id: `${id}-email`,
    name: 'email',
    type: 'email',
    autocomplete: 'email',
    placeholder: text(cfg.placeholder, DEFAULTS.placeholder),
    required: '',
  });
  const button = el('button', 'newsletter-stub-submit', { type: 'submit' });
  button.textContent = text(cfg.button, DEFAULTS.button);
  row.append(label, input, button);

  // live region: always in the DOM so the announcement is reliable; empty until submit
  const response = el('div', 'newsletter-stub-response');
  const status = el('div', 'newsletter-stub-status', { role: 'status', 'aria-live': 'polite' });
  response.append(status);

  form.append(row, response);

  if (cfg.consent) {
    const consent = el('div', 'newsletter-stub-consent');
    const checkbox = el('input', 'newsletter-stub-checkbox', {
      id: `${id}-consent`,
      name: 'terms',
      type: 'checkbox',
      value: 'true',
      required: '',
    });
    const consentLabel = el('label', '', { for: `${id}-consent` });
    moveInline(cfg.consent, consentLabel);
    consent.append(checkbox, consentLabel);
    form.append(consent);
  }

  const manageLink = cfg.manage?.querySelector('a');
  if (manageLink) {
    const manage = el('div', 'newsletter-stub-manage');
    manageLink.removeAttribute('class');
    manage.append(manageLink);
    form.append(manage);
  }

  const message = text(cfg.message, DEFAULTS.message);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = message;
    block.dispatchEvent(new CustomEvent('newsletter:subscribe', {
      bubbles: true,
      detail: { email: input.value, list, language },
    }));
  });
  input.addEventListener('input', () => { status.textContent = ''; });

  block.replaceChildren(form);
}
