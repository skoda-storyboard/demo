# Škoda Demo — Official Migration URL Set

*The client-supplied official demo content list, deduplicated and mapped to the `tools/importer/` template that imports each page. This is the concrete run-list for the bulk import (SKODA-602/603) — companion to [`SKODA-POC-URL-SET.md`](SKODA-POC-URL-SET.md) (the minimal coverage set) and the pipeline in [`../architecture/IMPORT-PIPELINE.md`](../architecture/IMPORT-PIPELINE.md).*

**Received:** 2026-09-24 (official list). **Raw entries:** 47 → **43 unique** (4 duplicate press-release URLs removed). Machine-readable companion: `skoda-demo-migration-urls.txt`.

## 1. Summary — coverage by importer template

| Template | URLs | Importer | Status |
|---|--:|---|---|
| `story-detail` | 21 | `import-story-detail.js` | ✅ built — flatten-to-default (in-body galleries/embeds/Media Box deferred → SKODA-801/604) |
| `press-release` | 5 | `import-press-release.js` | ✅ built (pilot proven) |
| `model-page` | 5 | `import-model-page.js` | ✅ built |
| `series-hub` | 5 | `import-series-hub.js` | ✅ built |
| `press-kit` | 4 | — | ⛔ **DEFERRED** → SKODA-805–808 (hub + chapters + shared sub-nav; not built) |
| `images-listing` | 1 | `import-images-listing.js` | ✅ built |
| `videos-listing` | 1 | `import-videos-listing.js` | ✅ built |
| `home-sto` | 1 | `import-home-sto.js` | ✅ built — **already published** to `main--demo--skoda-storyboard.aem.live/en` |
| **Total** | **43** | | **39 importable now · 4 deferred (press-kit)** |

**Bottom line:** 39 of 43 pages (91%) import with the templates built in SKODA-601; the 4 press-kit URLs are the one deferred type (N+1-document structure, SKODA-805–808). Story-detail pages import as clean linear content — their in-body galleries/embeds/Media Box are intentionally left for the Phase-B full-fidelity restore.

## 2. The set (deduplicated) — path → template

### Home (1)
| # | Path | Template |
|--:|---|---|
| 1 | `/en/` | `home-sto` ✅ published |

### Press releases (5) — `press-release`
| # | Path |
|--:|---|
| 2 | `/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/` |
| 3 | `/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029/` |
| 4 | `/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/` |
| 5 | `/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management/` |
| 6 | `/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs/` |

### Model pages (5) — `model-page`
| # | Path |
|--:|---|
| 7 | `/en/skoda-model/new-superb/` |
| 8 | `/en/skoda-model/octavia/` |
| 9 | `/en/skoda-model/epiq/` |
| 10 | `/en/skoda-model/peaq/` |
| 11 | `/en/skoda-model/new-fabia/` |

### Series hubs (5) — `series-hub`
| # | Path |
|--:|---|
| 12 | `/en/series/125-years-of-motorsport/` |
| 13 | `/en/series/130-years/` |
| 14 | `/en/series/roads-places/` |
| 15 | `/en/series/unexpected-jobs/` |
| 16 | `/en/series/minutes-from-car-production/` |

### Listings (2) — `images-listing` / `videos-listing`
| # | Path | Template |
|--:|---|---|
| 17 | `/en/images/` | `images-listing` |
| 18 | `/en/videos/` | `videos-listing` |

### Story detail (21) — `story-detail` (flatten-to-default)
| # | Path |
|--:|---|
| 19 | `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/` |
| 20 | `/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour/` |
| 21 | `/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too/` |
| 22 | `/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries/` |
| 23 | `/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging/` |
| 24 | `/en/lifestyle/ouninpohja-finlands-roller-coaster-stage/` |
| 25 | `/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq/` |
| 26 | `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/` |
| 27 | `/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq/` |
| 28 | `/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia/` |
| 29 | `/en/emobility/meet-the-peaq-comfort-just-like-at-home/` |
| 30 | `/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france/` |
| 31 | `/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling/` |
| 32 | `/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como/` |
| 33 | `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague/` |
| 34 | `/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans/` |
| 35 | `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/` |
| 36 | `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality/` |
| 37 | `/en/skoda-world/how-the-skoda-octavia-reached-365-km-h/` |
| 38 | `/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it/` |
| 39 | `/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france/` |

### Press kits (4) — ⛔ DEFERRED (SKODA-805–808)
| # | Path |
|--:|---|
| 40 | `/en/press-kits/skoda-peaq-press-kit-2/` |
| 41 | `/en/press-kits/skoda-epiq-press-kit-2/` |
| 42 | `/en/press-kits/125-years-of-skoda-motorsport-press-kit/` |
| 43 | `/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/` |

## 3. Notes & flags

- **Duplicates removed (4):** the Zellmer, National-Theatre, Superb-25-years, and Board-of-Management press releases each appeared twice in the raw list.
- **Near-duplicate to confirm (#26 vs #36):** `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/` and `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality/` are distinct URLs (different path depth) but likely the **same story** at two routes. Kept both; verify against live before publish (one may 301 / be canonical of the other — the "Peaq trap" scraper-drift guard applies).
- **Story-detail scope:** these import as linear default content (hero + rich text). In-body galleries, video embeds, and Media Boxes are **dropped-and-logged** for the Phase-B full-fidelity restore (SKODA-801 / SKODA-814 / SKODA-604), per the SKODA-601 flatten-to-default decision.
- **Press kits (4) are the only gap** in this set — the hub + chapter + resource N+1-document type is not built (SKODA-805–808). They must be excluded from the SKODA-602 bulk run until that ticket lands.
- **Category resolution:** `/en/emobility/…`, `/en/lifestyle/…`, `/en/skoda-world/…` are editorial **story** URLs (deeper than the `/en/category/<x>/` archive), correctly routed to `story-detail`, not `category-archive`.

## 4. Run order (SKODA-602/603)

1. **Model pages + series hubs + press releases + listings** (index-feeders + high-fidelity) → import, push to DA, preview, publish first so the query-index populates.
2. **Story details** (21) → import (flatten), push, publish; they feed the category/model rails.
3. **Home** — already published; re-publish after the feeders so its rails fill.
4. **Press kits** — hold for SKODA-805–808.

Per-template run: `run-bulk-import.js --import-script tools/importer/import-<template>.bundle.js --urls <this set, filtered to that template>`; then the media toolkit + `validate-metadata.mjs` gate; then DA push → preview → publish.

## 5. Cross-references
- `skoda-demo-migration-urls.txt` — machine-readable (one URL per line, deduped).
- [`../architecture/IMPORT-PIPELINE.md`](../architecture/IMPORT-PIPELINE.md) — the 16 templates + import/push/publish flow.
- [`SKODA-POC-URL-SET.md`](SKODA-POC-URL-SET.md) — the minimal template-coverage set (different purpose: proves coverage, not the demo content list).
- Tickets: SKODA-602 (DA push + bulk publish), SKODA-603 (import + validate), SKODA-805–808 (press-kit), SKODA-801/814/604 (story full-fidelity).
