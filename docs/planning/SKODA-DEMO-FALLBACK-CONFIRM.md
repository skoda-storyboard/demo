# Škoda Demo, Dynamic-Feature Fallback Confirmation (Phase 0 #7)

Confirmed against the freshly-pulled `SKODA-DELIVERY-PLAN.md` decision log (2026-09-17). This records
which dynamic features are in scope for the import build vs deferred, and the fallback each carries so a
slipped client-side dependency never breaks the demo.

| Feature | Decision | Import-build impact | Fallback |
|---|---|---|---|
| **Media-cart** (D2) | **Corrected 2026-09-21 (user), supersedes the 2026-09-17 "individual per-asset, no zip" line below.** Demo cart stays **UI-side** (device-ID collect/persist, no login). On download, deliver the **ORIGINALS from AEM DAM** (not the web-optimized media-bus renditions EDS serves on-page): a **single** asset downloads directly; **multiple** selected assets are **zipped client-side** (`fflate`) into one bundle. Server-side reduction is NOT the goal (press users want full-quality originals); the M2 production service is SKODA-902. *(Prior 2026-09-17 record, now superseded: keep cart UI-side, download individual per-asset, no zip. Prior 2026-09-10 framing "purpose = size reduction" no longer holds.)* | Build cart **UI + device-ID collect/persist + originals download** client-side; single = direct download, multi = `fflate` zip; cart items reference **CORS-enabled AEM DAM original-delivery URLs** (SKODA-501/504). No backend. | Per-story pre-zipped bundle of originals if the interactive cart or CORS delivery slips. Real production hardening is M2 (SKODA-902). |
| **AEM Assets** (D5) | **Resolved**, AEM Assets is the approved-asset source. Sharpened: source masters ~40 MB → **content-bus 409** if published as-is, so a **media pre-conditioning step is required**. | Import must pre-condition (resize/optimize) heavy masters; keep masters in place for editability (no `-WxH` strip), optimize in place per `scripts/optimized-picture.js`. | If the AEM Assets instance slips, serve the curated set from the pipeline/CDN (Adobe CDN, D14) and cut over later. |
| **Locale** (D1) | **EN + CS for M1**; DE/SK/SR/SL on-demand for M2. | **Import EN only** now; per-locale query-index plumbing already locale-extensible. | Prove CS **structurally** (chrome + language-selector + one page) if CS content is late, rather than full parity. |
| **Consent / OneTrust** (D10) | Out of Adobe delivery scope. | Strip `#onetrust-*` on import (existing cleanup gotcha); no consent build. | Stub only. |
| **Load-more / rails** | In scope, built (`stories` block has load-more + category filter; verified this session). | Corpus sized to ≥18 paginated / ≥12 rail per `SKODA-RAIL-FEED-MAP.md`. | n/a, this is the core demo proof. |

**Net effect on this plan (corrected 2026-09-21):** the media-cart block delivers **UI-side device-ID
collect/persist + originals download from AEM DAM**, a single asset downloads directly and multiple
selected assets are **zipped client-side (`fflate`)** into one bundle. Originals means the full-quality
DAM assets, not the web-optimized media-bus renditions. This supersedes the earlier 2026-09-17
"individual per-asset, no zip" decision and the 2026-09-10 "purpose = size reduction" framing. The real
production reduction/hardening service is M2 (SKODA-902). All other fallbacks (D5 pipeline/CDN, D1
CS-structural, D10 stub) stand.

## Build sequencing (2026-09-17, user)

**Tier-1 first.** Build + import the irreducible-core demo path before Tier-2:

- **Tier 1 (build/import first):** Storyboard home (done, polish), story detail, model page (5 rails),
  Series directory + hub, Media Room home, category + tag/model listings. These prove the rails +
  load-more that are the heart of the demo.
- **Tier 2 (after Tier-1 is green):** full Images/Videos faceted listings, press-kit hub/chapter/resource,
  press-release detail, company/Page sub-types, newsletter archive+signup.

Rationale: de-risks the demo, the core rail/load-more narrative lands even if Tier-2 time runs short.
