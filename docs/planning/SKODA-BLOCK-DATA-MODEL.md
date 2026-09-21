# Škoda Demo — Block Data Model: reuse-vs-new, variants & shared shells

Phase 1 deliverables #10 (shared shells) + #11 (reuse-vs-new decision + variant naming). Governs Phase 2
block build and Phase 3 parser targets. Companion to `SKODA-METADATA-SCHEMA.md` (the index contract),
`SKODA-RAIL-FEED-MAP.md` (what fills the rails), and the `docs/ui-specs/` measured specs (the visuals).

Principle (from AGENTS.md + the plan): **one engine per job.** Rails/listings are all the index-driven
`stories`/`story-rail` pattern rendering shared `cards`/`cards-overlay` markup. Do **not** fork the card
or carousel code — add config-row variants.

---

## 1. Three shared shells (design once, reuse everywhere)

### Shell A — two-column article (`.columns` 66.6 / 33.3, stack <768)
Used by: **story detail**, **press release detail**, **press-kit chapter**. Class names vary on source
(`.content`/`.sidebar` on story; `.column-primary`/`.column-secondary` on PR + press-kit). Build ONE
shell; vary the secondary-column content + the site side.

- Reuse the existing `columns` block for the 66.6/33.3 split.
- Primary column: hero (story only — PR/press-kit have **no** top hero), rich text, in-body
  `gallery-lightbox`, `embeds`, foot `press-kit-media` (Media Box).
- Secondary column: `tags`, `downloads`/media-kit, `newsletter`, `social-share`.
- PR adds a full-bleed **dark related band** below the columns (`cover-box dark`, `#0e3a2f`).

### Shell B — `template-tiles` (overlay hero + tile grid)
Used by: **series directory** and **press-kit hub**. Source: `page-template-template-tiles` = overlay
hero (`61.8vh`, title `48px/300`) + a grid of tiles.

- Reuse `hero` (overlay variant) + `cards-overlay` (tile grid). Series tiles = series cards; press-kit
  hub tiles = chapter cards.

### Shell C — faceted-listing engine (`listing` block)
Used by: **News**, **Images**, **Videos**, **Search** (one engine, different default query). Per
`faceted-listing.md` §7: index-driven like `stories`, renders `card-teaser`/`cards-overlay` cells, client-
side facet filtering over `query-index.json`, load-more = slice in batches of 6. Facets derived from index
rows; `columns` option (3 default, 4 for images).

---

## 2. Reuse-vs-new decision (per block)

### Reuse as-is (built, verified)
| Block | Used by |
|---|---|
| `header` + `fragment` (nav) | all pages (STO nav vs MR nav = two authored nav fragments) |
| `footer` | Storyboard-side pages |
| `hero` / `hero-image` | home, story, model, series, tiles shell |
| `cards-overlay` | featured promo, rails, tiles, listing cells |
| `cards-media` (+`social`) | social strip, media cards |
| `cards-toolbar` | media-cart affordance host |
| `carousel` | rail presentation (built via `buildBlock`) |
| `stories` | Latest Stories feed + load-more (already has category/template/offset/exclude) |
| `columns` | Shell A two-column article |

### Extend (config-row variant on an existing block — NO new file)
| Block | Change | Enables |
|---|---|---|
| `story-rail` | add optional `template` row (default `story`) + optional `tags` OR-match row | model-tag rails, Models/Series/News/PressKits rails — one block, many rails |
| `stories` | add optional `template` + `tags` rows | MR News feed, paginated listings by type |

### Net-new blocks to build (Tier-ordered)
**Tier 1 (irreducible core — build first):**
| Block | Spec | Serves |
|---|---|---|
| `series` (directory + hub) | `series.md` | #5, #6 — reuses Shell B + cards |
| `card-teaser` (grid + pagination) | `template-category-archive.md` | category/tag listings #3,#4,#8 |
| `tags` | `tags.md` | story/PR secondary column |
| `social-share` | `social-share.md` | story/PR |

**Tier 2 (after Tier-1 green):**
| Block | Spec | Serves |
|---|---|---|
| `listing` (faceted engine, Shell C) | `faceted-listing.md` | News/Images/Videos #10,11,12 |
| `gallery-lightbox` | `gallery-lightbox.md` | story/images/press-kit-chapter |
| `embeds` (YouTube/Vimeo/Buzzsprout) | `embeds.md` | story/videos/PR |
| `media-cart` | `media-cart.md` | MR home/images/videos/PR — **UI-side collect/persist + per-asset download** (2026-09-17 decision; no zip, no server-side reduction) |
| `press-kit-template` + `chapter-nav` + `press-kit-media` + `press-kit-variant` + `faq-accordion` + `downloads` | `press-kit-*.md`, `downloads.md`, `faq-accordion.md` | #13,14,15 |
| `company-pages` sub-types: exec-bio accordion / download-list / brand-asset grid / app-promo / contact-directory | `company-pages.md` | #17–21 |
| `newsletter` (archive + GDPR signup; upgrade from `newsletter-stub`) | `newsletter.md` | #22 |
| `footer-mediaroom` | `footer-mediaroom.md` | all MR pages |
| `language-switcher` (existence-aware) | `language-switcher.md` | all |

**Removed:** `skodapedia` (out of scope). **Known gap:** HTML spec-table — no source; out of scope unless confirmed net-new-no-reference.

## 3. Variant naming (consistent; avoid duplicate engines)

- Rails are **not** new blocks — they are `story-rail` instances differing only by config rows
  (`template`/`category`/`tags`). Name them in DA by their section heading only.
- `listing` is the single faceted engine; the News/Images/Videos pages differ only by the `template`,
  `facets`, and `columns` config rows — not three blocks.
- `series` directory vs hub = one block, `variant` row (`directory`|`hub`).
- Dark sections use the existing section metadata (`Style = cover-box dark`), not a new block
  (as `en-landing` already does with `section-social-dark`/`section-series-dark`).

## 4. Consequence for parsers (Phase 3)

Because rails/listings reuse `story-rail`/`stories`/`listing`, the importer only needs parsers for the
**net-new structural blocks** (series, card-teaser, listing, gallery-lightbox, embeds, media-cart,
press-kit set, company sub-types, newsletter) — plus transformers that emit the correct `template`/
`category`/`tags`/`model`/`publisheddate` metadata per content family so the index-driven rails populate.
