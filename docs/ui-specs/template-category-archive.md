# Template Spec: Category / Tag archive

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/768/500 on the live eMobility
category; tag archive `/tag/model/octavia/` cross-checked).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Template:** Category and tag listing (Storyboard archive). One template, two entry points:
  `/en/category/<x>/` and `/en/tag/<taxonomy>/<x>/`.
- **WP body class:** `archive category category-<slug>` (category) / `archive` + tag classes (tag). No
  custom `page-template-*`, it is the WordPress archive template.
- **Side:** Storyboard (switcher = Stories; STO header + footer).
- **Source URLs:** `https://www.skoda-storyboard.com/en/category/emobility/`,
  `https://www.skoda-storyboard.com/en/tag/model/octavia/`.
- **Ticket:** SKODA-209 (new).
- **Not the MR faceted listing.** This archive has **no facet panel** (unlike `template-search-results`
  / `faceted-listing.md`), it is a plain hero + card grid.

## 2. Page anatomy

```
header.header (STO variant)          108px
main
├── div.hero  (full-bleed banner, ~240px desktop / ~184px mobile)
│   └── title = the term name  (category: "eMobility"; tag: "Models Octavia" = parent + tag)
└── div.container  (max 1248, gutter ~16px)
    └── div.search-results-items  (card grid, display:flex; flex-wrap:wrap)
        └── div.article-teaser ...  (16:9 cards)
footer.footer (STO variant)
```

No facet panel, no visible sidebar. Pagination control is **not in the static DOM** (see §6).

## 3. Composed components

[`header-megamenu`](header-megamenu.md) (STO) → [`hero`](hero.md) (short banner variant, term-name
title) → a flex-wrap grid of [`card-teaser`](card-teaser.md) (media/overlay 16:9 cards) →
[`footer`](footer.md) (STO). No `faceted-listing` facet panel.

## 4. Template-specific structure

- **Term hero:** a short (~240px) banner whose title is the taxonomy term. Category shows the term name
  ("eMobility"); tag shows parent + term ("Models Octavia").
- **Card grid:** `.search-results-items`, `display:flex; flex-wrap:wrap`, reusing the standard card unit.
- **Pagination:** no static control captured, confirm live whether it is a JS "Load more" button
  (as on the homepage) or infinite scroll (see §6/§9).

## 5. Measured template-level visual base

Values `getComputedStyle` on the eMobility category, cited `(selector · viewport)`.

**Layout**
- `main > .hero` full-bleed, height **`240px` desktop / `184px` at 500** (· `.hero` · 1280/500).
- `.container` caps at `1248px`, gutter `~16px` margin (· `.container` · 1280).
- Grid `.search-results-items` `display:flex; flex-wrap:wrap`; cards ~`396px` (3-up) at 1280,
  `364px` (2-up) at 768, `480px` (1-up) at 500 (· `.article-teaser` · per viewport).
- Cards are `16:9` (ratio `1.78`) (· `.article-teaser img` · 1280).

**Spacing / vertical rhythm**
- Article grid sits in the `.container` directly under the hero (hero at `y=108`, grid follows). Card
  inter-row gap follows the card unit (see `card-teaser.md`); measure and lock at build.

**Typography**
- Hero term title = the large hero heading (reuse `hero.md` banner title scale). Body/meta = the card
  unit's type (see `card-teaser.md`), no archive-specific overrides beyond the hero.

**Responsiveness**
- Grid columns **3 → 2 → 1**: 3-up at 1280, 2-up at 768, 1-up at 500 (break points align to the
  768/992-1080 ladder; confirm the 3→2 step precisely at build).
- Hero shrinks `240 → 184px` on mobile.
- **Open:** the category rendered 3-up at 1280 while the tag archive rendered 2-up at the same width,
  confirm whether tag archives use a narrower grid or it was a content-count artifact.

## 6. Interaction / behavior

- **Pagination unconfirmed:** no load-more/pagination element in the initial DOM. The homepage uses a
  "Load more" button; this archive may inject one on scroll or use infinite scroll. Verify live (scroll
  and watch the DOM / network) before locking, do not assume.

## 7. Accessibility

- Single `h1` = the term name in the hero; grid is a list of card links (one tab stop per card, visible
  `:focus-visible`). If load-more is used, announce new results (aria-live) and manage focus.

## 8. EDS target

- DA/query-index driven: `template=category` (or `tag`), term captured in Metadata; the grid is a
  query-index listing filtered by the term (reuse the `card-teaser` grid, not the MR facet engine).
- Reuse: `hero` banner + `card-teaser` grid + the query-index retrieval used by `story-rail`/
  `faceted-listing`. Pagination = a "load more" button (recommended, see §9) over the query-index.
- Correct the stale "category template not yet assembled" note once built.

## 9. Open decisions + recommended default

- **Pagination** (🟡): **default = a "Load more" button** over the query-index (matches the homepage
  pattern, accessible, avoids infinite-scroll focus issues). Confirm against the live archive's actual
  mechanism.
- **Grid columns** (🟡): default 3/2/1 responsive (confirm the category-vs-tag column difference).
- **Ordering:** newest-first assumed; confirm.

## 10. Pixel-perfect acceptance criteria

- [ ] Shell: STO header + footer; single `h1` = term name (category term; tag = parent + term).
- [ ] Hero banner ~`240px` desktop / `184px` mobile; term title from `hero.md` scale.
- [ ] Card grid `.search-results-items` flex-wrap; **3-up 1280 / 2-up 768 / 1-up 500**; cards `16:9`.
- [ ] **No facet panel** (this is the plain archive, not the MR faceted listing).
- [ ] Content cap `1248`, gutter `~16px`.
- [ ] Pagination via an accessible "Load more" (or the confirmed source mechanism); focus/aria-live on
      new results.
- [ ] Visual diff vs source at 1280/768/500 ≤ 2% per-pixel (hero + grid).

## 11. Reference screenshots

- `assets/template-category-archive/desktop-1280.png`, `assets/template-category-archive/mobile-500.png`.
