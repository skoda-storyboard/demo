# Component Spec: Language Switcher

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; screenshot saved). Part of the one
`blocks/header` block / `/nav` fragment; see [`header-megamenu.md`](header-megamenu.md) (desktop) and
[`mobile-nav.md`](mobile-nav.md) (drawer) for the rest of the header.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

> **Re-capture (2026-09-30, SKODA-303, Playwright computed styles on the live site).** These values override the
> sections they name.
>
> **Content (§2):**
> - **Fixed order**, not current-first: `EN, CZ, DE, SK, SR, SL`. On `/cs/` the current CZ stays second.
> - **Per page:** the list follows the page's `<link rel="alternate" hreflang>` set.
>   - The home page links all 6 locale homes.
>   - An article links each *translated article* and **omits** locales without one: the Epiq story shows
>     EN / CZ / DE / SK, the Peaq press release EN / CZ / SK.
>   - Media Room: DE goes to the external `https://www.skoda-media.de/`; the others go to `/{locale}/media-room/`.
>   - EDS pilot: static per-locale homes (decision, see §8).
>
> **Desktop topbar (≥1080):**
> - Type: 12px / **18px** line height, uppercase, no letter-spacing, `SKODA Next`. Current `span` **700** ink;
>   links **300** `#7c7d7e`.
> - Spacing: `margin-left` **12px** between items; the row is 149×18, centred in the 44px bar (y 13).
> - Right edge on the content edge: x1334 @1440, 1254 @1280, 1070 @1080. The Media Room (`#f1f1f1` bar) is identical.
>
> **Drawer (≤1079, same at 1079 / 1024 / 768 / 500 / 390 / 375):**
> - Type: 16px / **24px**, **700 for all**, letter-spacing **0.32px**, `margin-left` **24px**.
> - Box: padding `0 16px 24px 24px`, `order: 2`, `align-self: flex-end` (right edge = drawer edge),
>   `margin-top: auto` (pinned to the bottom of the drawer column), **no border**. On a short viewport
>   (375×667) the drawer scrolls and the row stays the last item.
>
> **States:**
> - No hover change (same grey, no underline, cursor pointer); the current `span` has the default cursor.
> - **No focus ring** (`outline: none`), an accessibility gap. EDS adds a visible `:focus-visible` ring.
>
> **Contrast (§6):**
> - The live `#7c7d7e` is 3.30:1 on `#e6e6e6`, 3.65:1 on `#f1f1f1` and 4.12:1 on white, **failing AA** everywhere.
> - EDS uses `--skoda-grey-700` `#5a5b5c`: 5.45 / 6.03 / 6.81:1. The nearest same-hue grey that passes,
>   `#666768` (4.54:1 on `#e6e6e6`), is too close to the limit and isn't a token.

## 1. Identity

- **Component:** Locale switcher, a row of **inline text links**, one per available locale, with the
  current locale shown as non-link bold text. **Not a dropdown / disclosure.**
- **EDS block(s):** `header` (`.lang-links`, lives in the topbar tools region on desktop, at the drawer
  bottom on mobile).
- **Client PDF IDs:** COM-05 (Language switcher).
- **Ticket:** SKODA-303.
- **Source reference:** `https://www.skoda-storyboard.com/en/` (topbar right-section).
- **Top-level selectors:** `.topbar .lang-links` (desktop) and `.topnav .lang-links` (mobile drawer);
  children: `span` (current locale) + `a[href]` (each other locale).

## 2. Source anatomy

```
.topbar .right-section
└── .lang-links                    (display:flex; margin-left:auto → flush right; text-transform:uppercase)
    ├── span "en"                  (CURRENT locale — non-link; ink, bold)
    ├── a "CZ"  → /cs/
    ├── a "de"  → /de/
    ├── a "sk"  → /sk/
    ├── a "sr"  → /sr/
    └── a "sl"  → /sl/
```

- **6 locales**, measured on `/en/`: current `en` (span) + `cs`(labelled "CZ"), `de`, `sk`, `sr`, `sl`
  (anchors). Order: current first, then the rest. All rendered **uppercase** via CSS.
- **Two instances of `.lang-links`** exist: one in the topbar (desktop-visible) and one inside
  `nav.topnav` (mobile-drawer-visible; `display:none` on desktop). Same 6-item content.
