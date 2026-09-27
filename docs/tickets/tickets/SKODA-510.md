# SKODA-510, Downloads file tiles (PDF / no-image rows) + mobile Show more
- **Epic:** E05, Media Pipeline
- **Type:** block extension
- **Phase:** A · **Milestone:** M1 (demo-visible on every press release)
- **GitHub issue:** [#173](https://github.com/skoda-storyboard/demo/issues/173) (sub-issue of #47; not yet on Project #1)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

## Origin
SKODA-607 phase split (2026-09-27). The 607 importer now emits every Media Box item; the block drops some of them.

## Problem (measured, source DevTools 2026-09-27)
- Every M1 press-release Media Box contains a **PDF of the release** (`YYMMDD_<Title>_<hash>.pdf`): an
  `article.media-cart-item` with no image, only a `span.file-caption.pdf` icon, a title and a single download.
- `blocks/downloads` silently drops rows with no image: `readAsset` only takes `src` from an `<img>`
  (downloads.js:143-147) and `buildTile` returns `null` without it (downloads.js:248-249). The PDF is invisible
  on all 5 live releases.
- Video items (Peaq) carry a Vimeo poster and a single MP4 download. They already render as image tiles with one
  download; only the video affordance (play badge) is missing. The same video is embedded in the article body.
- Below 768 the source collapses the grid behind a **"Show more / Show less"** toggle (`.togglebox-opener`);
  EDS shows every tile stacked.
- SKODA-503 only routes PDF/MP4 as plain links; it doesn't cover tiles in `downloads`.

## Scope
- `blocks/downloads`:
  - render a row without an image as a **file tile**: file-type icon (PDF), title, one round download control;
    same 292px tile grid (4-up at 1280, 3 at 768, 1 at 500);
  - a video row (poster + single `MP4` link) shows a play badge on the poster, as the source; the round control
    downloads the MP4 (opening the player in a lightbox would need a shape change: bump `shape` if wanted);
  - below 768, show the first tile(s) and a "Show more / Show less" toggle (button, `aria-expanded`), as the source.
- No change for image rows (the Original/1920 menu stays as SKODA-502 built it).

## Acceptance Criteria
- [ ] All 5 M1 press releases show the PDF tile; Peaq shows the video tile with MP4 download; counts match the
      source stats line ("1 video, 3 images, 1 PDF").
- [ ] Tile geometry at 1280/1024/768/500 matches the source ±2px; toggle behaviour <768 as the source.
- [ ] Every download link resolves (no 404/403); `aria-label` per control.
- [ ] Story Media Box (SKODA-801a) unchanged apart from gaining its PDF tiles.
- [ ] lint + tests green; no re-import needed (contract shape 1).

## Dependencies
SKODA-502 (downloads block), SKODA-503 (PDF/MP4 routing), SKODA-607 (emits the rows), SKODA-505a (cart hook, later).
Consumers: SKODA-607, SKODA-801a, SKODA-805c.

## Import contract (SKODA-603)
Contract `downloads-file-rows` (**pinned 2026-09-27**, fallback **readable**: image tiles only, as live today) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Row shape (every Downloads
row is 3 cells): `[<picture> or empty, title text, links]`. The links cell holds one `<a>` per size, its text the
size label: `Original` + `1920px` for images, `MP4` for video, `PDF` for documents. A video/PDF row is recognised
by its single link's file extension. Emitted by `parsers/downloads.js`.
