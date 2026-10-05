/* global WebImporter */

import parseHero from './parsers/press-kit-hub-hero.js';
import parseTiles from './parsers/press-kit-hub-tiles.js';
import metadata from './transformers/skoda-metadata.js';
import links from './transformers/skoda-links.js';
import normalizeImages from './transformers/skoda-images.js';

const FACETS = ['model', 'bodywork', 'motorsport', 'history', 'technology'];

function sourceFacets(article) {
  const result = { template: 'press_kit', category: 'press-kits' };
  const tags = [];
  FACETS.forEach((facet) => {
    const values = [...article.classList]
      .filter((cls) => cls.startsWith(`${facet}-`))
      .map((cls) => cls.slice(facet.length + 1));
    if (values.length) {
      result[facet] = values.join(', ');
      tags.push(...values);
    }
  });
  if (tags.length) result.tags = [...new Set(tags)].join(', ');
  return result;
}

// The source banner images carry no useful alt; name them by what the link does.
function bannerAlt(href, img) {
  // The 2020 Octavia kit's download banner links the ZIP without its extension.
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
  if (alt) return alt;
  throw new Error(`Press-kit hub banner has no accessible name: ${href}`);
}

function bannerLinks(content, document) {
  return [...content.querySelectorAll('.widget_sow-editor .textwidget a[href]')]
    .filter((a) => a.querySelector('img[src]'))
    .map((source) => {
      const link = document.createElement('a');
      link.href = source.href;
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
    const facets = sourceFacets(article);
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
      report: { title: document.title, template: 'press-kit-hub', blocks: ['hero', 'tiles'] },
    }];
  },
};
