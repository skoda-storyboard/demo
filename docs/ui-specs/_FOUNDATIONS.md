# UI Specs, Foundations

Shared design tokens, breakpoints, and repo conventions that every component spec in this folder
references. Do not repeat these values inside a component spec; cite the token name here instead.
When a measured source value has **no** matching token, flag it in the component spec as a candidate
new token (see [Missing tokens](#missing-tokens)).

Token values are verified against `styles/brand.css`. Breakpoints are verified against the live
source stylesheet (`media-room-*.css`, served from `cdn.skoda-storyboard.com`).

---

## 1. Breakpoints (verified from source)

The source is **mobile-first**. `media-room-*.css` carries 284 `@media` rules; the breakpoint
frequency confirms a three-step primary ladder plus two secondary steps:

| Role | `min-width` | rules | mirrored `max-width` | Capture viewport |
|---|---|---|---|---|
| Mobile (base) | n/a | n/a | `767px` (24) | **375** |
| Tablet | `768px` | 80 | `991.98px` (10) | **768** |
| Small desktop | `992px` | 28 | `1079px` (34) | **1024** |
| Desktop | `1080px` | 43 | n/a | **1280** |
| Secondary (mobile-L) | `576px` / `720px` | 6 / 18 | `719px` (6) | sample when a component uses it |
| Content cap | n/a | n/a | `1248px` (5) | matches `--content-max-width` |

**Canonical breakpoint set for the rebuild:** `768 / 992 / 1080` (primary), `576 / 720` (secondary).
Content width caps at `1248px`.

> **Parity mismatch to standardize.** The current EDS blocks hardcode different literals
> (`900px`, `600px`, `700px`, `1000px`) and there are **no breakpoint tokens**. For pixel parity the
> rebuilt blocks must adopt the source ladder above. Component specs should state the exact source
> breakpoint each rule uses and note where the existing block diverges. Proposal: introduce
> `--bp-tablet: 768px`, `--bp-desktop-s: 992px`, `--bp-desktop: 1080px` (tracked as a follow-up;
> CSS range syntax `@media (width >= 768px)` is already the repo idiom).

---

## 2. Color tokens (`styles/brand.css`)

| Token | Value | Use |
|---|---|---|
| `--skoda-green` | `#0e3a2f` | dark-section background + theme-color |
| `--skoda-green-emerald` | `#78faae` | accent (brand emerald) |
| `--skoda-ink` | `#161718` | primary text |
| `--skoda-white` | `#fff` |, |
| `--skoda-grey-100` | `#f5f5f5` | light section bg |
| `--skoda-grey-200` | `#e6e6e6` |, |
| `--skoda-grey-border` | `#dadada` | card/border |

Semantic maps: `--background-color`→white, `--light-color`→grey-100, `--dark-color`→green,
`--text-color`→ink, `--link-color`→ink, `--link-hover-color`→green.

## 3. Typography (`styles/brand.css`)

Family: `--body-font-family` / `--heading-font-family` = `'SKODA Next', helvetica, arial, sans-serif`
(licensed font not rehosted; brand fallback stack; `fonts.css` loads lazily, never eager).

Body: `--body-font-size-m: 16px`, `-s: 14px`, `-xs: 13px`.
Headings: `--heading-font-size-xxl: 44px` (h1), `-xl: 34px` (h2), `-l: 26px` (h3), `-m: 22px` (h4),
`-s: 18px` (h5), `-xs: 16px` (h6).
Weights: `--weight-regular: 400`, `-medium: 500`, `-semibold: 600`, `-bold: 700`.

## 4. Spacing (`styles/brand.css`)

`--spacing-xs: 8px`, `-s: 12px`, `-m: 16px`, `-l: 24px`, `-xl: 40px`, `-xxl: 64px`.
`--section-padding: 40px`.

## 5. Cards / radii / shadows / borders

`--card-radius: 8px`; `--card-shadow: 0 1px 10px 0 rgb(0 0 0 / 7%), 0 2px 2px -2px rgb(0 0 0 / 10%)`;
`--card-border: 1px solid var(--skoda-grey-border)`.

## 6. Layout / nav

`--content-max-width: 1248px`; `--nav-height: 108px` (topbar 44 + main nav 64); `--nav-main-height: 64px`.

---

## 7. Repo conventions every spec must honor

- **Block layout:** `blocks/<name>/<name>.{js,css}`; `export default function decorate(block)`.
  CSS scoped by convention to `.<name>` (no build step, no CSS modules).
- **DA table model:** `block.children` = rows, each row's children = cells. Two patterns:
  (a) one card per row (cards family, carousel), cells classified by **content sniffing**, not
  position (image cell = single child containing `picture`; toolbar cell = all `<p>`-with-`<a>`;
  icon cell = `:name:` token; else → body); (b) key/value config table (stories, story-rail) via
  `readConfig`.
- **Variants:** authored as `blockname (variant)` → extra class on `block.classList`, read
  defensively. Count/content-based auto-variants exist (see `cards-overlay.js`, `carousel.js`).
- **Defensive decoration:** authors omit/add cells, skip malformed rows, drop empty image cells,
  fall through to body, optional-chain possibly-absent nodes. Never assume a cell exists.
- **Images:** authored content → `optimizeImageInPlace` (`scripts/optimized-picture.js`, preserves
  the authored `<picture>`/`<img>` so it stays editable in DA Layout mode). Synthesized/index-driven
  content → `createOptimizedPicture`. LCP image gets `fetchpriority="high"`.
- **Sections:** `Style` metadata → classes (`dark`/`light`/`highlight`) via `decorateSectionMetadata`
  (`scripts/scripts.js`); `dark` = green band, white text.
- **Buttons:** link in `<strong>` → `.button.primary`, `<em>` → `.secondary`, both → `.accent`.
- **Icons:** `:name:` → `<span class="icon icon-name">` → SVG via `decorateIcons`.
- **Security:** any `innerHTML` must be Trusted-Types-safe (policy in `scripts.js`).
- **Index-driven blocks** (`stories`, `story-rail`) share the memoized `scripts/query-index.js`
  loader; rows are read-only (copy/filter, never mutate). `story-rail` builds a real `carousel`
  block via `buildBlock`.

## 8. Missing tokens

Known gaps to resolve as specs surface values:
- `--skoda-grey-500` is referenced with inline fallbacks (`#464748` in `styles.css`, `#7c7d7e` in
  `header.css`) but **not defined** in `brand.css`. **Wave 1 confirms the source value is `#7c7d7e`**
  (article tag chip). Define `--skoda-grey-500: #7c7d7e`.
- No breakpoint tokens yet (see §1).

Candidate tokens surfaced by capture (add when the relevant block lands):
- `--skoda-green-emerald-hover: #a8ffcc` (hover tint of `--skoda-green-emerald`; card-teaser toolbar
  buttons, tag chips, `.btn`).
- `--pill-radius: 50px` (card-teaser toolbar buttons, fully round), distinct from the tag chip radius
  `2em` and the grey label radius `2px`; keep these separate, do not collapse into one token.
- Tag chip: `--tag-radius: 2px`, `--tag-padding: 5px 10px`, `--tag-font-size: 11px`,
  `--tag-letter-spacing: 0.1em`, `--tag-gap: 5px`.
- Hero: `--heading-font-size-hero: 48px`, `--heading-font-size-hero-story: 40px`,
  `--weight-light: 300`, `--hero-vh: 61.8vh`, archive-banner heights `160/200/240px`.
- Scrim gradients (card-teaser overlay, hero landing/series): `--scrim-h`
  (`linear-gradient(270deg, transparent, rgb(0 0 0 /.25))`) and `--scrim-v`
  (`linear-gradient(180deg, transparent, rgb(0 0 0 /.1))`).
- Header/nav: `--nav-topbar-height: 44px`, `--dropdown-radius: 4px`, `--dropdown-shadow`,
  `--dropdown-hover-bg: #f1f1f1`, `--divider-color: #e4e4e4`, `--body-font-size-2xs: 12px`.
- Footer: `--social-icon-size: 40px`, `--social-icon-bg: #000`, per-network hover colors
  (FB `#3b5998`, YT red, IG gradient, WA `#43d854`), app-badge `135x40`, footer padding `4rem`,
  form input bg `#f1f1f1` / radius `4px`.

- Carousel/rails: `--carousel-arrow-size: 32px`, `--carousel-gap: 20px`, `--carousel-dot: #d8d8d8`,
  `--carousel-dot-active: #686868`. (Source rails = Flickity; Owl loaded-but-unused. EDS carousel
  currently diverges: 900/600 bp, 24px gap, 40px arrows, align to 768/992, 20px, 32px.)
- Gallery: `--gallery-accent: #419468`, `--gallery-divider: #5a5b5c`.
- Embeds: `--embed-consent-bg: #c4c6c7`, `--embed-consent-border: #9f9f9f`,
  `--embed-audio-height: 200px` (video wrapper = 16:9 / `padding-bottom:56.25%`).
- Faceted listing: `--facet-radius: 5px`, `--facet-pill-bg: #f6f6f6`, `--facet-active: #419468`
  (shared with gallery accent), `--pagination-border: #c9cdd3`, `--grid-gutter: 20px`.
- Media cart: `--cart-badge-bg: #ff6666`, `--cart-added-scrim` (40% black), `--cart-dropdown-shadow`.
- Skodapedia: `--az-nav-size: 24px`, `--modal-shadow: 0 0 10px #c4c6c7`, reuse `--gallery-accent: #419468`
  + hover `--gallery-accent-hover: #59bc87`.
- Article prose (story-detail): `--prose-paragraph-gap: 20px`, optional `--prose-measure: 72ch`;
  content column `66.66%`, sidebar `33.33%` (stack <768). Heading scale reuses `--heading-font-size-*`
  at `--weight-light: 300` for h2/h3.
- Newsletter/forms: `--error-color: #e82b37`, success reuses `--gallery-accent: #419468`; input radius 0
  (topbar) / border-bottom style (sidebar); submit = emerald pill `2em`.
- Social-share: per-network colors (X `#000`, Pinterest `#cb2027`, LinkedIn `#0a66c2`, Facebook
  `#3b5998`, WhatsApp `#43d854`), `--social-share-size-desktop: 58px` / `--social-share-size-compact:
  40px`, `--icon-btn-radius: 4px`.
- Promo banner: sidebar creative `1:1` in the `33.33%` column, radius `--card-radius` (8px). Dynamic
  ad platform is E09/SKODA-903 (out of UI-spec scope).
- Press kit: `--perex-font-size: 20px`, `--chapter-nav-height: 44px`; FAQ reuses
  `--divider-color: #e4e4e4`; grouped media = stacked (reuse downloads tokens); prose reuses
  story-detail scale.
- Templates (page-level, from the template capture, see `_TEMPLATES.md`):
  `--section-dark-bg: #0e3a2f` (dark-green `.cover-box.dark` band on the homes + PR/model related bands);
  `--section-heading: 26px` (`/32.5/600`, home + rail + PR/model related headings);
  `--pr-title: 26px` (`/32.5/600`, press-release text title, distinct from the hero title);
  `--display-xl: 56px` (`/61.6/700`, 404 headline); model-name hero overlay `36px/700` (→24px mobile);
  category-archive banner `240px` (→184px mobile) and grid `3/2/1` columns; generic-Page title reuses
  `--heading-font-size-hero: 48px` at `--weight-light: 300` (does not shrink on mobile in source).

**Breakpoint reconciliation:** footer nav uses source literals `768 / 968 / 1024`; the canonical set
is `768 / 992 / 1080` (§1). Standardize footer to canonical unless a 968/1024 column break is visually
required (confirm during footer build).
