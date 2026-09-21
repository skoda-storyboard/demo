# Škoda — Block Universe Recount (EN, both sides)

**Date:** 2026-09-15
**Supersedes:** the block-count tables in `SKODA-EN-BLOCK-INVENTORY.md` (2026-09-04), which were
Storyboard-focused, predate the measured `docs/ui-specs/` block universe, and used a signature set
that has since been corrected. The 2026-09-04 doc is **retained** for its per-block responsive/JS
detail (§8) and narrative; this doc is canonical for **counts**.
**Method:** fresh full crawl of the complete EN URL set on **both sites** (Storyboard + Media Room),
one HTTP fetch per page, classifying side + WordPress template from `<body class>` and detecting the
`docs/ui-specs/` block universe via DOM-class signatures. **Signatures were validated live by three
parallel Explore agents** (STO editorial / MR listings+PR / press-kit+company+special) so the counts
reflect *authored content*, not site-wide furniture.
**Raw data:** `SKODA-BLOCK-RECOUNT-DATASET.csv` (per-URL, 3,499 rows) · `SKODA-BLOCK-RECOUNT-AGGREGATE.json`
(counts) · crawler + aggregator under `.migration/block-recount/`.

---

## 1. Coverage

| Metric | Value |
|---|---|
| EN URLs enumerated (REST `post`/`page`/`press_release`/`skodapedia` + non-REST template pages) | **3,499** |
| Scanned OK (HTTP 200) | **3,494** |
| Fetch errors | 5 |
| Storyboard-side pages | **1,634** |
| Media-Room-side pages | **1,860** |

Side is read from `body.media-room` (present on all MR pages). This is the **first inventory to split
STO vs MR** — the 2026-09-04 crawl counted the same URL universe but did not classify side, so it read
as "Storyboard-only". Press releases (47% of the site) are MR-side.

> **Enumeration note:** REST lists only the 4 public types (`post`, `page`, `press_release`,
> `skodapedia`). The non-public template types (`skoda_model`, `skoda_series` hub, `press_kit`) and the
> listing engines are reachable only as pages/URLs, so a curated **non-REST supplement** (31 nav/footer
> + POC URLs) was added to cover model page, series dir/hub, press-kit hub + sub-pages, the
> faceted listings (news/images/videos/search), company pages, and special pages (media-cart,
> newsletter, 404). Their *page counts* are small because each is a handful of URLs; their *block
> signatures* are what matter.

## 2. Template distribution (scanned pages)

| Template | Side | Pages | Share |
|---|---|---:|---:|
| Press release detail | MR | 1,651 | 47.3% |
| Story (editorial post) | STO | 1,318 | 37.7% |
| `custom_microsite` (event-gallery / campaign) 🆕 | STO | 201 | 5.8% |
| Škodapedia archive/term | MR | 190 | 5.4% |
| Generic Page | STO | 42 | 1.2% |
| `featured-image` mini-pages + long-tail 🆕 | mixed | 38 | 1.1% |
| `tiles_dir` (series dir / press-kit hub shell) | STO | 35 | 1.0% |
| Faceted listing (news/images/videos/search) | MR | 6 | 0.2% |
| Press kit (hub + sub-pages) | MR | 4 | — |
| Company / utility page | MR | 3 | — |
| 404 · carousel-listing · home · model · series hub | mixed | 5 | — |

🆕 = template class **not named** in the 2026-09-04 inventory or the ui-specs `_TEMPLATES.md`:
- **`custom_microsite`** (`template-custom-full-width`) — 201 event-gallery / campaign microsite pages
  (e.g. `…-event-gallery`, `womens-day/*`). A large, previously-uncounted STO page family.
- **`featured-image`** — ~30 Advent/"road-to-christmas" micro-posts on a minimal featured-image shell.
- **`carousel-listing`** (`template-carousel-listing`) — the newsletter page: Flickity carousels of
  press-release teasers grouped by plant.

