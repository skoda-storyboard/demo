# Design Tokens — Global CSS Foundation (SKODA-106)

The shared design-system contract every block consumes. Tokens are **re-derived** from the
source design (measured in [`ui-specs/_FOUNDATIONS.md`](../ui-specs/_FOUNDATIONS.md)), **not ported**
from the legacy jQuery/Owl/Isotope theme. Downstream block CSS must use `var(--…)` — no hardcoded
colors or spacing.

## Where tokens live

| File | Layer | Notes |
|---|---|---|
| `styles/brand.css` | Primitive colors + semantic map + fallback `@font-face` | Only file allowed raw hex (Stylelint-exempt). Loaded eagerly in `head.html`. |
| `styles/styles.css` `:root` | Typography, spacing, radii/shadow, layout/nav, breakpoint tokens | LCP-critical global styles. |
| `styles/fonts.css` | SKODA Next `@font-face` | Loaded **lazily** by `loadFonts()`; licensed font not yet rehosted (fallback only). |

## Colors

Primitives (`brand.css`): `--skoda-green #0e3a2f`, `--skoda-green-emerald #78faae`,
`--skoda-ink #161718`, `--skoda-white #fff`, `--skoda-grey-100 #f5f5f5`, `--skoda-grey-200 #e6e6e6`,
`--skoda-grey-500 #7c7d7e`, `--skoda-grey-border #dadada`.

Semantic map (use these downstream): `--background-color` → white, `--light-color` → grey-100,
`--dark-color` → green, `--text-color` → ink, `--link-color` → ink, `--link-hover-color` → green,
`--border-color` → grey-border.

## Typography

- Families: `--body-font-family` / `--heading-font-family` = `'SKODA Next', skoda-next-fallback, helvetica, arial, sans-serif`.
- Weights: `--weight-light 300`, `--weight-regular 400`, `--weight-medium 500`, `--weight-semibold 600`, `--weight-bold 700`.
- Line heights (measured from source): `--line-height-body 1.5` (24px on 16px body), `--line-height-heading 1.25`.
- Prose rhythm: `--paragraph-gap 20px` (measured article/press body paragraph spacing).
- Body: `--body-font-size-m 16px`, `-s 14px`, `-xs 13px`.
- Headings: `--heading-font-size-xxl 44px` (h1), `-xl 34px` (h2), `-l 26px` (h3), `-m 22px` (h4),
  `-s 18px` (h5), `-xs 16px` (h6). These are **global fallback** sizes — actual source heading sizes
  are template/component-specific (story title 40px/600, press-release title 26px/600, article h2
  40px at weight 300) and live in each owning block's CSS, not globally.

## Spacing

`--spacing-xs 8px`, `-s 12px`, `-m 16px`, `-l 24px`, `-xl 40px`, `-xxl 64px`; `--section-padding 40px`.

## Radii / shadow / border

`--card-radius 8px`; `--card-shadow 0 1px 10px 0 rgb(0 0 0 / 7%), 0 2px 2px -2px rgb(0 0 0 / 10%)`;
`--card-border 1px solid var(--skoda-grey-border)`.

## Layout / nav

`--content-max-width 1248px`; `--nav-height 108px`; `--nav-main-height 64px`; `--nav-topbar-height 44px`.

## Breakpoints

Canonical mobile-first ladder (`_FOUNDATIONS.md` §1): **768 / 992 / 1080** primary (+ 576 / 720
secondary). Media queries use the repo range idiom `@media (width >= 992px)` with these literals —
CSS custom properties cannot appear inside `@media` conditions. Tokens `--bp-tablet 768px`,
`--bp-desktop-s 992px`, `--bp-desktop 1080px` exist for **JS / container-query reuse only**.

## Scope

This ticket delivers only the global/root tier. Component-level tokens (tag chip, hero, carousel,
gallery, footer social, etc.) listed in `_FOUNDATIONS.md` §8 land with their owning blocks.
