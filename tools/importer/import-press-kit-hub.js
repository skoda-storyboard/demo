/* global WebImporter */

import parseHero from './parsers/press-kit-hub-hero.js';
import parseTiles from './parsers/press-kit-hub-tiles.js';
import metadata from './transformers/skoda-metadata.js';
import links from './transformers/skoda-links.js';
import normalizeImages from './transformers/skoda-images.js';

// The kit's facets live only in its article classes (a hub has no Tags sidebar): every facet
// of the shared 15-facet set (SKODA-401; skoda-metadata.js FACETS), so a kit is found under any
// listing filter its source is (SKODA-808: derivative, years, …).
const FACETS = [
  'model', 'bodywork', 'derivative', 'motorsport', 'equipment', 'technology', 'years', 'view',
  'company', 'concept', 'environment', 'happening', 'history', 'sponsorship', 'vip',
];

// The `years` class holds the source term id (`years-61572`), the listing filters on the year
// (`filter[years][]=2026`). Read from the source year archives `/en/tag/years/<year>/` (their
// body class `term-<id>`): 2014 to 2026, checked 2026-10-12 (2013 and earlier, and 2027, 404).
// The publish date is no substitute: the Elroq kit is tagged 2025 but was published in December
// 2024. A new year term (2027 from 02 Jan 2027) needs its id here: an unmapped one is reported
// per page (`unmappedTermIds` in the import report), see SKODA-METADATA-SCHEMA.md.
export const YEAR_TERMS = new Map([
  ['4781', '2014'], ['1872', '2015'], ['1572', '2016'], ['11039', '2017'], ['17169', '2018'],
  ['23835', '2019'], ['29912', '2020'], ['29936', '2021'], ['42472', '2022'], ['46476', '2023'],
  ['48727', '2024'], ['57053', '2025'], ['61572', '2026'],
]);

/**
 * A facet class value as its listing slug: a years term id becomes its year; any other numeric
 * id has no slug and gives '' (as skoda-metadata.js drops it). Pure.
 */
export function facetValue(facet, value) {
  if (!/^\d+$/.test(value)) return value;
  return facet === 'years' ? YEAR_TERMS.get(value) || '' : '';
}

/**
 * The kit's facets from its article classes, and the numeric term ids that could not be mapped
 * (`<facet>-<id>`, in class order). Pure: the caller reports the unmapped ids.
 * @returns {{ facets: object, unmapped: string[] }}
 */
export function sourceFacets(article) {
  const facets = { template: 'press_kit', category: 'press-kits' };
  const tags = [];
  const unmapped = [];
  FACETS.forEach((facet) => {
    const values = [];
    [...article.classList].filter((cls) => cls.startsWith(`${facet}-`)).forEach((cls) => {
      const raw = cls.slice(facet.length + 1);
      const value = facetValue(facet, raw);
      if (value) values.push(value);
      else if (/^\d+$/.test(raw)) unmapped.push(cls);
    });
    const unique = [...new Set(values)];
    if (unique.length) {
      facets[facet] = unique.join(', ');
      tags.push(...unique);
    }
  });
  if (tags.length) facets.tags = [...new Set(tags)].join(', ');
  return { facets, unmapped };
}

// Banner ZIP download hrefs (SKODA-832). Applied to the hub banners only; every other link
// keeps the shared skoda-links policy.
//
// Rule: `www.skoda-storyboard.com/direct-download/<path>.zip` 301s to a signed, expiring S3 URL.
// The same object is served at `cdn.skoda-storyboard.com/<path>.zip` (200 application/zip),
// which is where the other hubs' banners already point. Checked on 2026-10-08 for IAA 2019
// (2019/11), Kodiaq (2023/06) and Superb (2023/07).
const SOURCE_HOSTNAME = /^(?:www\.)?skoda-storyboard\.com$/i;
const DIRECT_DOWNLOAD_PREFIX = '/direct-download/';
const CDN_ORIGIN = 'https://cdn.skoda-storyboard.com';

