// Shared helpers for the measurement + visual-diff harness.
// Buildless ESM. Only external dep here is playwright (via the caller).

export const DEFAULT_VIEWPORTS = [500, 768, 1024, 1280];
export const DEFAULT_HEIGHT = 900;

// The computed-style props the spec library cares about, grouped by concern.
// Keep this list aligned with the spec schema section 5 (measured visual base).
export const DEFAULT_PROPS = [
  // layout
  'display', 'position', 'top', 'right', 'bottom', 'left', 'zIndex',
  'width', 'height', 'maxWidth', 'aspectRatio',
  'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
  'gridTemplateColumns', 'objectFit', 'overflow',
  // spacing
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  // typography
  'fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'textTransform',
  'textAlign', 'color',
  // decoration
  'backgroundColor', 'border', 'borderColor', 'borderRadius', 'boxShadow',
  'opacity', 'transform', 'scale', 'transition',
];

// Parse a comma list CLI value into a trimmed array, dropping empties.
export function list(value, fallback = []) {
  if (value == null) return fallback;
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

// Numeric viewport widths from a comma list.
export function viewports(value) {
  const parsed = list(value).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : DEFAULT_VIEWPORTS;
}

// Best-effort consent-banner dismissal so it never covers content in a shot.
// The source runs OneTrust; accept-all is the deterministic path for a reference
// capture (we are documenting the fully-rendered page, not the consent flow).
export async function dismissConsent(page) {
  const selectors = [
    '#onetrust-accept-btn-handler',
    '.ot-pc-refuse-all-handler',
    'button[aria-label="Accept all"]',
    '.cookie-accept, .cookie-consent-accept',
  ];
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 800 });
        await page.waitForTimeout(300);
        return true;
      }
    } catch { /* not present, try the next */ }
  }
  return false;
}

// Let the page settle: network quiet, fonts loaded, one paint frame, plus an
// optional extra wait for lazy/animated content (carousels, IntersectionObserver).
export async function settle(page, extraMs = 400) {
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* keep going */ }
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch { /* older engines */ }
  if (extraMs > 0) await page.waitForTimeout(extraMs);
}

// Load a URL at a given width, dismiss consent, settle. Reuses one page across
// viewports by resizing (fast) unless renavigate is set.
export async function prepare(page, url, width, height, { renavigate = false, extraMs = 400 } = {}) {
  await page.setViewportSize({ width, height });
  if (renavigate || page.url() !== url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await dismissConsent(page);
  }
  await settle(page, extraMs);
}

// rgb(a) helper is done in-page; here we just pretty-print a hex when possible.
export function toHex(rgb) {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(String(rgb).replace(/\s+/g, ''));
  if (!m) return null;
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4] == null ? 1 : Number(m[4])];
  if (a === 0) return 'transparent';
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return a < 1 ? `${hex} (a=${a})` : hex;
}
