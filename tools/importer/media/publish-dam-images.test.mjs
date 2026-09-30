import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishImage } from './publish-dam-images.mjs';

const damPath = '/content/dam/storyboard/en/model/photo.jpg';
const author = 'https://author.example.test';
const publish = 'https://publish.example.test';
const row = () => ({
  logical_id: 'photo',
  dam_asset_path: damPath,
  steps: { deliver: 'done', dam: 'done' },
  status: 'done',
});
const image = (bytes, mime = 'image/jpeg') => new Response(null, {
  status: 200, headers: { 'content-type': mime, 'content-length': String(bytes) },
});

test('activates an uploaded image and records only verified anonymous original', async () => {
  const record = row();
  const saves = [];
  let publicChecks = 0;
  const fetchImpl = async (url, options) => {
    if (url.startsWith(author)) return image(1024);
    assert.equal(options.method, 'HEAD');
    publicChecks += 1;
    return publicChecks === 1 ? new Response(null, { status: 404 }) : image(1024);
  };
  const activate = async ({ damPath: path, token }) => {
    assert.equal(path, damPath);
    assert.equal(token, 'mock');
    assert.equal(record.steps.publish, 'pending');
    assert.equal(record.public_verified, undefined);
    return 200;
  };
  await publishImage(record, {
    token: 'mock',
    author,
    publish,
    fetchImpl,
    activate,
    save: (value) => saves.push(JSON.parse(JSON.stringify(value))),
  });
  assert.equal(saves[0].steps.publish, 'pending');
  assert.deepEqual(record.public_verified, { url: `${publish}${damPath}`, mime: 'image/jpeg', bytes: 1024 });
  assert.equal(record.steps.publish, 'done');
  assert.equal(record.status, 'done');
  assert.equal(saves.at(-1).steps.publish, 'done');
  await publishImage(record, {
    token: 'mock',
    author,
    publish,
    fetchImpl,
    activate: () => { throw new Error('must not activate twice'); },
    save: () => { throw new Error('must not rewrite a verified row'); },
  });
});

test('does not activate or record a mismatched public original', async () => {
  const record = row();
  await assert.rejects(publishImage(record, {
    token: 'mock',
    author,
    publish,
    fetchImpl: async (url) => (url.startsWith(author) ? image(1024) : image(500)),
    activate: () => { throw new Error('must not activate'); },
    save: () => { throw new Error('must not write'); },
  }), /Published original mismatch/);
  assert.equal(record.steps.publish, undefined);
});

test('an uncertain activation verifies delivery without reactivating', async () => {
  const record = { ...row(), steps: { dam: 'done', publish: 'pending' } };
  let publicChecks = 0;
  await publishImage(record, {
    token: 'mock',
    author,
    publish,
    fetchImpl: async (url) => {
      if (url.startsWith(author)) return image(1024);
      publicChecks += 1;
      return publicChecks === 1 ? new Response(null, { status: 404 }) : image(1024);
    },
    activate: () => { throw new Error('must not reactivate uncertain completion'); },
    save: () => {},
  });
  assert.equal(record.steps.publish, 'done');
});

test('rejects non-image and unuploaded rows before any network request', async () => {
  for (const invalid of [
    { ...row(), steps: { dam: 'n/a' } },
    { ...row(), kind: 'video' },
    { ...row(), dam_asset_path: '/content/dam/other/photo.jpg' },
    { ...row(), dam_asset_path: '/content/dam/storyboard/../other/photo.jpg' },
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await assert.rejects(publishImage(invalid, {
      token: 'mock', fetchImpl: () => { throw new Error('must not fetch'); },
    }), /Not an uploaded DAM image/);
  }
});

test('escapes encoded repository filenames for author and publish HEAD', async () => {
  const record = { ...row(), dam_asset_path: '/content/dam/storyboard/en/12_JUBIL%25C3%2584UM.jpg' };
  const urls = [];
  await publishImage(record, {
    token: 'mock',
    author,
    publish,
    fetchImpl: async (url) => { urls.push(url); return image(783000); },
    activate: () => { throw new Error('already public'); },
    save: () => {},
  });
  assert.deepEqual(urls, [
    `${author}/content/dam/storyboard/en/12_JUBIL%2525C3%252584UM.jpg`,
    `${publish}/content/dam/storyboard/en/12_JUBIL%2525C3%252584UM.jpg`,
  ]);
  assert.equal(record.public_verified.bytes, 783000);
});
