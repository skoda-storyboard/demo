# SKODA-510, Downloads file tiles (PDF / no-image rows) + mobile Show more
- **Epic:** E05, Media Pipeline
- **Type:** block extension
- **Phase:** A · **Milestone:** M1 (demo-visible on every press release)
- **GitHub issue:** [#173](https://github.com/skoda-storyboard/demo/issues/173) (sub-issue of #47)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-28):** 🟡 implemented on PR #186; branch-preview QA passed for press-release
  Media Boxes, with review fixes for configurable columns and accessible controls pending re-QA.
  Story rendering is covered by a unit test only (no published story has a Downloads block yet).

> **Browser re-measure (2026-09-27):** The source's disclosure is **count-triggered, not mobile-only**:
> Peaq's five tiles have no toggle at 500px; a 19-tile story box collapses after two rows at both
> 500 and 1280px. The press-release grid switches 1→2 columns at 520px, 2→3 at 768px and 3→4 at
> 992px. SKODA-510 matches this measured source behavior for the Media Box variant; story content
> validation after SKODA-801a re-import remains with SKODA-801a. See `docs/ui-specs/downloads.md`.

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
- Larger source boxes (>8 assets) collapse behind a **"Show more / Show less"** toggle
  (`.togglebox-opener`) at all viewport widths. Smaller boxes show every tile; the old EDS block
  had no disclosure for larger boxes.
- SKODA-503 only routes PDF/MP4 as plain links; it doesn't cover tiles in `downloads`.

## Scope
- `blocks/downloads`:
  - render a row without an image as a **file tile**: file-type icon (PDF), title, one round download control;
    same 292px tile grid (4-up at 1280, 3 at 768, 1 at 500);
  - a video row (poster + single `MP4` link) shows a play badge on the poster, as the source; the round control
    downloads the MP4 (opening the player in a lightbox would need a shape change: bump `shape` if wanted);
  - on Media Boxes with more than eight tiles, show two rows and a "Show more / Show less" toggle
    (button, `aria-expanded`); optionally set `collapse=none` to show all.
- No change for image rows (the Original/1920 menu stays as SKODA-502 built it).

## Acceptance Criteria
- [x] All 5 M1 press releases show the PDF tile; Peaq shows the video tile with MP4 download; counts match the
      source stats line ("1 video, 3 images, 1 PDF").
- [x] Tile geometry at 1280/1024/768/500 matches the source ±2px; count-triggered toggle behaviour
      matches the source, including the 519/520 column transition.
- [x] Every download link resolves (no 404/403); `aria-label` per control.
- [ ] Story Media Box (SKODA-801a) unchanged apart from gaining its PDF tiles.
      No published story currently renders Downloads; non-Media Box behavior is unit-tested, with
      rendered story validation due when SKODA-801a publishes its Media Boxes.
- [x] lint + tests green; no re-import needed (contract shape 1).
- [x] Remove the interim `decorateMediaBoxFiles` fallback in `templates/press-release/press-release.js` (+ its
      `.press-release-files` CSS). It already renders nothing once the block outputs a link for every file row, so
      this is cleanup, not a behaviour change (added on PR #170 review, 2026-09-27).

Local QA evidence (Chrome DevTools DOM/CSS, no screenshots): visual tile widths on source/EDS match
exactly at 1280/1024/768/500 (292/236/236/480px); other tile dimensions differ by <1px.
Peaq renders five tiles with eight labelled links and no fallback; the four other M1 releases
each render their PDF. All 32 authored direct-download links return 206 to ranged GET requests
(the signed redirects reject HEAD). A synthetic nine-item box shows two collapsed rows and toggles
visibility/`aria-expanded`. Branch-preview QA on PR #186 confirmed the Peaq, Zellmer, Superb and
35-tile Slavia Media Boxes, responsive geometry and keyboard interaction. Review follow-up adds
authored `columns`/`collapse` coverage, focus rings and a precise video-poster link label.
On dark Media Box sections, the global `main .section.dark a` rule overrode the round download
link's ink color, leaving PDF/MP4 icons white on white. The block now gives its download control
enough specificity to keep the link icon dark, as the image-menu button already was.

## Dependencies
SKODA-502 (downloads block), SKODA-503 (PDF/MP4 routing), SKODA-607 (emits the rows), SKODA-505a (cart hook, later).
Consumers: SKODA-607, SKODA-801a, SKODA-805c.

## Import contract (SKODA-603)
Contract `downloads-file-rows` (**pinned 2026-09-27**, historical fallback: image tiles only) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Row shape (every Downloads
row is 3 cells): `[<picture> or empty, title text, links]`. The links cell holds one `<a>` per size, its text the
size label: `Original` + `1920px` for images, `MP4` for video, `PDF` for documents. A video/PDF row is recognised
by its single link's file extension. Emitted by `parsers/downloads.js`.
