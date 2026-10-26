# Template Spec: Generic Page base shell

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/500 on the live Copyright page;
`template-media-room-page` variant cross-checked on Contacts).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Template:** the base "Page" shell, a single-column SiteOrigin content page. Two variants share this
  shell:
  - `page-template-default` (Storyboard side): copyright, legal, misc pages.
  - `template-media-room-page` (Media Room side): the company/utility pages (contacts, board, ...), whose
    specific content blocks are in [`company-pages.md`](company-pages.md).
- **WP body class / CPT:** `page-template-default` / `page-template-template-media-room-page`, `page`
  (public CPT), `siteorigin-panels`. STO variant has no `media-room` flag; MR variant has `body.media-room`.
- **Side:** STO (`page-template-default`) or MR (`template-media-room-page`), selects the header/footer.
- **Source URLs:** `https://www.skoda-storyboard.com/en/copyright/` (STO),
  `https://www.skoda-storyboard.com/en/contacts/` (MR).
- **Ticket:** SKODA-813 (new). Generic-page import is SKODA-802.

## 2. Page anatomy

```
header.header (STO or MR variant)     108px
main
├── div.hero  (full-bleed banner, 240px)
│   └── h1  = page title (48px/300 white overlay)
└── article.page  (single column, NO sidebar)
    └── div.container / SiteOrigin panel-grid   (max 1248)
        └── h2 + rich text (+ company sub-type blocks on the MR variant)
footer.footer (STO or MR variant)
```

## 3. Composed components

[`header-megamenu`](header-megamenu.md) (side variant) → [`hero`](hero.md) (banner variant, page title) →
single-column SiteOrigin rich text → (MR variant only) the company sub-type blocks from
[`company-pages.md`](company-pages.md) → [`footer`](footer.md) / [`footer-mediaroom`](footer-mediaroom.md).
No sidebar, no facets.

## 4. Template-specific structure

- **The shell is the deliverable:** hero banner + single-column body. This is the base that both legal/
  generic pages and company pages sit inside; `company-pages.md` documents what fills the MR body.
- **Legal/copyright bar** in the footer region is separate (see `footer.md`, SKODA-304).

## 5. Measured template-level visual base

Values `getComputedStyle` on the Copyright page, cited `(selector · viewport)`.

**Layout**
- `main > .hero` full-bleed, height **`240px` (constant, does not shrink at 500)** (· `.hero` ·
  1280/500).
- `article.page` = **single column**, no `.columns`/sidebar; content caps at `1248px`, gutter `~16px`;
  SiteOrigin rows constrain body text to a narrower measure (~`574px` in the copyright layout) (·
  `article .container` / `.entry-content` · 1280).

**Spacing / vertical rhythm**
- `h1` (hero title) `margin-bottom 16px`; `h2` `margin-bottom 16px`; body `p` `margin-bottom 20px`
  (· 1280).

**Typography** (→ token)
- Page title `h1` (hero overlay): `48px / 52.8 / 300`, white (· `.hero h1` · 1280). Thin-weight banner
  title, matches the `hero.md` landing title scale. **Does not scale down at 500** (stays 48px).
- Section `h2`: `40px / 45 / 300`, color `#161718` (· `article h2` · 1280); stays 40px at 500.
- Body `p`: `16px / 24 / 400`, `#161718` → `--body-font-size-m` / `--skoda-ink`.

**Responsiveness**
- Single-column at all widths (nothing to reflow beyond the card/rich-text content).
- **Hero + heading type do NOT scale on mobile** here (h1 48px, h2 40px, hero 240px at 500), unlike the
  category archive (240→184) or model page (36→24). Flag for the EDS build: decide whether to keep the
  large mobile type (source-faithful) or add a mobile step (recommend a small mobile reduction for the
  48px title to avoid overflow, assumption to confirm).

## 6. Interaction / behavior

- Static content page, no template-level interactive behavior beyond the shared chrome. MR-variant
  company pages add their own (contacts mailto links, app-promo, etc., see `company-pages.md`).

