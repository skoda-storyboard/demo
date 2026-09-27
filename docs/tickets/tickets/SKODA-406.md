# SKODA-406, Listing media-card cell (image / video items)
- **Epic:** E04, Listings & Search
- **Type:** block extension
- **Phase:** A · **Milestone:** M1 (demo-visible on /en/images, /en/videos)
- **GitHub issue:** [#176](https://github.com/skoda-storyboard/demo/issues/176) (sub-issue of #117)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

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
- [ ] Download links resolve (CDN Original, 1920px, MP4); labelled controls; keyboard operable.
- [ ] Lightbox opens from every card (Esc closes, focus returns); videos play (non-restricted Vimeo).
- [ ] Model-page Images/Videos rails unaffected unless they opt in; lint + tests green; no re-import.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows), SKODA-203/216 (lightbox), SKODA-502 (download menu), SKODA-505a (cart).
