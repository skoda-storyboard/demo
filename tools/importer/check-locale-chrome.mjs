#!/usr/bin/env node
/**
 * Locale chrome check (SKODA-1006). Reads each locale's four chrome fragments (`/{loc}/nav`,
 * `/{loc}/footer`, `/{loc}/media-room/nav`, `/{loc}/media-room/footer`) and fails on
 *   - a link into another locale's tree (English included), outside the language switcher and the
 *     accepted exceptions below;
 *   - an in-site link that does not resolve (after the runtime link policy, scripts/links.js
 *     policyHref, so it reports what a visitor gets; a redirect resolves only when it ends on a
 *     2xx within MAX_REDIRECTS hops). Links to the
 *     live source host are not fetched: by link policy D-3 (b) they open the source in a new tab.
 *
 *   node tools/importer/check-locale-chrome.mjs [--base=https://main--demo--skoda-storyboard.aem.live]
 *     [--locales=cs,de,sk,sr,sl]
 *
 * Exit code 1 on any finding (a missing fragment counts as one) or when the check cannot run.
 */
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { extractHrefs, classify } from './check-dead-links.mjs';
import { policyHref } from '../../scripts/links.js';

export const LOCALES = ['cs', 'de', 'sk', 'sr', 'sl'];
export const FRAGMENTS = ['nav', 'footer', 'media-room/nav', 'media-room/footer'];
const TREES = ['en', ...LOCALES];
const SWITCHER_CODE = /^(EN|CZ|CS|DE|SK|SR|SL)$/;
// the site's own hosts: the source and the demo's previews (not cdn. or other subdomains)
const OWN_HOST = /^(?:(?:www\.)?skoda-storyboard\.com|[\w-]+--demo--skoda-storyboard\.aem\.(?:page|live))$/i;

/**
 * Cross-locale links the source menus have and the PO decided to keep as live (2026-10-28):
 * the source's own targets in another locale, per locale, by target path.
 */
export const ACCEPTED = {
  sr: [
    '/sl/category/modeli-si/', // "Modeli": Serbian has no models page; the source links the Slovenian one
    '/en/press-releases/skoda-auto-kovo-union-reach-new-collective-labour-agreement/attachment/170313-skoda-logo/', // MR "Logo Kompanije"
  ],
  sl: ['/sk/tag/model/elroq-sk/', '/sk/tag/model/enyaq-sk/'], // Elroq, Enyaq: the Slovak tag pages
  sk: ['/cs/tiskove-zpravy/skoda-auto-odbory-kovo-dojednaly-novou-kolektivni-smlouvu/attachment/170313-skoda-logo-2/'], // MR "Logo spoločnosti"
};

const stripTags = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
// a path compared as the link rule writes it: no trailing slash, any case
const samePath = (p) => String(p).replace(/\/+$/, '').toLowerCase() || '/';
const ANCHOR = /<a\b[^>]*?\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * The language switcher: each paragraph whose links all read as a locale code
 * (`<p><strong>CZ</strong> <a href="/en">EN</a> …</p>`), as the markup it is in the fragment.
 * @param {string} html a fragment's .plain.html
 * @returns {string[]} the switcher paragraphs
 */
export function switcherBlocks(html) {
  return [...String(html).matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].map(([block]) => block)
    .filter((block) => {
      const anchors = [...block.matchAll(ANCHOR)];
      return anchors.length && anchors.every(([, , label]) => SWITCHER_CODE.test(stripTags(label)));
    });
}

/** The switcher's hrefs (decoded, trimmed). */
export function switcherHrefs(html) {
  return new Set(switcherBlocks(html).flatMap((block) => extractHrefs(block)));
}

/**
 * The locale tree an href points into (`/cs/…` on the demo or the live source), or null for
 * any other host, a root path or a non-locale path.
 * @param {string} href
 */
