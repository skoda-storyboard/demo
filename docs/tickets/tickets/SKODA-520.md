# SKODA-520, Source CDN cutover: no page, fragment, feed or code path depends on skoda-storyboard.com files

- **Epic:** E05, Media Pipeline
- **Type:** migration / media delivery
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Priority: P1, start now** (decision 2026-10-16: get rid
  of the source CDN as soon as possible).
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d, excluding the DAM ingest runtime *(planning estimate, not a quote)*
- **GitHub issue:** [#378](https://github.com/skoda-storyboard/demo/issues/378) (created 2026-10-16)
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Census done. Design in
  [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3B and §6.

## Why
Census of 2026-10-16:
- **Scope:** DA source and delivered `.plain.html` of the 408 indexed `/en` pages plus 22 fragments, and the media feed.
- **Matching:** each reference is matched to the media manifest by its source key (the master, with `-WxH` /
  `-scaled` stripped).

| Where | Source-host references | Master already published on AEM Assets | Recorded, not published | Not in the manifest |
|---|---:|---:|---:|---:|
| Page images (DA `img src` / `srcset`) | 8,179 | 5,222 | 1,292 | 1,665 |
| Page links (DA `a href`: `/direct-download/`, cdn) | 7,369 | 4,581 | 1,234 | 1,554 |
| Fragment images (Media Bus carrier docs) | 2,285 | 1,966 | 3 | 316 |
| Feed `path` / `original` / `rendition-1920` / `mp4` | 2,284 / 317 / 1,993 / 162 | 1,967 / 0 / 1,680 / 0 | 2 / 2 / 0 / 25 | 315 / 315 / 313 / 137 |

- **Delivered pages:** images already come from the Media Bus. But **6,886 `/direct-download/` and 483 cdn links** are
  live, so a click or download still goes to the source.
- **DA source:** every image is still a source URL. The editor shows broken images once the host is gone, and a
  re-preview has to fetch them again.
- **Pages:** 178 of the 408 pages reference only masters that are already published, so they can be rewritten now.
- **Backlog:** 2,148 distinct masters behind pages and fragments are not yet published on AEM Assets (phases 2
  and 3 together).
- **Code:** `scripts/media-card.js` `downloadHref()` sends cdn links through the source's `/direct-download/` route.
  The feed's `rendition-1920` is the source's 1920 file.
- Not in scope: the 2,750 links to source **pages** (not yet migrated pages; the SKODA-605 allow-list). Fonts are
  already self-hosted.

## Scope
Phased so each phase removes references on its own:

1. **Now (masters already published):**
   - rewrite DA `img src` / `srcset` and asset `a href` to the AEM publish URL of the original, for the 178 fully
     covered pages, then the covered references on the other pages;
   - point the carrier fragments at the original, so the Media Bus has full pixels for `?width=1920` (SKODA-513);
   - rebuild the feed: `path`, `original` and the 1920 download from DAM / Media Bus, not the source;
   - push + preview through `import:push` (conflict review, no overwrite of author edits). Page publish is a
     separate approval.
2. **Publish what is recorded:**
   - the 90 `dam:done` rows with no publish step and the 5 `pub:pending` rows;
   - the 582 delivery-only rows (upload, then publish);
   - the 25 recorded MP4s;
   - #219 (WebP publish 404) for the WebP masters.

   Runs on a developer machine with the DAM token.
3. **Ingest what isn't recorded:**
   - record the unrecorded masters (the "not in the manifest" column) and 137 MP4s with `media:build`, then upload
     and publish (SKODA-504a rules, on the SKODA-518 ledger);
   - the 28 `dam:error` rows are retried or reported.
4. **Code:**
   - remove `downloadHref()`'s `/direct-download/` rewrite once the feed has no cdn files;
   - the 1920 download becomes a Media Bus URL (`?width=1920&format=jpg`, as `downloads` already builds);
   - the `rendition-1920` column retires.
5. **Gates:**
   - commit the census as `npm run media:source-census` (read-only, non-zero exit on any source asset reference);
   - `import:push` refuses to write a DA page that still has a source asset URL once the page's phase is done;
   - a final check renders sampled pages, listings, rails, lightbox and cart with `*.skoda-storyboard.com` blocked in
     the browser context.

Oversized masters (350 rows `preconditioned`, the SKODA-506 rule): the Media Bus input must stay ≤10 MiB.
- The DA `src` points at a DAM-hosted rendition from an AEM Assets **processing profile** (e.g. a 3840 px JPEG; no
  Dynamic Media needed), not at a source ladder file.
- **To verify:** anonymous delivery of that rendition path on publish.

## Acceptance criteria
- [ ] `media:source-census` reports **0** source asset references in DA source and delivered HTML of every indexed
      page and fragment, and in every column of `/en/media-feed.json`.
- [ ] With `*.skoda-storyboard.com` blocked, sampled pages (one per template), `/en/images`, `/en/videos`, a
      model-page rail, a story lightbox, a Media Box and a cart ZIP all work. Request counts are recorded (no
      screenshots).
- [ ] Delivered images keep their dimensions and stay within the SKODA-506 byte gate. The 1920 download returns
      1920 px where the master has them.
- [ ] No author edit in DA is overwritten (push conflict report attached per batch).

## Dependencies
SKODA-504 ✅, 503 ✅, 506 ✅, #219, SKODA-518 (for phase 3 at scale), SKODA-504a (rights / approval for unrecorded
masters). Unblocks SKODA-519 (legacy cart keys disappear) and most of SKODA-513.
