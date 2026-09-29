/*
 * Unit tests for the share-intent URL builder (SKODA-215).
 * Run: node --test scripts/share.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHARE_NETWORKS, shareUrl, sharePageData } from './share.js';

const page = {
  url: 'https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/',
  title: 'Škoda Epiq Will Win You Over in Just a Few Seconds',
  image: 'https://cdn.skoda-storyboard.com/2026/09/epiq.png',
};
const encUrl = 'https%3A%2F%2Fwww.skoda-storyboard.com%2Fen%2Femobility%2Fskoda-epiq-will-win-you-over-in-just-a-few-seconds%2F';
const encTitle = '%C5%A0koda+Epiq+Will+Win+You+Over+in+Just+a+Few+Seconds';

test('network set and order match the source (X, Pinterest, LinkedIn, Facebook, WhatsApp)', () => {
  assert.deepEqual(SHARE_NETWORKS.map((n) => n.id), ['x', 'pinterest', 'linkedin', 'facebook', 'whatsapp']);
});

test('intent URLs match the measured source hrefs, URL-encoded', () => {
  assert.equal(shareUrl('x', page), `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`);
  assert.equal(
    shareUrl('pinterest', page),
    `https://pinterest.com/pin/create/bookmarklet?url=${encUrl}&media=${encodeURIComponent(page.image)}&description=${encTitle}`,
  );
  assert.equal(
    shareUrl('linkedin', page),
    `https://linkedin.com/shareArticle?mini=true&url=${encUrl}&title=${encTitle}&summary=${encTitle}`,
  );
  assert.equal(shareUrl('whatsapp', page), `whatsapp://send?text=${encTitle}+-+${encUrl}`);
});

test('Facebook uses the app-less sharer.php fallback (no app_id)', () => {
  const href = shareUrl('facebook', page);
  assert.equal(href, `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`);
  assert.ok(!href.includes('app_id'));
});

test('empty optional fields are dropped; missing URL or unknown network returns ""', () => {
  assert.equal(
    shareUrl('pinterest', { url: page.url }),
    `https://pinterest.com/pin/create/bookmarklet?url=${encUrl}`,
  );
  assert.equal(shareUrl('whatsapp', { url: page.url }), `whatsapp://send?text=${encUrl}`);
  assert.equal(shareUrl('x', { title: 'no url' }), '');
  assert.equal(shareUrl('myspace', page), '');
  assert.equal(shareUrl('x'), '');
});

test('reserved characters in the title are encoded, not passed through', () => {
  const href = shareUrl('x', { url: 'https://example.com/a?b=1', title: 'A & B #1' });
  assert.equal(href, 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1&text=A+%26+B+%231');
});

const fakeDoc = ({
  canonical, ogTitle, ogImage, title = 'Doc title', href = 'https://x.test/p#frag',
}) => ({
  title,
  location: { href },
  querySelector(sel) {
    if (sel === 'link[rel="canonical"]') return canonical ? { href: canonical } : null;
    if (sel === 'meta[property="og:title"]') return ogTitle ? { content: ogTitle } : null;
    if (sel === 'meta[property="og:image"]') return ogImage ? { content: ogImage } : null;
    return null;
  },
});

test('sharePageData prefers canonical + og:title, and falls back to location (no hash) + title', () => {
  assert.deepEqual(
    sharePageData(fakeDoc({ canonical: page.url, ogTitle: page.title, ogImage: page.image })),
    page,
  );
  assert.deepEqual(sharePageData(fakeDoc({})), { url: 'https://x.test/p', title: 'Doc title', image: '' });
});
