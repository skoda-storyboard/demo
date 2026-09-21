# Component Spec: Header / Mega-menu (desktop)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; screenshots saved). Covers the
desktop state (>= 1080px). The <= 1079px drawer is specified in [`mobile-nav.md`](mobile-nav.md); the
locale control in [`language-switcher.md`](language-switcher.md). All three target the one
`blocks/header` block + `/nav` fragment.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Site header, a two-row header (utility topbar + main nav) with hover-open dropdown
  panels. The panels are single-column link lists, not full-width mega-panels (see §2/§3).
- **EDS block(s):** `header` (the single vendored `blocks/header/*` block, fed by the `/nav`
  fragment via `getMetadata('nav')`).
- **Client PDF IDs:** COM-01 (Header/Topbar), COM-02 (Main navigation), COM-03 (Mega-menu / dropdown
  panels), COM-04 (Section switcher Stories <-> Media Room).
- **Ticket:** SKODA-301.
- **Source reference:** `https://www.skoda-storyboard.com/en/` (header region).
- **Top-level selectors:** `header.header` > `.topbar` (utility row) + `.container` > `.brand`
  (logo) + `nav.topnav` (`ul#primary_top_menu.menu` > `li.menu-item` [`.menu-item-has-children`] >
  `ul.sub-menu`; plus `.search-bar`, `.lang-links`, `button.menu-toggle`).

## 2. Source anatomy

```
header.header                              (h 108px; position:relative — NOT sticky; z-index 20)
├── .topbar                                (h 44px; bg #e6e6e6; z-index 10)
│   ├── .container                         (flex; align-center; max-width 1248px; margin 0 16px; pad 0 10px)
│   │   ├── ul.section-nav                 (Stories | Media Room — the section switcher, COM-04)
│   │   │   ├── li.active > a  "Stories"   (active = white tab, weight 400)
│   │   │   └── li > a        "Media Room"
│   │   └── .right-section                 (flex; margin-left:auto → flush right)
│   │       ├── div  "Subscribe to our stories"  (toggles .topbar__dropdown newsletter)
│   │       └── .lang-links                (span[current] + 5 <a> locales — see language-switcher.md)
│   └── .topbar__dropdown                  (hidden newsletter form; opened by "Subscribe")
└── .container                             (h 64px; flex; position:relative; max-width 1248px)
    ├── .brand > a.logo > svg              (ŠKODA STORYBOARD wordmark; viewBox 0 0 255.19 23.1 ≈ 11:1)
    └── nav.topnav                         (flex; align-center; h 64px)
        ├── ul#primary_top_menu.menu       (flex; padding-right 4rem for the search icon)
        │   └── li.menu-item[.menu-item-has-children] > a
        │       └── ul.sub-menu            (single-column dropdown; position:absolute; top:100%)
        │           └── li.menu-item > a   (NO nested .sub-menu — only one level; NO images/desc)
        ├── .search-bar                    (absolute right; 3rem icon → expands to 50% on focus)
        ├── .lang-links                    (display:none on desktop; shown only in mobile drawer)
        └── button.menu-toggle "Menu"      (display:none on desktop; the hamburger, see mobile-nav.md)
```

**8 authored top-level items**, but desktop shows **7**: Models (drop, 14), eMobility, Lifestyle
(drop, 4), Škoda World (drop, 6), Series, Škodapedia, Podcast. **Newsletter carries
`li.newsletter-menu` and is `display:none` at `min-width:1080px`** (· `.header .topnav .menu
.newsletter-menu` · desktop), it appears **only** in the mobile drawer. On desktop the newsletter CTA
is the topbar "Subscribe to our stories" instead.

**Exact drop-panel children** (· each `li.menu-item-has-children > ul.sub-menu > li` · 1280):
- **Models (14):** Models (overview), Fabia, Scala, Octavia, Superb, Kamiq, Karoq, Kodiaq, Epiq,
  Peaq, Elroq, Enyaq, Classic Cars, Concepts.
