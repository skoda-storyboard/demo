# SKODA-603 — Pilot page set (PR article + PR listing + reps) imported + validated
- **Epic:** E06 — Import Pilot Content
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 **W0 done** (tracker, pending-block contract + check, baseline). W1 is waiting on
  610 and 506. See "Execution plan" below.

## Summary
Run the import pipeline end-to-end on the pilot page set — a press-release article, the PR listing, and a couple of representative pages — and validate the result against the source.

## Description
This is the pilot integration point that proves the static architecture end-to-end: it exercises the parsers/transformers (SKODA-601), the DA push + bulk publish (SKODA-602), the core blocks (cards/teaser, hero, gallery, embeds, tags), and the media pipeline (masters-only images + static Downloads). The pilot page set is a press-release article + the PR listing + a couple of representative pages — deliberately **not** a story page (SiteOrigin flattening deferred to Phase B). Validation compares imported content, blocks, media, and metadata against the source.

## Requirements / Spec
- Import the pilot set: one press-release article, the PR listing, and a couple of representative pages.
- Verify each renders correctly in preview: sections, blocks (cards/teaser, hero, gallery+modal, embeds, tags), listing over query-index, static Downloads, masters-only images with `<picture>` + captions.
- Validate content completeness vs source (text, headings, media, metadata, links).
- No story/SiteOrigin page in the pilot set.
- All 🟠 services stay deferred (plain download links; no cart/banner/newsletter; index-only search).

## Acceptance Criteria
- [ ] Pilot set imported and published (via SKODA-602 pipeline).
- [ ] Each pilot page renders with correct sections/blocks/media/metadata in preview.
- [ ] Listing page filters/sorts/pages over the query-index; Downloads render as static links.
- [ ] Content validated against source with no material loss (captions, alts, metadata intact).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-601, SKODA-602, SKODA-201, SKODA-202, SKODA-203, SKODA-204, SKODA-205, SKODA-206, SKODA-501, SKODA-502. / Downstream: SKODA-702, SKODA-703 (perf + a11y run against the imported pilot); SKODA-804 (consent/analytics wiring); SKODA-801/802 (Phase B scale); SKODA-1001 (per-locale trees).

## Update (2026-09-24, M1 gap review): re-scoped to the 43-URL M1 set
Source: [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md).

**Scope.** The pilot set is replaced by:
- the canonical **[`skoda-m1-url-set.txt`](../../planning/skoda-m1-url-set.txt)**: 43 URLs, 42 unique pages, because the
  mixed-reality nested URL is an alias → redirect per SKODA-609
- **plus** the rail-feed corpus [`skoda-rail-feed-corpus.txt`](../../planning/skoda-rail-feed-corpus.txt): ≈90–100
  tagged items, including the 18 image and 18 video items from SKODA-608
- **plus** any series-linked stories needed so the 5 series hubs are not empty (SKODA-207)

The "no story page" rule no longer applies, because 21 of the 43 are stories.

**Estimate:** 3 → **5 SP**. This ticket becomes the M1 content fan-in.

**Additional acceptance criteria:**
- [ ] A per-URL status tracker is committed alongside the URL set. Columns: imported / previewed / published /
      indexed / QA pass.
- [ ] `/en/query-index.json` holds every row from the set plus the corpus. On 2026-09-24 it held **3 rows**.
- [ ] The SKODA-609 crawl shows 0 in-site 404s.
- [ ] Preview and publish run through SKODA-602 (the DA credentials are a human gate). Content is never hand-edited.

**Order:**
1. home + listings + stories
2. PRs + models
3. series + press kits (after 805a/805c)

## Execution plan (2026-09-25): gated waves + pending-block contract
**Approach (stakeholder decision): gated waves.** A family is imported to preview only once its importer is
QA-ready. Each wave is published only after QA **and** an explicit publish approval, because publishing is
outward-facing. A family that isn't ready stays "blocked" in the tracker and isn't imported in a known-wrong
state.

