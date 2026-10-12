/*
 * SKODA-842: the DA block library (library-spec.mjs) must cover every block in blocks/ and every
 * variant and section style the block contracts allow (tools/importer/push/block-contracts.json,
 * `main` + the `pending` entries whose block has code). Pure: callers pass the inputs in.
 * Run as a CLI to check the repo: node tools/library/library-check.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tokens = (cls) => String(cls || '').split(/\s+/).filter(Boolean);

/**
 * Is a contract variant (one or more class tokens) offered by the spec entry?
 * @param {object} entry SPEC[block]
 * @param {string[]} want the contract's class tokens
 * @returns {boolean}
 */
export function covers(entry, want) {
  if (!want.length) return true;
  if (want.length === 1 && (entry.aliases || []).includes(want[0])) return true;
  return (entry.variants || []).some((v) => want.every((t) => tokens(v.class).includes(t)));
}

/**
 * Every problem between the blocks on disk, the contracts and the library spec.
 * @param {object} input
 * @param {string[]} input.blockDirs block folder names under blocks/
 * @param {object} input.contracts block-contracts.json
 * @param {object} input.spec SPEC
 * @param {object} input.excluded EXCLUDED (block -> reason)
 * @param {Array<[string, string]>} input.sectionStyles SECTION_STYLES
 * @param {Record<string, object|null>} [input.metadata] blocks/<b>/metadata.json per spec block
 * @returns {string[]} problems; empty when the library is complete
 */
export function libraryProblems({
  blockDirs, contracts, spec, excluded, sectionStyles, metadata,
}) {
  const problems = [];
  const code = new Set(blockDirs);
  blockDirs.filter((b) => !spec[b] && !excluded[b])
    .forEach((b) => problems.push(`block "${b}" has no library entry (add it to SPEC or EXCLUDED)`));
  Object.keys(spec).filter((b) => excluded[b])
    .forEach((b) => problems.push(`block "${b}" is both in SPEC and EXCLUDED`));
  [...Object.keys(spec), ...Object.keys(excluded)].filter((b) => !code.has(b))
    .forEach((b) => problems.push(`library entry "${b}" has no block in blocks/`));

  const variantSets = [
    ...Object.entries(contracts.main || {}).flatMap(([b, c]) => (c.variants || []).map((v) => [b, [v], 'main'])),
    ...(contracts.pending || []).filter((e) => e.block && e.variants?.length)
      .map((e) => [e.block, e.variants, e.id]),
  ];
  variantSets.filter(([b]) => spec[b] && code.has(b))
    .filter(([b, want]) => !covers(spec[b], want))
    .forEach(([b, want, from]) => problems.push(`contract variant "${b} (${want.join(', ')})" [${from}] has no library variant`));

  const styleTokens = new Set(sectionStyles.flatMap(([s]) => s.split(',').map((t) => t.trim())));
  (contracts.pending || []).filter((e) => e.form === 'section-style').flatMap((e) => e.styles || [])
    .filter((s) => !styleTokens.has(s))
    .forEach((s) => problems.push(`section style "${s}" has no Section Metadata library entry`));

  if (metadata) {
    Object.entries(spec).forEach(([b, entry]) => {
      const meta = metadata[b];
      if (!meta) { problems.push(`blocks/${b}/metadata.json is missing`); return; }
      const want = (entry.variants || []).map((v) => v.class).sort().join('|');
      const have = (meta.options || []).map((o) => o.class).sort().join('|');
      if (want !== have) problems.push(`blocks/${b}/metadata.json options [${have}] differ from the spec [${want}]`);
    });
  }
  return problems;
}

/** Read the repo's inputs (blocks/, contracts, spec, metadata.json files). */
export async function repoInputs(root) {
  const { SPEC, EXCLUDED, SECTION_STYLES } = await import('./library-spec.mjs');
  const blockDirs = readdirSync(path.join(root, 'blocks'), { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  const contracts = JSON.parse(readFileSync(path.join(root, 'tools/importer/push/block-contracts.json'), 'utf8'));
  const metadata = Object.fromEntries(Object.keys(SPEC).map((b) => {
    const file = path.join(root, 'blocks', b, 'metadata.json');
    return [b, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null];
  }));
  return {
    blockDirs, contracts, spec: SPEC, excluded: EXCLUDED, sectionStyles: SECTION_STYLES, metadata,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  /* eslint-disable no-console */
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const problems = libraryProblems(await repoInputs(root));
  problems.forEach((p) => console.error(`✗ ${p}`));
  if (problems.length) process.exitCode = 1;
  else console.log('✓ the library covers every block, contract variant and section style');
}
