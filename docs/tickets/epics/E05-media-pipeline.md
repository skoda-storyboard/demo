# E05 — Media Pipeline (Phase A)

## Goal
Prove the *static* media architecture for the pilot: ingest **masters only** (drop the ~8-size derivative ladder — EDS regenerates responsive `<picture>`/webp on demand), get press-page downloads rendering as static links from the `mediakit/v1/mediabox` data, and route the non-image binaries (PDF/MP4) to link/DAM instead of the image pipeline. This is the media half of what the pilot page set (SKODA-603) needs. Physical-file/footprint counts throughout are **order-of-magnitude**, not exact.

**Scope update (2026-09-07):** the client scope makes the **media cart mission-critical for the 15 Oct demo** (device-ID, no login), so the demo cart + **client-side zip download** now ship in **M1 as SKODA-505** (previously the cart was deferred to Phase C). Only **production hardening** — a serverless zip endpoint, signed access, cross-device state — stays in Phase C (**SKODA-902**, re-scoped). See `SKODA-MEDIA-CART-DOWNLOAD.md` for the options analysis.

**Build-confirmed addition (2026-09-10): media pre-conditioning is required, not optional.** A shipped story page embedding 4 masters at **25–40 MB each 409'd the content bus on publish** ("error from content-bus"). The masters-only ingest (SKODA-501) must therefore **detect and strip/replace images over a size threshold (~10 MB) with a sized derivative before publish**, or bulk publishing fails at scale. Captured as **SKODA-506** and folded into SKODA-501's spec/AC. This is the concrete form of the abstract "~200k files / heavy masters" risk.

**Implemented (2026-09-21): the media toolkit.** SKODA-501/504/506 (+ the SKODA-505 cart resolver seam) are built + tested in **[`tools/importer/media/`](../../../tools/importer/media/README.md)** — masters-only ingest into AEM Assets via the AEMaaCS 3-step direct-binary-upload, **page-mirrored** `/content/dam/storyboard/<page-path>/<file>`, delivery-image pre-conditioning, per-step resumable manifest, and `content/media-index.json` for the cart. See [`docs/media/SKODA-ASSET-MAPPING.md` §9](../../media/SKODA-ASSET-MAPPING.md).

**Open decision (post-M1 demo): production media-cart original model.** The importer-authored DAM-path route is demo-only (migrated pages). Production authors picking **new** assets via the native AEM Assets picker need **Dynamic Media with OpenAPI** ("copy reference URL") — not enabled on the current standard instance — or a hash-reconciliation index. **Decide after the 15 Oct demo.**

## Phase
**A — capability pilot (EN).** All tickets are pilot-scoped.

## Tickets
- **SKODA-501 — Masters-only image ingest for pilot pages (img-out-of-`<p>`, alt+data-caption).** Ingest one master per logical image; lift `<img>` out of `<p>` to a direct `<div>` child so EDS wraps it in `<picture>`; preserve `alt` + `data-caption` (53% of captions live in `data-caption`); drop the 8-size derivative ladder. — deps 102 — 3SP — Y
- **SKODA-502 — Static Downloads block (from mediakit/v1/mediabox).** Render the per-press-post downloadable image set from `mediakit/v1/mediabox/post/{id}/{lang}` (`{images:[{imageUrl,link,translated,title}]}`) as static download links, baked at import. No cart, no signed URLs. — deps 102 — 3SP — Y
- **SKODA-503 — PDF/MP4 handling (link/DAM, no image pipeline).** Route PDFs and MP4s to link/DAM, never the image pipeline. Pilot = plain links (only the *signed MP4 download service* deferred to Phase C; the media cart itself is now SKODA-505/M1). — deps 501 — 2SP — Y
- **SKODA-504 — Map existing S3 images → AEM Assets (mapping manifest).** Build a `s3-url → aem-assets-ref` manifest (match: filename→phash→manual, or ingest+manifest) consumed by the import rewrite; demo subset in M1, full scale (~28.3k, rights+dedup) in M2. See `SKODA-ASSET-MAPPING.md`. — deps 501, 601 — 3SP — Y (demo subset)
- **SKODA-505 — Demo media-cart + client-side zip download (device-ID, no login).** Device-ID cart (localStorage) collecting press assets across pages + **client-side zip** (`fflate`) "download all", item/size caps, analytics re-emit, per-story pre-zip fallback. Mission-critical demo deliverable; bulk zip is the non-EDS-native piece done client-side. Hinges on CORS-enabled AEM Assets delivery (501/504). See `SKODA-MEDIA-CART-DOWNLOAD.md`. — deps 502, 501/504, 601 — 8SP — Y
- **SKODA-506 — Media pre-conditioning: strip/replace oversized masters before publish (build-confirmed).** Import-pipeline step that **detects images over a size threshold (~10 MB) and strips/replaces the inline `<picture>` master with a sized derivative** (keeping the `og:image`-driven card + the metadata block intact) so the **content bus does not 409 on publish**. Proven fix on the shipped slice (`a-drivers-paradise…`: 4× 25–40 MB masters → 409 → resolved by stripping masters, keeping 662 KB/395 KB derivatives). Runs ahead of the publish call for every increment; essential for bulk migration at scale. — deps 501 — 2SP — Y

