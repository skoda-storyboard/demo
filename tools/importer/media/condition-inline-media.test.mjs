import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { conditionInlineMedia, imageLimit, imageWidth } from './condition-inline-media.mjs';
import { logicalId } from './media-lib.mjs';

async function fixture(run, overrides = {}) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    const entry = overrides[req.url] || (req.url === '/big.jpg' ? 24 : null);
    if (entry === null) { res.writeHead(404); res.end(); return; }
    if (entry === 'error') { res.writeHead(503); res.end(); return; }
    if (entry.status) { res.writeHead(entry.status, { 'content-type': 'application/xml' }); res.end(); return; }
    const bytes = typeof entry === 'number' ? entry : entry.bytes;
    const headers = {
      'content-type': entry.type || 'image/jpeg',
      ...(entry.noHeadLength && req.method === 'HEAD' ? {} : {
        'content-length': String(entry.headLength && req.method === 'HEAD' ? entry.headLength : bytes),
      }),
    };
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : Buffer.alloc(bytes, 1));
  });
  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}/page.html`;
  try {
    await run(base, requests);
  } finally {
    await new Promise((resolve) => { server.close(resolve); });
  }
}

const opts = (base) => ({ base, maxBytes: 10 });

test('configured byte limit rejects invalid values', () => {
  for (const value of [0, -1, 1.5, '', 'bogus']) assert.throws(() => imageLimit(value));
  assert.equal(imageLimit(10), 10);
  for (const value of [0, -1, 1.5, 'bogus']) assert.throws(() => imageWidth(value));
  assert.equal(imageWidth(1440), 1440);
});

test('inline image exactly at the threshold stays byte-for-byte unchanged', async () => {
  await fixture(async (base) => {
    const html = '<div><img src="/small.jpg" alt="Original" data-caption="Caption"></div>';
    const result = await conditionInlineMedia(html, opts(base));
    assert.equal(result.html, html);
    assert.deepEqual(result.changes, []);
    assert.deepEqual(result.errors, []);
  }, { '/small.jpg': 10 });
});

test('oversized body image uses a verified sized rendition and preserves metadata', async () => {
  await fixture(async (base) => {
    const metadata = '<div class="metadata"><div><div>Image</div><div>/big.jpg</div></div></div>';
    const html = '<figure><div><img src="/big.jpg" alt="Sunset" data-caption="Morning"></div>'
      + `<figcaption>Morning</figcaption></figure>${metadata}`;
    const result = await conditionInlineMedia(html, opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'substitute');
    assert.match(result.html, /big-1920x1280\.jpg" alt="Sunset" data-caption="Morning"/);
    assert.ok(result.html.includes(metadata));
  }, { '/big-1920x1280.jpg': 8 });
});

test('unavailable derivatives strip a body picture but retain caption and metadata', async () => {
  await fixture(async (base) => {
    const metadata = '<div class="metadata"><div><div>Image</div><div>/big.jpg</div></div></div>';
    const html = '<figure><div><picture><img src="/big.jpg" alt="Full view" data-caption="Recorded caption">'
      + `</picture></div></figure>${metadata}`;
    const result = await conditionInlineMedia(html, opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'strip');
    assert.equal(result.changes[0].alt, 'Full view');
    assert.doesNotMatch(result.html, /<img|<picture/);
    assert.match(result.html, /<figcaption>Recorded caption<\/figcaption>/);
    assert.ok(result.html.includes(metadata));
  });
});

test('an oversized hero, card, or unclassified image is never silently removed', async () => {
  await fixture(async (base) => {
    for (const html of [
      '<div class="hero-image"><div><img src="/big.jpg" alt="Hero"></div></div>',
      '<div class="cards-overlay"><div><img src="/big.jpg" alt="Card"></div></div>',
      '<div><img src="/big.jpg" alt="Unknown"></div>',
    ]) {
      const result = await conditionInlineMedia(html, opts(base));
      assert.equal(result.html, html);
      assert.deepEqual(result.changes, []);
      assert.match(result.errors[0], /cannot be stripped/);
    }
  });
});

test('picture with oversized source chooses safe img and drops every old srcset', async () => {
  await fixture(async (base) => {
    const html = '<figure><picture><source srcset="/big.jpg 1920w">'
      + '<img src="/big-768x512.jpg" srcset="/big.jpg 1920w" alt="Same" data-caption="Still">'
      + '</picture></figure>';
    const result = await conditionInlineMedia(html, opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'substitute');
    assert.match(result.html, /src="http:\/\/127\.0\.0\.1:\d+\/big-768x512\.jpg"/);
    assert.doesNotMatch(result.html, /<source|srcset|big\.jpg/);
    assert.match(result.html, /alt="Same" data-caption="Still"/);
  }, { '/big-768x512.jpg': 8 });
});

test('art-directed picture is blocked rather than silently losing its crop', async () => {
  await fixture(async (base) => {
    const html = '<figure><picture><source srcset="/big-1920x750.jpg 1920w">'
      + '<img src="/big.jpg" alt="Wide crop"></picture></figure>';
    const result = await conditionInlineMedia(html, opts(base));
    assert.equal(result.html, html);
    assert.match(result.errors[0], /Art-directed picture/);
  }, { '/big-1920x750.jpg': 24 });
});

test('stripping paragraph imagery retains data-caption as readable text and logs alt', async () => {
  await fixture(async (base) => {
    const result = await conditionInlineMedia(
      '<p>Before <img src="/big.jpg" alt="Context" data-caption="Image credit"> after.</p>',
      opts(base),
    );
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'strip');
    assert.equal(result.changes[0].alt, 'Context');
    assert.match(result.html, /Before <span>Image credit<\/span> after\./);
  });
});

test('missing HEAD length is checked with a bounded GET; inaccessible URLs block', async () => {
  await fixture(async (base, requests) => {
    const good = await conditionInlineMedia('<img src="/unknown.jpg">', opts(base));
    assert.deepEqual(good.errors, []);
    assert.deepEqual(good.changes, []);
    assert.ok(requests.includes('GET /unknown.jpg'));
    const empty = await conditionInlineMedia('<figure><img src="/empty.jpg"></figure>', opts(base));
    assert.match(empty.errors[0], /missing or empty/);
    const bad = await conditionInlineMedia('<figure><img src="/error.jpg"></figure>', opts(base));
    assert.match(bad.errors[0], /HEAD 503/);
    assert.deepEqual(bad.changes, []);
  }, { '/unknown.jpg': { bytes: 8, noHeadLength: true }, '/empty.jpg': 0, '/error.jpg': 'error' });
});

test('a derivative with a falsely small HEAD is rejected after GET verification', async () => {
  await fixture(async (base) => {
    const result = await conditionInlineMedia('<figure><img src="/big.jpg"></figure>', opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'strip');
  }, { '/big-2560x1707.jpg': { bytes: 24, headLength: 8 } });
});

test('extension-less thumbnails pass on an image content-type, other types block', async () => {
  // Real case: Vimeo thumbnails (i.vimeocdn.com/video/<id>-d_295x166?region=us).
  await fixture(async (base) => {
    const html = '<p><picture><img src="/video/2196437413-d_295x166?region=us" alt="Video"></picture></p>';
    const result = await conditionInlineMedia(html, opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.html, html);
    const page = await conditionInlineMedia('<p><img src="/video/page"></p>', opts(base));
    assert.match(page.errors[0], /Not an image response: .*text\/html/);
  }, {
    '/video/2196437413-d_295x166?region=us': 8,
    '/video/page': { bytes: 8, type: 'text/html' },
  });
});

test('a CDN 403 means a missing derivative, so body imagery is stripped, not blocked', async () => {
  // Real case: the S3-backed source CDN answers 403 for every absent -WxH rendition.
  await fixture(async (base) => {
    const result = await conditionInlineMedia('<p><picture><img src="/big.jpg" alt="Body"></picture></p>', opts(base));
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'strip');
    const gone = await conditionInlineMedia('<p><img src="/gone.jpg"></p>', opts(base));
    assert.match(gone.errors[0], /missing or empty/);
  }, Object.fromEntries(['/gone.jpg', '/big-2560x1707.jpg', '/big-2048x1365.jpg', '/big-1920x1280.jpg',
    '/big-1536x1024.jpg', '/big-1440x960.jpg', '/big-768x512.jpg', '/big-384x256.jpg', '/big-272x182.jpg']
    .map((url) => [url, { status: 403 }])));
});

test('a thumbnail-width rendition is never substituted for a body image', async () => {
  // Real case: the manifest delivery_url for a 18 MB master was its -272x182 thumbnail.
  await fixture(async (base) => {
    const src = `${new URL(base).origin}/big.jpg`;
    const manifest = { rows: { [logicalId(src)]: { delivery_url: `${new URL(base).origin}/big-272x182.jpg` } } };
    const html = '<p><picture><img src="/big.jpg" alt="Family"></picture></p>';
    const result = await conditionInlineMedia(html, { ...opts(base), manifest });
    assert.deepEqual(result.errors, []);
    assert.equal(result.changes[0].action, 'strip');
    assert.match(result.changes[0].narrowerThanMinWidth.join(), /big-272x182\.jpg/);
    const hero = await conditionInlineMedia('<div class="hero-image"><div><img src="/big.jpg"></div></div>', { ...opts(base), manifest });
    assert.match(hero.errors[0], /renditions under 768px ignored/);
    const lowered = await conditionInlineMedia(html, { ...opts(base), manifest, minWidth: 200 });
    assert.equal(lowered.changes[0].action, 'substitute');
    assert.match(lowered.changes[0].to, /big-272x182\.jpg$/);
  }, { '/big-272x182.jpg': 8 });
});
