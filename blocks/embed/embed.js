/*
 * Embeds block — SKODA-204 (docs/ui-specs/embeds.md).
 *
 * Reproduces the source's third-party media embeds without porting its libraries
 * (ys-embed-controller / jQuery / colorbox are retired):
 *   - Video (Vimeo / YouTube): fluid 16:9 wrapper, native loading="lazy" iframe.
 *     Vimeo keeps ?dnt=1 (do-not-track); YouTube is normalised to the nocookie host.
 *   - Audio (Buzzsprout / Spotify): fixed-height wrapper (--embed-audio-height: 200px),
 *     NOT 16:9.
 *   - Generic iframe provider: falls through as a video-ratio embed (the MR-PR03
 *     AI-audio JS *widget* is handled by the /widgets/ autoblock, not here).
 *
 * Consent (D10, OUT of Adobe scope for M1) is a stub: iframes are NOT given a live `src`
 * eagerly. The URL is held in `data-src` behind a click-to-load `.embed-consent`
 * placeholder; clicking it (the M1 gate hook) swaps data-src -> src. Downstream tickets
 * (SKODA-804/905) wire the real OneTrust category signal into loadEmbed().
 *
 * Authoring: a bare provider URL on its own line autoblocks into `embed`
 * (buildEmbedAutoBlocks, scripts.js). A table form is also supported for options
 * (url / ratio cells).
 *
 * @param {Element} block the embed block element
 */

// Ratio keyword -> CSS aspect-ratio value (source ratio ladder, embeds.md §2).
const RATIOS = {
  '16x9': '16 / 9',
  '16x10': '16 / 10',
  '4x3': '4 / 3',
  '3x2': '3 / 2',
  '2x1': '2 / 1',
  '1x1': '1 / 1',
};

/**
 * Detects the provider and whether it is audio from a URL host.
 * @param {URL} url The source URL
 * @returns {{ provider: string, isAudio: boolean }}
 */
function detectProvider(url) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host.endsWith('vimeo.com')) return { provider: 'vimeo', isAudio: false };
  if (host.endsWith('youtube.com') || host === 'youtu.be' || host.endsWith('youtube-nocookie.com')) {
    return { provider: 'youtube', isAudio: false };
  }
  if (host.endsWith('buzzsprout.com')) return { provider: 'buzzsprout', isAudio: true };
  if (host.endsWith('spotify.com')) {
    // Spotify video podcasts still render in the fixed-height player.
    return { provider: 'spotify', isAudio: true };
  }
  return { provider: 'generic', isAudio: false };
}

/**
 * Extracts the Vimeo numeric video id from any Vimeo URL form.
 * @param {URL} url
 * @returns {string} the id, or '' if not found
 */
function vimeoId(url) {
  // player.vimeo.com/video/{id} or vimeo.com/{id}
  const m = url.pathname.match(/(?:\/video)?\/(\d+)/);
  return m ? m[1] : '';
}

/**
 * Extracts the YouTube video id from watch / embed / youtu.be forms.
 * @param {URL} url
 * @returns {string} the id, or '' if not found
 */
function youtubeId(url) {
  if (url.hostname === 'youtu.be') return url.pathname.slice(1);
  if (url.searchParams.get('v')) return url.searchParams.get('v');
  const m = url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
  return m ? m[1] : '';
}

/**
 * Builds the normalised embed URL for a provider, preserving privacy flags.
 * @param {string} provider
 * @param {URL} url The authored source URL
 * @returns {string} the iframe src URL
 */
