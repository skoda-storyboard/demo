import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const testWindow = new JSDOM('', { url: 'https://example.com/en/story' }).window;
globalThis.window = testWindow;
globalThis.document = testWindow.document;
globalThis.Node = testWindow.Node;
const { default: decorate, coverSources, COVER_BANDS } = await import('./hero-image.js');

function block(variant = '', rows = `
  <div><div><picture><img src="/hero.png" alt="Epiq" width="1920" height="1080"></picture></div></div>
  <div><div><h1>Epiq title</h1></div></div>
  <div><div><p>The perex.</p></div></div>
  <div><div><p class="hero-image-meta"><time datetime="2026-09-15">15. 9. 2026</time><a href="/en/category/emobility/">eMobility</a></p></div></div>
`) {
  const { window } = new JSDOM(`<div class="hero-image block ${variant}">${rows}</div>`, {
    url: 'https://example.com/en/story',
  });
  globalThis.document = window.document;
  globalThis.Node = window.Node;
  globalThis.window = window;
  return window.document.querySelector('.hero-image');
}

test('story separates heading, image and caption; date and category remain together', () => {
  const hero = block();
  const img = hero.querySelector('img');
  decorate(hero);
  assert.deepEqual([...hero.children].map((el) => el.className), [
    'hero-image-content', 'hero-image-media', 'hero-image-caption',
  ]);
  assert.equal(hero.querySelector('.hero-image-content h1').textContent, 'Epiq title');
  assert.equal(hero.querySelector('.hero-image-media img'), img, 'keep existing picture editable');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(img.getAttribute('loading'), 'eager');
  assert.equal(img.getAttribute('width'), '1920');
  assert.deepEqual([...hero.querySelector('.hero-image-caption').children]
    .map((el) => el.className), ['hero-image-perex', 'hero-image-meta']);
  const meta = hero.querySelector('.hero-image-meta');
  assert.equal(meta.querySelector('time').getAttribute('datetime'), '2026-09-15');
  assert.equal(meta.querySelector('a').getAttribute('href'), '/en/category/emobility/');
});

test('story accepts missing heading and date-only or category-only caption', () => {
  const hero = block('', `
    <div><div><picture><img src="/hero.png" alt=""></picture></div></div>
    <div><div><p class="hero-image-meta"><time datetime="2026-09-15">15. 9. 2026</time></p></div></div>
  `);
  decorate(hero);
  assert.deepEqual([...hero.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-caption',
  ]);
  assert.equal(hero.querySelector('.hero-image-meta time').textContent, '15. 9. 2026');

  const category = block('', `
    <div><div><h1>Title</h1></div></div>
    <div><div><p><a href="/en/category/">Category</a></p></div></div>
  `);
  decorate(category);
  assert.equal(category.querySelector('.hero-image-caption .hero-image-meta a').textContent, 'Category');
});

test('story normalizes DA-stripped date markup without duplicating the date or link', () => {
  const hero = block('', `
    <div><div><h1>Title</h1></div></div>
    <div><div><p>15. 9. 2026 <a href="/en/category/">Category</a></p></div></div>
  `);
  decorate(hero);
  const meta = hero.querySelector('.hero-image-meta');
  assert.equal(meta.querySelector('.hero-image-date').textContent, '15. 9. 2026');
  assert.equal(meta.querySelector('a').getAttribute('href'), '/en/category/');
  assert.equal(meta.textContent, '15. 9. 2026Category');
});

test('overlay keeps one content layer after the media and marks the perex', () => {
  const overlay = block('overlay');
  decorate(overlay);
  assert.deepEqual([...overlay.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-content',
  ]);
  assert.equal(overlay.querySelector('.hero-image-content h1').textContent, 'Epiq title');
  assert.equal(overlay.querySelector('.hero-image-perex').textContent, 'The perex.');

  // a template's own classes win: the series badge and the model chip stay as they are
  const series = block('overlay', `
    <div><div><picture><img src="/hero.png" alt=""></picture></div></div>
    <div><div><p class="hero-image-badge">Series</p><h1>130 years</h1><p>Standfirst</p></div></div>
  `);
  decorate(series);
  assert.deepEqual([...series.querySelectorAll('.hero-image-content p')].map((p) => p.className), [
    'hero-image-badge', 'hero-image-perex',
  ]);
});

