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

export default function decorate(main) {
  sourceLinks(main);
  if (main.querySelector('.cards.tiles')) return;
  header(main);
  chapters(main);
  mediaBox(main);
}
