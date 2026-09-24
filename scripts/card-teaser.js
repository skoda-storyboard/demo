import { createOptimizedPicture } from './aem.js';

function isImageCell(cell) {
  return cell.children.length === 1
    && !!cell.querySelector(':scope > picture, :scope > p > picture, :scope > img, :scope > p > img');
}

function isToolbarCell(cell) {
  const kids = [...cell.children];
  return kids.length > 0 && kids.every((p) => p.tagName === 'P' && p.querySelector(':scope > a'));
}

function decorateToolbar(cell) {
  cell.classList.add('cards-card-toolbar');
  cell.querySelectorAll(':scope > p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (!a) return;
    a.classList.add('cards-toolbar-button');
    if (!a.textContent.trim() && a.querySelector('.icon, svg, img') && !a.getAttribute('aria-label')) {
      a.setAttribute('aria-label', a.title || a.getAttribute('href') || 'action');
    }
    cell.append(a);
    p.remove();
  });
}

const DATE_RE = /^\s*\d{1,4}[.\-/]\s?\d{1,2}[.\-/]\s?\d{2,4}\.?\s*$/;

function classifyBody(body) {
  [...body.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) el.classList.add('cards-card-title');
    else if (el.tagName === 'P' && DATE_RE.test(el.textContent)) el.classList.add('cards-card-date');
    else if (el.tagName === 'P') el.classList.add('cards-card-summary');
  });
}

export function decorateCardCells(row) {
  const li = document.createElement('li');
  li.className = 'card-teaser';
  while (row.firstElementChild) li.append(row.firstElementChild);
  [...li.children].forEach((cell) => {
    if (isImageCell(cell)) cell.className = 'cards-card-image';
    else if (isToolbarCell(cell)) decorateToolbar(cell);
    else {
      cell.className = 'cards-card-body';
      classifyBody(cell);
    }
  });
  li.querySelectorAll('.cards-card-image:empty').forEach((c) => c.remove());
  return li;
}

export function optimizeImages(scope, { eager = false } = {}) {
  scope.querySelectorAll('.cards-card-image img').forEach((img) => {
    let picture = img.closest('picture');
    if (!picture) {
      picture = document.createElement('picture');
      img.replaceWith(picture);
      picture.append(img);
    }
    const p = picture.parentElement;
    if (p?.tagName === 'P' && p.children.length === 1) p.replaceWith(picture);
    const src = img.getAttribute('src') || '';
    if (!picture.querySelector('source') && src && /^https?:/.test(img.src)) {
      const widths = eager
        ? [{ media: '(min-width: 768px)', width: '1200' }, { width: '750' }]
        : [{ media: '(min-width: 768px)', width: '750' }, { width: '500' }];
      const optimized = createOptimizedPicture(
        img.src,
        img.alt,
        eager,
        widths,
      );
      optimized.querySelectorAll('source').forEach((source) => picture.insertBefore(source, img));
      img.src = optimized.querySelector('img').src;
    }
    img.setAttribute('loading', eager ? 'eager' : 'lazy');
    if (eager) img.setAttribute('fetchpriority', 'high');
  });
}

export function wireCardLink(li) {
  const toolbar = li.querySelector('.cards-card-toolbar');
  const links = [...li.querySelectorAll('a')].filter((a) => !toolbar || !toolbar.contains(a));
  if (!links.length) return;
  const primary = links.find((a) => a.textContent.trim()) || links[0];
  primary.classList.add('cards-card-link');
  links.forEach((a) => {
    if (a !== primary && a.getAttribute('href') === primary.getAttribute('href')) {
      a.setAttribute('tabindex', '-1');
      a.setAttribute('aria-hidden', 'true');
    }
  });
}

export function buildCardTeaser(row, { eager = false, summary = false } = {}) {
  const li = document.createElement('li');
  li.className = 'card-teaser';
  if (row.image) {
    const media = document.createElement('div');
    media.className = 'cards-card-image';
    media.append(createOptimizedPicture(
      row.image,
      row.title || '',
      eager,
      eager
        ? [{ media: '(min-width: 768px)', width: '1200' }, { width: '750' }]
        : [{ media: '(min-width: 768px)', width: '750' }, { width: '500' }],
    ));
    if (eager) media.querySelector('img').setAttribute('fetchpriority', 'high');
    li.append(media);
  }
  const body = document.createElement('div');
  body.className = 'cards-card-body';
  if (row.publisheddate || row.date) {
    const date = document.createElement('p');
    date.className = 'cards-card-date';
    date.textContent = row.publisheddate || row.date;
    body.append(date);
  }
  if (row.title) {
    const heading = document.createElement('h3');
    heading.className = 'cards-card-title';
    const link = document.createElement('a');
    link.href = row.path;
    link.textContent = row.title;
    heading.append(link);
    body.append(heading);
  }
  if (summary && row.description) {
    const text = document.createElement('p');
    text.className = 'cards-card-summary';
    text.textContent = row.description;
    body.append(text);
  }
  li.append(body);
  wireCardLink(li);
  return li;
}