## 3. Block appearance counts (how many pages each block renders on)

Sorted most-used → least-used. **Side split included** — the biggest new signal. "ui-specs" = the
component spec; "ticket" = build ticket. Chrome (site-wide furniture) is **excluded by design** (see §5).

| # | Block | Total pages | STO | MR | ui-specs spec | Ticket |
|--:|---|---:|---:|---:|---|---|
| 1 | **card_teaser** | 3,175 | 1,509 | 1,666 | `card-teaser.md` | SKODA-201 |
| 2 | **promo_banner** (story/PR `side-banner`) | 2,972 | 1,318 | 1,654 | `promo-banner.md` | E09/903 |
| 3 | **cover_box** (section band; `.dark` = 2,946) | 2,952 | 1,295 | 1,657 | `_TEMPLATES.md` (`--section-dark-bg`) | 202/home |
| 4 | **tags** | 2,905 | 1,282 | 1,623 | `tags.md` | SKODA-205 |
| 5 | **downloads** (media-box / annual-reports list) | 2,810 | 1,199 | 1,611 | `downloads.md` | SKODA-502 |
| 6 | **carousel_rails** (related/`type-*` content rails) | 1,995 | 1,006 | 989 | `carousel-rails.md` | 201/story-rail |
| 7 | **gallery_lightbox** | 1,784 | 268 | 1,516 | `gallery-lightbox.md` | SKODA-203 |
| 8 | **two_column** (`.column-primary/secondary`) | 1,654 | 0 | 1,654 | `template-press-release.md` | SKODA-607 |
| 9 | **siteorigin_body** (SiteOrigin rich-text region) | 1,614 | 1,568 | 46 | `story-detail.md` / flatten | SKODA-801 |
| 10 | **hero** (real editorial hero) | 1,405 | 1,399 | 6 | `hero.md` | SKODA-202 |
| 11 | **skodapedia** (A–Z nav + term modal) | 190 | 0 | 190 | `skodapedia.md` | SKODA-206/802 |
| 12 | **row_toggle** (collapsible: exec-bio / sections / FAQ) | 33 | 17 | 16 | `faq-accordion.md` (primitive) | SKODA-807/810 |
| 13 | **faceted_listing** (facet engine) | 6 | 0 | 6 | `faceted-listing.md` | SKODA-402/403 |
| 14 | **press_kit_media** (chapter sub-nav) | 4 | 0 | 4 | `press-kit-media.md` | SKODA-806 |
| 15 | **media_cart_page** (cart application body) | 2 | 0 | 2 | `media-cart.md` | SKODA-505/902 |
| 16 | **model_nav** (in-page icon anchor nav) | 1 | 0 | 1 | `template-model-page.md` | SKODA-208 |

### What the side split tells us
- **`two_column` is 100% MR** (1,654 ≈ press-releases + press-kit sub-pages) — confirms the corrected
  finding that the PR two-column shell is its own thing, MR-side (**SKODA-607**).
- **`hero` is 99.6% STO** (1,399 STO vs 6 MR) — confirms **press releases have no hero** (text title
  only); the MR heroes are the model page + a couple of company pages.
- **`gallery_lightbox` is 85% MR** (1,516 of 1,784) — press releases + event-gallery microsites are the
  gallery-heavy surfaces, not stories.
- **`siteorigin_body` is 97% STO** — the SiteOrigin Page-Builder flattening burden (**SKODA-801**) is a
  Storyboard-story problem; MR templates are largely structured already.

## 4. Embeds (iframe players, content-scoped)

| Provider | Pages |
|---|---:|
| Vimeo | 250 |
| YouTube | 200 |
| Buzzsprout (podcast) | 197 |
| Spotify | 35 |

Matched only against `<iframe src|data-src>` inside content — the site-wide buzzsprout **footer link**
and YouTube chrome scripts are excluded (an early pass over-counted them).

## 5. Chrome — counted for presence, NOT as content blocks

