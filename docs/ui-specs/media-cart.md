# Component Spec: Media Cart

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS `media-room-515d2d102b.css`).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Media Cart, the add-to-cart affordance on media assets + the floating cart badge + the
  cart page ("Your downloads": download-all / empty / history). Behavior/architecture live in
  SKODA-505; this spec adds the **measured UI + states**, which the backlog lacks.
- **EDS block(s):** `media-cart` (the cart page/panel) + a shared `media-cart-action` affordance
  decorated onto card toolbars (works with `cards-toolbar` / `downloads`). No existing block.
- **Client PDF IDs:** COM-12 / COM-14; MR-H08 (header cart); STO-D09; MR-I05 (image add); MR-V04 (video add).
- **Ticket:** SKODA-505.
- **Source references:** `https://www.skoda-storyboard.com/en/media-room/` (asset grid + floating cart badge),
  `https://www.skoda-storyboard.com/en/media-cart/` (the cart page), image/media pages.
- **Top-level selectors:** `a.media-cart-icon.media-cart-count.round-icon` (floating cart badge),
  `a.media-cart-action[data-action=add|remove]` (per-asset affordance), `.media-cart-action-multi` +
  `.media-cart-action-multi-container` (size dropdown), `article.media-cart-item.in-cart` (added card),
  `body.media-cart` (cart page), `.media-cart-sidebar` / `a.mr-media-cart-button[data-action=downloadAll|empty|showHistory]`.

## 2. Source anatomy

```
FLOATING ACTION BAR  div.sticky-buttons  (position:fixed; bottom:8px; right:16px; z-index:1000)
                     — verified live: NOT in the header DOM. Bundles share + cart + scroll-top.
├── a.btn.icon.icon-share                    (share toggle)
├── a.btn.icon.icon-x / -pinterest / -linkedin / -facebook / -whatsapp   (social-share cluster)
├── a.media-cart-icon.media-cart-count.round-icon.downloads[href="/en/media-cart/"][data-count][data-history]
│   :before  \e02f  (download glyph, 58×58 round icon)
│   :after   attr(data-count)  → red count badge, only when data-count != ""
└── a.round-icon.scroll-top[href="#"]        (scroll-to-top)

ASSET CARD (media room / image page)  — reuses .article-teaser
article.media-cart-item.image[data-post-id]      (+ .in-cart when added)
├── .article-teaser-media
│   └── :after   \e02f overlay (dark scrim + glyph)  opacity 0 → 1 when .in-cart
└── (toolbar) a.media-cart-action.add[data-action=add][data-id][data-size]   round + button (\e001)
    a.media-cart-action[data-action=remove]        (\e034)
    a.media-cart-action.link                        (\e01b)
    a.media-cart-action-multi + .media-cart-action-multi-container   size dropdown (Original / 1920px)

CART PAGE  body.media-cart  (/en/media-cart/, title "Your downloads")
├── .media-cart-sidebar    (float:left 25% in panel context; action buttons)
│   ├── a.btn.mr-media-cart-button[data-action=downloadAll]  "Download package"  (\e012)
│   ├── a.btn.mr-media-cart-button[data-action=empty]        "Empty package"     (\e034)
│   └── a.btn.mr-media-cart-button[data-action=showHistory]  "Your packages"
├── div.media-cart-item (flex) > article.media-cart-item (flex:0 0 100%)   item rows
│   └── .entry-buttons  flex-direction:column   (add/download hidden; remove + link stacked)
└── .empty-cart-message   (when empty; font-size 2em; color #ccc)
```

**Selection & download model (verified live 2026-09-15 on `/en/images/`):** there is **no bulk
multi-select UI**, no per-asset checkbox, no "select all", no "add page/visible/selected". Selecting
"multiple" assets means **adding them one at a time** from each tile; the aggregation is the cart
itself. Per tile the actions are: add-to-cart in a chosen rendition (`Original` `data-size=""` /
`1920px` `data-size="giant"`) **and** a direct per-item download of either rendition
(`a.media-cart-action[data-action=download]` -> `/direct-download/...`). Downloading "multiple" is then
either those per-item downloads or the whole cart as one **package/zip** ("Download package",
`data-action=downloadAll`), capped at **80 photos per package** (larger selections split into several
packages). Note: the 275+ checkboxes on the listing are the **facet filter** (Search & Filter Pro), not
asset selection (verified: 275/276 sit inside the filter panel). So the source "mediaboard" is
add-to-cart + package-download, not a checkbox multi-select gallery. A **select-all / bulk-add** is a
possible EDS enhancement, not a source feature (flag as an open question, see §8).

