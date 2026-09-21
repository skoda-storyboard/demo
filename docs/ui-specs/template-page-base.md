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

- DA `Metadata`: `template=page` (STO) or `template=media-room-page` (MR, sets the MR chrome); title +
  optional hero image.
- Section model: one hero section + one single-column content section (SiteOrigin flattened to default
  content + blocks). MR company pages add the sub-type blocks per `company-pages.md`.
- Reuse: `hero` banner + default rich-text decoration. This is the "🟢 native" template in
  `SKODA-MASTER.md` §16 fit-scale, mostly straight content.

## 9. Open decisions + recommended default

- **Mobile heading scale** (🟡): source keeps `48px`/`40px` on mobile; **default = add a modest mobile
  step** so the title doesn't overflow narrow screens (confirm vs source-faithful).
- **STO vs MR shell selection**: driven by the `template=` Metadata value; confirm the two footers +
  nav sets (see `_TEMPLATES.md` shell section, nav content differs per side).

## 10. Pixel-perfect acceptance criteria

- [ ] Shell selected by side: `page-template-default`→STO chrome; `template-media-room-page`→MR chrome.
- [ ] Hero banner `240px` with page title `h1 48px/52.8/300` white overlay.
- [ ] Single-column `article` (no sidebar); content cap `1248`, gutter `~16px`; `h2 40px/45/300`, body
      `16/24/400`, `p mb 20`.
- [ ] MR variant hosts the company sub-type blocks (see `company-pages.md`); STO variant = plain rich text.
- [ ] Mobile: single column; heading scale per the confirmed decision (§9).
- [ ] Visual diff vs source at 1280/500 ≤ 2% per-pixel (hero + body).

## 11. Reference screenshots

- `assets/template-page-base/desktop-1280.png`, `assets/template-page-base/mobile-500.png`.
