# Škoda Storyboard — Analysis Drill-Down

**Companion to:** `SKODA-STORYBOARD-DISCOVERY.md`
**Date:** 2026-09-04
**Scope:** Analysis only — no implementation, no import, no code generation. Evidence from public pages, HTTP headers, and the WordPress REST API.

> **Note (2026-09-04):** Corrected by a later adversarial review (`SKODA-ADVERSARIAL-REVIEW.md`): press-kits are a filtered view of `press_release` (not a separate type); 'speeches' is not a public CPT; story pages use SiteOrigin Page Builder.
> **Further correction (2026-09-15, live DevTools — `../ui-specs/_TEMPLATES.md`):** the "not a separate type" for press-kits is **REST-API-only** (`wp/v2/press_kit` → 404). The *rendered pages ARE a real `press_kit` post type* (`single-press_kit`, `press_kit-template-*`), so they get their own EDS template (SKODA-805–808), not a `press_release` view.

This document answers three follow-up questions:
1. Is an **EDS index-based search** feasible in place of ElasticPress — is ES doing anything an index can't carry?
2. What does an **English-only demo** look like, kept **extensible** for later languages?
3. A **template-based block gap review** — which blocks are still uncovered?

---

## 1. Search Feasibility — EDS Index vs. ElasticPress

### What the search actually does (evidence)

The search endpoint is `/{lang}/search/?filter[search]=<query>` with results **server-rendered** into `search-result` / `teaser` markup (54 teasers rendered on a single query page), and **"Load more" pagination via the `ys-ajax-loader`** module (`data-url="…/en/search/"`). Header `x-elasticpress-search: true` confirms Elasticsearch backs it.

**Facets / query surface actually exposed on the search form:**
- `search_type` → content-type facet with values: **`post`, `press_release`, `press_kit`, `image`, `video`** (empty = all). Note: `press_kit` is a search filter/taxonomy value surfacing `press_release` items — not a separate content type (verified: `wp/v2/press_kit` returns HTTP 404).
- `model` (multi-value: `filter[model][]`) → the **Models** taxonomy
- `motorsport`, `equipment`, `terms` → additional taxonomy facets
- `sortby` → sort order (relevance/date)
- `lang` → locale scoping (Polylang)

**Taxonomies that drive faceting (9 total):** `category`, `model`, `derivative`, `bodywork`, `skodapedia-catagory`, `global-categories`, plus nav/pattern/banner taxonomies.

### What an EDS index CAN carry (the majority)

EDS's model — a published query-index (JSON/spreadsheet) filtered/queried client-side — comfortably covers:

| Capability | EDS index equivalent | Verdict |
|---|---|---|
| Filter by content type (`search_type`) | Index column `template`/`type` + client filter | ✅ Easy |
| Filter by taxonomy (model, category, bodywork…) | Index columns per taxonomy + faceted filter | ✅ Easy |
| Sort by date / title | Index columns + client sort | ✅ Easy |
| "Load more" pagination | Chunked index reads | ✅ Easy |
| Language scoping | Per-locale index (`/en/query-index.json`) | ✅ Easy — aligns with locale plan |
| Title / summary keyword match | Substring/token match over indexed fields | ✅ Good enough for a demo |

### What ElasticPress does that an index CANNOT (the honest gaps)

| ES capability | Can a published index carry it? | Impact |
|---|---|---|
| **Full-text search over article body** (not just title/summary) | ❌ Not natively — an index holds curated fields, not full document text | **Medium.** For a demo, indexing title + summary + tags is usually acceptable; full-body relevance is not. |
| **Typo tolerance / fuzzy matching** ("enyaqq" → "Enyaq") | ❌ | Low–Medium — nice-to-have, not demo-critical |
| **Relevance ranking / TF-IDF scoring** | ❌ (only naive scoring client-side) | Medium — ordering quality drops |
| **Stemming / linguistic analysis across 6 languages** | ❌ | Medium at scale; irrelevant for EN-only demo |
| **Cross-content-type unified relevance** (post + PR + image + video ranked together) | ⚠️ Partial — can merge lists, but no unified score | Low–Medium |
| **Scale** (13k+ docs all-langs) in one client-loaded index | ⚠️ Needs chunking/sharding | Medium at full scale; **negligible for EN demo (~3.5k items)** |

### Recommendation

**For the EN demo: an EDS query-index is feasible and recommended.** At EN-only volume (~3,500 items) a per-locale `query-index.json` with columns for `title, summary, type, date, model, category, tags, path, image` supports the type + taxonomy facets, sort, and "load more" that the current UI exposes — which is the bulk of the observed behavior.

