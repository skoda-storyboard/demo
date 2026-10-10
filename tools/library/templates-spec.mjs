/*
 * SKODA-842: the DA page templates (library/templates/<key>). Each is the section, block and
 * Metadata structure of one canonical live page with its content replaced by prompts in
 * [brackets]. Fixed values (template, category, the sidebar newsletter card, the press-kit
 * banners and contacts) stay filled in. build-library.mjs writes them; the README lists the
 * fields an author must replace before publishing.
 */

const IMG = (ratio = '16x9', alt = '') => `<picture><img src="./images/placeholder-${ratio}.png" alt="${alt}"></picture>`;
const cell = (c) => `<div>${c}</div>`;
export const row = (...cells) => `<div>${cells.map(cell).join('')}</div>`;
export const block = (cls, ...rows) => `<div class="${cls}">${rows.join('')}</div>`;
const style = (s) => block('section-metadata', row('style', s));
export const section = (...parts) => `<div>${parts.join('')}</div>`;
const metadata = (pairs) => block('metadata', ...pairs.map(([k, v]) => row(k, v)));
const config = (pairs) => pairs.map(([k, v]) => row(k, v));

// Same on every story today; SKODA-840 replaces it with one fragment.
const NEWSLETTER_CARD = block(
  'newsletter-stub card',
  row('image', '<picture><img src="https://cdn.skoda-storyboard.com/dist/26.9.2/plugins/skoda-mailguide/newsletter_subscribe.webp" alt=""></picture>'),
  row('heading', 'Be the first<br> to get the latest stories'),
  row('label', 'Email address'),
  row('placeholder', 'Enter your e-mail'),
  row('button', 'Subscribe now!'),
  row('consent', 'Hereby I give my <a href="https://www.skoda-storyboard.com/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/">consent to the processing</a> of my personal data for the purposes of sending information about products, services and events related to Škoda Auto.'),
  row('manage', '<a href="https://www.skoda-storyboard.com/en/newsletter-settings/">Manage subscription</a>'),
  row('message', 'Newsletter signup is not available yet'),
  row('error', 'Please enter a valid e-mail address.'),
  row('consent-error', 'Please accept the terms before continuing.'),
  row('list', '389'),
  row('language', 'en_GB'),
);

// the Media Box band; the page Metadata table follows it in the last section
const mediaBox = (note) => [
  '<h2>Media Box</h2>',
  `<p>[${note}]</p>`,
  block(
    'downloads',
    row(IMG('4x3', '[Image title]'), '[Image title]', '<p><a href="/library/samples/original.jpg">Original</a></p><p><a href="/library/samples/original.jpg">1920px</a></p>'),
    row('', '[Document title]', '<a href="/library/samples/sample.pdf">PDF</a>'),
  ),
  style('dark, full-width, media-box'),
];

// the Tags block is left empty: it shows the page's `tags` metadata (one entry, SKODA-841)
const sidebarTags = (h) => `${h}Tags${h.replace('<', '</')}${block('tags', row(''))}`;

const additionalInfo = (images) => [
  '<h3>Additional info</h3>',
  '<ul><li><a href="https://www.skoda-storyboard.com/en/contacts/">Media contacts</a></li><li><a href="#media-box">Download Media Box</a></li></ul>',
  '<h3>Images</h3>',
  block('gallery preview', ...Array.from({ length: images }, (_, i) => row(IMG('4x3', `[Image ${i + 1} alt text]`), `[Image ${i + 1} caption]`))),
].join('');

const PRESS_CONTACTS = block('columns', row(
  '<strong>Vítězslav Kodym</strong><br> Head of Product Communications<br> +420 604 292 131<br> <a href="mailto:vitezslav.kodym@skoda-auto.cz">vitezslav.kodym@skoda-auto.cz</a>',
  '<strong>Jan Hrbek</strong><br> Spokesperson Product Communications<br> +420 730 867 534<br> <a href="mailto:jan.hrbek@skoda-auto.cz">jan.hrbek@skoda-auto.cz</a>',
));

const DATE_META = ['publisheddate', '[yyyy-mm-dd]'];
const facetMeta = (extra = []) => [
  ['tags', '[comma list: year, model and topics, e.g. 2026, elroq, design]'],
  ['model', '[model slug, e.g. elroq]'],
  ...extra,
  ['years', '[yyyy]'],
];