## 7. Accessibility

- Single `h1` = page title; logical `h2`/`h3` order in the body; standard landmarks.

## 8. EDS target

- **Side:** the header and footer come from the bulk metadata sheet by path (`/en/contacts` →
  `/media-room/nav` + `/media-room/footer` + `section: media-room`); a page outside the Media Room paths
  keeps the Storyboard chrome. `template` stays `page`.
- **Band:** `Hero Image (page)` (SKODA-813): row 1 the banner picture or an empty cell, row 2 the H1.
- **Body:** one section per SiteOrigin row, `Style: page-body` (`page-body, half` for a row set in the
  left half of a 50/50 row; `empty-cell` when its right cell held an empty widget). Contract and runtime:
  [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md) `page-body`.
- **Measured** (2026-10-21, live vs the import, 390 / 768 / 992 / 1080 / 1440 plus the 780 / 781 edge):
  - band 240px at every width, the empty band's colours equal to the pixel (5% ink under the shared scrim);
  - title 48/52.8/300 white, 16px above the band's edge, 10px into the column;
  - every row 10px under the band or the row before (the source widget's 10px padding less its −10px
    margin), text 20px in (30px from 781);
  - h2 40/45/300 and h3 24/27.6/300 (16px under), p 16/24 (20px apart), half rows (W − 60 − 40) / 2 from
    781 (340.5 / 446 / 490 / 574 at 781 / 992 / 1080 / 1440);
  - footer 20px under the last paragraph.
- MR company pages add the sub-type blocks per `company-pages.md` (SKODA-810).

## 9. Open decisions + recommended default

- **Mobile heading scale:** built source-faithful (48px title, 40px h2 on phones), per the PO's "same as
  live" (2026-10-21); a mobile step would be a deviation to approve.
- **STO vs MR shell selection:** by path in the bulk metadata sheet (§8), not by a `template` value.
- **Contrast:** the white title on the empty band is the source's own: about 2.3:1 behind its first letters
  (rgb 171 at 1440), down to 1.1:1 at the band's light right edge (rgb 240), below WCAG AA's 3:1 for large
  text. Kept as on the live page (PO, 2026-10-21). A banner image (Contacts) sits under the same scrim as the
  source's.
- **Body link colour:** the source's #419468 (3.71:1 on white), kept (PO, 2026-10-21).
- **Body link focus:** no ring, as on the source (PO, 2026-10-21, "match live"): an accepted exception to
  css-guidelines §8 and WCAG 2.4.7. Header and footer links keep the site's ring.
- **Text rendering:** `auto`, as the source (the site-wide `optimizespeed` dropped, PO 2026-10-21).
- **Long titles:** the band stays 240px; a title that needs more lines rises out of it, under the header at
  narrow widths, as on the source (PO, 2026-10-21).

## 10. Pixel-perfect acceptance criteria

- [x] Shell selected by side: Copyright → STO chrome; Contacts → MR chrome (bulk metadata, §8).
- [x] Hero banner `240px` with page title `h1 48px/52.8/300` white overlay.
- [x] Single-column body (no sidebar); content cap `1248`; text 20px in (30px from 781); `h2 40px/45/300`,
      body `16/24/400`, `p mb 20`.
- [ ] MR variant hosts the company sub-type blocks (SKODA-810); STO variant = plain rich text.
- [x] Mobile: single column; heading scale source-faithful (§9).
- [x] Visual diff vs source at 1280/500 ≤ 2% per-pixel (hero + body): Copyright 0.00% / 0.00%; Contacts' hero
      0.01% / 0.16% (its body, the contact directory, is SKODA-810). The method and results are in SKODA-813
      ("Pixel gate").
- [x] Also measured equal to the source at 390 / 768 / 780 / 781 / 992 / 1440 (every body text box, the band's
      pixels, the footer gap).

## 11. Reference screenshots

- `assets/template-page-base/desktop-1280.png`, `assets/template-page-base/mobile-500.png`.
