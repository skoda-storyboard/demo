# Template Spec: Model page

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/500 on the live Peaq model page;
structure cross-read against the DOM).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

> **Sweep correction (2026-09-25).** The DevTools URL→block sweep ([registry](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md), [report](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §7) disproved the points below on the live M1 pages. They override the sections they name until this spec is re-captured:
>
> - Not always 8 anchors / 5 rails. Superb and Octavia have 9 anchors / 6 rails (with Bodywork/Derivatives). Fabia has 8 links but only 3 rails. Peaq/Epiq have 5 rails and no Key Facts or Technical Data.
> - **Desktop `.model-nav` is sticky**: `.affix-top` (relative) becomes `.affix` (`position:fixed; top:0`) after scroll. It is hidden on mobile. The source nav has dangling anchors (Peaq/Epiq `#intro/#keyfacts/#techdata`, Fabia `#news/#stories`).
> - Rail heading is `h3.search-results-heading` 26/32.5/600, not h2. The Bodywork rail centres its cells (`cellAlign:center`, `contain:false`).
> - **Key Facts** (5–6 illustrated rows) and **Technical Data** (dark band, six spec rows + PDF) are unspecced. They are folded into the SKODA-208 ACs.

> **Build re-capture (2026-09-28, SKODA-208 UI half).** Measured on Octavia / Superb / Fabia / Peaq / Epiq at
> 1920–320; these values are what the build reproduces and override §2–§5 where they differ:
> - **Hero:** image 9:5 (<768) with the chip overlapping its bottom edge and a 24/700 ink title below; 3:1 at
>   768–1079 (24/700 ink title top-left, chip clipped); 5:2 at 1080–1439 (512 at 1280; chip + 36/700 white title at
>   a 5% inset, 50% wide); 3:1 from 1440.
> - **Nav:** 99px white bar, links 14/600 grey-500 with a 28px icon, hover/current = ink text, `#419468` icon and a
>   3px bar; sticky from 768, hidden below.
> - **Text panels:** 50px top padding, `h2` 40/300 (Tech Data 40/700 centred white), an 8/12 centred column from
>   992. Short pages (Peaq, Epiq) have an extra 74px spacer (50px < 768) before the description.
> - **Highlights:** rows 25% circle image / 75% text, image right on odd rows; stacked title → image → text on mobile.
> - **Drawings:** h3 24/300 + full-column image, each a 50px panel. **Tech Data:** 1248 dark band, padding 80,
>   figures 90/45/30% (value 32, unit 24, label 16/300), 50px apart; mint 194×48 PDF pill; Fabia banner at the top.
> - **Rails:** margin 24/48 + 24px header pad; h3 26/600 + "Based on tags" 16/600 `#c4c6c7`; "All" ghost pill
>   90×36; cells 90/45/30% (overlay, derivatives) or 90/30/22.5% (images, videos) of content + gutter. Derivatives
>   centred with a 45px title strip; media cards: date row 44, two-line 15/18 title, (toolbar 50 — cart, not built).
> - **EDS target (built):** template `skoda-model` + `hero-image (overlay)`, `cards (key-facts)`, `columns (stats)`,
>   `story-rail` / `carousel` (`center`, `caption`, `media`, `video`). No `in-page-nav` / `spec-table` block.
>   Runtime `template` metadata is `skoda_model` (§8 `model-page` is the importer's template name).

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
