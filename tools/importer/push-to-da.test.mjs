import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import main from './push-to-da.mjs';
import { contentHash, wrapPage } from './push/push-lib.mjs';

async function scenario(stage, remoteMatches, {
  previewed = false, image = 'small', extra = [], edited = false, fragmentBlocked = false,
  blockedSibling = false,
} = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-506-push-'));
  const previousFetch = global.fetch;
  const previousExitCode = process.exitCode;
  const contentDir = path.join(dir, 'content');
  const reportDir = path.join(dir, 'reports');
  const manifestFile = path.join(dir, 'push-manifest.json');
  const mediaManifestFile = path.join(dir, 'media-manifest.json');
  const list = path.join(dir, 'paths.txt');
  const plain = `<figure><img src="https://cdn.example.test/${image}.jpg" alt="Kept"></figure>`
    + '<div class="metadata"><div><div>Image</div><div>https://cdn.example.test/card.jpg</div></div></div>';
  let da = remoteMatches ? plain : '<div>Edited in DA</div>';
  const requests = [];
  mkdirSync(path.join(contentDir, 'en'), { recursive: true });
  writeFileSync(path.join(contentDir, 'en', 'story.plain.html'), plain);
  writeFileSync(list, `/en/story\n${blockedSibling ? '/en/blocked\n' : ''}`);
  if (blockedSibling) {
    writeFileSync(path.join(contentDir, 'en', 'blocked.plain.html'), '<div><img src="https://cdn.example.test/huge.jpg" alt="No rendition"></div>');
  }
  writeFileSync(mediaManifestFile, '{"rows":{}}\n');
  const hash = contentHash(wrapPage(da));
  writeFileSync(manifestFile, JSON.stringify({
    pages: {
      '/en/story': {
        hash: edited ? 'last-push-before-author-edit' : hash,
        ...(previewed ? { previewedHash: hash } : {}),
      },
    },
  }));
  global.fetch = async (url, options = {}) => {
    const address = String(url);
    const method = options.method || 'GET';
    requests.push(`${method} ${address}`);
    if (address.includes('cdn.example.test/small.jpg')) {
      return new Response(null, { status: 200, headers: { 'content-length': '8' } });
    }
    if (address.includes('cdn.example.test/big-2560x1707.jpg')) {
      return new Response(method === 'HEAD' ? null : Buffer.alloc(8), {
        status: 200, headers: { 'content-length': '8', 'content-type': 'image/jpeg' },
      });
    }
    if (address.includes('cdn.example.test/big.jpg') || address.includes('cdn.example.test/huge.jpg')) {
      return new Response(null, {
        status: 200, headers: { 'content-length': '24', 'content-type': 'image/jpeg' },
      });
    }
    if (address.includes('cdn.example.test/')) return new Response(null, { status: 404 });
    if (address.includes('admin.da.live/source/')) {
      if (fragmentBlocked && address.endsWith('/nav.html')) {
        return new Response('<div class="hero"><img src="https://cdn.example.test/big.jpg"></div>');
      }
      if (method === 'POST') {
        da = await options.body.get('data').text();
        return new Response('', { status: 201 });
      }
      return new Response(da.startsWith('<body>') ? da : wrapPage(da), { status: 200 });
    }
    if (address.includes('admin.hlx.page/status/')) {
      return Response.json({
        preview: { status: 200 },
        live: { status: fragmentBlocked ? 404 : 200 },
      });
    }
    if (address.includes('admin.hlx.page/job/')) {
      const topic = requests.some((r) => r.includes('POST https://admin.hlx.page/live/')) ? 'live' : 'preview';
      return Response.json({ state: 'stopped', data: { resources: [{ path: '/en/story', status: 200, topic }] } });
    }
    if (address.includes('admin.hlx.page/preview/') || address.includes('admin.hlx.page/live/')) {
      return new Response(JSON.stringify({
        links: { self: 'https://admin.hlx.page/job/fixture' }, job: { name: 'fixture' },
      }), { status: 202, headers: { 'content-type': 'application/json' } });
    }
    if (address.includes('.aem.page/en/story.plain.html')) {
      return new Response('<img src="./media_abc123.jpg" alt="Kept">', { status: 200 });
    }
    if (address.includes('query-index.json')) {
      return Response.json({ data: [{ path: '/en/story' }] });
    }
    if (address.includes('.aem.live/nav.plain.html') || address.includes('.aem.live/footer.plain.html')) {
      return new Response('', { status: 200 });
    }
    throw new Error(`Unexpected request: ${method} ${address}`);
  };
  try {
    const report = await main(['--paths', list, '--content-dir', contentDir, '--stage', stage, ...extra], {
      manifestFile, mediaManifestFile, reportDir,
    });
    return {
      report,
      requests,
      plain: readFileSync(path.join(contentDir, 'en', 'story.plain.html'), 'utf8'),
      state: JSON.parse(readFileSync(manifestFile, 'utf8')),
    };
  } finally {
    global.fetch = previousFetch;
    process.exitCode = previousExitCode;
    rmSync(dir, { recursive: true, force: true });
  }
}

