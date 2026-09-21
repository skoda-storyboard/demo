# Škoda Demo — Rail → Feed-Query Map & Corpus Sizing

*Phase 0 deliverable of the demo migration plan. Every query-index-driven rail/listing on the
demo path, the exact filter it runs, whether it paginates (load-more) or is curated/fixed, and
the **required published item count** to make it look real on 15 Oct.*

**Sizing rule (from the plan):**
- **Paginated (load-more)** rail/listing → **≥ 18 correctly-tagged published items** (initial 6 + two full
  load-more clicks = 3 pages of 6).
- **Rail carousel** (arrows, no load-more; ~4.4 cards visible at 1280) → **≥ 12 items** so the carousel
  scrolls well past the visible set (a carousel with 5 cards reads as "empty" once you arrow through).
- **Curated / fixed** (Series hub, promo-box featured) → **exact source count**, no inflation.

**Live baseline (verified `/en/query-index.json`, 49 story rows):** emobility 14 · skoda-world 14 ·
lifestyle 11 · press-releases 10. Models/Images/Videos content types do **not** exist in the index yet.

---

## 1. Storyboard homepage (`/en/`)

| Rail / section | Block | Filter (query) | Pagination | Required | Have | Shortfall |
|---|---|---|---|---|---|---|
| Featured promo | `stories` variant=promo | offset 0, limit 3 (newest) | curated (3) | 3 | ✓ | 0 |
| Latest Stories | `stories` variant=latest | offset 3, all categories, excl. press-releases | **load-more** | **18** | 39 (49−10 PR) | 0 |
| Social media | `cards-social` (static) | n/a (static strip) | none | n/a | ✓ | 0 |
| Models | `carousel`/`story-rail` | `template=skoda_model` | rail carousel | **12** | 0 | **12** |
| eMobility | `story-rail` | `category=emobility` | rail carousel | **12** | 14 | 0 |
| Lifestyle | `story-rail` | `category=lifestyle` | rail carousel | **12** | 11 | **1** |
| Škoda World | `story-rail` | `category=skoda-world` | rail carousel | **12** | 14 | 0 |
| Series | `carousel` | `template=skoda_series` | rail carousel | **12** | 0 | **12** |
| Latest News | `story-rail` | `category=press-releases` | rail carousel | **12** | 10 | **2** |

## 2. Storyboard model page (`/en/skoda-model/peaq/`) — 5 tag-filtered rails

Retrieval rule: items tagged with the model (`peaq`). All 5 are rail carousels.

| Rail | Filter | Required | Have | Shortfall |
|---|---|---|---|---|
| News (Based on tags: peaq) | `tags~peaq` AND `category=press-releases` | 12 | 0 | **12** |
| Press Kits (Based on tags: peaq) | `tags~peaq` AND `template=press_kit` | 12 | 0 | **12** |
| Stories (Based on tags: peaq) | `tags~peaq` AND `template=story` | 12 | few* | **~12** |
| Images (Based on tags: peaq) | `tags~peaq` AND `template=image` | 12 | 0 | **12** |
| Videos (Based on tags: peaq) | `tags~peaq` AND `template=video` | 12 | 0 | **12** |

*Some existing Peaq stories exist in the corpus but are not yet `tags`-annotated with `peaq`.

## 3. Category & tag listings (paginated, load-more)

| Page | Filter | Required | Have | Shortfall |
|---|---|---|---|---|
| `/en/category/emobility/` | `category=emobility` | 18 | 14 | **4** |
| `/en/category/podcast-en/` | `category=podcast` | 18 | 0 | **18** (or accept short — podcast is a thin demo aside) |
| `/en/tag/model/elroq/` | `tags~elroq` | 18 | 0 | **18** |

## 4. Series (curated / fixed — no inflation)

| Page | Content | Pagination | Required |
|---|---|---|---|
| `/en/series-2/` (directory) | grid of series cards | fixed grid | ~8–12 series entries (curated) |
| `/en/series/125-years-of-motorsport/` (hub) | curated 8-card story grid | **fixed, no load-more** | exactly the curated set |

## 5. Media Room homepage (`/en/media-room/`)

| Rail / section | Filter | Pagination | Required | Shortfall |
|---|---|---|---|---|
| Featured promo (press kit / news) | curated | curated | ~3 | build set |
| News (main feed) | `category=press-releases` | **load-more** | 18 | ~8 |
| Models (dark) | `template=skoda_model` | rail | 12 | 12 |
| Latest Stories | `template=story` | rail | 12 | 0 |
| Images | `template=image` | rail | 12 | 12 |
| Videos | `template=video` | rail | 12 | 12 |
| Press Kits | `template=press_kit` | rail | 12 | 12 |

## 6. Faceted listings (paginated, load-more; ≥18 floor so a facet narrowing still loads)

| Page | Content type | Required | Have | Shortfall |
|---|---|---|---|---|
| `/en/news/` | press-releases + news | 18 | 10 | **8** |
| `/en/images/` | images | 18 | 0 | **18** |
| `/en/videos/` | videos | 18 | 0 | **18** |

---

## Corpus shortfall summary (what to scrape beyond the 22 coverage URLs)

Deduplicating overlaps (one item feeds several rails — a Peaq story tagged `peaq`+`emobility` counts for
the model Stories rail, the eMobility rail, and Latest Stories), the **net new content to import**:

| Content type | New items to import | Feeds |
|---|---|---|
| **Stories** (tagged w/ model + category) | ~12 (esp. Peaq/Elroq-tagged) | model Stories rail, tag/elroq listing, thin categories |
| **Models** (`skoda_model` pages) | ~12 | Models rails (STO home + MR home) |
| **Series** (`skoda_series` hubs + directory) | ~10 | Series rail + directory |
| **Press releases / News** | ~10 | Latest News, MR News feed, `/en/news/`, model News rail |
| **Press kits** (`press_kit`) | ~12 | MR Press Kits rail, model Press Kits rail |
| **Images** (`image` items) | ~18 | Images listing, Images rails |
| **Videos** (`video` items) | ~18 | Videos listing, Videos rails |

**Total net-new corpus ≈ 90–100 tagged items** on top of the 22 template-coverage URLs. Concrete source
URLs are enumerated in `skoda-rail-feed-corpus.txt` (Phase 0 task #6).

**Note on caps:** the podcast category (`/en/category/podcast-en/`) is a thin demo aside — if 18 podcast
episodes are not readily available, it is acceptable to demo it short (documented here, not silently
truncated). Every other demo-path rail/listing must hit its floor.
