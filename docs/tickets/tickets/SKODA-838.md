# SKODA-838, Origin-drift re-imports (audit F7)

- **Epic:** E08, Editorial at Scale
- **Type:** import (content refresh; no importer code change)
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#300](https://github.com/skoda-storyboard/demo/issues/300)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §6 / §8 F7 (approved 2026-10-05; user asked for it 2026-10-08)
- **Branch:** `skoda-838-origin-drift`
- **Status (2026-10-08):** 🟡 Drift: 3 pages **published** (3/3 live 200; Media Room promo = origin, Enyaq new title, Epiq City SUV sentences removed). 3 chapters wait for DAM ingest of their new PDFs.

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

## Extension (2026-10-08, user): import the latest content we don't have yet
- **How the gap was found:**
  - Origin RSS feeds give real publish dates (`/en/feed/` and `/en/press-releases/feed/`, 4 pages each, last 40 of
    each type). The sitemaps' `lastmod` is unreliable.
  - Press kits come from the `/en/press-kits/` listing; models and series from their sitemaps.
  - Each candidate was checked against the live query index and DA.
- **Missing, all imported:** 10 stories (2 Jun – 8 Oct), 23 press releases (24 Apr – 8 Oct), 1 model (Enyaq Coupé
  iV, `/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv`).
  - Press kits: none missing (the 6 newest are in DA).
  - 9 old series hubs (2019–2025) are not "latest"; left for later.
- **URL lists:** the 34 URLs were added to `urls-story-detail.txt` (+10), `urls-press-release.txt` (+23) and
  `urls-model-page.txt` (+1).
- **Import:** main's story-detail, press-release and model-page bundles, 34/34. `import:validate-blocks`: 0 errors,
  0 held (pending notes only: slider gallery, highlight, model key facts).
- **Media:** delivery-only `media:build` added 217 manifest rows: 187 images done; 23 PDFs + 7 MP4s partial (publish
  pending).
  - 60 existing rows gained page refs, seen URLs and 8 filled empty alts.
  - The known caption `""→null` noise was reverted.
  - No row went from done back to not-done.
- **Pushed + previewed (14 "new" pages, 0 conflicts, 14/14 preview 200):** the 10 stories (each carries `categories`
  meta) and the 4 plant newsletters. They enter the query index on publish.
- **Blocked by the binary gate (20 pages):** 19 releases and the Enyaq Coupé iV link 30 PDFs/MP4s that must be
  ingested to AEM Assets on a developer machine (`tools/importer/media/README.md`, "PDF/MP4 links"). The imported
  content is ready in `.migration/new-content/import/`.

All files below are under `www.skoda-storyboard.com/direct-download/`, except the Enyaq Coupé TD PDF, which is under
`cdn.skoda-storyboard.com/`.

