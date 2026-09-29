# SKODA-406, Listing media-card cell (image / video items)
- **Epic:** E04, Listings & Search
- **Type:** block extension
- **Phase:** A · **Milestone:** M1 (demo-visible on /en/images, /en/videos)
- **GitHub issue:** [#176](https://github.com/skoda-storyboard/demo/issues/176) (sub-issue of #117)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 Ready for QA on branch `skoda-406-listing-media-card`: the media card, size menus and
  lightbox are built and developer-verified (see "Implementation" below). The card sizes wait on SKODA-402a / 826.

## Origin
SKODA-608 phase split (2026-09-27). 608 imports the image/video item pages and indexes the download columns; the
card that shows them is block work (608 amendment 2026-09-25: "listing media-card cell").

## Problem (measured, source DevTools 2026-09-27)
- Source card (`article.media-cart-item.image|video`): 16:9 thumbnail (cover crop), date (11px, the parent
  post's date), title / filename (h3, clipped), a toolbar: **images** Original / 1920px add-to-cart + download
  menus; **videos** one add + one MP4 download and a play badge. Click opens a lightbox (image, title, caption,
  counter, prev/next).
- `blocks/listing` renders story cards only: picture, h3 title, description (`listing.js:70-102`); no date,
  toolbar, badge or lightbox. The rows come from the media feed `/en/media-feed.json` (contract `media-item`
  shape 3), which carries `original`, `rendition-1920`, `mp4`, `vimeo-id`, `poster` and `id`. There are no item
  pages: the card's `path` is the image / Vimeo URL until this ticket opens the lightbox instead. Verify thumbnails
  against AEM delivery URLs (M2): `createOptimizedPicture` replaces the query with Media Bus params.

## Scope
- `blocks/listing`: when the scoped template is `image` or `video`, render the media card: 16:9 thumbnail, date
  (`formatCardDate`), title, a download control (the `downloads` size menu pattern: Original / 1920px, or MP4),
  a video play badge, and an add-to-cart slot left for SKODA-505a. No description paragraph.
- Click on the thumbnail opens the lightbox (reuse the gallery lightbox; coordinate with the listing-lightbox slice
  of SKODA-216/203) with title + caption; videos open the Vimeo player.
- Stories/news listings keep the current card.

## Acceptance Criteria
- [ ] /en/images, /en/videos at 1280/1024/768/500: card anatomy and sizes match the source ±2px.
      *Anatomy: exact at all four widths (see below). Sizes: they follow the grid, so they wait on SKODA-402a
      (768: 3 columns) and SKODA-826 (10px gutter).*
- [x] Download links resolve (CDN Original, 1920px, MP4); labelled controls; keyboard operable.
- [x] Lightbox opens from every card (Esc closes, focus returns); videos play (non-restricted Vimeo).
- [x] Model-page Images/Videos rails unaffected unless they opt in; lint + tests green; no re-import.
      *`npm test`: 2 importer tests (`media-lib`, `skoda-links` allow-list) also fail on `main`; not touched here.*

## Implementation (2026-09-29, developer-verified; QA pending)
- `scripts/media-card.js` (new): `mediaActions(row, title)`, the add + download controls from a feed row.
  - **Images:** two size menus (Original / 1920px); a direct download link when the row has one size.
  - **Videos:** an add button and an MP4 link.
  - The cart actions carry `data-id` / `data-size` and stay `aria-disabled` until SKODA-505a.
  - Also `playBadge()`.
- `blocks/listing`: `template: image|video` adds `listing-media` / `listing-<template>` and renders `mediaCell`
  (thumbnail link, date, title, actions, no description). A card click opens the shared lightbox at that card;
  the lightbox code loads on the first open and is rebuilt when the shown rows change.
- **Deviation from the plan:** `story-rail.js` keeps its own toolbar, because PR #206 (SKODA-224) edits the same
  file (collision rule). Follow-up: move the rails onto `mediaActions` once #206 has merged.
- Spec: [`faceted-listing.md`](../../ui-specs/faceted-listing.md) §3 "Media card".

| 1280 / 1024 / 768 / 500 | Source | EDS |
|---|---|---|
| Date row / title area / toolbar | 44 / 46 / 50 | 44 / 46 / 50 |
| Buttons (x: size) | 0: 40×40, 48: 40×40 | same |
| Date font / title font | 11px 600 `#c4c6c7` / 15/18 400 | same |
| Size menu (1280) | 89×80 at (−24.5, +47), rows 89×40, 16/16 500 ls 1px | same |
| Card (w × h) | 292×304.3 / 236×272.8 / 236×272.8 / 480×410 | 285×300.3 / 221×264.3 / 350×336.9 / 452×394.3 |

Both sides follow height = width × 9/16 + 140. The width deltas are the grid (402a) and the gutter (826).

- **Functional (local preview):** 14 download links return 200.
  - Every control is named ("Add to media cart: …", "Download: …").
  - Enter on a card opens the lightbox at that card ("2 / 12"); ArrowRight moves on; Esc closes it and focus
    returns to the card.
  - After load more, the lightbox spans the new rows ("13 / 24", one overlay).
  - Size menu: Enter, ArrowUp/Down, Esc; one open at a time; an outside click closes it.
  - Videos load `player.vimeo.com/video/<id>` (200). No page errors.
- **Regression:** the Peaq and Octavia Images/Videos rails are identical to `main`: card counts, sizes and toolbar
  markup hash.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows), SKODA-203/216 (lightbox), SKODA-502 (download menu), SKODA-505a (cart).