- The current locale is a `<span>` (no href); the others are `<a href="https://www.skoda-storyboard.com/
  {locale}/">`. This is the current-locale indicator (bold ink vs grey links).
- **Per-page existence behavior:** on an article, a locale link appears only if the translated article
  exists in that locale (backend/dynamic, WordPress). The home page (measured) exposes all 6. In EDS
  this becomes a per-page decision (see §8).
- **Libraries to retire:** none specific; it is plain markup. Drop the WordPress hreflang plumbing;
  reproduce with an authored/generated list.

## 3. Measured visual spec

All rows: `measured (selector · viewport) -> token`. Source URL:
`https://www.skoda-storyboard.com/en/`.

### Desktop (topbar, `1280`)
- container `.lang-links`: `display:flex; align-items:center; justify-content:flex-end; margin-left:auto`
  (· `.topbar .lang-links` · 1280), flush right in the topbar right-section. Rect `~150 × 18px`.
- items gap: `margin-left: 1em` between children (· `.header .lang-links > * + *` · 1280) ≈ 16px.
- **current locale** `span`: color `#161718` -> `--skoda-ink`, weight `700` -> `--weight-bold`,
  font-size `12px` (`.75em`), text-transform uppercase (· `.topbar .lang-links span` · 1280).
- **other locales** `a`: color `#7c7d7e` -> **`--skoda-grey-500`** (currently undefined; define it, 
  `_FOUNDATIONS` §8), weight `300` -> candidate `--weight-light`, font-size `12px`, uppercase
  (· `.topbar .lang-links a` · 1280).
- font-size `12px` -> **no token; candidate `--body-font-size-2xs: 12px`** (`--body-font-size-xs` is
  13px).

### Mobile (drawer, `500`)
- `.topnav .lang-links`: `display:none` at desktop; shown in the open drawer, `order:2` (below the menu),
  `align-self:flex-end`, `padding 0 1rem 1.5rem 1.5rem` (· `.topnav .lang-links` · 500 drawer).
- items: font-size `1em` = `16px` -> `--body-font-size-m`, uppercase, `margin-left 1.5em` between,
  line-height `1.5`, letter-spacing `.02rem`. current `span` `#161718`/weight `700`; other `a`
  `#7c7d7e`/weight `700` (· `.topnav .lang-links a,span` · 500). (Note: drawer uses weight 700 for all;
  topbar uses 300 for links.)

### Base rule (overridden)
- `.header .lang-links > a { color:#78faae }` (-> `--skoda-green-emerald`) is the base color, but both
  the topbar and drawer context rules override it to grey `#7c7d7e`. So on the rendered page the links
  are grey, not emerald.

## 4. Responsive behavior

