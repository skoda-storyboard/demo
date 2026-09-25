# Component Spec: Story Detail (article assembly)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshots saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

This is a **composition / assembly** spec. It measures only the article shell that no atomic spec
covers, the **content column geometry**, the **rich-text typography**, and the **sidebar**. Every
sub-part (hero, tags, gallery, embeds, media box, related rail) is delegated to its own atomic spec via
the §7 assembly map.

> **Sweep correction (2026-09-25).** The DevTools URL→block sweep ([registry](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md), [report](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §7) disproved the points below on the live M1 pages. They override the sections they name until this spec is re-captured:
>
> - The article anatomy must include the **in-body `widget_skoda-carousel-widget` 3:2 image sliders** (19 across the 8 emobility stories, → SKODA-819). These are distinct from card rails.
> - Below the sidebar there are **two separate full-width dark bands**: Media Box, then Related Stories. There are also 24px `skoda-offset` spacer widgets on desktop.
> - The hero published date and the "Based on tags" subtitle are optional per page. The category link is always present.
> - Related Stories may use a curated rail without a "Based on tags" subtitle; do not synthesize one. The Epiq index-fed variant has measured band/card geometry in [`carousel-rails.md`](carousel-rails.md) and [SKODA-820](../tickets/tickets/SKODA-820.md).

## 1. Identity

- **Component:** Story-detail page, the full article: hero → header (title/perex/date/tags) → rich-text
  body with in-line media → sidebar (subscribe / related / promo) → social share → related-stories rail
  → media box. The EDS build (SKODA-604) assembles it from existing blocks; SKODA-801 **flattens** the
  source SiteOrigin widget tree into default rich-text content.
- **EDS block(s):** page = default section content + a `sidebar` section; sub-parts reuse
  `hero-image`, `tags`, `gallery`, `embed`/`widget`, `downloads`/`media-cart`, `carousel`/`story-rail`,
  `cards-overlay`.
- **Client PDF IDs:** STO-D01–D10. Ticket: **SKODA-604** (build) + **SKODA-801** (flatten).
- **Scope note (corrected 2026-09-15):** this spec is the **Storyboard `single-post` story** only
  (STO side, `.content`/`.sidebar`, top hero image). The **press release** (`single-press_release`,
  MR-PR IDs) shares the two-column shell but is a **distinct template**, no top hero, `.column-primary`/
  `.column-secondary`, media-kit downloads in the secondary column, MR side, plus a dark related band. It
  now has its own spec: [`template-press-release.md`](template-press-release.md) (SKODA-607). Do not build
  the press release from this story shell. See also [`_TEMPLATES.md`](_TEMPLATES.md).
- **Source reference:**
  `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
  (`body.single-post.post-template-template-layout-article.siteorigin-panels`).
- **Top-level selectors:** `article .columns` (the two-column shell), `.columns > .content` (66.66%
  primary), `.columns > .sidebar` (33.33% secondary), `.siteorigin-widget-tinymce.textwidget` (the
  rich-text widget = the flatten target).

## 2. Source anatomy

```
body.single-post.post-template-template-layout-article.siteorigin-panels
├── .hero  (single-post hero: title above image, ink)                → hero.md Variant A
│   └── .hero-caption > .perex + .published + .category(.label tags)  → tags.md
└── main > article
    └── .columns   (display:flex; flex-wrap:wrap; margin:-10px)       the 2-column shell
        ├── .content   (flex 0 0 66.6667%; margin-top:2rem)           PRIMARY reading column (819px @1280)
        │   └── .panel-grid / .so-panel / .siteorigin-widget-tinymce.textwidget   ← SiteOrigin widgets
        │       ├── p / h2 / h3 / ul / blockquote / figure            rich text (the flatten target)
        │       ├── .video-container / .embed-controller-wrapper      in-body embeds        → embeds.md
        │       ├── .sb-gallery / a.colorbox                          in-body gallery       → gallery-lightbox.md
        │       └── .items > article.media-cart-item ("Media Box")    per-image downloads   → downloads.md / media-cart.md
        └── .sidebar   (flex 0 0 33.3333%; static)                    SECONDARY column (409px @1280)
            ├── section.newsletter-subscribe-widget                   subscribe            (STO-D07)
            ├── section.related  "Explore more" (3 .article-teaser)   related stories      → card-teaser.md
            ├── section.tags (ol.entry-tags.label)                    tag row              → tags.md
            └── section.side-banner                                   promo banner         (STO-D07)
   plus a floating share control:
   .btn-group.social.color > .btn.icon.icon-share + .social-container   share menu         (STO-D10)
```

**The SiteOrigin flatten target (SKODA-801):** the article body is a tree of SiteOrigin Panels
(`.panel-grid` rows → `.so-panel` widgets), and the prose lives inside
`.siteorigin-widget-tinymce.textwidget`. In the EDS rebuild this whole tree collapses to **default
section content** (plain `p/h2/h3/ul/blockquote/figure` markdown), **spacer/row/column widgets are
dropped**, and each non-text widget (embed, gallery, media box) becomes its dedicated EDS block. The
`.columns` shell becomes a section with a `sidebar` style.

**Libraries / patterns to retire:** SiteOrigin Panels + `so-widget-*`, jQuery, `dotdotdot`, colorbox,
Flickity (related rail), icon-font share glyphs, the WP `.columns` float/flex shell.

## 3. Measured visual spec (the shell + rich text only)

All rows: `measured (source-url · selector · viewport) → token`. Source = the Epiq story URL above
(abbrev `…/skoda-epiq…/`).

### Page + content-column geometry
- `.columns`: `display:flex; flex-wrap:wrap; margin:-10px`; container width **1228px** (= `1248`
  content cap minus the 10px gutter) (· `.columns` · 1280) → `--content-max-width: 1248px`.
- `.content` (primary): `flex:0 0 66.6667%; max-width:66.6667%; margin-top:2rem` → measured
  **819px** reading column at 1280/1024 (· `.content` · 1280). This is a **wide measure** (~100+ chars).
- `.sidebar` (secondary): `flex:0 0 33.3333%; max-width:33.3333%` → **409px** (· `.sidebar` · 1280);
  `position:static` (**not sticky**).

### Rich-text typography (inside `.content .textwidget`)
- paragraph `p`: `font-size:16px; line-height:24px (1.5); font-weight:400; color:#161718;
  margin-bottom:20px` (· `.textwidget p` · 1280) → `--body-font-size-m`, `--skoda-ink`, `--weight-regular`;
  `20px` bottom gap has no exact token (between `--spacing-m 16` and `-l 24`) → candidate
  `--prose-paragraph-gap: 20px`.
- `h2`: `font-size:40px; line-height:45px; font-weight:300; margin-bottom:16px` (· `.content h2` · 1280) →
  `40px` reuse `--heading-font-size-hero-story: 40px` (from `hero.md`); weight `300` reuse
  `--weight-light`; margin → `--spacing-m`. Drops to **`24px` on mobile** (measured @500).
- `h3`: `font-size:24px; line-height:27.6px; font-weight:300; margin-bottom:16px` (· `.content h3` · 1280) →
  `24px` (≈ `--heading-font-size-l 26px`, close), weight `--weight-light`.
- `ul` (prose): `list-style:none; padding-left:1.5em` (custom bullet) (· `.entry-content ul` source CSS);
  `li` inherits the `16px/24px` body scale.
- `blockquote`: no strong source styling (only a `quotes` rule for non-EN); renders near default →
  recommend an EDS quote style (left rule + italic) as an upgrade (see §8).
- inline links in prose: `--link-color` (ink) with underline, hover `--link-hover-color` (green) (brand
  defaults; no per-article override found).
- `figure` / caption: figure = full content width; caption `.wp-caption-text` `font-weight:300`,
  `text-align:center` when `.aligncenter` (· source CSS) → weight `--weight-light`, muted.

### Sidebar (`.sidebar`)
- static two-thirds-down column of 4 stacked sections (subscribe / related / tags / promo banner);
  each is full sidebar width (409px @1280). The `related` section = an "Explore more" heading + 3
  stacked `.article-teaser` cards (**not** a Flickity rail here). `newsletter-subscribe-widget` is
  shown on the story (note: `.media-room .newsletter-subscribe-widget{display:none}` hides it on the
  media room, but on `single-post` it renders, STO-D07).

### Social share (`.btn-group.social`, STO-D10)
- a round `.btn.icon.icon-share` (`58×58`, ink glyph) in a `.btn-group.social.color` that expands a
  `.social-container` (network buttons), a **share menu**, not an always-visible inline row (· measured
  `.btn.icon.icon-share` box `58×58`). Reuse the round-icon sizing from `media-cart.md` floating cart badge.

## 4. Responsive behavior

- **Two-column → stacked.** At `≥768` the `.content`/`.sidebar` split is `66.66% / 33.33%`; at `≤767`
  `.columns` becomes `display:block` and the sidebar stacks **below** the content, full width
  (`.sidebar{flex-direction:column}`) (· measured 1280 flex vs 500 block/stacked).
- **Prose scale steps down:** `h2` `40px → 24px` at mobile (measured @500); `p` stays `16px/24px`.
- **Content cap:** the whole article caps at `1248px` (`--content-max-width`).
- Hero, tags, gallery, embeds, rails follow their own atomic specs' breakpoints.

## 5. Interaction states

- **In-body media** (gallery/embed/media box) carry their own states, see the atomic specs.
- **Social share:** clicking `.btn.icon.icon-share` expands the `.social-container` network menu (STO-D10).
- **Related rail / sidebar cards:** card hover/focus per `card-teaser.md` §5.
- **Sidebar** is static (no sticky-follow in source); an optional `position:sticky` is an EDS enhancement
  (see §8).

## 6. Accessibility

- One `<h1>` per page = the hero title (per `hero.md`); body headings start at `<h2>` and nest correctly
  (`h2` → `h3`, no skips), which the flatten must preserve.
- Reading measure: 819px at `16px` is ~100 chars/line, above the ~75ch comfort target; recommend capping
  the prose measure (see §8) for readability.
- Sidebar sections are `<aside>`/`<section>` with headings; the related list is a real `<ul>`.
- Social share: real `<button aria-expanded aria-controls>` opening a labeled menu of link `<a>`s
  (source uses icon-font glyphs with no labels, an a11y gap to fix); visible `:focus-visible`.
- Rich-text links get discernible text (no bare "click here"); figures use `<figure>/<figcaption>`.
- All the atomic-block a11y gates (gallery dialog, embed consent, tags focus) apply where present.

## 7. Assembly map (STO-D0x → EDS block)

| STO ID | Article part | Source selector | EDS block / spec |
|---|---|---|---|
| STO-D01 | Story hero (title/perex/date) | `.hero` (single-post, ink) | `hero-image` Variant A, [`hero.md`](hero.md) |
| STO-D02 | Rich-text body | `.content .textwidget` p/h2/h3/ul/blockquote | **default section content** (this spec §3); flatten SKODA-801 |
| STO-D03 | In-body embed (video/podcast) | `.video-container` / `.embed-controller-wrapper` | `embed`/`widget`, [`embeds.md`](embeds.md) |
| STO-D04 | In-body image gallery | `.sb-gallery` / `a.colorbox` | `gallery`, [`gallery-lightbox.md`](gallery-lightbox.md) |
| STO-D05 | In-body figure + caption | `figure` / `.wp-caption-text` | default content (this spec §3) |
| STO-D06 | Related-stories cards | `.related .article-teaser` | `cards-overlay`, [`card-teaser.md`](card-teaser.md) |
| STO-D07 | Sidebar (subscribe / related / promo) | `.sidebar` sections | `sidebar` section (this spec §3); subscribe = form, promo = banner |
| STO-D08 | Media box / downloads | `.items > article.media-cart-item` | `downloads` [`downloads.md`](downloads.md) / `media-cart` [`media-cart.md`](media-cart.md) |
| STO-D09 | Add-to-cart on media | `a.media-cart-action` | `media-cart` affordance, [`media-cart.md`](media-cart.md) |
| STO-D10 | Social share | `.btn-group.social` | share control (this spec §3, §6); round-icon sizing per `media-cart.md` |
|, | Tags row | `ol.entry-tags.label` | `tags`, [`tags.md`](tags.md) |
|, | Bottom Related Stories band (distinct from STO-D06 sidebar) | `.cover-box.dark .related-stories` | `story-rail` → dated `carousel` in a dark section, [`carousel-rails.md`](carousel-rails.md) / [SKODA-820](../tickets/tickets/SKODA-820.md) |

## 8. Open decisions + recommended default

- **Prose measure:** cap the reading column at `~72ch` (≈ `680px`) inside the 819px content column for
  readability, rather than filling the full 66.66%, assumption to confirm (source fills the column).
- **Sidebar behavior:** recommend `position:sticky; top:var(--nav-height)` on desktop so the sidebar
  follows long articles; stacks below content at `<768` (matches source stacking), assumption to confirm
  (source sidebar is static).
- **Blockquote:** add an EDS quote style (left `--gallery-accent` rule + italic) as an upgrade over the
  near-default source blockquote, assumption to confirm.
- **Flatten (SKODA-801):** rich text = default content; **drop** SiteOrigin spacer/row/column widgets;
  each embed/gallery/media-box widget → its dedicated block; preserve heading order (h2→h3).
- **Share:** rebuild `.btn-group.social` as a labeled `<button>` share menu (native Web Share on mobile,
  network links on desktop), confirm the network set with the client.
- **New/reused tokens:** reuse `--content-max-width: 1248px`, `--heading-font-size-hero-story: 40px`,
  `--weight-light: 300`, `--body-font-size-m`, `--skoda-ink`; add `--prose-paragraph-gap: 20px` (and an
  optional `--prose-measure: 72ch`).

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Shell: `.columns` / ≥768 / two columns `66.66% / 33.33%`; / <768 / stacked (content, then sidebar),
      full width; container caps at `1248px`.
- [ ] Content column: `.content` / 1280 / ~`819px` (or agreed `~72ch` measure), `margin-top:2rem`.
- [ ] Paragraph: `.content p` / all / `16px / 24px / weight 400 / #161718`, `margin-bottom:20px`.
- [ ] h2: `.content h2` / ≥1080 / `40px / 45px / weight 300`, `margin-bottom:16px`; / mobile / `24px`.
- [ ] h3: `.content h3` / all / `24px / 27.6px / weight 300`.
- [ ] Lists: `.content ul` / all / custom bullet, `padding-left:1.5em`, `16px/24px` items.
- [ ] Figure/caption: figure full content width; caption weight `300`, centered when centered.
- [ ] Sidebar: `.sidebar` / ≥768 / 33.33%, sections = subscribe + related ("Explore more", 3 cards) +
      tags + promo; / <768 / stacked below content.
- [ ] Social share: `.share` / all / round `58×58` icon; expands a labeled network menu (STO-D10).
- [ ] Assembly: each STO-D0x part renders via its mapped block (§7); no SiteOrigin widget markup remains
      (flatten complete).
- [ ] A11y: single `<h1>` (hero); body headings h2→h3 no skips; sidebar `<aside>`; share is a labeled
      `<button aria-expanded>`; `:focus-visible` throughout; atomic-block a11y gates pass.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/story-detail/`: `article-1280.png` (two-column shell: 66/33 content + sidebar, rich text,
"Explore more" related + tags + promo), `article-mobile-500.png` (stacked content-then-sidebar, h2 at
24px). Per-sub-part captures live in the atomic specs' `assets/` folders.
