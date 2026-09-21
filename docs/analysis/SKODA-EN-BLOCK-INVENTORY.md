# Škoda Storyboard — EN Block Inventory (Full-Crawl Audit)

> **⚠️ Counts superseded (2026-09-15):** the block appearance counts below were re-run against the
> measured `docs/ui-specs/` block universe, split **STO vs Media Room**, with signatures validated live
> by Explore agents. See **`SKODA-BLOCK-RECOUNT.md`** (canonical for counts) + its raw artifacts
> `SKODA-BLOCK-RECOUNT-DATASET.csv` / `-AGGREGATE.json`. This doc is retained for its per-block
> responsive/JS behaviour detail (§8) and narrative, which the recount does not repeat.

**Companion to:** `SKODA-STORYBOARD-DISCOVERY.md`, `SKODA-STORYBOARD-DRILLDOWN.md`
**Date:** 2026-09-04
**Method:** Signature-based block discovery run against **every English page**, plus Tier-2 exemplar verification, plus a **responsive-behavior analysis** of block JS/CSS (§8). Analysis only — no import, no code generation, no Git operations.
**Raw data:** `SKODA-EN-BLOCK-DATASET.csv` (per-URL, 3,496 rows), `SKODA-EN-BLOCK-AGGREGATE.json` (aggregated stats).

> **Note (2026-09-04):** Corrected by adversarial review (`SKODA-ADVERSARIAL-REVIEW.md`): the signature crawl MISSED that story pages use SiteOrigin Page Builder (nested panel/widget layout), and missed a gallery lightbox. See §8 and the correction subsection.

> **Note (2026-09-05):** Dynamic-systems detail added from `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`: the Škodapedia glossary A–Z directory + letter/category filter are 100% client-side static (no fetch), but term detail is a thin API fetch on click (`skodapedia/v1/term/{id}` → ready-rendered HTML fragment) — eliminable by pre-baking each term as a `/modals/` doc, though not fully static as built; banner sets are per-market/locale + tag-targeted (a backend ad service).

---

## 1. Summary

| Metric | Value |
|---|---|
| EN URLs enumerated (REST `?lang=en` + index pages) | **3,501** |
| Pages successfully scanned | **3,496** |
| Fetch errors (dead / redirect-loop / 404 source pages) | **8** |
| Cross-locale redirects detected | 4 |
| Distinct content blocks identified | **13** (after de-noising chrome & false positives) |
| Distinct variants identified | 9 |
| Embed providers found | 6 (Vimeo, YouTube, Buzzsprout, Spotify, internal, other) |

**Template distribution (scanned pages):**

| Template | Pages | Share |
|---|---|---|
| Press release | 1,659 | 47.5% |
| Story (editorial post) | 1,312 | 37.5% |
| Page | 334 | 9.6% |
| Škodapedia | 189 | 5.4% |
| Listing / index | 2 (of ~7 known) | 0.1% |

> **Two data-quality corrections applied after Tier-2 verification** (documented in §5) — without them the raw signature counts overstate several blocks:
> 1. **Global footer/header chrome** (`app_badges`, `downloads`, `social_feed`, `social_share`, `ajax_loadmore`, `newsletter`) matched on ~100% of pages because it is site-wide furniture, **not** per-page content. Reclassified as **chrome**.
> 2. The `skodapedia_glossary / az-filter` signature was a **false positive** — the token `letterFormWidget` collided with the newsletter's `NewsletterFormWidgetV2`. The **real** Škodapedia glossary is the `term-detail` signature = **189 pages** (exactly the Škodapedia page count).

---

## 2. Block Catalog

Blocks are grouped into **content blocks** (authored per page — the migration build backlog) and **chrome** (global header/footer — built once as fragments).

### 2A. Content Blocks

#### Hero
- **Pages:** 1,587 (45%). Variant: `image` (full count).
- **Templates:** story (1,310), skodapedia (189), page (86).
- **Signature:** `hero`, `hero-image`.
- **Samples:** `/en/lifestyle/ouninpohja-finlands-roller-coaster-stage/`, `/en/skodapedia/adaptive-cruise-control-acc/`
- **EDS mapping:** Hero block + variant. **Low effort.**