Confirmed by the Explore agents as present site-wide on (nearly) every page; building these once as
fragments, not per-page:
`media-cart` sticky button · `newsletter`/mailguide footer · `app-download` badges · `social` share bar
(`btn-group social`) · `skoda-carousel-widget` furniture · Colorbox/Lightbox JS · `ys-parallax` asset
refs · `sa-bnr` ad slot · buzzsprout footer link · header / mega-menu / language switcher / footer.

> **Correction vs the first crawl pass:** an initial signature set false-positived several of these as
> content (a `carousel_rails` on 3,485 pages, `parallax` on 1,645, `social_share` everywhere, bare
> `hero-image` on `/copyright/`). The Explore validation replaced them with content-only signatures —
> e.g. `carousel_rails` now keys on `related-stories` / `search-results type-*` bands (real rails) and
> dropped to 1,995. Counts here are the corrected set.

## 6. New / uncatalogued blocks surfaced (not in the ui-specs universe)

The crawl + agents found rendered content structures with **no current component spec**:

| New block | Where | Note |
|---|---|---|
| **`siteorigin_body`** (SiteOrigin `sow-editor` / `skoda-offset` rich-text) | stories, model "Model Description", generic pages | 1,614 pages — the generic authored body region behind story flatten (SKODA-801) |
| **`custom_microsite` shell** (`template-custom-full-width`) | 201 event-gallery / campaign pages | a whole STO page family (5.8%) with a big gallery; no spec/ticket yet |
| **`model_nav`** (in-page icon anchor nav) | model page | part of `template-model-page.md` / SKODA-208 but not its own component |
| **`media_cart_page`** (`mr-media-cart` cart application body) | `/media-cart/`, `/your-downloads/` | distinct from the global sticky cart button (chrome); the cart *page* itself |
| **`carousel_listing`** (Flickity grouped teaser carousels) | newsletter page | grouped-by-plant press-release carousels |
| **gallery bulk-size selector** (`media-cart-action wide` "Original/1920px") | event-gallery microsites | closest thing to a "variant selector" found anywhere |
| **`row_toggle`** (`ys-row-toggle`) | board exec-bios, PK content sections, FAQ | one shared collapsible primitive doing three jobs |

**Specced-but-zero-appearances:** `faq_accordion` — the press-kit FAQ is a *separate* chapter sub-page
(`/frequently-asked-questions/`) not in the crawled sample; and no other FAQ instance renders on the
sampled pages. It is backed by the generic `row_toggle` primitive. **`press_kit_variant`** was dropped
from the content set entirely: the Explore agents confirmed **no rendered variant/bodywork selector
control exists** (the `bodywork-*` classes are taxonomy metadata on teasers, not a UI control).

## 7. Reconciliation vs measured anchors

| Type | REST/measured | This crawl (template) | ✓ |
|---|---:|---:|:--:|
| press_release | 1,653 | 1,651 | ✓ |
| story (post) | 1,315 | 1,318 | ✓ |
| skodapedia | 189 | 190 | ✓ |
| page | 333 | 42 + 201 microsite + 38 long-tail + 35 tiles ≈ 316 mapped | ✓ (pages fan out into 6 real templates) |

Drift is <0.3% on the big types; the `page` REST bucket correctly resolves into six distinct WordPress
templates once classified by body class.

## 8. Open questions

- **`custom_microsite` (201 pages)** and **`featured-image` (30 pages)** are real, sizeable STO page
  families with **no ui-specs spec or ticket** — decide whether they migrate, get folded into an
  existing template, or are dropped (many are dated campaign/event microsites).
- **`press_kit_variant`** — confirm with the client whether a bodywork/variant *selector* is a target
  requirement (it is specced as SKODA-808 but **does not render on the live Epiq press kit**).
- Counts are **pages-containing-block** (a story with 5 rails counts once for `carousel_rails`), matching
  the 2026-09-04 convention. Instance-level counts were not captured (heavier; deferred).