// The author note, DA /library/README
export const README = [
  section(
    '<h1>Library: start here</h1>',
    '<p>This folder holds the block library and the page templates. Nothing here is a page of the site: don\'t publish it, and don\'t link to it. Search engines are told not to index it.</p>',
    '<h2>Start a page from a template</h2>',
    '<ol><li>Create a new document in the right folder (a story in its category folder, e.g. /en/emobility; a press release in /en/press-releases; a press-kit chapter inside its kit\'s folder).</li><li>In the editor, open the Library panel, choose Templates and insert the template (Story, Press release, Press kit (hub), Press kit chapter, Model page).</li><li>Replace every text in [square brackets]. Delete the optional sections you don\'t need.</li><li>Fill in the Metadata table at the end. template and category are already set. publisheddate (yyyy-mm-dd), tags, model and years decide where the page appears in rails, listings and tag pages.</li></ol>',
    '<h2>Which blocks to use</h2>',
    '<p>Library, then Blocks, lists every block and variant with a description and an example. Insert one, then replace its content. The names in brackets are variants: Cards (overlay) is the Cards block with the overlay variant. Section Metadata lists the section styles (body-column, sidebar, dark, full-width, media-box, …).</p>',
    '<ul><li>Story Rail, Stories and Listing fill themselves from published pages. Only change their settings rows.</li><li>The Tags block in the templates is empty on purpose: it shows the tags from the Metadata table.</li><li>The newsletter card in the story sidebar is the same on every story. Don\'t edit it (SKODA-840 makes it one shared fragment).</li></ul>',
    '<h2>Publish order</h2>',
    '<ol><li>Fragments a page uses (e.g. /en/fragments/…): publish them first, or the live page shows an empty space.</li><li>Press kits: publish the chapters, then the hub.</li><li>The page: Preview, check it, then Publish.</li><li>Rails, listings and tag pages only list published pages, and their list can take up to two hours to show a new page.</li></ol>',
  ),
];

