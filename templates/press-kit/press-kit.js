function sourceLinks(main) {
  main.querySelectorAll('a[href]').forEach((link) => {
    if (!/^https?:\/\/(?:www\.)?skoda-storyboard\.com\//i.test(link.href)) return;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

// The date + title section (not a hub hero) gets a class, so the header layout doesn't depend
// on section order.
function header(main) {
  const h1 = main.querySelector(':scope > .section > .default-content-wrapper > h1');
  h1?.closest('.section').classList.add('press-kit-header');
}

function chapters(main) {
  const section = main.querySelector('.section.press-kit-chapters');
  const list = section?.querySelector('.default-content-wrapper > ul');
  if (!list) return;
  // The source's Chapters bar is the page's top bar, above the date and title (SKODA-805c
  // review: at 1280 it sits at y108 and the date at 184). DA keeps it after the title.
  main.prepend(section);
  list.querySelector('a[href="#chapters-links"]')?.closest('li')?.remove();
  const { origin, pathname } = document.location;
  const here = pathname.replace(/\/$/, '');
  list.querySelectorAll('a[href]').forEach((link) => {
    if (link.origin === origin && link.pathname.replace(/\/$/, '') === here) {
      link.setAttribute('aria-current', 'page');
    }
  });
  const nav = document.createElement('nav');
  nav.className = 'press-kit-chapters-nav';
  nav.setAttribute('aria-label', 'Chapters');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Chapters';
  button.setAttribute('aria-controls', 'chapters-links');
  button.setAttribute('aria-expanded', 'false');
  list.id = 'chapters-links';
  list.hidden = true;
  button.addEventListener('click', () => {
    list.hidden = !list.hidden;
    button.setAttribute('aria-expanded', String(!list.hidden));
  });
  list.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  });
  nav.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || list.hidden) return;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  });
  list.replaceWith(nav);
  nav.append(button, list);
}

/*
 * The Media Box is one Downloads table (contract `downloads`). The Downloads block owns
 * everything inside it: image tiles, file tiles for PDF/MP4 rows, and the source-matched
 * Media Box disclosure (SKODA-510). A second template-level "Show more" would compete with
 * it, so the template only provides the anchor the sidebar's "+N" link targets.
 */
function mediaBox(main) {
  const section = main.querySelector('.section.media-box');
  if (section?.querySelector('.downloads')) section.id = 'media-box';
}

// The sidebar preview shows 4 images; the source's "+51" pill on the last one points at the
// rest, which are the Media Box. The import keeps it as a `+N` link after the gallery: hand it
// to the (not yet decorated) Gallery (preview) block, which draws the pill.
function galleryMore(main) {
  const gallery = main.querySelector('.section.sidebar .gallery.preview');
  const wrapper = gallery?.closest('.gallery-wrapper')?.nextElementSibling;
  const link = wrapper?.querySelector(':scope > p:first-child > a[href^="#"]');
  const [, count] = link?.textContent.trim().match(/^\+(\d+)$/) || [];
  if (!count) return;
  gallery.dataset.moreCount = count;
  gallery.dataset.moreHref = link.getAttribute('href');
  link.closest('p').remove();
}

const LABELS = {
  addAll: 'Add all files to the media cart',
  addVideo: (title) => (title ? `Add to media cart: ${title}` : 'Add to media cart'),
  downloadVideo: (title) => (title ? `Download ${title}` : 'Download video'),
  openVideo: (title) => (title ? `Open ${title}` : 'Open video'),
};

const isImageParagraph = (el) => el?.tagName === 'P' && !!el.querySelector('img') && !el.textContent.trim();

// a paragraph of links only ("PDF download   JPG download"), no image or other text
const isLinksParagraph = (el) => el?.tagName === 'P' && !el.querySelector('img')
  && !!el.querySelector('a[href]')
  && [...el.childNodes].every((node) => node.nodeName === 'A' || !node.textContent.trim());

/**
 * The runs of two or more media units in a cell, in order. A unit is an image paragraph and the
 * links paragraph right after it, if any.
 * @param {Element} cell
 * @returns {Element[][][]}
 */
