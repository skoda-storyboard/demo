# Media items (images / videos): architecture options

*Decision note for SKODA-608, 2026-09-27. Status: **direction agreed (option B)**, see the decision log at the end.
PR #177 (phase 1: one page per item) is on hold; the demo pivot waits for a go-ahead.*

## The question

Three surfaces need image and video rows: the `/en/images` and `/en/videos` listings (15 facets, load-more,
deep links), the Images and Videos rails on model pages, and later the Media Room home rails. How do those rows
exist on Edge Delivery **without authors maintaining anything twice**?

PR #177 creates **one EDS page per item** (`/en/images/<slug>`), whose metadata becomes a query-index row. It works
for the demo (101 items live), but as the long-term model it means a page per asset, kept in sync with the asset in
AEM Assets by hand or by a sync job, and it doesn't scale.

## Facts that shape the options

- **Volume on the source:** 33,448 images and 904 videos (Media Room listings, 2026-09-27), plus the article pages.
- **Edge Delivery limits** (aem.live/docs/limits):
  - an index holds at most **50k pages**;
  - a spreadsheet (DA sheet / JSON) holds **100k rows, 500k cells**;
  - a response is at most **6 MB compressed**, so large JSON is read with `limit`/`offset`.
  - A page per item would put about 34k media rows plus the articles into `/en/query-index.json`, close to or over
    50k. A feed with about 25 columns fits about 20k rows per sheet, so it needs splitting (e.g. by year or type).
- **No block change is needed to read a different source.** `listing` and `story-rail` already take an `index`
  config row pointing at any JSON in the query-index shape (`{total, offset, limit, data}` or an array);
  `scripts/query-index.js` pages through it with `offset`.
- **The source's attachment pages add little.** Their `og:image` is broken, the canonical points at the file, and
  many return 404. The real experience is the listing card and its lightbox.
- **Assets today:** a live AEM Assets as a Cloud Service instance, **no Dynamic Media licence** (SKODA-507).
  Authoring images go through the native picker and the Media Bus. The DAM ingest and mapping (SKODA-504) are in
  progress. How a public, resizable delivery URL is produced for an asset *outside a page* is open (D5).
- **Images inside a sheet are not ingested by the Media Bus** (only images in page content are). A feed therefore
  needs thumbnail URLs that are public and ideally resizable.

## Options

