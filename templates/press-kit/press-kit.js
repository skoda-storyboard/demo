function sourceLinks(main) {
  main.querySelectorAll('a[href]').forEach((link) => {
    if (!/^https?:\/\/(?:www\.)?skoda-storyboard\.com\//i.test(link.href)) return;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

function chapters(main) {
  const section = main.querySelector('.section.press-kit-chapters');
  const list = section?.querySelector('.default-content-wrapper > ul');
  if (!list) return;
  list.querySelector('a[href="#chapters-links"]')?.closest('li')?.remove();
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

function mediaBox(main) {
  const section = main.querySelector('.section.media-box');
  const blocks = [...(section?.querySelectorAll('.downloads') || [])];
  if (!blocks.length) return;
  section.id = 'media-box';
  // The Downloads block drops rows without an image (file-only PDF/MP4 rows, contract
  // `downloads`), so read them from the authored table before it decorates (SKODA-510).
  const files = blocks.flatMap((block) => [...block.children]
    .filter((row) => !row.querySelector('img'))
    .flatMap((row) => {
      const title = [...row.children]
        .find((cell) => !cell.querySelector('a') && cell.textContent.trim())?.textContent.trim();
      return [...row.querySelectorAll('a[href]')].map((link) => ({
        href: link.getAttribute('href'),
        label: link.textContent.trim(),
        title: title || link.textContent.trim(),
      }));
    }));

  const render = () => {
    const items = blocks.flatMap((block) => [...block.querySelectorAll('.downloads-items > li')]);
    if (items.length > 8) {
      items.slice(8).forEach((item) => { item.hidden = true; });
      const button = document.createElement('button');
      button.className = 'press-kit-show-more';
      button.type = 'button';
      button.textContent = 'Show more';
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        items.slice(8).forEach((item) => { item.hidden = !expanded; });
        button.textContent = expanded ? 'Show less' : 'Show more';
        button.setAttribute('aria-expanded', String(expanded));
      });
      blocks.at(-1).after(button);
    }
    const missing = files.filter(({ href }) => ![...section.querySelectorAll('.downloads a[href]')]
      .some((link) => link.getAttribute('href') === href));
    if (!missing.length) return;
    const fileList = document.createElement('ul');
    fileList.className = 'press-kit-files';
    missing.forEach(({ href, title, label }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', '');
      link.textContent = `${title} (${label})`;
      item.append(link);
      fileList.append(item);
    });
    section.append(fileList);
  };

  if (blocks.every((block) => block.dataset.blockStatus === 'loaded')) render();
  else {
    const observer = new MutationObserver(() => {
      if (!blocks.every((block) => block.dataset.blockStatus === 'loaded')) return;
      observer.disconnect();
      render();
    });
    blocks.forEach((block) => observer.observe(block, {
      attributes: true, attributeFilter: ['data-block-status'],
    }));
  }
}

export default function decorate(main) {
  sourceLinks(main);
  if (main.querySelector('.cards.tiles')) return;
  chapters(main);
  mediaBox(main);
}
