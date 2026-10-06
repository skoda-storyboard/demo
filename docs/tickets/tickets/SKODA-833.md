# SKODA-833, Press-release importer validity fixes (audit F5)

- **Epic:** E08, Editorial at Scale
- **Type:** import / parser
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#262](https://github.com/skoda-storyboard/demo/issues/262)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §3.3 / §5 / §8 F5; relates to [SKODA-607](SKODA-607.md), SKODA-502, SKODA-204, SKODA-818
- **Branch:** `skoda-833-press-release-import-validity`
- **Status (2026-10-06):** 🟡 Developer done (head b233db9, pushed). QA was started but interrupted; it needs a re-run.
  19 of 28 releases are **blocked on DAM ingest** of PDF/MP4 binaries. Nothing has been pushed to DA, previewed or
  published.

## Change
- `parsers/downloads.js` (shared, backwards-compatible): MP4 links are URL-encoded before the table is written.
  Root cause of the 4x4 breakage: a raw "×" in a filename widened one row after helix-importer rewrote `.mp4` links,
  which produced an unparseable table (ASCII grid text, a classless block, and the Elroq row lost as that block's name).
- `parsers/tags.js` (shared): skips the `+N` toggle (`.show-hidden-terms`, `href="#"`) and keeps the revealed tags.
- `transformers/skoda-press-release-layout.js`:
  - `lite-youtube` → bare `youtube.com/watch` URL, as on stories (SKODA-818), with the consent shell removed.
  - Bullet soft-wrap joins only continuation lines that start lower-case.
- `press-release.test.mjs` + a trimmed 4x4 fixture, incl. the Solberg bullet regression.
- `tools/importer/media/media-manifest.json`: 11 added rows only (kind video, `partial`, publish pending) + 1 Vimeo
  thumbnail row; no existing rows changed.
- `import-press-release.bundle.js` rebuilt. It must be rebuilt again on integration with SKODA-831 (`skoda-metadata.js`).

## Developer result
1. 4x4 Media Box: resolved. One Downloads block with 15/15 items incl. "Video | Škoda Elroq".
2. Buzzsprout embed: resolved on 4/4 releases. Main already emits it; the DA copies were stale. The embed block
   renders Buzzsprout.
3. MP4 rows: emitted (Slavia, Red Dot, 4x4 Elroq). Manifest rows added; not verified.
4. Solberg YouTube: resolved (one watch URL, no "Play" junk).
5. `+N` toggle: resolved (Elroq/Enyaq model-year, Elroq premiere).
6. Bullets (M13, Karoq, Laura) and pull-quotes (board-of-management, UCI MTB): resolved.
7. Stale releases (Red Dot, UCI MTB): re-imported with the current layout, Story Rail and no empty link.

23 of 28 findings resolved (14 only needed a re-import). Remaining: tag links to the origin where no `/en/tag/…` page
exists (containment policy, all 28 releases), and the Elroq premiere PDF title "…".

- Regressions vs baseline: none. `validate-blocks` 28 pages, 0 errors, 1 hold (Zellmer, SKODA-824).
- Tests: lint clean; `npm test` 943 pass, 3 skipped, only the 2 pre-existing failures.

## DAM ingest needed (developer machine; blocks `media:apply` on 19/28 releases)
All under `www.skoda-storyboard.com/direct-download/`:
- **Slavia:** `2026/08/Skoda_Slavia_Monte_Carlo.mov_125225b2.mp4`, `Skoda_Slavia_Prestige_69ae887f.mp4`, PDF `260818_…_fd432da8.pdf`
- **Red Dot:** `2026/08/Skoda_receives_red_dot_award_for_its_vision_app_concept-720p_cd084254.mp4`, PDF `260820_…_094b7c12.pdf`
- **4x4 (`2026/02/`):** the 9 `-1080p` videos (Elroq, Enyaq, Enyaq RS, Kodiaq, Kodiaq RS, Superb, Superb Combi,
  Octavia Combi, "the Škoda 4×4 range") + 3 PDFs (markets / models infographics, release PDF)
- **UCI MTB:** PDF `2026/08/260825_…_54e4195a.pdf` (no manifest row yet)

The full list of the 37 blocked links per page is in the scratch `media/unverified.txt` (not in git).

## Acceptance Criteria
- [x] 4x4 Media Box parses into one Downloads block with all 15 items
- [x] YouTube / Buzzsprout embeds, tags, bullets, quotes as above; no regressions
- [ ] QA PASS (code + content; rendered check of the 4x4 Media Box and a Buzzsprout embed)
- [ ] DAM ingest of the binaries above, then `media:apply`, DA dry-run, push + preview. Publishing needs a separate go-ahead.

## Collisions
- `parsers/downloads.js` is also edited on `skoda-830-story-import-validity` (D4 title recovery); merge carefully.
- `import-press-release.bundle.js` is rebuilt after SKODA-831 merges.
