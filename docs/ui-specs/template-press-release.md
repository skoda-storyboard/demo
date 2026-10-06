# Template Spec: Press Release detail

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/1024/768/500 on the live
Superb-25-years release; a second release cross-checked for structure).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

> **Sweep correction (2026-09-25).** The DevTools URL→block sweep ([registry](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md), [report](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §7) disproved the points below on the live M1 pages. They override the sections they name until this spec is re-captured:
>
> - **Bullets are optional**: the Klaus Zellmer release has none.
> - **No sidebar newsletter** on any of the 5 M1 releases. The secondary column is Additional info + Images + Tags; the side-banner is an empty 15px placeholder.
> - **Two separate dark bands** (Media Box, then related press releases) on four releases. Superb has no related rail. The Peaq Media Box is 1 video + 3 images + 1 PDF, not a 24-image group.

> **Re-measure (2026-09-27, SKODA-607 origin review of all 5 M1 releases, 1280/1200/1080/1024/768/500).** Overrides the sections it names:
>
> - **§2/§6 bands:** both are `.cover-box.dark` `#0e3a2f` (= `--dark-color`), full-bleed, padding 16/12, inner `.search-results` margin 32/48, header padding-top 24 → heading 72px below the band top. Media Box: margin-top 32, heading 26/32.5/600 white, stats line 16/32/600 `#c4c6c7`, a **static** 4-up grid (292×305 tiles at 1280, 3-up at 768, 1-up <768 behind Show more/less). Related: margin-top 0, `h3` + "Based on tags" subheading, an "All" ghost pill (white, 2px `#464748`, 36px, radius 50), Flickity `{"cellAlign":"left","groupCells":true,"pageDots":false}`, 374px cells / 354×199 cards.
> - **§4 bullets:** one `<p>` of `›` lines split by `<br>`, 16/24/600, not a list. The importer emits a `<ul>`.
> - **§2 podcast:** the Buzzsprout player is the **first** item in `.entry-content` (lazy `data-src`), not after the body.
> - **§5 secondary column:** the 416px box has `padding: 0 10px 0 64px` from **1080** (content 342 at x=912 @1280), `0 10px` at 1024 and below (content 321 @1024, 236 @768). Headings 16/45/600 `#353535`; "Additional info" rows 62px (link padding 8 + line 45, 1px `#d2d2d2` bottom border); 15px between groups. Images: 2-up 171×97 at 1280, 1-up <768; no "+N" pill on the M1 set (max 4 images). A sidebar heading sits flush on its block (0px "Images" → thumbs and "Tags" → chips); the 15px group gap follows the block (SKODA-223).
> - **§5 header:** header padding-top 24; date 11/11/600 `#808080` (inline-block, lands at y=140), 16px below; h1 26/32.5/600 `#0a0a0a`. The h1's 26px margin collapses out of the header: the h1 → lead-image gap is **16px**.
> - **§3/§10 newsletter:** hidden (`display:none`) on all 5; out of scope (904).
>
> **Page-level re-measure (2026-10-06, SKODA-607a, all 5 M1 releases at 1280/1024/768/500, measured against the source):**
>
> - **Column ends:** `.column-primary` margin-bottom **60px** and `.column-secondary` **24px**. Both are flex items, so these never collapse with the next box. The `.columns` row has −10px margins. The sidebar ends with an empty side-banner slot (15px, plus its 15px group gap).
> - **Bands:** Media Box `margin-top` 32px from the row (−10px). Each `.cover-box.dark` has a **16px margin-bottom**, a white strip before Related and before the footer.
> - **Podcast:** `.entry-content` opens with an empty TinyMCE `<p>` (20px) before the Buzzsprout player, so the player sits 40px below the perex.
> - **Media Box:**
>   - stats line `padding-top: 4px`, 20px to the tiles;
>   - the tile grid keeps its last row's 20px bottom margin;
>   - collapse rule: see `downloads.md` (row-triggered).
> - **Lead image:** the 16:9 `.article-teaser` frame has radius 8px and a resting `scale(1.02)` (no hover change). It links to the original (colorbox).
> - **Title:** an authored `<br>` stays (Peaq).
> - **Teaser images** (Media Box tiles, sidebar Images, Related cards) are bottom-aligned in their 16:9 frame (`bottom: 0; transform: translateX(-50%) scale(1.02)`, radius 8px). Ticketed in SKODA-607a's blockers.
>
> **§8 EDS target, as built (SKODA-607 phase 1):** the press release has its **own template**, `templates/press-release/` (JS + CSS), loaded from `template: press_release` through the `scripts.js` `TEMPLATES` allow-list. It is not the story CSS. Sections follow the import contract `press-release-sections` (header · `body-column` · `sidebar` · `dark, full-width, media-box` · optional `dark, full-width, related`). Block visuals are separate tickets: SKODA-223 (Gallery `preview`), SKODA-224 (Story Rail `press`), SKODA-510 (Downloads file tiles).

## 1. Identity

- **Template:** Press release detail page. **The single largest template, 47.5% of all EN pages.**
- **WP body class / CPT:** `press_release-template-default`, `single-press_release`, `body.media-room`.
  Public CPT `press_release`.
- **Side:** Media Room (section switcher = "Media Room"; MR header nav + MR footer).
- **Source URL:** `https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/`
- **Ticket:** SKODA-607 (new). Import feeds SKODA-803.
- **Not the story template.** It shares the two-column shell with the story but differs materially, see §2.

## 2. Page anatomy

```
header.header (MR variant)                     108px; switcher active = Media Room
article.press_release  (y=108, w=viewport)
└── div.container  (max 1248, gutters ~16px)
    ├── header
    │   ├── span.entry-published   (date, e.g. "11. 9. 2026")
    │   └── h1.entry-title         (text title, NO hero image)
    └── div.columns  (display:flex; flex-wrap:wrap)
        ├── div.column-primary   (66.66% / 832px @1280)
        │   ├── div.article-teaser.promo-box-item   (lead image, 16:9)
        │   ├── div.bullet-points                   (› key-points list, bold)
        │   ├── div.entry-summary                   (perex / lead, bold)
        │   ├── div.entry-content                   (body rich text; may embed podcast/video)
        │   └── (inline audio/podcast embed where present)
        └── div.column-secondary (33.33% / 416px @1280)
            ├── section.newsletter-subscribe-widget
            ├── section  "Additional info"          (Media contacts link)
            ├── section.images.sa-media-kit-preview  "Images" (Download Media Box + 2x2 preview)
            ├── section.tags                         (grey chip list)
            └── section.side-banner                  (E09 ad slot)
div.cover-box.dark   (FULL-BLEED, w=viewport)        related-media band
└── div.search-results.media-box                     related items grid
footer.footer (MR variant)
```

**Key differences vs [`story-detail.md`](story-detail.md) (verified live):**
| | Story (`single-post`) | Press release (`single-press_release`) |
|---|---|---|
| Side | Storyboard | Media Room |
| Top hero image | **Yes** (`.hero`, ~756px full-bleed) | **No** (text title in `header`) |
| Column classes | `.content` / `.sidebar` (819 / 409) | `.column-primary` / `.column-secondary` (832 / 416) |
| Primary content | SiteOrigin panels rich content | lead teaser + bullet-points + summary + content |
| Secondary content | story-side widgets | Additional info + **media-kit downloads** + tags + newsletter + ad |
| Bottom band | related rail | **full-bleed dark `cover-box` related-media band** |

## 3. Composed components

In order: [`header-megamenu`](header-megamenu.md) (MR variant) → text `header` (date + title) →
[`card-teaser`](card-teaser.md) (lead teaser, primary) → rich text/[`embeds`](embeds.md) (podcast/video) →
secondary column = [`newsletter`](newsletter.md) + "Additional info" + [`downloads`](downloads.md)
("Download Media Box" round `+` button + [`gallery-lightbox`](gallery-lightbox.md)/[`media-cart`](media-cart.md)
image preview) + [`tags`](tags.md) (grey chips) + [`promo-banner`](promo-banner.md) (side-banner) →
[`carousel-rails`](carousel-rails.md)/media grid in the dark band → [`footer-mediaroom`](footer-mediaroom.md).
[`social-share`](social-share.md) floats bottom-right.

## 4. Template-specific structure

- **Bullet-points block** (`.bullet-points`): a bold `›`-prefixed key-points list above the perex. Not a
  generic component, author it as a styled list at import.
- **"Additional info" + "Download Media Box"**: press-kit-style media download entry in the secondary
  column (`downloads.md` round `50px` `+` button, links to the media box / cart package).
- **`sa-media-kit-preview` "Images"**: a 2x2 preview grid feeding gallery-lightbox + media-cart.
- **Dark related-media band** (`.cover-box.dark`): full-bleed dark section of related media/press items
  after the article. Measured 2026-09-29 on Zellmer: every cell stays at `opacity:1`, with no fade
  (SKODA-224). The EDS `Story Rail (press)` variant is described in `docs/tickets/tickets/SKODA-224.md`.

## 5. Measured template-level visual base

All values `getComputedStyle` on the Superb release, cited `(selector · viewport)`.

**Layout**
- Content container: `max-width 1248px` (`--content-max-width`), horizontal gutter `~16px` margin +
  `10px` padding (· `article .container` · 1280). Below 1264 the container is full-width with a `10px`
  padding gutter (· 1024/768/500).
- Two-column: `.columns { display:flex; flex-wrap:wrap }`; `.column-primary` **66.66%**, `.column-secondary`
  **33.33%** (832/416 @1280, 683/341 @1024, 512/256 @768) (· `article .columns` · 1280-768).
- Article starts at `y=108` (flush under the fixed header, no hero offset).
- Dark related band is **full-bleed** (`w=viewport`, `x=0`), `margin-top 32px` (· `.cover-box.dark` · 1280).

**Spacing / vertical rhythm**
- `h1.entry-title` `margin-bottom 26px`; published meta `margin-bottom 16px` (· header · 1280).
- Body paragraph rhythm: `p { margin-bottom 20px }` (· `.entry-content p` · 1280).
- Related band `margin-top 32px`, inner `padding 16px/12px` (· `.cover-box.dark` · 1280).

**Typography** (→ token)
- Title `h1.entry-title`: `26px / 32.5 / 600`, color `#0a0a0a` (· 1280). Candidate `--pr-title: 26px`
  (distinct from the story hero title).
- Published date meta: `11px / 11 / 600`, color `#808080` (grey) (· `.entry-published` · 1280).
- Perex / lead (`.entry-summary`) and bullet-points: `16px / 24 / 600` (bold body) → `--body-font-size-m`
  weight `--weight-semibold`.
- Body (`.entry-content p`): `16px / 24 / 400`, color `#161718` → `--body-font-size-m` / `--skoda-ink`.

**Responsiveness**
- **Two-column ≥ 768** (66.66/33.33). **Stacks to single-column < 768** (both columns full width,
  secondary drops below primary) (· measured: two-col @768, stacked @700/500). Matches the source `768`
  primary breakpoint.
- Title stays `26px` across all viewports (no responsive title scaling, unlike the promo card).
- Container gutter constant `10px` padding; content cap engages only ≥1264.

## 6. Interaction / behavior

- Dark related-media band: Flickity `{"cellAlign":"left","groupCells":true,"pageDots":false}`.
  Measured on Zellmer 2026-09-29 (SKODA-224):
  - No autoplay or wrap, and every cell stays at `opacity:1`.
  - Arrows are hidden (`opacity:0`) when disabled.
  - Each click pages one group: 3 / 3 / 2 / 1 cells at 1280 / 1024 / 768 / 500.
  - Cells follow a 90 / 45 / 30% ladder (breakpoints 768 / 992, capped at the 1248 band): a 374.4px
    cell with a 354.4×199.3 card at 1280.
  - Card title 18/21.6/400 and date 11/600 with 1.1px letter-spacing, both with a
    `0 1px 1px rgb(0 0 0/50%)` shadow.

  The core PR body is static.
- "Download Media Box" triggers the media-cart/package download path (D2 server-side reduction).

## 7. Accessibility

- Single `h1.entry-title`; published date should be a `<time datetime>`.
- Landmarks: `header` (site) / `main` wrapping the article / `article` / `aside` for the secondary column
  (source uses a plain `div.column-secondary`, upgrade to `aside`) / `footer`.
- Section switcher active state must expose current section (see `header-megamenu.md` a11y gate).
- Tags are links; media-kit download buttons need `aria-label`.

## 8. EDS target

- DA `Metadata`: `template=press_release` (underscore — the canonical enum value in
  `SKODA-METADATA-SCHEMA.md` §template and the importer's `TEMPLATE_SIGNALS`; the earlier
  `press-release` hyphen form here and in SKODA-607 is superseded — the import pipeline emits the
  underscore form, matching the source `body.single-press_release` CPT class), plus `model`,
  `bodywork`, `category`, `date`. `body.media-room` → MR header/footer variant selection.
- Section model: one main section (title + primary rich content) + one `aside` section (secondary widgets)
  + one full-width related-media section (`Style: dark, full-width`).
- Reuse: story rich-text decoration **minus the hero**, plus `downloads` + `tags` + `media-cart` +
  `carousel-rails`. Do **not** fork the story template; share the two-column CSS, switch content + side.
- Parser (feeds SKODA-803): detect `press_release`, map `header`→title/date, `.bullet-points`→list,
  `.entry-summary`→lead, `.entry-content`→body, secondary sections→aside blocks, `.cover-box.dark`→related
  section; emit one canonical Metadata block. No hero synthesised.

## 9. Open decisions + recommended default

- **Lead teaser vs hero:** source PR has no hero image; the first primary image is a normal in-content
  image. **Default: no hero** (text title + first content image), matches source. Confirm business doesn't
  want a hero upgrade.
- **Dark related band source/order:** related-by-tag vs curated, and whether it autoplays, confirm live
  across more releases (`carousel-rails.md` retrieval question).
- **Bullet-points:** author inline as a styled list; no bespoke block. Assumption to confirm.

## 10. Pixel-perfect acceptance criteria

- [ ] Shell: MR header (switcher=Media Room) + MR footer; `body`-equivalent MR flag set.
- [ ] No top hero; title = text `h1` `26px/32.5/600 #0a0a0a`, `mb 26px`; date meta `11px/600 #808080` above.
- [ ] Two-column `66.66/33.33` (`.column-primary`/`.column-secondary`) ≥768; **stacks single-column <768**.
- [ ] Primary order: lead image → bullet-points (bold `›` list) → perex `16/24/600` → body `16/24/400`
      (`p` `mb 20`) → any podcast/video embed.
- [ ] Secondary: Additional info (Media contacts) + Download Media Box (round `+`, `downloads.md`) + Images
      preview (lightbox/cart) + Tags (grey chips, `tags.md`) + newsletter + side-banner.
- [ ] Full-bleed dark related-media band after the article, `margin-top 32px`.
- [ ] Content cap `1248`; gutter `10px`; a11y (single h1, `<time>`, `aside`, labeled downloads/tags).
- [ ] Visual diff vs source at 1280/1024/768/500 ≤ 2% per-pixel (article + secondary + related band).

## 11. Reference screenshots

- `assets/template-press-release/desktop-1280.png`, `assets/template-press-release/mobile-500.png`.