#### Cards / Teaser
- **Pages:** 3,191 (91%) — the universal card unit.
- **Variants:** `media` (3,142), `toolbar` (3,139), `overlay` (2,637). These co-occur (a teaser has media + toolbar; overlay is the styled hero-card form).
- **Templates:** all content templates (story 1,311, press_release 1,659, page 220).
- **Signature:** `teaser`, `teaser-media`, `teaser-toolbar`, `teaser-overlay`.
- **Samples:** `/en/`, `/en/news/`, any story/PR page (related-content rails).
- **EDS mapping:** Cards block with `overlay` variant. **Low effort** — core reusable pattern; highest-priority build.

#### Gallery
- **Pages:** 1,763 (50%).
- **Templates:** press_release (1,510), page (176), story (77).
- **Signature:** `gallery-item`.
- **Samples:** `/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon/`
- **Note (adversarial review):** the gallery also ships a full-screen **lightbox** viewer (`sb-gallery-lightbox`) not previously catalogued — a click-to-expand overlay for gallery items. See §8 for the JS width-branch that gates it.
- **EDS mapping:** Gallery block (with expandable "show more" + lightbox overlay). **Medium effort.**

#### Carousel (editorial "Series" / related)
- **Pages:** 233 (7%) — **genuinely a story block**, not chrome.
- **Templates:** story (231), press_release (1), page (1).
- **Signature:** `skoda-carousel`.
- **Samples:** stories under `/en/lifestyle/`, `/en/skoda-world/`.
- **EDS mapping:** New carousel block (JS decoration). **Medium effort.**

#### Media Cart actions
- **Pages:** 3,178 (91%). Variant: `item`.
- **Templates:** story (1,294), press_release (1,659), page (224).
- **Signature:** `media-cart-action`, `media-cart-item`.
- **Note:** the *per-asset* "add to media cart" control is embedded next to images/galleries on content pages (hence high coverage), while the cart itself is chrome. The **action buttons are a content-block concern**; the cart backend is an integration (see Discovery §6).
- **EDS mapping:** Requires backend service — no static equivalent. **High effort / descope candidate for demo.**

#### Tags
- **Pages:** 2,907 (83%).
- **Templates:** story (1,276), press_release (1,628).
- **Signature:** `tag-list`.
- **EDS mapping:** Tag/metadata block or default content. **Low effort.**

#### Promo Banner
- **Pages:** 1,658 (47%). Variant: `box`.
- **Templates:** press_release (1,656), page (2).
- **Signature:** `skoda-banner`, `promo-box`.
- **Note:** driven by `skoda-banners/v1` API — likely injected into PR template.
- **Note (deep-dive):** banner sets are **per-market/locale-scoped campaigns with content-tag targeting** (per `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`) — reinforcing that this is a **backend ad service, not a content block**.
- **EDS mapping:** New block or section metadata. **Medium effort.**

#### Parallax (decorative)
- **Pages:** 1,646 (47%).
- **Templates:** story (1,312), page (334).
- **Signature:** `ys-parallax`.
- **EDS mapping:** CSS/JS behavior on a section, not a standalone block. **Medium effort.**

#### Škodapedia Glossary (term detail)
- **Pages:** 189 (5.4%) — **exactly the Škodapedia page count** (verified). Variant: `term-detail`.
- **Templates:** skodapedia (189).
- **Signature:** `sp__term-detail` (+ `sp__term-detail__close`, `__data` → modal/overlay interaction).
- **Samples:** `/en/skodapedia/adaptive-cruise-control-acc/`, `/en/skodapedia/active-cylinder-technology-act/`
- **Note (deep-dive):** the A–Z directory + letter/category filter are static (client-side, no fetch); term detail is a **thin API fetch** on click (`skodapedia/v1/term/{id}` → ready-rendered HTML fragment). This is **eliminable by pre-baking each term as a `/modals/` doc** (recommended) — but the glossary is **not fully static as built** (per `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`).
- **EDS mapping:** New block — glossary term + A–Z filter + overlay. **Medium effort.**

