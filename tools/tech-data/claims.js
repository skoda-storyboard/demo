/*
 * Technical claims in running text (SKODA-852): every number with a vehicle-spec unit, classified
 * by its unit and the words around it, and checked against the sheet rows of the model (and
 * version) the sentence is about. Pure string code, no DOM; used by checks.js, covered by
 * claims.test.mjs.
 *
 * A claim is never passed silently:
 * - it matches an official row (or, for a measured result, a record) → ok;
 * - it contradicts the rows → issue;
 * - there is no reference to check it against, or it is rounded, ambiguous, about another
 *   configuration (Sportline) or on a page without a model → review.
 */
import { flat, FIELD_LABELS, toNumber } from './tech-data.js';

// "seven-seat", "three rows of seats", "six trim levels"
const NUMBER_WORDS = Object.fromEntries(['one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve'].map((word, i) => [word, i + 1]));
// 1,690 · 2,500 · 9.2 · 5,4 · 13.6
const NUM = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?`;
// unit spellings → canonical unit; longest first. "765-litre", "32-inch", "210-kW" carry a hyphen.
const UNITS = [
  [String.raw`kWh\s*(?:\/|per)\s*100\s*km`, 'kWh/100 km'],
  [String.raw`l\s*(?:\/|per)\s*100\s*km`, 'l/100 km'],
  [String.raw`g\s*\/\s*km`, 'g/km'],
  [String.raw`km\/h|kph`, 'km/h'],
  ['kWh', 'kWh'],
  ['kW', 'kW'],
  [String.raw`kilomet(?:re|er)s?|km`, 'km'],
  [String.raw`kilograms?|kg`, 'kg'],
  ['tonnes?', 't'],
  [String.raw`litres?|liters?|l`, 'l'],
  [String.raw`millimet(?:re|er)s?|mm`, 'mm'],
  [String.raw`metres?|meters?`, 'm'],
  ['inch(?:es)?|″', 'inch'],
  ['Nm', 'Nm'],
  ['hp|bhp|PS', 'hp'],
  ['W', 'W'],
  [String.raw`minutes?|mins?`, 'min'],
  [String.raw`hours?|hrs?|h`, 'h'],
  [String.raw`seconds?|secs?|s`, 's'],
  [String.raw`seat(?:er)?s?`, 'seats'],
];
const UNIT_RE_PART = UNITS.map(([re]) => `(?:${re})`).join('|');
const DIGIT_CLAIM_RE = new RegExp(`(?<![\\w.,/-])(${NUM})(?:\\s*(?:-|–|—|to)\\s*(${NUM}))?(?:\\s*|-)(${UNIT_RE_PART})(?![\\w/])`, 'g');
const WORD_CLAIM_RE = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join('|')})(?:\\s+|-)(seat(?:er)?s?|rows? of seats|trim levels?|equipment levels?)\\b`, 'gi');
const DIGIT_COUNT_RE = /(?<![\w.,/-])(\d{1,2})(?:\s+|-)(rows? of seats|trim levels?|equipment levels?)\b/gi;
const PLATFORM_RE = /\b(?:on|built on|based on|uses?|using)\s+(?:the\s+)?(?:new\s+)?([A-Z][A-Z0-9+-]{1,12})(?:\s+[a-z]+){0,2}\s+platform\b/g;

const unitOf = (text) => UNITS.find(([re]) => new RegExp(`^(?:${re})$`).test(text))?.[1] ?? null;

// qualifiers right before the number
const UP_TO_RE = /\b(?:up to|maximum(?: of)?|max\.?|as much as)\s*$/i;
const FROM_RE = /\b(?:from|starting at)\s*$/i;
const APPROX_RE = /\b(?:around|about|approximately|approx\.?|roughly|some|nearly|almost|close to|just under|just over)\s*$/i;
const OVER_RE = /\b(?:more than|over|above|in excess of|at least|beyond)\s*$/i;
// "exceeded this figure by 289 km", "an extra 50 km": a difference, not a figure of the car
const DIFFERENCE_RE = /\b(?:by|another|extra|additional|further)\s*$/i;