**Libraries to retire:** jQuery + WP admin-ajax cart endpoints (replace with an EDS cart service:
`localStorage` for guest carts + a download/packaging endpoint); icon-font glyphs
(`\e001` add, `\e034` remove, `\e012` download, `\e02f` cart, `\e01b` link) -> SVG.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`.

### Floating cart button + badge (`a.media-cart-icon.round-icon`)
Source = `/en/media-room/` + press-kit chapter (verified live 2026-09-15, 1280). **Placement (corrected):**
the cart trigger is one button inside the **fixed floating `.sticky-buttons` action bar** (bottom-right,
`position:fixed; bottom:8px; right:16px; z-index:1000`), alongside the social-share cluster and the
`scroll-top` button, NOT in the header DOM. This is the "global float" noted in `_TEMPLATES.md`, one
component captured across [`social-share.md`](social-share.md) + this spec + scroll-top.
- round icon `58 x 58`, background `#fff` -> `--skoda-white`, `border-radius:4px`; `:before` content
  `"\e02f"` (download/cart glyph) `28px`, color `#161718` -> `--skoda-ink`;
  `href=/en/media-cart/` (the cart is a **page**, not a drawer). `data-history` attr toggles the
  "Your packages" history affordance (`false` when no package history yet).
- count badge `:after` (only when `data-count != ""`): position absolute `right:0` (top-right);
  background `#f66` (**candidate** `--cart-badge-bg: #ff6666`); border `2px solid #fff`; color `#fff`;
  border-radius `50%`; size `2em` = `24 x 24`; font-size `.75em`; weight `400`; content `attr(data-count)`.
  Measured after adding 1 asset: `data-count="1"`, badge renders "1" (· `.media-cart-icon::after` · 1280).
- Empty state: `data-count=""` -> badge hidden (no zero shown).

### Add affordance (`a.media-cart-action[data-action=add]`)
- display inline-flex; box-sizing content-box; icon `16x16` + padding `10px` + border `2px` =
  **`40 x 40`** rendered; min `1rem` each way (· 1280).
- border-radius `50px` -> `--pill-radius` (round icon button); background `#fff` -> `--skoda-white`;
  border `2px solid #161718` -> `--skoda-ink`; color `#161718` -> `--skoda-ink`.
- icon `::after` content `"\e001"` (plus), font-family `skoda-bnr-icons` -> SVG.
- `title="Add/remove this"` (the only accessible hint today; **no `aria-pressed`, no `aria-label`**, a11y gap).

### Size dropdown (`.media-cart-action-multi-container`)
- absolute; background `#fff`; box-shadow `0 3px 8px rgb(0 0 0 /.15)` (**candidate** `--cart-dropdown-shadow`);
  z-index `15`; top `45px`; hidden until `.is-active`. Rows: **"Original"** (`data-size=""`) +
  **"1920px"** (`data-size="giant"`); row padding `.75em`; hover bg `#f1f1f1`.

### Cart page (`body.media-cart`, `/en/media-cart/`)
- title **"Your downloads"** (`<h1>`).
- sidebar `.media-cart-sidebar` floats left `25%` (panel context) / full-width action row on the cart
  page; margin-bottom `20px`.
- action buttons `a.btn.mr-media-cart-button`: bordered (box-shadow `inset 0 0 0 1px rgb(0 0 0 /.15)`,
  radius `.2em`), text-align left, padding `1em 2em` + `padding-right:4em` (icon slot), text-transform
  capitalize, weight `400`; icon `::after` right (`downloadAll` -> `\e012`, `empty` -> `\e034`); label
  span `.85em`. Hover/active/focus: background `#78faae` -> `--skoda-green-emerald`, color `#fff`.
  Measured: "Download package", "Empty package", "Your packages".
- item rows: `div.media-cart-item` flex; `article.media-cart-item` flex `0 0 100%`; toolbar align
  baseline; `.entry-buttons` `flex-direction:column` (remove + link stacked); `add` and `download`
  hidden in cart context. Thumbnail 16:9 (`ratio-16x9`), reuses card-teaser.