test('archive renders the band and turns the h1 lines into label chips', () => {
  const archive = block('archive', `
    <div><div><picture><img src="/banner.jpg" alt="" width="1920" height="369"></picture></div></div>
    <div><div><h1>Models<br>Peaq</h1></div></div>
  `);
  decorate(archive);
  assert.deepEqual([...archive.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-content',
  ]);
  const img = archive.querySelector('.hero-image-media img');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(img.getAttribute('loading'), 'eager');
  const h1 = archive.querySelector('.hero-image-content h1');
  assert.deepEqual([...h1.querySelectorAll('.hero-image-label')].map((l) => l.textContent), ['Models', 'Peaq']);
  assert.equal(h1.textContent, 'Models Peaq', 'the accessible name keeps a space between labels');
  assert.equal(h1.querySelector('br'), null);
});

test('archive link lines become link chips; the accessible name keeps the space', () => {
  const archive = block('archive', `
    <div><div><picture><img src="/banner.jpg" alt=""></picture></div></div>
    <div><div><h1><a href="/en/category/lifestyle">Lifestyle</a><br><a href="/en/category/lifestyle/people">People</a></h1></div></div>
  `);
  decorate(archive);
  const h1 = archive.querySelector('h1');
  const chips = [...h1.querySelectorAll('.hero-image-label')];
  assert.deepEqual(chips.map((c) => [c.tagName, c.textContent, c.getAttribute('href')]), [
    ['A', 'Lifestyle', '/en/category/lifestyle'],
    ['A', 'People', '/en/category/lifestyle/people'],
  ]);
  assert.equal(h1.textContent, 'Lifestyle People');
  assert.equal(h1.querySelector('span'), null, 'a link line is not wrapped again');
});

test('archive without a banner keeps an empty band; an h1 without breaks is one chip', () => {
  const archive = block('archive', `
    <div><div></div></div>
    <div><div><h1>Design &amp; Engineering</h1></div></div>
  `);
  decorate(archive);
  const media = archive.querySelector('.hero-image-media');
  assert.ok(media, 'the band renders without an image');
  assert.equal(media.children.length, 0);
  assert.deepEqual([...archive.querySelectorAll('.hero-image-label')].map((l) => l.textContent), [
    'Design & Engineering',
  ]);

  const imageOnly = block('archive', '<div><div><picture><img src="/banner.jpg" alt=""></picture></div></div>');
  decorate(imageOnly);
  assert.deepEqual([...imageOnly.children].map((el) => el.className), ['hero-image-media']);
});

test('page (SKODA-813): the band, then the title; an image is the eager LCP picture', () => {
  const hero = block('page', `
    <div><div><picture><img src="/contacts.png" alt="Contacts" width="1920" height="576"></picture></div></div>
    <div><div><h1>Contacts</h1></div></div>`);
  decorate(hero);
  assert.deepEqual([...hero.children].map((el) => el.className), ['hero-image-media', 'hero-image-content']);
  assert.equal(hero.querySelector('.hero-image-content h1').textContent, 'Contacts');
  assert.equal(hero.querySelector('.hero-image-media img').getAttribute('fetchpriority'), 'high');
  assert.equal(hero.querySelector('.hero-image-caption'), null, 'no story caption');
});

test('page without an image keeps its empty 240px band (the source\'s copyright banner)', () => {
  const hero = block('page', '<div><div></div></div><div><div><h1>Copyright</h1></div></div>');
  decorate(hero);
  const media = hero.querySelector('.hero-image-media');
  assert.ok(media, 'the band');
  assert.equal(media.children.length, 0);
  assert.equal(hero.querySelector('h1').textContent, 'Copyright');
});

