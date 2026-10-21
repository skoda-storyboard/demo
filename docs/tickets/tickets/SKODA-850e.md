# SKODA-850e, New press kits and locale-aware DA templates after go-live

- **Epic:** E08, Editorial at Scale
- **Type:** template and check changes (amends SKODA-805, 842, 520)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker; without it every new kit needs a
  developer and every new CS or SK page starts with EN values.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*. From the review: G-T1-07
  2–3 SP (its kit-ZIP part is in 850b), G-T1-08 1 SP, G-KT-09 0.5 SP, G-T2-03 0.5 SP.
- **GitHub issue:** to create
- **Parent:** SKODA-850
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T1-07, G-T1-08, G-KT-09, G-T2-03
  (Medium/Low, not re-verified).

## Why
- **New press kits by hand (G-T1-07, G-KT-09).** The chapter bar is authored in every chapter (22 links × 14 Epiq
  docs). A chapter over 200 images returns 409 at preview (Peaq 2 Images: 247); only the SKODA-806 importer splits
  it, and 806a is migration-only.
- **Templates are EN-only (G-T1-08, G-T2-03).** `templates-spec.mjs` has 9 literal `/en…` values, 6 source-CDN images
  and 5 `www` links, which every page created from them copies; SKODA-520's census leaves `/library/**` out.

## Scope
- **Chapter bar (amends 805):** generated from one per-kit source, so a chapter rename edits one document.
- **Image groups (amends 842):** a "press-kit image group as fragment" library entry, and an image count in the
  pre-publish check (AR-17) that flags a document over 200 images.
- **Locale templates (amends 842):** per-locale templates, or a `[locale]` prompt that the check rejects if left in.
- **Template values:** DAM / Media Bus URLs and site-relative links in `templates-spec.mjs`, no source-CDN images.
- **Census (amends 520):** add `/library/**` to the census and the zero-reference gate.

## Not in scope
- New kit ZIPs: SKODA-850b. Migrated press kits and the importer split: SKODA-805, 806, 806a.

## Acceptance criteria
- [ ] Renaming a kit chapter edits one document.
- [ ] A 201-image chapter is flagged before preview.
- [ ] A CS page from each template has 0 `/en` values and 0 source-CDN references.
- [ ] SKODA-520's census covers `/library/**`.

## Dependencies
SKODA-850 (parent), 805, 806, 806a, 842 (library), 520, 712 (guide).
