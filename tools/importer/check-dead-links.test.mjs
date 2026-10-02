import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHrefs, metaContent, classify } from './check-dead-links.mjs';

const BASE = 'https://main--demo--skoda-storyboard.aem.page';

test('extractHrefs reads anchor hrefs and decodes &amp;', () => {
  const html = '<a class="x" href="/en/a?x=1&amp;y=2">A</a><link href="/styles.css"><a href="">E</a><a id="b" href="https://x.com/">B</a>';
  assert.deepEqual(extractHrefs(html), ['/en/a?x=1&y=2', 'https://x.com/']);
});

test('metaContent finds the nav/footer metadata', () => {
  const html = '<meta name="nav" content="/media-room/nav"><meta name="description" content="d">';
  assert.equal(metaContent(html, 'nav'), '/media-room/nav');
  assert.equal(metaContent(html, 'footer'), null);
});

test('classify splits live, in-site and ignored links', () => {
  assert.deepEqual(classify('https://www.skoda-storyboard.com/en/contacts/', BASE), { kind: 'live' });
  assert.deepEqual(classify('/en/tag/model/elroq?x=1#y', BASE), { kind: 'site', path: '/en/tag/model/elroq' });
  assert.deepEqual(classify(`${BASE}/en/news`, BASE), { kind: 'site', path: '/en/news' });
  ['https://cdn.skoda-storyboard.com/a.jpg', 'https://youtube.com/', '#x', 'mailto:a@b.c'].forEach((h) => {
    assert.equal(classify(h, BASE), null, h);
  });
});
