/*
 * Embeds block — SKODA-204 (docs/ui-specs/embeds.md).
 *
 * Reproduces the source's third-party media embeds without porting its libraries
 * (ys-embed-controller / jQuery / colorbox are retired):
 *   - Video (Vimeo / YouTube): fluid 16:9 wrapper, native loading="lazy" iframe.
 *     Vimeo keeps ?dnt=1 (do-not-track); YouTube uses the standard youtube.com/embed host
 *     with feature=oembed&enablejsapi=1, as measured on the live source (embeds.md §2).
 *   - Audio (Buzzsprout / Spotify): fixed-height wrapper (--embed-audio-height: 200px),
 *     NOT 16:9.
 *   - Generic iframe provider: falls through as a video-ratio embed (the MR-PR03
 *     AI-audio JS *widget* is handled by the /widgets/ autoblock, not here).
 *
 * The iframe src is set directly so each provider's native player renders exactly as on the
 * live site (YouTube title / share / watch-on-YouTube overlay, Vimeo controls, etc.). This
 * matches the source, which loads its embeds directly; the site-wide OneTrust banner remains
 * the consent mechanism (the per-embed .page-embed_cookie placeholder only appears when a
 * category is actively blocked — out of Adobe M1 scope, D10 / SKODA-804/905).
 *
 * Authoring: a bare provider URL on its own line autoblocks into `embed`
 * (buildEmbedAutoBlocks, scripts.js); descriptive link text becomes the iframe title. A table
 * form is also supported for options (url / ratio / title rows). The URL must be an absolute
 * http(s) URL — anything else is reported to the console and the block renders nothing.
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
    // Match the live Škoda embed exactly: standard youtube.com host, /embed/{id}, with
    // feature=oembed + enablejsapi=1 (and the si= share token when the author URL carries one).
    const params = new URLSearchParams();
    params.set('feature', 'oembed');
    const si = url.searchParams.get('si');
    if (si) params.set('si', si);
    params.set('enablejsapi', '1');
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
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

// Per-provider `allow` lists, copied verbatim from the live Škoda embeds so each player exposes
// exactly the same controls as the source (YouTube lists accelerometer/gyroscope, no fullscreen;
// Vimeo lists fullscreen). Measured on the reference innovation-and-technology article.
const ALLOW = {
  youtube: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
  vimeo: 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share',
};

/**
 * Builds the title'd iframe. The real URL is held in `data-src` and only promoted to `src`
 * when the embed nears the viewport (see observeLazyEmbed) — this is the source's own
 * data-src → src swap, rebuilt with IntersectionObserver. It keeps the native player (no
 * consent button) while deferring the third-party boot so N stacked embeds don't all execute
 * up front (cuts TBT). The `allow` list is provider-specific, matching the live source (ALLOW).
 * @param {string} src The normalised embed URL
 * @param {string} title Accessible iframe title
 * @param {boolean} isAudio Whether this is an audio player
 * @param {string} provider Provider key (selects the matching `allow` list)
 * @returns {HTMLIFrameElement}
 */
function buildIframe(src, title, isAudio, provider) {
  const iframe = document.createElement('iframe');
  iframe.dataset.src = src;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', title);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', ALLOW[provider] || ALLOW.vimeo);
  if (isAudio) iframe.setAttribute('scrolling', 'no');
  return iframe;
}

/**
 * Promotes an embed's held data-src to src when it approaches the viewport, so the third-party
 * player only boots when needed. Loads eagerly (no observer) when IntersectionObserver is
 * unavailable, keeping the embed functional.
 * @param {Element} wrapper The .embed-video / .embed-audio wrapper
 */
function observeLazyEmbed(wrapper) {
  const iframe = wrapper.querySelector('iframe[data-src]');
  if (!iframe) return;
  const load = () => {
    if (!iframe.dataset.src) return;
    iframe.setAttribute('src', iframe.dataset.src);
    delete iframe.dataset.src;
  };
  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        load();
        obs.disconnect();
      }
    });
  }, { rootMargin: '200px' });
  observer.observe(wrapper);
}

const HTTP_URL_RE = /^https?:\/\//i;

/**
 * Parses an authored embed URL, accepting ONLY absolute http(s) URLs. Parsed without a base on
 * purpose: resolving against the page would turn a missing value into `/drafts/undefined`,
 * `""` into the current page (a recursive iframe) and `not a url` into a same-site path.
 * @param {unknown} raw The authored value (href or cell text)
 * @returns {URL|null} the parsed URL, or null when it is missing/malformed/non-http(s)
 */
export function parseEmbedUrl(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!HTTP_URL_RE.test(value)) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Id-based providers need a media id to build a working player URL; without one (e.g. a
 * YouTube channel link) the iframe would load an empty /embed/ page.
 * @param {string} provider
 * @param {URL} url
 * @returns {boolean}
 */
