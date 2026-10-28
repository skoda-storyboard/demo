/*
 * Technical data from one sheet (SKODA-852): the shared contract of the picker, the Preflight
 * check and the audit. Pure string functions, no DOM, so Node tests and the editor plugins run
 * the same code.
 *
 * A technical value in a document is a link to its sheet row; the link text is the formatted
 * value: <a href="/data/tech-data.json#peaq-90.range">647 km</a>. The page script in
 * scripts/scripts.js shows it as text.
 */

export const TECH_DATA_SHEET = '/data/tech-data.json';

// `<model>.<field>` for the figures a model page shows, `<model>-<version>.<field>` per version
const KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z][a-zA-Z0-9]*$/;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
};

/** Collapse whitespace (including non-breaking spaces) and trim. */
export const flat = (s) => String(s ?? '').replace(/[\s\u00a0]+/g, ' ').trim();

export function decodeEntities(s) {
  return String(s ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, ent) => {
    if (ent[0] !== '#') return ENTITIES[ent.toLowerCase()] ?? all;
    const code = ent[1].toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : Number(ent.slice(1));
    return Number.isFinite(code) ? String.fromCodePoint(code) : all;
  });
}

/** The visible text of an HTML fragment, whitespace-collapsed. */
export const textOf = (html) => flat(decodeEntities(String(html ?? '').replace(/<[^>]*>/g, '')));

export const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The sheet key a link points to, or null when the href isn't a technical-data link. Relative and
 * absolute hrefs both count (authors paste preview URLs), as long as the path is the sheet's.
 * @param {string} href
 * @returns {{key: string, model: string, field: string} | null}
 */
export function parseTechDataHref(href) {
  if (typeof href !== 'string' || !href.includes('#')) return null;
  let url;
  try {
    url = new URL(decodeEntities(href), 'https://tech-data.invalid');
  } catch {
    return null;
  }
  if (url.pathname !== TECH_DATA_SHEET) return null;
  let key;
  try {
    key = decodeURIComponent(url.hash.slice(1));
  } catch {
    return null;
  }
  if (!KEY_RE.test(key)) return null;
  const [model, field] = key.split('.');
  return { key, model, field };
}

export const techDataHref = (key) => `${TECH_DATA_SHEET}#${key}`;

// "5,4" is a decimal comma; "2,965" (three digits after the comma) is a thousands separator
function toNumber(token) {
  const t = token.replace(/\s/g, '');
  const normalized = /^\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const UNIT_ALIASES = { 'kwh/100km': 'kWh/100 km', 'km/h': 'km/h' };
const normalizeUnit = (unit) => {
  const u = flat(unit).replace(/\s/g, '');
  return UNIT_ALIASES[u.toLowerCase()] ?? u;
};

// a figure: one number or a range ("458 - 646", "408–453"), then its unit
const FIGURE_RE = /^(\d[\d.,]*)(?:\s*[-–]\s*(\d[\d.,]*))?\s*(.*)$/;

/**
 * Split a written figure into its numbers and unit; null when it isn't a figure.
 * "458 - 646 km" → {numbers: [458, 646], unit: 'km'}; "5,4 s" → {numbers: [5.4], unit: 's'}.
 */
export function parseFigure(text) {
  const m = flat(decodeEntities(text)).match(FIGURE_RE);
  if (!m) return null;
  const numbers = [m[1], m[2]].filter((t) => t !== undefined).map(toNumber);
  if (numbers.some((n) => n === null)) return null;
  return { numbers, unit: normalizeUnit(m[3]) };
}

/** True when two written figures have the same numbers and unit, however they are typeset. */
export function sameFigure(a, b) {
  const fa = typeof a === 'string' ? parseFigure(a) : a;
  const fb = typeof b === 'string' ? parseFigure(b) : b;
  if (!fa || !fb) return false;
  return fa.unit === fb.unit
    && fa.numbers.length === fb.numbers.length
    && fa.numbers.every((n, i) => n === fb.numbers[i]);
}

/** A decimal comma in an English figure ("5,4 s"): same value, written the Czech way. */
export const hasDecimalComma = (text) => /\d,\d{1,2}(?!\d)/.test(flat(text));

const rowsOf = (json, name) => {
  const sheet = json?.[name];
  if (Array.isArray(sheet?.data)) return sheet.data;
  return [];
};

const str = (v) => flat(v);

/**
 * Read the sheet JSON (multi-sheet: `values` and `models` tabs) into a value map and model list.
 * Rows without a valid key, or a model without a code, are dropped and counted in `skipped`.
 * @returns {{values: Map<string, object>, models: object[], skipped: number}}
 */
export function readSheet(json) {
  let skipped = 0;
  const values = new Map();
  rowsOf(json, 'values').forEach((row) => {
    const key = str(row.key);
    const value = str(row.value);
    if (!KEY_RE.test(key) || !value) {
      skipped += 1;
      return;
    }
    const unit = str(row.unit);
    values.set(key, {
      key,
      model: str(row.model) || key.split('.')[0],
      version: str(row.version),
      field: str(row.field) || key.split('.')[1],
      value,
      unit,
      label: str(row.label),
      source: str(row.source),
      sourceDate: str(row.sourceDate),
      note: str(row.note),
      display: unit ? `${value} ${unit}` : value,
    });
  });
  const models = [];
  rowsOf(json, 'models').forEach((row) => {
    const code = str(row.code);
    if (!code) {
      skipped += 1;
      return;
    }
    models.push({
      code,
      name: str(row.name) || code,
      pages: str(row.pages).split(',').map((p) => p.trim()).filter(Boolean),
      pdf: str(row.pdf),
      pdfDate: str(row.pdfDate),
    });
  });
  return { values, models, skipped };
}

/** "/en/x.html", "/en/x/" and "/en/x" are the same page. */
export const normalizePath = (path) => flat(path).replace(/\.(plain\.)?html$/, '').replace(/(.)\/+$/, '$1');

/** The models whose `pages` list the page. */
export function modelsForPath(models, path) {
  const page = normalizePath(path);
  return models.filter((m) => m.pages.some((p) => normalizePath(p) === page));
}

/** All sheet rows of the given model codes (model-level and version rows). */
export function valuesOfModels(values, codes) {
  const wanted = new Set(codes);
  return [...values.values()].filter((v) => wanted.has(v.model));
}