- **Lifestyle (4):** Lifestyle (overview), People, Sports, Adventures.
- **Škoda World (6):** Škoda World (overview), Innovation & Technology, Design, Responsibility,
  Corporate Life, Heritage.

**Libraries / patterns to retire:** the WordPress `wp-nav-menu` markup (`menu-item-*` id/class noise),
the `skoda-bnr-icons` icon-font (glyphs `\e01f` hamburger, `\e010` close, `\e007/\e00a` accordion
chevrons, search) → replace with inline SVG via `decorateIcons`; jQuery menu-toggle handlers; the
search-bar expand JS (out of scope for SKODA-301, tracked separately).

## 3. Measured visual spec

All rows: `measured (selector · viewport) -> token`. Source URL for every row:
`https://www.skoda-storyboard.com/en/`. Viewport `1280` = desktop band (>= 1080).

### Header shell
- header height: `108px` (· `header.header` · 1280) -> `--nav-height` (44 topbar + 64 main).
- **position: `relative`; the header scrolls away with the page, NOT sticky/fixed** (· `header.header`
  · scrollY 600 -> `top:-600`). No scroll-shrink. z-index `20`.

### Topbar (utility row, COM-01)
- height `44px`; background `#e6e6e6` (· `.topbar` · 1280) -> `--skoda-grey-200`; z-index `10`.
- inner `.container`: `display:flex; align-items:center`, `max-width 1248px` -> `--content-max-width`,
  `margin 0 16px` (-> `--spacing-m`), `padding 0 10px`.
