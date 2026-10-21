# SKODA-523a, MP4 library: per-file list, sizing, batch plan and delivery of files over 1 GB

- **Epic:** E05, Media Pipeline
- **Type:** migration / media (census tooling, ingest planning). Amends SKODA-520, 504a, 204.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). The batch plan must exist before the bulk ingest (517–520).
- **Estimate:** 4 SP · AI-assisted 2d / manual 4–5d, excluding the MP4 transfer runtime and the Q-18 decision
  *(planning estimate, not a quote)*. The finding sizes MP4 ingest and ops at +3–5 SP; an in-use-only Q-18 brings this
  to about 3 SP.
- **GitHub issue:** to create
- Parent: SKODA-523 ([#425](https://github.com/skoda-storyboard/demo/issues/425))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-D-01 (High, CONFIRMED), with G-T1-01
  and G-T8-01 (High, CONFIRMED) for the delivery host.

## Why
- **SKODA-204 says** "no self-hosted media … zero video-migration workstream". WordPress holds 2,602 `video/mp4` +
  61 `video/quicktime` attachments.
- **The REST sample:** the 1,724 records REST exposes (en 658, cs 568, de 224, sk 177, sr 95, sl 2) resolve to
  **867 distinct files, 406 GB**: median 207 MB, 138 files over 1 GB, max 4.5 GB, 52 h. At the same ratio all 2,663
  records are ≈ 1,340 files, ≈ 0.6 TB (an extrapolation).
- **Where they appear:** the download originals beside the Vimeo players on press releases (32/100 recent EN, 25/100
  CS, 25/100 SK) and inline clips, served through `/direct-download/` signed S3.
- **What is planned:** SKODA-520 plans only the 162 MP4s in the EN feed. aem.live caps MP4 at 36 MB, and 71 of the
  91 MP4 rows in the manifest are larger (G-T1-01), so they can't go through DA.
- **Delivery host:** migrated originals get `public_url` on the raw AEM publish host, whose `robots.txt` is
  `Disallow: /` and which sends files as attachments with `max-age=600` (G-T8-01, Q-21).

## Scope
- **Per-file list** from REST and the media manifest: record, locale, MIME, bytes, duration where known, and the pages
  that link it. Distinct files are keyed on the file path, not the attachment record.
- **Sizing:** total volume, upload time and a batch plan on the SKODA-518 ledger; PDF/MP4 stay serial (504a).
- **Files over 1 GB:** HEAD the largest file (4.5 GB) on the DAM publish tier before the bulk run, and record how
  Q-18 says these files are delivered.
- **Scope cut per Q-18:** in-use-only (files that a migrated page or PDF links) or the library; the list marks both.
- **Delivery base:** manifest rows take the base URL from Q-21 / SKODA-709b, not the raw publish host.
- **Docs:** correct 204's de-risking note; record the volume in D7.

## Not in scope
- The Q-18 decision itself (SKODA-523, C1). The transfer runtime.
- Rewriting MP4 references in pages per locale and the gate: SKODA-523b.
- Author uploads of MP4s after go-live: SKODA-850.

## Acceptance criteria
- [ ] The per-file list is attached with bytes, locale and linking pages; its total matches REST `X-WP-Total` for
      `video/mp4` and `video/quicktime`, with each record that has no file listed.
- [ ] The batch plan on the 518 ledger has a runtime and a start date before the freeze (SKODA-710).
- [ ] The 4.5 GB file answers 200 with its full `content-length` from the DAM publish tier.
- [ ] No new manifest row carries a `*.adobeaemcloud.com` `public_url` once Q-21 is answered.
- [ ] SKODA-204's note is corrected.

## Dependencies
**Q-18**, Q-21, D5, D7; SKODA-520, 504a, 518, 503, 204, 709b. Parent: SKODA-523.
