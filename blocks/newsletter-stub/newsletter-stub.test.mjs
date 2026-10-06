/*
 * Newsletter stub tests (SKODA-305, UI-only Subscribe form).
 * Run: node --test blocks/newsletter-stub/newsletter-stub.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, parseHTML, Event } from '../../test/mini-dom.mjs';

installDom();
const { default: decorate } = await import('./newsletter-stub.js');

const AUTHORED = `
<div class="newsletter-stub">
  <div><div>label</div><div>Email address</div></div>
  <div><div>placeholder</div><div>Enter your e-mail</div></div>
  <div><div>button</div><div>Submit</div></div>
  <div><div>consent</div><div><p>Hereby I give my <a href="/en/documents/consent/">consent to the processing</a> of my personal data.</p></div></div>
  <div><div>manage</div><div><p><a href="/en/newsletter-settings/">Manage subscription</a></p></div></div>
  <div><div>message</div><div>Newsletter sign-up will be available soon.</div></div>
  <div><div>list</div><div>339</div></div>
  <div><div>language</div><div>en_GB</div></div>
</div>`;

function build(html = AUTHORED) {
  const block = parseHTML(html).firstElementChild;
  decorate(block);
  return block;
}

test('renders a real form: labelled email, submit, consent, manage link, live region', () => {
  const block = build();
  const form = block.querySelector('form');
  assert.equal(block.children.length, 1);
  assert.equal(form.dataset.list, '339');
  assert.equal(form.dataset.language, 'en_GB');

  const input = form.querySelector('input[type=email]');
  assert.equal(input.getAttribute('name'), 'email');
  assert.equal(input.getAttribute('placeholder'), 'Enter your e-mail');
  assert.ok(input.hasAttribute('required'));
  const label = form.querySelector('.newsletter-stub-label');
  assert.equal(label.getAttribute('for'), input.id);
  assert.equal(label.textContent, 'Email address');

  const button = form.querySelector('button');
  assert.equal(button.getAttribute('type'), 'submit');
  assert.equal(button.textContent, 'Submit');

  const checkbox = form.querySelector('input[type=checkbox]');
  assert.ok(checkbox.hasAttribute('required'));
  const consentLabel = form.querySelector('.newsletter-stub-consent label');
  assert.equal(consentLabel.getAttribute('for'), checkbox.id);
  assert.equal(consentLabel.querySelector('a').getAttribute('href'), '/en/documents/consent/');
  assert.equal(consentLabel.querySelector('p'), null, 'single authored <p> is unwrapped into the label');

  assert.equal(form.querySelector('.newsletter-stub-manage a').textContent, 'Manage subscription');

  const status = form.querySelector('[role=status]');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.textContent, '');
});

test('submit sends nothing: default prevented, message announced, hand-off event fired', () => {
  const block = build();
  const form = block.querySelector('form');
  form.querySelector('input[type=email]').value = 'journalist@example.com';
  let detail = null;
  block.addEventListener('newsletter:subscribe', (e) => { detail = e.detail; });

  const submit = new Event('submit', { bubbles: true });
  form.dispatchEvent(submit);

  assert.equal(submit.defaultPrevented, true);
  assert.equal(form.querySelector('[role=status]').textContent, 'Newsletter sign-up will be available soon.');
  assert.deepEqual(detail, { email: 'journalist@example.com', list: '339', language: 'en_GB' });
  assert.ok(form.classList.contains('is-sent'), 'source: the field and the button give way to the message');

  form.querySelector('input[type=email]').dispatchEvent(new Event('input'));
  assert.equal(form.querySelector('[role=status]').textContent, '', 'editing the email clears the message');
});

test('ids are unique per instance', () => {
  const a = build().querySelector('input[type=email]').id;
  const b = build().querySelector('input[type=email]').id;
  assert.notEqual(a, b);
});

test('defaults cover an empty table; optional consent / manage are omitted', () => {
  const block = build('<div class="newsletter-stub"></div>');
  const form = block.querySelector('form');
  assert.equal(form.querySelector('input[type=email]').getAttribute('placeholder'), 'Enter your e-mail');
  assert.equal(form.querySelector('button').textContent, 'Submit');
  assert.equal(form.querySelector('.newsletter-stub-label').textContent, 'Email address');
  assert.equal(form.querySelector('.newsletter-stub-consent'), null);
  assert.equal(form.querySelector('.newsletter-stub-manage'), null);
  assert.equal(form.dataset.list, undefined);
});

// ---- card variant (SKODA-823, story sidebar) ----

const CARD = `
<div class="newsletter-stub card">
  <div><div>image</div><div><picture><img src="./media_1.webp" alt=""></picture></div></div>
  <div><div>heading</div><div>Be the first<br>to get the latest stories</div></div>
  <div><div>placeholder</div><div>Enter your e-mail</div></div>
  <div><div>button</div><div>Subscribe now!</div></div>
  <div><div>consent</div><div>Hereby I give my consent to the processing of my personal data.</div></div>
  <div><div>list</div><div>389</div></div>
  <div><div>language</div><div>en_GB</div></div>
</div>`;

function submit(form) {
  const event = new Event('submit', { bubbles: true });
  form.dispatchEvent(event);
  return event;
}

test('card: image header with the authored heading, before the form', () => {
  const block = build(CARD);
  const [header, form] = block.children;
  assert.equal(header.className, 'newsletter-stub-header');
  assert.equal(header.tagName, 'DIV', 'not <header>: the global header rule would size it');
  assert.ok(header.querySelector('picture img'));
  const heading = header.querySelector('h2');
  assert.equal(heading.className, 'newsletter-stub-heading');
  assert.ok(heading.querySelector('br'), 'authored line break is kept');
  assert.equal(heading.textContent, 'Be the firstto get the latest stories');
  assert.equal(form.tagName, 'FORM');
  assert.ok(form.hasAttribute('novalidate'), 'card validates in the block');
});

test('footer (no variant) ignores image/heading rows and keeps native validation', () => {
  const block = build(CARD.replace('newsletter-stub card', 'newsletter-stub'));
  assert.equal(block.children.length, 1);
  assert.equal(block.querySelector('.newsletter-stub-header'), null);
  assert.equal(block.querySelector('form').hasAttribute('novalidate'), false);
  assert.equal(block.querySelector('.newsletter-stub-error'), null);
});

test('card: consent opens on first focus and stays open', () => {
  const form = build(CARD).querySelector('form');
  assert.equal(form.classList.contains('is-expanded'), false);
  form.dispatchEvent(new Event('focusin', { bubbles: true }));
  assert.equal(form.classList.contains('is-expanded'), true);
});

test('card: consent + manage slide open like the source (400ms swing), once, and not under reduced motion', () => {
  const styles = {
    'newsletter-stub-consent': { boxSizing: 'content-box', paddingTop: '0px', paddingBottom: '0px' },
    'newsletter-stub-manage': { boxSizing: 'border-box', paddingTop: '8px', paddingBottom: '0px' },
  };
  const run = (reduce) => {
    globalThis.window = {
      matchMedia: () => ({ matches: reduce }),
      getComputedStyle: (node) => styles[node.className],
    };
    const form = build(CARD.replace('</div>\n</div>', `</div>
  <div><div>manage</div><div><p><a href="https://www.skoda-storyboard.com/en/newsletter-settings/">Manage subscription</a></p></div></div>
</div>`)).querySelector('form');
    const calls = [];
    const parts = [
      [form.querySelector('.newsletter-stub-consent'), 108],
      [form.querySelector('.newsletter-stub-manage'), 26],
    ];
    parts.forEach(([node, height]) => {
      node.style = { removeProperty: (p) => { delete node.style[p]; } };
      node.getBoundingClientRect = () => ({ height });
      node.animate = (keyframes, options) => {
        calls.push({ node: node.className, keyframes, options });
        return { addEventListener: (type, fn) => type === 'finish' && fn() };
      };
    });
    form.dispatchEvent(new Event('focusin', { bubbles: true }));
    form.dispatchEvent(new Event('focusin', { bubbles: true }));
    return { calls, parts };
  };
  try {
    const { calls, parts } = run(false);
    assert.equal(calls.length, 2, 'consent and manage open together, once');
    assert.deepEqual(calls[0].keyframes, {
      height: ['0px', '108px'], paddingTop: ['0px', '0px'], paddingBottom: ['0px', '0px'],
    });
    assert.deepEqual(calls[1].keyframes, {
      height: ['0px', '26px'], paddingTop: ['0px', '8px'], paddingBottom: ['0px', '0px'],
    }, 'border-box: the full height, padding grows from 0');
    calls.forEach(({ options }) => {
      assert.equal(options.duration, 400);
      assert.equal(options.easing, 'cubic-bezier(0.37, 0, 0.63, 1)');
    });
    parts.forEach(([node]) => assert.equal(node.style.overflow, undefined, 'clip removed on finish'));
    assert.equal(run(true).calls.length, 0, 'reduced motion: consent just appears');
  } finally {
    delete globalThis.window;
  }
});

test('card: invalid e-mail shows a described error, no status and no hand-off', () => {
  const block = build(CARD);
  const form = block.querySelector('form');
  const input = form.querySelector('input[type=email]');
  const error = form.querySelector('.newsletter-stub-error');
  let fired = false;
  block.addEventListener('newsletter:subscribe', () => { fired = true; });

  ['', 'abc', 'a@', 'a b@example.com'].forEach((value) => {
    input.value = value;
    assert.equal(submit(form).defaultPrevented, true);
    assert.equal(error.textContent, 'Please enter a valid e-mail address.');
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(input.getAttribute('aria-describedby'), error.id);
    assert.equal(form.querySelector('[role=status]').textContent, '');
  });
  assert.equal(fired, false);
  assert.equal(form.classList.contains('is-expanded'), true, 'required consent is never left hidden');

  input.dispatchEvent(new Event('input'));
  assert.equal(error.textContent, '', 'editing clears the error');
  assert.equal(input.getAttribute('aria-invalid'), null);
});

test('card: unchecked consent is reported on the checkbox', () => {
  const form = build(CARD).querySelector('form');
  const input = form.querySelector('input[type=email]');
  const checkbox = form.querySelector('input[type=checkbox]');
  input.value = 'journalist@example.com';
  submit(form);
  assert.equal(form.querySelector('.newsletter-stub-error').textContent, 'Please accept the terms before continuing.');
  assert.equal(checkbox.getAttribute('aria-invalid'), 'true');
  assert.equal(input.getAttribute('aria-invalid'), null);
  assert.equal(form.querySelector('[role=status]').textContent, '');
});

test('card: valid input announces "not available yet" and sends nothing', () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('the M1 stub must not send anything'); };
  try {
    const block = build(CARD);
    const form = block.querySelector('form');
    form.querySelector('input[type=email]').value = 'journalist@example.com';
    form.querySelector('input[type=checkbox]').checked = true;
    let detail = null;
    block.addEventListener('newsletter:subscribe', (e) => { detail = e.detail; });

    assert.equal(submit(form).defaultPrevented, true);
    assert.equal(form.querySelector('[role=status]').textContent, 'Newsletter signup is not available yet');
    assert.equal(form.querySelector('.newsletter-stub-error').textContent, '');
    assert.deepEqual(detail, { email: 'journalist@example.com', list: '389', language: 'en_GB' });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('card: error messages are authorable', () => {
  const form = build(CARD.replace('</div>\n</div>', `</div>
  <div><div>error</div><div>Zadejte platný e-mail.</div></div>
  <div><div>Consent-Error</div><div>Potvrďte souhlas.</div></div>
</div>`)).querySelector('form');
  submit(form);
  assert.equal(form.querySelector('.newsletter-stub-error').textContent, 'Zadejte platný e-mail.');
  form.querySelector('input[type=email]').value = 'novinar@example.cz';
  submit(form);
  assert.equal(form.querySelector('.newsletter-stub-error').textContent, 'Potvrďte souhlas.');
});

// ---- topbar variant (SKODA-308, the header's newsletter panel) ----

const TOPBAR = `
<div class="newsletter-stub topbar">
  <div><div>label</div><div>Subscribe to our stories, so you don't miss out on anything:</div></div>
  <div><div>placeholder</div><div>Enter your email address</div></div>
  <div><div>button</div><div>Subscribe</div></div>
  <div><div>consent</div><div>Hereby I give my <a href="/en/documents/consent/">consent to the processing</a> of my personal data.</div></div>
  <div><div>manage</div><div><a href="/en/newsletter-settings/">Manage subscription</a></div></div>
  <div><div>message</div><div>Newsletter signup is not available yet</div></div>
</div>`;

test('topbar: the authored label names the field; consent is shown from the start (no slide)', () => {
  const block = build(TOPBAR);
  const form = block.querySelector('form');
  const input = form.querySelector('input[type=email]');
  const label = form.querySelector('.newsletter-stub-label');
  assert.equal(label.getAttribute('for'), input.id);
  assert.equal(label.textContent, "Subscribe to our stories, so you don't miss out on anything:");
  assert.equal(input.getAttribute('placeholder'), 'Enter your email address');
  assert.equal(block.querySelector('.newsletter-stub-header'), null, 'no card header');
  form.dispatchEvent(new Event('focusin', { bubbles: true }));
  assert.equal(form.classList.contains('is-expanded'), false, 'no first-focus reveal (card only)');
  assert.ok(form.querySelector('.newsletter-stub-consent a'));
  assert.equal(form.querySelector('.newsletter-stub-manage a').textContent, 'Manage subscription');
});

test('topbar: the browser validates it (source tooltips, no error box); a valid submit sends nothing', () => {
  const block = build(TOPBAR);
  const form = block.querySelector('form');
  const input = form.querySelector('input[type=email]');
  assert.equal(form.hasAttribute('novalidate'), false, 'native validation, as the source');
  assert.ok(input.hasAttribute('required'));
  assert.ok(form.querySelector('input[type=checkbox]').hasAttribute('required'), 'consent required natively');
  assert.equal(form.querySelector('.newsletter-stub-error'), null, 'no in-form error box');
  let detail = null;
  block.addEventListener('newsletter:subscribe', (e) => { detail = e.detail; });

  // the browser only fires submit for a valid form
  input.value = 'journalist@example.com';
  form.querySelector('input[type=checkbox]').checked = true;
  assert.equal(submit(form).defaultPrevented, true);
  assert.equal(form.querySelector('[role=status]').textContent, 'Newsletter signup is not available yet');
  assert.ok(form.classList.contains('is-sent'), 'field + button give way to the message');
  assert.equal(form.querySelector('[role=status]').tabIndex, -1, 'focusable, so focus moves to it');
  assert.equal(detail.email, 'journalist@example.com');
});

test('keys are case-insensitive and malformed rows are skipped', () => {
  const block = build(`
<div class="newsletter-stub">
  <div><div>Button</div><div>Odebírat</div></div>
  <div><div>orphan</div></div>
</div>`);
  assert.equal(block.querySelector('button').textContent, 'Odebírat');
});