- **section-nav** `ul`: `display:flex`, height `44px`, sits inside `.topbar > .container`. `li`
  `font-size .875rem = 14px` -> `--body-font-size-s`, text-align center. **Measured link (`a`) weight is
  `600`** -> `--weight-semibold` for **both** tabs (· `.topbar .section-nav li a` · 1280 and 500); the
  `li 700`/`li.active a 400` CSS rules are overridden, computed glyph weight is 600.
  - `li.active` (current section, e.g. "Stories"): **white segment** background `#fff` -> `--skoda-white`,
    link color `#000` -> `--skoda-black`.
  - inactive `li` (e.g. "Media Room"): transparent segment (shows the `#e6e6e6` topbar through), link
    color `#7c7d7e` -> `--skoda-grey-500` (· `.topbar .section-nav li a` · 1280).
  - **Per-breakpoint reflow (this is the switcher's key responsive behavior, verified live 2026-09-15):**
    - **>= 1080 (desktop):** left-aligned auto-width pair (`li` ~90px "Stories" / ~125px "Media Room",
      `display:inline-block`) at the **left end** of the 44px grey utility bar; "Subscribe" + 6 locale
      links fill the right end (`right-section`, `margin-left:auto`). `ul.section-nav` box ~`214px` wide.
    - **<= 1079 (tablet/mobile):** the switcher **expands to a full-width 50/50 segmented tab bar** at the
      very top of the page (`ul` = `100vw`, each `li` = exactly 50%: `384px` @768, `250px` @500),
      `display:flex`, `h44`, tabs centered. The right-section (Subscribe + locales) is **removed from the
      bar and folded into the hamburger drawer** (see [`mobile-nav.md`](mobile-nav.md)); the hamburger
      appears on the brand row below. Same DOM at every width, pure CSS restyle (parent stays
      `.topbar > .container` at 500). Screenshots: `assets/header-megamenu/switcher-desktop-1280.png`,
      `.../switcher-mobile-500.png`.
- **right-section**: `display:flex; margin-left:auto` (flush right, desktop only). Holds "Subscribe" +
  `.lang-links`; **relocates into the drawer below 1080** (see reflow above).

### Main nav row (COM-02)
- inner `.container`: height `64px` -> `--nav-main-height`, `display:flex`, `max-width 1248px`,
  `position:relative` (the dropdown anchor).
- **brand/logo**: `.brand` `256×64`, `flex; align-items:center`. Logo `svg` renders `194×18`
  (· `.brand a.logo svg` · 1280); viewBox `0 0 255.19 23.1`. Matches `header.css` sizing (194×18).
- **`#primary_top_menu`**: `display:flex`, `padding-right 4rem` (`64px`, reserves the search icon slot).
- **top-level `li > a`**: `display:flex; align-items:center`, `padding 0 20px` (· `.topnav .menu >
  .menu-item > a` · 1280), font-size `1em` = `16px` -> `--body-font-size-m`, line-height `1.5em`
  = `24px`, color `inherit` = `#161718` -> `--skoda-ink`, `max-width 15em` (240px), letter-spacing
  `.002em`, weight `400`.
- **caret** (drop items): `::after` chevron in the right padding (source uses `padding-right` slack;
  EDS reproduces with a border-triangle `::after`, see `header.css`).

### Dropdown panel (`ul.sub-menu`, COM-03)
Measured with the panel forced open (`li.active`) at 1280:
- **single column** (first item left == last item left; · Models panel · 1280). Width = parent item
  width, `min-width:100%`; child links `max-width 15em` (240px). Models = 14 rows × 48px = `696px` tall.
- `position:absolute; top:100%` (opens at `y=108`, flush under the header), `background #fff`
  -> `--skoda-white`, color `#161718` -> `--skoda-ink`.
- box-shadow `0 3px 8px rgba(0,0,0,.15)` (· `.topnav .menu > .menu-item > .sub-menu` · 1280) -> **no
  token; candidate `--dropdown-shadow`** (distinct from `--card-shadow`).
- border-radius `4px` -> **no token; candidate `--dropdown-radius: 4px`** (distinct from `--card-radius`
  8px).
- panel `padding 0`; child `li > a` `padding 12px 24px` (`--spacing-s` / `--spacing-l`), height `48px`,
  font-size `16px` -> `--body-font-size-m`.
- **only one level**, `.sub-menu .sub-menu { display:none }` (· 1280). No third level, no
  images/descriptions.

## 4. Responsive behavior

- **Primary switch is `1080px`** (· `.header .topnav` · source CSS): at `min-width:1080px`
  `.header .topnav { overflow:visible; height:auto }`; below `1080` (`max-width:1079px`)
  `.header .topnav { overflow:hidden; height:0 }`, `.menu > .menu-item { display:none }`, and
  `button.menu-toggle` shows. So desktop nav >= 1080; hamburger drawer <= 1079 (see
  [`mobile-nav.md`](mobile-nav.md)).
  - **Parity fix:** the current EDS `header.js` uses `matchMedia('(min-width: 900px)')` and `header.css`
    keys `@media (width >= 900px)`. **Change the desktop threshold to `1080px`** to match source (and
    the `_FOUNDATIONS` §1 ladder: 1080 = desktop).
- Topbar (`44px`) is shown at **all** widths in source (· `.topbar` · 500 -> `display:block; h44`), but
  its content **changes across the 1080 breakpoint**: desktop = section switcher (left) + Subscribe/locales
  (right); below 1080 = **section switcher only, expanded to a full-width 50/50 tab bar**, with
  Subscribe/locales moved into the drawer (see the section-nav reflow in §3 and
  [`mobile-nav.md`](mobile-nav.md)). The current EDS `header.css` hides the topbar entirely below 900
  (`.nav-topbar { display:none }`), which **drops the section switcher on mobile, a fidelity bug to fix**:
  keep the grey bar visible on mobile and render the switcher as the full-width 50/50 tab bar.
- Content caps at `1248px` -> `--content-max-width` at both rows.

## 5. Interaction states

- **Panel open = hover** (· `.topnav .menu > .menu-item:hover > .sub-menu` · 1280): `opacity 0 -> 1`,
  `max-height 0 -> 999em`; transition `opacity .1s ease-in-out` (height snaps). Also opens on `:focus`
  / `:active` / `.active`. Closes when the pointer leaves the item.
- **One-panel-at-a-time:** panels are per-item and mutually exclusive by hover (only the hovered item's
  panel is open). The EDS build must enforce this explicitly for click/keyboard (source relies on CSS
  hover; `header.js` already closes others via `toggleAllNavSections`).
- **Top-level link hover:** animated underline, `a::before` grows `height 0 -> 2px`, `background
  #161718`, `width calc(100% - 40px)` centered, transition `all .2s ease-in` (· `.topnav .menu >
  .menu-item:hover > a::before` · 1280). Item background stays `#fff`; **color does NOT change**.
  - **Divergence:** EDS `header.css` uses `a:hover { color: var(--skoda-green) }`. Source uses a 2px ink
    underline, no color shift. Align EDS to the underline (or confirm the green as an intentional
    upgrade).
- **Dropdown item hover:** background `#f1f1f1` (· `.sub-menu > .menu-item:hover` · 1280) -> **no exact
  token; nearest `--skoda-grey-100` `#f5f5f5`; candidate `--dropdown-hover-bg: #f1f1f1`** (EDS currently
  uses grey-100, acceptable, flag the 4-unit delta).
- Section-nav: active tab is white; inactive links grey/ink (topbar treatment).

## 6. Accessibility

- Top-level drop items must expose state: real disclosure semantics with `aria-expanded` +
  `aria-controls` on the trigger and `role`-appropriate panel. Source relies on CSS `:hover` only (no
  ARIA on the `<li>`). EDS `header.js` already sets `aria-expanded` on `.nav-drop`, keep and wire it to
  hover + keyboard.
- **Keyboard:** Tab to each top-level item; Enter/Space toggles its panel; Arrow keys move within the
  open panel (enhancement); Escape closes and returns focus to the trigger (`header.js` `closeOnEscape`
  already does this at desktop).
- Provide a visible `:focus-visible` ring on every link (source has none).
- Logo link needs an accessible name ("Škoda Storyboard, home"); the SVG wordmark must carry `alt`/
  `aria-label` (icon token render).
- Hover-only reveal is not sufficient alone, the panels must also be operable by keyboard and not
  vanish on the intent gap (add a small close delay).

## 7. EDS target

Single block `blocks/header/*`, fed by the `/nav` fragment (`getMetadata('nav')`). Authoring model is
the **nav fragment**, edited in DA as a document, not a block table.

### DA / fragment authoring model (`/nav` document)

Four content rows (the `header.js` `hasTopbar` path, `children.length >= 4`):

1. **Topbar row** (utility): a paragraph with the section switcher links (`Stories`, `Media Room`) and a
   second paragraph with `Subscribe` + the locale list (see language-switcher.md). Decorated to
   `.nav-topbar`, lifted above `<nav>` as a full-width grey bar.
2. **Brand row:** the logo icon token `:skoda-storyboard-logo:` linked to `/en/`. -> `.nav-brand`.
3. **Sections row:** a nested list, each top-level item is an `<li>`; drop items carry a child `<ul>`
   of links. -> `.nav-sections`; `header.js` adds `.nav-drop` to any `<li>` that contains a `<ul>`.

   ```
   - [Models](/en/category/models/)
     - [Models](/en/category/models/)
     - [Fabia](…)  … [Enyaq](…)  - [Classic Cars](…)  - [Concepts](…)
   - [eMobility](/en/category/emobility/)
   - [Lifestyle](/en/category/lifestyle/)  (+ People / Sports / Adventures)
   - [Škoda World](…)  (+ Innovation & Technology / Design / Responsibility / Corporate Life / Heritage)
   - [Series](…) - [Škodapedia](…) - [Podcast](…) - [Newsletter](#)  (mobile-only; hide >=1080)
   ```
4. **Tools row:** search + (optional) locale mirror. -> `.nav-tools`.

### `decorate()` outline (consistent with `blocks/header/header.js`)

- `loadFragment(getMetadata('nav') || '/nav')`; move fragment children into a new `<nav id="nav">`.
- Detect 4-row (topbar present) vs 3-row by `nav.children.length >= 4`; tag rows `topbar/brand/sections/
  tools`.
- Lift `.nav-topbar` out of `<nav>` into `.nav-wrapper` so it renders as a full-width grey bar (44px).
- For each `.nav-sections .default-content-wrapper > ul > li` with a child `<ul>`: add `.nav-drop`,
  wire click to `toggleAllNavSections` (one-panel-at-a-time) + `aria-expanded`.
- **Set the desktop matchMedia to `(min-width: 1080px)`** (not 900) and mirror in `header.css`.
- Hide the Newsletter `<li>` at `>= 1080` (desktop), show in drawer.
- `decorateIcons(block)` for the logo + search glyphs (replace icon-font).

## 8. Open decisions + recommended default

- **Desktop breakpoint:** adopt `1080px` (assumption: match source; confirm vs the 900 currently in
  the block). Recommended default: **1080**.
- **Topbar on mobile:** recommend keeping the grey bar visible at all widths (source behavior); confirm
  vs the current EDS `display:none < 900`.
- **Hover color:** recommend the source 2px ink underline over the current green color-swap; confirm.
- **New tokens** (assumption to confirm): `--nav-topbar-height: 44px`, `--dropdown-radius: 4px`,
  `--dropdown-shadow: 0 3px 8px rgb(0 0 0 / 15%)`, `--dropdown-hover-bg: #f1f1f1`,
  `--body-font-size-2xs: 12px` (topbar/lang), and define `--skoda-grey-500: #7c7d7e` (already flagged
  in `_FOUNDATIONS` §8).

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en` render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Header height: `header` / desktop / `108px` (topbar 44 + main 64) -> `--nav-height`.
- [ ] Topbar: `.nav-topbar` / desktop / height `44px`, bg `#e6e6e6` (`--skoda-grey-200`); content
      capped at `1248px`, flush-right utility group.
- [ ] Sticky: `header` / all / **not sticky**, scrolls away with page (position relative).
- [ ] Main nav: `nav` / desktop / height `64px`; items `16px/24px` weight `400`, side padding `20px`.
- [ ] Item count: desktop shows **7** top-level items (Newsletter hidden); drawer shows 8.
- [ ] Drop panel: `.nav-drop[aria-expanded=true] > ul` / desktop / single column, bg `#fff`, radius
      `4px`, shadow `0 3px 8px rgb(0 0 0 /.15)`, item rows `48px`, link padding `12px 24px`.
- [ ] Panel children exact: Models 14, Lifestyle 4, Škoda World 6 (enumerated in §2).
- [ ] Hover: top-level link / desktop / 2px ink underline animates in over `.2s`; panel opacity `0->1`
      over `.1s`; only one panel open at a time.
- [ ] Item hover bg: dropdown row / desktop / `#f1f1f1` (or `--skoda-grey-100`).
- [ ] Section switcher (COM-04): active tab = white segment `#fff`, link `#000`; inactive = transparent
      over `#e6e6e6`, link `#7c7d7e` (`--skoda-grey-500`); both `14px`/weight `600`.
- [ ] Section switcher reflow: `>=1080` left-aligned auto-width pair in the grey utility bar (Subscribe +
      locales flush right); `<=1079` **full-width 50/50 centered tab bar**, `44px` tall, at the top, with
      Subscribe/locales moved into the drawer and the hamburger on the brand row. The switcher must NOT be
      hidden on mobile.
- [ ] A11y gate: each drop item has `aria-expanded`/`aria-controls`; Enter/Space toggles; Escape closes
      + returns focus; visible `:focus-visible` ring; logo has accessible name. Keyboard-only pass.
- [ ] Visual diff vs source at 1280/1024 (both desktop band) <= 2% per-pixel (excluding logo AA).

## 10. Reference screenshots

`assets/header-megamenu/`: `1280-closed.png` (header at rest), `1280-models-open.png` (Models dropdown
open). 1024 band shares desktop layout (>= 1080 is the only desktop step; 1024 falls into the drawer
band, see mobile-nav.md).