test('page CSS (SKODA-813): 240px band at every width, the 5% ink base, the white 48px light title', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = (await readFile(new URL('./hero-image.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = (sel) => (css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
  assert.match(rule('.hero-image.page'), /--hero-page-h:\s*240px/);
  assert.match(rule('.hero-image.page'), /--hero-page-empty:\s*rgb\(0 0 0 \/ 5%\)/);
  assert.match(rule('.hero-image.page .hero-image-media'), /height:\s*var\(--hero-page-h\)/);
  const h1 = rule('.hero-image.page .hero-image-content h1');
  assert.match(h1, /font-size:\s*var\(--heading-font-size-hero\)/);
  assert.match(h1, /font-weight:\s*var\(--weight-light\)/);
  assert.match(h1, /color:\s*var\(--skoda-white\)/);
  // the story-only rules stay off the page band
  assert.equal(css.includes(':not(.overlay, .archive)'), false);
});

// --- #480: the fixed-height bands size their image for the cover crop ---------------------------

test('coverSources: the issue\'s newsletter panorama on the page band needs 1281px below 1256px of viewport', () => {
  const cover = coverSources({ width: 1920, height: 367, ...COVER_BANDS.page });
  // 240px × 1.02 scale × 5.23 aspect = 1281px drawn; from 1256px the viewport (× 1.02) is wider
  assert.equal(cover.sizes, '(min-width: 1256px) 102vw, 1281px');
  assert.deepEqual(cover.widths, [750, 1080, 1440, 1920], 'the master (1920) is the largest, never above');
});

test('coverSources: the archive band\'s three heights (184 / 224 / 240)', () => {
  const cover = coverSources({ width: 2500, height: 480, ...COVER_BANDS.archive });
  assert.equal(cover.sizes, '(min-width: 1250px) 100vw, (min-width: 768px) 1250px, (min-width: 576px) 1167px, 959px');
  assert.deepEqual(cover.widths, [750, 1080, 1440, 1920, 2500]);
});

test('coverSources: a 16:9 image is drawn about as wide as the viewport; one step collapses equal sizes', () => {
  assert.equal(coverSources({ width: 1920, height: 1080, ...COVER_BANDS.page }).sizes, '(min-width: 428px) 102vw, 436px');
  assert.equal(coverSources({ width: 1920, height: 1080, ...COVER_BANDS.archive }).sizes, '(min-width: 328px) 100vw, 328px');
  assert.equal(coverSources({ width: 2560, height: 939, ...COVER_BANDS.archive }).sizes,
    '(min-width: 611px) 100vw, (min-width: 576px) 611px, (min-width: 502px) 100vw, 502px');
});

test('coverSources: no size, no answer; a small master is its own only candidate', () => {
  assert.equal(coverSources({ width: null, height: 480, ...COVER_BANDS.page }), null);
  assert.equal(coverSources({ width: 0, height: 0, ...COVER_BANDS.page }), null);
  assert.deepEqual(coverSources({ width: 640, height: 200, ...COVER_BANDS.page }).widths, [640]);
});

test('COVER_BANDS mirrors the band heights, breakpoints and scale in the CSS', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('./hero-image.css', import.meta.url), 'utf8');
  const tokens = await readFile(new URL('../../styles/styles.css', import.meta.url), 'utf8');
  const token = (name) => Number((tokens.match(new RegExp(`${name}:\\s*(\\d+)px`)) || [])[1]);
  assert.deepEqual(COVER_BANDS.archive.heights, [
    [0, token('--hero-archive-h-base')], [576, token('--hero-archive-h-sm')], [768, token('--hero-archive-h-md')],
  ]);
  assert.match(css, /@media \(width >= 576px\)\s*\{\s*\.hero-image\.archive \.hero-image-media/);
  assert.match(css, /@media \(width >= 768px\)\s*\{\s*\.hero-image\.archive \.hero-image-media/);
  assert.equal(COVER_BANDS.page.heights[0][1], Number(css.match(/--hero-page-h:\s*(\d+)px/)[1]));
  assert.match(css, /\.hero-image:not\(\.archive\) \.hero-image-media img \{\s*scale: 1\.02;/, 'the page band is drawn at 1.02, the archive at 1');
});

const MEDIA_PICTURE = (width = '1920', height = '367') => `<picture>
  <source type="image/webp" srcset="./media_13b1a03a384ab3594ed8247ad3d6e2d69aefd343e.png?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">
  <source type="image/webp" srcset="./media_13b1a03a384ab3594ed8247ad3d6e2d69aefd343e.png?width=750&format=webply&optimize=medium">
  <source type="image/png" srcset="./media_13b1a03a384ab3594ed8247ad3d6e2d69aefd343e.png?width=2000&format=png&optimize=medium" media="(min-width: 600px)">
  <img loading="lazy" alt="Newsletter" src="./media_13b1a03a384ab3594ed8247ad3d6e2d69aefd343e.png?width=750&format=png&optimize=medium"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>
</picture>`;

test('page band: the same picture and img, WebP sources + an img srcset sized for the crop, still the eager LCP', () => {
  const hero = block('page', `<div><div>${MEDIA_PICTURE()}</div></div><div><div><h1>Newsletter</h1></div></div>`);
  const img = hero.querySelector('img');
  const picture = hero.querySelector('picture');
  decorate(hero);
  assert.equal(hero.querySelector('.hero-image-media picture'), picture, 'the authored picture stays');
  assert.equal(hero.querySelector('.hero-image-media img'), img, 'the authored img stays');
  const sources = [...picture.querySelectorAll('source')];
  const widths = (s) => s.getAttribute('srcset').split(', ').map((c) => c.split(' ')[1]);
  assert.equal(sources.length, 2, 'a phone source, then the full one');
  assert.ok(sources.every((s) => s.type === 'image/webp' && s.getAttribute('sizes') === '(min-width: 1256px) 102vw, 1281px'));
  // phones get at most the page band's phoneMax, the source's 1440px (#480 review)
  assert.equal(sources[0].getAttribute('media'), '(width < 768px)');
  assert.deepEqual(widths(sources[0]), ['750w', '1080w', '1440w']);
  assert.equal(sources[1].getAttribute('media'), null);
  assert.deepEqual(widths(sources[1]), ['750w', '1080w', '1440w', '1920w']);
  assert.match(sources[1].getAttribute('srcset'), /^\/en\/media_13b1a03a384ab3594ed8247ad3d6e2d69aefd343e\.png\?width=750&format=webply&optimize=medium 750w/);
  assert.match(img.getAttribute('srcset'), /\?width=1920&format=png&optimize=medium 1920w$/);
  assert.equal(img.getAttribute('sizes'), '(min-width: 1256px) 102vw, 1281px');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(img.getAttribute('loading'), 'eager');
  assert.deepEqual([img.getAttribute('width'), img.getAttribute('height')], ['1920', '367']);
});

test('archive band: sized for its three heights; phones at most 1080w; a jpeg keeps the jpg format', () => {
  const hero = block('archive', `<div><div>${MEDIA_PICTURE('2500', '480').replace(/\.png/g, '.jpeg').replace(/format=png/g, 'format=jpeg')}</div></div><div><div><h1>eMobility</h1></div></div>`);
  decorate(hero);
  const img = hero.querySelector('img');
  assert.equal(img.getAttribute('sizes'), '(min-width: 1250px) 100vw, (min-width: 768px) 1250px, (min-width: 576px) 1167px, 959px');
  assert.match(img.getAttribute('srcset'), /format=jpg&optimize=medium 2500w$/);
  // the archive's LCP is the first story card, which EDS loads after this image (#480 review)
  const sources = [...hero.querySelectorAll('source')];
  const widths = (s) => s.getAttribute('srcset').split(', ').map((c) => c.split(' ')[1]);
  assert.equal(sources[0].getAttribute('media'), '(width < 768px)');
  assert.deepEqual(widths(sources[0]), ['750w', '1080w']);
  assert.deepEqual(widths(sources[1]), ['750w', '1080w', '1440w', '1920w', '2500w']);
});

test('bands without the master size or a media-bus image, and the story / overlay heroes, keep the authored picture', () => {
  const sourcesOf = (hero) => [...hero.querySelectorAll('source')].map((s) => s.getAttribute('srcset'));
  const noSize = block('page', `<div><div>${MEDIA_PICTURE('', '')}</div></div>`);
  const before = sourcesOf(noSize);
  decorate(noSize);
  assert.deepEqual(sourcesOf(noSize), before, 'no size: unchanged');
  assert.equal(noSize.querySelector('img').getAttribute('sizes'), null);
  const external = block('page', '<div><div><picture><img src="https://cdn.example.com/banner.jpg" alt="" width="1920" height="367"></picture></div></div>');
  decorate(external);
  assert.equal(external.querySelector('img').getAttribute('srcset'), null, 'not a media-bus image');
  ['', 'overlay'].forEach((variant) => {
    const hero = block(variant, `<div><div>${MEDIA_PICTURE()}</div></div><div><div><h1>Title</h1></div></div>`);
    const was = sourcesOf(hero);
    decorate(hero);
    assert.deepEqual(sourcesOf(hero), was, `${variant || 'story'}: unchanged`);
  });
});

test('the band image gets its crop srcset while still lazy, so no authored 750w request starts first', async () => {
  const hero = block('archive', `<div><div>${MEDIA_PICTURE('2500', '480')}</div></div>`);
  const changes = [];
  const observer = new window.MutationObserver((records) => records.forEach((r) => changes.push(r.attributeName)));
  observer.observe(hero.querySelector('img'), { attributeFilter: ['srcset', 'loading'] });
  decorate(hero);
  await Promise.resolve();
  observer.disconnect();
  assert.deepEqual(changes, ['srcset', 'loading']);
});

test('a master no wider than the phone cap gets one source for every width', () => {
  const hero = block('page', `<div><div>${MEDIA_PICTURE('1280', '246')}</div></div>`);
  decorate(hero);
  const sources = [...hero.querySelectorAll('source')];
  assert.equal(sources.length, 1);
  assert.equal(sources[0].getAttribute('media'), null);
  assert.deepEqual(sources[0].getAttribute('srcset').split(', ').map((c) => c.split(' ')[1]), ['750w', '1080w', '1280w']);
});
