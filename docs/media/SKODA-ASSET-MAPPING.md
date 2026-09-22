# Škoda Storyboard — Mapping Existing Images → AEM Assets

**Companion to `SKODA-MASTER.md` / `SKODA-MEDIA-DEEP-DIVE.md`.** Specifies how existing Storyboard images (served from S3/CloudFront) are mapped to **AEM Assets** — the client-confirmed approved-asset source. Backlog ticket: **SKODA-504** (E05 Media Pipeline).
**Date:** 2026-09-07 · Analysis/spec only.

---

## 1. The core problem

The client confirmed **AEM Assets is the approved-asset source**, so content that today references S3 images must instead reference AEM Assets. But there is **no shared join key** between the two:

- Images live on **S3 + CloudFront** (`cdn.skoda-storyboard.com` → `skoda-storyboard.s3.eu-central-1`), pre-baked into an 8-size ladder.
- Recent filenames are **WordPress hash-suffixed** (e.g. `skoda-epiq-m70-01_1135a598.jpg`) — **not** an AEM Assets ID/path.
- **No embedded EXIF/IPTC** rights metadata → no identifier baked into the files.
- **No CORS** on the CDN (matters for any browser-side hashing approach).

→ Mapping is realistic, but the **method depends on whether the same images already exist in AEM Assets**, and the mapping must be *constructed* (there's nothing to look up today).

---

## 2. Decision tree — Scenario A vs B (confirm first)

**The one question that sets the whole approach:** *are the approved images already in AEM Assets, or does Storyboard/S3 hold the originals?* Client said assets come "from marketing databases, AEM Assets, or other locations" → likely **mixed**, so plan for **both paths + an unmatched fallback**.

### Scenario A — images ALREADY in AEM Assets (a *matching* problem)
Match each S3 image to its AEM Assets twin, best → worst:
1. **Filename / business-ID match** — join on original filename or a preserved ID. Fast, but WP hash suffixes (`_1135a598`) won't be in Assets → strip suffix / fuzzy-match the base name.
2. **Content (perceptual) hash match** — hash each S3 image and each Assets rendition; match on visual identity. Robust to filename drift; cost = fetch + hash both sides (bounded batch, but ~28k logical images).
3. **Manual / AI-assisted match** — for the small demo subset (dozens), do it by hand; defer bulk.

### Scenario B — images NOT in Assets yet (an *ingest-then-reference* problem)
1. **Upload S3 masters into AEM Assets** (Assets API / bulk import), capturing original S3 path + filename as metadata.
2. **Emit a mapping manifest** as a by-product: `s3-url → aem-assets-path`.
3. **Rewrite content references** at import using the manifest.
This is the cleaner, more likely path for a WordPress-origin site; aligns with our **masters-only ingest** recommendation (upload originals, let EDS/Assets generate renditions — drop the pre-baked ladder).

---

## 3. The mechanism (works for either scenario): a mapping manifest

Whichever path, everything keys off one artifact — a **mapping manifest**:

```
s3_url                                             → aem_assets_ref            (match method, confidence)
cdn.skoda-storyboard.com/2026/05/…_1135a898.jpg    → /content/dam/skoda/…jpg   (filename, high)
cdn.skoda-storyboard.com/2018/08/hero_V2.jpg       → /content/dam/skoda/…      (phash, medium)
…                                                  → UNMATCHED                 (needs manual / ingest)
```

- **Build it by:** ingest (Scenario B — manifest falls out of upload) or match (Scenario A — filename → phash → manual, in that order).
- **Consume it in:** the import parsers (SKODA-601 / SKODA-801) — when rewriting `<img src>`, look up the manifest and substitute the AEM Assets reference; **unmatched → fallback** (reference-in-place on S3, or flag for manual/ingest).
- Store as a sheet/CSV so it's inspectable and re-runnable.

---

## 4. Demo (M1) vs Full-scale (M2)

| | M1 — Oct 15 demo | M2 — go-live |
|---|---|---|
| Scope | Only the **demo pages'** images (dozens) | All in-use approved images (~28,300 logical — order-of-magnitude) |
| Method | Ingest-or-match the small set; hand-verify | Automated match/ingest + manifest at scale |
| Effort | Trivial (part of demo build) | A real workstream (see §5) |
| Fallback | Reference-in-place for anything not yet in Assets | Systematic unmatched handling |

**M1 is definitely realistic** — you only need the demo set in AEM Assets. **M2 is realistic but is a project**, and the cost is *not* the upload.

---

## 5. What actually costs effort at full scale (be honest)

1. **Choosing the join strategy** (A vs B vs mixed) — the gating decision.
2. **Rights & dedup** — which of ~28k are *approved*, and which are cross-locale duplicates (recall 42,275 attachment pages → ~28,300 logical items; ~33% are cross-locale dupes). Don't ingest 42k when 28k are distinct, and don't ingest unapproved assets.
3. **Reference rewriting at scale** — natural extension of the existing import rewrite (SKODA-601/801 already rewrite `<img src>`), not a new system.
4. **Unmatched tail** — some S3 images will have no Assets twin and aren't approved-source; decide per-image (ingest / reference-in-place / drop).

**Effort:** the *tooling* (hash/match/manifest/rewrite) is days of AI-assisted work; the *schedule driver* is the **rights + dedup + unmatched decisions**, which need human/stakeholder judgement.

---

## 6. Open questions (confirm before committing)

- **A or B (or mixed)?** Are approved images already in AEM Assets, or does S3 hold the originals? — sets the whole approach.
- **What metadata does AEM Assets preserve?** (Original filename? A business ID?) — determines whether filename-match is viable or we need perceptual hashing. *(Unknown — no Assets access this session.)*
- **Approval flag** — how is "approved" expressed in AEM Assets (folder, tag, metadata)? — needed to filter the ~28k.
- **Unmatched policy** — ingest vs reference-in-place vs drop.

---

## 7. Honest caveats

- **AEM Assets contents not verified** (no access) — "can we match on filename?" is unknown until someone inspects what Assets actually stores.
- **~28k is order-of-magnitude** (derivative-multiplier variance) — any bulk estimate inherits that.
- **No-CORS on the S3 CDN** — rules out naive *browser-side* hashing; do the hashing server-side/in the import job.
- Perceptual-hash matching has a **false-match rate** — needs a confidence threshold + manual review of low-confidence matches (don't auto-swap on a weak match).

---

## 8. Recommendation

- **M1:** ingest/match only the demo set into AEM Assets; hand-verify; reference-in-place for the rest. No blocker.
- **M2:** confirm Scenario A/B, build the **manifest-driven pipeline** (match: filename→phash→manual; or ingest+manifest), wire it into the import rewrite, and budget the real cost against **rights + dedup + unmatched**, not the upload.
- Track as **SKODA-504** (M1 demo-subset) with an M2 scale-out note; the full-scale rights/dedup work rides with SKODA-803 (bulk import) and the DAM decision (D5, now = AEM Assets).

---

## 9. Implemented (2026-09-21) — `tools/importer/media/`

The manifest-driven pipeline described above is **built and tested**. Toolkit +
runbook: [`../../tools/importer/media/README.md`](../../tools/importer/media/README.md).

- **Scenario B (ingest):** `build-media-manifest.mjs` uploads the **original master**
  of each in-use image into AEM Assets via the **AEMaaCS 3-step direct-binary-upload**
  (`initiateUpload.json` → PUT parts → `completeUpload.json`), into a **page-mirrored
  folder** `/content/dam/storyboard/<source-page-path>/<file>` (e.g. Elroq →
  `/content/dam/storyboard/en/skoda-model/elroq/…`). First page to reference an image
  owns its folder; shared images reuse it (logical-image dedup).
- **Manifest** (`media-manifest.json`) = the `s3_url → { dam_asset_path, delivery_url,
  original_download_url, alt, per-step status }` index. Re-runnable, incrementally
  persisted (resumable), non-zero exit on residual failures.
- **Two mechanisms:**
  - **A) delivery** — `apply-media-manifest.mjs` rewrites content `<img src>`/`srcset`
    to `delivery_url`; EDS ingests it into its media bus at publish (self-hosted webp).
    Pre-conditioning (SKODA-506) applies to the **delivery** image only (>10 MB → sized
    derivative); the **DAM keeps the full original**.
  - **B) media-cart original** — `apply` emits `content/media-index.json`, the cart
    resolver seam mapping `logical_id → dam_asset_path + original_download_url` that
    the `media-cart` block (SKODA-505) reads for "download original".