#### Faceted Listing
- **Pages:** 7 (the listing/index pages only — correctly scoped).
- **Templates:** page/index (`/en/news/`, `/en/press-releases/`, `/en/press-kits/`, `/en/videos/`, `/en/images/`, `/en/media/`, `/en/search/`).
- **Variants:** `taxonomy` (facet checkboxes), `pagination`.
- **Signature:** `filter-type-taxonomy`, `filter-input-options`, `pagination-status`.
- **EDS mapping:** New block over a published query-index (see Drill-Down §1). **High effort** — the key demo prototype.

#### Embeds (per-article media)
- **Vimeo:** 246 (7%) · **YouTube:** 201 (5.7%) · **Buzzsprout (podcast):** 195 (5.6%) · **Spotify:** 36 (1%) · internal 23 · other 7.
- **Templates:** predominantly story + press_release.
- **EDS mapping:** Embed block / URL autoblocking. **Medium effort** — must cover 4 providers incl. audio.
- **Note (client-confirmed):** all video/audio is **externally hosted** (Vimeo/YouTube/Buzzsprout/Spotify) — **no MAM, no AEM Assets video, no self-hosted media**. So there is **no video-migration workstream**: no files to move/transcode/host, **no video in the ~28,300-item / ~200k-file footprint**, and **no player to rebuild**. We only reproduce the embed + `dnt=1` + lazy + consent gate. Media effort concentrates on **images + media-cart**, not video.

### 2B. Chrome (global — build once as header/footer fragments, NOT per-page blocks)

| Chrome element | Signature | Where (verified Tier-2) | EDS approach |
|---|---|---|---|
| Newsletter subscribe | `newsletter-subscribe`, `NewsletterFormWidgetV2` | Footer + inline widget | Footer fragment + form block + external service |
| App-download badges | `app-download`, `download-badge/buttons` | Footer | Footer fragment |
| Social feed | `ys-social-feed` | Footer | Footer fragment / embed |
| Social share links | `social-links` | Footer/article | Share block (small) |
| "Load more" AJAX loader | `ys-ajax-loader` | Listings + related rails | Listing block behavior |

---

## 3. Variant Detail

| Block | Variant | Identifying signature | Pages | Canonical sample |
|---|---|---|---|---|
| Cards/Teaser | overlay | `teaser-overlay` | 2,637 | `/en/` |
| Cards/Teaser | media | `teaser-media` | 3,142 | `/en/news/` |
| Cards/Teaser | toolbar | `teaser-toolbar` | 3,139 | `/en/press-releases/` |
| Hero | image | `hero-image` | 1,587 | `/en/skodapedia/adaptive-cruise-control-acc/` |
| Media cart | item | `media-cart-item` | 3,158 | any press release |
| Downloads | badge / buttons | `download-badge` / `download-buttons` | 3,496 (chrome) | footer |
| Promo banner | box | `promo-box` | 1,658 | press releases |
| Škodapedia | term-detail | `sp__term-detail` | 189 | `/en/skodapedia/...` |
| Škodapedia | az-filter | ⚠️ false positive (see §5) | — | — |
| Faceted listing | taxonomy / pagination | `filter-type-taxonomy` / `pagination-status` | 7 | `/en/news/` |

---

## 4. Template × Block Matrix (content blocks)

Counts = pages of that template carrying the block. (`skodapedia_glossary` row on press_release reflects the §5 false positive — the true glossary is skodapedia-only.)

| Block | story | press_release | page | skodapedia | index |
|---|--:|--:|--:|--:|--:|
| hero | 1310 | 0 | 86 | 189 | 2 |
| cards_teaser | 1311 | 1659 | 220 | 0 | 1 |
| gallery | 77 | 1510 | 176 | 0 | 0 |
| carousel | 231 | 1 | 1 | 0 | 0 |
| media_cart | 1294 | 1659 | 224 | 0 | 1 |
| tags | 1276 | 1628 | 3 | 0 | 0 |
| promo_banner | 0 | 1656 | 2 | 0 | 0 |
| parallax | 1312 | 0 | 334 | 0 | 0 |
| faceted_listing | 0 | 0 | 6 | 0 | 1 |
| skodapedia_glossary (real=term-detail) | 0 | 0 | 0 | 189 | 0 |

