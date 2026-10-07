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
 *
 * `topbar` variant (SKODA-308): the form of the header's "Subscribe to our stories" panel,
 * authored in the nav fragment. Visible label; the browser validates it, as the footer form.
 *
 * Every variant, once a valid submit is announced, drops the field and the button and shows the
 * message in their place (the source's sent form, `is-sent`).
 *
 * `card` variant (SKODA-823): the story-sidebar widget (.newsletter-subscribe-widget,
 * docs/ui-specs/newsletter.md §3). Adds an image header and validates in the block, so an
 * invalid e-mail or unchecked consent shows a visible, described error. Consent stays hidden
 * until the form is first focused, then slides open (as on the source). Extra keys:
 *   image          header picture
 *   heading        header heading (an authored line break is kept)
 *   error          invalid e-mail message
 *   consent-error  unchecked consent message
 */

const DEFAULTS = {
  label: 'Email address',
  placeholder: 'Enter your e-mail',
  button: 'Submit',
  message: 'Newsletter signup is not available yet',
  error: 'Please enter a valid e-mail address.',
  consentError: 'Please accept the terms before continuing.',
};

// the WHATWG `type=email` rule, so the check matches the browser's own
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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
 * Card header: authored picture + heading. Returns null when neither is authored.
 * @param {Object<string, Element>} cfg
 * @returns {Element|null}
 */
function buildHeader(cfg) {
  const picture = cfg.image?.querySelector('picture, img');
  const hasHeading = !!text(cfg.heading);
  if (!picture && !hasHeading) return null;
  // a div, not <header>: the global `header` rule (styles.css) sets the nav height
  const header = el('div', 'newsletter-stub-header');
  if (picture) header.append(picture);
  if (hasHeading) {
    const heading = el('h2', 'newsletter-stub-heading');
    moveInline(cfg.heading, heading);
    header.append(heading);
  }
  return header;
}

/**
 * Source reveal (jQuery slideDown, measured live): height 0 → full over 400ms with the
 * "swing" easing (0.5 - cos(πp)/2, i.e. easeInOutSine), clipped while it runs, no fade.
 * Vertical padding grows from 0 too, as slideDown does. Skipped without the Web Animations
 * API or under reduced motion (the block just appears).
 * @param {Element} target
 */
function slideDown(target) {
  if (!target?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { height } = target.getBoundingClientRect();
  const { boxSizing, paddingTop, paddingBottom } = window.getComputedStyle(target);
  const pad = parseFloat(paddingTop) + parseFloat(paddingBottom);
  const end = boxSizing === 'border-box' ? height : height - pad;
  target.style.overflow = 'hidden';
  target.animate({
    height: ['0px', `${end}px`],
    paddingTop: ['0px', paddingTop],
    paddingBottom: ['0px', paddingBottom],
  }, {
    duration: 400,
    easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
  }).addEventListener('finish', () => target.style.removeProperty('overflow'));
}

/**
 * Card validation: one visible error, described on the failing control, which takes focus.
 * @returns {() => boolean} validate, true when the form may "submit"
 */
function cardValidation(cfg, form, input, id) {
  form.setAttribute('novalidate', '');
  const error = el('p', 'newsletter-stub-error', { id: `${id}-error` });
  form.querySelector('.newsletter-stub-response').append(error);
  const checkbox = form.querySelector('.newsletter-stub-checkbox');
  const controls = [input, checkbox].filter(Boolean);

  const clear = () => {
    error.textContent = '';
    controls.forEach((c) => {
      c.removeAttribute('aria-invalid');
      c.removeAttribute('aria-describedby');
    });
  };
  const fail = (control, message) => {
    error.textContent = message;
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', error.id);
    control.focus?.();
    return false;
  };

  input.addEventListener('input', clear);
  checkbox?.addEventListener('change', clear);

  return () => {
    clear();
    // never leave the required consent hidden behind a failed submit
    form.classList.add('is-expanded');
    if (!EMAIL.test(input.value.trim())) return fail(input, text(cfg.error, DEFAULTS.error));
    if (checkbox && !checkbox.checked) {
      return fail(checkbox, text(cfg['consent-error'], DEFAULTS.consentError));
    }
    return true;
  };
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const cfg = readConfig(block);
  const isCard = block.classList.contains('card');
  instance += 1;
  const id = `newsletter-stub-${instance}`;

  // footer + topbar: native validation (required email + consent) gates the submit event;
  // card: validated in the block (see cardValidation)
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

  // the topbar and footer forms keep the browser's own validation (source: its tooltip on the
  // field / the consent box, nothing added to the form); the card validates in the block
  const validate = isCard ? cardValidation(cfg, form, input, id) : () => true;
  if (isCard) {
    // source slides the consent block open once the form is first used, then keeps it open
    form.addEventListener('focusin', () => {
      if (form.classList.contains('is-expanded')) return;
      form.classList.add('is-expanded');
      // the source slides consent + "Manage subscription" as one block
      form.querySelectorAll('.newsletter-stub-consent, .newsletter-stub-manage').forEach(slideDown);
    });
  }

  const message = text(cfg.message, DEFAULTS.message);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      status.textContent = '';
      return;
    }
    // source: a sent form drops its field and button and shows the message in their place
    // (SKODA-308); focus moves to the message so it isn't lost with the button. Focused, it is
    // read once as the focused text, so it leaves the live region first (not announced twice).
    status.removeAttribute('role');
    status.removeAttribute('aria-live');
    status.textContent = message;
    form.classList.add('is-sent');
    status.tabIndex = -1;
    status.focus?.({ preventScroll: true });
    block.dispatchEvent(new CustomEvent('newsletter:subscribe', {
      bubbles: true,
      detail: { email: input.value, list, language },
    }));
  });
  input.addEventListener('input', () => { status.textContent = ''; });

  const header = isCard ? buildHeader(cfg) : null;
  block.replaceChildren(...(header ? [header, form] : [form]));
}
