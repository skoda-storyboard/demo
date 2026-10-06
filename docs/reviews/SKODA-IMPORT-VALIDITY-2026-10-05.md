# SKODA import validity audit: every imported page vs. origin

**Date:** 2026-10-05 · **Status:** report for review. **No importer, content or DA changes have been made.** Fixes wait for approval (§8).
**Trigger:** the Octavia press-kit hubs were imported with the wrong importer (page-base instead of press-kit-hub). This audit looks for every other page where the import wasn't done correctly.
**Scope:**
- All **247** imported pages that exist in DA, plus `/en`.
- The 93-line M1 set ([`skoda-m1-url-set.txt`](../planning/skoda-m1-url-set.txt)) is fully covered and marked ★ in §9.
- 126 local-only import outputs are not in DA, so they are out of scope (§7.3).

## 1. Method

- **One independent agent per URL.** Each agent compared the origin page with the DA source the import produced. Inputs were a cached copy of the origin HTML and the DA source, plus the importer recorded in the import report.
- **What each agent checked:**
  1. **Wrong importer or template:** does the origin page type (body classes and structure) match the importer that was used?
  2. **Broken or unknown blocks:** block names that have no code, nameless blocks, leftover WordPress/SiteOrigin/widget markup.
  3. **Missing or wrong content:** headings, text, images, galleries, downloads, embeds, tiles.
- **Index-driven grids were not counted as missing.** Cards that come from the query index at runtime were left out of the comparison.
- **Second check.** Each page with a medium or high finding (75 pages) got a second agent whose job was to *refute* every finding: check the served `.plain.html`, the code, the tickets and the accepted exceptions.
  - Only findings that survived are reported as **confirmed**.
  - 11 findings were refuted (§10).
  - Findings on pages that had only low findings were not re-checked; they are marked **unverified**.
- **Cross-check.** The category-archive results were cross-checked against the live `/en/query-index.json` (245 rows, 58 stories). This turned up 3 sub-category archives that the agents had passed as clean (§3.2).
- **Evidence.** Every agent result is stored with its transcript, outside the repo: `.migration/validity/results/wf_7e2bf63a-1a3/` holds `compare/` and `verify/` JSON per page and the gzipped transcripts. `report-appendix.json` holds the machine-readable findings.

## 2. Summary

| | Count |
|---|---|
| Pages audited | 247 (all 93 M1-set lines included) |
| Clean (no findings) | 128 |
| Pages with confirmed high/medium findings | 71 |
| Confirmed findings: high / medium / low | 29 / 89 / 57 |
| Unverified low findings (low-only pages) | 50 |
| Refuted by the second check | 11 |
| **Wrong importer, the Octavia case** | **10 pages, all in the `page-base` batch; no other importer is affected** |

**By importer** (counts are of confirmed plus unverified findings):

| Importer | Pages | Clean | High | Medium | Low |
|---|---|---|---|---|---|
| story-detail | 59 | 2 | 10 | 54 | 53 |
| press-kit-default | 55 | 37 | 1 | 6 | 18 |
| category-archive | 41 | 36 → **32** after §3.2 | 1 | 3 | 1 |
| press-release | 28 | 13 | 2 | 13 | 13 |
| model-page | 22 | 13 | 0 | 0 | 9 |
| series-hub | 15 | 15 | 0 | 0 | 0 |
| **page-base** | **10** | **0** | **15** | **13** | **7** |
| press-kit-hub | 8 | 8 | 0 | 0 | 0 |
| listings, home, media cart (8 pages) | 8 | 3 | 0 | 0 | 6 |

**Reading:**
- When a page went through the importer built for its page type, it imported correctly at the structural level. Series hubs, press-kit hubs and model pages are clean.
- The problems cluster in four places:
  1. pages sent through the generic `page-base` importer (§3.1);
  2. a path rule in the category-archive parser (§3.2);
  3. the story importer's deliberately deferred parts, plus a few leaks (§4);
  4. a handful of press-release and press-kit edge cases (§5).

## 3. Import errors (wrong importer or wrong config)

### 3.1 Wrong importer: 10 pages imported with page-base (high)

[SKODA-208](../tickets/tickets/SKODA-208.md) §"Octavia rail data" records that the 10 Octavia-rail press kits were imported "through the page-base importer (`urls-page-base-octavia-press-kits.txt`) as an interim until SKODA-805 rebuilds the hub". The hub importer (`press-kit-hub`) then shipped and is clean on all 8 hubs it imported. The interim batch was never re-run.