function buildEmbedUrl(provider, url) {
  if (provider === 'vimeo') {
    const id = vimeoId(url);
    // Preserve dnt=1 (do-not-track) + app_id if present; default to dnt=1 (embeds.md §2).
    const params = new URLSearchParams(url.search);
    params.set('dnt', '1');
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }
  if (provider === 'youtube') {
    const id = youtubeId(url);
    // Privacy-enhanced nocookie host (acceptance criteria; embeds.md §2).
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (provider === 'buzzsprout') {
    // Keep the player query (?iframe=true etc.); ensure iframe mode.
    const params = new URLSearchParams(url.search);
    params.set('iframe', 'true');
    return `${url.origin}${url.pathname}?${params.toString()}`;
  }
  if (provider === 'spotify') {
    // open.spotify.com/{type}/{id} -> open.spotify.com/embed/{type}/{id}
    const embedPath = url.pathname.startsWith('/embed/') ? url.pathname : `/embed${url.pathname}`;
    return `https://open.spotify.com${embedPath}`;
  }
  return url.href;
}

/**
 * Builds the lazy, title'd iframe (no live src until consent — see loadEmbed).
 * @param {string} src The normalised embed URL
 * @param {string} title Accessible iframe title
 * @param {boolean} isAudio Whether this is an audio player
 * @returns {HTMLIFrameElement}
 */
function buildIframe(src, title, isAudio) {
  const iframe = document.createElement('iframe');
  // Consent gate (M1 stub): hold the URL in data-src, swap to src on load.
  iframe.dataset.src = src;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', title);
  iframe.setAttribute('frameborder', '0');
  // `allow` grants fullscreen; a separate allowfullscreen attr would be redundant (and warns).
  iframe.setAttribute(
    'allow',
    'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media',
  );
  if (isAudio) iframe.setAttribute('scrolling', 'no');
  return iframe;
}

/**
 * Swaps the held data-src into src to load the third-party iframe, and removes whichever
 * overlay (consent box or thumbnail facade) was covering it. This is the single
 * first-interaction hook that SKODA-804/905 will wire to OneTrust.
 * @param {Element} wrapper The .embed-video / .embed-audio wrapper
 */
function loadEmbed(wrapper) {
  const iframe = wrapper.querySelector('iframe[data-src]');
  if (!iframe) return;
  iframe.setAttribute('src', iframe.dataset.src);
  delete iframe.dataset.src;
  wrapper.querySelector('.embed-consent')?.remove();
  wrapper.querySelector('.embed-facade')?.remove();
  wrapper.classList.add('embed-loaded');
}

/**
 * YouTube poster thumbnail URL. hqdefault always exists (maxres 404s on some videos).
 * @param {string} id YouTube video id
 * @returns {string}
 */
function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Builds a lightweight YouTube facade: the real poster thumbnail + a play overlay in place of
 * the grey consent box. Clicking loads the iframe with autoplay so it plays on the first click
 * (no second "press play"). Note: rendering the poster does contact Google (i.ytimg.com) — an
 * intentional tradeoff for the thumbnail-first UX (SKODA-204 follow-up).
 * @param {URL} url The authored YouTube URL
 * @param {Element} wrapper The embed wrapper (click-to-load target)
 * @returns {HTMLElement}
 */
function buildFacade(url, wrapper) {
  const facade = document.createElement('button');
  facade.type = 'button';
  facade.className = 'embed-facade';
  facade.setAttribute('aria-label', 'Play video');

  const img = document.createElement('img');
  img.src = youtubeThumb(youtubeId(url));
  img.alt = '';
  img.loading = 'lazy';

  const play = document.createElement('span');
  play.className = 'embed-facade-play';
  play.setAttribute('aria-hidden', 'true');

  facade.append(img, play);
  facade.addEventListener('click', () => {
    const iframe = wrapper.querySelector('iframe[data-src]');
    if (iframe) {
      const u = new URL(iframe.dataset.src, window.location.href);
      u.searchParams.set('autoplay', '1');
      iframe.dataset.src = u.href;
    }
    loadEmbed(wrapper);
  });
  return facade;
}

/**
 * Builds the consent placeholder stub (embeds.md §3). Real OneTrust wiring is out of M1
 * scope (D10); clicking the button is the click-to-load hook.
 * @param {string} provider Provider name for the label
 * @param {Element} wrapper The embed wrapper (click-to-load target)
 * @returns {HTMLElement}
 */
function buildConsent(provider, wrapper) {
  const label = provider.charAt(0).toUpperCase() + provider.slice(1);
  const consent = document.createElement('div');
  consent.className = 'embed-consent';

  const inner = document.createElement('div');
  inner.className = 'embed-consent-inner';

  const text = document.createElement('p');
  text.className = 'embed-consent-text';
  text.textContent = `To view this content from ${label}, a third party will be contacted. Load it now?`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'embed-consent-button';
  button.textContent = `Load content from ${label}`;
  button.addEventListener('click', () => loadEmbed(wrapper));

  inner.append(text, button);
  consent.append(inner);
  return consent;
}

export default function decorate(block) {
  // Read the source URL: a link href, or the last cell's text (table form).
  const link = block.querySelector('a[href]');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  let rawUrl = link?.getAttribute('href');
  let ratioKey = block.dataset.ratio || '';

  if (!rawUrl) {
    // Table form: rows of [key, value] or a single URL cell.
    cells.forEach((cell) => {
      const txt = cell.textContent.trim();
      if (/^https?:\/\//i.test(txt) && !rawUrl) rawUrl = txt;
    });
    // ratio row (| ratio | 16x9 |)
    const ratioRow = [...block.querySelectorAll(':scope > div')]
      .find((row) => row.children[0]?.textContent.trim().toLowerCase() === 'ratio');
    if (ratioRow) ratioKey = ratioRow.children[1]?.textContent.trim() || ratioKey;
  }

  block.textContent = '';

  let url;
  try {
    url = new URL(rawUrl, window.location.href);
  } catch {
    // No usable URL — leave the block empty rather than throw.
    return;
  }

  const { provider, isAudio } = detectProvider(url);
  const src = buildEmbedUrl(provider, url);
  const title = link?.getAttribute('title') || link?.textContent.trim() || `${provider} embed`;

  const wrapper = document.createElement('div');
  wrapper.className = isAudio ? 'embed-audio' : 'embed-video';
  if (!isAudio) {
    const ratio = RATIOS[ratioKey.toLowerCase()] || RATIOS['16x9'];
    wrapper.style.setProperty('--embed-ratio', ratio);
  }

  wrapper.append(buildIframe(src, title, isAudio));
  // YouTube shows a poster-thumbnail facade (play overlay); other providers keep the M1
  // consent stub. Facade only when we have a usable video id to build the thumbnail from.
  if (provider === 'youtube' && youtubeId(url)) {
    wrapper.append(buildFacade(url, wrapper));
  } else {
    wrapper.append(buildConsent(provider, wrapper));
  }

  block.classList.add(`embed-${provider}`);
  block.append(wrapper);
}