// a clause states a measured result (a drive that happened) when it has a completed-drive verb or
// the sentence is about a record, and the clause itself makes no capability claim. Only the clause
// counts: "trip" or "record" elsewhere never turns "offers up to 936 km" into a measurement.
const MEASURED_VERB_RE = /\b(?:covered|covering|drove|driven|travel(?:l)?ed|achieved|completed|recorded|managed|reached|clocked|averag(?:ed|ing)|consumed|returned)\b/i;
const RECORD_RE = /\brecord(?:-worthy|-breaking|-setting)?\b/i;
const CAPABILITY_RE = /\b(?:up to|can|could|will|would|offers?|provides?|delivers?|promises?|capable|rated|homologated|WLTP|maximum|max\.)\b/i;
// a km figure is about range only with range words in its own clause; otherwise it is a distance
const RANGE_CONTEXT_RE = /\brange\b|\b(?:single|one|a|full) charge\b|\bwithout (?:re)?charg|\bWLTP\b|\brecord(?:-worthy|-breaking|-setting)?\b/i;
const CHARGING_RE = /\bcharg|\btop-?up\b|\b10\s*[–-]\s*80\b/i;
const ACCELERATION_RE = /\b0\s*[–-]\s*100\b|\bzero to (?:100|sixty)\b|\bsprint/i;
const CLAUSE_SPLIT_RE = /[,;:()]|\s[–—]\s/;
const SPORTLINE_RE = /\bsportline\b/i;
// body / derivative words: [in the sentence, in a model name, how to say it]
const VARIANT_WORDS = [
  [/(?<![\p{L}\p{N}])coup[ée](?![\p{L}\p{N}])/iu, /coup[ée]/iu, 'Coupé'],
  [/\bRS\b/, /\bRS\b/, 'RS'],
];

const KW_CONTEXTS = [
  ['dcChargingPower', /\bDC\b|\brapid[- ]charg|\bfast[- ]charg|\bhigh-power charg|\bHPC\b/i],
  ['acChargingPower', /\bAC\b|\bon-?board charger|\bwallbox|\bhome charg/i],
  ['power', /\bpower\b|\boutput\b|\bmotors?\b|\bperformance\b|\bhorsepower\b/i],
];
const NEAR_CHARS = 80;
// "the 25-litre storage compartment beneath the boot floor" is a compartment, not the boot
// "luggage / boot / cargo compartment" is the boot itself
const COMPARTMENT_RE = /(?<!\b(?:luggage|boot|cargo|load) )\bcompartments?\b|\bstorage (?:box|bin|space under)|\bglove ?box\b|\bcubby\b|\btray\b|\bbins?\b|\bfront storage\b|\bfrunk\b|\bcool(?:ing)? box\b/i;
const COMPARTMENT_CHARS = 30;
// a seat configuration named in the sentence: "seven-seater", "7-seat", "five seats"
const CONFIGURATION_RE = /(?<![\p{L}\p{N}])(five|seven|5|7)[- ]?seat(?:er)?s?(?![\p{L}])/giu;
const configurationOf = (word) => (['five', '5'].includes(word.toLowerCase()) ? '5-seater' : '7-seater');

/** Distance in characters from [start, end) to the nearest match of `re` in the sentence. */
function distanceTo(sentence, re, start, end) {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return [...sentence.matchAll(global)].reduce((best, m) => {
    const d = m.index >= end ? m.index - end : start - (m.index + m[0].length);
    return Math.min(best, Math.max(0, d));
  }, Infinity);
}

const clauseAt = (sentence, index) => {
  let from = 0;
  return sentence.split(CLAUSE_SPLIT_RE).find((part) => {
    const at = sentence.indexOf(part, from);
    from = at + part.length;
    return index >= at && index < at + part.length;
  }) ?? sentence;
};

