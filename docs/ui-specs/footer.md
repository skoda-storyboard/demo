# Component Spec: Footer (Storyboard)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS confirmed by curl; screenshots at 1280 + mobile).
Stress-test re-verified live 2026-09-15: band, container, social set + hrefs, app badges, 7-col mega-menu, sub-link type, hr, legal row, and 500px stacking all matched. No corrections.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Companion delta spec: [`footer-mediaroom.md`](footer-mediaroom.md).

## 1. Identity

- **Component:** Global site footer, the dark-green brand block that closes every Storyboard page.
- **EDS block:** `footer` (`blocks/footer/footer.{js,css}`), loaded as a fragment via
  `getMetadata('footer')`.
- **Client PDF IDs:** COM-15 (Footer), COM-18 (Footer nav / sitemap), COM-19 (Social + app links).
- **Ticket:** SKODA-304.
- **Source reference:** `https://www.skoda-storyboard.com/en/` (footer at page bottom).
- **Source CSS:** `https://cdn.skoda-storyboard.com/dist/26.8.1/skoda-bnr-web/dist/styles/media-room-515d2d102b.css`
  (pseudo-class + `@media` rules cited by line below).
- **Top-level selectors:** `.footer-content` (dark band) > `.container` > `.footer` >
  `.footer-widgets` (social + app row) + `.footer-nav .menu` (mega-menu columns) +
  `.copyright-text` / `.copyright-notice` / `.feed-links` (legal/attribution row).

## 2. Source anatomy

```
.footer-content                     dark-green band (bg #0e3a2f, white text)
└── .container (max-width 1248px)
    └── .footer  (clearfix wrapper)
        ├── .footer-widgets         flex row, wrap, gutter margin 0 -10px
        │   ├── .app-download       EMPTY widget in practice (whitespace only); reserves 20% col
        │   └── .social             holds EVERYTHING: 2 app badges + 4 social icons
        │       ├── a.app-download-badge > svg   iOS App Store badge (135x40)
        │       ├── a.app-download-badge > svg   Google Play badge (135x40)
        │       ├── a.icon.icon-facebook         icon-font glyph (\e014)
        │       ├── a.icon.icon-instagram        icon-font glyph (\e01a)
        │       ├── a.icon.icon-youtube          icon-font glyph (\e03e)
        │       └── a.icon.icon-whatsapp         icon-font glyph (\e03c)
        ├── hr                      1px white rule, margin-bottom 3rem
        ├── .footer-nav .menu       MEGA-MENU: 8 top categories, Newsletter hidden -> 7 visible cols
        │   └── .menu-item(-has-children)
        │       ├── > a             top category link, display:none on desktop
        │       └── .sub-menu       stacked child links (the visible column content)
        ├── .copyright-text         long usage/rights paragraph (+ emerald links)
        ├── .copyright-notice       "© Škoda Auto a.s. 2026" (weight 600)
        └── .feed-links             "RSS" | "RSS (News)" (emerald links, "|" separator)
```

Note: the app-store badges sit **inside `.social`**, not inside `.app-download` (measured; the
`.app-download` widget renders as an empty whitespace container on the homepage). The `.social` widget
is right-aligned (80% col) and the empty `.app-download` reserves the left 20%.

**Libraries / patterns to retire (do not port):**
- jQuery + WordPress widget scaffolding (`.widget_nav_menu`, `.widget`, clearfix `:before/:after`).
- Icon-font `skoda-bnr-icons` (`.icon.icon-*` with `\e0xx` glyphs, `text-indent:101%` hidden text) ->
  replace with **inline SVG** via the repo `:name:` icon-token -> `decorateIcons` path.
- Bootstrap-style float grid (`.menu > .menu-item{float:left;width:14.25%}`) -> CSS Grid.
- The hidden top-category link + first-child-only sub-menu trick -> author real column headings.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Source URL for every row is
`https://www.skoda-storyboard.com/en/`. Source-CSS line numbers reference the curled
`media-room-515d2d102b.css`.

### Band + container
- `.footer-content` padding: `64px 0` (`4rem`) (· `.footer-content` · 1280; source CSS L486
  `padding:4rem 0`). `--section-padding` is 40px; footer uses `4rem` = candidate `--footer-padding-y`.
- `.footer-content` background: `rgb(14 58 47)` = `#0e3a2f` (· 1280) -> `--skoda-green`.
- color: `#fff` (· 1280) -> `--skoda-white`.
- `.container` max-width: `1248px` (· 1280) -> `--content-max-width`; padding `0 10px`, margin `0 16px`.

