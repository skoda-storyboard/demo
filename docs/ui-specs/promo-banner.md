# Component Spec: Promo Banner

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS confirmed by curl; screenshot at 1280).
**Re-verified live 2026-09-15 via Playwright** at 1280/500: creative img confirmed (`345×345`@1280 /
`480×480`@500, radius `8px`, margin-top `8px`, `object-fit:fill`, full column width, `<a target=_blank>`
tracked redirect). **Slot placement corrected** (§3/§4): on the live story template `.sidebar` computes
`display:block` (not flex/column) and `.side-banner` computes `order:0`/`position:static`, rendering
**last** in the sidebar, not pulled above the other widgets.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Scope note: this spec covers the **static presentation only**. The dynamic ad platform is E09, deferred (see §8).

## 1. Identity

- **Component:** Promotional banner, an image+link creative placed in the story/press sidebar (and
  inline positions). On the live site it is served by a bespoke ad platform; here we spec the **static
  box** an author can reproduce for M1.
- **EDS block:** new `promo-banner` (`blocks/promo-banner/*`), a simple authored image+link box.
- **Client PDF IDs:** COM-09 (Promo/ad slot); STO-D08 (story sidebar promo). Production is E09 / SKODA-903.
- **Ticket:** COM-09 (static, M1) / STO-D08; dynamic platform E09 / SKODA-903 (deferred).
- **Source reference:** `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
, sidebar banner `.sidebar .side-banner`.
- **Source CSS:** `https://cdn.skoda-storyboard.com/dist/26.8.1/skoda-bnr-web/dist/styles/media-room-515d2d102b.css`.

## 2. Source anatomy

```
section.side-banner                          sidebar promo slot (order:1 → above other widgets)
└── .sa-bnr
    └── section.sa-bnr-side.initialized       ← the bespoke ad-server widget (React/JS)
        [data-desktop=true] [data-mobile=true]
        [data-promotion-label="ŠKODA Banner|445097"]
        [data-promotion-title="Epiq | EN | Side banner"]
        [data-promotion-context="Sidebar"]
        [data-promotion-click-selector="a"] [data-promotion-click-use-label=false]
        └── a.link-node[target=_blank]
              href="…/wp-json/skoda-banners/v1/redirect/banner/445104/en"   ← tracked redirect
            └── img.sa-bnr__image  (1000×1000 creative, alt="Epiq | EN | Side banner")
```

The **only DOM the CSS styles** is `.side-banner img` (radius + margin). Everything under
`.sa-bnr-side` (the `data-promotion-*` attributes, the `wp-json/skoda-banners/v1/redirect/...`
click-tracking endpoint, desktop/mobile targeting flags, rotation/impression logic) is the **E09 ad
platform** (a WordPress `skoda-banners` plugin + JS SPA). **`.promo-box` in source is an unrelated
component** (the homepage/MR featured-story showcase built from `article-teaser` cards, with its own
per-breakpoint behavior and mobile auto-rotation), fully specified in
[`carousel-rails.md`](carousel-rails.md) §3/§5 and [`card-teaser.md`](card-teaser.md) and owned by
SKODA-201, **not** this ad-banner ticket. Do not confuse the two: the `promo-banner` here is the sidebar
`.side-banner` ad creative only.

**Libraries / patterns to retire (or defer, not port into the static block):** the `sa-bnr` /
`skoda-banners` ad plugin, the `data-promotion-*` targeting, the tracked-redirect endpoint, React
render. The static block ports **only** the visual box: an `<img>` inside an `<a>`.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Source URL for every row is the Epiq
story above. Source-CSS refs point to the curled `media-room-*.css`.

### Slot placement (`.sidebar .side-banner`)
- host: `.sidebar` is `flex:0 0 33.333%; width:33.333%; max-width:33.333%; padding:2rem 0 2rem 4rem`
  (`32px 0 32px 64px`), measured `width 409px` (· 1280; · `.sidebar` · `body.single-post`). **Correction
  (verified live 2026-09-15):** at desktop `.sidebar` computes `display:block`, **not** `flex`/`column`.
  The source rule `body.single-post article .columns .sidebar{display:flex;flex-direction:column}` exists
  but is overridden on the actual story template (`post-template-template-layout-article` +
  `siteorigin-panels`), so the flex-order rules below never fire. The `flex:0 0 33.333%` still applies
  because `.sidebar` is a flex *item* of `.columns`.