function hasMediaId(provider, url) {
  if (provider === 'youtube') return !!youtubeId(url);
  if (provider === 'vimeo') return !!vimeoId(url);
  return true;
}

// Spotify URL type segment -> readable label (open.spotify.com/{type}/{id}).
const SPOTIFY_LABELS = {
  episode: 'Spotify podcast episode',
  show: 'Spotify podcast',
  track: 'Spotify track',
  album: 'Spotify album',
  playlist: 'Spotify playlist',
};

/**
 * Human-readable iframe title used when the author gave no descriptive text, so screen-reader
 * users never hear a raw URL as the frame name.
 * @param {string} provider
 * @param {URL} url
 * @returns {string}
 */
function providerLabel(provider, url) {
  if (provider === 'youtube') return 'YouTube video';
  if (provider === 'vimeo') return 'Vimeo video';
  if (provider === 'buzzsprout') return 'Buzzsprout podcast episode';
  if (provider === 'spotify') {
    const type = url.pathname.replace(/^\/embed/, '').split('/')[1];
    return SPOTIFY_LABELS[type] || 'Spotify player';
  }
  return `Embedded content from ${url.hostname.replace(/^www\./, '')}`;
}

// A candidate title is descriptive only if it is non-empty and not itself a URL.
const descriptive = (s) => (s && !HTTP_URL_RE.test(s) ? s : '');

/**
 * Resolves the iframe title: an authored title (link title attribute or table `title` row),
 * then descriptive link text, then the provider label. URL-valued candidates are skipped: in the
 * bare-URL autoblock case the link text is the URL, and scripts.js decorateButtons copies that
 * text into the link's `title` before this block runs.
 * @param {HTMLAnchorElement|null} link
 * @param {string} tableTitle
 * @param {string} provider
 * @param {URL} url
 * @returns {string}
 */
function resolveTitle(link, tableTitle, provider, url) {
  return descriptive(link?.getAttribute('title')?.trim())
    || descriptive(tableTitle)
    || descriptive(link?.textContent.trim())
    || providerLabel(provider, url);
}

/**
 * Reads the table form's key/value rows (| url | … |, | ratio | … |, | title | … |) into cells
 * keyed by lower-cased name. Read regardless of how the URL is found, so a URL cell that DA
 * auto-linked still honours its ratio/title rows.
 * @param {Element} block
 * @returns {Object<string, Element>}
 */
function readConfigRows(block) {
  const cfg = {};
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    if (row.children.length < 2) return;
    const [keyCell, valueCell] = row.children;
    const key = keyCell.textContent.trim().toLowerCase();
    if (key) cfg[key] = valueCell;
  });
  return cfg;
}

export default function decorate(block) {
  // Read the authored source: a link href, else the `url` row / a bare URL cell (table form).
  const cfg = readConfigRows(block);
  const link = block.querySelector('a[href]');
  let rawUrl = link?.getAttribute('href');
  if (!rawUrl) {
    rawUrl = cfg.url?.textContent.trim()
      || [...block.querySelectorAll(':scope > div > div')]
        .map((cell) => cell.textContent.trim())
        .find((txt) => HTTP_URL_RE.test(txt));
  }
  const ratioKey = cfg.ratio?.textContent.trim() || block.dataset.ratio || '';
  const tableTitle = cfg.title?.textContent.trim() || '';

  // Validate BEFORE clearing: only absolute http(s) URLs with a usable media id are embedded.
  const url = parseEmbedUrl(rawUrl);
  const detected = url && detectProvider(url);
  if (!url || !hasMediaId(detected.provider, url)) {
    // Report the authoring error (visible in the preview console) and render nothing rather
    // than the raw config cells or a broken/same-site iframe.
    // eslint-disable-next-line no-console
    console.warn('embed: invalid or missing URL — expected an absolute http(s) provider URL, got', rawUrl);
    block.classList.add('embed-invalid');
    block.textContent = '';
    return;
  }

  block.textContent = '';

  const { provider, isAudio } = detected;
  const src = buildEmbedUrl(provider, url);
  const title = resolveTitle(link, tableTitle, provider, url);

  const wrapper = document.createElement('div');
  wrapper.className = isAudio ? 'embed-audio' : 'embed-video';
  if (!isAudio) {
    const ratio = RATIOS[ratioKey.toLowerCase()] || RATIOS['16x9'];
    wrapper.style.setProperty('--embed-ratio', ratio);
  }

  wrapper.append(buildIframe(src, title, isAudio, provider));

  block.classList.add(`embed-${provider}`);
  block.append(wrapper);

  // Defer the third-party player until the embed nears the viewport (source parity + perf).
  observeLazyEmbed(wrapper);
}