test('publish-only refuses mismatched DA without writing or launching a bulk job', async () => {
  const result = await scenario('publish', false, { previewed: true });
  assert.match(result.report.pages[0].error, /differs from conditioned local content/);
  assert.ok(!result.requests.some((req) => req.startsWith('POST ')));
  assert.match(result.plain, /alt="Kept"/);
});

test('publish-only preserves author-edited DA content instead of forcing a media correction', async () => {
  const result = await scenario('publish', false, { edited: true });
  assert.equal(result.report.pages[0].action, 'conflict');
  assert.ok(!result.requests.some((req) => req.startsWith('POST ')));
});

test('publish-only refuses a document not reviewed in the explicit preview stage', async () => {
  const result = await scenario('publish', true);
  assert.match(result.report.pages[0].error, /not passed an explicit preview/);
  assert.ok(!result.requests.some((req) => req.startsWith('POST ')));
});

test('publish-only with matching preview hash refreshes preview before publishing', async () => {
  const result = await scenario('publish', true, { previewed: true });
  assert.equal(result.report.pages[0].liveStatus, 200);
  assert.ok(result.requests.some((req) => req.includes('POST https://admin.hlx.page/preview/')));
  assert.ok(result.requests.some((req) => req.includes('POST https://admin.hlx.page/live/')));
});

test('dry-run reports substitutions but never changes the page, DA, or a bulk job', async () => {
  const result = await scenario('push,preview', true, {
    image: 'big', extra: ['--max-image-bytes', '10', '--dry-run'],
  });
  assert.equal(result.report.pages[0].media[0].action, 'substitute');
  assert.match(result.plain, /cdn\.example\.test\/big\.jpg/);
  assert.ok(!result.requests.some((req) => req.startsWith('POST ')));
});

test('push stores the conditioned image, preserving card metadata and recording preview hash', async () => {
  const result = await scenario('push,preview', true, {
    image: 'big', extra: ['--max-image-bytes', '10'],
  });
  assert.equal(result.report.pages[0].media[0].action, 'substitute');
  assert.match(result.plain, /big-2560x1707\.jpg" alt="Kept"/);
  assert.match(result.plain, /<div>Image<\/div><div>https:\/\/cdn\.example\.test\/card\.jpg<\/div>/);
  assert.equal(result.report.pages[0].valid, true);
  assert.equal(result.state.pages['/en/story'].previewedHash, result.state.pages['/en/story'].hash);
  assert.ok(result.requests.some((req) => req.includes('POST https://admin.da.live/source/')));
});

test('combined stage re-previews conditioned DA before live and reports the gate', async () => {
  const result = await scenario('all', true);
  assert.equal(result.report.pages[0].valid, true);
  assert.equal(result.report.pages[0].liveStatus, 200);
  assert.deepEqual(result.report.pages[0].media, []);
  assert.ok(result.requests.some((req) => req.includes('POST https://admin.hlx.page/preview/')));
  assert.ok(result.requests.some((req) => req.includes('POST https://admin.hlx.page/live/')));
});

test('an unconditioned shared fragment cannot bypass the gate via --publish-fragments', async () => {
  const result = await scenario('all', true, {
    fragmentBlocked: true, extra: ['--publish-fragments', '--max-image-bytes', '10'],
  });
  assert.match(result.report.fragments[0].error, /Fragment media gate/);
  assert.ok(!result.requests.some((req) => req.includes('POST https://admin.hlx.page/live/')));
  assert.equal(result.report.pages[0].liveStatus, undefined);
});

test('a media-blocked page does not stop the rest of the batch', async () => {
  const result = await scenario('push,preview', true, {
    image: 'big', blockedSibling: true, extra: ['--max-image-bytes', '10'],
  });
  const [story, blocked] = result.report.pages;
  assert.equal(blocked.action, 'blocked-media');
  assert.match(blocked.error, /cannot be stripped/);
  assert.equal(story.error, undefined);
  assert.equal(story.valid, true);
  assert.equal(result.state.pages['/en/story'].previewedHash, result.state.pages['/en/story'].hash);
  assert.ok(!result.requests.some((req) => req.includes('/en/blocked') && req.startsWith('POST ')));
  assert.equal(result.requests.filter((req) => req === 'HEAD https://cdn.example.test/big.jpg').length, 1);
});
