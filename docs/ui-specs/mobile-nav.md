# Component Spec: Mobile Navigation (drawer)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; screenshots saved). Covers the
`<= 1079px` state (hamburger + full-height drawer). Desktop is in
[`header-megamenu.md`](header-megamenu.md); the locale control in
[`language-switcher.md`](language-switcher.md). Same block/fragment: `blocks/header` + `/nav`.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Mobile/tablet navigation, a hamburger `button.menu-toggle` that opens a full-height
  vertical drawer with accordion sub-menus.
- **EDS block(s):** `header` (`blocks/header/*`; the `.nav-hamburger` + drawer states).
- **Client PDF IDs:** COM-02 (navigation, mobile state).
- **Ticket:** SKODA-302.
- **Source reference:** `https://www.skoda-storyboard.com/en/` (viewport <= 1079px).
- **Top-level selectors:** `button.menu-toggle` (hamburger), `body.menu-open` (open flag),
  `nav.topnav` (the drawer container when open), `li.menu-item-has-children.open > ul.sub-menu`
  (expanded accordion section).

## 2. Source anatomy

```
header.header                        (108px; topbar 44 + main row 64 stay visible)
├── .topbar (44px)                   (grey utility bar — stays on screen at mobile)
│   └── ul.section-nav               (FULL-WIDTH 50/50 tab bar below 1080: Stories | Media Room,
│                                     each li 50%, centered, h44; active=white segment, inactive=grey.
│                                     Subscribe/locales are NOT here on mobile, they move into the drawer.
│                                     See header-megamenu.md §3 reflow — this is a per-breakpoint change.)
├── .container (64px)
│   ├── .brand > a.logo > svg        (wordmark)
│   ├── nav.topnav                   (COLLAPSED at rest: overflow:hidden; height:0)
│   │   ├── ul#primary_top_menu.menu (each li display:none until body.menu-open)
│   │   │   └── li.menu-item[.menu-item-has-children] > a
│   │   │       ├── a::before        (accordion chevron, icon-font \e007 down / \e00a up when .open)
│   │   │       └── ul.sub-menu      (accordion; max-height 0 -> 99em when .open)
│   │   ├── .newsletter-menu li      (SHOWN in drawer; hidden on desktop)
│   │   ├── .search-bar              (shown in drawer)
│   │   └── .lang-links              (shown at drawer bottom — see language-switcher.md)
│   └── button.menu-toggle "Menu"    (the hamburger)
```

- **The hamburger is a real `<button>`, NOT a CSS checkbox-hack.** Measured markup:
  `<button type="button" class="menu-toggle">Menu</button>` (· `.menu-toggle` · all mobile). The only
  checkbox inputs in the header (`mailguide_terms_dropdown`, `topbar-newsletter-email`) belong to the
  newsletter form, not the nav. **Correction to prior analysis:** it is a JS-toggled button, and its
  a11y gap is missing ARIA state, not a checkbox hack (see §6).
- Open state is driven by a `menu-open` class on `<body>` and an `open` class on each expanded
  `li.menu-item-has-children`, both toggled by JS. No `<input>`/`<label for>` involved.
- **Libraries/patterns to retire:** jQuery toggle handlers; `skoda-bnr-icons` icon-font glyphs
  (`\e01f` hamburger, `\e010` close X, `\e007/\e00a` accordion chevrons) → inline SVG via
  `decorateIcons`; `text-indent:-9999px` label technique (replace with visually-hidden text or
  `aria-label`).

## 3. Measured visual spec

All rows: `measured (selector · viewport) -> token`. Source URL:
`https://www.skoda-storyboard.com/en/`. Mobile band sampled at `500` (< 768); layout identical across
the whole `<= 1079` band (single drawer step).

### Hamburger (`button.menu-toggle`)
- size `68 × 64px` (`4.25rem × 4rem`) (· `.menu-toggle` · 500); `position:absolute; top:0; right:0`
  (top-right of the 64px main row), background `#fff` -> `--skoda-white`, color `#161718` -> `--skoda-ink`.
- icon: icon-font `::after` `\e01f` (hamburger) → `\e010` (close X) when `body.menu-open`. `outline:0`
  (a11y regression, restore a focus ring). Label text "Menu" hidden via `text-indent:-9999px`.
- shown `<= 1079px`; `display:none` at `>= 1080` (· `.header .menu-toggle` · desktop).

### Drawer at rest (closed)
- `nav.topnav`: `overflow:hidden; height:0` (· `nav.topnav` · 500, closed), collapsed; each
  `li.menu-item` is `display:none`. Only the topbar, logo, and hamburger are visible.

### Drawer open (`body.menu-open`)
- `nav.topnav`: `height: calc(100% - 6.75rem)` (`100% - 108px`, i.e. viewport minus the header),
  `overflow-y:auto`, `flex-direction:column`, `align-items:flex-start` (· `.menu-open .header .topnav`
  · 500). Full-height scrolling panel below the 108px header.
