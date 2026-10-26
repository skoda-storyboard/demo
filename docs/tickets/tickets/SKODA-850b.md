# SKODA-850b, Downloadable originals after go-live: AEM Assets editor group, folders, picker renditions, kit ZIPs

- **Epic:** E08, Editorial at Scale
- **Type:** setup / configuration (AEM Assets groups and folders, DA picker settings) + author guide
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker, but without it every new release
  with downloads needs a developer.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d, excluding client AEM admin time *(planning estimate, not a
  quote)*. From the review: G-KJ-02 5–8 SP with G-T1-01 merged (a plugin 3–5, config and permissions 1–2, guide 1).
  This ticket plans the native path only; a custom Downloads-row plugin becomes a new sub-ticket of SKODA-850 if
  the native path fails the criteria below.
- **GitHub issue:** [#448](https://github.com/skoda-storyboard/demo/issues/448) (created 2026-10-21, sub-issue of #427)
- **Parent:** SKODA-850
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-02 (High, CONFIRMED; + G-T1-01).

## Why
- **New releases carry downloads.** The 2026-10-19 EN release has 22 download links (20 images, 1 MP4, 1 PDF); 13 of
  the last 30 EN releases have body downloads.
- **Each author path fails a gate:**
  - DA upload caps MP4 at 36 MB and PDF at 20 MB and refuses ZIP; 71 of 91 migrated MP4s exceed 36 MB (median
    188 MB) and the Epiq kit ZIP is 728 MB. (The limits page says limits can be raised per customer.)
  - `media-cart-resolver.js` accepts only the DAM host or the source host, so Media Bus files aren't cart-able.
  - SKODA-101a I4 gives authors read access to AEM Assets only. The author guide says "ask the project team".
- The refuters' workaround: a press group with AEM write + publish pastes DAM publish URLs into Downloads rows.
- **Where the files are served from is open (Q-21).** Migrated documents come from the raw AEM publish host,
  whose `robots.txt` is `Disallow: /`. New originals should link the host Q-21 and SKODA-709b choose.

## Scope
- **Editor group:** an AEM Assets group with upload + publish per tree (amends SKODA-101a I4).
- **Folder convention:** `/content/dam/storyboard/{loc}/{type}/{slug}/`.
- **Picker settings:** `aem.asset.mime.renditions` so the DA Assets picker links originals, not renditions; the
  1920px rendition with SKODA-902.
- **Kit ZIPs:** new kit ZIPs are a DAM upload, not a DA upload (amends SKODA-806a).
- **Media Box:** build it the way **D-4** decides (a DAM folder, recommended, or authored rows).
- **Links:** Downloads rows and Media Box items use the document host from Q-21 / 709b once it exists; until then the
  publish URL, recorded as a known gap.
- **Guide:** a "downloads and originals" section in the SKODA-712 guide replaces "ask the project team".

## Not in scope
- A custom Downloads-row plugin (3–5 SP in G-T1-01): a new sub-ticket only if needed.
- A serverless cart ZIP: SKODA-902. Migrated MP4s and PDFs: SKODA-523. The document host itself: SKODA-709b.
- Embargoed launch assets: SKODA-850c.

## Acceptance criteria
- [ ] An HQ and an SK author, without repo access, publish a release with a Media Box, a PDF and an MP4; the cart
      adds them.
- [ ] A kit ZIP above DA's limits is uploaded to the DAM by an author and linked from a press kit.
- [ ] The picker inserts an original (not a rendition) where the Downloads row needs one.
- [ ] The links use the Q-21 host, or the gap is recorded with the date Q-21 lands.
- [ ] The guide section exists; no step says "ask the project team".

## Dependencies
**D-4**, **Q-21**; client AEM admins. SKODA-850 (parent), 101a (I4), 806a, 902, 517, 523, 709b, 712 (guide).
