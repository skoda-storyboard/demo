# SKODA-838, Origin-drift re-imports (audit F7)

- **Epic:** E08, Editorial at Scale
- **Type:** import (content refresh; no importer code change)
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#300](https://github.com/skoda-storyboard/demo/issues/300)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §6 / §8 F7 (approved 2026-10-05; user asked for it 2026-10-08)
- **Branch:** `skoda-838-origin-drift`
- **Status (2026-10-08):** 🟡 3 pages pushed + previewed (not published). 3 chapters wait for DAM ingest of their new PDFs.

## Scope
These pages differ from DA because the origin was edited after our import. The other drift findings in the audit
were already refreshed elsewhere:
- the 4 press releases (Karoq, Peaq production, UCI MTB, Red Dot), in SKODA-833;
- the stories, in SKODA-830;
- the mixed-reality duplicate, which is housekeeping (F8).

| Page | Origin change | State |
|---|---|---|
| `/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models` | title → "The new Enyaq RS Race" (heading id changes with it), shortened highlights, CO₂ wording, the "Sustainable biocomposite parts" infographic removed | pushed + previewed |
| `/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car` | sentences removed (e.g. "using 100% recycled PES for the seat textiles") | pushed + previewed |
| `/en/media-room` | promo box rotated: the Octavia full hybrid and Epiq Sportline Paris releases replace the Kvasiny newsletter and Zellmer; the News/Images/Videos rails get their "All" links | pushed + previewed |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain` | new PDF `2026/09/Skoda_130_RS_c70f7919.pdf`; image added | **blocked: DAM ingest** |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsport-success` | new PDF `2026/09/Skoda_Fabia_RS_c8336ee5.pdf` | **blocked: DAM ingest** |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain` | new PDF `2026/09/Skoda_Sport_1d69baf7.pdf` | **blocked: DAM ingest** |

## Method
- **Re-import:** all 6 pages from the live origin with main's importers (press-kit-default with SKODA-837 + #287;
  home-mr), `--force`.
- **Media step + diff:** `media:apply`, then the push's own conditioning (binary rewrite, media gate, `wrapPage`),
  diffed against the current DA source. Every difference is an origin edit.
- **Dry-run:** 3 × update, 0 conflicts, so DA had no hand edits on these pages.

## Media manifest
- **Removed infographic:** `9a41cde2__New_Enyaq_RS_Race_Sustainable_biocomposite_parts_28a6e66c.pdf` no longer
  references the Enyaq RS Race kit, because the origin removed the infographic. The binary gate otherwise reported
  "imported binary link missing". The DAM asset stays.
- **Media Room:** the new promo image (Octavia full hybrid, 3.8 MB) is recorded with a delivery-only `media:build`.
- **125-years chapters:** the 3 new PDFs are recorded as `partial` (`publish: pending`), ready for the
  developer-machine ingest (`tools/importer/media/README.md`, "PDF/MP4 links").
  - The 130 RS added image is recorded too (5 MB, done).
  - The build also resolved 3 existing rows from `partial` to `done`: two Škoda Sport `.JPG` images, and the 130 RS
    1975 image, which now has a safe 2560px rendition.
  - No row went from done back to not-done.

## Next
1. DAM ingest of the 3 PDFs (developer machine).
2. Then `media:apply`, push + preview of the 3 chapters (content in `.migration/f7/import-pk/`).
3. Publish (separate go-ahead).

## Acceptance Criteria
- [x] The 6 drifted pages re-imported from the current origin; the DA diff shows only origin edits
- [x] 3 pages pushed + previewed (0 conflicts)
- [ ] 3 new PDFs ingested to AEM Assets; the 3 chapters pushed + previewed
- [ ] Published (separate go-ahead)