### Widgets row (`.footer-widgets`)
- display `flex`; `flex-wrap:wrap`; margin `0 -10px` gutter (· 1280; source CSS L493-495).
- child base: `flex:0 0 100%` (full width, stacked) mobile; padding `0 15px`; margin-bottom `3em`
  (· 500; source CSS L495).
- `@media (min-width:768px)` child `flex:0 0 33.333%` (source CSS L496); `.app-download`
  `flex:0 0 20%; align-items:flex-start` (L498); `.social` `flex:0 0 80%; align-items:flex-end;
  flex-flow:row; justify-content:flex-end` (L500). Confirmed at 1280: social `0 0 80%`,
  app-download `0 0 20%`.

### Social icons (`.social a.icon`)
- size: `40px × 40px` (· `.social a.icon` · 1280; getBoundingClientRect 40/40).
- border-radius: `50%` (circle); background `rgb(0 0 0)` = `#000`; color `#fff`; padding `10px`;
  font-size `20px` (`1.25em`); display `block` (· 1280; source CSS L1495
  `border-radius:50%;padding:.5em;width:2em;height:2em;font-size:1.25em`).
- list: `li` inline-block, `li+li` margin-left `.5em` (source CSS L1493-1494).
- **Set (4):** Facebook `facebook.com/skodaglobal/` (glyph `\e014`), Instagram
  `instagram.com/skodagram/` (`\e01a`), YouTube `youtube.com/user/skoda` (`\e03e`), WhatsApp
  `go.skoda.eu/whatsapp` (`\e03c`). No Twitter/X/LinkedIn/TikTok in the live set (those hover rules
  exist in CSS but are unused here).
- No token for the black circle button -> **candidate** `--social-icon-size:40px`,
  `--social-icon-bg:#000`.

### App-store badges (`.app-download-badge`)
- `display:inline-block`; `> svg` `135px × 40px` (· 1280; source CSS L622-623; getBoundingClientRect
  135/40). Two badges: iOS `apps.apple.com/cz/app/škoda-media-room/id420627875`, Android
  `play.google.com/store/apps/details?id=com.icomvision.skodamediaservices` (the "Škoda Media Room"
  journalist app). No token -> **candidate** `--app-badge-w:135px`, `--app-badge-h:40px`.

### Mega-menu (`.footer-nav .menu`)
- **8 top categories:** Models, eMobility, Lifestyle, Škoda World, Series, Škodapedia, Podcast,
  Newsletter. **Newsletter is hidden** (`.newsletter-menu{display:none}`, source CSS L690) ->
  **7 visible columns** (matches `width:14.25%` -> ~1/7).
- desktop column: `.menu > .menu-item` `float:left; width:14.25%; padding-right:22px`
  (· 1280; measured width `174.98px`, `padding-right:22px`; source CSS L684 `float:left;width:14.25%`
  inside `@media (min-width:1024px) and (min-width:768px)`, L686 `padding-right:22px` at `min-width:768`).
- top category link `.menu-item-has-children > a` -> `display:none` on desktop (measured
  `topLinkDisplay:none`; source CSS L690). Sub-menu links carry the column.
- sub-menu link (`.sub-menu .menu-item a`): font-size `12px` (`.75em`), weight `500`,
  letter-spacing `1px`, line-height `18px` (`1.125em`), color `#fff` (· 1280; source CSS L688-689).
  `.menu-item` margin-bottom `.75em` (`12px`).
- Sub-item content (Models column, 13 links): Fabia, Scala, Octavia, Superb, Kamiq, Karoq, Kodiaq,
  Epiq, Peaq, Elroq, Enyaq, Classic Cars, Concepts. Lifestyle: People, Sports, Adventures. Škoda
  World: Innovation & Technology, Design, Responsibility, Corporate Life, Heritage. (eMobility, Series,
  Škodapedia, Podcast render as single-link columns.)

### Legal / attribution row
- `hr`: border-top `1px solid rgb(255 255 255)`, margin-bottom `48px` (`3rem`) (· 1280; source CSS L487).
- `.copyright-text`: font-size `16px`, weight `400`, width `70%` (`859px`) `@768`, margin-bottom `32px`
  (`2em`) (· 1280; source CSS L506-507). Text: "Without consent from Škoda Auto a.s., third parties
  are only allowed to use all published content - to an adequate extent - for **Internet news for two
  years since publishing, worldwide (except USA, Canada, Japan)**; however, such use must not be in
  conflict with legitimate interests of Škoda Auto a.s." (this wording is the Storyboard variant, see
  media-room delta).
- `.copyright-text a`: weight `300`, color `#78faae` (source CSS L509) -> `--skoda-green-emerald`.
- `.copyright-notice`: "© Škoda Auto a.s. 2026"; `p` weight `600`; `float:left` `@768`
  (source CSS L510-511).
