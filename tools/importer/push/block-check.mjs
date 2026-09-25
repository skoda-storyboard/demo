/*
 * block-check.mjs — pure helpers for the pending-block import contract (SKODA-603).
 * No network, no fs: unit-tested in block-check.test.mjs. The CLI is
 * tools/importer/validate-blocks.mjs; the tracker (tools/importer/m1-status.mjs) reuses it.
 *
 * Contract (docs/planning/SKODA-PENDING-BLOCK-CONTRACTS.md, machine side block-contracts.json):
 * every block an importer emits must be either
 *   - a block whose code is on `main` (blocks/<name>/), with variants that code supports, or
 *   - a registry entry in `pending` (block or variant not built yet, shape pinned),
 * and config tables may only use the keys the block (or its contract) reads.
 */

const TAG = /<(\/?)div\b([^>]*)>/gi;

/** Strip tags + collapse whitespace (enough for key cells and messages). */
export function textOf(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Config-key normalisation, mirroring aem.js toClassName ("View all" → "view-all"). */
export function normKey(text) {
  return String(text || '').toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Table-header form of a block: `cards (overlay, tiles)`, `quote`. */
export function blockLabel(name, variants = []) {
  return variants.length ? `${name} (${variants.join(', ')})` : name;
}

/**
 * Parse the blocks of an EDS `.plain.html` body: top-level divs are sections, their
 * classed div children are blocks, a block's div children are rows, a row's div
 * children are cells. Regex tree over <div> tags only (the markup is generated, not
 * authored, so it is balanced).
 * @returns {{name: string, variants: string[], rows: {cells: {html: string, text: string,
 *   media: boolean, link: boolean}[]}[]}[]}
 */
export function parseBlocks(html) {
  const src = String(html || '');
  const root = { children: [] };
  const stack = [root];
  TAG.lastIndex = 0;
  let m = TAG.exec(src);
  while (m) {
    if (m[1]) {
      const node = stack.pop();
      if (node && node !== root) node.end = m.index;
      if (!stack.length) stack.push(root);
    } else {
      const cls = (m[2].match(/\bclass="([^"]*)"/i) || [])[1] || '';
      const node = { cls: cls.trim(), start: TAG.lastIndex, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
    m = TAG.exec(src);
  }
  const blocks = [];
  root.children.forEach((section) => {
    section.children.filter((n) => n.cls).forEach((n) => {
      const [name, ...variants] = n.cls.split(/\s+/);
      blocks.push({
        name,
        variants,
        rows: n.children.map((row) => ({
          cells: row.children.map((cell) => {
            const inner = src.slice(cell.start, cell.end);
            return {
              html: inner,
              text: textOf(inner),
              media: /<(img|picture|video|iframe)\b/i.test(inner),
              link: /<a\b/i.test(inner),
            };
          }),
        })),
      });
    });
  });
  return blocks;
}

/** A 2-cell text row whose first cell looks like a config key. */
function kvKey(row) {
  if (row.cells.length !== 2) return null;
  const [k] = row.cells;
  if (k.media || k.link || !k.text || k.text.length > 30) return null;
  const key = normKey(k.text);
  return /^[a-z][a-z0-9-]*$/.test(key) ? key : null;
}

/**
 * Config-table problems for a block whose contract declares `configKeys`.
 * mode `only`: every row must be a known key/value row. mode `or-curated` (default):
 * either a pure config table or curated rows; a table of key/value rows with an unknown
 * key is ambiguous (story-rail then treats it as curated and renders the settings as
 * cards — the SKODA-208 `subheading` bug).
 */
export function configProblems(block, keys, mode = 'or-curated') {
  const allowed = new Set(keys);
  const rows = block.rows.filter((r) => r.cells.length);
  const kv = rows.map(kvKey);
  const problems = [];
  if (mode === 'only') {
    rows.forEach((r, i) => {
      if (!kv[i]) problems.push(`row ${i + 1} is not a key/value config row`);
      else if (!allowed.has(kv[i])) problems.push(`unknown config key "${kv[i]}"`);
    });
    return problems;
  }
  const known = kv.filter((k) => k && allowed.has(k)).length;
  if (!known) return problems; // curated rows
  if (kv.every(Boolean)) {
    kv.filter((k) => !allowed.has(k)).forEach((k) => problems.push(`unknown config key "${k}"`));
  } else {
    problems.push('mixes config rows with curated rows');
  }
  return problems;
}

/** Does a pending entry cover this block's name + variants? */
function entryMatches(entry, block, baseVariants) {
  if (entry.block !== block.name) return false;
  const own = entry.variants || [];
  const patterns = (entry.variantPatterns || []).map((p) => new RegExp(p));
  const isOwn = (v) => own.includes(v) || patterns.some((re) => re.test(v));
  if (!own.length && !patterns.length) return block.variants.every((v) => baseVariants.includes(v));
  return block.variants.some(isOwn)
    && block.variants.every((v) => isOwn(v) || baseVariants.includes(v));
}

/**
 * Classify one block against the registry.
 * @param {object} block from parseBlocks
 * @param {object} contracts block-contracts.json
 * @param {Set<string>} codeBlocks block folders present in blocks/
 * @returns {{label: string, status: 'main'|'pending'|'error', id?: string, ticket?: string,
 *   fallback?: string, problems: string[], warnings: string[]}}
 */
export function classifyBlock(block, contracts, codeBlocks) {
  const label = blockLabel(block.name, block.variants);
  const res = {
    label, status: 'error', problems: [], warnings: [],
  };
  const pending = contracts.pending || [];

  const superseding = pending
    .find((e) => (e.replaces || []).some((r) => r === label || r === block.name));
  if (superseding) {
    res.problems.push(`superseded: emit ${blockLabel(superseding.block, superseding.variants || [])} instead (contract "${superseding.id}", ${superseding.ticket})`);
    return res;
  }

  const main = contracts.main && contracts.main[block.name];
  const hasCode = codeBlocks.has(block.name);
  if (main && !hasCode) res.warnings.push(`registry lists "${block.name}" as on main, but blocks/${block.name}/ is missing`);
  const baseVariants = (hasCode && main && main.variants) || [];
  const unsupported = hasCode && main
    ? block.variants.filter((v) => !baseVariants.includes(v))
    : block.variants;

  let contract;
  if (hasCode && main && !unsupported.length) {
    Object.assign(res, { status: 'main' });
    contract = main;
  } else {
    const entry = pending.find((e) => e.block && entryMatches(e, block, baseVariants));
    if (!entry) {
      res.problems.push(hasCode
        ? `variant(s) ${unsupported.join(', ')} not supported by blocks/${block.name} and not in the pending registry`
        : 'block not on main and not in the pending registry — pin a contract first');
      return res;
    }
    Object.assign(res, {
      status: 'pending', id: entry.id, ticket: entry.ticket, fallback: entry.fallback,
    });
    if (entry.status === 'resolve') {
      res.status = 'error';
      res.problems.push(`contract "${entry.id}" (${entry.ticket}) must be resolved before import: ${entry.resolveTo || 'see the contract doc'}`);
    } else if (entry.status === 'out-of-scope') {
      res.status = 'error';
      res.problems.push(`contract "${entry.id}" is out of M1 scope (${entry.ticket})`);
    } else if (entry.status === 'proposed') {
      res.warnings.push(`contract "${entry.id}" is proposed, not confirmed by ${entry.ticket}`);
    }
    contract = entry.configKeys ? entry : (hasCode && main) || entry;
  }

  if (contract && contract.configKeys) {
    const cp = configProblems(block, contract.configKeys, contract.config || 'or-curated');
    if (cp.length) {
      res.problems.push(...cp);
      res.status = 'error';
    }
  }
  return res;
}

/**
 * Check one page's `.plain.html`.
 * @returns {{blocks: object[], pending: {id: string, ticket: string, fallback: string}[],
 *   errors: string[], warnings: string[], publishable: boolean}}
 *   publishable = no errors and every pending block has a readable fallback.
 */
export function checkPage(html, contracts, codeBlocks) {
  const ignore = new Set(contracts.ignore || []);
  const blocks = parseBlocks(html)
    .filter((b) => !ignore.has(b.name))
    .map((b) => classifyBlock(b, contracts, codeBlocks));
  const pending = [];
  blocks.filter((b) => b.status === 'pending').forEach((b) => {
    if (pending.some((p) => p.id === b.id)) return;
    pending.push({ id: b.id, ticket: b.ticket, fallback: b.fallback });
  });
  const all = blocks.flatMap((b) => b.problems.map((p) => `${b.label}: ${p}`));
  const errors = [...new Set(all)].map((e) => {
    const n = all.filter((x) => x === e).length;
    return n > 1 ? `${e} (×${n})` : e;
  });
  const warnings = [...new Set(blocks.flatMap((b) => b.warnings.map((w) => `${b.label}: ${w}`)))];
  return {
    blocks,
    pending,
    errors,
    warnings,
    publishable: !errors.length && pending.every((p) => p.fallback === 'readable'),
  };
}

/** Registry self-check: ids unique, every id documented as a `### <id>` heading in the doc. */
export function registryProblems(contracts, docText) {
  const problems = [];
  const ids = (contracts.pending || []).map((e) => e.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => problems.push(`duplicate id ${id}`));
  const headings = new Set([...String(docText || '').matchAll(/^###\s+`?([a-z0-9-]+)`?/gm)].map((mm) => mm[1]));
  ids.filter((id) => !headings.has(id)).forEach((id) => problems.push(`contract "${id}" has no "### ${id}" section in the doc`));
  (contracts.pending || []).forEach((e) => {
    if (!e.ticket) problems.push(`contract "${e.id}" has no ticket`);
    if (!['readable', 'broken'].includes(e.fallback)) problems.push(`contract "${e.id}" fallback must be readable|broken`);
    if (!Number.isInteger(e.shape)) problems.push(`contract "${e.id}" needs an integer shape version`);
  });
  return problems;
}
