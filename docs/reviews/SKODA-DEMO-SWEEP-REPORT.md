# Škoda Storyboard demo — URL / block sweep report

*2026-09-25 · Scope: all 43 lines of the M1 demo URL set (42 unique pages + 1 alias) plus the shared chrome · Full data: [`SKODA-DEMO-URL-BLOCK-REGISTRY.md`](SKODA-DEMO-URL-BLOCK-REGISTRY.md) · measured against `main` at `87a9894`; since then `downloads` (SKODA-502, #111) was merged.*

## 1. What was measured
- **43/43 URLs** captured at **1440 and 390 px**, from the rendered page (`getComputedStyle` + `getBoundingClientRect` via headless Chromium). No screenshots were used. **413 UI elements** were catalogued, de-duplicated into **157 coverage rows**.
- **11 URLs exist on EDS** (`/en`, 5 press releases, 4 eMobility stories, 1 Škoda World story) and were compared element by element. **32 are not imported yet** (404), so those elements have a source spec and a status but no render comparison.
- Interaction states were scripted: mega-menu, mobile drawer, search, rail drag/click/hover, lightbox.
- Every group was checked against `ui-specs/_TEMPLATES.md`, `ui-specs/README.md`, the M1 gap review §4/§8, the POC coverage matrix, the block data model, the ticket backlog and the blocks on `main`. A critic pass and 6 follow-up checks corrected the results (listed in the registry header).

## 2. Coverage at a glance

| Status | Rows | Meaning |
|---|--:|---|
| covered | 5 | ticketed, built, and matches the measured source |
| covered-visual-off | 66 | built, but with measured drift |
| covered-not-built | 54 | ticketed, not built or not imported yet |
| gap-needs-ticket | 17 (→ 9 root causes) | no ticket covers it |
| deferred-by-decision | 13 | ad slots, cookie banner, newsletter backend, popup: deferred to 903/904/804 |
| out-of-scope | 2 | |

**Bottom line:**
- Almost everything the demo needs is **already ticketed**: 125 of 157 rows are either built or ticketed-but-unbuilt.
- **Rendered fidelity is the main risk**: 66 built rows drift from the source.
- There are **9 genuinely new root causes**, one of them a P1 bug.

## 3. Already covered
- **Built and matching:** the `Load more` pill (home + listings), the default Tags chips, and the story-flatten handling of spacers, inline images and multi-column image grids.
- **Built and on `main`:**
  - `hero-image` (story), `gallery`, `cards`, `tags`, `stories`, `story-rail` / `carousel`, `listing`, header and footer;
  - since today also `embed` (PR #109: YouTube/Vimeo render on EDS) and `search` (#131);
  - the two-column story layout.
- **Ticketed but not built (largest groups):**
  - press-release template, SKODA-607: two-column shell, lead image, perex/bullets, Additional info, Buzzsprout mapping;
  - press kits, SKODA-805a/b/c + 807 accordion;
  - model page, SKODA-208: `in-page-nav`, `spec-table`/tech data, derivatives rail;
  - Media Box, SKODA-502 (block merged in #111 after this sweep; importer mapping pending), plus media cart 505a/b;
  - promo box, SKODA-213 (PR #110 open);
  - Media Room footer, SKODA-305 (PR #134 open);
  - in-body slider, SKODA-819;
  - sidebar newsletter, SKODA-823;
  - media item rows, SKODA-608.

## 4. Where visuals are off (built, measured drift)

| # | Root cause (measured, 1440 unless noted) | Where | Owner |
|---|---|---|---|
| V1 | **Rails don't navigate on mouse click; drag doesn't move.** Verified live: clicking a Related Stories card focuses the link and stays on the page. `setPointerCapture` retargets the click, and a native `dragstart` cancels the pointer. | every `carousel`/`story-rail` (home + all stories) | **SKODA-212 → reopen (P1)** |
| V2 | **Rail geometry:** 4-up 263×148 / 281×158 cells vs source **3-up 354×199** (content rails); models: 16:9 + 45px white title bar; missing "All" pill + end tile; "Based on tags" subheading 16/32 `rgb(196,198,199)`; hover turns titles green `rgb(14,58,47)` (global `a:hover`); focus outline sticks after click. | home, stories, models | SKODA-212 / 820 |
| V3 | **Dark bands:** heading renders `rgb(22,23,24)` on `rgb(14,58,47)` (unreadable; verified live). The global `h1–h6` colour beats `.section.dark`. The band is 1248px in the grid instead of full-bleed 1440. | Related Stories, PR bands, home bands | SKODA-218 (widen scope) + 820 |
| V4 | **Story hero caption:** perex 16/400 vs **20/600/30**; date is a 16px `<p>` on its own row vs **12/300 inline with the pill**; 16px flex gap under the H1 (expected 0); mobile gutter 24px vs **10px** (image 342 vs 370 wide). | all stories | SKODA-816 (amend AC: inline date+pill) |
| V5 | **Story body column:** text x=144 w=720 vs **x=106 w=819**. Inline images and embeds 720/736 vs 819. Captions 16px left vs **13.33/20 centred**. p→h2 gap 32 vs **44**. Mobile h2 28 vs **24px**. | all stories | SKODA-821 (extend) |
| V6 | **Story sidebar:** headings 34/600 h2 vs **16/600/45 `rgb(53,53,53)`** (20px @390); Explore-more cards get a toolbar and 8px radius vs source overlay 345×194 (source *has* radius, so 817's "square corners" is wrong); Tags heading flush (0px) vs 32px gap. | all stories | SKODA-817 (correct AC) |
| V7 | **Press releases render single-column 1248** (source 812 + 342 sidebar). Sidebar images: 3:2 full-width stage vs **2-col 16:9 171×97 thumbs** + "+N" pill. Tags heading missing. | 5 PRs | SKODA-607 |
| V8 | **hero-image overlay** is 1248 wide vs **full-bleed 1440**; ≤767 source puts the caption **below** the 16:9 image in ink (H1 28/300 press kits, 48/300 series); perex 20/30. | series + press-kit hubs | amend SKODA-202 / 207 / 805a |
| V9 | **Chrome:** switcher x=120 vs 106; logo box 194×19 vs 256×48; nav items y=40/h72 vs y=44/h64; search overlay 340px vs 624px; mobile hamburger 20×22 vs 68×64 tap target; drawer y=44 vs 108; footer columns 155+24 vs 175 pitch, headings 13/400 vs 12/500 ls 1px; **4 legal links missing** from the footer disclaimer (they *are* in the source DOM; SKODA-304 says otherwise). | all pages | new SKODA-308 |
| V10 | **Images/Videos listings:** facet pill bar always visible vs **collapsed behind "Advanced filter (0)"**; sort/count colours. | 2 listings | SKODA-402 (cosmetic) |

**Stale imports:** some EDS findings come from pages imported before yesterday's fixes: plates, Peaq record and Octavia (hero overlay, 6 cards, missing band). **Re-import these 3 first**, then re-measure.

## 5. Missed blocks / elements → new tickets

| Proposed | Scope (measured) | URLs | Severity |
|---|---|--:|---|
| **SKODA-824** In-column highlight panel | SiteOrigin `panel-row-style` box in the body column: dark `rgb(14,58,47)` + white text (h3, text, optional image); **grey variant** `#f3f3f3` pad 25px for the PR FAQ/info callout. One section-style or block variant. | 12 stories + 1 PR | demo-visible |
| **SKODA-220** Quote block | centred pull-quote + short 81×2 rule + bold attribution | 4 PRs + 1 PK | demo-visible |
| **SKODA-215** *(ID exists, file missing)* Floating action bar | fixed share toggle (X / Pinterest / LinkedIn / Facebook) + scroll-to-top, right 16 / bottom 8 px | all stories, series, PKs | demo-visible |
| **SKODA-221** Cards `tiles` / mosaic variant | 1:1 + 2:1 tiles on a 12-col grid, 20px gap, 16/500 title, no date, no hover zoom; 5-up (PK) / mosaic rows (series) | 5 series + 3 PK hubs | demo-visible |
| **SKODA-611** Home composition | /en as the 9-band cover-box stack: Social strip, Series band, Latest Stories skipping the promo posts, rail spacing. Nobody owns assembly since 604 was re-pointed. | /en | demo-visible |
| **SKODA-610** Clean index titles | strip " - Škoda Storyboard" in the metadata transformer, then re-import | every card and rail | demo-visible |
| **SKODA-308** Chrome parity pass | V9 above, including the footer legal links | all pages | demo-visible |
| **SKODA-309** Media Room side chrome | MR nav fragment, switcher "Media Room" active, `nav`/`footer` metadata on MR pages (PRs, PKs, listings) | 11 MR URLs | demo-visible |
| **SKODA-225** Columns unequal split | 518/320 text + portrait cell, intrinsic portrait (not stretched to 356) | 3 stories | cosmetic |

**Existing tickets to amend** (not new):
- **608** (demo-blocking): add the listing media-card cell (date, filename, add/download toolbar, lightbox detail panel).
- **207** and **208** (demo-blocking): the importers hard-code Elroq and emit the rail `subheading` key, which breaks the rail config. Series hubs must import a static curated mosaic, not an index listing.
- **208:** fix the AC to a **sticky** icon nav with 9/8/6 items and a 480px hero, not "not sticky / 8 / 510".
- **819:** add visible slide captions (13.33/20 centred; present on 6 of 16 lifestyle sliders, plus Octavia, Slavia and 365 km/h). Close **219** as a duplicate.
- **820:** 7 of 21 story bands are **curated**, so emit hand-picked rails for those. Remove the empty band when the index returns nothing.
- **502:** add the Media Box "Show more" collapse above 8 assets (708px collapsed, 139×44 pill).
- **204:** as built it uses `youtube.com`, not the nocookie host, and has no click-to-load consent gate, although both are in its ACs. That's a privacy decision to confirm.
- **805a / 805c / 806:** the tile grid needs 221, not the plain cards variant. The whole-kit ZIP is a static `<a>`, not scripted. Add the WhatsApp + ZIP banner pair.

## 6. Where the docs registries are wrong or stale (108 diffs, top themes)
- **M1 gap review:**
  - it says all 5 PRs 404 and the Latest Stories feed has 0 cards; both are now live;
  - it states one set of rail cell widths for every rail, but that applies to Models only;
  - it misses these measured elements: pull-quote, FAQ panel, Additional info, the sidebar gallery.
- **`_TEMPLATES.md` / `README.md`:**
  - the home page has no hero;
  - the press-kit row is keyed on the wrong template;
  - the model page lacks Tech data, the Derivatives rail and a sticky nav;
  - a `series` block is referenced that doesn't exist;
  - the story in-body gallery is `skoda-carousel-widget` (21/21 stories), not `.sb-gallery` (0/21).
- **Block data model:** it lists `stories` config keys that don't exist, says to use `columns` for the 2/3 + 1/3 split (the implemented shell is grid-on-main), and calls tech data "out of scope" although it's on 4 model pages.
- **Specs:**
  - `hero.md` has no mobile rule for the overlay hero;
  - `carousel-rails.md` gives the wrong ladder and taxonomy card;
  - `story-detail.md` places the Media Box inside the content (it's a full-bleed band);
  - `series.md` describes a 2-col 1:1 newest-first grid (it's a curated mosaic);
  - `faceted-listing.md` says the facets show inline (they're collapsed);
  - `downloads.md` has no "Show more";
  - `embeds.md` / `SKODA-204` miss that Buzzsprout is on all 5 PRs.

## 7. Todo
- [ ] **Reopen SKODA-212 (P1):** rail mouse click and drag are broken (V1); then the rail geometry parity (V2)
- [ ] Widen SKODA-218 to all dark bands: heading colour (V3); make the Related Stories band full-width (SKODA-218/820)
- [ ] Amend 816 (inline date + pill, perex 20/600), extend 821 (column width, captions, rhythm, 10px mobile gutter), correct 817 (radius, 16px headings, Tags gap)
- [ ] Re-import the 3 stale story pages (plates, Peaq record, Octavia) with the current importer, publish, re-measure
- [x] Create tickets **SKODA-824, 220, 215 (file), 221, 611, 610, 308, 309, 225** (§5)
- [ ] Amend **608, 207, 208, 819, 820, 502, 204, 805a/805c/806** (§5); 219 is already marked superseded by 819 in `OVERVIEW.md`, so close its GitHub issue
- [ ] Correct the docs registries listed in §6 (M1 gap review, `_TEMPLATES.md`, `README.md`, block data model, hero/carousel-rails/story-detail/series/faceted-listing/downloads/embeds specs)
- [ ] Import the remaining 32 demo URLs (SKODA-603) with `npm run import:push`, then re-run this sweep for the render comparison
- [ ] **SKODA-307:** header and footer should log a warning instead of crashing when their shared page (`/nav`, `/footer`) is missing
- [ ] **Card titles end in " - Škoda Storyboard":** fix in the shared metadata step, then re-import (→ SKODA-610)
- [ ] **Dark band width:** the Related Stories band sits in the left column instead of spanning the full width (SKODA-218/820)
- [ ] **Blocks missing on `main`:** `promo-box` (PR #110 open), `in-page-nav`, `spec-table` and `version` (no PR); `downloads` merged in #111. Published pages use them, and they fail to load.
- [x] **Duplicate tickets:** SKODA-219 and SKODA-819 describe the same work (219 already marked superseded by 819 in `OVERVIEW.md`; close the GitHub issue)
- [ ] **Tidy-up:** delete the temporary checkout at `.migration/wt-602`