- `.feed-links`: font-size `12px` (`.75em`), weight `400`, `float:right` `@768`; `a` color `#78faae`
  (· 1280; source CSS L513-515, L1097). Separator `a+a:before` content `"|"` margin `0 .5em`
  (source CSS L1098). Two: "RSS" (`/en/feed/`), "RSS (News)" (`/en/press-releases/feed/`).

## 4. Responsive behavior

The footer nav uses its own literal breakpoints, **768 / 968 / 1024** (not the `_FOUNDATIONS`
canonical 768/992/1080, and not the `700/1000` the current `footer.css` hardcodes). Confirmed from
source CSS:

- **< 768 (mobile, measured 500):** every widget `flex:0 0 100%` (stacked column); `.social` becomes
  `flex-flow:column`, `align-items:normal`, left-aligned. Nav `.menu` `display:block`; `.menu-item`
  `float:none; width:480px` (full width, stacked). Only the first sub-menu item of each category shows
  (`.sub-menu .menu-item{display:none}` + `:first-child{display:list-item}`, source CSS L690-691)
  unless flagged `.show-on-mobile` (`display:block!important` at `max-width:968`, source CSS L694).
  copyright-text full width.
- **768–967:** widgets go 3-up (`33.333%`), `.social` 80% right-aligned / `.app-download` 20%.
  Nav still `display:block` below 968; sub-menu items still collapsed to first-child.
- **968–1023:** `@media (min-width:968)` reveals all sub-menu items (`display:list-item`, source CSS
  L692). `@media (max-width:1024)` sets `.menu` to `flex; justify-content:space-between` (source CSS
  L678), the 7 categories sit in one flex row, columns not yet floated.
- **>= 1024 (measured 1280):** `.menu > .menu-item{float:left; width:14.25%}` (source CSS L684), the
  final 7-column float grid; `padding-right:22px` from the 768 rule persists.

> **Parity note.** Current `blocks/footer/footer.css` grids at `700px` (2->4 cols) and `1000px`
> (4->7 cols). The **source** transitions are `768` (3-up widgets), `968` (sub-items reveal), `1024`
> (7-col float). The rebuild should either adopt the `_FOUNDATIONS` canonical `768/992/1080` (closest
> clean ladder; recommended) or the exact source `768/968/1024`. Do not keep `700/1000`.

## 5. Interaction states

- **Social icon hover** (source CSS L607-613): generic `background:#419468`; per-network override, 
  Facebook `#3b5998`, YouTube `red` (`#f00`), Instagram radial gradient
  `radial-gradient(circle at 30% 107%, #fdf497 0, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)`,
  WhatsApp `#43d854`. color stays `#fff`. No transition declared on these; add a `background .2s ease`.
- **Text link hover:** the current EDS footer underlines on hover; source relies on default. Feed +
  copyright links are emerald `#78faae`.
- **Focus:** source sets no visible focus ring on icon links (a11y regression), add
  `:focus-visible` outline in the rebuild.

## 6. Accessibility

- Social/app links are icon-only. Source hides text via `text-indent:101%`; the rebuild must give each
  an `aria-label` (Facebook, Instagram, YouTube, WhatsApp, "Škoda Media Room on the App Store",
  "…on Google Play"). Current `footer.js` sets `aria-label` from the `:name:` token, extend for badges.
- Icon-font glyphs are inaccessible; convert to inline SVG with `role="img"` + label (or `aria-hidden`
  glyph + labelled link).
- Nav mega-menu: use a real `<nav aria-label="Footer">` with `<ul>` columns; do not hide the category
  heading with `display:none` (author it as a visible column heading instead).
- Add `:focus-visible` rings (source uses none).
- `hr` is decorative -> keep as `<hr>` (implicit `separator` role) or a bordered box.
- Color contrast: `#78faae` on `#0e3a2f` and `#fff` on `#0e3a2f` both pass AA; verify the `opacity:.85`
  sub-links still clear 4.5:1.

## 7. EDS target

Block: `footer` (exists). Content authored as a **fragment** (default path `/footer`, overridable per
section via `getMetadata('footer')`). Current `footer.js` names three sections
(`footer-social`, `footer-nav`, `footer-legal`) and converts `:name:` icon tokens to glyph spans; keep
that contract and extend it for app badges + the mega-menu grid.

### DA fragment authoring model

Author `/footer` as an EDS document with three sections separated by `---`:

1. **Social section** (-> `.footer-social`): a heading paragraph, an icon-row paragraph of bare
   `:facebook: :instagram: :youtube: :whatsapp:` tokens (each wrapped in a link), and an app-badge
   paragraph with the two store links (badge image or `:appstore:` / `:googleplay:` tokens).
