# SKODA-517, Media feed shaped for scale: rail slices, listing head, facet index, keyed shards

- **Epic:** E05, Media Pipeline
- **Type:** data contract / shared loader
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 3 SP · AI-assisted 1.5–2d / manual 3–4d *(planning estimate, not a quote)*
- **GitHub issue:** not created yet
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Proposed in
  [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3C.

## Why
- Every reader downloads the whole `/en/media-feed.json`: 2,475 rows, 3.44 MB raw / 294 KB gzip (measured 2026-10-16).
  - `listing` waits for it before its first paint (SKODA-702).
  - Each model-page `story-rail` loads it to show 20 cards.
  - `wireImageLinks` loads it to title one image.
- At ~30k rows it is ~3.6 MB gzip.
- At 40 columns one sheet holds at most ~12,500 rows (500k cells).
- `loadQueryIndex` pages serially through every chunk, so splitting the sheet alone doesn't help.

## Scope
- **Shapes**, all in the shape-3 `media-item` row format (or a documented subset):
  - **facet slices** by primary facet (`/en/media-feed/model-<slug>.json`, …) for rails;
  - a **head shard** per type with the newest rows, for a listing's default view;
  - a **facet index** with id, type, date and facet codes only, plus **detail shards** by year and type;
  - **keyed shards**: hash of the file key → 1 of 64, for lightbox and cart lookups;
  - a **registry** `/en/media-feed/index.json` with shard names, row counts and a build id.
- **Shared loader** in `scripts/` that picks the shard from the block's `index` config and the registry:
  - `listing`, `story-rail` and `media-lightbox.js` keep their config contract;
  - without a registry it falls back to today's whole-feed read.
- **Generator:** `build-media-items.mjs` writes the shapes from today's source, so this ships before SKODA-511.
  511 then writes the same shapes from AEM Assets.
- Carrier documents for Media Bus thumbnails stay as they are (≤150 images each).

## Acceptance criteria
- [ ] A model page with media rails downloads only its slice(s): no request for the whole feed. Network bytes are
      recorded before and after for Fabia and Enyaq.
- [ ] `/en/images` and `/en/videos` render their first page from the head shard. The facet index loads after first
      paint. Facet counts and load-more match the whole-feed build (same rows, same order).
- [ ] A story-page image link resolves its title from one keyed shard.
- [ ] Without a registry, every reader behaves as today. Unit tests cover both paths.
- [ ] Rows validate against contract `media-item` shape 3. Every sheet stays under 500k cells.
- [ ] Mobile LCP of `/en/images` measured before and after (PSI or Lighthouse, same conditions).

## Dependencies
SKODA-608 (feed contract), SKODA-406 (card), SKODA-702 (listing LCP). Feeds SKODA-511, 513, 516, 519.
