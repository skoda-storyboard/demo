# Template architecture map

How every Škoda source page type is structured, and which building blocks (component specs) each one
composes. This is the page-type companion to the component specs in this folder. Read it before building
any full page/template; read the individual `template-*.md` for the measured visual base.

- Component specs (this folder): the reusable blocks (card, hero, footer, carousel, ...).
- Template specs (`template-*.md` + the existing template-level specs): whole page types = shell +
  ordered sections composed from components + template-specific structure.
- Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md) (tokens, breakpoints 768/992/1080).
- Capture method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

Source census verified live via Chrome DevTools on 2026-09-15 (body-class = the WordPress template).
Volumes from `docs/analysis/SKODA-MASTER.md` §3. URL buckets from `.migration/plans/url-analysis-comparison.md`.

> **Sweep correction (2026-09-25).** The DevTools URL→block sweep ([registry](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md), [report](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §7) disproved the points below on the live M1 pages. They override the sections they name until this spec is re-captured:
>
> - **Press-kit hub ≠ chapter page.** The three M1 hubs (Peaq/Epiq `-2`, Motorsport) have no chapter-nav, variant selector or accordion. Those live on the chapter child pages, which are outside M1. The hub is hero + tile grid (+ the WhatsApp/ZIP row on Peaq/Epiq).
> - **Legal/copyright is inside the footer DOM** (`.copyright-text`, `.copyright-notice`, `.feed-links` under `footer`) on both STO and MR, not a separate strip outside it.
> - **Series hub = curated editorial mosaic**: 8 / 14 / 10 / 5 / 12 tiles, 2/3-cell rows with 1:1 and ~2:1 tiles, editorial order (not newest-first) and mixed types (130-years includes a Press Kits tile). It is not a uniform grid.
> - **MR side covers 16 M1 URLs** (press releases, model pages, press kits, Images, Videos). They need the MR nav + footer resolved per path (SKODA-309; the sweep draft 825 was folded in). Every source template also carries a floating share + scroll-top dock (SKODA-215; the sweep draft 827 is a duplicate).

## The shared shell

Every page renders one header + one footer, selected by site side (the `error404`
page **keeps** the STO chrome — verified live 2026-09-24, header with 64 menu items +
footer present; an earlier note here saying it drops the chrome was wrong):

- **Header:** one block, `header-megamenu.md` (desktop) + `mobile-nav.md` (<1080) + `language-switcher.md`.
  The **section switcher** (Stories | Media Room) sets the side and reflows per breakpoint (see
  `header-megamenu.md` §3). `body.media-room` marks MR-side pages.
  - **The nav content differs per side (verified live 2026-09-15):** Storyboard nav = Models / eMobility /
    Lifestyle / Škoda World / Series / Škodapedia / Podcast. Media Room nav = News / Press Kits / Models /
    Images / Videos / Company / Škodapedia. Same header block, two authored `nav` fragments.
  - **Locale set varies per content, NOT a fixed per-side count (corrected 2026-09-15):** the language
    switcher shows only the locales a given page/item is translated into. Observed: Storyboard home 6
    (EN CZ DE SK SR SL), Images listing 6, Škodapedia 4 (EN CZ DE SK), press release / model page 2-3.
    So do not hardcode a language count per side, drive it from available translations.
- **Footer:** `footer.md` (Storyboard side) vs `footer-mediaroom.md` (Media Room side), materially
  different (SKODA-304/305). The legal/copyright bar is a separate strip, not inside the footer DOM.
- **Global affordances:** media-cart button + `social-share`/scroll-top float, cookie banner.
- **Content cap:** `--content-max-width: 1248px` (source content caps ~1248).
- **Shared "two-column article" shell:** the story, the press release, and each **press-kit chapter
  sub-page** all render `.columns` = `66.66% primary / 33.33% secondary`, stacking to one column `<768`
  (class names vary: `.content`/`.sidebar` on the story, `.column-primary`/`.column-secondary` on PR +
  press-kit). Build one shared shell; vary content + side.
- **Shared `template-tiles` shell:** the **series directory** and the **press-kit hub** both use
  `page-template-template-tiles` = overlay hero (`61.8vh`, title `48px/300`) + a grid of tiles.

## Template census (public CPTs: `post`, `page`, `press_release`, `skodapedia`, `skoda_model`, `skoda_series`)

| WP template (body class) | Page type | Side | Composes | Spec | Ticket |
|---|---|---|---|---|---|
| `template-homepage` | Storyboard home | STO | `stories` (Latest Stories Load-more feed), `carousel-rails` (promo-box featured + category rails), `card-teaser`, `hero`, `newsletter`, `social-share` | `template-home.md` + `stories.md` | SKODA-604/(home), SKODA-214 (feed) |
| `template-media-room` | Media Room home | MR | `carousel-rails` (promo-box + `cover-box`/`cover-box dark` rails incl. News press-release rail), `card-teaser` | `template-home.md` | (MR home) |
| `post-template-template-layout-article` + `siteorigin-panels` (`single-post`) | Story detail | STO | `hero`, rich text, `embeds`, `gallery-lightbox`, sidebar widgets, `social-share`, `tags`, `newsletter`, `carousel-rails` (related) | `story-detail.md` | SKODA-604, 801 |
| `press_release-template-default` (`single-press_release`) | Press release detail | MR | text title (no hero), lead teaser + bullet-points + rich text, secondary column (`downloads`/media-kit + `tags` + `newsletter` + ad), full-bleed dark related band | `template-press-release.md` | **SKODA-607** |
| `skoda_model-template-default` (`single-skoda_model`) + siteorigin | Model page | MR | `hero`, "Model Description" rich text, **5 related rails** (`carousel-rails`/`story-rail`), `card-teaser` | `template-model-page.md` | **SKODA-208** |
| `archive category` / tag archives | Category / tag listing | STO | `hero`, `card-teaser` grid (`search-results-items`), pagination, **no facets** | `template-category-archive.md` | **SKODA-209** |
| `template-search-results` | Search + Images + Videos + News (one engine) | MR | `faceted-listing` (facets + grid + load-more), `card-teaser`, `gallery-lightbox`, `media-cart` | `faceted-listing.md` | SKODA-402, 403 |
| `template-media-room-page` + siteorigin | Company/utility pages (contacts, board, annual-reports, ...) | MR | `hero`, base page shell + the 5 company sub-type blocks | `company-pages.md` (+ `template-page-base.md` shell) | SKODA-810 |
| `page-template-default` + siteorigin | Generic Page (copyright, legal, misc) | STO | `hero`, rich text (SiteOrigin) | `template-page-base.md` | **SKODA-813** |
| `page-template-template-custom-full-width` + siteorigin | Custom microsite (event-gallery / campaign) | STO | `siteorigin-body`, `gallery-lightbox` (big colorbox grid), `card-teaser` | `custom-microsite.md` | **SKODA-210** |
| `template-tiles` | Series directory | STO | `hero`, `card-teaser` (series cards) grid | `series.md` | SKODA-207 |
| `single-skoda_series` | Series hub | STO | `hero` (overlay), `card-teaser` (story) grid | `series.md` | SKODA-207 |
| Škodapedia directory + term | Škodapedia (`post-type-archive`) | MR | `skodapedia` (A-Z nav `.sp__list-nav` 26 letters + term modal `.sp__term-detail`) | `skodapedia.md` | SKODA-206, 802 |
| `press_kit-template-default` + sub-pages | Press kit (hub + chapter + gallery) | MR | `hero`, chapter-nav, `press-kit-media`, `press-kit-variant`, `faq-accordion`, `downloads` | `press-kit-template.md` | SKODA-805–808 |
| `error404` | Branded 404 | global | minimal shell + "dead end" copy + homepage link | `template-404.md` | **SKODA-706** |

Bold tickets are new gap tickets created by this initiative. **`press_kit` nuance (verified live):** the
rendered pages ARE a `press_kit` post type (`single-press_kit`, hub `press_kit-template-template-tiles`,
sub-pages `press_kit-template-default`); the "not a CPT / filtered view of `press_release`" claim is
**REST-API-only** (`wp/v2/press_kit` 404). `podcast` and `speeches` are not real templates (301 / feature
plugin).

## Notes that bite (from the live walk)

- **Press release ≠ story** (measured, corrected). Both use a two-column shell, but the PR has **no top
  hero** (text title only), uses `.column-primary`/`.column-secondary` (not the story's `.content`/
  `.sidebar`), puts **media-kit downloads + tags + newsletter** in the secondary column, adds a **full-bleed
  dark related-media band**, and sits on the **MR side**. It is 47.5% of all pages. Do not build it from the
  story shell; share the two-column CSS, swap content + side. See `template-press-release.md` §2.
- **Model page** is a real `skoda_model` CPT with a "Model Description" section + **5 related-content
  rails** (news/press filtered by the model tag), not a listing and not a story.
- **Category/tag archive** is a simple hero + card grid with **no facets** (unlike the MR
  `template-search-results` engine, which has the full facet panel).
- **Images / Videos / Search / News all share `template-search-results`** = one faceted engine with
  different default queries; `faceted-listing.md` covers all of them.
- **Company pages and generic pages** are both SiteOrigin `page` documents but on different shells
  (`template-media-room-page` MR vs `page-template-default` STO). `template-page-base.md` documents the
  shared shell; `company-pages.md` documents the 5 named sub-types.
- **404 keeps the STO chrome** (header + footer) and is the only template with no CPT; it must serve a
  real HTTP 404.
- **Model page has a hero after all** (full-bleed model image carousel + name overlay), plus an 8-item
  icon section-nav (in-page anchors, desktop-only), before the 5 rails.
- **Dark section bands** (`.cover-box.dark`) use a dark-green background `#0e3a2f` (homes + PR/model
  related bands); candidate token `--section-dark-bg`.

## Status

- Wave T0 (this map): done.
- Wave T1 (press-release, model-page, category-archive): **done** (measured, spec + screenshots).
- Wave T2 (page-base, 404, home): **done** (measured, spec + screenshots).
- **Import coverage (2026-09-24):** every public page type now has a `tools/importer/`
  importer (per-template parser/transformer set + `page-templates.json` entry), all
  passing the metadata gate. SiteOrigin-heavy types (story, company, generic page) are
  imported via **flatten-to-default** (linear content only); full widget reconstruction
  stays with SKODA-801/814/604. **Custom microsite** (flatten → near-empty) is deferred
  to SKODA-210, **press-kit** to SKODA-805–808, **newsletter** is service-only (SKODA-904).
  See [`../architecture/IMPORT-PIPELINE.md`](../architecture/IMPORT-PIPELINE.md).
- Remaining: gap tickets (607/208/209/813/706) + wiring pointers into existing tickets + README/OVERVIEW.
- **Added post block-recount (2026-09-15):** `custom_microsite` (`template-custom-full-width`, 201 STO
  pages, `custom-microsite.md` / SKODA-210) and the `siteorigin-body` region (1,614 pages,
  `siteorigin-body.md` / SKODA-814, feeds the 801 flatten), both surfaced by
  [`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md) as previously-unspecced.
