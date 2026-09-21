# SKODA-506 — Media pre-conditioning: strip/replace oversized masters before publish
- **Epic:** E05 — Media Pipeline
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

> **Origin: build-confirmed (2026-09-10).** A shipped EN story page (`a-drivers-paradise-just-outside-valencia-and-those-views`) embedded 4 full-resolution masters at **25–40 MB each** and **409'd the content bus on publish** ("error from content-bus"). Fix that shipped: strip the oversized inline `<picture>` masters and keep the sized derivatives (662 KB / 395 KB) + the metadata block. This ticket generalizes that fix into a pipeline step so bulk publish does not fail at scale. It is the concrete form of the abstract "~200k files / heavy masters" risk (arch doc §7 / R-A6; delivery plan R-A′).

## Summary
Add an import-pipeline step that **detects images over a size threshold (~10 MB) and strips or replaces them with a sized derivative before the publish call**, so pages reach the content bus at a weight it accepts.

## Description
The EDS content bus rejects documents that reference oversized inline image masters (observed at 25–40 MB), returning a 409 on the `preview`/`live` publish request. The source CDN exposes both full-resolution masters (no `-WxH` suffix) and sized derivatives (e.g. `-1440x960`, `-1920x1280`). This step runs after image ingest (SKODA-501) and **before** publish: it inspects each referenced image, and for any over the threshold it swaps the inline `<picture>`/`<img>` to a sized derivative (or drops the inline master while preserving the `og:image`-driven card + the trailing Metadata block). The result publishes cleanly and EDS still regenerates responsive `<picture>`/webp from the (now reasonably-sized) source.

## Requirements / Spec
- Detect inline images whose byte weight exceeds a configurable threshold (default ~10 MB), by HEAD/content-length probe or known-derivative substitution.
- Prefer **substitution** with an existing sized derivative (`-WxH` variant) over outright removal; fall back to stripping the inline master when no derivative exists, keeping the metadata/`og:image` reference intact.
- Preserve the surrounding content: card image, `alt`, `data-caption`, and the canonical Metadata block must survive.
- Runs as a gate **before** the DA publish call for every page/increment — no page reaches the content bus un-conditioned.
- Content-driven only; log every substitution/strip for review.

## Acceptance Criteria
- [ ] A page that previously 409'd on publish (the `a-drivers-paradise…` case) publishes cleanly after pre-conditioning.
- [ ] Images over the threshold are replaced with a sized derivative where one exists; otherwise the inline master is stripped and logged.
- [ ] Card image, `alt`, `data-caption`, and the Metadata block are unchanged by the step.
- [ ] EDS still emits responsive `<picture>`/webp for the conditioned images (verified in preview).
- [ ] The step runs ahead of publish in the bulk pipeline; every substitution/strip is logged.
- [ ] `npm run lint` clean (for any code added to the importer).

## Dependencies
- Upstream: SKODA-501 (masters-only ingest). / Downstream: SKODA-503 (PDF/MP4), SKODA-603 (pilot import + validation); **gates the publish step for all E05/E06 content**.

## Risks / Flags
- 🟠 R-A6 / R-A′: without this step, bulk publish 409s at scale — this is a **publish-blocking** condition, not cosmetic.
- Threshold is heuristic; tune against the corpus (the content-bus limit is not documented — the ~10 MB threshold is conservative from the observed 25–40 MB failures).
- Interacts with the DAM decision (D5): if approved assets come from AEM Assets (CORS-enabled, already-derivatived), the threshold rarely trips; reference-in-place from the legacy CDN is where oversized masters appear.
- Cross-ref: memory `skoda-masters-only-vs-reference-in-place`; `SKODA-MEDIA-DEEP-DIVE.md` §3/§8.
