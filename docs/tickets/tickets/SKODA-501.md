# SKODA-501 — Masters-only image ingest for pilot pages (img-out-of-<p>, alt+data-caption)
- **Epic:** E05 — Media Pipeline
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Ingest images for the pilot pages as **masters only** and hand them to the EDS pipeline, dropping the source's ~8-size derivative ladder entirely (EDS regenerates responsive `<picture>`/webp on demand).

## Description
The source CDN serves each logical image as an 8-named-size derivative ladder plus the original, JPEG-only, with no webp/AVIF. Migrating the ladder is wasteful (order-of-magnitude ~200k+ physical files / ~80–110 GB) and redundant — EDS emits webp at needed widths itself, roughly halving footprint and modernizing formats. This ticket ingests one master per logical image for the pilot page set and restructures the markup so EDS optimizes it, while preserving accessibility and caption metadata. Physical-file/footprint figures are order-of-magnitude, not exact.

## Requirements / Spec
- Ingest **one master per logical image** (the original); **discard the 8-size derivative ladder** — do not migrate derivatives.
- Lift each `<img>` out of its surrounding `<p>` so it is a **direct child of a `<div>`** — EDS only wraps direct-`<div>`-child images in `<picture>`. Imported content defaults to `<img>`-inside-`<p>`.
- Preserve `alt` text on every image (source baseline ~96% non-empty); flag empty/missing alts for editorial backfill rather than dropping them.
- Read and carry `data-caption` into a figure caption — **~53% of captions live in `data-caption`**; if the parser ignores it, half the captions are silently lost.
- Rewrite `<img src>` to the DA/Assets reference (or reference-in-place for the demo) per the media-target decision.
- **Pre-condition oversized masters before publish (build-confirmed 2026-09-10; detailed in SKODA-506):** detect inline images over a size threshold (~10 MB) and **strip/replace them with a sized derivative** ahead of the publish call — full-resolution masters of 25–40 MB **409 the content bus** ("error from content-bus"). Keep the metadata block + the `og:image`-driven card intact.
- Content-driven only: no per-page/URL/positional assumptions.

## Acceptance Criteria
- [ ] Pilot-page images ingested as masters only; no derivative-ladder files migrated.
- [ ] Every ingested `<img>` is a direct child of a `<div>` and EDS wraps it in `<picture>` (verified in preview).
- [ ] `alt` preserved on all images; empty/missing alts logged for editorial backfill.
- [ ] Images carrying `data-caption` render the caption; verified against a sample where source had captions.
- [ ] EDS emits webp/responsive widths for ingested masters (verified in preview).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102 (boilerplate scaffold). / Downstream: SKODA-503 (PDF/MP4 handling), SKODA-603 (pilot import + validation).

## Risks / Flags
- Rights/licensing not machine-readable (no embedded EXIF credit strings) — confirm redistribution terms with stakeholders before migrating originals. (`SKODA-MEDIA-DEEP-DIVE.md` §5/§10)
- DAM target (AEM Assets vs direct-DA vs reference-in-place) unresolved; legacy CDN sends no CORS header (blocks cross-origin canvas use) — reference-in-place is demo-only.
- Footprint/derivative-multiplier numbers are **order-of-magnitude** (medium-confidence sample extrapolation).

## Implementation checkpoint (2026-09-25; not accepted)

Shared image normalization is wired into the runnable home, images/videos, press-release,
model, series-hub and story importers. The media builder resumes delivery-only rows
when DAM originals are approved; apply fails on missing pages or unresolved images
and removes the legacy derivative `srcset`. `npm run media:audit` reconciles the
canonical M1 URL list with imported image references, delivery evidence, captions,
alts and DAM-original status. See `tools/importer/media/README.md` for the run order.

The isolated worktree has **zero of the 42 distinct M1 page files**, so the
read-only audit reports 42 missing pages; it does **not** establish live image
coverage. Rights clearance, access and content-ops approval are required before
copying originals or publishing. SKODA-506 must separately gate every SKODA-602
preview/publish. Rendered responsive pictures and source/preview fidelity still
need independent QA before checking off this ticket's acceptance criteria.
