# SKODA-604, Full-fidelity restore on 1–2 hero demo stories
- **Epic:** E06, Import Pilot Content
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
**Render/assembly target: [`docs/ui-specs/story-detail.md`](../../ui-specs/story-detail.md)** (the STO-D01→D10 block-assembly map + measured article geometry), which cross-references the atomic specs this ticket exercises: [`gallery-lightbox.md`](../../ui-specs/gallery-lightbox.md) (203), [`embeds.md`](../../ui-specs/embeds.md) (204), [`downloads.md`](../../ui-specs/downloads.md) (502), [`media-cart.md`](../../ui-specs/media-cart.md) (505). The restored hero stories must render each in-body part to its atomic spec's pixel-perfect AC, and the article shell to story-detail's two-column geometry (`.content` 66.66% + `.sidebar` 33.33%, stacking <768).

**Scope note (2026-09-15):** this covers the **Storyboard `single-post` story** only. Press releases (`single-press_release`, 47.5% of pages) are a **distinct template**, now split out to **SKODA-607** / [`template-press-release.md`](../../ui-specs/template-press-release.md). See the full page-type map in [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

## Summary
The 48 imported story pages are **flattened** to hero + title + body, the flatten deliberately drops in-body **image galleries (lightbox)**, **video embeds (YouTube/Vimeo)**, and the bottom **Media Box** download gallery (confirmed present on live stories by the 22-URL analysis, 2026-09-14). For the demo, restore **full fidelity on 1–2 hero stories** so the real article experience is shown, while the rest stay flattened (decision D18).

## Description
Bucket A of `.migration/plans/url-analysis-comparison.md` verified that real story bodies contain galleries, YouTube embeds, and a 7–14-image Media Box, all dropped by the current flatten (reduced-fidelity slice, SKODA-801). This ticket picks **1–2 visually rich hero stories** (e.g. the olive-oil lifestyle piece or `how-the-skoda-octavia-reached-365-km-h`, which have multiple in-body galleries + embed + Media Box) and re-imports them with the gallery/embed/Media-Box blocks in place.

This is a **bounded demo deliverable**, not the full-fidelity parser at scale (that remains M2 / SKODA-801 long tail). It exercises the E02 blocks (SKODA-203 gallery+lightbox, SKODA-204 embeds) and E05 media (SKODA-502 downloads / SKODA-505 cart) end-to-end on a real page.

## Requirements / Spec
- Select 1–2 hero stories with in-body galleries + a video embed + a Media Box.
- Extend the story parser/transformer path to preserve (not flatten) those in-body blocks for the selected pages: map galleries → gallery block (+ lightbox), embeds → embed autoblock (`dnt=1`, lazy), Media Box → downloads/media-cart block.
- Media pre-conditioning applies (no >~10 MB masters → content-bus 409).
- Rest of the story corpus is unchanged (stays flattened).

## Acceptance Criteria
- [ ] 1–2 selected stories render in-body galleries with working lightbox, a lazy video embed, and a Media Box with per-item download / add-to-cart.
- [ ] Media assets are pre-conditioned; preview/publish succeeds (no 409).
- [ ] Local preview matches the source article's block sequence for the selected pages.
- [ ] Output passes lint; other story pages unaffected.

## Dependencies
- Upstream: SKODA-203 (gallery+lightbox), SKODA-204 (embeds), SKODA-502 (downloads), SKODA-505 (media cart), SKODA-601/602 (import infra + DA push), SKODA-801 (story flatten path being extended)
- Downstream: demo script (Media-cart loop-closing demo can use these stories' Media Box)

## Risks / Flags
- Gallery lightbox + cart a11y is `[RUNTIME-UNCONFIRMED]`, verify in a browser (shared concern with SKODA-203/807).
- Ties to D2 (media-cart download) + D5 (AEM Assets), the Media Box add-to-cart path shares those dependencies.
