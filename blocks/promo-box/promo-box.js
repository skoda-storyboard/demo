import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import {
  scopeRows, filterRows, sortRows, paginate,
} from '../listing/listing-logic.mjs';
import {
  decorateCardCells, optimizeImages, wireCardLink, buildCardTeaser,
} from '../../scripts/card-teaser.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

/* eslint-disable no-use-before-define */

const CONFIG_KEYS = new Set(['index', 'template', 'path', 'category', 'tags', 'limit', 'sort']);
const ROTATION_MS = 10000;

function buildStrings(ph = {}) {
  return {
    featured: ph.promoFeaturedStories || 'Featured stories',
    slides: ph.promoFeaturedStorySlides || 'Featured story slides',
    goToStory: ph.promoGoToStory || 'Go to featured story {number}',
    pause: ph.promoPauseRotation || 'Pause rotation',
    resume: ph.promoResumeRotation || 'Resume rotation',
    unavailable: ph.promoUnavailable || 'Featured stories unavailable',
  };
}

export function parseSource(block) {
  const rows = [...block.children];
  const names = rows.map((row) => row.children[0]?.textContent.trim().toLowerCase() || '');
  const configRows = names.filter((name) => CONFIG_KEYS.has(name)).length;
  if (!configRows) return { mode: 'curated', rows };
  if (configRows !== rows.length || rows.some((row) => row.children.length !== 2)) {
    throw new Error('Mixing authored cards and index configuration is not supported.');
  }

  const config = {};
  rows.forEach((row, i) => {
    const key = names[i];
    if (config[key] !== undefined) throw new Error(`Duplicate promo-box setting: ${key}`);
    const cell = row.children[1];
    config[key] = cell.querySelector('a')?.getAttribute('href') || cell.textContent.trim();
  });
  const limit = config.limit === undefined ? 3 : Number(config.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || !/^[1-9]\d*$/.test(String(config.limit ?? 3))) {
    throw new Error('Promo-box limit must be a positive whole number.');
  }
  if (config.sort) config.sort = config.sort.toLowerCase();
  if (config.sort && !['newest', 'oldest'].includes(config.sort)) {
    throw new Error('Promo-box sort must be newest or oldest.');
  }
  const tokens = (value) => (value || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    mode: 'indexed',
    config: {
      ...config, limit, category: tokens(config.category), tags: tokens(config.tags),
    },
  };
}

function showError(block, error, strings) {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.aem.page')) {
    const status = document.createElement('p');
    status.className = 'promo-box-error';
    status.textContent = `${strings.unavailable}: ${error.message}`;
    block.prepend(status);
  } else {
    block.replaceChildren();
    block.hidden = true;
  }
  // eslint-disable-next-line no-console
  console.error('promo-box:', error);
}

export function validateCuratedRows(rows) {
  if (rows.length !== 3) throw new Error('Promo-box requires exactly three authored cards.');
  if (rows.some((row) => !row.querySelector('a[href]'))) {
    throw new Error('Each curated promo card needs a story link; check for unknown index settings.');
  }
}

async function getCards(source) {
  if (source.mode === 'curated') {
    validateCuratedRows(source.rows);
    const ul = document.createElement('ul');
    source.rows.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'card-teaser overlay';
      while (row.firstElementChild) li.append(row.firstElementChild);
      decorateCardCells(li);
      ul.append(li);
    });
    [...ul.children].forEach((li, i) => optimizeImages(li, {
      eager: i === 0, desktopWidth: '1200', mobileWidth: '750',
    }));
    [...ul.children].forEach((li) => wireCardLink(li));
    return ul;
  }

  const { config } = source;
  const rows = await loadQueryIndex(config.index || defaultIndexUrl());
  const chosen = selectPromoRows(rows, config);
  if (!chosen.length) throw new Error('No matching featured stories in the query index.');
  const ul = document.createElement('ul');
  chosen.forEach((row, i) => ul.append(buildCardTeaser(row, {
    eager: i === 0,
    overlay: true,
    summary: true,
    desktopWidth: '1200',
    mobileWidth: '750',
  })));
  return ul;
}

export function selectPromoRows(rows, config) {
  const scoped = scopeRows(rows, { template: config.template || 'story', path: config.path || '' });
  const filtered = filterRows(scoped, { category: config.category, tags: config.tags })
    .filter((row) => typeof row.path === 'string' && /^\/(?!\/)/.test(row.path) && row.title);
  return paginate(sortRows(filtered, config.sort || 'newest'), config.limit);
}

