# Škoda Storyboard — Media Deep-Dive (Empirical Measurement)

**Companion to:** `SKODA-MEDIA-INTEGRATION-REVIEW.md` (this dive supersedes its scale/footprint figures).
**Date:** 2026-09-04
**Purpose:** Replace estimates with measured numbers — real asset counts, real byte weights, real metadata coverage, and the concrete migration footprint.
**Method:** Read-only. Enumerated all 55 attachment sitemaps; HEAD/range-probed ~280 real CDN files for `Content-Length` (measurement only — no assets retained); parsed markup from 6 representative pages. No import, no bulk download, no Git.

---

## 1. Headline Metrics (measured)

| Metric | Prior (estimate) | **Measured** | Method |
|---|---|---|---|
| Attachment (media) URLs in sitemaps | ~52,000 | **42,275** (42,275 raw / 42,259 unique) | Summed all 55 attachment sitemaps |
| …these are attachment **pages**, per-locale | — | across **5 locales** (cs/en/de/sk/sr) | URL prefix analysis |
| **Distinct logical media items** | — | **~28,300** (distinct attachment slugs) | Dedup across locales |
| EN media items | — | **~11,260** | `/en/` attachment pages |
| **Physical files on S3/CDN** (with derivative ladder) | — | **~200,000–250,000** (≈28.3k × ~7–9 sizes) | Measured ~7 derivatives/image in page subset; ladder is 8 named sizes + original |
| Avg image derivative weight | unknown | **~346 KB** (range 8 KB–1.2 MB) | 220-file sample |
| Avg original ("master") weight | unknown | **~1.2 MB** (range 0.7–2.8 MB) | 20-original sample |
| Largest PDF | 28 MB | **~26 MB** (Annual Report) confirmed | HEAD |
| Press-kit corpus | — | **~2,927** press-kit sitemap URLs | 3 press_kit sitemaps |

> **Correction to prior reports: the media library is ~42.3k attachment pages / ~28.3k distinct logical items — NOT ~52,000.** The 52k figure was `55 sitemaps × ~950`; the true average is ~770/sitemap. **However**, the *physical file* count (what a migration actually copies) is far higher — **~200k–250k files** once the 8-size derivative ladder is counted. Both numbers matter for different reasons (see §6, §8).

**Estimated total footprint:** distinct originals (~28.3k × ~1.2 MB ≈ **34 GB** of masters) + derivative ladder (~28.3k × 8 × ~250 KB avg ≈ **57 GB**) → **order of ~80–110 GB total** on the CDN. *Confidence: medium — extrapolated from a ~280-file sample; stated as a range.*

---

## 2. Volume & Footprint

### Sitemap composition (from `/sitemap_index.xml` — note: `/sitemap.xml` 301-redirects here)
- **55** attachment sitemaps → 42,275 media URLs
- 6 press_release + 4 post + **3 press_kit** (~2,927) + 1 page + ~20 taxonomy sitemaps

### Per-locale distribution of attachment pages
| Locale | Attachment pages |
|---|---|
| cs | 13,215 |
| en | 11,261 |
| de | 5,708 |
| sk | 3,881 |
| sr | 2,104 |
| **sl** | **0 (absent from attachment sitemaps)** |

**Finding:** media attachment *posts* are **authored per-locale** (each localized press item re-registers its attachments), which is why the page count (42k) far exceeds distinct logical items (~28k). Slovenian has **no** attachment sitemap entries — SL is a thin/partial locale for media. This directly informs the "per-locale vs shared" question: **logical files are largely shared on the CDN, but attachment *records* are duplicated per language.**

### Derivative ladder (physical files)
Each uploaded image generates **8 named sizes** (`272x182, 384x256, 768x512, 1440x960, 1536x1024, 1920x1280, 2048x1365, 2560x1707`) + aspect-specific crops + the original. Measured **~7 derivatives per logical image** in the page-referenced subset (some sizes not always referenced). **Migration copies files, not logical assets** — so the ~200k–250k physical-file figure is the one that drives transfer time.

### Year distribution (of page-referenced files)
Heavily **2026-weighted** (652 of ~800 sampled) — consistent with an actively-publishing newsroom; older masters (2017–2019) are large, un-hashed hero images.

---

## 3. File-Weight Analysis

Measured size by dimension tier (220-file sample):

| Tier | Avg weight |
|---|---|
| Thumbnails (150–384 px) | 10–40 KB |
| Medium (768 px) | 60–140 KB |
| Large (1440–1536 px) | 175–200 KB |
| XL (1920–2048 px) | 150–460 KB |
| XXL (2560 px) | 210–920 KB |
| **Originals (masters)** | **0.7–2.8 MB (avg ~1.2 MB)** |

