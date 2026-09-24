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
 * The iframe src is set directly so each provider's native player renders exactly as on the
 * live site (YouTube title / share / watch-on-YouTube overlay, Vimeo controls, etc.). This
 * matches the source, which loads its embeds directly; the site-wide OneTrust banner remains
 * the consent mechanism (the per-embed .page-embed_cookie placeholder only appears when a
 * category is actively blocked — out of Adobe M1 scope, D10 / SKODA-804/905).
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
 * Builds the lazy, title'd iframe. The src is set directly (no consent gate) so the provider
 * player renders exactly as on the live site — native controls, title, share, watch-on links.
 * The `allow` list is provider-specific to match the live source verbatim (see ALLOW).
 * @param {string} src The normalised embed URL
 * @param {string} title Accessible iframe title
 * @param {boolean} isAudio Whether this is an audio player
 * @param {string} provider Provider key (selects the matching `allow` list)
 * @returns {HTMLIFrameElement}
 */
function buildIframe(src, title, isAudio, provider) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('src', src);
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', title);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', ALLOW[provider] || ALLOW.vimeo);
  if (isAudio) iframe.setAttribute('scrolling', 'no');
  return iframe;
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

  wrapper.append(buildIframe(src, title, isAudio, provider));

  block.classList.add(`embed-${provider}`);
  block.append(wrapper);
}