| Page | Origin type | Should use | What's wrong on the page |
|---|---|---|---|
| `/en/press-kits/skoda-octavia-press-kit` | press_kit hub (tiles) | press-kit-hub | Chapter tile grid flattened to text; Twitter widget iframes left as junk links; dead extension-less ZIP banner (copied faithfully from origin) |
| `/en/press-kits/skoda-octavia-press-kit-2` | hub | press-kit-hub | Tile grid flattened; Twitter junk links |
| `/en/press-kits/skoda-octavia-media-launch-press-kit` | hub | press-kit-hub | Tile grid flattened; X/ZIP banners not in a `press-kit-banners` section |
| `/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit` | hub | press-kit-hub | Tile grid flattened; Twitter junk; meta description is the Twitter widget text |
| `/en/press-kits/skoda-rs-experience-press-kit` | hub | press-kit-hub | Tile grid flattened; Twitter junk |
| `/en/press-kits/skoda-rs-driving-experience-press-kit` | hub | press-kit-hub | Tile grid flattened; no banner section |
| `/en/press-kits/lets-explore-albania-press-kit` | hub | press-kit-hub | Tile grid flattened |
| `/en/press-kits/4x4-winter-experience-press-kit` | hub | press-kit-hub | Tile grid flattened; Twitter junk |
| `/en/press-kits/press-kit-skoda-at-the-iaa-2019` | hub | press-kit-hub | 16 chapter tiles flattened; teaser/download links point at origin; Twitter junk |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` | press_kit **article** (two-column) | **press-kit-default** | No blocks at all: galleries, sidebar and Media Box flattened; 222 leftover "Add/remove" cart links, "Show more Show less", "+48"; 3 empty PDF anchors; MP4 links missing |

The hubs lose no text or images, only their structure. The RS 245 article is the worst page in the audit. None of the 10 is in the M1 set, but the Octavia model page's Press Kits rail links to them.

### 3.2 Category archives with a feed that can never match: 7 sub-category archives (high/medium)

The `category-archive` parser writes the `stories` feed path as `/en/<category>/<sub-category>/`. The story imports produce flat URLs (`/en/skoda-world/<slug>`, `/en/lifestyle/<slug>`). `scopeRows` (`blocks/listing/listing-logic.mjs`) is a strict path-prefix match, so these archives show *"Nothing to show yet"* forever, even where matching stories are imported. For example, the heritage story `what-was-racing-like-half-a-century-ago-…` is live at `/en/skoda-world/…`.

| Archive | Feed path | Index matches | Source |
|---|---|---|---|
| `/en/category/skoda-world/design` | `/en/skoda-world/design/` | 0 | cross-check, the agent passed it |
| `/en/category/skoda-world/heritage` | `/en/skoda-world/heritage/` | 0 | agent, confirmed |
| `/en/category/skoda-world/innovation-and-technology` | `/en/skoda-world/innovation-and-technology/` | 0 | agent, confirmed |
| `/en/category/skoda-world/responsibility` | `/en/skoda-world/responsibility/` | 0 | agent, confirmed |
| `/en/category/lifestyle/adventures` | `/en/lifestyle/adventures/` | 0 | cross-check, the agent passed it |
| `/en/category/lifestyle/people` | `/en/lifestyle/people/` | 0 | cross-check, the agent passed it |
| `/en/category/lifestyle/sports` | `/en/lifestyle/sports/` | 0 | cross-check, the agent passed it |

The parent archives work: emobility 31, skoda-world 16, lifestyle 9 and models 1 match.

Four top-level archives are empty for a different reason: no story under them has been migrated yet. These are `classic-cars`, `concepts`, `corporate-life` and `design-eng`. That is content scope, not an import error, but `design-eng` uses the same path model and would stay empty even after migration if its stories land elsewhere.

### 3.3 Stale imports from early runs (medium)

These pages were last written by an importer version that has since been superseded:

- `/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept`: old press-release structure, with no body column, sidebar or Media Box sections. The podcast embed and the MP4 download are missing.
- `/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running`: 24 Sep import, with a static "Related Press Releases" band (and an empty link) instead of `story-rail`. The PDF and tag links still point at the origin.
- `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality`: 24 Sep early `story-detail` run (hero only, carousel flattened, no video). Low impact, because the path 301-redirects to the canonical `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality`. Proposed fix: delete the stale DA doc and keep the redirect.

## 4. Story importer (`story-detail`, 59 pages, 21 in the M1 set)

Most of this is **known, planned, not-yet-done work** in [SKODA-801a](../tickets/tickets/SKODA-801a.md) (M1 Must) and [SKODA-604](../tickets/tickets/SKODA-604.md). It is listed here because the audit measures how much is still open.

| # | Issue | Pages | M1 ★ | Severity | Ticket | Kind |
|---|---|---|---|---|---|---|
| 4.1 | **Media Box download band dropped.** `skoda-story-cleanup.js` `deferredSelectors` removes `.search-results.media-box`; there is no `downloads` block. On some pages, Media Box images appear nowhere else on the page (e.g. Lake Como 4, Designers on the Peaq 2, Frunk 1) | 50 | 18 | medium (low off-set) | 801a | planned, open |
| 4.2 | **In-body `.sb-gallery` lightbox galleries dropped:** Mallorca 5, Elroq made 7, Light Cube 11, Elroq designers 8, Solberg 5, Sportline 27 images | 6 | 0 | high | 604 / 801a | planned, open |
| 4.3 | **Lightbox chrome leaks as content.** The colorbox UI text and share links land as body paragraphs or in Related Stories. These are the same 6 pages; it's a cleanup bug, not deferral | 6 | 0 | medium | new | **bug** |
| 4.4 | **Captions wrong.** Gallery captions are taken from `alt`, file names or the page title instead of the visible origin caption (Lake Como 8/8 lost, Milan 18, Tour de France 4, Slavia, Peaq record 7 page-title captions) | 18 | 5 (med/high) | 2 high, 8 medium, 12 low | 819 | **bug** |
| 4.5 | **Carousels emitted as plain `Gallery`, not `Gallery (slider)`** | 4 | — | medium/low | 819 | planned |
| 4.6 | **Epiq spec table became `<div class="version">`.** The first cell became the block name: a block-JS 404, and the header row (Epiq 35/40/55) is lost (`big-possibilities-in-a-small-package-…`) | 1 | — | high | 801a (acceptance item) | **bug**, known |
| 4.7 | **Quiz:** the hidden `jsonStruct` (13 KB of JSON) is visible as a paragraph, and the quiz is flattened with `[ ]`/button text. The page is held "preview only", but it is **also served on .aem.live** | 1 | ★ (held) | high | 801a / 603 | known; the live state contradicts the hold |
| 4.8 | **Inline body images dropped:** `enq_ng_064` (cruise control), `Untitled-design-3` (wireless charging). Closing image uses a 272×182 thumbnail (Peaq unparalleled) | 3 | 1 | high/medium | new | **bug** |
| 4.9 | **Series nav teaser grid flattened** with "Show more Show less" (cruise control) | 1 | — | medium | new | bug |
| 4.10 | **"Explore more" cards point at the origin** although the target is migrated | 14 | 5 | low/medium | 609 | link policy |
| 4.11 | **`+N` tag show-more toggle imported as a dead tag pill** (also on releases) | 6 (all templates) | — | low | new | bug |

## 5. Press releases, press kits, other templates

**Press releases (28):**
- **Buzzsprout podcast embed missing** on 4 releases: simply-clever-for-summer, UCI MTB, Slavia India, Red Dot. **MP4 download rows missing** on 3 (Slavia: both videos; Red Dot; 4x4).
- **`the-skoda-4x4-model-range-…`: the Media Box table broke at import (high).** Rows 1–6 were saved as a literal ASCII grid table in a `<p>`. The remaining 8 rows sit in a block with **no class name**, and *Video | Škoda Elroq* is dropped (14 of 15 items).
- **Solberg Octavia RS:** the `lite-youtube` embed became a static thumbnail plus "PlayPlayPlayPlay" links.
- **Low:** bullets split at a mid-sentence `<br>` (3), pull-quotes as plain paragraphs (2), and tag links to origin filter pages (3).

**Press kits, standard (55, 37 clean):**
- **Gallery captions dropped:** `125-years-…/images` lost 44 long `data-caption` texts. On the Epiq images page, the per-image captions with the regulatory consumption/CO₂ text are lost (low).
- **Duplicate lead image** above "Introduction" on the `images` pages: 125 years, Epiq 2, Peaq 2.
- **`.pdff` links:** a typo on the origin, faithfully copied, so the links 404. The correct PDF is already on AEM Assets: Peaq infographics/exterior, Felicia Kit Car (1 medium, 2 low).
- **"Additional info" sidebar list** flattened into one hyphenated paragraph on 4 of the 125-years chapters (low).

**Model pages (22, 13 clean):** all low. The News and Press Kits rail "All" links point at origin instead of `/en/news` or `/en/press-kits` (7). Other findings: one key-fact thumbnail rendition, and one `publisheddate` that holds the modified date.

**Listings and home (low):**
- The `/en/news`, `/en/images` and `/en/videos` facet sets are subsets of the origin's (6/15, 8/15, and a missing Equipment/Sponsorship). This is a design choice to confirm.
- `/en` share image differs from the origin's current one.
- `/en/media-room`: the rail "All" links are missing.

## 6. Origin drift (the origin changed after import; not import errors)

10 pages differ because the origin was edited after we imported them. A re-import fixes them; there is no code change.
- **High:** `the-enyaq-rs-race-…` (press kit). Title, headings and CO₂ wording were edited on the origin, and an infographic was removed.
- **Medium:**
  - `skoda-epiq-city-suv-crossover-…`: removed sentences.
  - `…-launches-production-of-the-new-peaq-…`: the lead sentence and the Andreas Dick quote.
  - `…-builds-its-one-millionth-karoq`.
  - `skoda-130-rs-1975-…`: the PDF was swapped and an image added.
- **Low:**
  - `fabia-rs-rally2`, `skoda-sport-1949`: newer PDFs.
  - `/en/media-room`: the promo items. The Octavia full-hybrid release was published today.

The DA push dry-run of 2026-10-05 (`tools/importer/reports/push/2026-10-05T15-17-35-052Z-dry.json`, 182 paths) also shows **13 DA conflicts** (DA edited since the last push), **37 local updates not yet pushed**, and 28 pages blocked by the binary gate (SKODA-503). Any re-import in §8 has to resolve these first.

## 7. Known and excluded

### 7.1 Accepted or tracked, not counted as new

- Peaq Images is held unpublished (230 images, over the html2md 200-image limit).
- 4 M1 releases are awaiting a PDF upload, and the Zellmer highlight panel (SKODA-824).
- The first-glimpse `footnotes` block isn't in code.
- Title `<br>` becomes a space. Data tables become text lines.
- Vimeo on releases (domain-locked).
- Footnote size.
- Links to non-migrated pages stay absolute to the origin (the containment policy).

### 7.2 Refuted by the second check

11 findings, listed in §10. Most are DA-source artefacts that the render pipeline normalises, or links that follow the containment policy.

### 7.3 Out of scope

126 local import outputs were never pushed to DA: 74 `images/*` and 27 `videos/*` media-item pages (retired by the AEM Assets feed decision), 7 skoda-world, 6 models, 3 lifestyle, and others. They are not on the site, so they were not audited.

## 8. Proposed fixes (awaiting approval)

Ordered by **M1 impact** (build freeze Thu 8 Oct, demo 15 Oct). Every content change goes through the importers, then `push-to-da` with a dry-run first; nothing is hand-edited. Publishing happens only after a separate go-ahead.

| # | Fix | Pages to re-import | M1 | Effort |
|---|---|---|---|---|
| F1 | **Re-import the 9 hubs with `press-kit-hub`** and the RS 245 article with `press-kit-default`. Move the urls from `urls-page-base-octavia-press-kits.txt` into the right lists. Confirm that hub cleanup strips the Twitter widget (it does on the 8 clean hubs) | 10 | rail targets of ★ Octavia | S |
| F2 | **Category-archive sub-categories:** scope the feed by category metadata or tags instead of a non-existent URL folder (parser + `stories` config), then re-import 7 archives. The 4 empty top-level archives need content, not code | 7 | — | S–M |
| F3 | **Story importer bugs (not the deferred scope):** strip the colorbox/lightbox chrome (4.3), take the visible caption instead of alt/title (4.4), keep inline images (4.8), turn the spec table into a table/`Spec Table` instead of a block name (4.6), hide the quiz `jsonStruct` (4.7), drop the `+N` toggle (4.11). Then re-import all stories | 59 | 21 ★ | M |
| F4 | **SKODA-801a, Media Box → `downloads` on stories:** already M1 Must and still open. The audit confirms 18 of the 21 ★ stories are missing it. Decide whether it lands before the freeze | 50 | 18 ★ | M (planned) |
| F5 | **Press releases:** the Buzzsprout embed, MP4 rows, the 4x4 Media Box table, `lite-youtube`; re-import the 2 stale releases (3.3) | ~8 | — | S–M |
| F6 | **Press kits:** keep `data-caption` in gallery downloads; drop the duplicate lead image; map `.pdff` to the AEM Assets PDF | ~8 | 125-years/Epiq/Peaq ★ | S |
| F7 | **Origin drift:** re-import the 10 drifted pages after resolving the 13 DA conflicts | 10 | 4 ★ (press kits) | S |
| F8 | **Housekeeping:** delete the stale mixed-reality duplicate DA doc; take the quiz off `.aem.live` if the hold stands; rail "All" links on model pages (low) | 2 + config | — | XS |

Not proposed: the `.sb-gallery` restore (4.2) and slider variant (4.5) stay in SKODA-604/819 unless they are pulled forward.

## 9. All findings (confirmed + unverified)

★ = page in the M1 set. **Check:** `confirmed` means the finding survived the second check; `unverified` means the page had only low findings and was not re-checked. Category archives found only by the cross-check are listed in §3.2, not here.

| Page | M1 | Importer | Sev | Pattern | Finding | Check |
|---|---|---|---|---|---|---|
| `/en/category/skoda-world/innovation-and-technology` |  | category-archive | high | wrong-content | Stories feed path matches no index row, so the archive grid is empty | confirmed |
| `/en/press-kits/lets-explore-albania-press-kit` |  | page-base | high | wrong-importer | Tiles press-kit hub imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/lets-explore-albania-press-kit` |  | page-base | high | broken-blocks | Chapter tile grid flattened to default content; no cards tiles block | confirmed |
| `/en/press-kits/press-kit-skoda-at-the-iaa-2019` |  | page-base | high | wrong-importer | Press-kit hub imported with the generic page-base importer | confirmed |
| `/en/press-kits/press-kit-skoda-at-the-iaa-2019` |  | page-base | high | broken-blocks | Grid of chapter teaser tiles flattened to default content instead of a cards tiles block | confirmed |
| `/en/press-kits/skoda-octavia-media-launch-press-kit` |  | page-base | high | wrong-importer | Press-kit hub imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/skoda-octavia-media-launch-press-kit` |  | page-base | high | broken-blocks | Chapter tile grid flattened into default content (no cards tiles block) | confirmed |
| `/en/press-kits/skoda-octavia-press-kit-2` |  | page-base | high | wrong-importer | Hub press kit imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/skoda-octavia-press-kit-2` |  | page-base | high | broken-blocks | Chapter tiles grid flattened to loose paragraphs and headings (no cards block) | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | high | wrong-importer | Two-column press_kit article imported with page-base instead of press-kit-default | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | high | broken-blocks | Inline galleries, sidebar previews and Media Box flattened into default content (no blocks at all) | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | high | broken-blocks | Leftover media-cart UI markup: Add/remove '#' links, 'Show more Show less', '+48' | confirmed |
| `/en/press-kits/skoda-rs-driving-experience-press-kit` |  | page-base | high | wrong-importer | Tiles press-kit hub imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/skoda-rs-driving-experience-press-kit` |  | page-base | high | broken-blocks | Chapter tile grid flattened to default content; no cards tiles block, no banner section | confirmed |
| `/en/press-kits/skoda-rs-experience-press-kit` |  | page-base | high | wrong-importer | Tiles hub imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/skoda-rs-experience-press-kit` |  | page-base | high | broken-blocks | Chapter-teaser grid flattened to default content instead of a cards tiles block | confirmed |
| `/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models` | ★ | press-kit-default | high | wrong-content | Migrated text is stale: the origin's edited title, headings and sustainability/CO2 wording were not carried over | confirmed |
| `/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain` |  | press-release | high | broken-blocks | Media Box downloads block saved as literal ASCII grid-table text in a paragraph | confirmed |
| `/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain` |  | press-release | high | broken-blocks | Remaining Media Box rows sit in a block with no class name | confirmed |
| `/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca` |  | story-detail | high | missing-content | Inline 5-photo sb-gallery dropped from the article body | confirmed |
| `/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq` |  | story-detail | high | broken-blocks | Spec table imported as a block named "version", which exists in no code | confirmed |
| `/en/emobility/how-was-the-elroq-made-not-in-the-usual-way` |  | story-detail | high | missing-content | In-body 7-image gallery (sb-gallery) dropped | confirmed |
| `/en/emobility/skoda-elroq-premiere-light-cube-camera-action` |  | story-detail | high | missing-content | Both in-body photo galleries (.sb-gallery, 11 images) were dropped | confirmed |
| `/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como` | ★ | story-detail | high | missing-content | All 8 carousel captions lost; gallery caption cells repeat the page title instead | confirmed |
| `/en/models/skoda-elroq-through-designers-eyes` |  | story-detail | high | missing-content | In-body image gallery (sb-gallery, 8 images) missing | confirmed |
| `/en/skoda-world/making-driving-easier-how-cruise-control-works` |  | story-detail | high | missing-content | Inline body image enq_ng_064_86f6f294.jpg missing (caption kept) | confirmed |
| `/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs` |  | story-detail | high | missing-content | In-body image gallery (sb-gallery, 5 images) dropped | confirmed |
| `/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details` |  | story-detail | high | broken-blocks | Hidden quiz JSON config imported as a visible paragraph | confirmed |
| `/en/skoda-world/sportline-models-dynamic-elegance-for-every-day` |  | story-detail | high | missing-content | All five in-body image galleries dropped (27 gallery images) | confirmed |
| `/en/category/design-eng` |  | category-archive | medium | wrong-content | Stories feed scope matches no index rows, so the Design archive renders empty | confirmed |
| `/en/category/skoda-world/heritage` |  | category-archive | medium | wrong-content | Stories feed path scope /en/skoda-world/heritage/ matches no index row, even though a heritage story is imported | confirmed |
| `/en/category/skoda-world/responsibility` |  | category-archive | medium | wrong-content | Stories listing path filter matches no index rows, so the category listing shows no stories | confirmed |
| `/en/press-kits/4x4-winter-experience-press-kit` |  | page-base | medium | broken-blocks | Twitter widget runtime artifacts imported as garbage links | confirmed |
| `/en/press-kits/press-kit-skoda-at-the-iaa-2019` |  | page-base | medium | wrong-content | Teaser and download links point at the origin site, not the migrated pages | confirmed |
| `/en/press-kits/press-kit-skoda-at-the-iaa-2019` |  | page-base | medium | broken-blocks | Twitter widget runtime iframes leaked into the page as links | confirmed |
| `/en/press-kits/skoda-octavia-press-kit` |  | page-base | medium | broken-blocks | Chapter tile grid flattened to default content instead of a cards tiles block | confirmed |
| `/en/press-kits/skoda-octavia-press-kit` |  | page-base | medium | broken-blocks | Leftover rendered Twitter widget iframes imported as junk links | confirmed |
| `/en/press-kits/skoda-octavia-press-kit-2` |  | page-base | medium | broken-blocks | Twitter widget iframe artifacts imported as content links | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | medium | missing-content | MP4 footage download links missing | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | medium | broken-blocks | The three PDF downloads are empty, text-less anchors | confirmed |
| `/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` |  | page-base | medium | wrong-content | Links still point at the origin host (attachment pages, direct-download, press-kits filter tags) | confirmed |
| `/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit` |  | page-base | medium | wrong-importer | Press-kit hub imported with the generic page-base importer | confirmed |
| `/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit` |  | page-base | medium | broken-blocks | Chapter tile grid flattened to default content; no cards tiles block | confirmed |
| `/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit` |  | page-base | medium | broken-blocks | Rendered Twitter timeline widget imported as three junk links | confirmed |
| `/en/press-kits/skoda-rs-experience-press-kit` |  | page-base | medium | broken-blocks | Rendered Twitter widget iframes left behind as junk links | confirmed |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/images` | ★ | press-kit-default | medium | missing-content | 44 long gallery image captions (data-caption) dropped from the downloads block | confirmed |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain` | ★ | press-kit-default | medium | missing-content | Media Box is out of date: the origin swapped its PDF and added an image (post 458514) after the import | confirmed |
| `/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car` |  | press-kit-default | medium | wrong-content | Migrated text keeps sentences the origin has since removed (DA imported from an older origin version) | confirmed |
| `/en/press-kits/skoda-epiq-press-kit-2/images` | ★ | press-kit-default | medium | wrong-content | First gallery image duplicated as a stray image above "Introduction" | confirmed |
| `/en/press-kits/skoda-peaq-press-kit-2/infographics` | ★ | press-kit-default | medium | wrong-content | Five-seat configuration PDF link carries the origin's .pdff typo and 404s; the correct PDF is already on AEM Assets | confirmed |
| `/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models` | ★ | press-kit-default | medium | wrong-content | Infographic 'Sustainable biocomposite parts' (JPG + PDF) is still on the migrated page; the origin removed it | confirmed |
| `/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq` |  | press-release | medium | wrong-content | Migrated body has a sentence the current origin does not have | confirmed |
| `/en/press-releases/simply-clever-for-summer-smart-skoda-features-that-make-every-trip-easier` |  | press-release | medium | missing-content | Buzzsprout #ExploreŠkoda News podcast embed missing | confirmed |
| `/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav` |  | press-release | medium | wrong-content | Lead paragraph still has a sentence the origin has since removed (also in metadata Description) | confirmed |
| `/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav` |  | press-release | medium | wrong-content | Andreas Dick quote has outdated wording | confirmed |
| `/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running` |  | press-release | medium | missing-content | Buzzsprout #ExploreŠkoda podcast embed missing | confirmed |
| `/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running` |  | press-release | medium | broken-blocks | Leftover static 'Related Press Releases' band instead of story-rail, with an empty link | confirmed |
| `/en/press-releases/skoda-auto-unveils-updated-slavia-in-india` |  | press-release | medium | missing-content | Buzzsprout #ExploreŠkoda podcast player missing | confirmed |
| `/en/press-releases/skoda-auto-unveils-updated-slavia-in-india` |  | press-release | medium | missing-content | MP4 download links for both videos missing from the downloads block | confirmed |
| `/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept` |  | press-release | medium | broken-blocks | Outdated press-release structure: no body-column, sidebar or Media Box sections | confirmed |
| `/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept` |  | press-release | medium | missing-content | Buzzsprout podcast audio embed missing | confirmed |
| `/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept` |  | press-release | medium | missing-content | Media Box video MP4 download missing | confirmed |
| `/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain` |  | press-release | medium | missing-content | Media Box item 'Video \| Škoda Elroq' (MP4) missing | confirmed |
| `/en/press-releases/when-driving-fun-meets-comfort-rally-ace-oliver-solberg-tests-the-skoda-octavia-rs` |  | press-release | medium | broken-blocks | YouTube video (lite-youtube d1xYSMyyWWA) imported as a static thumbnail plus garbled 'PlayPlayPlayPlay' links instead of an embed | confirmed |
| `/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france` | ★ | story-detail | medium | wrong-content | Story carousel imported as a default gallery: file names show as heading and captions, and the 4 real slide descriptions are missing | confirmed |
| `/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france` | ★ | story-detail | medium | missing-content | Media Box (10 downloadable images) not migrated | confirmed |
| `/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca` |  | story-detail | medium | missing-content | Media Box (9 captioned attachment items) not migrated | confirmed |
| `/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca` |  | story-detail | medium | wrong-content | Gallery lightbox controls leaked into the Related Stories section as default content | confirmed |
| `/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries` | ★ | story-detail | medium | missing-content | Media Box (6 downloadable images) dropped; 3 of its images appear nowhere on the migrated page | confirmed |
| `/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq` |  | story-detail | medium | missing-content | Spec table header row (Version / Epiq 35 / Epiq 40 / Epiq 55) lost | confirmed |
| `/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq` |  | story-detail | medium | missing-content | Media Box (8 images with Original/1920px download links) dropped | confirmed |
| `/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee` |  | story-detail | medium | missing-content | Media Box band (12 downloadable images) dropped; no downloads block | confirmed |
| `/en/emobility/come-and-play-skoda-is-heading-to-milan` |  | story-detail | medium | missing-content | Media Box band (7 images with per-image downloads) dropped | confirmed |
| `/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical` |  | story-detail | medium | missing-content | The 7-image Media Box is dropped, so 2 images and all Media Box downloads are missing | confirmed |
| `/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all` |  | story-detail | medium | missing-content | Media Box band (6 per-image download items) not migrated | confirmed |
| `/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv` |  | story-detail | medium | missing-content | Media Box band (14 images with downloads) dropped, 2 images lost entirely | confirmed |
| `/en/emobility/how-was-the-elroq-made-not-in-the-usual-way` |  | story-detail | medium | broken-blocks | Gallery lightbox chrome leaked as stray default content | confirmed |
| `/en/emobility/how-was-the-elroq-made-not-in-the-usual-way` |  | story-detail | medium | missing-content | Media Box band (11 images with downloads) not migrated | confirmed |
| `/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq` |  | story-detail | medium | missing-content | Media Box (9 images, per-image downloads) not migrated; image Navrh-bez-nazvu-77_e7c0531f.png is lost from the page | confirmed |
| `/en/emobility/meet-the-peaq-comfort-just-like-at-home` | ★ | story-detail | medium | missing-content | Media Box band with its 8 per-image downloads is missing | confirmed |
| `/en/emobility/meet-the-peaq-spacious-inside-and-out` |  | story-detail | medium | missing-content | Media Box download panel (7 images with Original/1920px download links) is missing | confirmed |
| `/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan` |  | story-detail | medium | wrong-content | All 18 gallery captions are the page-title alt text, so the origin's real image captions are lost | confirmed |
| `/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan` |  | story-detail | medium | missing-content | Media Box (20 images) not imported: no downloads block | confirmed |
| `/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia` | ★ | story-detail | medium | missing-content | Media Box download band not migrated | confirmed |
| `/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging` | ★ | story-detail | medium | wrong-content | 7 carousel slides with no caption on origin show the page title as a visible caption | confirmed |
| `/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq` | ★ | story-detail | medium | missing-content | Media Box (16 downloadable images) not migrated | confirmed |
| `/en/emobility/skoda-elroq-and-a-happy-family` |  | story-detail | medium | missing-content | Media Box band (7 images with Original/1920px downloads) missing; image DSC04379_4d894e4f absent from the page | confirmed |
| `/en/emobility/skoda-elroq-premiere-light-cube-camera-action` |  | story-detail | medium | missing-content | Media Box (14 images) is missing | confirmed |
| `/en/emobility/skoda-elroq-premiere-light-cube-camera-action` |  | story-detail | medium | wrong-content | Gallery lightbox UI text and share links imported as visible page content | confirmed |
| `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds` | ★ | story-detail | medium | wrong-content | Two Explore-more cards still link to the origin site although the target pages exist on the demo | confirmed |
| `/en/emobility/skoda-peaq-unparalleled-space-and-comfort` |  | story-detail | medium | wrong-content | Closing body image uses the 272x182 cropped thumbnail instead of the full 16:9 image | confirmed |
| `/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq` | ★ | story-detail | medium | missing-content | Story Media Box (12 assets with Original/1920p downloads) not migrated | confirmed |
| `/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq` |  | story-detail | medium | missing-content | Media Box band (7 downloadable items) not migrated | confirmed |
| `/en/emobility/the-skoda-peaq-will-win-you-over-fast` |  | story-detail | medium | missing-content | Media Box (16 images with Original/1920px downloads) not imported | confirmed |
| `/en/emobility/the-skoda-peaq-will-win-you-over-fast` |  | story-detail | medium | broken-blocks | In-body carousels imported as plain Gallery with alt-text captions instead of Gallery (slider) | confirmed |
| `/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere` |  | story-detail | medium | wrong-content | Explore-more sidebar cards link to the live origin instead of the migrated stories | confirmed |
| `/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live` |  | story-detail | medium | missing-content | The real captions under the 5th and 6th carousels are missing | confirmed |
| `/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live` |  | story-detail | medium | missing-content | The Media Box band (32 download items) was dropped | confirmed |
| `/en/emobility/whats-behind-epiq-design` |  | story-detail | medium | missing-content | Media Box (7 images with download links) dropped | confirmed |
| `/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving` |  | story-detail | medium | broken-blocks | Origin image carousels imported as plain Gallery grids, not Gallery (slider) | confirmed |
| `/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving` |  | story-detail | medium | missing-content | Sidebar Media Box (11 downloadable images) not migrated | confirmed |
| `/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans` | ★ | story-detail | medium | missing-content | Media Box band (14 images + original downloads) dropped; 2c_WRC_Portugal-84_d5624ef3 appears nowhere on the migrated page | confirmed |
| `/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling` | ★ | story-detail | medium | missing-content | The origin's 7-image Media Box band (downloads) is not on the migrated page | confirmed |
| `/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como` | ★ | story-detail | medium | missing-content | Media Box (13 images) dropped; 4 of its images are on the page nowhere else | confirmed |
| `/en/lifestyle/ouninpohja-finlands-roller-coaster-stage` | ★ | story-detail | medium | missing-content | Origin Media Box download band (14 images) not migrated | confirmed |
| `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones` | ★ | story-detail | medium | missing-content | In-body image Untitled-design-3_a6a0026c.png dropped | confirmed |
| `/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road` |  | story-detail | medium | missing-content | Media Box band (10 downloadable images) dropped | confirmed |
| `/en/models/skoda-elroq-through-designers-eyes` |  | story-detail | medium | missing-content | Media Box (12 downloadable images) missing | confirmed |
| `/en/models/skoda-elroq-through-designers-eyes` |  | story-detail | medium | broken-blocks | Gallery lightbox and share chrome left as default content in the sidebar section | confirmed |
| `/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it` | ★ | story-detail | medium | missing-content | Media Box download band (12 images, Original/1920px downloads) not migrated | confirmed |
| `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality` | ★ | story-detail | medium | missing-content | Media Box download band dropped (7 items with Original/1920px direct-download links) | confirmed |
| `/en/skoda-world/making-driving-easier-how-cruise-control-works` |  | story-detail | medium | broken-blocks | Series nav teaser grid flattened; leftover "Show more Show less" toggle text | confirmed |
| `/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs` |  | story-detail | medium | broken-blocks | Gallery lightbox chrome and share links leaked as stray default content | confirmed |
| `/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs` |  | story-detail | medium | missing-content | Media Box (11 images) not migrated | confirmed |
| `/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details` |  | story-detail | medium | broken-blocks | Interactive quiz flattened into static text with leftover widget UI | confirmed |
| `/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator` |  | story-detail | medium | missing-content | Media Box (14 downloadable images with Original/1920px links) dropped | confirmed |
| `/en/skoda-world/sportline-models-dynamic-elegance-for-every-day` |  | story-detail | medium | wrong-content | Gallery modal UI text and share links imported as body paragraphs | confirmed |
| `/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour` | ★ | story-detail | medium | wrong-content | In-body carousel captions use alt text or file names instead of the origin's visible captions | confirmed |
| `/en/category/concepts` |  | category-archive | low | other | Stories grid scoped to /en/concepts/ has no matching rows in the query index, so the archive renders empty | unverified |
| `/en/media-room` |  | home-mr | low | missing-content | Promo-box curated items are stale: origin's lead item (Octavia full hybrid) missing, Zellmer item no longer in the origin promo | confirmed |
| `/en/media-room` |  | home-mr | low | missing-content | 'All' links of the News, Images and Videos rails (header link and end card) not carried over | confirmed |
| `/en` | ★ | home-sto | low | metadata | Share image (og:image) differs from the origin's current og:image | unverified |
| `/en/images` | ★ | images-listing | low | other | New listing offers 8 of the origin's 15 image filters | unverified |
| `/en/skoda-model/elroq` |  | model-page | low | wrong-content | News rail 'All' link goes to the tag archive, not the filtered news listing | unverified |
| `/en/skoda-model/elroq/elroq-rs` |  | model-page | low | wrong-content | News rail 'All' (viewall) link points to the origin site instead of the new /en/news listing | unverified |
| `/en/skoda-model/elroq/elroq-sportline` |  | model-page | low | wrong-content | Press Kits 'All' view-all link points at the origin site instead of the migrated /en/press-kits listing | unverified |
| `/en/skoda-model/kamiq` |  | model-page | low | wrong-content | TOP LED Matrix key-fact image uses a 272x182 thumbnail instead of the 2560x2560 original | unverified |
| `/en/skoda-model/new-fabia` | ★ | model-page | low | wrong-content | Press Kits rail 'All' link points at the origin site instead of the local /en/press-kits listing | unverified |
| `/en/skoda-model/new-kodiaq` |  | model-page | low | metadata | publisheddate is the origin's modified date, not its published date | unverified |
| `/en/skoda-model/new-kodiaq/kodiaq-rs` |  | model-page | low | wrong-content | News and Press Kits rail 'All' links still point at the origin site | unverified |
| `/en/skoda-model/octavia` | ★ | model-page | low | wrong-content | Press Kits rail 'All' link points to the origin site, not the migrated listing | unverified |
| `/en/skoda-model/peaq` | ★ | model-page | low | wrong-content | Press Kits rail 'All' link points at the origin site instead of the migrated /en/press-kits listing | unverified |
| `/en/press-kits/4x4-winter-experience-press-kit` |  | page-base | low | wrong-importer | Hub press kit imported with page-base instead of press-kit-hub | confirmed |
| `/en/press-kits/4x4-winter-experience-press-kit` |  | page-base | low | broken-blocks | Chapter tile grid flattened to default content (no cards/tiles block) | confirmed |
| `/en/press-kits/lets-explore-albania-press-kit` |  | page-base | low | wrong-content | Tile and heading links point at the origin domain, not the migrated pages | confirmed |
| `/en/press-kits/skoda-octavia-media-launch-press-kit` |  | page-base | low | broken-blocks | X follow and ZIP download banners not in a press-kit-banners section | confirmed |
| `/en/press-kits/skoda-octavia-press-kit` |  | page-base | low | wrong-importer | Press-kit hub imported with the generic page-base importer | confirmed |
| `/en/press-kits/skoda-octavia-press-kit` |  | page-base | low | wrong-content | Download banner links to an extension-less, dead CDN object (copied faithfully from the origin) | confirmed |
| `/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit` |  | page-base | low | metadata | Meta description is the Twitter widget text | confirmed |
| `/en/news` |  | pr-listing | low | wrong-content | Listing facets authored as 6 of the origin's 15 filter groups | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/images` | ★ | press-kit-default | low | wrong-content | First gallery image shown twice: a standalone image above the first section | confirmed |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/images` | ★ | press-kit-default | low | wrong-content | 1000 MB "For more photos" link points to a dead origin URL instead of the migrated chapter | confirmed |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/motorsport-versions-of-the-skoda-favorit-1989-all-different-and-yet-familiar` | ★ | press-kit-default | low | wrong-content | Sidebar 'Additional info' list flattened into one paragraph with literal hyphens; Media contacts links to the old site | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-1000-mb-1964-and-1100-mb-b5-1966-a-family-saloon-in-rally` | ★ | press-kit-default | low | broken-blocks | Sidebar 'Additional info' list flattened into one hyphenated paragraph | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsport-success` | ★ | press-kit-default | low | wrong-content | Media Box PDF is out of date: the origin swapped in a new PDF after the import | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-wrc-2003-paving-the-way-for-future-success` | ★ | press-kit-default | low | broken-blocks | Sidebar 'Additional info' list flattened into one paragraph with literal hyphens | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-felicia-kit-car-1995-the-next-chapter-in-an-international-success-story` | ★ | press-kit-default | low | wrong-content | Download banner links to a broken .pdff URL on the old site instead of the PDF on AEM Assets | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-spider-b5-1972-and-skoda-spider-ii-1975-prototypes-for-the-racetrack` | ★ | press-kit-default | low | wrong-content | Sidebar 'Additional info' list flattened into one paragraph with dash prefixes | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain` | ★ | press-kit-default | low | wrong-content | Media Box PDF is the May body PDF, not the newer PDF the origin Media Box now lists | unverified |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/videos` | ★ | press-kit-default | low | missing-content | Sidebar "Videos" preview box (section.videos.sa-media-kit-preview) dropped | unverified |
| `/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car` |  | press-kit-default | low | wrong-content | Flattened tech-data table credits values shared by all variants to Epiq 35 only | confirmed |
| `/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car` |  | press-kit-default | low | wrong-content | Video embed is titled with the Stefani quote attribution instead of the clip title | confirmed |
| `/en/press-kits/skoda-epiq-press-kit-2/images` | ★ | press-kit-default | low | missing-content | Per-image lightbox captions dropped, including the regulatory consumption/CO₂ text | confirmed |
| `/en/press-kits/skoda-fabia-130-special-edition-celebrates-skoda-autos-anniversary-and-motorsport-heritage` |  | press-kit-default | low | broken-blocks | 130-years anniversary logo row flattened to a standalone image instead of an icon callout like its WhatsApp twin | unverified |
| `/en/press-kits/skoda-peaq-press-kit-2/exterior-skodas-largest-suv-with-the-modern-solid-design` | ★ | press-kit-default | low | wrong-content | Inline 5-seat infographic 'PDF download' links to the origin host via a misspelled .pdff URL, not to the AEM Assets PDF | unverified |
| `/en/press-kits/skoda-peaq-press-kit-2/images` | ★ | press-kit-default | low | wrong-content | Extra lead image (a copy of the first gallery thumbnail) inserted above the first section | unverified |
| `/en/press-kits/skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio` | ★ | press-kit-default | low | wrong-content | Origin's '+2' show-more toggle imported as a tag pill | unverified |
| `/en/press-kits/skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio` | ★ | press-kit-default | low | wrong-content | Tag and 'Media contacts' links point at the origin host | unverified |
| `/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production` |  | press-release | low | wrong-content | Third highlight bullet split into two list items at a stray </br> | unverified |
| `/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq` |  | press-release | low | wrong-content | One bullet point split into two list items at a mid-sentence <br> | confirmed |
| `/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management` | ★ | press-release | low | broken-blocks | Pull-quote imported as plain paragraphs, not a Quote block | unverified |
| `/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running` |  | press-release | low | broken-blocks | Pull quote imported as a plain italic paragraph, not a quote block | confirmed |
| `/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running` |  | press-release | low | other | DA is a stale 24 Sep import; PDF still on origin CDN and tag links on origin | confirmed |
| `/en/press-releases/skoda-auto-unveils-updated-slavia-in-india` |  | press-release | low | wrong-content | Video download rows labelled with numeric Vimeo IDs instead of titles | confirmed |
| `/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates` |  | press-release | low | broken-blocks | The origin's '+7' show-all-tags toggle was imported as a dead tag pill | unverified |
| `/en/press-releases/skodas-voice-assistant-laura-now-enhanced-with-chatgpt-capabilities` |  | press-release | low | wrong-content | Second bullet point split into two list items at a soft line break | unverified |
| `/en/press-releases/skodas-voice-assistant-laura-now-enhanced-with-chatgpt-capabilities` |  | press-release | low | wrong-content | Technology tag links (Innovations, Laura) point at origin news filter URLs | unverified |
| `/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available` |  | press-release | low | wrong-content | Origin '+5' show-more toggle imported as a tag | unverified |
| `/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available` |  | press-release | low | wrong-content | Media Box PDF title came through as just '…' | unverified |
| `/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-livestream-from-zurich` |  | press-release | low | wrong-content | 'premiere' tag still links to a filter page on the origin site | unverified |
| `/en/press-releases/world-premiere-of-the-all-new-skoda-peaq-livestream-from-france` |  | press-release | low | wrong-content | The 'premiere' and 'SUV' tags still link to the origin site's news filter | unverified |
| `/en/emobility/a-true-czech-from-spain` |  | story-detail | low | wrong-content | Explore more card links point at the live origin instead of the migrated demo pages | unverified |
| `/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries` | ★ | story-detail | low | wrong-content | First 'Explore more' card links to the origin site instead of the migrated page | confirmed |
| `/en/emobility/camouflage-to-get-you-hooked` |  | story-detail | low | missing-content | Media Box download band (6 items) dropped | unverified |
| `/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint` |  | story-detail | low | missing-content | Media Box band (6 image downloads) not migrated | unverified |
| `/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv` |  | story-detail | low | wrong-content | Gallery captions show alt text instead of the authored visible descriptions; page title repeated as caption | confirmed |
| `/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak` |  | story-detail | low | missing-content | Media Box band (22 downloadable assets) not migrated | confirmed |
| `/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan` |  | story-detail | low | wrong-content | Explore more card links to the origin host although the target is migrated | confirmed |
| `/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia` | ★ | story-detail | low | wrong-content | Explore more card links to the origin site instead of the migrated page | confirmed |
| `/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging` | ★ | story-detail | low | wrong-content | Last gallery's 4th slide shows the alt text instead of the origin's visible caption | confirmed |
| `/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging` | ★ | story-detail | low | missing-content | Media Box download band (19 images) not migrated: documented SKODA-604 deferral | confirmed |
| `/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq` | ★ | story-detail | low | broken-blocks | In-body carousels imported as plain Gallery, not Gallery (slider) | confirmed |
| `/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq` | ★ | story-detail | low | wrong-content | Gallery captions copied from alt or data-caption where origin shows none | confirmed |
| `/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq` | ★ | story-detail | low | wrong-content | Explore more cards link to the live origin host although targets are migrated | confirmed |
| `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds` | ★ | story-detail | low | missing-content | Media Box band (19 images) not migrated | confirmed |
| `/en/emobility/skoda-peaq-unparalleled-space-and-comfort` |  | story-detail | low | missing-content | Media Box download band (13 images, Original/1920px downloads) not migrated | confirmed |
| `/en/emobility/skoda-peaq-unparalleled-space-and-comfort` |  | story-detail | low | wrong-content | Explore-more card links to the origin site although the target page is migrated | confirmed |
| `/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq` |  | story-detail | low | wrong-content | First 'Explore more' card links to the origin site, not the migrated page | confirmed |
| `/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere` |  | story-detail | low | wrong-content | Gallery captions use image alt text, not the visible origin captions | confirmed |
| `/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live` |  | story-detail | low | wrong-content | Gallery captions show alt text the origin doesn't show, including one in Czech | confirmed |
| `/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live` |  | story-detail | low | wrong-content | Two Explore more cards link to the origin site, not the migrated pages | confirmed |
| `/en/emobility/whats-behind-epiq-design` |  | story-detail | low | wrong-content | Explore-more cards link to the live origin, not the migrated demo pages | confirmed |
| `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague` | ★ | story-detail | low | wrong-content | Gallery caption taken from image alt instead of the visible origin caption | unverified |
| `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague` | ★ | story-detail | low | wrong-content | Final carousel adds the page title as a caption 4 times | unverified |
| `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague` | ★ | story-detail | low | missing-content | Media Box download band dropped (documented SKODA-604/D18 deferral) | unverified |
| `/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving` |  | story-detail | low | missing-content | Photo credits under the Fan Park carousel images dropped | confirmed |
| `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones` | ★ | story-detail | low | missing-content | Media Box band (7 images, download actions) not migrated | confirmed |
| `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones` | ★ | story-detail | low | wrong-content | Third gallery caption taken from alt text instead of visible caption | confirmed |
| `/en/models/skoda-elroq-through-designers-eyes` |  | story-detail | low | wrong-content | Tag expander '+2' imported as a dead tag link | confirmed |
| `/en/simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how` |  | story-detail | low | missing-content | MP4 download from the Media Box on the second video was dropped | unverified |
| `/en/skoda-world/2024-a-year-of-new-electric-cars-and-innovated-favourites` |  | story-detail | low | wrong-content | Source '+7' show-more toggle imported as a tag link | unverified |
| `/en/skoda-world/2024-a-year-of-new-electric-cars-and-innovated-favourites` |  | story-detail | low | missing-content | MP4 download links from the in-body video toolbars were dropped | unverified |
| `/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute` |  | story-detail | low | missing-content | Media Box (1 item, hero image download) not migrated | unverified |
| `/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car` |  | story-detail | low | wrong-content | Gallery captions use the image alt text, not the visible caption, so two captions differ from the origin | confirmed |
| `/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car` |  | story-detail | low | wrong-content | First gallery has a made-up caption on all 3 items that the origin does not show | confirmed |
| `/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car` |  | story-detail | low | wrong-content | Explore more card links to the origin site although the target page is migrated | confirmed |
| `/en/skoda-world/how-the-skoda-octavia-reached-365-km-h` | ★ | story-detail | low | missing-content | Origin 'Media Box' download band (16 images) is not imported | unverified |
| `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality` | ★ | story-detail | low | broken-blocks | Page built by a stale early story-detail run: generic hero plus flat content, no story-detail blocks | confirmed |
| `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality` | ★ | story-detail | low | missing-content | Vimeo video missing | confirmed |
| `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality` | ★ | story-detail | low | broken-blocks | Image carousel flattened, leftover 'View slide' text | confirmed |
| `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality` | ★ | story-detail | low | wrong-content | Server-rendered Related Stories band baked in as static, stale text | confirmed |
| `/en/skoda-world/making-driving-easier-how-cruise-control-works` |  | story-detail | low | wrong-content | Two series teaser titles cut short with an ellipsis | confirmed |
| `/en/skoda-world/making-driving-easier-how-cruise-control-works` |  | story-detail | low | missing-content | Travel Assist MP4 download link dropped | confirmed |
| `/en/skoda-world/making-driving-easier-how-cruise-control-works` |  | story-detail | low | missing-content | Media Box (6 images) not migrated (intentionally deferred) | confirmed |
| `/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details` |  | story-detail | low | missing-content | Quiz result messages and result images not migrated as content | confirmed |
| `/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator` |  | story-detail | low | wrong-content | Gallery caption for MIR_0425-kopie_50c56c00 taken from alt instead of origin caption | confirmed |
| `/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator` |  | story-detail | low | wrong-content | Three '.JPG.' images keep the 768px rendition instead of the original | confirmed |
| `/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator` |  | story-detail | low | wrong-content | Two Explore more cards link to the origin site although the targets are migrated | confirmed |
| `/en/skoda-world/sportline-models-dynamic-elegance-for-every-day` |  | story-detail | low | missing-content | Media Box (downloadable image list) not migrated | confirmed |
| `/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres` |  | story-detail | low | missing-content | Media Box band (5 downloadable images) not migrated | unverified |
| `/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour` | ★ | story-detail | low | broken-blocks | Origin carousels imported as the default gallery, not the slider variant | confirmed |
| `/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour` | ★ | story-detail | low | missing-content | Media Box band (13 downloadable images) not present | confirmed |
| `/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too` | ★ | story-detail | low | wrong-content | Explore more card links to the origin site, not the migrated page | unverified |
| `/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion` |  | story-detail | low | missing-content | Media Box download band (13 images) not migrated | unverified |
| `/en/videos` | ★ | videos-listing | low | missing-content | Listing facet config omits Equipment and Sponsorship filters that have video data | unverified |

## 10. Refuted by the second check

| Page | Finding | Why it was refuted |
|---|---|---|
| `/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca` | Empty h6 spacer imported as an empty heading | Refuted as a page defect. The empty heading only exists in the DA source; the pipeline drops it at render, so there is no empty heading on the page. The origin spacer was cosmetic. At most this is DA-source hygiene. |
| `/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak` | Generic caption added to 14 gallery images that have no caption on the origin | Refuted as stated. The cell-2 caption does not show as a visible slide caption on this page, and the origin has no caption distinction between the 14 and the 6 images: all 20 come from alt. What is left is a redundant alt-equals-caption cell that only appears  |
| `/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq` | Petzet caption lost its line break ('Petr PetzetDesigner') | Refuted. The reviewer read the raw DA source. The preview pipeline wraps the inline runs into separate <p> elements, so the text does not run together on the page. The only remaining difference is the origin's 10pt size for 'Designer', which falls under the ac |
| `/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como` | 'Explore more' card links point at the origin host instead of site-relative paths | Refuted. These links follow the intended policy for pages that were not migrated. Rewriting them as relative paths would make them 404. The '32 of 48' count most likely reflects the same policy, not a defect. |
| `/en/media-room` | Two promo links point at the origin site, not migrated pages | Refuted. This is the intended containment behaviour for pages outside the demo set, not an import error. The links work: they reach the live origin pages. The only real follow-up is the content-scope question already covered by finding 1. |
| `/en/press-kits/4x4-winter-experience-press-kit` | Chapter links point at the origin site instead of relative paths | Refuted. The comparison with 125-years is wrong: that hub's children were imported (SKODA-805b, D-1 = A), so its links are site-relative. Here the targets are not migrated, so linking out to the live origin is the correct policy (SKODA-609 link allow-list). Ma |
| `/en/press-kits/4x4-winter-experience-press-kit` | ZIP download is an icon image link, not a downloads block | Refuted. A source-CDN ZIP linked from the banner image is the project convention, also used on the accepted hubs. The manifest rule covers PDFs and MP4s only, not ZIPs. One small leftover: the alt text is the raw file name. The hub importer would replace it wi |
| `/en/press-kits/skoda-epiq-press-kit-2/images` | Description metadata is junk download-label text | Refuted as an import defect. The migration copies the origin's own Yoast auto-description faithfully, which the finding itself admits. Replacing it with a curated description would be an optional content improvement, not a fidelity problem. |
| `/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept` | Image 'Original version' download links are relative and 404 | Refuted. Users never follow the relative href as written, because the runtime link policy sends /direct-download/ to the live origin, so the downloads work. The relative form differs from newer imports only cosmetically. It goes away when the page is re-import |
| `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality` | Non-canonical duplicate URL is live; index template empty | Refuted. The '200' in agent-items is probably a status recorded after following the redirect. A minor residual remains: the stale DA doc still exists, and the dry-run push report tools/importer/reports/push/2026-10-05T15-17-35-052Z-dry.json lists this path wit |
| `/en/skoda-world/sportline-models-dynamic-elegance-for-every-day` | Gallery caption headings left as bare H3s with no gallery | Not a separate defect. The heading text and position are correct, and they only look empty because the galleries are missing (finding 1). Restoring the galleries fixes this, so it should be folded into finding 1. |