export function treeOf(href) {
  let url;
  try { url = new URL(href, 'https://example.com/'); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;
  if (url.hostname !== 'example.com' && !OWN_HOST.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  return m && TREES.includes(m[1]) ? m[1] : null;
}

/**
 * A fragment's links into another locale's tree, outside the switcher and the accepted ones.
 * The switcher is left out by position: a menu link to the same page as a switcher link counts.
 * @param {string} html the fragment's .plain.html
 * @param {string} locale the fragment's own locale (`cs`)
 * @param {string[]} [acceptedPaths] the accepted target paths (default: ACCEPTED[locale])
 * @returns {string[]} the offending hrefs, each once
 */
export function crossLocaleLinks(html, locale, acceptedPaths = ACCEPTED[locale] || []) {
  const accepted = new Set(acceptedPaths.map(samePath));
  const rest = switcherBlocks(html).reduce((h, block) => h.replace(block, ''), String(html));
  return [...new Set(extractHrefs(rest))].filter((href) => {
    const tree = treeOf(href);
    if (!tree || tree === locale) return false;
    return !accepted.has(samePath(new URL(href, 'https://example.com/').pathname));
  });
}

/**
 * The in-site paths of a fragment's links, after the runtime link policy (what a visitor's link
 * points at: `{ href }`, or null when the policy leaves it as authored), each once.
 * @param {string} html the fragment's .plain.html
 * @param {string} base the demo origin the fragment is served from
 */
export function sitePaths(html, base) {
  const page = `${base.replace(/\/$/, '')}/`;
  return [...new Set(extractHrefs(html)
    .map((href) => classify(policyHref(href, page)?.href ?? href, base))
    .filter((c) => c?.kind === 'site')
    .map((c) => c.path))];
}

// redirects followed before a link counts as unresolved (the site's own chains are 1–2 hops)
export const MAX_REDIRECTS = 5;

/**
 * A path's status on `base`: HEAD, redirects followed to their end (at most MAX_REDIRECTS hops),
 * a network error / 429 / 5xx retried twice. Only a 2xx at the end resolves; a redirect without a
 * Location, a loop or a chain past the limit answers with its last 3xx, so it is reported. A
 * redirect off the demo (to the live source) leaves the site: it resolves there. 0 when a hop never
 * answers.
 * @param {string} base
 * @param {string} path
 * @param {typeof fetch} [fetchImpl]
 */
export async function pathStatus(base, path, fetchImpl = fetch) {
  const head = async (url) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await fetchImpl(url, { method: 'HEAD', redirect: 'manual' });
        if (res.status !== 429 && res.status < 500) return res;
      } catch { /* retried */ }
    }
    return null;
  };
  const { origin } = new URL(base);
  const seen = new Set();
  let url = new URL(`${base}${path}`).href;
  let last = 0;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    seen.add(url);
    const res = await head(url);
    if (!res) return 0;
    last = res.status;
    if (res.status < 300 || res.status >= 400) return res.status;
    const location = res.headers?.get?.('location');
    if (!location) return res.status;
    let target;
    try { target = new URL(location, url); } catch { return res.status; } // an unparsable Location
    if (target.origin !== origin) return 200;
    if (seen.has(target.href)) return res.status; // a loop
    url = target.href;
  }
  return last; // past the redirect limit: the last 3xx, reported
}

/** Whether a pathStatus() result is a link that does not resolve: anything but a 2xx. */
export const isUnresolved = (status) => !(status >= 200 && status < 300);

/**
 * Checks the locales' fragments on `base`.
 * @returns {Promise<Array<{path: string, links: number, missing?: number, cross: string[],
 *   dead: Array<[string, number]>}>>}
 */
export async function checkFragments({ base, locales = LOCALES, fetchImpl = fetch } = {}) {
  const origin = base.replace(/\/$/, '');
  const seen = new Map();
  const status = (path) => {
    if (!seen.has(path)) seen.set(path, pathStatus(origin, path, fetchImpl));
    return seen.get(path);
  };
  const results = [];
  for (const locale of locales) {
    for (const fragment of FRAGMENTS) {
      const path = `/${locale}/${fragment}`;
      const res = await fetchImpl(`${origin}${path}.plain.html`);
      if (!res.ok) {
        results.push({
          path, links: 0, missing: res.status, cross: [], dead: [],
        });
        continue;
      }
      const html = await res.text();
      const checked = sitePaths(html, origin).map(async (p) => [p, await status(p)]);
      const dead = (await Promise.all(checked)).filter(([, s]) => isUnresolved(s));
      results.push({
        path, links: extractHrefs(html).length, cross: crossLocaleLinks(html, locale), dead,
      });
    }
  }
  return results;
}

/** The number of findings in checkFragments() results. */
export const findingCount = (results) => results
  .reduce((n, r) => n + (r.missing ? 1 : 0) + r.cross.length + r.dead.length, 0);

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }));
  const base = args.base || 'https://main--demo--skoda-storyboard.aem.live';
  const locales = args.locales ? String(args.locales).split(',') : LOCALES;
  const results = await checkFragments({ base, locales });
  results.forEach((r) => {
    const bad = r.missing || r.cross.length || r.dead.length;
    const notes = [
      r.missing ? `missing (${r.missing})` : `${r.links} links`,
      r.cross.length ? `another locale: ${r.cross.join(', ')}` : '',
      r.dead.length ? `not resolving: ${r.dead.map(([p, s]) => `${p} ${s}`).join(', ')}` : '',
    ].filter(Boolean);
    console.log(`${bad ? '✖' : '✔'} ${r.path}: ${notes.join(' | ')}`);
  });
  const findings = findingCount(results);
  console.log(findings ? `\n${findings} finding(s)` : '\nno findings');
  process.exitCode = findings ? 1 : 0;
}

const invoked = process.argv[1]
  && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
if (invoked) {
  main().catch((e) => {
    console.error(`check-locale-chrome: ${e.message}`);
    process.exitCode = 1;
  });
}