// Explicit corrections of verified dead banner ZIP links (approved by the user, checked on
// 2026-10-08), keyed by the href without query or fragment. The 2020 Octavia kit links its
// ZIP without the extension: the bare URL returns 403 (no such S3 object) and the `.zip`
// returns 200 application/zip.
const BANNER_ZIP_CORRECTIONS = new Map([
  ['https://cdn.skoda-storyboard.com/2020/04/SKODA-OCTAVIA', 'https://cdn.skoda-storyboard.com/2020/04/SKODA-OCTAVIA.zip'],
]);

function bannerHref(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  // A query string would make it something other than a plain object path: leave it.
  if (url.search) return href;
  // The fragment (e.g. a rotating `#s_aid=`) is kept here and stripped later by skoda-links.
  const correction = BANNER_ZIP_CORRECTIONS.get(`${url.origin}${url.pathname}`);
  if (correction) return `${correction}${url.hash}`;
  const isDirectDownloadZip = SOURCE_HOSTNAME.test(url.hostname)
    && url.pathname.startsWith(DIRECT_DOWNLOAD_PREFIX)
    && /\.zip$/i.test(url.pathname);
  if (!isDirectDownloadZip) return href;
  return `${CDN_ORIGIN}/${url.pathname.slice(DIRECT_DOWNLOAD_PREFIX.length)}${url.hash}`;
}

// Banners whose source alt is only the image file name, by the slug of the page they open:
// that page's source title (h1, checked 2026-10-13).
const BANNER_PAGE_TITLES = {
  'skoda-auto-celebrates-more-than-130-years-of-craftsmanship-and-innovation':
    'Škoda Auto celebrates more than 130 years of craftsmanship and innovation',
  'skoda-museum': 'Škoda Museum',
  '60-years-of-the-trekka-an-suv-from-new-zealand': '60 years of the Trekka: an SUV from New Zealand',
  'skoda-octavia-turns-30-three-decades-of-a-brand-icon': 'Škoda Octavia turns 30: Three decades of a brand icon',
  '125-years-of-skoda-motorsport': '125 years of Škoda Motorsport',
};

