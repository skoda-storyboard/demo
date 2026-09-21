# Škoda Storyboard — Media Integration Review

**Companion to:** `SKODA-STORYBOARD-DISCOVERY.md`, `SKODA-STORYBOARD-DRILLDOWN.md`, `SKODA-EN-BLOCK-INVENTORY.md`, `SKODA-BLOCK-IMPLEMENTATION-REVIEW.md`, `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md`
**Date:** 2026-09-04
**Purpose:** How every media type on the source site would be integrated into AEM Edge Delivery Services (EDS), with an import strategy for the migration.
**Method:** Live inspection of `<img>`/`srcset` markup, CDN response-header probes (webp/resize/caching behavior), download-link and media-cart contracts, and scale figures from sitemaps/REST. Analysis only — sample fetches, no bulk download, no writes, no Git operations.

> **Note (2026-09-04):** The media library has now been measured (see `SKODA-MEDIA-DEEP-DIVE.md`): **42,275 attachment pages / ~28,300 distinct logical items** across 5 locales (cs/en/de/sk/sr; Slovenian absent), and **~200k–250k physical files** with the derivative ladder — NOT ~52k. Footprint **≈80–110 GB (≈34 GB masters-only)**. Adversarial review (`SKODA-ADVERSARIAL-REVIEW.md`) also identified a gallery lightbox that may serve larger originals on interaction.

---

## 1. Executive Summary

Media is the **single heaviest workstream** in this migration: **~42,275 attachment pages / ~28,300 distinct logical items (measured); ~200k–250k physical files with the derivative ladder**, JPG-dominant, delivered from a **dumb S3+CloudFront origin** that does **no on-the-fly transformation**. WordPress pre-generates a fixed ladder of size derivatives at upload; the front end uses `srcset`/`sizes` (responsive) but **no `<picture>` and virtually no webp/AVIF** (478 JPG vs 2 webp sampled).

**Four decisions define the media migration:**

1. **How many assets move** — migrate-all (~28.3k logical items → ~200k+ physical files, ≈80–110 GB), only in-use EN images (masters-only ≈ single-digit GB), or reference-in-place. This is the biggest cost lever.
2. **Content images** (hero/teaser/gallery/body) → **EDS author pipeline**, which is an *upgrade*: EDS auto-generates `<picture>` + webp + on-the-fly widths. These migrate cleanly.
3. **Downloadable binaries** (PDF press kits up to ~28 MB, hi-res JPG, **MP4** video via a tracked `/direct-download/` route) → **not** author-pipeline images; they need a **link/DAM strategy**, not optimization.
4. **The media-cart** (bulk asset collection/download) is a backend feature with no static equivalent — already flagged; it governs how download actions attach to assets.

**Good news:** the source's image handling is *dated* (no webp, fixed derivatives, a `sizes="32x32"` bug), so EDS's native pipeline will **improve** perf for content images with little effort. **Hard part:** the volume, and the hi-res/PDF/video download assets that sit outside the image pipeline.

---

## 2. Media Landscape (reconciled)

| Media type | Evidence | Scale | Primary EDS path |
|---|---|---|---|
| Content images (hero, teaser, gallery, body, infographic) | `<img>` + 8-wide `srcset`, JPG | bulk of ~28.3k logical items / ~200k+ physical files | **Author pipeline** (auto `<picture>`/webp) |
| CDN image derivatives | pre-generated `-WxH.jpg` ladder | 8 sizes/image | Replaced by EDS on-the-fly resizing |
| Video embeds | Vimeo (`dnt=1`), YouTube | ~7% / ~6% of pages | **Embed / autoblock** |
| Audio embeds | Buzzsprout (podcast), Spotify | ~6% / ~1% | **Embed / autoblock** |
| Native video downloads | `/direct-download/…-1080p.mp4` | press releases | **Link / DAM** (tracked) |
| Downloadable docs | PDF press kits/reports (~28 MB seen) | press kits/releases | **Link / DAM** |
| Hi-res image downloads | media-cart `data-size="giant\|original"` | press assets | **Link / DAM** (+ cart decision) |
| SVG / logos / icons | inline `<svg>` in chrome | few | **Inline in blocks** (repo already does this via `BRAND_LOGO`) |
| Image metadata | `alt`, `data-caption`, `ImageObject` schema | per image | Preserve in import |

---

## 3. CDN & Derivative Pipeline — how the source actually works

**Confirmed by header probes on `cdn.skoda-storyboard.com`:**