/** The field a figure is about, or null when it is not a vehicle figure (a distance, a time). */
function fieldOf({
  unit, numbers, sentence, clause, start, end, before,
}) {
  const near = (re) => distanceTo(sentence, re, start, end) <= NEAR_CHARS;
  switch (unit) {
    case 'kWh/100 km':
    case 'l/100 km':
      return 'consumption';
    case 'g/km':
      return 'co2';
    case 'km/h':
      return numbers[0] === 0 || /\b0\s*[–-]\s*$/.test(before) ? null : 'topSpeed';
    case 'kWh':
      // "net 86 kWh", "86 kWh net"; in "91 kWh (net 86 kWh)" the "net" belongs to the 86
      return /\b(?:net|usable|useable)\s*$/i.test(before)
        || /^\s*\(?\s*(?:net|usable)\b(?!\s*\d)/i.test(sentence.slice(end))
        ? 'batteryNet' : 'batteryGross';
    case 'kW': {
      const [field] = KW_CONTEXTS
        .map(([name, re]) => [name, distanceTo(sentence, re, start, end)])
        .filter(([, d]) => d <= NEAR_CHARS)
        .sort((a, b) => a[1] - b[1])[0] ?? [];
      if (field) return field;
      return CHARGING_RE.test(clause) ? 'chargingPower' : 'other';
    }
    case 'km':
      return RANGE_CONTEXT_RE.test(clause) ? 'range' : null;
    case 'l':
      if (distanceTo(sentence, COMPARTMENT_RE, start, end) <= COMPARTMENT_CHARS) return 'other';
      if (!near(/\bboot\b|\bluggage\b|\bcargo\b|\bload(?:ing)? (?:space|capacity|area)\b|\btrunk\b/i)) return 'other';
      if (/\bthird row\b|\b3rd row\b/i.test(clause)) return 'bootThirdRow';
      return /\bfold|\bseats? down\b|\bseatback|\bexpand/i.test(clause) ? 'bootFolded' : 'boot';
    case 'kg':
    case 't':
      return near(/\btow|\btrailer\b|\bcaravan\b|\bhitch\b/i) ? 'towing' : 'other';
    case 'inch':
      return near(/\bdisplay\b|\bscreen\b|\binfotainment\b|\bmonitor\b/i) ? 'display' : 'other';
    case 'min':
      return CHARGING_RE.test(sentence) ? 'dcCharging' : null;
    case 'h':
      return CHARGING_RE.test(clause) ? 'other' : null;
    case 's':
      return ACCELERATION_RE.test(sentence) ? 'acceleration' : null;
    case 'seats':
      return 'seats';
    case 'Nm':
      return 'torque';
    default:
      return 'other';
  }
}

function qualifierOf(before) {
  if (UP_TO_RE.test(before)) return 'max';
  if (FROM_RE.test(before)) return 'min';
  if (APPROX_RE.test(before)) return 'approx';
  if (OVER_RE.test(before)) return 'over';
  return null;
}

function isMeasured(sentence, clause) {
  if (CAPABILITY_RE.test(clause)) return false;
  return MEASURED_VERB_RE.test(clause) || RECORD_RE.test(sentence);
}

/**
 * Every technical figure in one sentence: its text, numbers, unit, field, qualifier and whether
 * it reads as a measured result. Figures that aren't about the car (distances, times) are left out.
 * @returns {{text, numbers: number[], unit, field, qualifier, measured, sentence, index}[]}
 */
export function extractClaims(sentence) {
  // URLs carry numbers ("…/19741036-…-936-km-without-…") that are not claims
  const text = flat(String(sentence ?? '').replace(/\bhttps?:\/\/\S+/g, ' '));
  const claims = [];
  [...text.matchAll(DIGIT_CLAIM_RE)].forEach((m) => {
    const unit = unitOf(m[3]);
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (!unit || DIFFERENCE_RE.test(before)) return;
    const raw = [m[1], m[2]].filter((n) => n !== undefined).map(toNumber);
    if (raw.some((n) => n === null)) return;
    const numbers = unit === 't' ? raw.map((n) => n * 1000) : raw;
    const clause = clauseAt(text, m.index);
    const field = fieldOf({
      unit, numbers, sentence: text, clause, start: m.index, end: m.index + m[0].length, before,
    });
    if (!field) return;
    claims.push({
      text: m[0],
      numbers,
      unit: unit === 't' ? 'kg' : unit,
      field,
      qualifier: qualifierOf(before),
      measured: ['range', 'consumption'].includes(field) && isMeasured(text, clause),
      sentence: text,
      index: m.index,
    });
  });
  [...text.matchAll(WORD_CLAIM_RE), ...text.matchAll(DIGIT_COUNT_RE)].forEach((m) => {
    const what = m[2].toLowerCase();
    let field = 'trims';
    if (what.startsWith('seat')) field = 'seats';
    else if (what.startsWith('row')) field = 'seatRows';
    claims.push({
      text: m[0],
      numbers: [NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1])],
      unit: { seats: 'seats', seatRows: 'rows', trims: 'trims' }[field],
      field,
      qualifier: qualifierOf(text.slice(Math.max(0, m.index - 40), m.index)),
      measured: false,
      sentence: text,
      index: m.index,
    });
  });
  [...text.matchAll(PLATFORM_RE)].forEach((m) => claims.push({
    text: `${m[1]} platform`, numbers: [], unit: '', field: 'platform', qualifier: null, measured: false, sentence: text, index: m.index,
  }));
  return claims.sort((a, b) => a.index - b.index);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`);
/** A whole-word, case-insensitive pattern for a name; \b would fail next to "é" (Coupé). */
export const nameRe = (name, flags = 'iu') => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, flags);

/**
 * The models (and version) a sentence is about: the models it names, else the page's models.
 * A version counts only next to the model name ("Peaq 90") or as "the 90 variant".
 */
export function scopeOf(sentence, sheet, pageModels) {
  const byLength = [...sheet.models].sort((a, b) => b.name.length - a.name.length);
  let rest = sentence;
  const named = byLength.filter((m) => {
    if (!nameRe(m.name).test(rest)) return false;
    rest = rest.replace(nameRe(m.name, 'giu'), ' ');
    return true;
  });
  const models = named.length ? named : pageModels;
  const versionsOf = (m) => [...new Set([...sheet.values.values()]
    .filter((v) => v.model === m.code && v.version).map((v) => v.version))];
  const versionIn = (m) => versionsOf(m).sort((a, b) => b.length - a.length).find((v) => {
    const token = escapeRe(v);
    return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(m.name)}\\s+${token}(?![\\p{L}\\p{N}])`, 'iu').test(sentence)
      || new RegExp(`\\b(?:the\\s+${token}\\s+(?:variant|version|model)|${token}\\s+(?:variant|version)|designated\\s+${token})\\b`, 'i').test(sentence);
  }) ?? '';
  const configurations = new Set([...sentence.matchAll(CONFIGURATION_RE)]
    .map((m) => configurationOf(m[1])));
  return {
    models,
    named: named.length > 0,
    ambiguous: named.length > 1,
    version: models.length === 1 ? versionIn(models[0]) : '',
    configuration: configurations.size === 1 ? [...configurations][0] : '',
    configurationAmbiguous: configurations.size > 1,
  };
}

