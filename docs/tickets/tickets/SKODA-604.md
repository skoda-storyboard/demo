# SKODA-604, Full-fidelity restore on 1–2 hero demo stories
- **Epic:** E06, Import Pilot Content
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **GitHub issue:** [#38](https://github.com/skoda-storyboard/demo/issues/38) (`human-gate`)
- **Status (2026-10-10):** 🟡 Media restore delivered (#113, #156, #269). The last gap, the Media Box lightbox, is
  fixed on branch `skoda-604-media-box-lightbox`, stacked on #307. The human visual sign-off is pending; see
  "Re-check".

## UI Specification
**Render/assembly target: [`docs/ui-specs/story-detail.md`](../../ui-specs/story-detail.md)** (the STO-D01→D10 block-assembly map + measured article geometry), which cross-references the atomic specs this ticket exercises: [`gallery-lightbox.md`](../../ui-specs/gallery-lightbox.md) (203), [`embeds.md`](../../ui-specs/embeds.md) (204), [`downloads.md`](../../ui-specs/downloads.md) (502), [`media-cart.md`](../../ui-specs/media-cart.md) (505). The restored hero stories must render each in-body part to its atomic spec's pixel-perfect AC, and the article shell to story-detail's two-column geometry (`.content` 66.66% + `.sidebar` 33.33%, stacking <768).

**Scope note (2026-09-15):** this covers the **Storyboard `single-post` story** only. Press releases (`single-press_release`, 47.5% of pages) are a **distinct template**, now split out to **SKODA-607** / [`template-press-release.md`](../../ui-specs/template-press-release.md). See the full page-type map in [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

## Summary
The 48 imported story pages are **flattened** to hero + title + body, the flatten deliberately drops in-body **image galleries (lightbox)**, **video embeds (YouTube/Vimeo)**, and the bottom **Media Box** download gallery (confirmed present on live stories by the 22-URL analysis, 2026-09-14). For the demo, restore **full fidelity on 1–2 hero stories** so the real article experience is shown, while the rest stay flattened (decision D18).

## Description
Bucket A of `.migration/plans/url-analysis-comparison.md` verified that real story bodies contain galleries, YouTube embeds, and a 7–14-image Media Box. **Updated 2026-09-24:** the SKODA-801 flatten now **emits Gallery blocks** for the SiteOrigin image carousels/sliders (`sow-slider`, and link-free `skoda-carousel-widget`; a link-bearing carousel routes to Cards instead), so those are no longer dropped. What this ticket still restores is the content the flatten defers: the **colorbox/`.sb-gallery` lightbox galleries, YouTube/Vimeo embeds, and the bottom Media Box** (dropped + logged by `skoda-story-cleanup`). This ticket picks **1–2 visually rich hero stories** (e.g. the olive-oil lifestyle piece or `how-the-skoda-octavia-reached-365-km-h`) and re-imports them with those blocks in place.

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> **Hero stories.** Pick them only from the 43-URL set. The olive-oil story is **not** in the set. Recommended:
> - `/en/skoda-world/how-the-skoda-octavia-reached-365-km-h/`: 5 in-body carousels + Media Box
> - `/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia/`: carousel + Vimeo + Media Box
>
> **Split of work.** The baseline media reconstruction for all 21 stories is split (review §15):
> - carousel → SKODA-819 (Gallery `slider`; supersedes SKODA-219)
> - Media Box → downloads (**SKODA-801a**)
> - Vimeo → embed (SKODA-818, done in #113)
>
> This ticket is therefore limited to **full visual fidelity** (≤2% diff, lightbox, cart hook) on the 2 hero stories.
> Estimate unchanged at 2 SP.

This is a **bounded demo deliverable**, not the full-fidelity parser at scale (that remains M2 / SKODA-801 long tail). It exercises the E02 blocks (SKODA-203 gallery+lightbox, SKODA-204 embeds) and E05 media (SKODA-502 downloads / SKODA-505 cart) end-to-end on a real page.

## Requirements / Spec
- Select 1–2 hero stories with in-body galleries + a video embed + a Media Box.
- Extend the story parser/transformer path to preserve (not flatten) those in-body blocks for the selected pages: map galleries → gallery block (+ lightbox), embeds → embed autoblock (`dnt=1`, lazy), Media Box → downloads/media-cart block.
- Media pre-conditioning applies (no >~10 MB masters → content-bus 409).
- Rest of the story corpus is unchanged (stays flattened).

## Re-check (2026-10-10, live vs origin, Chrome, measured; no screenshots)

| | Octavia 365 km/h | Peaq production |
|---|---|---|
| In-body galleries | 5 `Gallery (slider)` = the origin's 5 carousels | 3 = 3 |
| In-body lightbox | none, as on the origin: its Flickity carousels are plain sliders, and the only colorbox on these pages is the Media Box | same |
| Lazy video | n/a (the origin has none) | Vimeo `dnt=1`: 0 requests on load, loads near the viewport, plays (no domain error) |
| Media Box | 16 tiles, download + cart on 16/16 | 13 tiles, 13/13 |
| Block order | hero → body + sliders → sidebar → Media Box → Related (= origin) | same, plus the highlight box |
| All blocks `loaded`, published | yes | yes |

- **Gap (the same as #38's 2026-10-08 comment):** a Media Box tile image linked to the raw JPEG. The origin opens
  its colorbox on the box group (`rel="media-box-1"`).
  - `downloads.js` never loaded the shared lightbox, although its header claimed so.
  - Affected: every Media Box.
- **Fix (`downloads.js`):**
  - In a Media Box (and a `Downloads (gallery)` group), a tile image opens `scripts/lightbox.js` on the block's
    images.
  - The panel shows the title; add / download / copy-link on the original; file type, plus the date when the row
    has one; and the page as the related article.
  - PDF file tiles keep their link. A clip shows its poster with the MP4 as the download, because the AEM Assets
    original is served as an attachment and would download in a player frame.
  - Modifier clicks keep the link. The lightbox loads on the first click; if it fails, the link is followed.
- **Measured, branch preview vs origin colorbox, Peaq at 1440:**

  | | Origin | Branch |
  |---|---|---|
  | Stage image | 1152×791 | 1152×791 |
  | Panel width | 256 | 256 |
  | Prev / next / close | 61×60 / 61×60 / 60×60 | 61×60 / 61×60 / 60×60 |
  | Group | 13 | 13 (ArrowRight 2/13, End 13/13) |
  | Download | the original | the same original |

  - Escape closes, focus returns to the tile, and the page URL is unchanged.
  - At 375: the image is 375×258, the details toggle opens the panel, and add-to-cart from the lightbox works
    (`aria-pressed=true`).
  - On the Pamplona release: 11 of 14 tiles join (3 PDF tiles keep their link); the clip shows its 1152×648
    poster, with no browser download.
- **Deviations left:**
  - The counter reads "1 / 13" (the shared Media Room style) where the story colorbox reads "1/13".
  - The panel lacks the origin's file size, dimensions and published date: the Media Box rows don't carry them.
  - The press-kit Images groups still hold plain `Downloads` in DA (SKODA-837 note), so they get the lightbox only
    after a re-push as `Downloads (gallery)`.
  - The ≤2% visual diff is not measured; it is the #38 human gate.
- **Tests:**
  - `downloads.test.mjs` 36/36, with 3 new tests. The `matchMedia` stub now handles non-width queries.
  - Full `npm test`: 1137 pass, only the known `media-cart-download` failure.
  - Lint clean.

## Acceptance Criteria
- [x] 1–2 selected stories render in-body galleries with working lightbox, a lazy video embed, and a Media Box with per-item download / add-to-cart. *(In-body sliders as the origin; Media Box lightbox via this branch, after #307; Vimeo lazy on Peaq.)*
- [x] Media assets are pre-conditioned; preview/publish succeeds (no 409). *(Both published 2026-10-06, SKODA-830.)*
- [x] Local preview matches the source article's block sequence for the selected pages.
- [x] Output passes lint; other story pages unaffected. *(Code-only change in the shared Downloads block: all Media Boxes gain the lightbox; no content change.)*
- [ ] Human visual sign-off on the 2 hero stories (#38 `human-gate`, ≤2% diff).

## Dependencies
- Upstream: SKODA-203 (gallery+lightbox), SKODA-204 (embeds), SKODA-502 (downloads), SKODA-505 (media cart), SKODA-601/602 (import infra + DA push), SKODA-801 (story flatten path being extended)
- Downstream: demo script (Media-cart loop-closing demo can use these stories' Media Box)

## Risks / Flags
- Gallery lightbox + cart a11y is `[RUNTIME-UNCONFIRMED]`, verify in a browser (shared concern with SKODA-203/807).
- Ties to D2 (media-cart download) + D5 (AEM Assets), the Media Box add-to-cart path shares those dependencies.