- **scroll lock:** `.menu-open body, html.menu-open { overflow-y:hidden }` (· 500).
- **top-level rows:** `a` `padding 1rem 1rem 1rem 1.5rem`, font-size `1.125rem` = `18px`
  -> `--heading-font-size-s`, line-height `1.75rem` (28px), weight `300` -> **candidate `--weight-light:
  300`** (flagged in `_FOUNDATIONS`), letter-spacing `.02rem`, `border-bottom 1px solid #e4e4e4`
  (· `.menu-open .header .topnav .menu > .menu-item > a` · 500). Last item: no border.
  - `#e4e4e4` -> **no exact token; near `--skoda-grey-200 #e6e6e6`; candidate `--divider-color:
    #e4e4e4`**.
- **accordion chevron:** `li.menu-item-has-children > a::before` icon-font `\e007` (down) at `right:16px`,
  width `1.5rem`; becomes `\e00a` (up) when `.open`.
- **sub-menu (accordion body):** `.open > .sub-menu` `opacity 0->1`, `max-height 0 -> 99em`, transition
  `all .2s ease-in-out` (properties opacity + max-height) (· 500). Sub-menu items background `#f1f1f1`;
  child `a` `padding 1em 2.5rem` (16px / 40px), hover `text-decoration:underline`.
- **Newsletter** row is present here (hidden on desktop). **search-bar** shows full-width
  (`margin 0 1rem 0 1.5rem`). **lang-links** sit at the drawer bottom (`order:2`, see
  language-switcher.md).

## 4. Responsive behavior

- **Single breakpoint: `1080px`.** `<= 1079px` = hamburger + drawer; `>= 1080px` = desktop nav (see
  header-megamenu.md). One drawer state across the whole mobile/tablet band, 768 and 1024 both render
  the drawer, not the desktop bar. Confirmed: `.header .topnav { height:0 }` below 1080 and
  `.menu-toggle { display:none }` only at `>= 1080`.
- **Parity fix (same as header spec):** current EDS `header.js` uses `matchMedia('(min-width: 900px)')`
  and `header.css` `@media (width >= 900px)`. **Change to `1080px`** so the drawer band matches source
  (a 1024px viewport currently gets desktop nav in EDS but the drawer in source).
- Header height stays `108px` in the drawer; the drawer fills `100dvh - 108px`.

## 5. Interaction states

- **Open:** tap hamburger → `body.menu-open` added; nav expands `height 0 -> calc(100% - 108px)`; icon
  flips to close X; body scroll locks. **Close:** tap the X (same button).
- **Accordion:** tap a parent row → `.open` toggled on its `<li>`; sub-menu expands `max-height 0 ->
  99em` over `.2s`; chevron flips. Multiple sections can be open at once (source does not auto-collapse
  siblings, confirm desired behavior; recommend single-open for tidiness, assumption to confirm).
- Sub-menu link hover: underline.
- No transition on the drawer container width; it is a height/overflow reveal.

## 6. Accessibility, CONFIRMED DEFECTS + required rebuild

**Measured source defects** (· `.menu-toggle` · mobile):
- `aria-expanded` = **null**, `aria-controls` = **null**, `aria-label` = **null** (the accessible name
  comes only from the `text-indent`-hidden text "Menu"). Screen-reader users get no open/closed state.
- `outline:0` on the toggle, no visible focus.
- Accordion parents are `<a href>` (category links) that JS repurposes to toggle, no `role="button"`,
  no `aria-expanded`, no keyboard toggle contract; tapping is ambiguous (navigate vs expand).
- No focus trap, no focus return, no Escape handler, no click-outside close in the source drawer.

**Required accessible rebuild (SKODA-302 acceptance):**
- Hamburger = real `<button type="button">` with `aria-expanded` (toggled true/false), `aria-controls`
  pointing at the drawer `id`, and an `aria-label` ("Open navigation" / "Close navigation"). The EDS
  boilerplate `header.js` **already does this** (`.nav-hamburger button` with `aria-controls="nav"` +
  `aria-label`), so the rebuild is largely keeping the EDS pattern and dropping the source markup.
- Each accordion trigger = a `<button aria-expanded aria-controls>` (or the `<li>`/`<a>` gets
  `aria-expanded` wired as in `header.js` `toggleAllNavSections`), toggled on Enter/Space.
- **Keyboard:** Enter/Space toggles; **Escape** closes the drawer and returns focus to the hamburger
  (`header.js` `closeOnEscape` + `nav.querySelector('button').focus()` already implement this at the
  mobile branch).
