# SKODA-517, Media feed shaped for scale: rail slices, listing head, facet index, keyed shards

- **Epic:** E05, Media Pipeline
- **Type:** data contract / shared loader
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 3 SP · AI-assisted 1.5–2d / manual 3–4d *(planning estimate, not a quote)*
- **GitHub issue:** [#375](https://github.com/skoda-storyboard/demo/issues/375) (created 2026-10-16)
- **Status (2026-10-19):** 🟡 Part 1 (the shared loader and its readers) built on branch `skoda-517-feed-loader`.
  Part 2 (the generator and the published shards) starts after #380 merges: #380 edits the same generator files.
  See "Part 1 (2026-10-19)". Proposed in
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

## Part 1 (2026-10-19): the shared loader and its readers
Split by the PO (2026-10-19): the reader side now, the generator after #380 merges.

**Built**
- `scripts/media-feed.js`: the registry contract (`docs/planning/SKODA-PENDING-BLOCK-CONTRACTS.md`, `media-item`,
  "Sharding"), its validation, and one reader per use:
  - `openListingFeed`: the head shard for the first paint, then the facet index; each shown page is filled in from
    its detail shards;
  - `loadRailRows`: the slices of the rail's smallest facet that has slices;
  - `findRowsByFile`: the keyed shards of the asked files;
  - `loadAllRows`: every detail shard.
- Wired, config contracts unchanged:
  - `listing`: first paint from the head; Load more pressed before the rows arrive runs once they do; the latest
    render wins;
  - `story-rail`: `loadRailRows`;
  - `wireImageLinks` (model drawings, press-kit image links): `findRowsByFile`;
  - the `scripts.js` listing prefetch: the head shard, or the rows when there is no head.
- **No registry, or any non-media index: today's whole-feed read.** One extra request (the registry, 404) until
  part 2 publishes one.
- **A half-published build never empties a listing** (code review, 2026-10-21):
  - a head shard that fails: the listing waits for the rows;
  - a facet index that fails: full rows (the detail shards, else the whole feed);
  - a detail shard that fails or lacks a row: the whole feed;
  - if that fails too: the shown cards stay, with the load error, and nothing keeps spinning.
- Also from the code review:
  - a filter's veil stays until its page has its detail shard;
  - the full rows landing after the head paint don't rebuild an unchanged grid (keyboard focus stays);
  - a path-scoped listing never paints the template-wide head;
  - a rail with an `order` list reads every row (`order` ignores facets).
- Tests: `scripts/media-feed.test.mjs` (13: contract, malformed registries, both paths, failures and fallbacks)
  and five listing tests of the sharded path (head paint, failed head, kept focus, failed shard, veil).

**Measured** (local dev server, 1280 × 900 unless noted, the published feed, 2,475 rows). The "shards" run used a
local test split of today's feed (not committed; the generator is part 2). Same = same cards, count, Load more
count, facet options and lightbox as the whole-feed build.

| Page | Whole feed | Shards (raw bytes) | Result |
|---|---|---|---|
| `/en/images` | 3,442,255 B, LCP 1012 ms | 1,012,631 B (registry 26 KB, head 70 KB, facet index 917 KB), LCP 488 ms | same |
| `/en/images` at 375 | LCP 596 ms | LCP 444 ms | same |
| `/en/videos` | 3,442,255 B, LCP 1400 ms | 1,005,716 B, LCP 1060 ms | same |
| `/en/images?filter[model][]=fabia` | 3,442,255 B | 3,035,356 B (+ detail 2026, 2022) | same |
| `/en/images?offset=72` | 3,442,255 B | 2,944,702 B (+ detail 2026) | same |
| `/en/images?sortby=oldest` | 3,442,255 B | 1,085,373 B (+ detail 2017) | same |
| Scala model page, image + video rails (#380 content) | 3,442,255 B | 80,392 B (registry + `model:scala` slice) | same 20 + 12 cards |
| Image links (asset, image, a file not in the feed) | 3,442,255 B | 185,228 B (registry + 3 keyed shards) | same captions |
| No registry (`/en/images`, `/en/videos`) | 3,442,255 B | + one 404 (registry) | same |

**For part 2 (the generator)**
- Split the `detail` shards by size as well as by year: today 2026 holds most rows, so `image:2026` is 1.9 MB raw.
- Trim the facet index (917 KB raw): `tags` and `category` are only needed when a listing filters on them.
- A filtered deep link also loads the head, unused (70 KB raw).
- Still open: the Fabia and Enyaq network bytes on a branch preview, the mobile LCP of `/en/images` by PSI, and
  every sheet under 500k cells. All need the published shards.
