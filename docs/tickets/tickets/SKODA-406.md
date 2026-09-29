# SKODA-406, Listing media-card cell (image / video items)
- **Epic:** E04, Listings & Search
- **Type:** block extension
- **Phase:** A · **Milestone:** M1 (demo-visible on /en/images, /en/videos)
- **GitHub issue:** [#176](https://github.com/skoda-storyboard/demo/issues/176) (sub-issue of #117)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 Ready for QA on branch `skoda-406-listing-media-card`: the media card, size menus and
  lightbox are built and developer-verified on DA test pages (see "Test pages" below). Only the 768 column count waits
  on SKODA-402a.

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
      *Branch preview: exact at 1440 / 1280 / 1024 / 500 / 375. 768 shows 2 columns instead of 3 (SKODA-402a).
      The earlier local deltas at the other widths came from the old page gutter; SKODA-826 is now on `main`.*
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

| 1280 / 1024 / 768 / 500 (local, before SKODA-826) | Source | EDS |
|---|---|---|
| Date row / title area / toolbar | 44 / 46 / 50 | 44 / 46 / 50 |
| Buttons (x: size) | 0: 40×40, 48: 40×40 | same |
| Date font / title font | 11px 600 `#c4c6c7` / 15/18 400 | same |
| Size menu (1280) | 89×80 at (−24.5, +47), rows 89×40, 16/16 500 ls 1px | same |
| Card (w × h) | 292×304.3 / 236×272.8 / 236×272.8 / 480×410 | 285×300.3 / 221×264.3 / 350×336.9 / 452×394.3 |

Both sides follow height = width × 9/16 + 140. On the branch preview (with the SKODA-826 gutter) the cards match
the source at every width except 768; see "Test pages".

- **Functional (local preview):** 14 download links return 200.
  - Every control is named ("Add to media cart: …", "Download: …").
  - Enter on a card opens the lightbox at that card ("2 / 12"); ArrowRight moves on; Esc closes it and focus
    returns to the card.
  - After load more, the lightbox spans the new rows ("13 / 24", one overlay).
  - Size menu: Enter, ArrowUp/Down, Esc; one open at a time; an outside click closes it.
  - Videos load `player.vimeo.com/video/<id>` (200). No page errors.
- **Regression:** the Peaq and Octavia Images/Videos rails are identical to `main`: card counts, sizes and toolbar
  markup hash.

## Test pages (2026-09-29)
DA drafts, exact copies of the `/en/images` and `/en/videos` documents: `/drafts/skoda-406-images` and
`/drafts/skoda-406-videos`
(`https://skoda-406-listing-media-card--demo--skoda-storyboard.aem.page/drafts/skoda-406-images`, `…-videos`).
Compared with the live pages at desktop 1440 / 1280, tablet 1024 / 768 and mobile 375 (touch on tablet and mobile):

- **Card:** size, thumbnail, date row, title area, toolbar, buttons, fonts, colours, radii and the size menu are
  identical at every width except 768 (402a). Button and menu-row states (rest, hover, open) are identical.
- **Functional:** 27 of 27 checks pass on each device class: downloads (200), labels, keyboard, lightbox (opens at
  the card, arrows, Esc + focus return, after load more), size menus, the inert cart, Vimeo playback.
- **Fixed from this comparison:**
  - a third title line showed in the heading's bottom padding; the clamp moved to an inner span, as on the source;
  - the play badge is now the source glyph (a 2px ring around an outlined triangle, `icons/media-play.svg`), not a
    filled triangle;
  - the size menu is left-aligned inside the button ring below 1080px and centred from 1080 (it was always centred).
- **Content:** the feed titles, including filenames such as `hudebni-leto_ee2dfc93`, are what the source shows.
  The source's first 12 images were added on 29 Sep, after the feed was built (SKODA-608 / 511). The 4 newest
  source videos are the domain-restricted Vimeo ones that SKODA-608 does not import.
- **Outside this ticket (listing chrome, SKODA-402a):**
  - facets collapsed behind "Advanced filter (0)" at every width;
  - the Newest / Oldest pills (35px, inactive `#ccc`);
  - no "N / total" count row on the media listings;
  - 3 columns at 768;
  - load more 109px below the last card (EDS 20) and 76px above the footer (EDS 40).
- **Outside this ticket (media cart, SKODA-505a):** the grey "A download package can contain…" limit banner above
  the grid.
- **Outside this ticket (SKODA-208):** the model-page media rails show the same third-line bleed (Peaq: 3 of 28
  titles); `carousel.css` clamps the padded heading.

## Code review (PR #217, 2026-09-29)
- **Inert cart links:** `scripts/media-card.js` now cancels the click of a disabled cart action itself, so no
  consumer (the listing now, the model-page rails after the follow-up) needs its own guard.
- **Lightbox load failure:** if the lightbox code fails to load, the click falls back to the thumbnail link (the
  file / Vimeo URL) and the error is logged.
- **Labels:** `mediaActions(row, title, labels)` takes its text from `mediaLabels(placeholders)`, with English
  defaults per key; the listing passes its placeholders. Placeholder keys: `media-add-to-cart`, `media-download`,
  `media-add-size` / `media-download-size` (with `{size}`), `media-add-video`, `media-download-video`,
  `media-size-original`, `media-size-1920`. The rows in the per-locale placeholders sheets (CZ, DE, SK, SR, SL) are
  content for **SKODA-1003**. The lightbox's own chrome (`scripts/lightbox.js` LABELS) is also English-only there.
- **Consent (dependency):** the video lightbox loads `player.vimeo.com` without a consent check (the path in
  `scripts/media-lightbox.js` is on `main`; the M1 stub means "consent given"). When **SKODA-204a** (#215,
  `hasEmbedConsent()`) merges, the lightbox's Vimeo load must go through the same gate before SKODA-704 / 804 flip it.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows), SKODA-203/216 (lightbox), SKODA-502 (download menu), SKODA-505a (cart),
SKODA-204a (embed consent gate for the video lightbox), SKODA-1003 (per-locale placeholder rows).