| Page | Files |
|---|---|
| `/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design` | `2026/06/260601_2026-IIHF-Ice-Hockey-World-Championship-Roman-Josi-wins-Most-Valuable-Player-trophy-created-by-Skoda-Design_8927f954.pdf` |
| `/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles` | `2026/07/260714_Skoda-Auto-introduces-Camp-Mode__cac07df5.pdf` |
| `/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification` | `2026/08/260810_Lorena-Wiebes-receives-Skoda-Design-trophy-after-winning-Tour-de-France-Femmes-avec-Zwift-points_f2c4151c.pdf` |
| `/en/press-releases/preparations-begin-for-the-11th-skoda-student-car-celebrating-100-years-of-vocational-education` | `2026/07/260710_Preparations-begin-for-the-11th-Skoda-Student-Car-celebrating-100-years-of-vocational-education_dbd56e80.pdf` |
| `/en/press-releases/skoda-auto-appoints-world-renowned-road-cyclist-chris-froome-as-brand-cycling-ambassador` | `2026/06/260617_Skoda-Auto-appoints-world-renowned-road-cyclist-Chris-Froome-as-Brand-Cycling-Ambassador_fede185e.pdf`<br>`2026/06/Skoda_appoints_world-renowned_cyclist_chris_froome_as_brand_cycling_ambassador-1080p_7f20f61e.mp4` |
| `/en/press-releases/skoda-auto-celebrates-33-years-as-official-main-sponsor-of-the-iihf-ice-hockey-world-championship-and-unveils-the-epiq` | `2026/05/260514_Skoda-Auto-celebrates-33-years-as-Official-Main-Sponsor-of-the-IIHF-_08acf453.pdf`<br>`2026/05/Skoda_auto_celebrates_33_years_as_official_main_sponsor_of_the_iihf_ice_hockey_world_championship_and_unveils_the_epiq-1080p_0e4fe18d.mp4` |
| `/en/press-releases/skoda-auto-celebrates-successful-milan-design-week-with-strong-visitor-interest-and-fuorisalone-award-recognition-as-highest-rated-installation` | `2026/04/260427_Award-Milan-Design-Week_a760a8e2.pdf` |
| `/en/press-releases/skoda-auto-ranks-as-europes-second-best-selling-car-brand-after-a-strong-first-quarter` | `2026/04/2026_1Q_EN_925a6cad.pdf`<br>`2026/04/260430_Skoda-Auto-ranks-as-Europes-second-best-selling-car-brand-after-a-strong-first-quarter_aed82e36.pdf` |
| `/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-as-official-main-partner-for-the-fifth-year` | `2026/07/260730_Skoda-Auto-supports-Tour-de-France-Femmes-avec-Zwift-as-Official-Main-Partner-for-the-fifth-year_6e73e2b3.pdf`<br>`2026/07/TDFFAZ26_2_12956adf.mp4`<br>`2026/07/TDFFAZ26_mobile_e1b62f9c.mp4` |
| `/en/press-releases/skoda-auto-teams-up-with-hasbros-play-doh-brand` | `2026/04/260424_Skoda-zahajuje-spolupraci-se-znackou-PLAY-DOH-spolecnosti-Hasbro_dd3ee56e.pdf` |
| `/en/press-releases/skoda-epiq-sportline-debuts-at-the-paris-motor-show` | `2026/10/261008_Skoda-Epiq-Sportline-debuts-at-the-Paris-Motor-Show_5f1a425f.pdf`<br>`2026/10/Skoda_epiq_sportline_debuts_at_the_paris_motor_show-1440p_499760e7.mp4` |
| `/en/press-releases/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport` | `2026/05/260511_Skoda_Auto_releases_limited_Fabia_Motorsport_edition_c4ee400a.pdf` |
| `/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain` | `2026/06/260608-Infographics_Skoda-Epiq-production_4c1b64d4.pdf`<br>`2026/06/260608-Infographics_Skoda-models-production_a60b9434.pdf`<br>`2026/06/260608_Production_of_the_new_Skoda_Epiq_starts_in_Pamplona_a4b4e151.pdf`<br>`2026/06/production_of_the_all-electric_entry-level_Skoda_epiq_suv_begins_in_pamplona_spain-1080p-1_5dd86313.mp4`<br>`2026/06/production_of_the_all-electric_entry-level_Skoda_epiq_suv_begins_in_pamplona_spain-1080p_a78bbd65.mp4` |
| `/en/press-releases/skoda-octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain` | `2026/10/261005_Skoda-Octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain_cd986916.pdf` |
| `/en/press-releases/skoda-offers-a-first-glimpse-of-the-interior-concept-of-its-electric-seven-seater-peaq` | `2026/06/260618_Skoda-offers-a-first-glimpse-of-the-all-new-interior-concept-of-its-electric-seven-seater-Peaq_394b9e98.pdf` |
| `/en/press-releases/skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-peaq` | `2026/06/260604_Skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-Peaq_06c2a987.pdf` |
| `/en/press-releases/skoda-presents-first-interior-sketches-and-announces-world-premiere-date-of-electric-epiq` | `2026/05/260504_Skoda_Auto_releases_interior_sketches_of_Epiq_SUV_and_announces_premiere_date_5495a4ed.pdf` |
| `/en/press-releases/tadej-pogacar-winner-of-the-113th-tour-de-france-receives-crystal-trophy-created-by-skoda-design` | `2026/07/260727_Tadej-Pogacar-winner-of-the-113th-Tour-de-France-receives-crystal-trophy-created-by-Skoda-Design_f451231b.pdf` |
| `/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-pictures-on-the-skoda-storyboard` | `2026/05/260519_World-premiere-of-the-all-new-Skoda-Epiq-photorelease_00c4f24e.pdf` |
| `/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv` | `2022/03/TD-Enyaq-Coupe-en_new_44e9640d.pdf` |

## Next
1. DAM ingest of the 3 PDFs (developer machine).
2. Then `media:apply`, push + preview of the 3 chapters (content in `.migration/f7/import-pk/`).
3. Publish (separate go-ahead).

## Acceptance Criteria
- [x] The 6 drifted pages re-imported from the current origin; the DA diff shows only origin edits
- [x] 3 pages pushed + previewed (0 conflicts)
- [ ] 3 new PDFs ingested to AEM Assets; the 3 chapters pushed + previewed
- [x] The 3 refreshed pages published (2026-10-08, user go-ahead)
- [ ] The 3 chapters published after ingest (separate go-ahead)
- [x] Latest content imported: 34 pages; 14 pushed + previewed
- [ ] 30 new PDFs/MP4s ingested; the 20 blocked pages pushed + previewed
- [ ] Publish the new pages (separate go-ahead)