| Wave | Content | Gate |
|---|---|---|
| **W0** setup ✅ | tracker + generator, pending-block registry + check, baseline | – |
| **W1** | 11 corpus PRs; re-push the 5 set PRs + `/en` with 610; re-import the 3 stale stories (plates, Peaq record, Octavia) ✅ 2026-09-25 with SKODA-816 (all 18 DA stories) | 610 (PR #138), 506, **508** (caption regression on PR re-imports; code done 2026-09-25, PR re-imports are Title-only vs DA); the `Promo Box` header in the home importer. `Quote` is a pending *block*: until 220 lands, W1 publishes with the default blockquote fallback + `re-import on SKODA-220` |
| **W2a** | 16 set + 28 corpus + series-linked stories (not the alias) | 801a (it owns the story importer; 603 owns push/publish/tracker/QA) |
| **W2b** | 2 listings + 36 image/video items | 608 |
| **W2c** | 5 set + 11 corpus models | the 208 importer fix: `hero` → Hero Image; `in-page-nav` built (or mapped); `spec-table` mapped to Columns + a dark section (`resolve`); `subheading` read by story-rail. 208 requires 0 block JS 404s |
| **W3** | 5 + 12 series hubs (`Cards (overlay, tiles)`); 4 + 12 press kits | 207, 805a, 805c. **Not 221**: it's Could, and plain cards are the documented fallback (805a amendment) |
| **W4** | 609 re-imports + alias redirect + crawl; re-push the PRs after 607; re-QA the pages whose pending blocks landed; final index count; re-run the demo sweep | 609, 607 |

W2a, W2b and W2c don't collide (different importers, templates and URL lists). Registry edits are serialized
through the Architect.

**Per-wave pipeline:** import → `npm run import:validate-blocks` → `npm run import:push` (push + preview)
→ preview QA → approval → `--stage publish` → live QA on both hosts → `npm run import:status` → commit the tracker.

**Update (2026-09-25, after main #136):**
- `promo-box` is on `main`.
- The publish rule is tightened: a pending **block** (no code yet) holds publish (0 block JS 404s); readable pending **variants** may publish.
- `spec-table` and `spec-table-versions` are `resolve`, mapped to existing blocks.
- `subheading` is a pending story-rail key (208).
- 221 is off the W3 gate.
- The `hero` finding is corrected: `blocks/hero` is an empty boilerplate stub, not absent.

**Pending-block contract:** [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md)
(machine side `tools/importer/push/block-contracts.json`). Every emitted block must be on `main` or pinned
there. The importers emit the pinned shape before the block code lands, so a block landing later needs a
re-QA, not a re-import. Pages with a pending block, or a broken fallback, stay preview-only unless they're
explicitly approved.

**Tracker:** [`skoda-m1-url-status.md`](../../planning/skoda-m1-url-status.md), generated by `npm run import:status`
(QA results and gates are kept in `tools/importer/push/m1-status-overrides.json`).

### W0 results (2026-09-25)
- **Scope counted:** set + corpus = **136 unique pages** plus 1 alias. The 18 image and 18 video items include
  `?attachment_id=` URLs that have no EDS path until 608 maps them.
- **Baseline:** 44 imported locally, **16 previewed/published/indexed**. The live index has 31 rows, 16 of
  them from this set. QA pass is 0, because every published page still has sweep drift.
- **The block check found 31 pages with errors in the current importer output:**
  - **`hero` is only an empty boilerplate stub on `main`** (a 0-byte `hero.js`). `parsers/hero.js` and `hero-banner.js`
    emit `Hero`, but the project hero is `hero-image`. *(Corrected: the first pass said there was no `hero` block.)* Affected: models, series, listings, and stale story output.
  - The model rails use `subheading`, a key story-rail doesn't read (208).
  - The series-hub `Listing` has a `tags` key the listing block doesn't read (207/221).
  - `promo-box.js` emits `Cards (promo)`, but PR #110's block is `promo-box`.
  - A raw `version` table leaks from an Epiq story (contract `spec-table-versions`).
- **Decided:** SKODA-824 highlight = **section style** (Section Metadata `Style` `highlight, dark|grey`).
  **Open:** `spec-table-versions` (208/801a).

## Risks / Flags
- This ticket has the widest dependency fan-in (blocks + media + import infra) — a slip in any upstream item blocks it.
- If a gate isn't merged by **Fri 9 Oct**, raise a demo cut decision for that family.
- 610 (clean titles) and 506 (masters) must land before mass publishing, or every page is pushed twice.
- Some validation items (LCP/CLS, modal/lightbox behavior) are `[RUNTIME-UNCONFIRMED]` and are formally cleared in E07.
