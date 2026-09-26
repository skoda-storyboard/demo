# UI Specs, Component Specification Library

Per-component, measured, build-ready UI specifications for the Škoda Storyboard EDS migration. Each
`<component>.md` captures the live source component (DOM, measured CSS at real breakpoints,
interaction states, a11y) and maps it to the target EDS block, DA authoring model, and measurable
pixel-perfect acceptance criteria, so a component can be handed to an autonomous build agent.

- **Foundations:** [`_FOUNDATIONS.md`](_FOUNDATIONS.md) (tokens, verified breakpoints, repo conventions).
- **Capture method:** [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md) (parallel agents, the 10-section schema).
- **Templates (page types):** [`_TEMPLATES.md`](_TEMPLATES.md) (the architecture map) + the `template-*.md`
  specs, see the [Template index](#template-index) below.
- **Tooling:** [`tools/`](tools/README.md) - `measure.mjs` reproduces any spec value (computed styles +
  rect + inline attrs) across breakpoints in one command; `visual-diff.mjs` pixel-diffs the live source
  vs an EDS preview and enforces the `<= 2%` gate (exits non-zero for CI). Self-contained deps.
- **Screenshots:** `assets/<component>/` (`.hlxignore`'d, not served).
- Specs are per-component (blocks are reused across many tickets), not per-ticket. Tickets link here.

## Template index

Whole page types = shell + ordered sections composed from the components above. Map:
[`_TEMPLATES.md`](_TEMPLATES.md).

| Template | Spec | Ticket | Notes |
|---|---|---|---|
| Press release detail | [`template-press-release.md`](template-press-release.md) | SKODA-607 | MR, no hero, media-kit secondary column, dark related band; 47.5% of pages |
| Model page (`skoda_model`) | [`template-model-page.md`](template-model-page.md) | SKODA-208 | hero + icon section-nav + 5 tag rails |
| Category / Tag archive | [`template-category-archive.md`](template-category-archive.md) | SKODA-209 | STO, hero + card grid 3/2/1, no facets |
| Generic Page base shell | [`template-page-base.md`](template-page-base.md) | SKODA-813 | STO `page-template-default` + MR `template-media-room-page` |
| 404 | [`template-404.md`](template-404.md) | SKODA-706 | branded, keeps chrome, real HTTP 404 |
| Home (Storyboard + Media Room) | [`template-home.md`](template-home.md) | SKODA-604 / home | `.cover-box` section stack; promo-box lead |
| Custom microsite (event-gallery / campaign) | [`custom-microsite.md`](custom-microsite.md) | SKODA-210 | STO `template-custom-full-width`, full-bleed + big gallery; 201 pages, scope decision |
| Story detail | [`story-detail.md`](story-detail.md) | SKODA-604 / 801 | STO, hero + `.content`/`.sidebar` |
| Series (dir + hub) | [`series.md`](series.md) | SKODA-207 | STO `template-tiles` / `single-skoda_series` |
| Faceted listing (Search/Images/Videos/News) | [`faceted-listing.md`](faceted-listing.md) | SKODA-402 / 403 | MR `template-search-results`, one engine |
| Press kit (hub + sub-pages) | [`press-kit-template.md`](press-kit-template.md) | SKODA-805-808 | MR |
| Škodapedia | [`skodapedia.md`](skodapedia.md) | SKODA-206 / 802 | MR (A-Z nav + term modal) |
| Company / utility pages | [`company-pages.md`](company-pages.md) | SKODA-810 | MR, on the `template-page-base` shell |

Status legend: `DRAFT` (skeleton, awaiting capture) · `CAPTURED` (measured, in review) · `FINAL` (QA-passed, ticket wired).

## Component index

> **Live usage counts:** how many pages each of these blocks actually renders on (EN, both sides,
> split STO/MR) is measured in [`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md)
> (2026-09-15 full crawl). Use it to prioritise build order, e.g. `card_teaser` 3,175 pages,
> `two_column` 1,654 (100% MR), `hero` 1,399 (99.6% STO), `faceted_listing` 6.

| Component spec | EDS block(s) | Primary ticket(s) | Source reference | Status |
|---|---|---|---|---|
| `card-teaser.md` | cards-overlay / cards-media / cards-toolbar | 201 (reused 207/402/stories/story-rail/810) | `/en/` article-teaser | CAPTURED |
| `hero.md` | hero-image | 202 (reused 207) | `/en/<story>` hero | CAPTURED |
| `tags.md` | tags (new) | 205 | story/PR tag-list | CAPTURED |
| `carousel-rails.md` | carousel + story-rail | underpins 201/stories/story-rail; MR rails | `/en/` sliders | CAPTURED |
| `story-image-carousel.md` | gallery (slider variant) | 819 (supersedes 219) | Epiq + Octavia in-body widgets | CAPTURED (2 stories) |
| `stories.md` | stories (new) | 214 (reuses 402 loader/paginate) | `/en/` "Latest Stories" feed | CAPTURED |
| `header-megamenu.md` | header | 301 | `/en/` nav | CAPTURED |
| `mobile-nav.md` | header | 302 | `/en/` (<1080) | CAPTURED |
| `language-switcher.md` | header | 303 | `/en/` topbar | CAPTURED |
| `footer.md` | footer | 304 | `/en/` footer | CAPTURED |
| `footer-mediaroom.md` | footer (variant) | 305 | `/en/media-room/` footer | CAPTURED |
| `gallery-lightbox.md` | gallery (new) | 203 (reused 604) | story detail, `/en/media-room/` | CAPTURED |
| `faceted-listing.md` | listing (new) | 402 (reused 403) | `/en/news/`, `/en/images/`, `/en/videos/` | CAPTURED |
| `embeds.md` | embed handling | 204 | story detail | CAPTURED |
| `downloads.md` | downloads (new) | 502 | press release / story media box | CAPTURED |
| `media-cart.md` | media-cart (new) | 505 | `/en/media-room/` | CAPTURED |
| `skodapedia.md` | skodapedia (new) | 206 | `/en/skodapedia/` | CAPTURED |
| `series.md` | cards reuse + hero | 207 | `/en/series-2/`, `/en/series/<slug>/` | CAPTURED |
| `story-detail.md` | composition | 604 / 801 | `/en/<story>` | CAPTURED |
| `siteorigin-body.md` | default content (import flatten) | 814 (feeds 801/208/813) | `/en/<story>` SiteOrigin body | DRAFT+MEASURED |
| `newsletter.md` | newsletter-stub (footer built; sidebar variant pending) | 823 (prod 904) | `/en/` topbar + inline | CAPTURED |
| `social-share.md` | share (chrome) | COM-15 / STO-D10 | **SKODA-215** page float dock (was unticketed; sweep 2026-09-25; draft 827 folded in) · gallery share → 216 | CAPTURED |
| `promo-banner.md` | banner (E09/903) | COM-09 side / STO-D08 | flagged E09 | CAPTURED |
| `press-kit-template.md` | press-kit (new) | 805 | `/en/press-kits/skoda-peaq-press-kit/` | CAPTURED |
| `press-kit-media.md` | grouped media + ZIP (new) | 806 | press kit | CAPTURED |
| `faq-accordion.md` | faq (new) | 807 | press kit | CAPTURED |
| `press-kit-variant.md` | variant selector (new) | 808 | press kit | CAPTURED |
| `company-pages.md` | 5 sub-type blocks (new) | 810 | `/en/{board-of-management,annual-reports,company-logo,skoda-media-services-application,contacts}/` | CAPTURED |

## Client-requirement coverage matrix

Every functional ID from `docs/source/CMS-MediaRoomMigration-Requirements-*.pdf` mapped to a
component spec + ticket. Any ID with no UI build is marked with its reason.

### Common (COM)

| ID | Client component | Component spec | Ticket |
|---|---|---|---|
| COM-01 | Site Header | header-megamenu, mobile-nav | 301, 302 |
| COM-02 | Section Switcher (Stories↔Media Room) | header-megamenu | 301 |
| COM-03 | Primary Navigation | header-megamenu | 301 |
| COM-04 | Model/Secondary Navigation | header-megamenu | 301 |
| COM-05 | Language/Country Selector | language-switcher | 303 |
| COM-06 | Global Search | faceted-listing | 403 (UI shared w/ 402) |
| COM-07 | Listing/Filtering | faceted-listing | 402 |
| COM-08 | Content Card | card-teaser | 201 |
| COM-09 | Hero/Page Banner | hero (+ promo-banner) | 202 (banner E09) |
| COM-10 | Carousel/Slider | carousel-rails | carousel block (201/stories/story-rail) |
| COM-11 | Pagination/Load More | faceted-listing | 402 |
| COM-12 | Media Preview Actions | media-cart, gallery-lightbox | 505, 203 |
| COM-13 | Media Download | downloads | 502 |
| COM-14 | Media Cart | media-cart | 505 |
| COM-15 | Social Share | social-share | **215** (304 = footer follow links only) |
| COM-16 | Subscription | newsletter | newsletter-stub (prod E09/904) |
| COM-17 | Cookie/Consent | *(out of Adobe scope, D10)* | consent stub only |
| COM-18 | Footer | footer, footer-mediaroom | 304, 305 |
| COM-19 | App Download Badge | footer | 304 |

### Storyboard, Homepage (STO-H), Category (STO-C), Series (STO-S), Model (STO-M), Detail (STO-D)

| ID | Client component | Component spec | Ticket |
|---|---|---|---|
| STO-H01 | Promotional/Featured Carousel | carousel-rails / stories(promo) | 201 / stories |
| STO-H02 | Latest Stories | stories | 214 (402 reuse) |
| STO-H03 | Models Slider | carousel-rails (cards-media models) | carousel |
| STO-H04 | eMobility Slider | carousel-rails (story-rail) | story-rail |
| STO-H05 | Lifestyle Slider | carousel-rails (story-rail) | story-rail |
| STO-H06 | Škoda World Slider | carousel-rails (story-rail) | story-rail |
| STO-H07 | Series Slider | series / carousel-rails | 207 |
| STO-H08 | Latest News | carousel-rails (story-rail) / card-teaser | story-rail / 201 |
| STO-H09 | Social Media | social-share | 304 |
| STO-C01 | Category Hero | hero | 202 |
| STO-C02 | Story Results Grid | faceted-listing / stories | 402 |
| STO-C03 | Story Card | card-teaser | 201 |
| STO-C04 | Pagination Status | faceted-listing | 402 |
| STO-C05 | Load More | faceted-listing | 402 |
| STO-S01 | Series Hero | hero | 202 / 207 |
| STO-S02 | Series Grid | series | 207 |
| STO-S03 | Series Card | card-teaser | 201 / 207 |
| STO-M01 | Model Hero | hero | 202 |
| STO-M02 | Featured Model | card-teaser / hero | 201 / 202 |
| STO-M03 | Model-related Stories Grid | faceted-listing / story-rail | 402 |
| STO-M04 | Story Card | card-teaser | 201 |
| STO-M05 | Pagination/Load More | faceted-listing | 402 |
| STO-D01 | Story Hero | hero / story-detail | 202 / 604 |
| STO-D02 | Rich Text | story-detail | 801 / 604 |
| STO-D03 | Embedded Video | embeds | 204 |
| STO-D04 | Image Carousel/Gallery | gallery-lightbox | 203 |
| STO-D05 | Newsletter Widget | newsletter | newsletter-stub |
| STO-D06 | Related Stories | card-teaser / story-rail | 201 |
| STO-D07 | Article Sidebar | story-detail | 604 |
| STO-D08 | Side Banner | promo-banner | E09/903 |
| STO-D09 | Media Box/Gallery | media-cart / downloads | 505 / 502 |
| STO-D10 | Social Share | social-share | **215** (304 = footer follow links only) |

### Media Room, Home (MR-H), Listing (MR-L), Press Release (MR-PR), Press Kit (MR-PK), Model (MR-M), Images (MR-I), Videos (MR-V)

| ID | Client component | Component spec | Ticket |
|---|---|---|---|
| MR-H01 | Featured/Promotional | hero / card-teaser | 202 / 201 |
| MR-H02 | News | carousel-rails / faceted-listing | 402 |
| MR-H03 | Images | carousel-rails / faceted-listing | 402 |
| MR-H04 | Videos | carousel-rails / faceted-listing | 402 |
| MR-H05 | Models | carousel-rails (cards-media models) | carousel |
| MR-H06 | Press Kits | carousel-rails (story-rail-dark) / card-teaser | 201 |
| MR-H07 | Latest Stories | carousel-rails (story-rail) | story-rail |
| MR-H08 | Media Cart | media-cart | 505 |
| MR-H09 | Media Lightbox | gallery-lightbox | 203 |
| MR-H10 | Contacts/Company | company-pages | 810 |
| MR-L01 | Listing Search | faceted-listing | 402 |
| MR-L02 | Content-Type Filter | faceted-listing | 402 |
| MR-L03 | Faceted Filters | faceted-listing | 402 |
| MR-L04 | Result Grid/List | faceted-listing | 402 |
| MR-L05 | Result Card | card-teaser | 201 |
| MR-L06 | Pagination/Load More | faceted-listing | 402 |
| MR-PR01 | Press Release Header | hero / story-detail | 202 / 604 |
| MR-PR02 | Structured Article Content | story-detail | 801 |
| MR-PR03 | Audio Reading | embeds (widget) | 204 |
| MR-PR04 | PDF Download | downloads | 502 |
| MR-PR05 | Infographic | downloads | 502 |
| MR-PR06 | Video | embeds + downloads | 204 / 502 |
| MR-PR07 | Media Downloads | downloads / media-cart | 502 / 505 |
| MR-PK01 | Press Kit Header | press-kit-template | 805 |
| MR-PK02 | Structured Narrative | press-kit-template | 805 |
| MR-PK03 | Variant/Bodywork Selector | press-kit-variant | 808 |
| MR-PK04 | Grouped Content | press-kit-media | 806 |
| MR-PK05 | FAQ | faq-accordion | 807 |
| MR-PK06 | Individual Asset Download | press-kit-media / downloads | 806 / 502 |
| MR-PK07 | Complete Press Kit Download | press-kit-media | 806 |
| MR-M01 | Model Hero/Header | hero | 202 |
| MR-M02 | Model/Bodywork Selector | press-kit-variant | 808 |
| MR-M03 | Model-related News | faceted-listing / card-teaser | 402 / 201 |
| MR-M04 | Model-related Press Kits | card-teaser | 201 |
| MR-M05 | Model-related Stories | carousel-rails / card-teaser | 201 |
| MR-M06 | Model-related Images | card-teaser + downloads | 201 / 502 |
| MR-M07 | Model-related Videos | card-teaser + embeds | 201 / 204 |
| MR-I01 | Image Listing | faceted-listing | 402 |
| MR-I02 | Image Filters | faceted-listing | 402 |
| MR-I03 | Image Preview | gallery-lightbox | 203 |
| MR-I04 | Download Rendition | downloads / media-cart | 502 / 505 |
| MR-I05 | Add to Cart | media-cart | 505 |
| MR-V01 | Video Listing | faceted-listing | 402 |
| MR-V02 | Video Filters | faceted-listing | 402 |
| MR-V03 | Video Preview/Playback | embeds | 204 |
| MR-V04 | Video Download | downloads / media-cart | 502 / 505 |

### Non-UI / out-of-scope IDs (tracked, no component spec)

- **COM-17 Cookie/Consent**, consent handling is out of Adobe scope (decision D10); a dummy CMP
  stub exists (`scripts/consent-check.js`). No UI spec.
- **§6 Editorial/Authoring/DAM, §7 Content Migration, §8 NFR**, process/architecture requirements,
  not UI components. Covered by delivery-plan + architecture docs, not here.
- **Škodapedia**, ⚠️ *the client §9 "continuing outside Storyboard" flag is in tension with the
  live site:* the 2026-09-15 nav/footer sweep found Škodapedia **linked from both the Storyboard and
  Media Room navs and rendering internally** (`/en/skodapedia/`, `post-type-archive`, see
  `SKODA-POC-COVERAGE-MATRIX.md` #9 and `_TEMPLATES.md`). Open question for the client: is it staying
  in-platform or moving out? The glossary block (`skodapedia.md` / 206, 802) is specced either way but
  is low-priority for the pilot.

## Wave plan

Capture runs in non-colliding waves (per `AGENTS-TEAM.md`); see the approved plan. Wave 0 = these
foundation docs. Wave 1 = card-teaser, hero, tags. Wave 2 = header-megamenu, mobile-nav,
language-switcher, footer, footer-mediaroom. Wave 3 = carousel-rails, gallery-lightbox,
faceted-listing, embeds, downloads, media-cart. Wave 4 = skodapedia, series, story-detail,
newsletter, social-share, promo-banner. Wave 5 = press-kit-template, press-kit-media, faq-accordion,
press-kit-variant, company-pages.