**Reading the matrix:**
- **Story template** = hero + teaser rails + carousel + parallax + tags + embeds. The richest editorial layout.
- **Press-release template** = teaser rails + gallery + media-cart + tags + promo-banner. No hero, no carousel, no parallax.
- **Page template** = mixed/flexible (hero optional, gallery common, parallax common).
- **Škodapedia** = hero + glossary term-detail only.
- **Listings** = faceted_listing (the 7 index pages).

---

## 5. Long-Tail & Data-Quality Notes

**Long-tail blocks (<1% of pages):**
- `faceted_listing` — 7 pages (0.2%). Not really "long tail"; it's a small fixed set of index pages, each high-value.

**False positives corrected (why Tier-2 matters):**
1. **`skodapedia_glossary / az-filter` (raw 1,866)** — the signature `letterFormWidget` matched the substring inside `NewsletterFormWidgetV2` (the footer newsletter form). **Discarded.** True Škodapedia glossary = `sp__term-detail` = **189**, correctly scoped to skodapedia pages.
2. **100%-coverage blocks** (`app_badges`, `downloads`, `social_feed`, `social_share`, `ajax_loadmore`, `newsletter`) — verified to live in the **footer/header**, i.e. global chrome, not per-page content. Reclassified in §2B.

**Source-site dead pages (8 fetch errors)** — worth flagging to content owners; these EN URLs are in the REST index but fail to serve:
- Redirect-loop: `/en/press-releases/double-victory-skoda-best-cars-2018-awards/`, `/en/press-releases/gift-ideas-santa-claus-skoda-turns-christmas-upside/`
- 404 press kits: `/en/skoda-superb-combi-press-kit/`, `/en/all-new-skoda-kodiaq-press-kit/`, `/en/press-kits/privacy-statement/`

### Correction (adversarial review): SiteOrigin Page Builder on stories

The signature crawl **missed that story-template pages are built with SiteOrigin Page Builder** — a nested panel-grid / widget layout rather than linear HTML. On all **4/4 sampled stories**, the story body is composed of SiteOrigin structures: `so-panel`, `panel-grid`, `so-widget-sow-editor`, `skoda-carousel-widget`, `skoda-offset` — **13–19 panels + 19–25 widgets per story**. This layout-builder architecture is **story-only** (NOT present on press-release, Škodapedia, or home templates).

**Why the crawl missed it:** signature detection matched *content-block* CSS tokens on raw HTML but was **blind to the layout-builder scaffolding** wrapping them. Nested panel/widget containers were treated as generic markup.

**Implication for migration:** the story importer must **flatten a SiteOrigin builder layout** (unwrap panel-grid → panel → widget nesting into EDS sections/blocks) rather than assume a linear DOM. More broadly, signature crawls are blind to layout-builder architectures; any story-template migration estimate that assumed flat HTML understates parsing/transformer effort.

---

## 6. Cross-Check vs. Prior Reports

| Prior claim | This full-crawl finding | Status |
|---|---|---|
| Teaser is the universal card unit | Confirmed — 91% of pages | ✅ |
| Faceted filter bar is a key new block | Confirmed — scoped to 7 index pages | ✅ |
| Škodapedia = interactive glossary (letter filter + modal) | Confirmed via `sp__term-detail`; A–Z filter is real on skodapedia pages (the site-wide 1,866 count was a false positive) | ✅ refined |
| "Series"/"Podcast" are not templates | ⚠️ **CORRECTED 2026-09-14:** Series IS a real 2-level template (directory `/series-2/` + hub `/series/<slug>/`, 22-URL analysis) — see SKODA-MASTER §3 / D18. Podcast remains a story variant (unverified in that batch) | ⚠️ corrected |
| ~12–14 net-new blocks | Full crawl yields **~10 content blocks + ~5 chrome elements** | ✅ aligned |
| Embeds: Vimeo/YouTube/Buzzsprout | Confirmed + **Spotify** added (36 pages) | ✅ +1 provider |

**New this round:** Spotify embeds (audio, 36 pages); precise per-template block frequencies; footer/header chrome vs content-block separation; 8 dead source URLs.

---

## 7. Recommended Build Priority (demo backlog)

