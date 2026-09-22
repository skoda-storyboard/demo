import decorateCards from '../../scripts/card-teaser.js';

const AUTOPLAY_MS = 10000;
const MOBILE_QUERY = '(max-width: 767.98px)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Promo-box behavior (SKODA-201 / carousel-rails §3):
 *   >= 768px : static mosaic (1 big 66.66% + 2 small 33.33% stacked) — pure CSS, no JS here.
 *   < 768px  : 1-up carousel auto-rotating every 10s, dots-only, pausing on hover/focus/touch,
 *              honoring prefers-reduced-motion. This wiring runs only while the mobile MQ matches.
 */
function initPromoCarousel(block, ul) {
  const items = [...ul.children];
  if (items.length < 2) return null;

  // mark the track booted so CSS drops the pre-JS `:first-child { display:block }` fallback
  // and shows only the JS-selected slide
  ul.classList.add('is-booted');

  // dots nav
  const dots = document.createElement('div');
  dots.className = 'cards-overlay-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Featured stories');
  items.forEach((li, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-overlay-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dots.append(dot);
  });
  block.append(dots);

  let index = 0;
  let timer = null;
  let paused = false;

  const select = (next) => {
    index = (next + items.length) % items.length;
    items.forEach((li, i) => {
      li.classList.toggle('is-selected', i === index);
      li.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('is-selected', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => {
    stop();
    if (paused || window.matchMedia(REDUCED_MOTION).matches) return;
    timer = setInterval(() => select(index + 1), AUTOPLAY_MS);
  };

  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.cards-overlay-dot');
    if (!dot) return;
    select([...dots.children].indexOf(dot));
    start();
  });

  const pause = () => { paused = true; stop(); };
  const resume = () => { paused = false; start(); };
  block.addEventListener('mouseenter', pause);
  block.addEventListener('mouseleave', resume);
  block.addEventListener('focusin', pause);
  block.addEventListener('focusout', resume);
  block.addEventListener('touchstart', pause, { passive: true });
  block.addEventListener('touchend', resume, { passive: true });

  select(0);
  start();

  return { stop, start, select };
}

export default function decorate(block) {
  const ul = decorateCards(block);

  // count-based auto-variant: an authored `promo` variant, or exactly 3 cards, becomes the
  // mosaic/carousel featured showcase (matches source `.promo-box`).
  const isPromo = block.classList.contains('promo') || ul.children.length === 3;
  if (!isPromo) return;

  block.classList.add('cards-overlay-promo');

  let carousel = null;
  const mq = window.matchMedia(MOBILE_QUERY);
  const sync = () => {
    if (mq.matches && !carousel) {
      carousel = initPromoCarousel(block, ul) || {};
    } else if (!mq.matches && carousel) {
      // leaving mobile: stop autoplay and clear selection state so mosaic shows all cards
      carousel.stop?.();
      ul.classList.remove('is-booted');
      [...ul.children].forEach((li) => {
        li.classList.remove('is-selected');
        li.removeAttribute('aria-hidden');
      });
      block.querySelector('.cards-overlay-dots')?.remove();
      carousel = null;
    }
  };
  sync();
  mq.addEventListener('change', sync);
}