// The source banner images carry no useful alt; name them by what the link does.
function bannerAlt(href, img) {
  // A ZIP is also recognised by its banner image name, for a source link that lacks the
  // extension and is not in BANNER_ZIP_CORRECTIONS.
  if (/\.zip(?:$|[?#])/i.test(href) || /download/i.test(img.getAttribute('src').split('/').pop())) {
    return 'Download the press kit ZIP';
  }
  if (/whatsapp/i.test(href)) return 'Follow Škoda Storyboard on WhatsApp';
  // The Threads and Spotify banners (Vision O) name themselves in the image text.
  if (/^https?:\/\/(?:www\.)?threads\.(?:com|net)\//i.test(href)) {
    return 'Škoda on Threads: the latest news and updates from the world of Škoda';
  }
  if (/^https?:\/\/open\.spotify\.com\//i.test(href)) return 'Listen to the #ExploreŠkoda Podcast on Spotify';
  if (/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/skodaautonews\/?$/i.test(href)) {
    return 'Follow @skodaautonews on the X platform';
  }
  const alt = (img.getAttribute('alt') || img.getAttribute('title') || '').trim();
  // WordPress fills an unset alt with the file name (Classic Days 2026:
  // `ClassicDays-Button-1670x800-Museum-EN_3ac482ac`): not a name. The banner is named by
  // the page it opens: its source title where known, else its readable slug.
  const fileStem = img.getAttribute('src').split('/').pop().replace(/\.[a-z0-9]+(?:[?#].*)?$/i, '');
  if (alt && alt !== fileStem) return alt;
  const slug = href.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop();
  if (BANNER_PAGE_TITLES[slug]) return BANNER_PAGE_TITLES[slug];
  if (alt && slug) {
    const words = decodeURIComponent(slug).replace(/-+/g, ' ').replace(/\bskoda\b/gi, 'Škoda');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  throw new Error(`Press-kit hub banner has no accessible name: ${href}`);
}

function bannerLinks(content, document) {
  return [...content.querySelectorAll('.widget_sow-editor .textwidget a[href]')]
    .filter((a) => a.querySelector('img[src]'))
    .map((source) => {
      const link = document.createElement('a');
      link.href = bannerHref(source.href);
      const img = source.querySelector('img').cloneNode(true);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.alt = bannerAlt(link.href, source.querySelector('img'));
      link.append(img);
      const p = document.createElement('p');
      p.append(link);
      return p;
    });
}

// An X (Twitter) timeline embed is a third-party widget, not kit content; it is dropped. The
// runner's browser renders it, so match the rendered iframe and script as well as the anchor.
const isTimeline = (widget) => !!widget.querySelector(
  '.twitter-timeline, iframe[src*="twitter.com"], script[src*="platform.twitter.com"]',
);

// Text widgets (no banner image, no timeline): those before the first tile are the kit's
// introduction; those after it are the press contacts of older default-template kits, kept
// one Columns row per source grid, as their cells sit side by side.
function textWidgets(content, document) {
  const order = [...content.querySelectorAll('article.article-teaser, .widget_sow-editor .textwidget')];
  const firstTile = order.findIndex((node) => node.matches('article.article-teaser'));
  const intro = [];
  const contacts = new Map();
  order.filter((node) => node.matches('.textwidget'))
    .filter((widget) => !widget.querySelector('img') && !isTimeline(widget) && widget.textContent.trim())
    .forEach((widget) => {
      const children = [...widget.children].map((child) => child.cloneNode(true));
      if (firstTile < 0 || order.indexOf(widget) < firstTile) {
        intro.push(...children);
        return;
      }
      const grid = widget.closest('.panel-grid') || content;
      if (!contacts.has(grid)) contacts.set(grid, []);
      contacts.get(grid).push(children);
    });
  const outro = [...contacts.values()].flatMap((cells) => (cells.length > 1
    ? [WebImporter.DOMUtils.createTable([['Columns'], cells], document)]
    : cells[0]));
  return { intro, outro };
}

// Some older kits' og:description is the X timeline's fallback text ("Tweets by skodaautonews"):
// use the hero perex instead, or no description at all.
function leakedDescription(document, hero) {
  const og = document.querySelector('meta[property="og:description"]');
  if (!/^\s*Tweets by\b/i.test(og?.content || '')) return undefined;
  og.remove();
  return hero.querySelector('.hero-caption .perex')?.textContent.trim() || undefined;
}

export default {
  transform: ({ document, url, params }) => {
    const article = document.querySelector('article.press_kit');
    const hero = article?.querySelector(':scope > .hero');
    const content = article?.querySelector(':scope > .content');
    if (!article || !hero || !content) throw new Error('Expected a press-kit tiles hub with hero and content');
    const { facets, unmapped } = sourceFacets(article);
    if (unmapped.length) {
      // eslint-disable-next-line no-console
      console.warn(`press-kit hub ${params.originalURL}: unmapped term ids ${unmapped.join(', ')}, facet not set`);
    }
    const description = leakedDescription(document, hero);
    if (description) facets.description = description;
    const heroBlock = parseHero(hero, document);
    const tilesBlock = parseTiles(content, document);
    const banners = bannerLinks(content, document);
    const { intro, outro } = textWidgets(content, document);

    const main = document.body;
    main.replaceChildren(article);
    article.replaceChildren(heroBlock);
    if (intro.length) article.append(document.createElement('hr'), ...intro);
    article.append(document.createElement('hr'), tilesBlock);
    if (banners.length) {
      article.append(document.createElement('hr'), ...banners);
      article.append(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { Style: 'press-kit-banners' },
      }));
    }
    if (outro.length) article.append(document.createElement('hr'), ...outro);
    const payload = {
      document, url, params, template: { metadata: facets },
    };
    metadata('afterTransform', main, payload);
    links('afterTransform', main, payload);
    WebImporter.rules.transformBackgroundImages(main, document);
    normalizeImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const pathname = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(pathname || '/index'),
      report: {
        title: document.title,
        template: 'press-kit-hub',
        blocks: ['hero', 'tiles'],
        // a new source year term (or another facet's numeric id) to map in YEAR_TERMS
        ...(unmapped.length ? { unmappedTermIds: unmapped.join(', ') } : {}),
      },
    }];
  },
};