export function mediaRuns(cell) {
  const runs = [];
  let run = [];
  const children = [...cell.children];
  for (let i = 0; i < children.length; i += 1) {
    if (isImageParagraph(children[i])) {
      const unit = [children[i]];
      if (isLinksParagraph(children[i + 1])) {
        i += 1;
        unit.push(children[i]);
      }
      run.push(unit);
    } else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

// An accordion answer's images are the source's two-cell rows (#275): each cell an image with
// its centred "PDF download / JPG download" links under it. Grouped before the Accordion block
// decorates, so its panel takes the groups with the rest of the answer.
function accordionMedia(main) {
  main.querySelectorAll('.section.body-column .accordion > div > div:nth-child(2)').forEach((cell) => {
    mediaRuns(cell).forEach((run) => {
      const row = document.createElement('div');
      row.className = 'press-kit-media-row';
      run[0][0].before(row);
      run.forEach(([image, links]) => {
        const media = document.createElement('div');
        media.className = 'press-kit-media';
        image.classList.add('press-kit-media-image');
        links?.classList.add('press-kit-media-links');
        media.append(...[image, links].filter(Boolean));
        row.append(media);
      });
    });
  });
}

// The cart loads only where a page has a control for it, as in the Downloads block.
const loadCart = () => import('../../scripts/media-cart.js');

function roundAction(tag, kind, label) {
  const el = document.createElement(tag);
  el.className = `press-kit-action ${kind}`;
  if (tag === 'button') el.type = 'button';
  el.setAttribute('aria-label', label);
  return el;
}

// The sidebar's "Download Media Box" row is the source's label and a round + that adds the
// whole Media Box to the cart (#275): it hands the click to the Media Box's own group toggle
// (blocks/downloads) and shows that toggle's state.
function sidebarMediaBox(main) {
  const link = main.querySelector('.section.sidebar .default-content-wrapper > ul > li > a[href="#media-box"]');
  const box = main.querySelector('.section.media-box');
  if (!link || !box?.querySelector('.downloads')) return;
  const label = document.createElement('span');
  label.append(...link.childNodes);
  const add = roundAction('button', 'add', LABELS.addAll);
  add.setAttribute('aria-disabled', 'true');
  const groupToggle = () => box.querySelector('.downloads-add-all');
  const sync = () => {
    const toggle = groupToggle();
    if (!toggle) return;
    ['aria-disabled', 'aria-pressed', 'aria-busy', 'aria-label', 'data-in-cart'].forEach((name) => {
      if (toggle.hasAttribute(name)) add.setAttribute(name, toggle.getAttribute(name));
      else add.removeAttribute(name);
    });
  };
  add.addEventListener('click', () => groupToggle()?.click());
  new MutationObserver(sync).observe(box, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-disabled', 'aria-pressed', 'aria-busy', 'aria-label', 'data-in-cart'],
  });
  link.closest('li').classList.add('press-kit-media-box-row');
  link.replaceWith(label, add);
}

// A clip's "Download video" link becomes the source's cart toolbar under the player (#275):
// add to cart, download, and a link to the clip itself (the source links its attachment page,
// which has no counterpart here).
function videoActions(main) {
  main.querySelectorAll('.section.body-column .embed-wrapper + .default-content-wrapper > p:first-child').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (links.length !== 1 || !/\.mp4(?:[?#]|$)/i.test(links[0].href) || !isLinksParagraph(p)) return;
    const [file] = links;
    const embed = p.closest('.default-content-wrapper').previousElementSibling.querySelector('.embed');
    const title = embed?.querySelector(':scope > div > div:last-child a')?.textContent.trim() || '';
    const add = roundAction('button', 'add', LABELS.addVideo(title));
    add.setAttribute('aria-disabled', 'true');
    const download = roundAction('a', 'download', LABELS.downloadVideo(title));
    download.href = file.href;
    download.setAttribute('download', '');
    const open = roundAction('a', 'link', LABELS.openVideo(title));
    open.href = file.href;
    p.classList.add('press-kit-actions');
    p.replaceChildren(add, download, open);
    loadCart().then(({ bindCartControl }) => bindCartControl(add, { href: file.href, title }))
      .catch((e) => {
        // the add stays disabled (set above)
        // eslint-disable-next-line no-console
        console.warn('press-kit: the media cart did not load', e);
      });
  });
}

const FULL_IMAGE = /\.(?:jpe?g|png|webp)$/i;

// The article's linked images (the lead and the answers' photos) open their full-size image in
// the site lightbox, as the source's colorbox does (#275). Until the lightbox has loaded, a click
// follows the link to the image.
function imageLinks(main) {
  const links = [...main.querySelectorAll('.section.body-column :is(.default-content-wrapper, .accordion) a[href]')]
    .filter((a) => a.querySelector(':scope > picture') && FULL_IMAGE.test(a.pathname));
  if (!links.length) return;
  import('../../scripts/media-lightbox.js').then(({ wireImageLinks }) => wireImageLinks(links))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('press-kit: the lightbox did not load', e);
    });
}

export default function decorate(main) {
  sourceLinks(main);
  // A hub is a tiles page without an article body; an article may carry tiles (2nd Elroq kit).
  if (main.querySelector('.cards.tiles') && !main.querySelector('.section.body-column')) return;
  header(main);
  chapters(main);
  mediaBox(main);
  galleryMore(main);
  accordionMedia(main);
  sidebarMediaBox(main);
  videoActions(main);
  imageLinks(main);
}