**Optimization verdict:** source JPGs are **moderately optimized but not aggressively** — a 2560px hero at 600–900 KB is heavy by modern standards, and there is **no webp/AVIF** (confirmed prior). **EDS's pipeline is a clear win:** handing EDS a single master and letting it emit webp at needed widths would cut delivered image weight substantially (often 30–50% via webp alone) and eliminate the need to migrate the 8-size ladder at all. **Migration implication: migrate the originals only; discard the derivative ladder** — EDS regenerates it. This roughly *halves* the transfer footprint (masters ≈ 34 GB vs full ≈ 80–110 GB).

---

## 4. Video / Audio / PDF Dossiers

### Self-hosted video (MP4)
- Served via a **tracked `/direct-download/…-1080p.mp4` route** that redirects **through the site to a signed S3 URL** (`skoda-storyboard.s3.eu-central-1.amazonaws.com`, `X-Amz-Signature`, 24 h expiry, `Content-Disposition: attachment`).
- **Implication:** this is a **gated/authenticated download flow with signed URLs**, not a plain CDN file. Reproducing it in EDS means either (a) re-hosting MP4s as plain assets, or (b) rebuilding a signed-download service. Resolution suffix (`-1080p`) suggests multiple renditions may exist per video.
- Volume: MP4s appear on press releases; not quantified at scale (no dedicated video sitemap) — **[PARTIAL]**.

### Embedded video/audio (not self-hosted)
- **Vimeo** (`dnt=1`), **YouTube** — the primary video delivery (embedded, lazy `data-src`).
- **Buzzsprout** (podcast), **Spotify** — audio.
- These carry **zero migration footprint** (external embeds) — EDS autoblocks by URL.

### PDF corpus
- **~2,927 press-kit sitemap URLs**; press releases also attach PDFs. Sizes range from ~350 KB (a single release PDF) to **~26 MB** (Annual Report).
- **Migration path:** link / DAM — never through the image pipeline. Large PDFs (10–28 MB) argue for **reference-in-place or a dedicated document DAM**, not ingestion into the content bus.

---

## 5. Metadata, Accessibility & Rights

Across a 193-image, multi-template sample:
- **Alt text: 96% non-empty** (186/193), 6 empty, 1 missing → **strong a11y baseline** (better than the earlier one-page ~91% reading). The handful of empties should be flagged for editorial backfill.
- **Captions (`data-caption`): 53%** non-empty → about half of images carry a caption; **the import parser MUST read `data-caption`** or half the captions are silently dropped.
- **Embedded rights metadata:** a 64 KB header probe of an original master found **no obvious EXIF/IPTC copyright/credit strings** — credits appear to live in page text, not embedded metadata. **Rights/licensing is therefore not machine-readable from the files** → licensing must be confirmed with stakeholders (legal risk remains open).

---

## 6. Duplication / Orphans / Per-Locale Sharing

- **Per-locale duplication of records:** 42.3k attachment pages collapse to ~28.3k distinct logical items — i.e. **~33% of attachment records are cross-locale duplicates** of the same underlying file.
- **Derivative multiplication:** ~7–9 physical files per logical image.
- **Orphans/archival:** older masters (2017–2019) still served; the sitemap includes attachments not necessarily referenced by any live page → an unknown share is archival. Not fully quantified anonymously — **[PARTIAL]**.
- **"Migrate-all vs in-use-only" revisited with numbers:** migrating *all* = ~28.3k logical (or ~200k+ physical) files ≈ 80–110 GB. Migrating **EN in-use only** = a fraction of ~11.3k logical items, masters-only ≈ **single-digit GB**. The gap is large enough that **in-use-only, masters-only, EN-first is strongly indicated** for anything short of a full multilingual cutover.

---

## 7. CDN & Reference-in-Place Assessment

Header matrix on `cdn.skoda-storyboard.com`:
| Header | Value | Meaning for reuse |
|---|---|---|
| `server` / origin | AmazonS3 + CloudFront | Standard, stable |
| `cache-control` | `max-age=31536000` (1 yr, immutable) | Safe to hotlink/cache |
| `etag` / `last-modified` | present | Good for sync/dedup |
| **`access-control-allow-origin`** | **ABSENT** (even with `Origin:` header) | **CORS not enabled** — cross-origin fetch/canvas use blocked |
| Transforms | none (pass-through) | EDS must do its own optimization |

