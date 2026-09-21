# Template Spec: Model page

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/500 on the live Peaq model page;
structure cross-read against the DOM).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Template:** Model page (one page per vehicle model).
- **WP body class / CPT:** `skoda_model-template-default`, `single-skoda_model`, `siteorigin-panels`,
  `body.media-room`. Public CPT `skoda_model`.
- **Side:** Media Room (switcher = Media Room; MR header nav + MR footer). Serves both the STO-M and MR-M
  client requirement IDs, it is one CPT template.
- **Source URL:** `https://www.skoda-storyboard.com/en/skoda-model/peaq/`
- **Ticket:** SKODA-208 (new).

## 2. Page anatomy

```
header.header (MR variant)                        108px
article.skoda_model  (y=108)
├── hero (full-bleed model image / carousel, ~510px)
│   └── .item-content > .carousel-caption
│       ├── chip "MODELS"                          (grey category pill)
│       └── h1  model name "Peaq"                  (36px/700 white overlay)
├── ul.nav  (icon section-nav, flex, centered, ~99px, NOT sticky, desktop-only)
│   └── 8 anchors: Model Description #intro · Key Facts #keyfacts · Technical Data #techdata ·
│                  News #news · Press Kits #press-kits · Stories #stories · Images #images · Videos #videos
├── #intro     Model Description   (h2 + rich text)
├── #keyfacts  Key Facts           (section)
├── #techdata  Technical Data      (spec table)
├── #news       section.search-results-container  "News Based on tags: <model>"       (rail)
├── #press-kits section.search-results-container  "Press Kits Based on tags: <model>" (rail)
├── #stories    section.search-results-container  "Stories Based on tags: <model>"    (rail)
├── #images     section.search-results-container  "Images Based on tags: <model>"     (rail)
└── #videos     section.search-results-container  "Videos Based on tags: <model>"     (rail)
footer.footer (MR variant)
```

## 3. Composed components

[`header-megamenu`](header-megamenu.md) (MR) → [`hero`](hero.md) (overlay/model variant, model image
carousel + chip + name) → an **icon section-nav** (template-specific, see §4) → rich text (Model
Description) + Key Facts + a Technical Data spec table → **5x [`carousel-rails`](carousel-rails.md)** /
[`story-rail`](story-rail equivalent) tag-filtered strips reusing [`card-teaser`](card-teaser.md) /
[`gallery-lightbox`](gallery-lightbox.md) / [`media-cart`](media-cart.md) (Images/Videos) →
[`footer-mediaroom`](footer-mediaroom.md). [`social-share`](social-share.md) floats.

## 4. Template-specific structure

- **Icon section-nav** (`ul.nav`): a centered flex row of 8 icon+label anchors linking to in-page
  sections (`#intro`, `#keyfacts`, `#techdata`, `#news`, `#press-kits`, `#stories`, `#images`, `#videos`).
  Not sticky. **Hidden on mobile** (`height:0` at 500). Same idea as the press-kit chapter nav.
- **Key Facts** + **Technical Data** blocks: model spec content (spec table) not covered by any component
  spec, author as a structured spec/table block.
- **5 tag-filtered related rails**: each a `search-results-container` (the faceted/rail engine) querying
  the model's tag, titled "<Type> Based on tags: <model>". Retrieval = the model tag (confirm exact rule).

## 5. Measured template-level visual base

Values `getComputedStyle` on the Peaq page, cited `(selector · viewport)`.

**Layout**
- Article at `y=108` under the fixed header; hero is **full-bleed** (~510px tall, image carousel).
- Icon nav at `y~620`, `display:flex; justify-content:center`, `~99px` tall, `position:static` (· `ul.nav`
  · 1280).
- Content + rails cap at `1248px` (`--content-max-width`); rails render as `search-results-container`
  (see `carousel-rails.md` for cell math).