**The one real gap to flag to stakeholders:** full-text **body** search and **fuzzy/relevance ranking**. Options:
- **Demo:** index title/summary/tags only — accept reduced recall. (Recommended for demo.)
- **Production:** if body-level relevance/typo-tolerance is a hard requirement, keep a hosted search service (Algolia, Elastic Cloud, or Adobe's search) fed by the EDS index — EDS indexes and external search are **not mutually exclusive**.

> **Net:** Index-based search carries everything the *current facet UI* exposes. It does **not** replicate ES's full-text-body relevance and fuzzy matching. That's the single decision to put to stakeholders — and it's safely deferrable past the demo.

---

## 2. English-Only Demo Scope (extensible to more languages)

### EN-only volume (verified via Polylang `?lang=en`)

| Content type | EN only | All languages | EN share |
|---|---|---|---|
| Posts (stories) | **1,312** | 5,282 | 25% |
| Press releases | **1,661** | 6,715 | 25% |
| Pages | **337** | 551 | 61% |
| Škodapedia | **189** | 725 | 26% |
| **Editorial total** | **~3,499** | ~13,270 | ~26% |

**EN scope is ~26% of the full site** — a dramatically more tractable demo target. A curated demo slice (one page per template + a listing sample) is far smaller still.

### Extensibility principles (bake in now, populate later)

The site is **already locale-prefixed** (`/en/`, `/cs/`, …) via Polylang, and the REST API filters cleanly by `lang`. To keep the demo extensible without rework:

1. **Locale-prefixed content tree** — mirror the source: `/en/…` now, `/de/…`, `/cs/…` added later. Do not hardcode paths at root.
2. **Per-locale query index** — `/en/query-index.json` today; sibling indexes per locale later. The listing/search block reads the index for the current locale (derive from URL prefix, exactly as the existing `getContentRoot()` pattern in this repo does).
3. **Locale-agnostic blocks** — block JS/CSS carry no language assumptions; all copy comes from content. (Matches this project's existing nav/footer fragment approach.)
4. **Language switcher = fragment/nav concern**, not a block rebuild — wire the Polylang-style locale links in the header fragment.
5. **Placeholders/labels** externalized (EDS `placeholders.json` per locale) so UI strings (e.g., "Load more", "Search") translate without code changes.

### Recommended demo slice (EN only)

- 1× **press-release article** (richest block coverage: teasers, gallery, downloads, embeds, share, media-cart, newsletter)
- 1× **press-release/news listing** (facets + "load more" → proves the index-search approach)
- 1× **editorial story** (default-content body + inline media) — **note:** stories are built with SiteOrigin Page Builder (nested `panel-grid`/`widget` layout), not linear HTML; expect to flatten that structure on import (discovered by adversarial review; see `SKODA-ADVERSARIAL-REVIEW.md`)
- 1× **Škodapedia** index + term (glossary interaction)
- **Header (mega-menu) + footer** fragments
- 1× **homepage** hub (teaser grids + carousel) — optional, highest effort

---

## 3. Template-Based Block Gap Review

I sampled templates not deeply covered in the original discovery and enumerated their component vocabulary from live markup. Findings vs. the discovery inventory:

### Template → block matrix (verified)

| Template | Verified URL behavior | Blocks present |
|---|---|---|
| **Homepage hub** | `/en/` 200 | teaser grids, hero, carousel (Series), newsletter, social feed, promo banners, app-download |
| **News/PR listing** | `/en/news/`, `/en/press-releases/` 200 | **faceted filter bar** (`filter-type-taxonomy`, `filter-label`, `filter-input-options` ×15), teaser grid, media-cart actions, **`pagination-status`** + `ys-ajax-loader` |
| **Press-kits listing** (filtered view of `press_release` **in the REST API only** — `wp/v2/press_kit` returns HTTP 404. ⚠️ Corrected 2026-09-15: the *rendered pages* ARE a real `press_kit` post type — body classes `single-press_kit` / `press_kit-template-*`; "not a separate type" is a REST statement only. See `../ui-specs/_TEMPLATES.md`) | `/en/press-kits/` 200 | same filter bar + teasers + media-cart, category chips |
| **Article / press release** | 200 | body (h/p/ul), Vimeo embed, Buzzsprout podcast iframe, gallery, tags, share, downloads, media-cart, newsletter widget |
| **Podcast post** | `/en/podcast/` **301 →** `/en/podcast-en/…` | It's a **post variant**, not its own template — audio via embed |
| **Series** | `/en/series/` **301 →** a press-release | ⚠️ **CORRECTED 2026-09-14:** `/en/series-2/` (directory of ~20 series) and `/en/series/<slug>/` (series hub, e.g. `125-years-of-motorsport`) **render as real 2-level listing pages** — Series IS a template. The `/en/series/` root tested here 301s, but the actual Series pages do not. See `.migration/plans/url-analysis-comparison.md` + SKODA-MASTER §3 (D18 → SKODA-207) |
| **Škodapedia index + term** | 200 | **A–Z letter filter** (`letterFormWidget`, `filter-button`, `letter-*`), **term-detail modal/overlay** (`sp__term-detail`, `sp__term-detail__close`, `sp__term-detail__data`), hero |

### NEW blocks uncovered by this review (not in the original inventory)

| # | Newly identified block/component | Where | EDS approach | Effort |
|---|---|---|---|---|
| N1 | **Faceted filter bar** (taxonomy checkboxes + labels driving the listing) | All listings | New block over the query index; render facets from index columns | **Medium–High** |
| N2 | **Pagination-status / "showing X of Y"** indicator | Listings | Part of listing block | Low |
| N3 | **Škodapedia A–Z letter filter** | Škodapedia index | New block (client filter over term index) | Medium |
| N4 | **Škodapedia term-detail modal/overlay** (`sp__term-detail`) | Škodapedia | New block (overlay/dialog interaction) | Medium |
| N5 | **Podcast/audio embed** (distinct from video embed) | Podcast posts | Embed block variant (Buzzsprout/audio) | Low–Medium |
| N6 | **App-download badges** (App Store / Google Play) | Homepage/footer | Small block or default content | Low |
| N7 | **Promo banner** (`skoda-banners/v1`-driven) | Various | New block (or section metadata) | Medium |

### Refinements to prior assumptions

- **"Series" and "Podcast" are NOT separate templates** — both 301-redirect into the post/press-release template. This *reduces* template count vs. the discovery estimate. Good news for scope. — ⚠️ **CORRECTED 2026-09-14 for Series:** the 22-URL analysis found `/en/series-2/` + `/en/series/<slug>/` render as a real 2-level template (only the bare `/en/series/` root redirects). Podcast remains a post variant (unverified in that batch). See SKODA-MASTER §3 / D18.
- **The faceted filter bar (N1) is the single most important newly-clarified block** — it's the concrete manifestation of the "listing/search re-architecture" risk (R4) and is the piece that most needs prototyping in the demo.
- **Škodapedia is more interactive than assumed** — a letter-index + modal glossary, not a flat article list. Two net-new blocks (N3, N4).

### Consolidated block count

- Original discovery: ~8–10 net-new blocks.
- **After drill-down: ~12–14 net-new blocks** (adding N1–N7, minus the removed "series"/"podcast" template assumptions).

---

## 4. Recommended Next Analytical Steps (still analysis-only)

1. **Prototype-plan the query-index schema** for the EN listing/search — define exact columns and confirm they satisfy every observed facet (`search_type`, `model`, `category`, sort).
2. **Decide the body-search question** with stakeholders (index-only vs. hosted search) — this is the one true ES gap.
3. **Deep-inspect one full listing AJAX response** to confirm facet counts and payload shape (informs N1 block design).
4. **Enumerate embed providers** across a sample of articles (Vimeo, YouTube, Buzzsprout, others?) to size the embed/autoblock block.
5. **Audit cross-locale redirects** on a URL sample so the demo's URL list is built from sitemaps/REST, not nav.

---

## Appendix — New Evidence Gathered This Round

- EN counts: `wp/v2/{posts,press_release,pages,skodapedia}?lang=en` → 1312 / 1661 / 337 / 189.
- Search form fields: `search_type` (post/press_release/press_kit/image/video), `filter[model][]`, `motorsport`, `equipment`, `terms`, `sortby`, `lang`.
- Taxonomies: 9 total (`category, model, derivative, bodywork, skodapedia-catagory, global-categories`, + nav/pattern/banner).
- Search results: server-rendered `search-result`/`teaser` (54 on one page) + `ys-ajax-loader` "load more" (`data-url=…/search/`).
- Listing filter markup: `filter-type-taxonomy`, `filter-label`, `filter-input-options` (×15), `pagination-status`.
- Škodapedia: `letterFormWidget`, `filter-button`, `sp__term-detail`, `sp__term-detail__close`, `sp__term-detail__data`.
- Redirects: `/en/series/` → press-release; `/en/podcast/` → `/en/podcast-en/…` post.