- **Focus trap** while open: Tab cycles within the drawer; on close, focus returns to the hamburger.
  (Add, `header.js` currently uses `closeOnFocusLost` rather than a true trap; upgrade to a trap.)
- **Click-outside / overlay** to dismiss (add, not in source or current block).
- Body scroll lock while open (`header.js` sets `document.body.style.overflowY = 'hidden'`; keep).
- Provide a visible `:focus-visible` ring throughout.

## 7. EDS target

Same `blocks/header/*` block + `/nav` fragment as header-megamenu.md (one fragment authored once
drives both states). Authoring: the nested `<ul>` in the **sections row** becomes the accordion; the
`.nav-hamburger` button and drawer grid are synthesized by `header.js`.

### `decorate()` outline (consistent with `header.js`)

- Build `<nav id="nav">` from the fragment; classify rows `topbar/brand/sections/tools`.
- Synthesize `.nav-hamburger` = `<button type="button" aria-controls="nav" aria-label="Open
  navigation">` (already in `header.js`); prepend to `<nav>`; `nav.setAttribute('aria-expanded','false')`.
- `toggleMenu(nav, navSections)`: flip `nav[aria-expanded]`, lock body scroll, flip the hamburger label,
  add/remove drawer `tabindex` wiring per band.
- For drop `<li>`s: `.nav-drop` + `aria-expanded` toggled on click/Enter/Space (`toggleAllNavSections`,
  `openOnKeydown` already present).
- **Set `isDesktop = matchMedia('(min-width: 1080px)')`** (currently 900) and mirror the `@media`
  literals in `header.css` to `1080` for the drawer band; keep the `[aria-expanded='true']` grid rules
  (they already build the full-height column drawer with topbar/sections/tools rows).
- CSS: drawer rows font `18px/28px` weight `300`, `border-bottom 1px #e4e4e4`; accordion body items
  `padding 1em 2.5rem`, bg `#f1f1f1`; replace icon-font chevrons with SVG. Add focus trap + overlay in
  JS.

## 8. Open decisions + recommended default

- **Desktop/mobile threshold:** `1080px` (assumption: match source; confirm vs current 900).
- **Accordion multi-open vs single-open:** source allows multiple; recommend **single-open**
  (auto-collapse siblings) for a cleaner drawer, assumption to confirm.
- **Topbar in drawer:** source keeps the grey topbar bar on screen and folds Newsletter into the drawer;
  confirm the demo keeps the topbar visible on mobile (see header-megamenu.md §4).
- **New tokens** (assumption to confirm): `--weight-light: 300`, `--divider-color: #e4e4e4`,
  `--nav-hamburger-size: 68px × 64px` (or reuse `--nav-main-height` for height); `--dropdown-hover-bg:
  #f1f1f1` (shared with desktop panel).

## 9. Pixel-perfect acceptance criteria

Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Hamburger visible: `.nav-hamburger` / <= 1079 / shown; hidden `>= 1080`.
- [ ] Hamburger box: `.menu-toggle` equiv / mobile / `68 × 64px`, top-right, bg `#fff`, ink icon.
- [ ] Closed drawer: `nav` / mobile / collapsed (`height:0`), only topbar+logo+hamburger visible.
- [ ] Open drawer: `nav[aria-expanded=true]` / mobile / full-height column (`100dvh - 108px`),
      overflow-y auto, body scroll locked.
- [ ] Drawer rows: top-level link / mobile / `18px` / line-height `28px` / weight `300`, `border-bottom
      1px #e4e4e4`, last row borderless.
- [ ] Accordion: `.nav-drop.open > ul` / mobile / expands over `.2s`; chevron flips down->up; body items
      bg `#f1f1f1`, links `padding 16px 40px`.
- [ ] Newsletter present in drawer; hidden at desktop.
- [ ] Section switcher on mobile: `.section-nav` / <= 1079 / renders as a **full-width 50/50 tab bar**
      (`h44`, each tab 50%, centered; active white segment / inactive grey) above the brand row, NOT hidden
      and NOT inside the drawer. Subscribe + locales move into the drawer instead. (Full spec:
      header-megamenu.md §3.)
- [ ] A11y gate (blocking): hamburger has `aria-expanded` + `aria-controls` + `aria-label`; accordion
      triggers have `aria-expanded`; Enter/Space toggles; Escape closes + returns focus to hamburger;
      focus trapped while open; click-outside closes; visible `:focus-visible` ring. Keyboard-only +
      screen-reader pass.
- [ ] Breakpoint: switch at exactly `1080px` (not 900).
- [ ] Visual diff vs source at 768 / 500 (both drawer band) <= 2% per-pixel.

## 10. Reference screenshots

`assets/mobile-nav/`: `500-closed.png` (header + hamburger at rest), `500-drawer-open.png` (drawer open
with Models accordion expanded, newsletter + lang-links at the bottom).