const numbersOf = (row) => {
  const m = row.display.match(new RegExp(`^(${NUM})(?:\\s*[-–]\\s*(${NUM}))?`));
  return m ? [m[1], m[2]].filter((n) => n !== undefined).map(toNumber) : [];
};
const sameNumbers = (a, b) => a.length === b.length && a.every((n, i) => n === b[i]);

/**
 * The rows a claim is compared with: its field, its scope's models, the named version and the
 * named configuration (rows for no configuration apply to all). Units are not filtered here.
 */
function rowsForField(claim, sheet, scope) {
  const fields = claim.field === 'chargingPower'
    ? ['dcChargingPower', 'acChargingPower'] : [claim.field];
  const codes = new Set(scope.models.map((m) => m.code));
  let rows = [...sheet.values.values()]
    .filter((v) => codes.has(v.model) && fields.includes(v.field));
  if (scope.version) {
    const versionRows = rows.filter((v) => v.version === scope.version);
    rows = versionRows.length ? versionRows : rows.filter((v) => !v.version);
  }
  if (scope.configuration) {
    rows = rows.filter((v) => !v.configuration || v.configuration === scope.configuration);
  }
  return rows;
}

// a figure in l/100 km is never checked against kWh/100 km, nor a record in another unit
const sameUnit = (row, claim) => row.unit === claim.unit;

/** A record (measured result) for the claim: scope models, field, unit, version, configuration. */
function recordFor(sheet, scope, claim, numbers = claim.numbers) {
  const codes = new Set(scope.models.map((m) => m.code));
  return (sheet.records ?? []).find((r) => codes.has(r.model) && r.field === claim.field
    && sameUnit(r, claim)
    && (!scope.version || r.version === scope.version)
    && (!scope.configuration || !r.configuration || r.configuration === scope.configuration)
    && sameNumbers(numbersOf(r), numbers)) ?? null;
}

/**
 * A single number strictly inside a model-level min–max when the sheet has no per-version rows
 * for it: it may be a version's figure the sheet lacks. With version rows, it is simply not one.
 */
const isWithinDerived = (n, rows) => !rows.some((r) => r.version) && rows.some((r) => {
  const o = numbersOf(r);
  return o.length === 2 && n > o[0] && n < o[1];
});

