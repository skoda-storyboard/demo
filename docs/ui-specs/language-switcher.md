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
- **Libraries to retire:** none specific; it is plain markup. The WordPress hreflang set becomes the page's
  `alternates` metadata (migrated pairs only), which generates the list (SKODA-303a, §8a).

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

## 8a. Click behaviour + URL patterns (live, re-checked 2026-09-30)
Every link was clicked on the home page, a story, a press release, the Media Room, `/cs/` and a CZ story.
- **Behaviour:**
  - a plain same-tab navigation straight to a 200 page, with no redirect (the only extra hop is the analytics sync);
  - no language cookie or preference is stored;
  - the current locale is an inert `<span>`;
  - **exception:** on the Media Room, DE opens `https://www.skoda-media.de/` in a **new tab** (`target="_blank"`).
- **Live URL forms** (absolute, always with a trailing slash):
  - locale home: `/{locale}/`;
  - article: `/{locale}/{translated category}/{translated slug}/`, for example `/cs/e-mobilita-cs/…`, `/de/emobilitat-de/…`,
    `/sk/emobilita-sk/…`, `/cs/tiskove-zpravy-archiv/…`, `/sk/tlacova-sprava/…`;
  - Media Room: `/{locale}/media-room/`.
- **EDS URL forms:** the locale home is the root document `{locale}.html`, served **without** a trailing slash (`/en`;
  `/en/` is a 404), and pages sit in the `{locale}/` folder (`/en/media-room`). The nav fragments link:
  - `/nav`: `/cs` `/de` `/sk` `/sr` `/sl`;
  - `/media-room/nav`: `/cs/media-room`, `https://www.skoda-media.de/`, `/sk/media-room`, `/sr/media-room`, `/sl/media-room`.
- **Source of truth (SKODA-303a, #243, 2026-10-08):** the page's `<link rel="alternate" hreflang href>` set in the
  source head. It matches the visible list on every page checked (home, Epiq story, Zellmer press release, Peaq press
  kit, Epiq model page, Media Room); the one exception is the Media Room DE (hreflang `/de/media-room/`, visible link
  `skoda-media.de` in a new tab), where the visible behaviour is kept.
- **Header behaviour (SKODA-303a, PO 2026-10-08: never navigate to the live site):** the switcher is generated
  from the page's **`alternates` metadata** (`cs: /cs/e-mobilita-cs/…, de: /de/…`), the source hreflang set without
  `x-default` and the page's own locale, **kept only where the translation is migrated to EDS**:
  - each locale links its **declared translated EDS page**; nothing is inferred by swapping the locale prefix;
  - a locale **without a migrated translation is omitted**, never replaced by its locale home or a live URL; a page
    without alternates shows only the current locale (as the source does for a page without translations, e.g. the
    Elroq press kit 2);
  - a translation must be a page of this site in its own locale's tree; anything else is dropped;
  - links open in the **same tab**, as on the source; the list carries `data-link-policy="resolved"` so the
    site's link pass (`scripts/links.js`) leaves it alone;
  - the nav row only names the locales and their order; an authored link there to **another site** replaces a
    declared translation, in a new tab with `rel="noopener"` and "(opens in a new tab)" in its name (Media Room DE →
    `skoda-media.de`; a press release without a DE translation shows no DE, as the source);
  - the current locale is a `<span aria-current="true">`; desktop and the drawer use the same list; the page's
    `<html lang>` follows its locale tree (`scripts.js`).
- **Where `alternates` comes from:** `tools/importer/build-locale-alternates.mjs` reads every EDS page's source
  hreflang (rule `skoda-metadata-extract.mjs::pickAlternates`), keeps the pairs published on EDS (both ways) and
  writes one `URL` + `alternates` row per page into the bulk metadata sheet `/metadata`; no page document is touched.
  `--chrome cs,de,sk,sr` adds the `/{locale}/**` rows pointing `nav` / `footer` at the translated fragments.
- **M1 demo (2026-10-08):** the Epiq story in EN + CS / DE / SK / SR (`urls-story-detail-locales.txt`, story
  importer) with translated chrome per locale (`/{locale}/nav`, `/{locale}/nav-newsletter`, `/cs/footer`; DE / SK / SR keep
  the English `/footer` for M1, their source footer links a non-DAM cookie PDF;
  `import-locale-nav|newsletter|footer.js` from the source header / footer, `urls-locale-chrome.txt`). Every other
  page shows only its own language. Known gaps: the Subscribe panel's thank-you text stays English (the source shows
  its ESP response), the search scope labels are English header strings (SKODA-1003), the app badges are the English
  artwork, and the translated menus' targets (Czech categories etc.) aren't migrated, so the link policy sends them to
  the live site.

## 8. Open decisions + recommended default

> **Decided (2026-09-30, SKODA-303 pilot):**
> - **Control form:** inline links.
> - **Current locale:** taken from the URL, not the authored `<strong>`.
> - **Targets (SKODA-303a, 2026-10-08, superseding the locale homes):** the page's declared translations from its
>   source hreflang set, migrated pairs only (`alternates` metadata, §8a), same tab, never the live site; locales
>   without one are hidden. The fragments' locale row keeps the order and the Media Room DE → `skoda-media.de`
>   override.
> - **Out of the pilot:** language-negotiated root routing and per-locale placeholders (SKODA-1003).
> - **Contrast:** inactive links use `--skoda-grey-700`.

- **Control form:** source is **inline links**; recommend keeping **inline links** as the EDS-native
  default (lightest, no JS, matches source). A dropdown/disclosure is only worth it if the locale count
  grows well beyond 6, assumption to confirm with the client (COM-05).
- **Per-page existence:** source hides locales lacking a translation. **Decided (SKODA-303a):** EDS hides them
  too, and also the ones not migrated yet, from the page's `alternates` metadata (§8a); no locale-home fallback.
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