export const TEMPLATES = {
  story: {
    name: 'Story',
    from: '/en/emobility/the-skoda-peaq-will-win-you-over-fast',
    sections: [
      section(block(
        'hero-image',
        row(IMG('16x9', '[Hero image alt text]')),
        row('<h1>[Headline]</h1>'),
        row('[Lead paragraph: one or two sentences. Use the same text as the Description metadata.]'),
        row('[d. m. yyyy]<a href="/en/category/[category]">[Category name]</a>'),
      )),
      section(
        style('body-column'),
        '<p>[Body text. Paste a YouTube link on its own line to embed the video.]</p>',
        '<h2>[Subheading]</h2>',
        '<p>[Body text]</p>',
        block('gallery slider', ...[1, 2, 3].map((n) => row(IMG('16x9', `[Image ${n} alt text]`), ''))),
        '<p>[Body text]</p>',
      ),
      section(
        '<h3>[Highlight box heading (optional: delete this section if not needed)]</h3>',
        '<p>[Highlight box text]</p>',
        style('body-column, highlight-dark'),
      ),
      section(style('body-column'), '<p>[Consumption and emission note when a model is named, e.g. "Škoda Elroq: Combined WLTP energy consumption …"]</p>'),
      section(
        NEWSLETTER_CARD,
        '<h2>Explore more</h2>',
        block('cards overlay', ...[1, 2, 3].map((n) => row(IMG('4x3'), `<h3><a href="/en/[section]/[related-story-${n}-slug]">[Related story ${n} title]</a></h3>`))),
        sidebarTags('<h2>'),
        style('sidebar'),
      ),
      section(...mediaBox('N images')),
      section(
        '<h2>Related Stories</h2>',
        '<p>Based on tags: [tags]</p>',
        block('story-rail', ...config([['template', 'story'], ['model', '[model slug]'], ['years', '[yyyy]'], ['limit', '10'], ['exclude', '[this page\'s slug]']])),
        style('dark'),
        metadata([
          ['Title', '[Headline]'],
          ['Description', '[Lead paragraph]'],
          ['Image', IMG('16x9')],
          DATE_META,
          ['template', 'story'],
          ['category', '[main category: models, emobility, lifestyle, skoda-world, …]'],
          ['categories', '[comma list of every category, e.g. emobility, models]'],
          ...facetMeta(),
        ]),
      ),
    ],
  },

  'press-release': {
    name: 'Press release',
    from: '/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence',
    sections: [
      section('<p>[d. m. yyyy]</p>', '<h1>[Headline]</h1>'),
      section(
        `<p>${IMG('16x9', '[Lead image alt text]')}</p>`,
        '<ul><li>[Key point]</li><li>[Key point]</li><li>[Key point]</li></ul>',
        '<p><strong>[Mladá Boleslav, d Month yyyy – Lead paragraph. Use the same text as the Description metadata.]</strong></p>',
        block('quote', row('“[Quote]”', '<strong>[Name, role]</strong>')),
        '<p><strong>[Subheading]</strong><br>[Body text]</p>',
        '<p><strong>[Subheading]</strong><br>[Body text]</p>',
        style('body-column'),
      ),
      section(additionalInfo(4), sidebarTags('<h3>'), style('sidebar')),
      section(...mediaBox('N images, N PDF'), metadata([
        ['Title', '[Headline]'],
        ['Description', '[Lead paragraph]'],
        ['Image', IMG('16x9')],
        DATE_META,
        ['template', 'press_release'],
        ['category', 'press-releases'],
        ...facetMeta([['technology', '[optional, e.g. hybrid, electromobility]']]),
      ])),
    ],
  },

  'press-kit': {
    name: 'Press kit (hub)',
    from: '/en/press-kits/skoda-epiq-press-kit-2',
    sections: [
      section(block(
        'hero-image overlay',
        row(IMG('16x9', '[Model] – Press Kit')),
        row('<h1>[Model] – Press Kit</h1><p>[Lead paragraph. Use the same text as the Description metadata.]</p>'),
      )),
      section(block(
        'cards overlay tiles',
        ...['Introduction', 'Exterior'].map((t) => row('feature', IMG('4x3', t), `<a href="/en/press-kits/[kit-slug]/[chapter-slug]">${t}</a>`)),
        // a press row is 20 units: feature 8 + feature 8 + press-square 4, then 5 × press-square
        ...['Interior', 'Technical data', 'Frequently Asked Questions', 'Texts', 'Images', 'Videos'].map((t) => row('press-square', IMG('4x3', t), `<a href="/en/press-kits/[kit-slug]/[chapter-slug]">${t}</a>`)),
      )),
      section(
        '<p><a href="http://go.skoda.eu/whatsapp"><picture><img src="https://cdn.skoda-storyboard.com/2024/09/ikony_sb_landscape_WA_EN_f66c79bf.png" alt="Follow Škoda Storyboard on WhatsApp"></picture></a></p>',
        '<p><a href="[link to the press kit ZIP]"><picture><img src="https://cdn.skoda-storyboard.com/2023/10/ikony_sb_landscape_down_EN_E_dca67e28.png" alt="Download the press kit ZIP"></picture></a></p>',
        style('press-kit-banners'),
        metadata([
          ['Title', '[Model] – Press Kit'],
          ['Description', '[Lead paragraph]'],
          ['Image', IMG('16x9')],
          DATE_META,
          ['template', 'press_kit'],
          ['category', 'press-kits'],
          ['tags', '[comma list, e.g. epiq, suv, electromobility]'],
          ['model', '[model slug, e.g. epiq]'],
          ['bodywork', '[optional, e.g. suv]'],
          ['technology', '[optional, e.g. electromobility]'],
        ]),
      ),
    ],
  },

  'press-kit-chapter': {
    name: 'Press kit chapter',
    from: '/en/press-kits/skoda-epiq-press-kit-2/interior-designed-for-space-intuitive-use-and-everyday-convenience',
    sections: [
      section('<p>[d. m. yyyy]</p>', '<h1>[Chapter headline]</h1>'),
      section(
        '<ul><li><a href="#chapters-links">Chapters</a></li><li><a href="/en/press-kits/[kit-slug]">[Model] – Press Kit</a></li><li><a href="/en/press-kits/[kit-slug]/[chapter-slug]">[Chapter 1]</a></li><li><a href="/en/press-kits/[kit-slug]/[chapter-slug]">[Chapter 2]</a></li><li><a href="/en/press-kits/[kit-slug]/[chapter-slug]">[Chapter 3]</a></li></ul>',
        style('press-kit-chapters'),
      ),
      section(
        `<p>${IMG('16x9', '[Chapter image alt text]')}</p>`,
        '<p><strong>› [Key point]</strong><br><strong>› [Key point]</strong><br><strong>› [Key point]</strong></p>',
        '<p><strong>[Mladá Boleslav, d Month yyyy – Lead paragraph. Use the same text as the Description metadata.]</strong></p>',
        block('accordion', row('<h2>[Topic 1]</h2>', '<p>[Body text]</p>'), row('<h2>[Topic 2]</h2>', '<p>[Body text]</p>')),
        '<p>[Footnotes, if any]</p>',
        block('columns callout', row('<picture><img src="https://cdn.skoda-storyboard.com/2024/11/whatsapp_66fb5aee.png" alt="WhatsApp"></picture>', 'Explore the new ‘What’s up, Škoda?’ channel: <a href="http://go.skoda.eu/whatsapp">go.skoda.eu/whatsapp</a>')),
        block('columns banners', row(
          '<a href="[link to the chapter PDF]" title="Download PDF"><picture><img src="https://cdn.skoda-storyboard.com/2019/02/download-en.png" alt="Download PDF"></picture></a>',
          '<a href="mailto:?body=https://www.skoda-storyboard.com/en/press-kits/[kit-slug]/" title="Share by email"><picture><img src="https://cdn.skoda-storyboard.com/2019/02/share-en.png" alt="Share by email"></picture></a>',
        )),
        PRESS_CONTACTS,
        style('body-column'),
      ),
      section(additionalInfo(4), '<p><a href="#media-box">[+N]</a></p>', sidebarTags('<h3>'), style('sidebar')),
      section(...mediaBox('N images, N PDFs'), metadata([
        ['Title', '[Chapter headline]'],
        ['Description', '[Lead paragraph]'],
        ['Image', IMG('16x9')],
        DATE_META,
        ['template', 'press_kit_chapter'],
        ['theme', 'press-kit'],
        ['presskit', '/en/press-kits/[kit-slug]'],
        ['category', 'press-kits'],
        ...facetMeta([['bodywork', '[optional, e.g. suv]'], ['technology', '[optional, e.g. electromobility]']]),
        ['view', '[optional chapter topic, e.g. interior]'],
      ])),
    ],
  },

  'model-page': {
    name: 'Model page',
    from: '/en/skoda-model/elroq',
    sections: [
      section(block('hero-image overlay', row(IMG('16x9', '[Model] header image')), row('<p>Models</p><h1>[Model name]</h1>'))),
      section('<ul><li><a href="#model-description">Model Description</a></li><li><a href="#highlights">Key Facts</a></li><li><a href="#technical-data">Technical Data</a></li><li><a href="#bodywork--derivatives">Bodywork / Derivatives</a></li><li><a href="#news">News</a></li><li><a href="#press-kits">Press Kits</a></li><li><a href="#stories">Stories</a></li><li><a href="#images">Images</a></li><li><a href="#videos">Videos</a></li></ul>'),
      section('<h2>Model Description</h2>', '<p>[Model description. Use the same text as the Description metadata.]</p>'),
      section('<h2>Highlights</h2>', block('cards key-facts', ...[1, 2, 3].map((n) => row(IMG('4x3'), `<h3>[Highlight ${n}]</h3><p>[Highlight text]</p>`)))),
      section(
        `<p>${IMG('16x9')}</p>`,
        '<h2>Technical Data</h2>',
        block(
          'columns',
          row('<p><strong>[140 – 220 kW]</strong></p><p>Maximum performance</p>', '<p><strong>[350 – 545 Nm]</strong></p><p>Maximum torque</p>', '<p><strong>[160 – 180 km/h]</strong></p><p>Maximum speed</p>'),
          row('<p><strong>[6.2 – 8.5 s]</strong></p><p>Acceleration 0 – 100 km/h</p>', '<p><strong>[470 l]</strong></p><p>Boot capacity</p>', '<p><strong>[403 – 577 km]</strong></p><p>Range</p>'),
        ),
        '<p><a href="[link to the technical data PDF]">Download PDF</a></p>',
      ),
      section('<h2>Bodywork / Derivatives</h2>', block('story-rail', ...config([['template', 'skoda_model'], ['path', '/en/skoda-model/[model-slug]/']]))),
      section('<h2>News</h2>', '<p>Based on tags: [Model]</p>', block('story-rail', ...config([['template', 'press_release'], ['model', '[model-slug]'], ['viewall', '<a href="/en/tag/model/[model-slug]">All</a>']]))),
      section('<h2>Press Kits</h2>', '<p>Based on tags: [Model]</p>', block('story-rail', ...config([['template', 'press_kit'], ['model', '[model-slug]'], ['viewall', '<a href="https://www.skoda-storyboard.com/en/press-kits/?filter%5Bmodel%5D%5B%5D=[model-slug]">All</a>']]))),
      section('<h2>Stories</h2>', '<p>Based on tags: [Model]</p>', block('story-rail', ...config([['template', 'story'], ['model', '[model-slug]']]))),
      section('<h2>Images</h2>', '<p>Based on tags: [Model]</p>', block('story-rail', ...config([['index', '/en/media-feed.json'], ['template', 'image'], ['model', '[model-slug]'], ['limit', '20'], ['viewall', '<a href="/en/images?filter%5Bmodel%5D%5B%5D=[model-slug]">All</a>']]))),
      section(
        '<h2>Videos</h2>',
        '<p>Based on tags: [Model]</p>',
        block('story-rail', ...config([['index', '/en/media-feed.json'], ['template', 'video'], ['model', '[model-slug]'], ['limit', '20'], ['viewall', '<a href="/en/videos?filter%5Bmodel%5D%5B%5D=[model-slug]">All</a>']])),
        metadata([
          ['Title', '[Model name]'],
          ['Description', '[Model description]'],
          ['Image', IMG('16x9')],
          DATE_META,
          ['template', 'skoda_model'],
          ['category', 'skoda-model'],
          ['tags', '[model slug]'],
          ['model', '[model slug]'],
        ]),
      ),
    ],
  },
};
