import path from 'node:path';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publishDamImage, resolveDamToken } from './media-lib.mjs';

const DAM_FOLDER = '/content/dam/storyboard';
const AUTHOR = 'https://author-p220607-e2281243.adobeaemcloud.com';
const PUBLISH = 'https://publish-p220607-e2281243.adobeaemcloud.com';
const MANIFEST = fileURLToPath(new URL('./media-manifest.json', import.meta.url));

function imageUrl(base, damPath) {
  return `${base}${path.posix.dirname(damPath)}/${encodeURIComponent(path.posix.basename(damPath))}`;
}

function mimeAndBytes(response) {
  const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const rawLength = response.headers.get('content-length');
  const bytes = rawLength === null ? NaN : Number(rawLength);
  if (!/^image\/(?:png|jpeg|gif|webp|svg\+xml|avif)$/.test(mime)
    || !Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error(`Invalid original image type/length: ${mime}, ${rawLength}`);
  }
  return { mime, bytes };
}

async function head(url, headers = {}, fetchImpl = fetch) {
  return fetchImpl(url, {
    method: 'HEAD',
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(25000),
  });
}

async function publicProof(url, original, fetchImpl, attempts = 1) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await head(url, {}, fetchImpl);
    if (response.status === 404) {
      if (attempt < attempts - 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 2000); });
      }
      continue;
    }
    if (response.status !== 200) throw new Error(`Publish HEAD returned ${response.status}: ${url}`);
    const proof = mimeAndBytes(response);
    if (proof.mime !== original.mime || proof.bytes !== original.bytes) {
      throw new Error(`Published original mismatch: ${url} (${proof.mime}, ${proof.bytes} bytes; expected ${original.mime}, ${original.bytes})`);
    }
    return { url, ...proof };
  }
  return null;
}

export async function publishImage(row, {
  token, fetchImpl = fetch, activate = publishDamImage, save,
  author = AUTHOR, publish = PUBLISH,
} = {}) {
  if (!row || row.kind === 'document' || row.kind === 'video'
    || row.steps?.dam !== 'done' || !row.dam_asset_path?.startsWith(`${DAM_FOLDER}/`)
    || path.posix.normalize(row.dam_asset_path) !== row.dam_asset_path
    || !/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(row.dam_asset_path)) {
    throw new Error(`Not an uploaded DAM image: ${row?.logical_id}`);
  }
  if (!token) throw new Error('DAM token required to verify the author original');
  const authorResponse = await head(imageUrl(author, row.dam_asset_path), {
    authorization: `Bearer ${token}`,
  }, fetchImpl);
  if (authorResponse.status !== 200) {
    throw new Error(`DAM original HEAD returned ${authorResponse.status}: ${row.dam_asset_path}`);
  }
  const original = mimeAndBytes(authorResponse);
  const url = imageUrl(publish, row.dam_asset_path);
  if (row.steps.publish === 'done' && row.public_verified?.url === url
    && row.public_verified.mime === original.mime && row.public_verified.bytes === original.bytes) {
    return row;
  }
  if (row.steps.publish === 'done' && row.public_verified?.url !== url) {
    throw new Error(`Recorded published URL differs from DAM original: ${row.logical_id}`);
  }
  let proof = await publicProof(url, original, fetchImpl);
  if (!proof && ['pending', 'uncertain'].includes(row.steps.publish)) {
    proof = await publicProof(url, original, fetchImpl, 11);
    if (!proof) throw new Error(`Activation outcome uncertain; no automatic reactivation: ${url}`);
  }
  if (!proof && row.steps.publish === 'done') {
    throw new Error(`Previously published original is no longer available: ${url}`);
  }
  if (!proof && !['pending', 'uncertain'].includes(row.steps.publish)) {
    row.steps.publish = 'pending';
    save(row);
    row.publish_status = await activate({
      damConfig: { baseUrl: author, folder: DAM_FOLDER },
      damPath: row.dam_asset_path,
      token,
      fetchImpl,
    });
    row.published_at = new Date().toISOString();
    save(row);
    proof = await publicProof(url, original, fetchImpl, 11);
    if (!proof) throw new Error(`Activation did not deliver the original: ${url}`);
  }
  row.public_url = url;
  row.public_verified = proof;
  row.steps.publish = 'done';
  row.publish_note = '';
  save(row);
  return row;
}

export async function main(args = process.argv.slice(2)) {
  const options = {
    manifest: MANIFEST, idsFile: '', tokenFile: '', limit: Infinity, concurrency: 4,
  };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`);
    if (key === '--manifest') options.manifest = path.resolve(value);
    else if (key === '--ids-file') options.idsFile = path.resolve(value);
    else if (key === '--token-file') options.tokenFile = path.resolve(value);
    else if (key === '--limit') options.limit = Number(value);
    else if (key === '--concurrency') options.concurrency = Number(value);
    else throw new Error(`Unexpected argument: ${key}`);
  }
  if (!options.idsFile || !Number.isInteger(options.concurrency) || options.concurrency < 1
    || !(options.limit === Infinity || (Number.isInteger(options.limit) && options.limit > 0))) {
    throw new Error('Require --ids-file, positive --limit, and positive --concurrency');
  }
  const token = resolveDamToken({ tokenFile: options.tokenFile });
  if (!token) throw new Error('DAM token not available');
  const manifest = JSON.parse(readFileSync(options.manifest, 'utf8'));
  const ids = readFileSync(options.idsFile, 'utf8').split(/\r?\n/)
    .map((id) => id.trim()).filter((id) => id && !id.startsWith('#'));
  if (!ids.length || new Set(ids).size !== ids.length || ids.some((id) => {
    const row = manifest.rows[id];
    return !row || row.kind === 'document' || row.kind === 'video'
      || row.steps?.dam !== 'done' || !row.dam_asset_path?.startsWith(`${DAM_FOLDER}/`);
  })) throw new Error('ID list must contain distinct, uploaded image originals only');
  const selected = ids.slice(0, options.limit);
  const save = (row) => {
    manifest.rows[row.logical_id] = row;
    const temp = `${options.manifest}.tmp`;
    writeFileSync(temp, `${JSON.stringify(manifest, null, 2)}\n`);
    renameSync(temp, options.manifest);
  };
  const counts = { done: 0, failed: 0, skipped: 0 };
  let next = 0;
  const workerCount = Math.min(options.concurrency, selected.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= selected.length) return;
      const id = selected[index];
      const row = manifest.rows[id];
      const wasDone = row.steps.publish === 'done';
      try {
        await publishImage(row, { token, save });
        if (wasDone) counts.skipped += 1; else counts.done += 1;
        console.log(`  ✓ ${id}  ${row.public_url}`);
      } catch (error) {
        row.publish_note = error.message;
        if (row.steps.publish !== 'pending' && row.steps.publish !== 'done') {
          row.steps.publish = 'error';
        }
        save(row);
        counts.failed += 1;
        console.error(`  ✗ ${id}  ${error.message}`);
        if (/DAM original HEAD returned 401|DAM activation returned 401/.test(error.message)) {
          throw error;
        }
      }
    }
  }));
  console.log(`[image publish] done=${counts.done} failed=${counts.failed} skipped=${counts.skipped}`);
  if (counts.failed) process.exitCode = 1;
  return counts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
