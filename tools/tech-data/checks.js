/*
 * Technical-data checks for one document (SKODA-852): DA source HTML or a page's .plain.html, the
 * sheet, the page path. Deterministic rules, no model involved; shared by the Preflight plugin
 * and the audit, covered by checks.test.mjs.
 */
import {
  decodeEntities, escapeHtml, flat, hasDecimalComma, linkHtml, modelsForPage, pageTags, parseFigure,
  parseTechDataHref, readMetadata, sameFigure, textOf, valuesOfModels,
} from './tech-data.js';
import { checkClaims, extractClaims, nameRe } from './claims.js';

const METADATA_OPEN_RE = /^<div\b[^>]*\bclass="(?:section-)?metadata"/i;
const BLOCK_TAG_RE = /^<\/?(?:p|div|li|h[1-6]|td|th|tr|table|ul|ol|br|blockquote)\b/i;
const HREF_RE = /\bhref="([^"]*)"/i;
const ANCHOR_RE = /<a\b([^>]*?)\bhref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
// a Technical Data cell: <p><strong>value</strong></p><p>label</p>. Value and label may hold inline
// markup only, so a match never runs across paragraphs, headings or cells (review P1).
const CELL_RE = /(<p\b[^>]*>\s*<strong\b[^>]*>)((?:(?!<\/?(?:strong|p|div|h[1-6]|ul|ol|li|table|tr|td|th)\b)[\s\S])*?)(<\/strong>\s*<\/p>\s*<p\b[^>]*>)((?:(?!<\/?(?:p|div|h[1-6]|ul|ol|li|table|tr|td|th)\b)[\s\S])*?)(<\/p>)/gi;
// the block and formatting tags a fix must leave exactly as they were
const STRUCTURE_RE = /<\/?(?:p|div|h[1-6]|ul|ol|li|table|tr|td|th|strong|em|picture|img|source)\b/gi;
// a range or consumption figure in running text
const CLAIM_RE = /(\d[\d.,]*(?:\s*[-–]\s*\d[\d.,]*)?)\s*((?:kWh|l)\/100\s*km|km(?![/\w])|kilomet(?:re|er)s?\b)/g;
const APPROXIMATE_RE = /\b(?:more than|over|at least|almost|nearly|around|approximately|about|in excess of|by)\s*$/i;
// "up to 577 km" names the top of an official interval, "from 408 km" its bottom (review P2 #6)
const UP_TO_RE = /\b(?:up to|maximum(?: of)?|max\.?|as much as)\s*$/i;
const FROM_RE = /\bfrom\s*$/i;
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
  let techKey = '';
  let techId = 0;
  return String(html ?? '').split(/(<[^>]+>)/).filter((part) => part !== '').map((part) => {
    if (!part.startsWith('<')) {
      return {
        part, tag: false, inMeta: meta > 0, inTechLink: techLink, techKey, techId,
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
      const binding = parseTechDataHref((part.match(HREF_RE) || [])[1]);
      techLink = Boolean(binding);
      techKey = binding?.key ?? '';
      if (binding) techId += 1;
    } else if (/^<\/a>/i.test(part)) {
      link = Math.max(0, link - 1);
      if (!link) {
        techLink = false;
        techKey = '';
      }
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

/**
 * Text blocks outside metadata with technical-data links left in the text, and the links each
 * block holds ({key, text}), so a linked value is checked in its sentence like typed text.
 */
function textBlocksWithLinks(html) {
  const blocks = [];
  let current = { text: '', links: new Map() };
  segments(html).forEach((s) => {
    if (s.inMeta) return;
    if (s.tag) {
      if (BLOCK_TAG_RE.test(s.part)) {
        blocks.push(current);
        current = { text: '', links: new Map() };
      }
      return;
    }
    const text = decodeEntities(s.part);
    current.text += text;
    if (s.inTechLink) {
      const link = current.links.get(s.techId) ?? { key: s.techKey, text: '' };
      link.text += text;
      current.links.set(s.techId, link);
    }
  });
  blocks.push(current);
  return blocks.map((b) => ({ text: flat(b.text), links: [...b.links.values()] }))
    .filter((b) => b.text);
}

// a block that is only a figure ("935 l", "150 - 220 kW") is a Technical Data cell value;
// the grid check owns it
const FIGURE_ONLY_RE = /^[\d\s.,–—*-]+\s*(?:[A-Za-z°″%]+\/?)*(?:\s*\/?\s*100\s*km)?\s*\*?$/;

/**
 * The document's text, sentence by sentence, for the claims check: every text block outside the
 * metadata (figure-only cells left to the grid check), then the metadata Title and Description,
 * which search results and social cards show.
 * Technical-data links stay in the text; each sentence lists the links it holds.
 * @returns {{text: string, where?: string, links?: {key: string, text: string}[]}[]}
 */
export function sentencesOf(html) {
  const split = (text) => text.split(SENTENCE_SPLIT_RE).map(flat).filter(Boolean);
  const body = textBlocksWithLinks(html).filter((block) => !FIGURE_ONLY_RE.test(block.text))
    .flatMap((block) => {
      const sentences = split(block.text).map((text) => ({ text, links: [] }));
      // each link goes to the first sentence that holds its text, in order
      let from = 0;
      block.links.forEach((link) => {
        const at = sentences.findIndex((s, i) => i >= from && s.text.includes(flat(link.text)));
        if (at < 0) return;
        sentences[at].links.push(link);
        from = at;
      });
      return sentences;
    });
  const meta = readMetadata(html);
  const fromMetadata = [['title', 'Title'], ['description', 'Description']]
    .flatMap(([key, where]) => split(meta.get(key) ?? '').map((text) => ({ text, where })));
  return [...body, ...fromMetadata];
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

/** 'max' after "up to", 'min' after "from", else null. */
function boundOf(before) {
  if (UP_TO_RE.test(before)) return 'max';
  if (FROM_RE.test(before)) return 'min';
  return null;
}

/** Range and consumption figures in sentences that say WLTP (technical-data links excluded). */
export function findWltpFigures(html) {
  return textBlocks(html).flatMap((block) => block.split(SENTENCE_SPLIT_RE))
    .filter((sentence) => /\bWLTP\b/.test(sentence))
    .flatMap((sentence) => [...sentence.matchAll(CLAIM_RE)].map((m) => ({
      text: flat(`${m[1]} ${m[2]}`),
      sentence,
      isApproximate: APPROXIMATE_RE.test(sentence.slice(0, m.index)),
      bound: boundOf(sentence.slice(0, m.index)),
    })));
}

/**
 * Range figures stated as what the car can do, in sentences that don't say WLTP. A measured
 * result (a record drive) is left out: it must not be called WLTP. Whether a clause is measured is
 * decided in that clause (claims.js), so "trip" elsewhere in the sentence doesn't hide a claim.
 */
export function findUnlabelledRanges(html) {
  return textBlocks(html).filter((block) => !FIGURE_ONLY_RE.test(block))
    .flatMap((block) => block.split(SENTENCE_SPLIT_RE))
    .flatMap((sentence) => extractClaims(sentence))
    .filter((c) => c.field === 'range' && !c.measured && !/\bWLTP\b/.test(c.sentence))
    .map((c) => ({ text: c.text, sentence: c.sentence }));
}

/**
 * The page's models and the rows to compare with (all rows when the page has no model). Models
 * come from the path, else from the metadata block's model / derivative / tags, else from `tags`
 * the caller read elsewhere (the audit reads them from the rendered page).
 */
function pageContext(sheet, path, html, tags) {
  const fromDocument = pageTags(html);
  const pageTagSet = fromDocument.length ? fromDocument : (tags ?? []);
  const models = modelsForPage(sheet.models, { path, tags: pageTagSet });
  // no model, no rows: comparing with every model would let another model's figure pass
  const rows = valuesOfModels(sheet.values, models.map((m) => m.code));
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

function linksCheck(html, sheet, models) {
  const linked = findLinkedValues(html);
  const unknown = linked.filter((l) => !sheet.values.has(l.key));
  const stale = linked.filter((l) => {
    const row = sheet.values.get(l.key);
    return row && flat(l.text) !== flat(row.display);
  });
  const pageCodes = new Set(models.map((m) => m.code));
  const foreign = models.length ? linked.filter((l) => {
    const row = sheet.values.get(l.key);
    if (!row || pageCodes.has(row.model)) return false;
    const name = sheet.models.find((m) => m.code === row.model)?.name ?? row.model;
    return !nameRe(name).test(l.paragraph);
  }) : [];
  const details = [
    ...unknown.map((l) => `"${l.text}" links to ${l.key}, which isn't in the sheet`),
    ...foreign.map((l) => `"${l.text}" links to ${l.key} (${sheet.values.get(l.key).label}), not this page's ${models.map((m) => m.name).join(', ')}, and the paragraph doesn't name that model`),
    ...stale.map((l) => {
      const row = sheet.values.get(l.key);
      return `${l.key}: "${l.text}" → "${row.display}" (${sourceOf(row)})`;
    }),
  ];
  let summary = 'No linked values on this page';
  if (details.length) summary = `${countLabel(details.length, 'linked value')} need fixing`;
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
  const cells = findGridCells(html);
  if (!cells.length) {
    return {
      id: 'grid', title: 'Technical Data', status: 'pass', summary: 'No Technical Data values', details: [],
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
    if (cell.linked) {
      // a linked cell may only link this page's row; its text against that row is the links check
      if (cell.linked.key !== row.key) {
        mismatches.push(`${cell.label}: "${cell.text}" is linked to ${cell.linked.key}; this page's official value is "${row.display}" (${sourceOf(row)})`);
      }
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

const officialSummary = (rows, models) => {
  const ranges = models.map((m) => rows.find((r) => r.key === `${m.code}.range`)).filter(Boolean);
  return ranges.map((r) => `${r.display} (${r.label || r.model})`).join('; ');
};

/**
 * Every technical claim in the text (claims.js): an Issue when it contradicts the official figures,
 * a Review when it is rounded, measured but not recorded, or has nothing to be checked against.
 */
function claimsCheck(html, sheet, models) {
  const results = checkClaims(sentencesOf(html), sheet, models);
  const issues = results.filter((r) => r.status === 'issue');
  const reviews = results.filter((r) => r.status === 'review');
  const passed = results.length - issues.length - reviews.length;
  let summary = 'No technical claims in the text';
  if (results.length) {
    summary = [
      issues.length && `${countLabel(issues.length, 'claim')} ${differ(issues.length)} from the official figures`,
      reviews.length && `${reviews.length} need${reviews.length === 1 ? 's' : ''} review`,
      passed && `${passed} match${passed === 1 ? 'es' : ''}`,
    ].filter(Boolean).join(', ');
  }
  return {
    id: 'claims',
    title: 'Technical claims in the text',
    status: status(issues.length, reviews.length),
    summary,
    details: [...issues, ...reviews].map((r) => r.message),
    counts: { issues: issues.length, reviews: reviews.length, passed },
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

/**
 * Typed WLTP range / consumption figures become links, only where the claims check verified them:
 * status ok, an official figure of the sentence's model, version and configuration, same unit,
 * and a row that is exactly that figure. Issues, Reviews, rounded and "up to" a min–max figures
 * are never linked, and no text is corrected.
 */
function linkProse(html, sheet, models, changes) {
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
    const text = flat(decodeEntities(indexes.map((i) => parts[i].part).join('')));
    if (!/\bWLTP\b/.test(text)) return;
    // the block's claims in order, each with the row it may be linked to (or none)
    const sentences = text.split(SENTENCE_SPLIT_RE).map((s) => ({ text: flat(s) }));
    const plan = checkClaims(sentences, sheet, models)
      .filter((r) => LEGAL_FIELDS.includes(r.claim.field))
      .map((r) => ({
        text: flat(r.claim.text),
        row: r.status === 'ok' && r.reason === 'official' && /\bWLTP\b/.test(r.claim.sentence) ? r.row : null,
      }));
    let next = 0;
    // match each typed figure to its claim in order; a figure without one is left alone
    const take = (figure) => {
      const at = plan.findIndex((p, i) => i >= next && p.text === figure);
      if (at < 0) return null;
      next = at + 1;
      return plan[at];
    };
    indexes.forEach((i) => {
      parts[i].part = parts[i].part.replace(CLAIM_RE, (all) => {
        const entry = take(flat(decodeEntities(all)));
        if (parts[i].inTechLink || !entry?.row) return all;
        const from = flat(decodeEntities(all));
        changes.push({ what: entry.row.key, from, to: entry.row.display });
        return linkHtml(entry.row);
      });
    });
  });
  return parts.map((s) => s.part).join('');
}

function linkableCheck(html, sheet, models) {
  const cells = models.length
    ? findGridCells(html).filter((c) => !c.linked).filter((c) => {
      const row = rowForCell(sheet, models, c.field);
      return row && sameFigure(c.text, row.display);
    }).map((c) => `${c.label}: "${c.text}"`)
    : [];
  const planned = [];
  linkProse(html, sheet, models, planned);
  const prose = planned.map((c) => `"${c.from}" (${c.what})`);
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
export function runChecks({
  html, path, sheet, tags,
}) {
  const { models, rows } = pageContext(sheet, path, html, tags);
  return [
    linksCheck(html, sheet, models),
    gridCheck(html, sheet, models),
    claimsCheck(html, sheet, models),
    wltpLabelCheck(html, rows, models),
    linkableCheck(html, sheet, models),
  ].map((r) => ({
    ...r,
    details: r.details.slice(0, MAX_DETAILS),
    more: Math.max(0, r.details.length - MAX_DETAILS),
  }));
}

const structureOf = (html) => (html.match(STRUCTURE_RE) || []).map((tag) => tag.toLowerCase()).join(' ');
const VALUE_MARK = '\u0000';
const FIGURE_TEXT_RE = /\d[\d.,\s–-]*\s*(?:kWh\/100 ?km|l\/100 ?km|km\/h|kilomet(?:re|er)s?|km|kW|Nm|min|s|l)\b/g;
// the text with every link and every figure as one mark, so a fix may change only those
const textOutsideValues = (html) => flat(decodeEntities(html
  .replace(ANCHOR_RE, ` ${VALUE_MARK} `)
  .replace(/<[^>]*>/g, ' '))
  .replace(FIGURE_TEXT_RE, ` ${VALUE_MARK} `))
  .replace(new RegExp(`${VALUE_MARK}(?:\\s*${VALUE_MARK})*`, 'g'), VALUE_MARK);

/**
 * A fix only touches link texts and wraps values in links. Anything else (a block or a format
 * tag gone, text outside the values changed) means a rule matched too much: refuse to save.
 */
export function assertSameStructure(before, after) {
  if (structureOf(before) !== structureOf(after)) {
    throw new Error('The change would alter the document structure, so nothing was saved');
  }
  if (textOutsideValues(before) !== textOutsideValues(after)) {
    throw new Error('The change would alter text outside the values, so nothing was saved');
  }
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
    const row = field && rowForCell(sheet, models, field);
    if (!row) return all;
    const linked = findLinkedValues(value)[0];
    if (linked) {
      // linked to another model's row: relink to this page's row (update only)
      if (!mismatched || linked.key === row.key) return all;
      changes.push({ what: textOf(label), from: `${textOf(value)} (${linked.key})`, to: row.display });
      return `${open}${linkHtml(row)}${middle}${label}${close}`;
    }
    const isSame = sameFigure(textOf(value), row.display);
    if ((isSame && !matching) || (!isSame && !mismatched)) return all;
    changes.push({ what: textOf(label), from: textOf(value), to: row.display });
    return `${open}${linkHtml(row)}${middle}${label}${close}`;
  });
}

/**
 * Fix what the checks can fix, from the sheet. `update`: stale links and Technical Data cells
 * that differ (they become links). `link`: official values typed as text become links.
 * @returns {{html: string, changes: {what, from, to}[]}}
 */
export function applyFromSheet({
  html, path, sheet, mode, tags,
}) {
  const changes = [];
  const input = String(html ?? '');
  const { models } = pageContext(sheet, path, input, tags);
  let out = input;
  if (mode === 'update') {
    if (models.length) out = rewriteCells(out, sheet, models, { mismatched: true }, changes);
    out = rewriteLinks(out, sheet, changes);
  } else if (mode === 'link') {
    if (models.length) out = rewriteCells(out, sheet, models, { matching: true }, changes);
    out = linkProse(out, sheet, models, changes);
  } else {
    throw new Error(`applyFromSheet: unknown mode "${mode}"`);
  }
  assertSameStructure(input, out);
  return { html: out, changes };
}

export { parseFigure };
