/*
 * Technical-data checks for one document (SKODA-852): DA source HTML or a page's .plain.html, the
 * sheet, the page path. Deterministic rules, no model involved; shared by the Preflight plugin
 * and the audit, covered by checks.test.mjs.
 */
import {
  decodeEntities, escapeHtml, flat, hasDecimalComma, linkHtml, modelsForPath, parseFigure,
  parseTechDataHref, sameFigure, textOf, valuesOfModels,
} from './tech-data.js';

const METADATA_OPEN_RE = /^<div\b[^>]*\bclass="(?:section-)?metadata"/i;
const BLOCK_TAG_RE = /^<\/?(?:p|div|li|h[1-6]|td|th|tr|table|ul|ol|br|blockquote)\b/i;
const HREF_RE = /\bhref="([^"]*)"/i;
const ANCHOR_RE = /<a\b([^>]*?)\bhref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
// a Technical Data cell: <p><strong>value</strong></p><p>label</p>
const CELL_RE = /(<p\b[^>]*>\s*<strong\b[^>]*>)([\s\S]*?)(<\/strong>\s*<\/p>\s*<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi;
// a range or consumption figure in running text
const CLAIM_RE = /(\d[\d.,]*(?:\s*[-–]\s*\d[\d.,]*)?)\s*((?:kWh|l)\/100\s*km|km(?![/\w])|kilomet(?:re|er)s?\b)/g;
const APPROXIMATE_RE = /\b(?:more than|over|at least|almost|nearly|around|approximately|about|in excess of|by)\s*$/i;
// a range sentence about a drive, a test or a record states a measured result, not the WLTP figure
const MEASURED_RE = /\b(?:record|test|tested|real-world|drive|drove|driven|covered|journey|trip)\b/i;
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+(?=[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ"“])/;
const LINK_MASK = ' \u2063 ';
const LEGAL_FIELDS = ['range', 'consumption'];
const MAX_DETAILS = 12;

// grid label → sheet field; labels are compared lowercased and whitespace-collapsed
const GRID_FIELDS = [
  [/^maximum performance$/, 'power'],
  [/^maximum torque$/, 'torque'],
  [/^maximum speed$/, 'topSpeed'],
  [/^acceleration\b/, 'acceleration'],
  [/^boot capacity$/, 'boot'],
  [/^charging time\b/, 'dcCharging'],
  [/^range\b/, 'range'],
  [/^(?:energy |electric |fuel )?consumption\b/, 'consumption'],
];

export function fieldForLabel(label) {
  const text = flat(label).toLowerCase();
  const hit = GRID_FIELDS.find(([re]) => re.test(text));
  return hit ? hit[1] : null;
}

/**
 * The document as tags and text, each text part flagged when it is inside a technical-data link
 * or a (section) metadata block.
 */
function segments(html) {
  let meta = 0;
  let link = 0;
  let techLink = false;
  return String(html ?? '').split(/(<[^>]+>)/).filter((part) => part !== '').map((part) => {
    if (!part.startsWith('<')) {
      return {
        part, tag: false, inMeta: meta > 0, inTechLink: techLink,
      };
    }
    if (meta) {
      if (/^<div\b/i.test(part)) meta += 1;
      else if (/^<\/div>/i.test(part)) meta -= 1;
      return { part, tag: true, inMeta: true };
    }
    if (METADATA_OPEN_RE.test(part)) {
      meta = 1;
      return { part, tag: true, inMeta: true };
    }
    if (/^<a\b/i.test(part)) {
      link += 1;
      techLink = Boolean(parseTechDataHref((part.match(HREF_RE) || [])[1]));
    } else if (/^<\/a>/i.test(part)) {
      link = Math.max(0, link - 1);
      if (!link) techLink = false;
    }
    return { part, tag: true, inMeta: false };
  });
}

/** Text blocks (paragraphs, list items, cells…) outside metadata; technical-data links masked. */
function textBlocks(html) {
  const blocks = [];
  let current = '';
  segments(html).forEach((s) => {
    if (s.inMeta) return;
    if (s.tag) {
      if (BLOCK_TAG_RE.test(s.part)) {
        blocks.push(current);
        current = '';
      }
      return;
    }
    current += s.inTechLink ? LINK_MASK : decodeEntities(s.part);
  });
  blocks.push(current);
  return blocks.map(flat).filter(Boolean);
}

/** The text of the paragraph around a position in the HTML ('' when it isn't in one). */
function paragraphAt(html, index) {
  const start = html.lastIndexOf('<p', index);
  const end = html.indexOf('</p>', index);
  if (start < 0 || end < 0 || html.lastIndexOf('</p>', index) > start) return '';
  return textOf(html.slice(start, end));
}

/** Every technical-data link: its key, its text and the paragraph it sits in. */
export function findLinkedValues(html) {
  const doc = String(html ?? '');
  return [...doc.matchAll(ANCHOR_RE)].map((m) => {
    const binding = parseTechDataHref(m[2]);
    return binding && {
      ...binding, href: m[2], text: textOf(m[4]), paragraph: paragraphAt(doc, m.index),
    };
  }).filter(Boolean);
}

/** Every Technical Data cell whose label names a sheet field. */
export function findGridCells(html) {
  return [...String(html ?? '').matchAll(CELL_RE)].map((m) => {
    const label = textOf(m[4]);
    const field = fieldForLabel(label);
    if (!field) return null;
    const linked = findLinkedValues(m[2])[0] ?? null;
    return {
      label, field, text: textOf(m[2]), linked,
    };
  }).filter(Boolean);
}

/** Range and consumption figures in sentences that say WLTP (technical-data links excluded). */
export function findWltpFigures(html) {
  return textBlocks(html).flatMap((block) => block.split(SENTENCE_SPLIT_RE))
    .filter((sentence) => /\bWLTP\b/.test(sentence))
    .flatMap((sentence) => [...sentence.matchAll(CLAIM_RE)].map((m) => ({
      text: flat(`${m[1]} ${m[2]}`),
      sentence,
      isApproximate: APPROXIMATE_RE.test(sentence.slice(0, m.index)),
    })));
}

/**
 * Range figures in sentences about range that don't say WLTP, unless the sentence is about a drive,
 * a test or a record (those state a measured result and must not be called WLTP).
 */
export function findUnlabelledRanges(html) {
  return textBlocks(html).flatMap((block) => block.split(SENTENCE_SPLIT_RE))
    .filter((s) => /\brange\b/i.test(s) && !/\bWLTP\b/.test(s) && !MEASURED_RE.test(s))
    .flatMap((sentence) => [...sentence.matchAll(CLAIM_RE)]
      .filter((m) => parseFigure(`${m[1]} ${m[2]}`)?.unit === 'km')
      .map((m) => ({ text: flat(`${m[1]} ${m[2]}`), sentence })));
}

/** The page's models and the rows to compare with (all rows when the page has no model). */
function pageContext(sheet, path) {
  const models = modelsForPath(sheet.models, path);
  const rows = models.length
    ? valuesOfModels(sheet.values, models.map((m) => m.code))
    : [...sheet.values.values()];
  return { models, rows };
}

/** The sheet row for a Technical Data cell on this page, or null. */
function rowForCell(sheet, models, field) {
  return models.map((m) => sheet.values.get(`${m.code}.${field}`)).find(Boolean) ?? null;
}

const sourceOf = (row) => [row.source.split('/').pop(), row.sourceDate].filter(Boolean).join(', ');
const status = (issues, reviews) => {
  if (issues) return 'fail';
  return reviews ? 'warn' : 'pass';
};
const countLabel = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const differ = (n) => (n === 1 ? 'differs' : 'differ');

function linksCheck(html, sheet) {
  const linked = findLinkedValues(html);
  const unknown = linked.filter((l) => !sheet.values.has(l.key));
  const stale = linked.filter((l) => {
    const row = sheet.values.get(l.key);
    return row && flat(l.text) !== flat(row.display);
  });
  const details = [
    ...unknown.map((l) => `"${l.text}" links to ${l.key}, which isn't in the sheet`),
    ...stale.map((l) => {
      const row = sheet.values.get(l.key);
      return `${l.key}: "${l.text}" → "${row.display}" (${sourceOf(row)})`;
    }),
  ];
  let summary = 'No linked values on this page';
  if (details.length) summary = `${countLabel(details.length, 'linked value')} ${differ(details.length)} from the sheet`;
  else if (linked.length === 1) summary = 'The linked value matches the sheet';
  else if (linked.length) summary = `All ${linked.length} linked values match the sheet`;
  return {
    id: 'links',
    title: 'Linked values',
    status: status(details.length, 0),
    summary,
    details,
    fixable: stale.length,
  };
}

function gridCheck(html, sheet, models) {
  const cells = findGridCells(html).filter((c) => !c.linked);
  if (!cells.length) {
    return {
      id: 'grid', title: 'Technical Data', status: 'pass', summary: 'No unlinked Technical Data values', details: [],
    };
  }
  if (!models.length) {
    return {
      id: 'grid',
      title: 'Technical Data',
      status: 'warn',
      summary: `This page isn't listed for a model in the sheet: ${countLabel(cells.length, 'value')} not checked`,
      details: [],
    };
  }
  const mismatches = [];
  const reviews = [];
  cells.forEach((cell) => {
    const row = rowForCell(sheet, models, cell.field);
    if (!row) {
      reviews.push(`${cell.label}: "${cell.text}" has no official value in the sheet`);
      return;
    }
    if (!sameFigure(cell.text, row.display)) {
      mismatches.push(`${cell.label}: "${cell.text}" → "${row.display}" (${sourceOf(row)})`);
      return;
    }
    if (hasDecimalComma(cell.text)) reviews.push(`${cell.label}: "${cell.text}" is right but uses a decimal comma; write "${row.display}"`);
  });
  let summary = `${countLabel(cells.length, 'value')} match the sheet`;
  if (mismatches.length) summary = `${countLabel(mismatches.length, 'value')} ${differ(mismatches.length)} from the official figures`;
  else if (reviews.length) summary = 'Values match; some need a look';
  return {
    id: 'grid',
    title: 'Technical Data',
    status: status(mismatches.length, reviews.length),
    summary,
    details: [...mismatches, ...reviews],
    fixable: mismatches.length,
  };
}

const officialFor = (figure, rows) => rows
  .filter((r) => LEGAL_FIELDS.includes(r.field))
  .find((r) => sameFigure(figure.text, r.display)) ?? null;

const officialSummary = (rows, models) => {
  const ranges = models.map((m) => rows.find((r) => r.key === `${m.code}.range`)).filter(Boolean);
  return ranges.map((r) => `${r.display} (${r.label || r.model})`).join('; ');
};

function wltpFiguresCheck(html, rows, models) {
  const figures = findWltpFigures(html);
  const issues = [];
  const reviews = [];
  const official = officialSummary(rows, models);
  const expected = official ? `; official: ${official}` : '';
  figures.forEach((figure) => {
    if (officialFor(figure, rows)) return;
    if (figure.isApproximate) {
      reviews.push(`"${figure.text}" is a rounded WLTP figure${expected}`);
      return;
    }
    issues.push(`"${figure.text}" is labelled WLTP but isn't an official figure${models.length ? '' : ' for any model in the sheet'}${expected}`);
  });
  let summary = 'No WLTP figures in the text';
  if (issues.length) summary = `${countLabel(issues.length, 'WLTP figure')} not in the sheet`;
  else if (reviews.length) summary = `${countLabel(reviews.length, 'rounded WLTP figure')} to check`;
  else if (figures.length) summary = `${countLabel(figures.length, 'WLTP figure')}, all official`;
  return {
    id: 'wltp-figures',
    title: 'WLTP figures in the text',
    status: status(issues.length, reviews.length),
    summary,
    details: [...issues, ...reviews],
  };
}

function wltpLabelCheck(html, rows, models) {
  const cells = findGridCells(html)
    .filter((c) => LEGAL_FIELDS.includes(c.field) && !/\bWLTP\b/.test(c.label))
    .map((c) => `${c.label}: "${c.text}" (add "WLTP" to the label)`);
  const links = findLinkedValues(html)
    .filter((l) => LEGAL_FIELDS.includes(l.field) && l.paragraph && !/\bWLTP\b/.test(l.paragraph))
    .map((l) => `"${l.text}" in "${l.paragraph.slice(0, 80)}"`);
  const official = officialSummary(rows, models);
  const prose = findUnlabelledRanges(html)
    .map((f) => `"${f.text}" in "${f.sentence.slice(0, 80)}": say if it is the WLTP figure${official ? ` (official: ${official})` : ''}`);
  const details = [...cells, ...links, ...prose];
  return {
    id: 'wltp-label',
    title: 'WLTP label',
    status: status(0, details.length),
    summary: details.length
      ? `${countLabel(details.length, 'range or consumption figure')} without "WLTP"`
      : 'Range and consumption figures say WLTP',
    details,
  };
}

function linkableCheck(html, sheet, rows, models) {
  const cells = models.length
    ? findGridCells(html).filter((c) => !c.linked).filter((c) => {
      const row = rowForCell(sheet, models, c.field);
      return row && sameFigure(c.text, row.display);
    }).map((c) => `${c.label}: "${c.text}"`)
    : [];
  const prose = findWltpFigures(html).filter((f) => officialFor(f, rows))
    .map((f) => `"${f.text}" in "${f.sentence.slice(0, 80)}"`);
  const details = [...cells, ...prose];
  return {
    id: 'linkable',
    title: 'Values that could be linked',
    status: status(0, details.length),
    summary: details.length
      ? `${countLabel(details.length, 'official value')} typed as text; link them so they follow the sheet`
      : 'No typed official values',
    details,
    linkable: details.length,
  };
}

/**
 * Run every check on one document.
 * @param {{html: string, path: string, sheet: {values: Map, models: object[]}}} input
 * @returns {{id, title, status: 'pass'|'warn'|'fail', summary, details: string[], more: number,
 *   fixable?: number, linkable?: number}[]}
 */
export function runChecks({ html, path, sheet }) {
  const { models, rows } = pageContext(sheet, path);
  return [
    linksCheck(html, sheet),
    gridCheck(html, sheet, models),
    wltpFiguresCheck(html, rows, models),
    wltpLabelCheck(html, rows, models),
    linkableCheck(html, sheet, rows, models),
  ].map((r) => ({
    ...r,
    details: r.details.slice(0, MAX_DETAILS),
    more: Math.max(0, r.details.length - MAX_DETAILS),
  }));
}

function rewriteLinks(html, sheet, changes) {
  return html.replace(ANCHOR_RE, (all, before, href, after, inner) => {
    const binding = parseTechDataHref(href);
    const row = binding && sheet.values.get(binding.key);
    if (!row || flat(textOf(inner)) === flat(row.display)) return all;
    changes.push({ what: binding.key, from: textOf(inner), to: row.display });
    return `<a${before}href="${href}"${after}>${escapeHtml(row.display)}</a>`;
  });
}

function rewriteCells(html, sheet, models, { mismatched, matching }, changes) {
  return html.replace(CELL_RE, (all, open, value, middle, label, close) => {
    const field = fieldForLabel(textOf(label));
    if (!field || findLinkedValues(value).length) return all;
    const row = rowForCell(sheet, models, field);
    if (!row) return all;
    const isSame = sameFigure(textOf(value), row.display);
    if ((isSame && !matching) || (!isSame && !mismatched)) return all;
    changes.push({ what: textOf(label), from: textOf(value), to: row.display });
    return `${open}${linkHtml(row)}${middle}${label}${close}`;
  });
}

// official WLTP figures typed in a paragraph that says WLTP become links
function linkProse(html, rows, changes) {
  const parts = segments(html);
  let block = [];
  const blocks = [];
  parts.forEach((s, i) => {
    if (s.tag && BLOCK_TAG_RE.test(s.part)) {
      blocks.push(block);
      block = [];
    } else if (!s.tag && !s.inMeta) block.push(i);
  });
  blocks.push(block);
  blocks.forEach((indexes) => {
    const text = indexes.map((i) => parts[i].part).join('');
    if (!/\bWLTP\b/.test(decodeEntities(text))) return;
    indexes.filter((i) => !parts[i].inTechLink).forEach((i) => {
      parts[i].part = parts[i].part.replace(CLAIM_RE, (all) => {
        const row = officialFor({ text: decodeEntities(all) }, rows);
        if (!row) return all;
        changes.push({ what: row.key, from: flat(decodeEntities(all)), to: row.display });
        return linkHtml(row);
      });
    });
  });
  return parts.map((s) => s.part).join('');
}

/**
 * Fix what the checks can fix, from the sheet. `update`: stale links and Technical Data cells
 * that differ (they become links). `link`: official values typed as text become links.
 * @returns {{html: string, changes: {what, from, to}[]}}
 */
export function applyFromSheet({
  html, path, sheet, mode,
}) {
  const changes = [];
  const { models, rows } = pageContext(sheet, path);
  let out = String(html ?? '');
  if (mode === 'update') {
    out = rewriteLinks(out, sheet, changes);
    if (models.length) out = rewriteCells(out, sheet, models, { mismatched: true }, changes);
  } else if (mode === 'link') {
    if (models.length) out = rewriteCells(out, sheet, models, { matching: true }, changes);
    out = linkProse(out, rows, changes);
  } else {
    throw new Error(`applyFromSheet: unknown mode "${mode}"`);
  }
  return { html: out, changes };
}

export { parseFigure };