export function enablePromoRotation(block, track, strings = buildStrings()) {
  const dots = document.createElement('div');
  dots.className = 'promo-box-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', strings.slides);
  let slides = [...track.children];
  const controls = document.createElement('div');
  controls.className = 'promo-box-controls';
  if (slides.length > 1) {
    slides.forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', strings.goToStory.replace('{number}', String(i + 1)));
      dot.addEventListener('click', () => {
        select(i, true);
      });
      dots.append(dot);
    });
    const pauseButton = document.createElement('button');
    pauseButton.type = 'button';
    pauseButton.className = 'promo-box-pause';
    controls.append(dots, pauseButton);
    block.append(controls);
    pauseButton.addEventListener('click', () => {
      paused = !paused;
      updatePauseButton();
      updateTimer();
    });
  }

  const compact = window.matchMedia('(max-width: 767px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer;
  let hovered = false;
  let touched = false;
  let paused = false;

  function updatePauseButton() {
    const button = controls.querySelector('.promo-box-pause');
    if (!button) return;
    button.textContent = paused ? strings.resume : strings.pause;
    button.setAttribute('aria-label', button.textContent);
    button.hidden = reduced.matches;
  }

  function updateDots() {
    [...dots.children].forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function select(index, manual = false) {
    active = index;
    updateDots();
    const rtl = getComputedStyle(track).direction === 'rtl';
    const edge = rtl ? 'right' : 'left';
    const slideBounds = slides[index].getBoundingClientRect();
    const trackBounds = track.getBoundingClientRect();
    const distance = slideBounds[edge] - trackBounds[edge];
    track.scrollTo({
      left: track.scrollLeft + distance,
      behavior: manual && !reduced.matches ? 'smooth' : 'auto',
    });
    if (manual) updateTimer();
  }

  function rotateMosaic() {
    track.append(track.firstElementChild);
    slides = [...track.children];
    active = 0;
    updateDots();
  }

  function updateTimer() {
    window.clearInterval(timer);
    timer = undefined;
    const pauseFocused = document.activeElement === controls.querySelector('.promo-box-pause');
    if (paused || reduced.matches || document.hidden || hovered || touched
      || (block.contains(document.activeElement) && !pauseFocused) || slides.length < 2) return;
    timer = window.setInterval(() => {
      if (compact.matches) select((active + 1) % slides.length);
      else rotateMosaic();
    }, ROTATION_MS);
  }

  function updateMode() {
    if (compact.matches) {
      slides = [...track.children];
      active = Math.max(0, slides.findIndex((slide) => slide.contains(document.activeElement)));
      block.setAttribute('aria-roledescription', 'carousel');
      track.tabIndex = 0;
      select(active);
    } else {
      if (dots.contains(document.activeElement)) {
        slides[active]?.querySelector('.card-teaser-link')?.focus();
      }
      block.removeAttribute('aria-roledescription');
      track.removeAttribute('tabindex');
      track.scrollTo({ left: 0, behavior: 'auto' });
      active = 0;
      updateDots();
    }
    updateTimer();
  }

  track.addEventListener('keydown', (event) => {
    if (!compact.matches || event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    select(
      (active + (event.key === 'ArrowRight' ? direction : -direction) + slides.length) % slides.length,
      true,
    );
  });
  track.addEventListener('scroll', () => {
    if (!compact.matches) return;
    const edge = getComputedStyle(track).direction === 'rtl' ? 'right' : 'left';
    const pos = track.getBoundingClientRect()[edge];
    active = slides.reduce((closest, slide, i) => (
      Math.abs(slide.getBoundingClientRect()[edge] - pos)
        < Math.abs(slides[closest].getBoundingClientRect()[edge] - pos) ? i : closest
    ), 0);
    updateDots();
  }, { passive: true });
  block.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') { hovered = true; updateTimer(); }
  });
  block.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') { hovered = false; updateTimer(); }
  });
  block.addEventListener('focusin', updateTimer);
  block.addEventListener('focusout', () => window.setTimeout(updateTimer, 0));
  track.addEventListener('pointerdown', () => { touched = true; updateTimer(); });
  track.addEventListener('pointerup', () => { touched = false; updateTimer(); });
  track.addEventListener('pointercancel', () => { touched = false; updateTimer(); });
  document.addEventListener('visibilitychange', updateTimer);
  reduced.addEventListener('change', () => { updatePauseButton(); updateTimer(); });
  compact.addEventListener('change', () => {
    window.clearInterval(timer);
    updateMode();
  });
  updateDots();
  updatePauseButton();
  updateMode();
}

export default async function decorate(block) {
  const stringsPromise = fetchPlaceholders();
  let source;
  try {
    source = parseSource(block);
  } catch (error) {
    showError(block, error, buildStrings(await stringsPromise));
    return;
  }
  try {
    const [track, placeholders] = await Promise.all([getCards(source), stringsPromise]);
    const strings = buildStrings(placeholders);
    track.className = 'promo-box-items';
    block.replaceChildren(track);
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', strings.featured);
    enablePromoRotation(block, track, strings);
  } catch (error) {
    showError(block, error, buildStrings(await stringsPromise));
  }
}
