# Template Spec: Home (Storyboard home + Media Room home)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280 on both homes; component-level
detail lives in `carousel-rails.md` / `card-teaser.md` / `hero.md`).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Template:** the two landing pages. Two variants of one composition pattern:
  - Storyboard home, `page-template-template-homepage`, STO side, `/en/`.
  - Media Room home, `page-template-template-media-room`, MR side, `/en/media-room/`.
- **Side:** STO / MR (selects header nav set + footer; see `_TEMPLATES.md` shell section, nav content and
  locale count differ per side).
- **Ticket:** SKODA-604 / a home-composition ticket (fold into 604 or a new home ticket, confirm at build).

## 2. Page anatomy

Both are a **vertical stack of `.cover-box` sections** (alternating light / `.cover-box.dark`), led by the
`.promo-box` featured slider.

**Storyboard home (`/en/`), 9 sections:**
```
section.promo-box              featured grid + mobile auto-rotate (see carousel-rails.md)
div.cover-box       "Latest Stories"   main story feed + [Load more] button
div.cover-box.dark  "Social media"     social strip (dark green bg)
div.cover-box       "Models"           category rail
div.cover-box       "eMobility"        category rail
div.cover-box       "Lifestyle"        category rail
div.cover-box       "Škoda World"      category rail
div.cover-box.dark  "Series"           series rail (dark green bg)
div.cover-box       "Latest News"      news rail
```

**Media Room home (`/en/media-room/`), 4 sections:**
```
section.promo-box              featured (press kit / news)
div.cover-box       "News"             main news feed
div.cover-box.dark  "Models"           models section (dark green bg)
div.cover-box       "Latest Stories"   stories rail
```

## 3. Composed components

[`header-megamenu`](header-megamenu.md) (side variant) → [`carousel-rails`](carousel-rails.md)
(`.promo-box` featured slider + each `.cover-box` rail) wrapping [`card-teaser`](card-teaser.md) →
[`newsletter`](newsletter.md) + social strip → [`footer`](footer.md) / [`footer-mediaroom`](footer-mediaroom.md).
The "Latest Stories"/"News" feed uses a **Load more** `<button>` (not a rail).

## 4. Template-specific structure

- **`.cover-box` section system:** each home section is a `.cover-box` (light) or `.cover-box.dark` (dark
  green) band. Dark bands are used for accent sections (Social media, Series on STO; Models on MR).
- **Promo-box** leads both homes (featured showcase, per-breakpoint behavior + mobile auto-rotate, see
  `carousel-rails.md` §3/§5).
- **Main feed vs rails:** the first `.cover-box` ("Latest Stories" / "News") is a paginated feed with a
  Load more button; the rest are horizontal rails ("All" link + carousel).

## 5. Measured template-level visual base

Values `getComputedStyle`, cited `(selector · viewport)`.

**Layout**
- Full-width stacked `.cover-box` sections; inner content caps at `1248px`. Rails follow
  `carousel-rails.md` cell math (~4.4 / 3.3 / 1.1 cells at 1280/768/mobile).
- STO home section tops (1280): promo `y124`, then rails on a consistent step (~319px per rail row).

**Spacing / vertical rhythm**
- `.cover-box` section padding `12px / 12px` (· `.cover-box` · 1280); rails ~`319px` tall each.

**Typography** (→ token)
- Section headings (`h3`, e.g. "Latest Stories", "Models"): `26px / 32.5 / 600` → candidate
  `--section-heading: 26px` (white on dark bands, `#161718` on light) (· `.cover-box h3` · 1280).
- Promo first-card title: `29.6px / 35.5 / 400` white (· `.promo-box .item:first-child .entry-title` ·
  1280), matches `card-teaser.md` / SKODA-201.

**Colors**
- `.cover-box` (light) background `#fff`; `.cover-box.dark` background **`#0e3a2f`** (dark green) →
  candidate `--section-dark-bg: #0e3a2f` (· `.cover-box.dark` · 1280).

**Responsiveness**
- Sections stack at all widths; rails reflow per `carousel-rails.md`; promo-box switches from static
  mosaic (≥768) to a 1-up auto-rotating carousel (<768).

## 6. Interaction / behavior

- Promo-box auto-rotation on mobile (10s, pause-on-hover), see `carousel-rails.md`.
- "Latest Stories" / "News" **Load more** button appends the next page of cards (real `<button>`).
- Category rails: "All" link + prev/next arrows, no autoplay (verify each rail's `data-flickity`).

## 7. Accessibility

- Single `h1` for the page (site/section name); section headings `h2`/`h3` in order.
- Load more: announce appended results (aria-live) + manage focus. Rails: labeled arrow buttons,
  keyboard-scrollable. Dark-band text contrast ≥ 4.5:1 over `#0e3a2f`.

## 8. EDS target

- DA `Metadata`: `template=landing` (STO) / `template=media-room-home` (MR); side selects chrome.
- Section model: each home section = a DA section with `Style` = `cover-box` or `cover-box dark`
  (`--section-dark-bg`), containing a `carousel`/`story-rail` or the feed block. Promo-box = the featured
  block. Reuse `story-rail`/`carousel` + `card-teaser`; the feed's Load more is a query-index pager.

## 9. Open decisions + recommended default

- **Section order / which rails** per home (🟡): confirm the canonical section set + order with the client
  (captured set above is the current live order).
- **Feed page size + Load more vs infinite scroll** (🟡): default Load more button (source-confirmed on
  STO home).

## 10. Pixel-perfect acceptance criteria

- [ ] STO home renders the 9-section stack in order (promo-box → Latest Stories feed → Social media dark →
      Models/eMobility/Lifestyle/Škoda World rails → Series dark → Latest News); MR home the 4-section stack.
- [ ] Sections are `.cover-box` / `.cover-box.dark` bands; dark bg `#0e3a2f`; padding `12px`; headings
      `26px/32.5/600`.
- [ ] Promo-box leads both homes with the per-breakpoint behavior (static mosaic ≥768 / auto-rotate <768).
- [ ] First feed uses an accessible Load more button; rails reflow per `carousel-rails.md`.
- [ ] Correct chrome per side (STO vs MR header nav + footer).
- [ ] Visual diff vs source at 1280/768/500 ≤ 2% per-pixel (promo-box + one light rail + one dark band).

## 11. Reference screenshots

- `assets/template-home/storyboard-desktop-1280.png`, `assets/template-home/mediaroom-desktop-1280.png`.