2. **Nav section** (-> `.footer-nav`): a nested bullet list, each top-level bullet is a column
   heading, its indented children are the column links. 7 columns author cleanly as 7 top-level
   bullets. (Renders via the `.default-content-wrapper > ul` grid already in `footer.css`.)
3. **Legal section** (-> `.footer-legal`): the copyright paragraph, the `© …` notice paragraph, and a
   feed-links paragraph (`RSS | RSS (News)`).

### decorate() outline (consistent with existing `footer.js`)

```
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const path = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(path);
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  ['footer-social', 'footer-nav', 'footer-legal'].forEach((c, i) => footer.children[i]?.classList.add(c));
  // social: title / icon-row / app-row; convert :name: tokens -> icon spans; label badges
  // nav: grid columns via .default-content-wrapper > ul (768/992/1080 breakpoints, not 700/1000)
  // legal: mark copyright / notice / feed-links; emerald link colour via token
  block.append(footer);
  decorateIcons(block);
}
```

Reuse notes: `loadFragment` + `getMetadata('footer')` already wired; icon-token -> SVG already wired;
only the grid breakpoints, badge handling, and per-network hover tints are new.

## 8. Open decisions + recommended default

- **Breakpoints:** adopt `_FOUNDATIONS` canonical **768 / 992 / 1080** (assumption to confirm), which
  visually matches the source `768/968/1024` within a few px and removes the `700/1000` divergence.
  Alternative: pin the exact source `1024` for the 7-col switch. Recommend the canonical ladder.
- **App badges:** author as real SVG/`<img>` store badges (Apple + Google brand assets) rather than
  icon-font; keep the measured `135×40` box. Assumption to confirm: badges live in the social section,
  left of the icons (matches source `.social` grouping).
- **New tokens** (assumption to confirm): `--footer-padding-y:4rem`, `--social-icon-size:40px`,
  `--social-icon-bg:#000`, `--social-hover:#419468`, `--social-facebook:#3b5998`,
  `--social-youtube:#f00`, `--social-whatsapp:#43d854`, `--app-badge-w:135px`, `--app-badge-h:40px`.
  Reuse `--skoda-green`, `--skoda-white`, `--skoda-green-emerald` (feed/copyright links),
  `--content-max-width`.
- **Legal bar (Data Protection / Copyright / Cookies / Whistleblower):** **NOT present in the footer
  DOM** on either page (measured; only a cookie-consent banner exists elsewhere). The COM-15 legal bar
  from the walkthrough is likely the cookie tool / a utility bar, not the footer. Flag to client, 
  do not synthesize it into the footer fragment without confirmation.

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en` render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Band: `.footer` container / all / bg `#0e3a2f` (`--skoda-green`), text `#fff`, padding-y
      `64px` (`4rem`) at >=768.
- [ ] Content width: inner wrapper / all / max-width `1248px` (`--content-max-width`), centered.
- [ ] Widgets row: `.footer-social` / >=768 / social block right-aligned (80% col), app+icons in one
      row; / <768 / stacked full-width column.
- [ ] Social icons: `.footer-social .icon` / all / `40×40`, `border-radius:50%`, bg `#000`, white glyph,
      inline **SVG** (no icon-font). Set exactly Facebook/Instagram/YouTube/WhatsApp with correct hrefs.
- [ ] Icon hover: each icon / all / brand tint (FB `#3b5998`, YT `#f00`, IG gradient, WA `#43d854`).
- [ ] App badges: `.footer-social` / all / two `135×40` store badges (iOS + Android, correct hrefs).
- [ ] Nav grid: `.footer-nav ul` / >=1080 / **7 columns**; / 768–1079 / 3–4 up; / <768 / stacked.
      Newsletter category absent (hidden in source).
- [ ] Sub-link type: `.footer-nav ul ul a` / all / `12px`, weight `500`, letter-spacing `1px`, white.
- [ ] Rule: `hr` / all / `1px solid #fff`, margin-bottom `48px`.
- [ ] Copyright: `.footer-legal` / >=768 / notice `© Škoda Auto a.s. 2026` weight `600` float-left,
      feed-links float-right; usage paragraph 70% width. Emerald (`#78faae`) links.
- [ ] Feed links: `.footer-legal` / all / "RSS" + "RSS (News)" with "|" separator, emerald.
- [ ] A11y: every icon link has `aria-label`; `:focus-visible` ring visible; `<nav aria-label>`;
      contrast >= 4.5:1. Keyboard: all links reachable + activatable.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel (excluding SVG glyph rendering).

## 10. Reference screenshots

`assets/footer/`, `1280.png` (7-col desktop), `mobile.png` (stacked, ~500px). 1024/768 pending.
