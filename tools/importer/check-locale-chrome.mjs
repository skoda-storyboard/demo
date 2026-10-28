#!/usr/bin/env node
/**
 * Locale chrome check (SKODA-1006). Reads each locale's four chrome fragments (`/{loc}/nav`,
 * `/{loc}/footer`, `/{loc}/media-room/nav`, `/{loc}/media-room/footer`) and fails on
 *   - a link into another locale's tree (English included), outside the language switcher and the
 *     accepted exceptions below;
 *   - an in-site link that does not resolve (after the runtime link policy, scripts/links.js
 *     policyHref, so it reports what a visitor gets). Links to the live source host are not
 *     fetched: by link policy D-3 (b) they open the source in a new tab.
 *
 *   node tools/importer/check-locale-chrome.mjs [--base=https://main--demo--skoda-storyboard.aem.live]
 *     [--locales=cs,de,sk,sr,sl]
 *
 * Exit code 1 on any finding (a missing fragment counts as one).
 */
import { extractHrefs, classify } from './check-dead-links.mjs';
import { policyHref } from '../../scripts/links.js';

export const LOCALES = ['cs', 'de', 'sk', 'sr', 'sl'];
export const FRAGMENTS = ['nav', 'footer', 'media-room/nav', 'media-room/footer'];
const TREES = ['en', ...LOCALES];
const SWITCHER_CODE = /^(EN|CZ|CS|DE|SK|SR|SL)$/;

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

/**
 * The language switcher's hrefs: the anchors of a paragraph or list item whose links all read as
 * a locale code (`<strong>CZ</strong> <a href="/en">EN</a> …`).
 * @param {string} html a fragment's .plain.html
 * @returns {Set<string>}
 */
export function switcherHrefs(html) {
  const out = new Set();
  for (const [block] of String(html).matchAll(/<(p|li)\b[^>]*>[\s\S]*?<\/\1>/gi)) {
    const anchors = [...block.matchAll(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
    if (anchors.length && anchors.every(([, , text]) => SWITCHER_CODE.test(stripTags(text)))) {
      anchors.forEach(([, href]) => out.add(href.replace(/&amp;/g, '&')));
    }
  }
  return out;
}

/**
 * The locale tree an href points into (`/cs/…` on the demo or the live source), or null for
 * any other host, a root path or a non-locale path.
 * @param {string} href
 */
export function treeOf(href) {
  let url;
  try { url = new URL(href, 'https://example.com/'); } catch { return null; }
  const own = url.hostname === 'example.com' || /(^|\.)skoda-storyboard\.com$/i.test(url.hostname)
    || /\.aem\.(page|live)$/i.test(url.hostname);
  if (!own) return null;
  const m = url.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  return m && TREES.includes(m[1]) ? m[1] : null;
}

/**
 * A fragment's links into another locale's tree, outside the switcher and the accepted ones.
 * @param {string} html the fragment's .plain.html
 * @param {string} locale the fragment's own locale (`cs`)
 * @param {string[]} [acceptedPaths] the accepted target paths (default: ACCEPTED[locale])
 * @returns {string[]} the offending hrefs, each once
 */
export function crossLocaleLinks(html, locale, acceptedPaths = ACCEPTED[locale] || []) {
  const switcher = switcherHrefs(html);
  const accepted = new Set(acceptedPaths);
  return [...new Set(extractHrefs(html))].filter((href) => {
    if (switcher.has(href)) return false;
    const tree = treeOf(href);
    if (!tree || tree === locale) return false;
    return !accepted.has(new URL(href, 'https://example.com/').pathname);
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

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }));
  const base = (args.base || 'https://main--demo--skoda-storyboard.aem.live').replace(/\/$/, '');
  const locales = args.locales ? String(args.locales).split(',') : LOCALES;
  const status = new Map();
  const resolve = async (path) => {
    if (!status.has(path)) {
      status.set(path, fetch(`${base}${path}`, { method: 'HEAD', redirect: 'manual' })
        .then((r) => r.status).catch(() => 0));
    }
    return status.get(path);
  };
  let findings = 0;
  for (const locale of locales) {
    for (const fragment of FRAGMENTS) {
      const path = `/${locale}/${fragment}`;
      const res = await fetch(`${base}${path}.plain.html`);
      if (!res.ok) {
        findings += 1;
        console.log(`✖ ${path}: missing (${res.status})`);
        continue;
      }
      const html = await res.text();
      const cross = crossLocaleLinks(html, locale);
      const checked = sitePaths(html, base).map(async (p) => [p, await resolve(p)]);
      const dead = (await Promise.all(checked)).filter(([, s]) => s >= 400 || s === 0);
      findings += cross.length + dead.length;
      const mark = cross.length || dead.length ? '✖' : '✔';
      console.log(`${mark} ${path}: ${extractHrefs(html).length} links${cross.length ? ` | another locale: ${cross.join(', ')}` : ''}${dead.length ? ` | not resolving: ${dead.map(([p, s]) => `${p} ${s}`).join(', ')}` : ''}`);
    }
  }
  console.log(findings ? `\n${findings} finding(s)` : '\nno findings');
  process.exitCode = findings ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