/** 'ok' | 'rounded' | 'within' | 'differs' for a claim against rows that exist. */
function compare(claim, rows) {
  const official = rows.map(numbersOf).filter((n) => n.length);
  if (claim.numbers.length === 2) {
    return official.some((o) => sameNumbers(o, claim.numbers)) ? 'ok' : 'differs';
  }
  const [n] = claim.numbers;
  const tops = official.map((o) => Math.max(...o));
  const bottoms = official.map((o) => Math.min(...o));
  const values = official.flat();
  switch (claim.qualifier) {
    case 'max': return tops.includes(n) ? 'ok' : 'differs';
    case 'min': return bottoms.includes(n) ? 'ok' : 'differs';
    case 'approx':
      if (values.includes(n)) return 'ok';
      if (values.some((v) => Math.abs(v - n) <= Math.max(1, v * 0.03))) return 'rounded';
      return isWithinDerived(n, rows) ? 'within' : 'differs';
    case 'over': return tops.some((t) => t > n) ? 'rounded' : 'differs';
    default:
      if (values.includes(n)) return 'ok';
      return isWithinDerived(n, rows) ? 'within' : 'differs';
  }
}

/** The rows the claim matches exactly by its qualifier ('ok'), from the scoped, same-unit rows. */
const matchingRows = (claim, rows) => rows.filter((r) => compare(claim, [r]) === 'ok');

const sourceOf = (row) => [row.source.split('/').pop(), row.sourceDate].filter(Boolean).join(', ');
const labelOf = (field) => FIELD_LABELS[field] ?? field;
// a measured result is never "WLTP"
const MEASURED_LABELS = {
  range: 'distance driven on one charge', consumption: 'consumption on the drive',
};
const SNIPPET_LENGTH = 90;

/** "Peaq 60: 160 kW; Peaq 90: 199 kW (TD-Peaq-en_….pdf, 21. 9. 2026)": versions first. */
function expectedOf(rows) {
  const specific = rows.filter((r) => r.version || r.configuration);
  const shown = specific.length ? specific : rows;
  const list = shown.map((r) => `${r.label}: ${r.display}`).join('; ');
  const sources = [...new Set(rows.map(sourceOf))].join('; ');
  return `${list} (${sources})`;
}

const MESSAGES = {
  noModel: 'this page has no model in the sheet, so the figure can\'t be checked; set the page\'s model metadata',
  sportline: 'the sentence is about a Sportline car; the TD PDF doesn\'t apply to Sportline, so there is no reference to check against',
};
// verdicts that mean "can't tell what this figure is about": a link can't be verified either
const SCOPE_REVIEWS = new Set(['no-model', 'ambiguous', 'sportline', 'variant', 'configuration']);

/** A configuration-only match when the sentence names no configuration: say which, don't accept. */
function configurationReview(claim, scope, rows, matched) {
  const configured = [...new Set(rows.map((r) => r.configuration).filter(Boolean))];
  if (configured.length < 2) return null;
  if (scope.configurationAmbiguous) {
    return ['review', 'configuration', `the sentence names more than one seat configuration; the figure differs by configuration (${expectedOf(rows)})`];
  }
  if (scope.configuration || !matched.length || !matched.every((r) => r.configuration)) return null;
  const which = [...new Set(matched.map((r) => r.configuration))].join(' / ');
  return ['review', 'configuration', `matches the ${which} figure only; say which configuration it is for (${expectedOf(rows)})`];
}

