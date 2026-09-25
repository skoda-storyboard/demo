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

test('keys are case-insensitive and malformed rows are skipped', () => {
  const block = build(`
<div class="newsletter-stub">
  <div><div>Button</div><div>Odebírat</div></div>
  <div><div>orphan</div></div>
</div>`);
  assert.equal(block.querySelector('button').textContent, 'Odebírat');
});