- **Placement moves at `1080px`** (the header's one breakpoint): desktop shows the topbar `.lang-links`
  (flush right, 12px); `<= 1079` hides it and shows the drawer `.lang-links` at the bottom of the open
  menu (16px). Same content, two locations.
- No intermediate steps; the topbar bar itself stays visible at all widths in source.

## 5. Interaction states

- Locale `a` hover: inherits the header link treatment; topbar links go from grey `#7c7d7e` toward ink
  on hover (`.topbar a:hover` ink treatment). No underline by default.
- Current locale `span` is inert (no pointer, no href).
- No open/close state (it is not a disclosure). If the EDS rebuild chooses a dropdown (see §8), add
  open/close + Escape.

## 6. Accessibility

- Current locale should be marked `aria-current="true"` (or the anchor set `aria-current="page"` if
  rendered as a self-link). Source uses a bare `<span>`, add the ARIA.
- Each locale link needs a full accessible name, not just the 2-letter code: `lang` + `hreflang`
  attributes on each `<a>` (e.g. `hreflang="cs" lang="cs" aria-label="Čeština"`) so screen readers
  announce the language, not "CZ".
- The visible label stays the uppercase code (brand style); the accessible name carries the full
  language name.
- If kept as inline links: ensure sufficient contrast, `#7c7d7e` on `#e6e6e6` (topbar) is ~2.9:1,
  **below 4.5:1** for the 12px text. **Contrast defect to fix**: darken the inactive locale link (e.g.
  `--skoda-ink` at reduced opacity, or a darker grey) to reach AA.

## 7. EDS target

Part of `blocks/header/*`, authored in the `/nav` fragment. The locale list sits in the **topbar row's
right group** (with "Subscribe"); `header.js` lifts the topbar above `<nav>` and its CSS floats the
`p:last-child` group right (`.nav-topbar p:last-child`).

### DA / fragment authoring model

In the `/nav` document topbar row, second paragraph, author the locales as a link list where the
current locale is plain text (bold) and the rest are links:

```
**EN** [CZ](/cs/) [DE](/de/) [SK](/sk/) [SR](/sr/) [SL](/sl/)
```

- Current locale = `<strong>`/plain text (rendered bold ink); others = links (rendered grey).
- Because EDS is per-locale-path (`/en`, `/cs`, …), the switcher is best **generated per page** from a
  small locale map rather than hand-authored per document (keeps the "current" state correct
  automatically). Author the full list once; the block marks the current one from `document.document
  Element.lang` or the path prefix.

### `decorate()` outline (consistent with `header.js`)

- Within the decorated `.nav-topbar` right group, find the locale link list.
- Determine current locale from the URL path segment (`/{locale}/`) or `getMetadata('locale')`.
- Render the current locale as a non-link `<span aria-current="true">`; the rest as `<a hreflang lang>`
  with full-language `aria-label`.
- Mirror the list into the drawer (`.nav-tools`/drawer bottom) for `<= 1079`.
- Optional: drop a locale whose translated page does not exist (per-page existence; needs a manifest or
  a HEAD check, see §8).

## 8. Open decisions + recommended default

> **Decided (2026-09-30, SKODA-303 pilot):**
> - **Control form:** inline links.
> - **Current locale:** taken from the URL, not the authored `<strong>`.
> - **Targets:** all 6 link the EDS locale homes (`/cs/` …). Only `/en` exists on EDS yet; the others 404 until
>   the locale trees are migrated, a known gap.
> - **Out of the pilot:** per-page translated targets and hiding locales without a translation (SKODA-1003).
> - **Contrast:** inactive links use `--skoda-grey-700`.

- **Control form:** source is **inline links**; recommend keeping **inline links** as the EDS-native
  default (lightest, no JS, matches source). A dropdown/disclosure is only worth it if the locale count
  grows well beyond 6, assumption to confirm with the client (COM-05).
- **Per-page existence:** source hides locales lacking a translation. EDS default recommendation: show
  all configured locales and let the target 404/redirect to the locale home, OR build a per-page locale
  manifest in the query-index. Recommend **manifest-driven** so dead links are hidden, assumption to
  confirm (depends on content migration completeness).
- **Contrast:** darken the inactive locale link to meet AA (assumption: `#7c7d7e` fails on the grey
  topbar; confirm final color).
- **New tokens** (assumption to confirm): `--body-font-size-2xs: 12px`, define `--skoda-grey-500:
  #7c7d7e`, `--weight-light: 300`.

## 9. Pixel-perfect acceptance criteria

Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Count/order: `.lang-links` / all / 6 locales, current first (`en`), then cs(CZ)/de/sk/sr/sl.
- [ ] Current locale: `.lang-links span` / desktop / non-link, `#161718`, weight `700`, `12px`,
      uppercase, `aria-current="true"`.
- [ ] Other locales: `.lang-links a` / desktop / `#7c7d7e` (AA-corrected), weight `300`, `12px`,
      uppercase, correct `/{locale}/` href, `hreflang`+`lang` set.
- [ ] Placement desktop: flush right in the topbar (`margin-left:auto`), gap `1em` between items.
- [ ] Placement mobile: hidden in topbar, shown at drawer bottom, `16px`, gap `1.5em`.
- [ ] Breakpoint: topbar↔drawer swap at `1080px`.
- [ ] A11y gate: current locale `aria-current`; each link announces the full language name; contrast
      >= 4.5:1; keyboard reachable/activatable.
- [ ] Visual diff vs source at 1280 (topbar) and 500 (drawer) <= 2% per-pixel.

## 10. Reference screenshots

`assets/language-switcher/`: `1280-topbar.png` (topbar with the inline locale row, flush right). The
drawer-bottom instance is visible in `assets/mobile-nav/500-drawer-open.png`.