/** The verdict before links: [status, reason, message, extra]. */
function baseVerdict(claim, sheet, scope) {
  if (!scope.models.length) return ['review', 'no-model', MESSAGES.noModel];
  const names = scope.models.map((m) => m.name).join(' and ');
  if (scope.ambiguous) return ['review', 'ambiguous', `the sentence names ${names}; check which figure belongs to which`];
  if (SPORTLINE_RE.test(claim.sentence)) return ['review', 'sportline', MESSAGES.sportline];
  // "the Coupé version offers 570 litres" on the Enyaq RS page: a variant the scope isn't
  const variant = VARIANT_WORDS.find(([re, mark]) => re.test(claim.sentence)
    && !scope.models.some((m) => mark.test(m.name)));
  if (variant) return ['review', 'variant', `the sentence is about the ${variant[2]}, not the ${names}; check it against the ${variant[2]}'s figures`];
  if (claim.measured) {
    const record = recordFor(sheet, scope, claim);
    if (record) return ['ok', 'record', `matches the recorded result (${record.label}, ${record.sourceDate})`, { record }];
    return ['review', 'measured', `reads as a measured result, but the records tab has no such result for the ${names}; check its source`];
  }
  const fieldRows = rowsForField(claim, sheet, scope);
  const subject = scope.version ? `${names} ${scope.version}` : names;
  if (!fieldRows.length) return ['review', 'no-reference', `no reference data for the ${subject}; check it against an official source before publishing`];
  const rows = fieldRows.filter((r) => sameUnit(r, claim));
  if (!rows.length) {
    const units = [...new Set(fieldRows.map((r) => r.unit))].join(', ');
    return ['review', 'unit', `stated in ${claim.unit}, but the official ${labelOf(claim.field).toLowerCase()} for the ${subject} is in ${units}; check the figure and its unit`];
  }
  const verdict = compare(claim, rows);
  if (verdict === 'ok') {
    const matched = matchingRows(claim, rows);
    const review = configurationReview(claim, scope, rows, matched);
    if (review) return review;
    // the row the figure is exactly (same numbers): only that one may be linked
    const exact = matched.find((r) => sameNumbers(numbersOf(r), claim.numbers)) ?? null;
    return ['ok', 'official', 'matches the official figure', { row: exact }];
  }
  const expected = expectedOf(rows);
  if (verdict === 'rounded') return ['review', 'rounded', `rounded; official ${expected}`];
  if (verdict === 'within') return ['review', 'within', `inside the official ${expected}, but the sheet has no per-version figure to confirm it`];
  // "up to 936 km": say so when the number is a recorded result, not the car's figure
  const record = recordFor(sheet, { ...scope, version: '', configuration: '' }, claim, [Math.max(...claim.numbers)]);
  const recordNote = record
    ? ` ${record.display} is the ${record.label} (${record.sourceDate}), a measured result, not the car's WLTP ${claim.field}.`
    : '';
  return ['issue', 'differs', `differs from the official figure; official ${expected}.${recordNote}`];
}

/**
 * The verdict for one claim. A linked value is checked like typed text, in its sentence; the link
 * must then be one of the rows the sentence's figure matches (model, version, configuration,
 * field, unit). A link never makes a figure pass that the text alone wouldn't.
 */
function verdictOf(claim, sheet, pageModels, link) {
  const scope = scopeOf(claim.sentence, sheet, pageModels);
  const base = baseVerdict(claim, sheet, scope);
  const linkRow = link && sheet.values.get(link.key);
  if (!linkRow || SCOPE_REVIEWS.has(base[1])) return base; // an unknown key is the links check's
  const what = `${link.key} (${linkRow.label}: ${linkRow.display})`;
  if (claim.measured) {
    return ['issue', 'link-measured', `a measured result linked to ${what}, an official figure; a drive or record must not link to the car's figures`];
  }
  const scoped = rowsForField(claim, sheet, scope).filter((r) => sameUnit(r, claim));
  const eligible = matchingRows(claim, scoped);
  if (eligible.some((r) => r.key === linkRow.key)) return base;
  const tail = base[0] === 'issue' ? `; and the figure ${base[2]}` : '';
  return ['issue', 'link-scope', `linked to ${what}, which isn't this sentence's ${labelOf(claim.field).toLowerCase()}${tail}`];
}

const numbersInText = (text) => numbersOf({ display: flat(text) });

/**
 * Check every claim of every sentence.
 * @param {{text: string, where?: string, links?: {key: string, text: string}[]}[]} sentences
 *   the text, sentence by sentence, with the technical-data links each sentence holds
 * @param {{values: Map, models: object[], records?: object[]}} sheet
 * @param {object[]} pageModels the page's models (modelsForPage)
 * @returns {{claim, status: 'ok'|'issue'|'review', reason: string, message: string,
 *   row?: object|null, record?: object, link?: object}[]}
 */
export function checkClaims(sentences, sheet, pageModels) {
  return sentences.flatMap(({ text, where, links = [] }) => {
    const free = [...links];
    return extractClaims(text).map((claim) => {
      // the link whose text is this figure (first unused one with the same numbers)
      const at = free.findIndex((l) => flat(l.text).includes(claim.text.split(/\s/)[0])
        && sameNumbers(numbersInText(l.text), claim.numbers));
      const link = at >= 0 ? free.splice(at, 1)[0] : null;
      const short = claim.sentence.length > SNIPPET_LENGTH
        ? `${claim.sentence.slice(0, SNIPPET_LENGTH - 3)}…` : claim.sentence;
      const snippet = `${where ? `${where}: ` : ''}"${short}"`;
      const label = claim.measured ? MEASURED_LABELS[claim.field] : labelOf(claim.field);
      const [status, reason, message, extra = {}] = verdictOf(claim, sheet, pageModels, link);
      return {
        claim, status, reason, link, message: `"${claim.text}" (${label}) in ${snippet}: ${message}`, ...extra,
      };
    });
  });
}
