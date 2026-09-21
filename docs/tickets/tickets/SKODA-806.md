# SKODA-806, Press Kit grouped media/download areas + whole-kit ZIP
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/press-kit-media.md`](../../ui-specs/press-kit-media.md)** (captured via Chrome DevTools on the live Peaq kit). Read it before implementing.

Key facts from capture (resolves §11.11-12):
- **Decision resolved → STACKED separate sections/pages** (no tabs, no accordion chrome in source). The presentation variant defaults to stacked.
- Five ordered groups: Texts, Infographics, Technical data, Images, Videos. Images reuse `downloads.md` (round `50px` download button, Original/1920px).
- Whole-kit ZIP is **not in the static DOM** (dynamic/scripted) → wire to the media-cart "Download package" **server-side reduction** path (D2), not a second bespoke zip.

## Summary
Deliver the five grouped supporting-content areas on a Press Kit detail page, Texts, Infographics, Technical data, Images, Videos, with per-item downloads, plus the whole-kit ZIP download. Reuses the Downloads block (SKODA-502) and the media-cart download path (SKODA-505/902); the ZIP reduction/packaging is the non-EDS-native piece.

## Description
Confirmed on the live Peaq kit (requirements §11.11) as **five sequential named areas** in order:
1. **Texts**, downloadable text content (article text, backgrounders).
2. **Infographics**, the preview-image → PDF pattern (same as §11.4 / MR-PR05).
3. **Technical data**, structured specification data for the model/variant.
4. **Images**, downloadable image set (Original / 1920px dual-rendition pattern used site-wide).
5. **Videos**, downloadable/embeddable video set.

Whether these render as **tabs, accordion, or stacked sections** is a visual/interaction detail to confirm during design (§11.11), the content model (five grouped, ordered areas of download items) is the ticket; presentation is a variant.

**Whole-kit ZIP (MR-PK07, §11.12):** in addition to per-item downloads, the kit downloads as a single ZIP. This was not observable in the static snapshot (dynamic/scripted control), mechanism to confirm with the technical team. It is the **same non-EDS-native download-packaging problem as the media cart**, so it rides on the D2 reframe: **server-side reduction/packaging** (App Builder / AEM Assets renditions), client-side zip demoted.

## Requirements / Spec
- Grouped-download block: N ordered named groups, each a list of download items (title + size label + rendition link), populated at import from `mediakit/v1/mediabox` data (per SKODA-502).
- Infographics group uses the preview-image→PDF pattern (shared with MR-PR05).
- Images group exposes the Original / 1920px dual rendition (ties to rendition strategy, D2/§6.9).
- Presentation variant (tabs / accordion / stacked) selectable via block config/section metadata, default stacked, confirm in design.
- Whole-kit ZIP action wired to the media-cart download-reduction service (SKODA-505 demo / SKODA-902 prod); do **not** build a second bespoke zip path.
- Individual asset download (MR-PK06) = the existing per-item Downloads behaviour.

## Acceptance Criteria
- [ ] All five groups render in the confirmed order with per-item downloads.
- [ ] Infographic items show a preview image linking to a downloadable PDF.
- [ ] Image items expose the Original + 1920px renditions.
- [ ] "Download complete press kit" produces a single package via the shared reduction/packaging service (no separate bespoke zip implementation).
- [ ] Presentation is **stacked** (source-confirmed; no tabs/accordion). Any optional tab/accordion variant stays accessible (keyboard + ARIA) if used.
- [ ] Output passes lint and matches source grouping in local preview.
- [ ] Visual diff vs source at 1280/768 ≤ 2% per-pixel (per [`press-kit-media.md` §9](../../ui-specs/press-kit-media.md)).

## Dependencies
- Upstream: SKODA-805 (press-kit template hosts these areas), SKODA-502 (Downloads block + mediabox), SKODA-505 (media-cart download reduction, demo), SKODA-501 (masters-only ingest)
- Downstream: SKODA-902 (production download-reduction hardening, the ZIP at scale)

## Risks / Flags
- **ZIP mechanism (🟠, §11.12):** dynamic/scripted control not seen in snapshot, confirm implementation with the technical team; depends on the D2 media-cart reduction approach.
- **Presentation TBD (🟡, §11.11):** tabs vs accordion vs stacked, design decision; if tabs/accordion, adds a11y focus/ARIA scope.
- Rendition strategy (Original/1920px) ties to Dynamic Media confirmation (D5/§6.9).