1. **Cards/Teaser** (91% coverage) — unlocks nearly every page. Build overlay + media + toolbar variants.
2. **Hero** (image variant) — story/skodapedia/page.
3. **Gallery** — press releases + pages.
4. **Faceted Listing over query-index** — the one high-effort prototype that de-risks search/listings.
5. **Embeds** (Vimeo/YouTube/Buzzsprout/Spotify) — URL autoblocking.
6. **Carousel** — story pages.
7. **Škodapedia glossary** (term-detail + A–Z + overlay) — self-contained, can follow.
8. **Header + Footer chrome fragments** (newsletter, social, app badges, share, load-more).
9. **Deferred / decision-required:** Media cart (backend service), promo banner (banners API — see below), parallax (decorative).

### Promo banner — rebuild approach (deferred, production)

The promo banner is a **bespoke WordPress ad system** (custom `skoda-banners/v1` plugin + 174 KB React front-end + click-tracking redirect), not an off-the-shelf ad product. There is nothing to "turn on" in EDS; the behavior must be re-created — but the rules engine is already client-side, so it ports conceptually. Rebuild = **two pieces**:

1. **Banner data (what to show)** — either (a) **reuse the existing `skoda-banners/v1` API** and have the EDS block call it (fastest; keeps a legacy dependency), or (b) **re-home banner management into EDS** as a sheet/DA-doc feed (columns: image, type, target-tags, geo, frequency, link) served as JSON (no WordPress left).
2. **Banner behavior (a small vanilla-JS block, ~few hundred lines, rebuilt not ported)** — fetch the locale feed → match banners to the page's topic tags → geo check → `localStorage` frequency-cap → render into sidebar / inline-widget / pop-up slots (pop-up on timer or scroll-depth) → route clicks through a tracking link. Must respect the consent gate.

**Effort:** Medium (reuse API) → higher (re-home management). **Open decisions:** reuse the Škoda banner API vs rebuild management in EDS; and whether the full geo/frequency/pop-up machinery is wanted at all, or a simpler "featured promo" block suffices (the full ad-server behavior may be overkill once rebuilding).

---

## 8. Responsive Behavior — CSS-only vs. JS-driven

**Question:** for each block, is the mobile/tablet/desktop adaptation **CSS-only** (same DOM, restyled by media queries) or **JS-driven** (DOM mutated / components re-initialized at breakpoints)? This directly changes EDS block build effort — a CSS-only block is a straight port; a JS-driven one needs decoration logic.

> **Note on method:** the source is server-rendered WordPress, so it returns **identical HTML at every viewport** — the earlier full-crawl (which read raw HTML) therefore said nothing about responsive behavior. This section is based on analysis of the actual **block JavaScript and the main stylesheet**, not the crawl. (A live multi-viewport DOM diff via a headless browser was not available in this environment; recommended as a quick confirmation step — see below.)

### Evidence

- **Main stylesheet `media-room.css` ≈ 295 KB with 284 `@media` rules.** Breakpoint clusters: **768px (91 rules), 992px (28), 1080px (44)**, plus tablet/phone sizes. **Mobile-first**: 186 `min-width` rules vs 105 `max-width`. → Layout responsiveness is overwhelmingly **CSS-driven**.
- **24 `@media … { display:none }` rules** → some elements are shown/hidden per viewport (same DOM, CSS visibility toggle — not DOM mutation).
- **Block JS files are tiny and contain no custom viewport logic** (`skoda-carousel` 1.4 KB, `skoda-gallery` 0.5 KB, `ys-parallax`, `ys-embed-controller`, `ys-social-feed`). Grep for `matchMedia/innerWidth/resize/breakpoint` in each → **zero hits**.
- **The main JS bundle's viewport logic is almost entirely third-party libraries:** `isMobile.js` (device sniff), **Owl Carousel** (`_breakpoint`, `responsiveBaseElement`), **Isotope** (masonry grid). The one apparent `1200<` hit is a **scroll** handler (back-to-top `scrollTop()`), not a width branch.
- **Genuine custom width-based JS branches (at least TWO — the earlier "only the gallery column count" claim was overstated):**
  1. the **gallery column count** — `1024 < window.width && items > 19 → 5 columns; > 9 → 4; else 3`. DOM/layout logic that must be reproduced in the EDS gallery block.
  2. the **gallery lightbox** (`sb-gallery-lightbox`) — a full-screen viewer **gated by `width() <= 767`** (mobile/small-tablet branch). This is a newly-identified interactive component: an EDS port needs an accessible overlay with **focus-trap and keyboard navigation** (Esc to close, arrow keys between items, focus return on close).