- `.side-banner` computes `order:0`, `position:static` (· 1280) and renders **last** in the sidebar,
  **below** `newsletter-subscribe` / `related` / `tags` (measured stacking top order at 1280), **not**
  pulled above them. The source `body.single-post … .side-banner{order:1}` / `.sidebar section{order:2}`
  rules are inert here because the desktop sidebar is not a flex container. Sidebar `section`
  margin-bottom `1rem`.
- **Mobile (<768, · 500):** `.sidebar` flips to `display:flex`, full-width `480px`, `padding:0`, stacked
  below the article body; the banner spans the full content width.

### Creative image (`.side-banner img`)
- border-radius `.5rem` (`8px`) -> `--card-radius`; margin-top `.5rem` (`8px`) -> `--spacing-xs`
  (· 1280; source CSS `.sidebar .side-banner img{margin-top:.5rem;border-radius:.5rem}`).
- rendered size (measured): `345×345px` @1280, `185×185px` @768, `480×480px` @500, a **1:1** box
  scaling to the sidebar column width; source creative is `1000×1000` (square). object-fit `fill`
  (source stretches; for a square creative in a square box there is no visible distortion).
- The creative fills `width:100%` of the sidebar column at every band.

### Static box (what M1 authors)
- a single `<a>` wrapping a responsive `<img>`, radius `8px`, top-margin `8px`, full column width;
  optional caption/CTA line below (source has none, the creative bakes any CTA into the image).

## 4. Responsive behavior

- **Desktop / small-desktop (≥768):** banner sits in the right sidebar column (`33.333%`,
  `345px`@1280 / `185px`@768), rendered **last** in the sidebar (below newsletter / related / tags),
  in DOM order (the `order:1` "pull above" rule is overridden, see §3). Square `1:1` creative.
- **Mobile (<768, measured @500):** the sidebar stacks full-width (`480px`) below the article body;
  the banner spans the full content width, radius `8px` retained. `data-mobile=true` gates whether a
  mobile creative renders at all (an ad-platform concern, not CSS).
- No internal breakpoints in the banner box itself, it is width-driven by its container.

## 5. Interaction states

- **Link:** whole creative is a single `<a target=_blank>` to a tracked redirect (live) or the direct
  destination (static M1). No hover treatment in source (the image is the affordance).
- Recommended for the static block: subtle `:hover`/`:focus-visible` affordance (slight shadow or
  outline) so the banner reads as clickable and is keyboard-discoverable.
- **Rotation / targeting / frequency-cap:** for **this** `.side-banner` ad creative, rotation is live-only
  via the E09 platform, out of scope for the static M1 block. (Note: the separate `.promo-box`
  featured-story grid also rotates, but that is authored content on a `10s` timer and is specced in
  [`carousel-rails.md`](carousel-rails.md), not here.)

## 6. Accessibility

- Banner link needs a meaningful accessible name. Source uses `alt="Epiq | EN | Side banner"` (an
  internal campaign label, not user-facing), the rebuild should author a **descriptive `alt`** or an
  `aria-label` on the link describing the promo/destination.
- Mark the slot as an ad/promo for assistive tech and ad-blocker friendliness: wrap in
  `<aside aria-label="Advertisement">` (or "Promotion"), and consider `role="complementary"`.
- If a creative is purely decorative branding with a separate visible CTA, `alt=""` + labelled CTA;
  otherwise the image carries the name.
- `target=_blank` links get `rel="noopener"`; warn (visually or via label) that the link opens a new tab.
- Keyboard: single tab stop, activatable by Enter; visible `:focus-visible` ring (source has none).

## 7. EDS target

Block: new `promo-banner`, a plain authored image+link box. Follow repo conventions
(`_FOUNDATIONS` §7): `decorate(block)`, CSS scoped to `.promo-banner`, `optimizeImageInPlace` on the
authored `<picture> > img`, defensive decoration. **No** ad-platform logic in M1.