- **Origin:** `server: AmazonS3` behind `CloudFront` (`x-cache: … from cloudfront`), `cache-control: max-age=31536000` (1-year immutable).
- **No dynamic transformation.** Requests with `?w=200`, `?width=200`, `?resize=200,200`, `?format=webp` **all return the identical original bytes** (same `content-length`). The CDN is a **pass-through cache**, not an image service (not Cloudinary/imgix/Scene7).
- **Derivatives are pre-baked by WordPress** at upload time, exposed as filename suffixes: `-272x182`, `-384x256`, `-768x512`, `-1440x960`, `-1536x1024`, `-1920x1280`, `-2048x1365`, `-2560x1707` (8 sizes; aspect-specific variants also exist, e.g. `-1920x1082`).
- **Formats:** JPG-dominant (sampled 478 `.jpg` vs 8 `.png`, **2 `.webp`**, 2 `.svg`). **No AVIF, effectively no webp.** `Accept: image/webp` is ignored (still `image/jpeg`).
- **Responsive markup:** `<img>` with `srcset` (8 candidates) + `sizes`, `width`/`height` present (**good — prevents CLS**), `loading="lazy"` on below-fold, `fetchpriority="high"` on the LCP hero image, `decoding="async"`. **No `<picture>`/`<source>` at all.**
- **Bug spotted:** `sizes="32x32"` on a full-width hero `srcset` — an invalid `sizes` value that defeats responsive selection (the browser can't pick correctly). Not worth porting; EDS regenerates this.

**Implication for EDS:** EDS's built-in image handling (`createOptimizedPicture`) produces `<picture>` with webp + multiple widths on demand from a single uploaded original. Migrating content images to the EDS pipeline is therefore a **modernization win**, not a like-for-like port — we hand EDS the original (or the largest derivative) and drop the entire pre-baked ladder.

---

## 4. Media-Type Dossiers

### 4.1 Content images (hero, teaser, gallery, body)
- **Source:** `<img src=".../…-1920x1280.jpg" srcset="… 8 sizes" sizes="…" width height loading alt data-caption itemprop="image">`.
- **EDS path:** **author pipeline.** Import references the original/large derivative; EDS emits optimized `<picture>`.
- **Import handling:** parser emits a plain `<img src>` (or markdown image) pointing at the source asset URL; the EDS importer/ingestion pulls it into the content DAM and rewrites to the optimized delivery URL. **Critical repo gotcha:** EDS only wraps an image in `<picture>` when the `<img>` is a **direct child of a `<div>`** — images left inside `<p>` stay bare. Block JS (hero, columns, gallery) must lift `<img>` out of `<p>` (the pattern already documented in this repo's `AGENTS.md`).
- **Perf:** keep `width`/`height` (CLS), `fetchpriority` on hero LCP, `loading="lazy"` elsewhere — EDS does this by default.
- **Verdict:** 🟢 **Clean migrate + upgrade.**

### 4.2 Gallery images
- **Source:** many derivatives; Owl Carousel; JS column-count-by-width.
- **EDS path:** author pipeline for the images; gallery **block** handles layout (see block review — Owl replacement + responsive columns).
- **Note:** galleries hold the largest *per-page* image counts (press releases 1,510 pages carry galleries) — the bulk of the ~28.3k logical items (and their ~200k+ physical files) lives here.
- **Lightbox:** the gallery has a full-screen lightbox viewer (`sb-gallery-lightbox`); it may load larger originals on interaction — a media-delivery consideration (thumbnails through the pipeline, but the lightbox likely requests full-size assets on click).
- **Verdict:** 🟡 images clean; block layout is the effort (covered in block review).

### 4.3 Infographics
- **Source:** JPG image **+ downloadable PDF/JPG** ("download in print resolution").
- **EDS path:** display image via author pipeline; the downloadable original via **link/DAM** (§4.6).
- **Verdict:** 🟡 dual-asset (display + download).

### 4.4 Video embeds (Vimeo, YouTube)
- **Source:** lazy `<iframe data-src>` swapped by `ys-embed-controller` (IntersectionObserver); Vimeo carries `dnt=1&app_id=…`.
- **EDS path:** **embed block / URL autoblocking.** Preserve `dnt=1` (privacy). Native `loading="lazy"` iframe reproduces the lazy-swap.
- **Verdict:** 🟢 Low — standard EDS embed.

### 4.5 Audio embeds (Buzzsprout, Spotify)
- **Source:** Buzzsprout podcast `<iframe data-src>`; Spotify on ~1% of pages.
- **EDS path:** embed block variant (audio). Same autoblock approach.
- **Verdict:** 🟢 Low — but a distinct provider set to cover (don't forget audio).

### 4.6 Downloadable binaries — PDF / hi-res JPG / MP4
- **Source:** direct CDN links (`…annual-report….pdf`, **28 MB** seen) **and** a tracked WP route `/direct-download/…-1080p.mp4` (301 → CDN; enables download counting). Media-cart offers `data-action="download"` with `data-size="giant|original"`.
- **EDS path:** **link to asset / DAM** — these are **not** content images and must **not** go through the image-optimization pipeline (EDS would try to rasterize/resize; PDFs and MP4s need to be served as-is). Options: (a) reference the existing CDN URLs in place; (b) move originals into a DAM and link. Large PDFs/MP4s argue for **reference-in-place or DAM**, never inlining.
- **Tracking:** if download analytics matter, the `/direct-download/` counting behavior must be reproduced (redirect + event) — an integration, not a static link.
- **Verdict:** 🔴 Needs a DAM/link decision + (optional) download-tracking; couples to the media-cart.

### 4.7 SVG / logos / icons
- **Source:** inline `<svg>` in header/footer chrome (brand logo).
- **EDS path:** **inline in block JS/CSS** — this repo already does exactly this via the exported `BRAND_LOGO` constant used by `header.js`/`footer.js`.
- **Verdict:** 🟢 Trivial.

### 4.8 Image metadata (alt, caption, credit, structured data)
- **Source:** `alt` present on ~91% of sampled images (3/34 empty), `data-caption` on ~88%, `ImageObject` in the Yoast schema graph. Photographer/copyright credits appear in text (~4 mentions/page).
- **EDS path:** carry `alt` into the image markup; render captions as figcaption/adjacent text; preserve `ImageObject` where SEO-critical.
- **Watch:** empty-`alt` images and any images whose only caption/credit lives in `data-caption` (lost if the importer ignores that attribute). **Import parser must read `data-caption`.**
- **Verdict:** 🟡 Preserve deliberately — easy to drop captions/credits by accident.

---

## 5. EDS Integration Matrix

| Media type | EDS path | Import-script handling | Perf / a11y notes |
|---|---|---|---|
| Content/hero/teaser/body image | Author pipeline (auto `<picture>`+webp) | Emit `<img>` as **direct child of `<div>`**; ingest original; drop pre-baked ladder | Keep w/h, hero `fetchpriority`, lazy elsewhere |
| Gallery image | Author pipeline + gallery block | Same; block builds layout | Largest volume; column logic in JS |
| Infographic | Display image (pipeline) + download link | Two references: display + original | Alt/caption critical |
| Video embed (Vimeo/YT) | Embed / autoblock | URL → embed block; keep `dnt=1` | Lazy iframe |
| Audio embed (Buzzsprout/Spotify) | Embed / autoblock (audio) | URL → embed block | Distinct providers |
| PDF / MP4 / hi-res download | **Link / DAM (no optimization)** | Reference URL or move to DAM; **bypass image pipeline** | Large files; reproduce `/direct-download/` tracking if needed |
| SVG / logo | Inline in block | Constant in JS (`BRAND_LOGO` pattern) | — |
| Metadata (alt/caption/credit) | Attributes + figcaption + schema | Parser must read `alt` + `data-caption` | Don't drop credits |

---

## 6. Scale & Migration Strategy

**~42,275 attachment pages / ~28,300 distinct logical items (measured)** — now measured via full sitemap enumeration across the 55 sitemaps (the `wp/v2/media` endpoint still times out, so counts come from sitemaps + sampled file weights). Attachment pages are authored **per-locale** across 5 locales (cs/en/de/sk/sr; Slovenian absent); ~11,260 are English. With the 8-size derivative ladder (~7–9 files per logical image) the **physical files on the CDN/S3 ≈ 200,000–250,000** — migration copies files, not logical items. **Total footprint ≈ 80–110 GB; masters-only ≈ 34 GB** (avg derivative ~346 KB; avg master ~1.2 MB). Galleries on ~1,510 press-release pages hold the bulk.

Three strategies:

| Strategy | What | Pros | Cons |
|---|---|---|---|
| **Migrate-all** | Ingest every attachment into EDS/DAM | Self-contained; no source dependency | Heaviest; ≈80–110 GB / ~200k+ physical files, and migrates dead/unused assets among the ~28.3k logical items |
| **Reference-in-place** | Keep serving from `cdn.skoda-storyboard.com` | Fastest to stand up; zero migration cost | Long-term dependency on legacy CDN; no EDS optimization; governance risk |
| **On-demand / in-use only** | Migrate only images referenced by in-scope (EN, in-scope templates) pages | Right-sized; drops dead weight (EN-in-use masters-only ≈ single-digit GB vs migrate-all ≈80–110 GB / ~200k+ files) | Needs a reference-extraction pass (we already have the per-URL dataset to seed this) |

**Recommended:** **On-demand, in-use-only, EN-first.** Use the existing `SKODA-EN-BLOCK-DATASET.csv` + a link-extraction pass to build the exact set of images referenced by in-scope pages, ingest those into the EDS pipeline, and **reference-in-place** (or DAM-link) the large downloadable binaries (PDF/MP4/hi-res) rather than optimizing them. This avoids migrating tens of thousands of unused/archival assets while modernizing the images that actually render.

---

## 7. Demo Scope Recommendation (EN)

- **Content images:** migrate the images referenced by the pilot pages (one press-release article + the listing) through the EDS author pipeline — proves `<picture>`/webp generation and the img-out-of-`<p>` restructuring.
- **Gallery:** include one gallery to exercise multi-image optimization + the block layout.
- **Embeds:** include one Vimeo + one Buzzsprout to prove autoblocking (and audio coverage) with `dnt=1`.
- **Downloads:** render PDF/MP4/hi-res as **plain links to the existing CDN** (no media-cart, no optimization) — demonstrates the link/DAM path without building the cart.
- **Explicitly out of demo:** media-cart, bulk download, download tracking, and full-library ingestion (~28.3k logical items / ~200k+ physical files).

---

## 8. Risks & Open Questions

| # | Risk / Question | Impact | Note |
|---|---|---|---|
| M1 | **Volume** — migrate all (~28.3k logical / ~200k+ physical files, ≈80–110 GB) vs in-use only (EN masters-only ≈ single-digit GB) | High | Recommend in-use-only; big cost lever |
| M2 | **DAM ownership** — where do originals/large binaries live post-migration? | High | Needs a named owner + target (EDS DAM, existing CDN, or new DAM) |
| M3 | **Downloadable binaries bypass image pipeline** | Med | PDFs/MP4/hi-res must be linked, not optimized; EDS would mishandle otherwise |
| M4 | **Download tracking** (`/direct-download/`) | Med | Reproduce as integration if analytics required, else plain link |
| M5 | **No webp/AVIF at source** | Low (positive) | EDS upgrades this for free on content images |
| M6 | **Caption/credit loss** — data in `data-caption` + free text | Med | Parser must read `data-caption`; audit copyright/credit handling |
| M7 | **Rights / licensing on hi-res press assets** | Med | Confirm redistribution terms before migrating originals |
| M8 | **Alt-text gaps** — some empty `alt` | Low | Flag empties for editorial backfill (a11y) |
| M9 | **Legacy CDN dependency** if reference-in-place | Med | Governance/lifespan of `cdn.skoda-storyboard.com` must be confirmed |

**Not verified this session (`[RUNTIME-UNCONFIRMED]`):** actual rendered layout-shift from image loading, and whether any gallery/lightbox loads still-larger originals on interaction — both require a headless browser follow-up. Media volume is **now measured via full sitemap enumeration** (`SKODA-MEDIA-DEEP-DIVE.md`): 42,275 attachment pages / ~28,300 distinct logical items / ~200k–250k physical files. The `wp/v2/media` endpoint still times out, so counts come from sitemaps + sampled file weights (footprint ≈80–110 GB / masters-only ≈34 GB is a medium-confidence extrapolation from a ~280-file sample).

---

## Appendix — Evidence Captured

- **Image markup:** hero `<img>` with 8-candidate `srcset` up to 2560w, `width/height/loading/fetchpriority/decoding/alt/data-caption/itemprop`; **no `<picture>`/`<source>`**; `sizes="32x32"` bug.
- **CDN probes:** `AmazonS3`+CloudFront, `max-age=31536000`; identical bytes for `?w`/`?width`/`?resize`/`?format=webp`; `image/jpeg` even with `Accept: image/webp` → **no dynamic transform**.
- **Formats sampled:** 478 jpg / 8 png / 2 webp / 2 svg.
- **Downloads:** PDF `application/pdf` 28,222,196 bytes; `/direct-download/…mp4` → 301 to CDN (tracked); media-cart `data-action=add|download|link`, `data-size=giant|original`.
- **Metadata:** alt on ~91% (3/34 empty), `data-caption` on ~88%, Yoast `ImageObject` in schema graph.
- **Scale:** 42,275 attachment pages / ~28,300 distinct logical items across 5 locales (measured via full sitemap enumeration); ~200k–250k physical files with the 8-size derivative ladder; footprint ≈80–110 GB (masters-only ≈34 GB). `wp/v2/media` REST count endpoint still timed out — counts derived from sitemaps + sampled file weights.
- **Limitation:** sample-based; no bulk crawl of the media library; no headless browser for rendered-layout checks.