| | A. Page per item (PR #177) | B. Generated feed from AEM Assets (recommended) | C. Live search against AEM Assets |
|---|---|---|---|
| **Source of truth** | EDS page + asset (two copies) | AEM Assets only | AEM Assets only |
| **Author work** | Create or keep a page per asset (or a sync job writes pages) | Upload + tag the asset in AEM Assets | Upload + tag the asset |
| **How rows reach EDS** | Page metadata → `/en/query-index.json` | A sync job writes `/en/media-feed` (DA sheet, shards by year/type) and publishes it | The browser queries an Assets search API at runtime |
| **Block changes** | None | None (add an `index` row to the listing + rail configs) | New data source in `listing` + `story-rail`, auth, CORS |
| **Scale** | Index 50k cap; ~34k extra pages to preview/publish | ~20k rows per sheet shard; one publish per sync | Unlimited, but every page view depends on the API |
| **Performance** | Static, cached | Static, cached | Runtime API call per view; worse LCP |
| **Thumbnails** | Media Bus ingests them (page images) | Need public delivery URLs (DAM renditions, or DM OpenAPI later) | Same as B |
| **Detail view** | The item page | The lightbox (SKODA-406); optional deep link `?item=<id>` | Lightbox |
| **SEO per item** | Yes (low value on the source) | No | No |
| **Effort** | Done (demo) | ~1–1.5 SP to pivot the demo; M2 sync job ~3–5 SP | High; needs an API decision |

## Recommendation

**Option B.** AEM Assets is the only place an asset and its tags live; a generated, static feed carries the rows to
Edge Delivery. It keeps the blocks unchanged, scales with shards, and matches how the cart (SKODA-505a, keyed by
asset id / DAM path) and the lightbox (SKODA-406) already want to work.

**Path:**
1. **M1 demo:** the generator from #177 writes **one feed sheet** (`/en/media-feed.json`) with the same row shape,
   still sourced from the source listing (AEM Assets isn't populated yet). The listing and rail configs get
   `index: /en/media-feed.json`. The 101 item pages are unpublished and deleted, and the five index columns added
   in #177 are reverted. Cards link to the lightbox once SKODA-406 lands; until then to the image itself.
   Thumbnails come from the source CDN `-768x512` renditions for the demo.
2. **M2:** a sync job (App Builder action or GitHub Action, on AEM Assets events or a schedule) reads published
   Media Room assets and their tags, and writes the same feed shape, sharded by year/type. Nothing downstream
   changes.

## Open questions for the client

1. **Which assets are "Media Room" public?** A folder, a tag, or a publish status in AEM Assets?
2. **Taxonomy:** are the 15 facets (model, view, years, …) AEM tags on the assets today, or do they need a mapping?
3. **Delivery URL for thumbnails and downloads outside pages:** AEM publish renditions, a CDN in front of the
   DAM, or Dynamic Media with OpenAPI (licence)? This also decides the cart's "download original" (SKODA-505).
4. **Sync trigger and owner:** AEM Assets events (near real time) or a scheduled job; where it runs and who
   operates it.
5. **Per-item SEO pages:** needed at all? (The source's attachment pages are thin.)

## What changes in the backlog

- **SKODA-608:** phase 1 becomes "feed, not pages"; contract `media-item` becomes a feed-row contract (the same
  columns, no page body).
- **New M2 ticket:** the AEM Assets → media feed sync job (depends on SKODA-504 and the answers above).
- **SKODA-406 / SKODA-402a:** unchanged (they read rows, wherever the rows come from). SKODA-406's card links to the
  lightbox, not an item page.
- **SKODA-505a:** the cart keys off the feed's asset id / DAM path.

## Decision log (2026-09-27)

Answers to the open questions (project lead):

| # | Question | Answer | Consequence |
|---|---|---|---|
| 1 | Which assets are public? | The **publish status** of the asset in AEM Assets | The sync reads published assets only; unpublishing an asset removes its row on the next sync. |
| 2 | Are the 15 facets AEM tags today? | **No**, not on AEM yet | A taxonomy workstream: create the facet tag namespaces in AEM and tag assets during the DAM ingest (SKODA-504), mapped from the source terms (the M1 generator already maps them by name). Until then the feed carries source taxonomy. |
| 3 | Delivery URL outside pages | The **AEM native CDN**; published AEM assets are also on the EDS Media Bus, so thumbnails work natively | Feed `image` = the asset's published delivery URL. **Verify** the URL pattern accepts resizing: the cards' `createOptimizedPicture` keeps the origin and replaces the query with Media Bus params (`?width=…&format=webply&optimize=medium`). That's correct for Media Bus URLs; any other host must accept those params or the shared card-image helper needs a small adapter. |
| 4 | Sync trigger and owner | **After the demo** | The M2 sync ticket stays open on trigger (AEM events vs schedule) and ownership. |
| 5 | Per-item SEO pages | **No** | No item pages. The detail view is the lightbox (SKODA-406); the source attachment pages are thin (broken `og:image`, canonical to the file, many 404). |

**Decided: option B.** AEM Assets (published assets) is the source of truth, and a generated media feed carries the
rows to Edge Delivery. Pages per item are retired.

**Demo (M1) specifics:** AEM Assets isn't populated or tagged yet, so the demo feed is generated from the source
listing (the #177 generator, writing one sheet instead of 101 pages). Its thumbnails are the source CDN `-768x512`
renditions: they aren't resized by the Media Bus params, but they are small enough for cards.

**Follow-up tickets:**
- **M2:** AEM Assets → media feed sync job (published assets, sharded feed, trigger/owner TBD).
- **M2:** Media taxonomy in AEM Assets: the 15 facet namespaces and the source-term mapping, applied at ingest
  (with SKODA-504).
- **SKODA-406:** verify card images against AEM delivery URLs (the `createOptimizedPicture` params).