- empty state: `.empty-cart-message` font-size `2em`, color `#ccc`, centered, margin `2em 0`.
- **Package size limit (verified live 2026-09-15):** the Images/Videos listings show an info banner
  *"A download package can contain up to 80 photos. Larger selections need to be downloaded as several
  packages."* So the cart is capped at **80 items per package**; larger carts split into multiple packages.
  This constrains the download-reduction/packaging service (D2 / SKODA-902), enforce the 80-item split.
- **Cart page grouping:** items are grouped by media type (e.g. an "Images" group heading); each item
  reuses the listing tile (`.media-cart-item.search-results-item`). "Your packages" (`data-action=showHistory`)
  opens saved/previous packages, a package-history feature, confirm scope with the technical team.

## 4. Responsive behavior

- Floating cart badge is fixed size (`58px` icon, `24px` count) at all bands.
- Add affordance is fixed `40x40` at all bands (icon button).
- Cart page: the `25%` sidebar (panel context) collapses to full-width above the item list on narrow
  viewports (source uses the `.media-cart:not(body)` float rule for the in-page 4-col context; the
  standalone `body.media-cart` page stacks). Item rows are always full-width (`flex:0 0 100%`).
- Size dropdown flips to `left:0` inside media-box / carousel contexts
  (`.search-results.media-box .media-cart-action-multi-container{left:0}`;
  `.promo-box .flickity-viewport … {bottom:0}`).

## 5. Interaction states

- **Add hover/focus/active:** background `#f1f1f1` (· `a.media-cart-action:hover/:focus/:active` ·)
  (matches `--dropdown-hover-bg` candidate `#f1f1f1`).
- **Added (in cart):** the asset `<article>` gains **`.in-cart`**; its `.article-teaser-media:after`
  overlay animates opacity `0 -> 1` (content `\e02f`, background `rgba(0,0,0,.4)` full-cover scrim,
  color `#fff`, font-size `4rem` -> `3rem` when in-cart, transition `all .3s cubic-bezier(.68,-.55,.27,1.55)`,
  `transition-delay .3s`). So the "added" feedback is a **large centered check/cart glyph over a 40%
  dark scrim** on the thumbnail (· measured: adding asset `453936` -> article class `in-cart`, badge -> "1").
- **Remove:** `[data-action=remove]` icon `\e034`; in the cart context add/download are hidden and only
  remove + link show, stacked vertically, right-aligned (`justify-content:flex-end`).
- **Size dropdown open:** `.media-cart-action-multi.is-active` -> container `display:block`
  (box-shadow, z-index 15).
- **Cart action buttons:** `mr-media-cart-button` hover -> bg `#78faae`, color `#fff`.
- **Limit:** `skoda-media-cart-limit` is a JS config value; **no visual limit indicator / "cart full"
  message found in the CSS**, flag to design (recommend a count "N / limit" + a disabled-add state).

## 6. Accessibility

- Add button: real `<button aria-pressed="true|false" aria-label="Add {title} to downloads">`, source
  ships only `title="Add/remove this"` (no `aria-pressed`, no per-asset name). Fix in rebuild.
- "Added" state must not be conveyed by the scrim glyph + color alone; reflect it via `aria-pressed`
  and a text label change.
- Floating cart badge: `<a aria-label="Downloads cart, N items">`; update the accessible name (not just
  `data-count`) so screen readers hear the count. `aria-live` region on add/remove.
- Cart page: item list as `<ul>`; each remove `<button aria-label="Remove {title}">`; "Download
  package" / "Empty package" real `<button>`s; empty state is readable text, not a `2em` grey glyph only.
- Size dropdown: `<button aria-expanded aria-controls>` + list; keyboard + `Esc`.
- Visible `:focus-visible` ring on every control.

## 7. EDS target

Block `media-cart` (the cart page) + a shared `media-cart-action` decorator attached to card/download
toolbars. Cart state in `localStorage` for guests (id + size per item); a small module exposes
`add/remove/list/clear` + a `cart:change` event that updates the floating cart badge `data-count` and any
`.in-cart` markers. "Download package" calls the packaging endpoint. Reuse `cards-toolbar` for the
affordance row and card-teaser markup for cart item rows.

### `Media Cart` block config table (DA authoring)

| key | example | meaning |
|---|---|---|
| `media-cart` | | block name (row 1, cart page) |
| `sizes` | `Original, 1920px` | offered download sizes (label + `data-size`) |
| `limit` | `50` | max items (from `skoda-media-cart-limit`) |
| `endpoint` | `/mediakit/v1/download` | packaging/download endpoint |