**Spacing / vertical rhythm**
- Rail sections repeat on a **`356px` rhythm** (heading + one card row) (· `.search-results-container`
  tops 1164/1520/1876/2232/2675 · 1280).
- Model-name overlay `h1` `margin-bottom 9px` above the description (· `.carousel-caption h1` · 1280).

**Typography** (→ token)
- Model name (hero overlay): `36px / 45 / 700`, white (· `.carousel-caption h1` · 1280); **scales to
  `24px` at 500**.
- Rail section headings: `26px / 32.5 / 600`, color `#161718` → `--body...`/candidate `--rail-heading:26px`
  (· `.search-results-container h2` · 1280); stays `26px` at 500.
- Model description body: `16px / 24 / 500` (· `.item-content p` · 1280).

**Responsiveness**
- **Icon section-nav is desktop-only** (`height:0`, hidden at 500). Provide an accessible mobile
  equivalent (in-page skip links or a collapsed menu) in the EDS build.
- Hero title `36px → 24px` at mobile; hero stays full-bleed.
- Rails switch to the mobile 1-up/peek carousel form per `carousel-rails.md` (verify each rail's
  `data-flickity` config; do not assume).

## 6. Interaction / behavior

- Icon nav anchors scroll to in-page sections (`#intro` ... `#videos`); smooth-scroll + focus target in
  the EDS build.
- Each of the 5 rails is an independent carousel; check the inline `data-flickity` per rail for arrows/
  dots/autoplay (the promo-box lesson, see `carousel-rails.md`).

## 7. Accessibility

- Single `h1` = model name; section headings `h2` in DOM order matching the anchor nav.
- Icon nav = a `<nav aria-label="On this page">` list of same-page links; ensure a keyboard/mobile
  equivalent when the visual nav is hidden.
- Hero overlay text contrast over the image ≥ 4.5:1 (add scrim if needed).

## 8. EDS target

- DA `Metadata`: `template=model-page`, `model`, `bodywork`, `category`; `media-room` side.
- Section model: hero section (image + overlay) → in-page-nav (generated from section anchors) → intro /
  key-facts / tech-data sections → 5 query-index-driven rail sections (one per content type, filtered by
  the model tag).
- Reuse: `hero` overlay variant, `carousel`/`story-rail` for the 5 rails (query-index by model tag,
  consistent with `faceted-listing.md` retrieval), spec-table block for Technical Data. The icon nav is
  a small new block generated from the page's section IDs.

## 9. Open decisions + recommended default

- **Rail retrieval rule** (🟡): "Based on tags: <model>" = the model tag; confirm the exact tag/taxonomy
  and per-rail ordering (newest-first assumed) against ≥2 models.
- **Icon-nav on mobile** (🟡): source hides it; **default = render as in-page skip links** on mobile
  rather than dropping wayfinding entirely (a11y improvement, assumption to confirm).
- **Key Facts / Technical Data source**: structured model data, confirm the data source for import.

## 10. Pixel-perfect acceptance criteria

- [ ] Shell: MR header + MR footer; single `h1` = model name.
- [ ] Hero full-bleed (~510px) with "MODELS" chip + model name `36px/700` white; title `→24px` at 500.
- [ ] Icon section-nav: centered flex row of 8 in-page anchors (Model Description...Videos), not sticky,
      desktop-only, with an accessible mobile equivalent.
- [ ] Sections in order: intro / key-facts / tech-data, then 5 tag rails (News, Press Kits, Stories,
      Images, Videos), each headed `26px/32.5/600 #161718`, on a `~356px` rhythm.
- [ ] Rails query the model tag; each rail respects its own carousel config (arrows/dots/autoplay).
- [ ] Content cap `1248`; a11y (nav landmark, heading order, hero contrast).
- [ ] Visual diff vs source at 1280/1024/768/500 ≤ 2% per-pixel (hero + nav + one rail).

## 11. Reference screenshots

- `assets/template-model-page/desktop-1280.png`, `assets/template-model-page/mobile-500.png`.