### Per-block verdict

| Block | Responsive mechanism | Migration implication |
|---|---|---|
| Hero | **CSS-only** (media queries) | Straight CSS port |
| Cards / Teaser | **CSS-only** (grid reflow) | Straight CSS port |
| Gallery | **JS-driven** — column count computed by width (5/4/3) + Owl Carousel init + **lightbox** overlay (`sb-gallery-lightbox`, gated `width()<=767`) | **Needs JS decoration** (breakpoint→columns) + accessible lightbox (focus-trap/keyboard) — the main responsive-JS block |
| Carousel ("Series"/promo) | **JS (library)** — Flickity/interval rotation; responsiveness internal to lib | Reimplement as EDS carousel block (JS), but breakpoint logic is library-handled |
| Tags | CSS-only | Trivial |
| Promo banner | **JS (light)** — interval rotate + hover-pause (`skoda-carousel/public.js`); layout CSS | Small JS + CSS |
| Parallax | **JS** — scroll transform (decorative), not breakpoint DOM change | Decorative; can be simplified/dropped on mobile via CSS |
| Embeds | **JS (lazy)** — IntersectionObserver swaps `data-src`→`src`; sizing is CSS (aspect-ratio) | EDS embed block + lazy-load; CSS sizing |
| Škodapedia glossary | **JS** — A–Z filter + term-detail modal (interaction, not purely breakpoint) | JS block regardless of viewport |
| Faceted listing | **JS** — AJAX load-more + facet filtering; layout CSS | JS block (already flagged high-effort) |
| Media cart | **JS** — stateful actions (backend) | Integration, not styling |
| Chrome (nav/footer) | **JS** — mega-menu (hover desktop / accordion mobile) is a real DOM/behavior switch | Nav needs desktop+mobile behavior (already expected for EDS header) |

### Bottom line

- **Most content blocks (hero, cards, tags, most layout) are CSS-only responsive** — low-risk ports where a mobile-first stylesheet reproduces the behavior. This is good news: the earlier "Low effort" ratings for hero/cards hold up.
- **Genuinely JS-driven responsiveness is confined to a short list:** **gallery** (two width-branches — column-count by width AND the `width()<=767` **lightbox** overlay — the standout), **carousel** (library), **navigation mega-menu** (desktop hover vs mobile accordion), and interaction-driven blocks (glossary modal, faceted listing) that are JS regardless of viewport.
- **No block swaps to a completely different DOM per breakpoint** — the site uses one DOM restyled/hidden by CSS, which ports cleanly to EDS's single-markup model.

**Recommended quick confirmation (next step, ~30 min):** when a headless browser is available, render 3 exemplars (a story, a press release with gallery, the Škodapedia index) at 375 / 768 / 1280 px and DOM-diff to confirm no unexpected mutation — this validates the JS/CSS reading above against live rendering.

---

## Appendix — Datasets & Reproducibility

- **`SKODA-EN-BLOCK-DATASET.csv`** — one row per scanned URL: `url, template, redirected, blocks, embeds`. 3,496 rows. Queryable for any block → sample-URL lookup.
- **`SKODA-EN-BLOCK-AGGREGATE.json`** — aggregated counts: template_counts, block_pages, block_templates, variant_pages, variant_samples, template_blocks, embed_pages, embed_samples.
- **Method:** EN URLs enumerated from `wp-json/wp/v2/{posts,press_release,pages,skodapedia}?lang=en` (37 paginated calls); pages fetched concurrently (read-only, `User-Agent: block-audit`); block presence detected by CSS-class/token signatures on raw HTML; variant modifiers and `<iframe>` providers captured per page; results verified with Tier-2 exemplar DOM inspection.
- **Limitations:** signature detection flags block *presence*, not instance count or exact DOM structure; two false-positive classes were caught and corrected in §5 — other rare collisions are possible but unlikely to change the top-level picture. Deep per-instance content modeling is a follow-up step per block.