The per-asset affordance is not authored per-card; the `media-cart-action` decorator adds it to any
`cards-toolbar` cell carrying `data-action`/`data-id`/`data-size` (produced by `listing` / `downloads`).

### `decorate()` outline

1. **Affordance decorator:** for each `a[data-action=add]`, render a round SVG `+` button
   (`aria-pressed`, `aria-label`); on click toggle `localStorage` cart + the article's `.in-cart` +
   dispatch `cart:change`. If `data-size` variants exist, render the size dropdown
   (`aria-expanded`, `Original`/`1920px`).
2. **Floating cart badge:** on `cart:change`, set `data-count` (blank when 0) + update `aria-label`;
   red count bubble via CSS `::after`.
3. **Cart page block:** read cart from `localStorage`; render `<ul>` of item rows (card-teaser markup,
   remove + link stacked); a sidebar with "Download package" / "Empty package" / "Your packages"
   (bordered `.btn`, hover `--skoda-green-emerald`). Empty -> readable empty message + a "browse media"
   link. Enforce `limit` (disable add + show "N / limit").
4. CSS scoped to `.media-cart` / `.media-cart-action`; tokens only.

## 8. Open decisions + recommended default

- **Cart storage:** `localStorage` guest cart for M1 (assumption to confirm); server/session cart +
  signed download URLs later (SKODA-505 behavior).
- **Cart surface:** source uses a **dedicated page** (`/en/media-cart/`). Recommend keeping a page for
  parity, optionally a slide-in drawer as an enhancement (assumption to confirm).
- **Limit UX:** source has no visible limit indicator. Recommend "N / limit" next to the badge + a
  disabled add-state at the cap.
- **Sizes:** default `Original` + `1920px` (measured).
- **Bulk multi-select (enhancement, not in source):** the source has no select-all / bulk-add; users
  add assets one by one. If the client wants faster bulk selection (checkbox mode + "add selected"), it
  is a net-new EDS affordance, confirm as a requirement before building. Default: match source
  (per-asset add + package download).
- **New tokens:** `--cart-badge-bg: #ff6666`, `--cart-added-scrim: rgb(0 0 0 /.4)`,
  `--cart-dropdown-shadow: 0 3px 8px rgb(0 0 0 /.15)`; reuse `--pill-radius: 50px`,
  `--dropdown-hover-bg: #f1f1f1`, `--skoda-green-emerald #78faae`, `--btn-bordered-radius: .2em`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Floating cart badge: `.media-cart-icon` / all / `58px` round, cart glyph; count `::after` red `#f66`
      `24px` circle, white `2px` border, top-right, `attr(data-count)`; hidden at 0.
- [ ] Add affordance: `a.media-cart-action.add` / all / round `40x40`, radius `50px`, bg `#fff`,
      border `2px #161718`, `+` icon.
- [ ] Add hover/focus/active: / all / bg `#f1f1f1`.
- [ ] **Added state:** `article.in-cart .article-teaser-media` / all / dark scrim `rgb(0 0 0 /.4)` +
      centered glyph, opacity `1`, `3rem`, transition `.3s cubic-bezier(.68,-.55,.27,1.55)` delay `.3s`;
      `aria-pressed=true`.
- [ ] Badge count: after add / all / `data-count` increments (measured 0 -> "1"); after remove -> back.
- [ ] Size dropdown: / all / "Original" + "1920px"; bg `#fff`; shadow `0 3px 8px rgb(0 0 0 /.15)`;
      row hover `#f1f1f1`.
- [ ] Cart page: `body.media-cart` / all / title "Your downloads"; item rows full-width; remove + link
      stacked; add/download hidden.
- [ ] Cart buttons: `.mr-media-cart-button` / all / bordered pill, "Download package" (\e012) /
      "Empty package" (\e034) / "Your packages"; hover bg `#78faae`, color `#fff`.
- [ ] Empty cart: `.empty-cart-message` / all / centered, `2em`, muted; readable text.
- [ ] A11y: add is `<button aria-pressed aria-label>`; badge `aria-label` reflects count; `aria-live`
      on change; remove/download-all real buttons; `:focus-visible` ring; state not color-only.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/media-cart/`: `1280-add-affordance.png` (media-room asset grid + floating cart badge showing "1"),
`1280-cart-page.png` (the "Your downloads" page: Download package / Empty package / Your packages +
item rows). Added-state close-up (`.in-cart` scrim glyph) and 1024/768/mobile captures pending.
