// SKODA-842: the author-facing DA library spec per block: description (purpose, settings, what an
// omitted row does) and the variants offered, each as its class tokens + label + description.
// Variants come from tools/importer/push/block-contracts.json (main + pending) and the variants
// live pages use; descriptions from the block JS. library-check.mjs keeps the three in step:
// edit this file with a block or contract change, then rebuild the library (README.md).

export const EXCLUDED = {
  header: 'loaded automatically from the nav fragment (/nav, /media-room/nav)',
  footer: 'loaded automatically from the footer fragment (/footer, /media-room/footer)',
  'float-dock': 'code-only: the share / media-cart / scroll-to-top bar is added to every page by scripts.js',
  carousel: 'presentation only: the rails (Story Rail) build it; not authored on its own',
  hero: 'legacy, unused on any page: use Hero Image',
  widget: 'boilerplate widget loader, unused on any page',
};

export const SPEC = {
  accordion: {
    structure: 'title-body-expandable',
    purpose: 'expandable question/answer or label/content pairs',
    description: 'Expandable rows: first cell = the label (question), second cell = the content. One row per item.',
    variants: [
      { class: 'faq', label: 'faq', description: 'FAQ chapter of a press kit: same rows, and the page gets FAQPage structured data for search engines.' },
    ],
  },
  cards: {
    structure: 'image-body repeating',
    purpose: 'card grid: image + linked title + text, one row per card',
    description: 'One row per card: cell 1 = image, cell 2 = title (as a link to the target page) and optional text. Use Story Rail or Stories instead when the cards should list pages automatically.',
    variants: [
      { class: 'overlay', label: 'overlay', description: 'Title over the image (dark gradient), as the "Explore more" cards in the story sidebar.' },
      { class: 'overlay tiles', label: 'overlay, tiles', description: 'Mosaic of tiles for series hubs and press-kit hubs. Each row starts with a size cell, then the image and the linked title. Every mosaic row must fill up exactly, or its last tile gets "end" (e.g. "press-square end"). Press-kit hubs, rows of 20: feature 8 (the first two chapters), press-half 10, press-quarter 5, press-square 4. Series hubs, rows of 12: banner / banner-tall 12, two-thirds 8, sq / wide 6, third / third-sq 4, quarter / sq-small 3.' },
      { class: 'key-facts', label: 'key-facts', description: 'Model page "Highlights": square image + h3 title + text per row. Keep the "Highlights" heading above the block as normal text.' },
      { class: 'social', label: 'social', description: 'Home page social profiles: one row per profile, one cell with a link whose text is the handle (e.g. @skodaglobal). Put it in a section with Style "cover-box, dark".' },
      { class: 'series-directory', label: 'series-directory', description: 'The Series directory page: one row per series, image + linked title + excerpt below the image.' },
      { class: 'media', label: 'media', description: 'Media card: image with a media-style caption below.' },
      { class: 'toolbar', label: 'toolbar', description: 'Card with an action row: each link in the last cell becomes a pill button (can be combined, e.g. Cards (overlay, toolbar)).' },
    ],
  },
  columns: {
    structure: 'cells side by side',
    purpose: 'two or more content cells side by side',
    description: 'One row, one cell per column (text, images, links). On phones the columns stack.',
    variants: [
      { class: 'split-62 portrait-235', label: 'split-62, portrait-235', description: 'Unequal story row: the first cell takes 62% (split-NN = NN%); portrait-NNN is the display width in px of a portrait image in the other cell. Values are read from the class, so use the exact form split-NN / portrait-NNN.' },
      { class: 'banners', label: 'banners', description: 'Press kit: a row of linked banner images at their authored size (PDF download / share buttons).' },
      { class: 'callout', label: 'callout', description: 'Press kit: [icon, text], a small 50px icon beside its text (the WhatsApp callout).' },
      { class: 'stats', label: 'stats', description: 'Model page technical data: each cell is a key figure, the value in bold and its label below.' },
    ],
  },
  downloads: {
    structure: 'image-title-links repeating',
    purpose: 'downloadable assets with sizes and add-to-media-cart',
    description: 'One row per asset: an image cell, a title cell, and a links cell whose link texts are the sizes (Original, 1920px; PDF, MP4). Optional date cell (d. m. yyyy). Optional settings rows first: collapse (auto / none), columns (a whole number). A bad collapse or columns value stops the block.',
    variants: [
      { class: 'media-box', label: 'media-box', description: 'The Media Box at the end of a story, release or press-kit chapter: titles as headings, dates, size menu, "Show more" after two rows, lightbox on the images. Put it in a section with Style "dark, full-width, media-box" and an h2 "Media Box".' },
      { class: 'gallery', label: 'gallery', description: 'Press-kit Images chapter group: thumbnails with add / download over the image and the "Original / 1920px" pills above the group.' },
    ],
  },
  embed: {
    structure: 'config or bare url',
    purpose: 'video / podcast embed',
    description: 'A YouTube, Vimeo, Buzzsprout or Spotify URL. A bare link on its own line also works. Settings rows: url, ratio (e.g. 16:9), title, poster (image). An .mp4 url plays as a native video with the poster.',
    variants: [
      { class: 'vimeo', label: 'vimeo', description: "A source Vimeo clip: rows url (the vimeo.com link), file (the clip's MP4 master) and title. It plays in the Vimeo player where Vimeo allows this site, else the MP4 with the same Vimeo-style controls (play, progress, volume, speed, picture-in-picture, fullscreen)." },
    ],
  },
  footnotes: {
    structure: 'single cell text',
    purpose: 'small-print footnotes',
    description: 'Footnotes in small type at the end of the text (e.g. "¹ Available at a later date."). One cell; paragraphs and lists are kept as authored.',
    variants: [],
  },
  fragment: {
    structure: 'single link',
    purpose: 'include a shared document',
    description: 'Inserts another document here: one cell with a link to the fragment page (e.g. /en/fragments/...). Publish the fragment, or the live page shows nothing.',
    variants: [],
  },
  gallery: {
    structure: 'image-caption repeating',
    purpose: 'image gallery with lightbox',
    description: 'One row per image: cell 1 = image, cell 2 = caption. Opens an accessible lightbox.',
    variants: [
      { class: 'slider', label: 'slider', description: 'In-body story carousel: one image at a time with arrows and dots; a caption per slide.' },
      { class: 'preview', label: 'preview', description: 'Press release / press-kit sidebar: a few thumbnails with a "+N" link to the Media Box.' },
      { class: 'story', label: 'story', description: 'Story in-body gallery: a large lead image with the image count, then a strip of the next four thumbnails. Every image opens the lightbox.' },
    ],
  },
  'hero-image': {
    structure: 'image-title single',
    purpose: 'page hero',
    description: 'Story hero: the image, then the h1 title and the lead paragraph. One per page, at the top.',
    // the contract's `story` variant is this default (no class)
    aliases: ['story'],
    variants: [
      { class: 'overlay', label: 'overlay', description: 'Model, series and press-kit hubs: title (and an optional label line) over the image.' },
      { class: 'archive', label: 'archive', description: 'Category and tag archive pages: a banner image row (may stay empty) and the h1 with one line per label.' },
    ],
  },
  listing: {
    structure: 'config only',
    purpose: 'faceted listing of indexed pages',
    description: 'News / Images / Videos / Press Kits listing with filters. Settings only: template (press_release, press_kit, image, video), facets (comma list, e.g. model, years, company), facetlabels, sort (newest), perpage (6), columns (3 or 4), index, path. Pages appear after they are published.',
    variants: [],
  },
  'media-cart': {
    structure: 'empty',
    purpose: 'the media cart page',
    description: 'Only on the media cart page (/en/media-cart), under an h1. Leave the block empty: it shows the visitor\'s own cart.',
    variants: [],
  },
  'newsletter-stub': {
    structure: 'config only',
    purpose: 'newsletter sign-up form',
    description: 'Newsletter sign-up form (not connected to the mailing service yet). Settings: label, placeholder, button, consent (may contain a link), manage (link), message (shown after submit), list, language. Omit consent for no checkbox.',
    variants: [
      { class: 'card', label: 'card', description: 'Story sidebar card: adds image, heading, error and consent-error rows. Today every story carries its own copy (SKODA-840 moves it to one fragment).' },
      { class: 'topbar', label: 'topbar', description: 'The header "Subscribe to our stories" panel; authored once in /nav-newsletter.' },
    ],
  },
  'promo-box': {
    structure: 'config or curated rows',
    purpose: 'featured stories mosaic / slider',
    description: 'Home page featured stories. Either settings (template, path, category, tags, limit, sort) to pick the newest pages, or curated rows (one card per row). Never mix both.',
    variants: [],
  },
  quote: {
    structure: 'quote-author single',
    purpose: 'pull quote',
    description: 'A quotation: the quote text, then the author (bold) and their role.',
    variants: [
      { class: 'left', label: 'left', description: 'Quote aligned left with a vertical rule (press kits).' },
    ],
  },
  search: {
    structure: 'empty',
    purpose: 'search results page',
    description: 'Only on the search page (/en/search). Leave it empty: it shows the results for the query from the header search.',
    variants: [],
  },
  stories: {
    structure: 'config only',
    purpose: 'grid of story cards with Load more',
    description: 'Newest pages as a card grid with "Load more". Settings: template (story, press_release, …), category / categories, tag(s), heading, sort, initial, perpage, columns, offset, exclude, excludefeatured, feature. Pages appear after they are published.',
    variants: [],
  },
  'story-rail': {
    structure: 'config or curated rows',
    purpose: 'horizontal rail of cards',
    description: 'A horizontal rail. Settings: heading, template (story, press_release, press_kit, skoda_model, skoda_series, image, video), category, tag(s) or any facet (model, years, …), limit, sort, view-all (link), dots. Or curated rows (one card per row). Cards show each page\'s own title, description and image metadata.',
    variants: [
      { class: 'press', label: 'press', description: 'The dark "Related Press Releases" band at the end of a press release.' },
    ],
  },
  tags: {
    structure: 'links list',
    purpose: 'tag pills',
    description: 'The page\'s tags as pills: one link per tag to its archive (/en/tag/<facet>/<value>) or a News filter. Left empty, it shows the page\'s "tags" metadata as labels. Rails and archives read the metadata, not this block (SKODA-841).',
    variants: [
      { class: 'chips', label: 'chips', description: 'Green filter chips (facet contexts). A tag in bold is shown as selected.' },
      { class: 'chips outline', label: 'chips, outline', description: 'Outlined filter chips that fill green on hover or when selected.' },
    ],
  },
};

// Section Metadata Style tokens used on the site (section styles, not blocks)
export const SECTION_STYLES = [
  ['body-column', 'Story / release article column (two-column layout with the sidebar).'],
  ['sidebar', 'Story / release sidebar: newsletter card, Explore more, Tags.'],
  ['body-column, highlight-dark', 'Dark highlight box inside the article ("What has changed" lists).'],
  ['body-column, highlight-grey', 'Grey highlight box inside a press release (FAQ callout).'],
  ['dark, full-width, media-box', 'The Media Box band (holds the Media Box Downloads block).'],
  ['dark, full-width, related', 'The dark related band at the end of a press release.'],
  ['dark', 'Dark band (e.g. the Related Stories rail).'],
  ['cover-box', 'Home page light band.'],
  ['cover-box, dark', 'Home page dark band (Social media).'],
  ['cover-box, compact', 'Media Room home light band (News, Images, Videos; Latest Stories).'],
  ['cover-box, compact, dark', 'Media Room home dark band.'],
  ['press-kit-chapters', 'Press-kit chapter navigation section.'],
  ['press-kit-banners', 'Press-kit download banners section.'],
];
