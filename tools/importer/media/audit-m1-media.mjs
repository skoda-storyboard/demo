#!/usr/bin/env node
/*
 * Reconcile imported M1 page images with the media manifest. Read-only: the
 * report is an inventory, not a substitute for SKODA-506's publish-time gate.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import {
  logicalId, isImageUrl, isDocumentUrl, OVERSIZE_BYTES,
} from './media-lib.mjs';

function args() {
  const parsed = {
    urls: 'docs/planning/skoda-m1-url-set.txt',
    contentRoot: 'content',
    manifest: 'tools/importer/media/media-manifest.json',
    out: '',
  };
  const options = process.argv.slice(2);
  for (let i = 0; i < options.length; i += 2) {
    const key = options[i].replace(/^--/, '');
    if (!(key in parsed) || !options[i + 1]) throw new Error(`Unknown or missing option: ${options[i]}`);
    parsed[key] = options[i + 1];
  }
  return parsed;
}

function canonicalPaths(text) {
  let alias = false;
  const paths = [];
  text.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('# ALIAS')) { alias = true; return; }
    if (!line.startsWith('https://')) return;
    if (alias) { alias = false; return; }
    paths.push(new URL(line).pathname.replace(/\/$/, ''));
  });
  return [...new Set(paths)];
}

function auditPage(pagePath, contentRoot, rows) {
  const file = path.join(contentRoot, `${pagePath}.plain.html`);
  const indexFile = path.join(contentRoot, pagePath, 'index.plain.html');
  const found = existsSync(file) ? file : indexFile;
  if (!existsSync(found)) {
    return {
      path: pagePath, status: 'missing', images: [], documents: [],
    };
  }

  const doc = new JSDOM(readFileSync(found, 'utf8')).window.document;
  const byDelivery = new Map(Object.values(rows)
    .filter((row) => row.delivery_url)
    .map((row) => [row.delivery_url, row]));
  const images = [...doc.querySelectorAll('img')].map((img) => {
    const src = img.getAttribute('src') || '';
    const alreadyDelivered = /^\.?\/media_[^/]+/.test(src);
    const row = byDelivery.get(src) || (!alreadyDelivered && rows[logicalId(src)]);
    const caption = (img.getAttribute('data-caption') || '').trim();
    const inBlock = !!img.closest('table, .gallery');
    const visibleCaption = (img.closest('figure')?.querySelector('figcaption')?.textContent || '').trim()
      || (inBlock ? (img.closest('td, .gallery > div')?.nextElementSibling?.textContent || '').trim() : '');
    let delivery = 'unresolved';
    if (alreadyDelivered) delivery = 'media-bus';
    else if (row?.delivery_url && row.steps?.deliver === 'done'
      && Number.isFinite(row.bytes) && row.bytes <= OVERSIZE_BYTES) delivery = 'prepared';
    return {
      src,
      alt: img.hasAttribute('alt') ? img.getAttribute('alt') : null,
      caption: caption || visibleCaption,
      missingCaption: !!caption && !visibleCaption,
      placement: img.parentElement?.tagName === 'DIV' || inBlock || !!img.closest('picture'),
      delivery,
      original: row?.steps?.dam === 'done' && row.dam_asset_path ? 'dam' : 'pending',
      logicalId: row?.logical_id || (isImageUrl(src) && !alreadyDelivered ? logicalId(src) : null),
    };
  });
  // Linked documents (the model Technical Data PDFs, SKODA-208): tracked for the DAM only.
  const documents = [...doc.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter((href) => /^https?:/i.test(href) && isDocumentUrl(href))
    .map((href) => {
      const row = rows[logicalId(href)];
      return {
        href,
        tracked: row?.kind === 'document',
        original: row?.steps?.dam === 'done' && row.dam_asset_path ? 'dam' : 'pending',
      };
    });
  const actual = new Set(images.map((img) => img.logicalId).filter(Boolean));
  const expected = Object.values(rows).filter((row) => {
    const refs = row.page_refs || [row.dam_page_path];
    return refs.includes(pagePath) && row.logical_id && row.kind !== 'document';
  });
  const missingImages = expected.filter((row) => !actual.has(row.logical_id))
    .map((row) => row.logical_id);
  return {
    path: pagePath, status: 'present', images, documents, missingImages,
  };
}

function main() {
  const cfg = args();
  const urls = canonicalPaths(readFileSync(cfg.urls, 'utf8'));
  const { rows } = JSON.parse(readFileSync(cfg.manifest, 'utf8'));
  const pages = urls.map((url) => auditPage(url.slice(1), cfg.contentRoot, rows));
  const all = pages.flatMap((page) => page.images);
  const docs = pages.flatMap((page) => page.documents);
  const summary = {
    expectedPages: urls.length,
    presentPages: pages.filter((page) => page.status === 'present').length,
    missingPages: pages.filter((page) => page.status === 'missing').length,
    images: all.length,
    missingOrEmptyAlt: all.filter((img) => img.alt === null
      || !img.alt.trim()).length,
    misplaced: all.filter((img) => !img.placement).length,
    missingCaption: all.filter((img) => img.missingCaption).length,
    missingFromPage: pages.reduce((count, page) => count + (page.missingImages?.length || 0), 0),
    unresolvedDelivery: all.filter((img) => img.delivery === 'unresolved').length,
    pendingDamOriginal: all.filter((img) => img.original === 'pending').length,
    documents: docs.length,
    untrackedDocuments: docs.filter((d) => !d.tracked).length,
    pendingDamDocument: docs.filter((d) => d.original === 'pending').length,
  };
  const report = { summary, pages };
  if (cfg.out) writeFileSync(cfg.out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(summary));
  if (summary.missingPages || summary.missingFromPage || summary.misplaced
    || summary.missingCaption || summary.unresolvedDelivery || summary.pendingDamOriginal
    || summary.untrackedDocuments || summary.pendingDamDocument) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
