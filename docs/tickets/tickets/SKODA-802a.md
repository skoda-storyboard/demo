# SKODA-802a, Škodapedia import: parser facets, index sheet, term docs at public paths, archives, per-locale generator

- **Epic:** E08, Editorial at Scale
- **Type:** import
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). The generator is what the 1004a–c locale runs use.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d, the 802 amendment's 7 SP less SKODA-802's 2 SP (generic
  pages) *(planning estimate, not a quote)*
- **GitHub issue:** [#471](https://github.com/skoda-storyboard/demo/issues/471) (created 2026-10-22, sub-issue of #63)
- **Parent:** SKODA-802
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 row "802 / 206": G-C-02 (Medium,
  was High, CONFIRMED), G-C-03 (Medium, CONFIRMED, browser-checked), G-C-04 (Medium, CONFIRMED), G-C-05 (Low,
  CONFIRMED), G-C-06 (Low, not re-verified).

## Why
- **Scope** (G-C-02). This ticket follows D8's default: Škodapedia stays in Storyboard (pre-baked terms). The
  per-locale generator produces 724 term docs: EN 189 here; CS 189, DE 188 and SK 158 in the 1004a–c runs.
- **URL continuity** (G-C-03). Today every `/{loc}/skodapedia/{slug}/` term URL returns 200 (index,follow), with the
  canonical on the archive. The 28 `/{loc}/skodapedia-catagory/{slug}/` archives (the source's spelling) return 200
  as well. The sitemaps list 730 term and archive URLs (724 terms + 6 archives, including SR and SL) and 28 category
  URLs. Generating terms at `/modals/skodapedia/{slug}` (SKODA-802's Description) leaves them without a plan.
- **Facets dropped** (G-C-04). `tools/importer/parsers/skodapedia.js` emits `[letter, link to the absolute live
  URL]` and drops the model (12) and category (7) classes each source row carries. SKODA-206 needs them to filter.
- **Term-body media** (G-C-06). Term bodies carry Vimeo embeds, MP4 downloads and featured images that 802 ("reuse
  blocks, no new blocks") does not list.

## Scope
- **Per-locale generator** (G-C-02). One run per locale, used by the 1004a–c runs. If the client picks pruning under
  D8, the generator takes a skip list; if it picks retiring, this ticket drops and redirects replace it (D8 question
  in SKODA-206's amendment).
- **Term docs at their public path** (G-C-03). Generate each term at `/{loc}/skodapedia/{slug}` instead of
  `/modals/skodapedia/{slug}`. The doc serves standalone with a self-canonical, and the 206a modal fetches it as
  `.plain.html`, so the term URLs need no redirect rows. The fallback, if `/modals/` stays, is 724 + 28 redirect rows
  to `/{loc}/skodapedia`.
- **Category archives** (G-C-03). Give each of the 28 category archives a doc or a redirect row to the directory
  with its filter (206's `?f=` state). The `/{loc}/skodapedia/f/…` permalinks are unbounded and exact-match redirects
  can't cover them; the decision is recorded with 206.
- **Facets in the parser** (G-C-04). Emit the model and category tokens, write models and categories metadata on
  each term doc, and generate the per-locale skodapedia index sheet that 206 reads (title, slug, letter, models,
  categories). Links point to the EDS term path, not the live site.
- **Term-body media** (G-C-06). In each of EN, CS and DE, the Škoda Connect term embeds 8 Vimeo players and 8
  `/direct-download/` MP4 links plus their attachment-page links (24 + 24 in total). The MP4s get media-manifest rows
  (`kind: video`); check the Vimeo ids for the domain lock (SKODA-523 C4). 704 terms have a featured image (EN 184,
  CS 184, DE 183, SK 153): write it on the term doc, since the panel shows it and the 849a teaser uses it as the
  thumbnail.
- **Data quality** (G-C-06). One SK term has a numeric slug (`/sk/skodapedia/171459/`) and a body with 0 words: skip
  or fix it and say so in the run report. 16 EN slugs end in `-N`; they keep the source slug so the URL stays the
  same.

## Not in scope
- Generic pages: SKODA-802.
- The block (directory, filters, `?f=` state, `LIVE_ONLY`): SKODA-206. The term modal and the standalone term page:
  SKODA-206a.
- The in-body glossary spans (G-C-01): SKODA-849a, which links each span to the term at the target locale's public
  path set here.
- The CS, DE and SK runs: SKODA-1004a–c. The empty SR and SL archives: SKODA-1004d/e.
- G-C-07 (Low, no authoring flow or owner for adding a term; the review proposes an 802 amendment with a DA library
  entry): not in the §7.2 row and still open.

## Acceptance criteria
- [ ] Every generated term doc is at `/{loc}/skodapedia/{slug}`; a direct load of
      `/en/skodapedia/active-cylinder-technology-act` returns 200 with a self-canonical (G-C-03).
- [ ] Each of the 28 category archives has a doc or a redirect row; the `/f/` decision is recorded (G-C-03).
- [ ] The EN index sheet has 189 rows, each with its letter and the model and category tokens of its source row
      (G-C-04, G-C-05).
- [ ] The EN Škoda Connect term keeps its 8 Vimeo players and 8 MP4 links, and the MP4s have `kind: video` manifest
      rows; 184 EN term docs carry their featured image (G-C-06).
- [ ] The run report counts EN 189 / CS 189 / DE 188 / SK 158 and lists the empty SK term (G-C-05, G-C-06).

## Dependencies
D8; SKODA-206 (block, `?f=` state) and 206a (modal); SKODA-849a (needs the term pages); SKODA-523 (Vimeo
allow-list); SKODA-103a (redirects, if the fallback is used); SKODA-1004a–c (locale runs), 1004d/e (SR, SL archives).
Parent: SKODA-802.