## Effort Roll-up
| Ticket | Type | SP | AI-assisted | Manual |
|---|---|---|---|---|
| SKODA-501 | import | 3 | 1–2d | 2–3d |
| SKODA-502 | block | 3 | 1–2d | 2–3d |
| SKODA-503 | import | 2 | 0.5–1d | 1–2d |
| SKODA-504 | import | 3 | 1–2d | 2–3d |
| SKODA-505 | block | 8 | 3–5d | 6–10d |
| SKODA-506 | import | 2 | 0.5–1d | 1–2d |
| **Total** | | **21 SP** | **7–13d** | **14–23d** |

*(Planning estimates, not a quote.)* Critical path: SKODA-501 → SKODA-506 (pre-condition) → SKODA-503; SKODA-502 → SKODA-505 (needs CORS-enabled AEM Assets delivery from 501/504); SKODA-502/504 parallel. All feed SKODA-603. **SKODA-506 gates publish** — every page that reaches the content bus must pass pre-conditioning first.

## Source-Doc Traceability
- **`SKODA-MEDIA-DEEP-DIVE.md`** — §1–§3 (masters ≈28.3k logical / ~1.2 MB avg; physical-file/footprint counts order-of-magnitude), §3/§8 (drop the 8-size ladder — EDS regenerates webp/widths), §4 (MP4 signed-S3 `/direct-download/`; PDF up to 26 MB → link/DAM), §5 (alt 96%, `data-caption` 53% — parser MUST read it), §8 (`<img>`-out-of-`<p>`), §10 (rights/DAM/MP4 open questions).
- **`SKODA-SYSTEM-BUILD-SPECS.md` §3 (Media cart)** — `mediabox` returns `{images:[{imageUrl,link,translated,title}]}`; downloads static, cart = service; MP4 signed-S3.
- **`SKODA-MEDIA-CART-DOWNLOAD.md`** — bulk zip-download options (A–F), device-ID cart-state model, CORS/AEM-Assets linchpin, demo-vs-prod recommendation → the basis for SKODA-505 (demo) and SKODA-902 (prod).
- **`SKODA-EDS-DA-ARCHITECTURE.md`** — §7 (Media & DAM: masters-only, img-out-of-`<p>`, static downloads block, PDF/MP4, CORS, **heavy-master pre-conditioning / content-bus 409, build-confirmed**), §10 (import carries `alt`+`data-caption`), §8 (media-cart dropped for pilot), §13 R-A6 (heavy-master 409 risk).
- **Build log (2026-09-10)** — the `a-drivers-paradise…` 409 incident and its fix are the empirical basis for SKODA-506; see delivery plan §1/§6 (R-A′) and memory `skoda-masters-only-vs-reference-in-place`.