**Reference-in-place verdict:** technically possible for a demo (assets are public, immutable, cacheable) — but **no CORS** means anything needing cross-origin pixel access won't work, and it leaves a **permanent dependency on the legacy CDN** (governance/lifespan risk). **Recommendation:** reference-in-place is fine for a *demo*; production should ingest **masters** into the EDS pipeline (which also gains webp/responsive) and DAM-link the large binaries.

---

## 8. EDS Import Implications

- **Images → author pipeline, masters only.** Ingest ~1 master/logical image; **drop the 8-size ladder** (EDS regenerates). This cuts the footprint roughly in half and modernizes formats.
- **Transfer-time estimate (rough):** masters-only EN in-use (single-digit GB) is trivial (minutes–hours). Full multilingual masters (~34 GB) is a batch job of hours; full library incl. derivatives (~80–110 GB, ~200k+ files) is a **multi-day** transfer dominated by per-file request overhead, not bandwidth — another reason to migrate masters only.
- **`data-caption` must be parsed** (53% of images) or captions are lost.
- **img-out-of-`<p>`:** confirmed prior — importer must lift `<img>` to a direct `<div>` child for EDS `<picture>` wrapping.
- **MP4 signed-download route** needs a hosting decision (re-host plain vs rebuild signed service).
- **PDFs** link/DAM, never optimize.
- **Per-locale attachment records** mean the importer should key on the **logical file** (dedup by base filename/hash) to avoid importing the same image 5×.

---

## 9. Corrections to Prior Media Review

| Prior statement | Measured reality |
|---|---|
| "~52,000 media assets" (High confidence) | **42,275 attachment URLs / ~28,300 distinct logical items** across 5 locales; **~200k–250k physical files** with the derivative ladder |
| Footprint unquantified | **~80–110 GB total; ~34 GB masters-only** (medium-confidence extrapolation) |
| Sitemap at `/sitemap.xml` | Actually **`/sitemap_index.xml`** (301 redirect) |
| Alt coverage ~91% (one page) | **96%** across a broader multi-template sample |
| MP4 = "tracked `/direct-download/` route" | Confirmed + it redirects to a **signed, expiring S3 URL** (auth/gated flow) |
| CDN behavior (no transforms) | Confirmed, **plus: no CORS header** — a reuse constraint |

**Propagation:** the ~52k figure appears (already caveated as "unverified estimate") in OVERVIEW, MEDIA-INTEGRATION-REVIEW, DISCOVERY, IMPLEMENTATION-REVIEW, SITE-FACTS.html. Recommend updating those to the measured **~42k pages / ~28k logical / ~200k+ physical** framing. *(Not auto-applied — flag for a propagation pass.)*

---

## 10. Open Questions & Residual Unknowns

1. **DAM ownership & target** — where do masters + large PDFs/MP4s live post-migration? (unchanged, now sized)
2. **Rights/licensing** — no embedded EXIF rights found; must confirm redistribution terms with stakeholders before migrating originals.
3. **Archival share** — how many of the ~28k logical items are unreferenced/dead? Needs a full crawl-vs-sitemap diff (not done anonymously).
4. **MP4 renditions** — how many videos, how many resolutions each, total video footprint? No video sitemap; needs enumeration.
5. **Signed-download service** — reproduce, or serve MP4s as plain assets?
6. **`[RUNTIME-UNCONFIRMED]`** — whether the gallery lightbox fetches still-larger originals on click (adds delivered weight); real LCP timing. Needs a browser.

---

## Appendix — Evidence & Method

- **Volume:** all 55 attachment sitemaps fetched (parallel, Googlebot UA); 42,275 `<loc>` counted; per-locale split via URL prefix; ~28.3k distinct attachment slugs.
- **Weights:** ~280 real CDN files HEAD/range-probed for `Content-Length` (no bodies retained); 220-file dimension-tier sample + 20 originals.
- **Video/PDF:** `/direct-download/` MP4 traced to signed S3 URL; PDFs HEAD-probed (350 KB–26 MB); 3 press_kit sitemaps counted (~2,927).
- **Metadata:** 193 `<img>` across 6 pages → 96% alt, 53% caption; 64 KB EXIF header probe (no rights strings).
- **CDN:** header matrix incl. explicit `Origin:` CORS test (no ACAO header).
- **Caps honoured:** no full-asset downloads beyond a single 64 KB EXIF probe + 1-byte range checks; all temp files removed after.
- **Confidence:** counts = **high** (full enumeration); footprint/derivative-multiplier = **medium** (sample extrapolation, stated as ranges); archival share & video totals = **low/partial** (flagged).
