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
  if (/\.zip(?:$|[?#])/i.test(href)) return 'Download the press kit ZIP';
  if (/whatsapp/i.test(href)) return 'Follow Škoda Storyboard on WhatsApp';
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

export default {
  transform: ({ document, url, params }) => {
    const article = document.querySelector('article.press_kit');
    const hero = article?.querySelector(':scope > .hero');
    const content = article?.querySelector(':scope > .content');
    if (!article || !hero || !content) throw new Error('Expected a press-kit tiles hub with hero and content');
    const facets = sourceFacets(article);
    const heroBlock = parseHero(hero, document);
    const tilesBlock = parseTiles(content, document);
    const banners = bannerLinks(content, document);
    const intro = [...content.querySelectorAll('.widget_sow-editor .textwidget')]
      .filter((widget) => !widget.querySelector('img') && widget.textContent.trim())
      .flatMap((widget) => [...widget.children].map((child) => child.cloneNode(true)));

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