- **Auth (per-host):** injected **session** IMS for DA/`admin.hlx.page`; a **custom IMS
  token** (from env/gitignored file, never chat) for the AEM DAM host only. Missing/
  expired token → graceful reference-in-place fallback.

### Findings that bound this

- **The native AEM Assets sidekick picker cannot carry a DAM path** on a standard
  instance: it pastes a **plain image → the EDS media bus** (no asset id/URN/custom
  attribute). The native way to surface DAM identity for **any** picked asset (incl.
  new production uploads) is **Dynamic Media with OpenAPI** ("copy reference URL"),
  which is **not enabled** on this tenant.
- ⇒ The importer-authored DAM-path route (Mechanism B) is **demo-only** — it covers
  migrated pages, **not** future author-picked assets. **Production media-cart-original
  model is a post-M1-demo decision** (DM/OpenAPI recommended; else content-hash
  reconciliation or an author-recorded DAM-path field). The resolver is a single seam,
  so swapping its source later is config, not a cart rebuild.
- Author DAM paths are **IMS-gated** (not anonymously downloadable), so the M1 cart
  "download original" is served from a **DA-published copy** (`--da-archive`), not the
  author path.
- EDS auto-ingests **absolute** image URLs into its media bus at publish; a
  root-relative `/media-da/` path does **not** resolve on the `aem.live` host.
