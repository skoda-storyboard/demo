# SKODA-513, Native delivery for Images lightbox previews and fallback links

- **Epic:** E05, Media Pipeline
- **Type:** integration / shared listing-lightbox follow-up
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2 (planning priority, not a severity rating)
- **Source:** user observation `IMAGES-DELIVERY-01`, reported and measured 2026-10-07; separate from #266's workbook.
- **Related owner:** #178 / SKODA-511, AEM Assets to media-feed sync.
- **Renderer reference:** closed #176 / SKODA-406.
- **GitHub issue:** [#289](https://github.com/skoda-storyboard/demo/issues/289)
- **Status (2026-10-15, from GitHub):** 🔵 TODO (M2), no owner. Coordinate with SKODA-511 (#178) and #219 before starting.

## Summary

Complete native Media Bus delivery for the Images listing's **large lightbox previews and rendered fallback/modifier-click links**.
Grid thumbnails already use Media Bus; this is not a blanket thumbnail migration.
Coordinate the preview-delivery contract with #178 rather than duplicating its production sync job.

## Environment and reproduction

- Demo: https://main--demo--skoda-storyboard.aem.live/en/images
- Origin listing: https://www.skoda-storyboard.com/en/images/
- Feed: https://main--demo--skoda-storyboard.aem.live/en/media-feed.json
- Evidence captured **2026-10-07**, serial Chrome DevTools DOM/network inspection at **1280 x 900, DPR 1**, plus complete public-feed and deployed-module analysis. No screenshots.

1. Open the demo listing. Its first 12 thumbnails load Media Bus URLs successfully.
2. Open the first image card, asset ID **455756**, title **hudebni-leto_ee2dfc93**.
3. Inspect `.gallery-lightbox-image.is-loaded.currentSrc`: it loads the legacy CDN URL below, HTTP 200, decoded **1920 x 1280**.
4. Inspect the card anchor: it still points to legacy CDN for modifier clicks and module-load-failure fallback. These paths were established from DOM/deployed code, not by deliberately forcing a module failure.

| Role | Sample URL / result |
|---|---|
| Grid thumbnail | `https://main--demo--skoda-storyboard.aem.live/en/fragments/media_13c4b011f82f9bd951efe1c4da9b46500b52c033e.jpg?width=750&format=webply&optimize=medium`; HTTP 200, 750 x 500. |
| Actual large preview | `https://cdn.skoda-storyboard.com/2026/09/hudebni-leto_ee2dfc93-1920x1280.jpg`; HTTP 200, 1920 x 1280. |
| Card anchor | `https://cdn.skoda-storyboard.com/2026/09/hudebni-leto_ee2dfc93.jpg` |
| Media Bus quality probe | Same Media Bus asset with `width=1920&format=webply&optimize=medium`; HTTP 200, but only **768 x 512**. |
| Feed original | `https://publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/en/images/hudebni-leto-ee2dfc93/hudebni-leto_ee2dfc93.jpg` |

The quality probe is one asset's measured limit, not proof that every Media Bus reference has those dimensions.
Do not assume a larger width parameter supplies missing source pixels.

## Feed evidence and root cause

The fetched feed contains **1,769 rows: 1,714 image, 51 video and 4 asset**.
For the 1,714 image rows:

| Field / current helper selection | Media Bus | AEM publish | Legacy Skoda CDN | Empty |
|---|---:|---:|---:|---:|
| `image` | 1,714 | 0 | 0 | 0 |
| `original` | 0 | 1,714 | 0 | 0 |
| `path` | 0 | 0 | 1,714 | 0 |
| `rendition-1920` | 0 | 0 | 1,511 | 203 |
| Chosen large-preview source | 0 | 203 | 1,511 | 0 |

The selection counts are full-feed/code analysis, **not** 1,714 browser/network tests.
One actual legacy preview was reproduced; all 12 initially displayed thumbnails loaded successfully.
The presence of AEM publish URLs does not prove every original is anonymously available.
No cart additions, file downloads or personal-data submissions were performed during this delivery investigation.

Snapshot provenance: HTTP 200 JSON; response date **2026-10-07 21:26:52 UTC**; last modified **2026-10-05 13:46:29 UTC**.
Fetched JSON SHA-256: `05ad89b573f024885bb05270e82625a5e6e7083c89005a194d38181675333215`.

The deployed consumer chain is:

- `blocks/listing/listing.js`, `mediaCell`: picture uses `row.image || row.poster`; anchor uses `row.path || row.original || row.mp4`.
- Normal click builds the shared lightbox through `rows.map(feedLightboxItem)`; modifier clicks retain the anchor, and a module-load failure navigates to it.
- `scripts/media-lightbox.js`, `feedLightboxItem`: `row['rendition-1920'] || row.original || row.image` becomes both `src` and explicit `full`.
- `scripts/lightbox.js`: `item.full` takes precedence over a derived Media Bus `width=2000` URL.

Migrating the thumbnail field therefore does not migrate the preferred large-preview rendition or rendered fallback link.
Inspect deployed modules when reproducing; the checkout used for the original investigation had older listing code.

## Scope and acceptance criteria

- [ ] Agree the preview-delivery contract with #178 and provide anonymously accessible Media Bus references with sufficient native resolution. Reuse the existing ingest/generation path; writing a DAM URL into a DA sheet alone does not prove Media Bus ingestion.
- [ ] Preserve at least the reproduced sample's current **1920 x 1280** preview detail rather than substituting its 768 x 512 card input. Record source/returned dimensions for landscape, portrait, inherently smaller masters and rows without `rendition-1920`; do not require upscaling genuinely smaller masters.
- [ ] Switch the shared feed-to-lightbox helper to the quality-capable native preview reference without preferring residual legacy rendition URLs. Verify actual stage `currentSrc`, successful network responses and decoded pixels, not only feed strings.
- [ ] Switch rendered image-card fallback/modifier-click delivery targets off legacy CDN while preserving logical IDs/source paths used for mapping and cart identity. Verify ordinary click, keyboard activation, modifier/new-tab click and module-load-failure fallback.
- [ ] Keep card thumbnails resized rather than loading masters. Verify all image-row preview/link selections against the published feed, with sampled HTTP/decoded-image evidence for representative rows with and without a 1920 field.
- [ ] Keep preview delivery, full-quality DAM originals/cart URLs, downloadable 1920 renditions and logical identity distinct. Preserve Original/1920 download behavior; any downloadable 1920 replacement must provide its promised pixels. This preview/link cutover must not silently turn originals or 1920 downloads into optimized thumbnails.
- [ ] Regression-check image/video listings, opted-in model image rails and shared page-image links. Preserve Vimeo/video behavior, non-media story cards, lightbox caption/counter/navigation, Escape/focus return, accessibility, filter/sort/load-more and collection/download behavior.
- [ ] Use measured DOM/network/pixel-dimension evidence and appropriate targeted repository tests plus independent QA. At relevant mobile and 768/992/1080/1280 widths, verify image quality and interactions without screenshots as review evidence.
- [ ] Surface unresolved native-delivery failures explicitly. Do not silently retain unreported legacy fallbacks or claim all originals work from URL counts alone.

## M2 rationale and exclusions

The sampled grid and large preview render successfully.
The approved M1 media-feed decision allowed source-CDN fallback and assigned native Assets feed cutover to M2.
This remains required migration work before go-live, but is not a reproduced broken M1 image flow under the agreed rough-M1 cut line.

Promote a reproduced missing/failed critical demo image, broken existing preview/download, or an explicit requirement to eliminate legacy delivery before the demo to M1.
Separate media-action failures in #266/#273 remain in their existing M1 triage; this evidence is not action-flow acceptance.

This ticket does **not** duplicate #178's lifecycle synchronization, sharding, taxonomy, trigger/runtime/ownership or partial-publish safeguards.
Already-migrated thumbnail snapshot URLs do not prove production Assets synchronization.
It does not reopen #176, implement the authoring picker in #62, resolve #219's distinct WebP-original delivery problem, or replace press-user originals with Media Bus thumbnails.

## Dependencies and collision scope

Coordinate native preview generation with **#178 / SKODA-511**.
**Added 2026-10-16:** read the preview reference from SKODA-517's keyed or detail shards, not the whole feed. The
asset-ingestion review ([`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md)) orders this
after 517 and 511.
Quality-capable, anonymously delivered references are a prerequisite to removing the working legacy preview.
Check whether #219 affects chosen native sources; successful JPEG thumbnail delivery is not proof that WebP-original publishing is fixed.
Closed #49 / SKODA-504, #30 / SKODA-501 and #176 / SKODA-406 are mapping/ingest/renderer references, not inferred open blockers.

Serialize edits to feed generation/Assets delivery, listing anchors, shared media-lightbox/lightbox helpers, media-card/download handling and opted-in feed-backed rails.
Reassess collisions with M1 media-action work and other shared lightbox changes.

## Supporting context

- [M1 fallback and M2 media-feed architecture](https://github.com/skoda-storyboard/demo/blob/main/docs/architecture/SKODA-MEDIA-ITEMS-OPTIONS.md)
- [Separate display delivery from original mapping](https://github.com/skoda-storyboard/demo/blob/main/docs/media/SKODA-ASSET-MAPPING.md)
- [Full-quality originals and client-side ZIP decision](https://github.com/skoda-storyboard/demo/blob/main/docs/planning/SKODA-DEMO-FALLBACK-CONFIRM.md)
- [Team operating model](https://github.com/skoda-storyboard/demo/blob/main/AGENTS-TEAM.md)

This issue publishes only `IMAGES-DELIVERY-01`; it does not publish the other local #266 or wireless-story ticket drafts.