### DA authoring table (worked example)

`Promo banner`:
| (image cell)                         | (link cell)                          |
|--------------------------------------|--------------------------------------|
| ![Epiq side banner](./epiq_1000.jpg) | https://www.skoda.eu/epiq            |

Optional third cell = CTA text / caption. A `Promo banner (sidebar)` variant constrains to the
sidebar column; default/`inline` spans the content column.

### decorate() outline

```
export default function decorate(block) {
  // sniff cells: image cell (single child with <picture>), link cell (a bare URL or <a>), optional caption
  const pic = block.querySelector('picture');
  const href = block.querySelector('a')?.href || firstUrlText(block);
  block.textContent = '';
  const link = a({href, target:'_blank', rel:'noopener',
                  ariaLabel: caption || 'Promotion'});
  if (pic) { optimizeImageInPlace(pic); link.append(pic); }
  const wrap = document.createElement('aside');   // role=complementary
  wrap.setAttribute('aria-label', 'Advertisement');
  wrap.append(link);
  block.append(wrap);
  // radius 8px + margin-top 8px + full-width via tokens; :focus-visible ring in CSS
}
```

Reuse notes: image handling matches the cards family (`optimizeImageInPlace`, LCP not applicable, 
banner is below the fold). No index/query dependency.

## 8. Open decisions + recommended default

- **Dynamic platform is OUT of scope (E09 / SKODA-903).** The live banner is served by the bespoke
  `skoda-banners` WordPress plugin + JS SPA: `data-promotion-*` targeting, `wp-json/skoda-banners/v1`
  tracked redirects, desktop/mobile creatives, rotation, impression/click analytics, geo + frequency
  capping. **None of this is built for M1.** This spec ports the visual box only.
- **M1 recommendation:** ship a **static authored promo**, a `promo-banner` block = image + link
  (+ optional CTA), authored per page in DA. Radius `8px`, top-margin `8px`, sidebar `33.333%` col.
  This gives a representative placement for the demo with zero ad-platform dependency.
- **Placement:** recommend the **sidebar** variant (matches source `.side-banner`) as primary, plus an
  `inline` variant for in-article promos. Assumption to confirm.
- **Creative aspect:** source is `1:1` (`1000×1000`). Recommend authoring square by default but let
  the box be aspect-agnostic (width-driven). Assumption to confirm the standard ad size(s) with the
  client (source also has `data-desktop`/`data-mobile` variants implying separate crops).
- **New tokens:** none required, reuse `--card-radius` (`8px`) and `--spacing-xs` (`8px`). Add
  `--promo-banner-max: 33.333%`-equivalent only if the sidebar column is not already tokenized.
- **Tracking:** if the client wants click tracking in M1 without the full platform, a simple
  `data-track` + analytics event is enough; do not rebuild the redirect endpoint.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Box: `.promo-banner img` / all / border-radius `8px` (`--card-radius`), margin-top `8px`
      (`--spacing-xs`), full column width.
- [ ] Sidebar placement: `.promo-banner` (sidebar variant) / ≥768 / in `33.333%` sidebar column
      (source renders it last, below the other sidebar widgets); / <768 / full-width stacked below the
      article.
- [ ] Creative: single `<a target=_blank rel=noopener>` wrapping an optimized responsive `<img>`;
      1:1 by default; no distortion at any band.
- [ ] Link: resolves to the authored destination (static), opens new tab; optional CTA/caption renders.
- [ ] A11y: descriptive `alt`/`aria-label`; wrapped as `aside`/`role=complementary` labelled
      "Advertisement"/"Promotion"; single tab stop; visible `:focus-visible` ring.
- [ ] Out-of-scope confirmed: no `data-promotion-*`, no tracked-redirect endpoint, no rotation/geo/
      freq-cap in the M1 block (those are E09/903).
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding the creative image content).

## 10. Reference screenshots

`assets/promo-banner/`, `1280-side-banner.png` (sidebar square creative). 768/mobile pending.
