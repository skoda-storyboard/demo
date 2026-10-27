/*
 * person-card.js — the company pages' person card (SKODA-810a), shared by the
 * `contact-directory` and `exec-bio` blocks. Lives in /scripts/ because it is cross-block
 * shared code (AGENTS.md).
 *
 * A card is one authored cell, kept as the source writes it: the name and title (bold,
 * one paragraph; the name is its first line, 24px on the source), the portrait (a
 * paragraph holding only a picture), then the contact or link lines. A picture that starts
 * a text paragraph and ends its line (`<picture><br>e: …`, Contacts) is a portrait too and
 * gets a paragraph of its own; any other picture inside a text line is that line's icon
 * (the source's LinkedIn mark, 25px, left of the link). Web links open in a new tab, as
 * most of the source's do; mail and phone links stay in it. A phone the source writes as
 * text (`t: +420 730 863 027`) becomes a `tel:` link (SKODA-810: the source's a11y gap).
 */

const NEW_TAB = /^https?:$/;

/** Whether a paragraph holds only pictures (the portrait), no text. */
const isPictureOnly = (p) => !!p.querySelector('picture, img') && !p.textContent.trim();

const isBlank = (node) => node.nodeType === 3 && !node.textContent.trim();

// a phone line: `t:` then the number (digits, spaces, an optional leading +)
const PHONE = /(\bt:[\s\u00a0]*)(\+?\d[\d\s\u00a0]{5,}\d)/;

/**
 * Link the text phone numbers under `root` (`t: +420 730 863 027` → `tel:+420730863027`).
 * Numbers already inside a link are left alone.
 * @param {Element} root
 */
export function linkPhones(root) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const hits = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement.closest('a') && PHONE.test(node.nodeValue)) hits.push(node);
  }
  hits.forEach((node) => {
    const match = PHONE.exec(node.nodeValue);
    const start = match.index + match[1].length;
    const number = node.splitText(start);
    number.splitText(match[2].length);
    const a = doc.createElement('a');
    a.href = `tel:${match[2].replace(/[\s\u00a0]/g, '')}`;
    number.replaceWith(a);
    a.append(number);
  });
}

/**
 * A paragraph that opens with a picture on a line of its own (`<picture><br>text`): the
 * picture moves to a paragraph before it, the break goes. Returns that new paragraph.
 * @param {Element} p
 * @returns {Element|null}
 */
function splitLeadingPicture(p) {
  const nodes = [...p.childNodes].filter((n) => !isBlank(n));
  const [first, second] = nodes;
  const pic = first?.matches?.('picture, img') ? first : null;
  if (!pic || !second?.matches?.('br')) return null;
  const own = p.ownerDocument.createElement('p');
  own.append(pic);
  second.remove();
  p.before(own);
  return own;
}

/**
 * Wrap the paragraph's first line (everything before its first `<br>`) in `span.{cls}`,
 * splitting the bold run it may share with the title lines.
 * @param {Element} p
 * @param {string} cls
 */
function wrapFirstLine(p, cls) {
  const br = p.querySelector('br');
  const range = p.ownerDocument.createRange();
  range.setStart(p, 0);
  if (br) range.setEndBefore(br);
  else range.setEnd(p, p.childNodes.length);
  if (!range.toString().trim()) return;
  const span = p.ownerDocument.createElement('span');
  span.className = cls;
  span.append(range.extractContents());
  p.prepend(span);
  // the split leaves an empty bold run where the line was cut
  p.querySelectorAll('strong, b').forEach((el) => { if (!el.childNodes.length) el.remove(); });
}

/**
 * Web links under `root` open in a new tab (noopener); mail, phone and in-page links stay.
 * @param {Element} root
 */
export function decorateCardLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    let protocol = '';
    try {
      ({ protocol } = new URL(a.getAttribute('href'), window.location.href));
    } catch {
      return;
    }
    if (!NEW_TAB.test(protocol)) return;
    a.target = '_blank';
    const rel = new Set((a.rel || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    a.rel = [...rel].join(' ');
  });
}

/**
 * Decorate one card in place.
 * @param {Element} card the authored cell (or the element its content moved to)
 * @param {string} prefix the block's class prefix (`contact-directory`, `exec-bio`)
 * @returns {{ portrait: Element|undefined, identity: Element|undefined }}
 */
export default function decoratePersonCard(card, prefix) {
  card.classList.add(`${prefix}-card`);
  card.querySelectorAll(':scope > p').forEach(splitLeadingPicture);
  const paragraphs = [...card.querySelectorAll(':scope > p')];
  const portrait = paragraphs.find(isPictureOnly);
  portrait?.classList.add(`${prefix}-portrait`);
  const identity = paragraphs.find((p) => p !== portrait && p.querySelector('strong, b'));
  if (identity) {
    identity.classList.add(`${prefix}-identity`);
    wrapFirstLine(identity, `${prefix}-name`);
  }
  paragraphs.filter((p) => p !== portrait).forEach((p) => {
    p.querySelectorAll('picture').forEach((pic) => {
      pic.classList.add(`${prefix}-icon`);
      // an icon beside its link's own text ("LinkedIn") is decorative: its alt would repeat
      // the link (Lighthouse image-redundant-alt), so assistive tech skips it
      const img = pic.querySelector('img');
      if (img && p.textContent.trim()) img.alt = '';
    });
  });
  linkPhones(card);
  decorateCardLinks(card);
  return { portrait, identity };
}
