# Asset ingestion at M2 scale: how the mapping is exposed, where it breaks, what to change

*Review note, 2026-10-16. Status: **proposal, direction decided** (§0). The target design below is not built.
Tickets: SKODA-504a, 511, 513 (updated), 517, 518, 519, 520 (new).*

## 0. Decisions (2026-10-16)

| Topic | Decision | Consequence |
|---|---|---|
| Rendition scheme (D5) | **Media Bus** for every display size and the 1920 download. No Dynamic Media | AEM Assets holds the originals. Masters over 10 MiB get one DAM rendition from a processing profile as Media Bus input (§3B) |
| Sync job runtime (D14 / SKODA-511) | **App Builder** (Adobe I/O Runtime), event-driven, with a scheduled reconcile (§3F) | Needs the App Builder entitlement and a Developer Console project with OAuth server-to-server on the client org |
| Source CDN | **Remove it as soon as possible**, before the rest of M2 | New P1 ticket SKODA-520, phased from the census in §6. It now leads the order of work (§4) |

## Summary

The M1 asset pipeline works for the volume we have now: 3,609 manifest rows and 2,475 feed rows. It will not reach the M2
volume (~28,300 logical images in use, ~34,400 library items, ~34 GB of masters) without changes, for two reasons:

1. **The browser loads whole files.** The media feed and the cart index are single JSON files, and every consumer
   downloads all of it, even to show 20 cards or one title.
2. **Page content still points at the source CDN.** DA stores `cdn.skoda-storyboard.com` image URLs. Only the
   delivered HTML is on the Media Bus. When the source site retires, the editor shows broken images, and a re-preview
   has to fetch from a host that no longer answers. Delivered pages also still link 7,369 source files
   (`/direct-download/` and cdn) for open and download (census, §6).

The proposal: make AEM Assets the system of record for identity, put DAM URLs into DA source, split the feed by how it
is read, retire the code-bus cart index, and turn the manifest into a sharded ledger.

## 1. How the mapping is exposed today

| Surface | What it carries | Size (measured 2026-10-16) | Consumers |
|---|---|---|---|
| Build manifest `tools/importer/media/media-manifest.json` | source URL → DAM path → delivery URL, `seen_urls`, per-step status, public proof | 3,609 rows, 7.0 MB, one JSON object in git | Every media tool parses the whole file (build, apply, cart index, push gate, audit, validate, publish) |
| DA page source | The `<img src>` written by `media:apply` (`delivery_url`) | Elroq: 9 of 9 `src` on `cdn.skoda-storyboard.com`. Local import store: 8,683 source-CDN references vs 439 DAM links in 358 pages | The Media Bus ingests the URL at preview; the delivered page shows `media_<hash>` |
| Media feed `/en/media-feed.json` (DA sheet) | 40 columns per row: Media Bus `image`, `original` (DAM or source), `rendition-1920` (source), facets | 2,475 rows (2,280 image, 191 video, 4 asset). 3.44 MB raw, 294 KB gzip. `max-age=7200` | `listing` (Images, Videos), every `story-rail` on media rails, `media-lightbox.js` (story-page image links) |
| Cart index `scripts/media-cart-index.json` | source key → DAM path, bytes, MIME | 2,741 assets, 2,671 keys. 477 KB raw, 102 KB gzip. Code bus, `max-age=7200` | `media-cart-resolver.js`, loaded on the first cart action |
| `content/media-index.json` | `logical_id → original_download_url` | Empty since M1 (`--da-archive` not used) | None |

Feed `original` host split: 1,967 AEM publish, 317 source CDN, 191 empty (videos). `rendition-1920` is source CDN on
every row that has one (SKODA-513).

How each consumer reads the feed:

- `listing` calls `loadQueryIndex(cfg.index)` before its first paint. The listing's LCP waits for the whole feed
  (SKODA-702).
- `story-rail` loads the whole feed, filters with AND across facet rows, then shows `limit` rows (20 on model pages).
- `wireImageLinks` (story pages) loads the whole feed on the first image-link click to title one image by file name.
- `loadQueryIndex` pages serially through `offset`/`limit`. A sharded feed read through it still downloads every shard.

## 2. Where it breaks at M2 scale

The projections scale the per-row sizes measured today. They are not load tests.

| Constraint | Today | At ~30k rows | Limit / effect |
|---|---|---|---|
| Feed size (raw / gzip) | 3.4 MB / 294 KB | ~42 MB / ~3.6 MB | 6 MB compressed per response (aem.live limits). Mobile parse time and memory are the practical limit well before that |
| Feed cells (40 cols) | 99k | 1.2M | 500k cells per sheet, so **~12,500 rows** maximum in one sheet |
| Rail cost | 294 KB for 20 cards | ~3.6 MB for 20 cards | Each model page pays the full feed |
| Listing first paint | Waits on the 294 KB feed | Waits on ~3.6 MB | LCP regression on `/en/images`, `/en/videos` |
| Freshness | Rows change only when the generator runs; 2 h browser cache | Same | Publishing an asset in AEM Assets doesn't show up without the SKODA-511 job |
| Cart index | 102 KB gzip, code bus | ~1.1 MB gzip | A newly published DAM file isn't downloadable until the index is regenerated and a **code PR merges** |
| Manifest | 7 MB, rewritten in full after **every row** (`flush()` in `build-media-manifest.mjs`) | ~58 MB per write, n rows × whole file, so the cost grows with the square of the row count | 92 commits since 2026-09-01, 25 of them merges ("manifests merged row by row"). Past duplicate-key and last-wins `seen_urls` hijacks. Not in `.hlxignore`: the code bus rejects it (HTTP 413) |
| Source CDN | 8,683 references in DA source | All migrated pages | Editor images break and re-preview can't fetch once the source retires. **Unverified:** whether the Media Bus keeps serving an already-ingested hash across a re-preview |
| WebP originals | 82 uploaded, 4 activated, all 404 on publish (#219) | Every WebP master | Blocks DAM delivery for that format until #219 is fixed |

## 3. Target design

### A. AEM Assets is the record of identity (SKODA-518, 504a)

- Each upload already writes `skoda:sourceUrl` and `skoda:sourcePage` (`setDamMetadata`). Add:
  - `skoda:sha256` of the original: the dedup key 504a needs across posts, releases and kits;
  - `skoda:logicalId`.
- "Is this source file in the DAM, and where?" becomes a QueryBuilder query on **author** (publish blocks
  QueryBuilder) on `jcr:content/metadata/skoda:sourceUrl` or `skoda:sha256`.
- The manifest becomes a **derived ledger** that can be rebuilt from the DAM:
  - JSONL, sharded by a hash of `logical_id` (e.g. 64 files under `tools/importer/media/manifest/`). A merge then
    touches only the shards a branch changed, and a duplicate key is a test failure, not a silent last-wins;
  - an append-only journal during a run, compacted into the shards at the end. No whole-file rewrite per row;
  - one shared loader (`media-lib.mjs`), so the 9 tools keep their current API;
  - excluded from the code bus in `.hlxignore`;
  - a `reconcile` command that diffs the ledger against the author DAM and reports drift.

### B. DA source carries DAM delivery URLs (504a)

- `media:apply` writes the **AEM publish URL** of the original into the DA `<img src>` once the row's
  `steps.publish` is `done` with public proof. Today it writes the source-CDN master. The Media Bus still ingests and
  optimizes it, so delivered HTML doesn't change.
- Oversized masters (SKODA-506; 350 rows are `preconditioned` today) can't be Media Bus input. Their DA `src` is a
  DAM rendition from an AEM Assets **processing profile** (e.g. a 3840 px JPEG, ≤10 MiB; no Dynamic Media). Never a
  source-CDN ladder file. **To verify:** anonymous delivery of the rendition path on publish.
- **One Media Bus input per image, the full-size one.** The card thumbnail, the 1920 lightbox preview and the 1920
  download all derive from it (`?width=…`). The feed's carrier fragments therefore ingest the original, not the
  source's `-WxH` thumbnail. That is also the SKODA-513 fix: today the carrier input is 768 px wide, so
  `?width=1920` can't add pixels.
- This should match what the DA Assets picker (#62) inserts, so that migrated and newly authored images have one shape.
  **To verify** on one picker-authored page before the bulk rewrite.
- Acceptance stays 504a's: 0 source-CDN references in DA source. A sweep counts them per page.

### C. The feed is split by how it is read (SKODA-517; 511 writes it)

| Reader | Today | Proposed shape | Approx. size at 30k |
|---|---|---|---|
| Rails (model pages, MR home) | Whole feed | **Facet slices** by primary facet, e.g. `/en/media-feed/model-fabia.json`. The rail filters the remaining rows client-side | Fabia: 395 images, ~47 KB gzip |
| Listing first paint | Whole feed | **Head shard**: newest N rows per type (`/en/media-feed/head-images.json`), enough for the default unfiltered view | ~5 KB gzip |
| Listing facets / load more | Whole feed | **Facet index**: id, type, date, facet codes only, loaded after first paint, plus **detail shards** by year and type, fetched for the visible page | ~250–400 KB gzip index (estimate) |
| Lightbox by file / cart by key | Whole feed / cart index | **Keyed shards**: hash of the file key → 1 of 64 sheets | ~470 rows per shard, ~15 KB gzip |
| Shard registry | – | `/en/media-feed/index.json` lists shard names, row counts and a build id | <2 KB |

- Blocks keep their `index:` config contract. The change sits in the shared loader:
  - the loader resolves which shard to read from the block's config and the registry;
  - it falls back to today's whole-feed read when no registry exists, so M1 content keeps working.
- The SKODA-516 facet gaps are fixed at the source of the slices: the job derives the facets, and the rails don't
  change semantics.
- If D14 later allows a hosted search service, it can replace the facet index. The slices and keyed shards stay.

### D. The cart resolves from DAM URLs (SKODA-519)

- After B and C, page links and feed rows carry DAM URLs. The resolver's existing `damPath()` branch resolves them.
- If feed rows carry `bytes` and `mime`, a feed add needs neither the index nor a HEAD request.
- The index is then needed only for **legacy** source-CDN keys (links not yet rewritten). It moves to the keyed
  content shards from C, written by the sync job. `scripts/media-cart-index.json` is deleted after cutover, so a DAM
  publish no longer needs a code deploy.

### E. Ingest operations at scale (504a, 518)

- Dedup by `sha256` **before** upload. An unmatched-item report is a client deliverable.
- Batches run from the journal (resumable, idempotent). Images upload in parallel; binaries stay serial
  (SKODA-503 rules).
- Bulk runs skip the per-page post-import `media:build` hook, the source of the rerun traps; one `media:apply` pass
  per batch runs instead.
- Every batch ends with a dry-run of `apply` and reads its "blocked" lines.
- #219 (WebP publish 404) is a prerequisite for WebP masters.

### F. Sync job (SKODA-511), on App Builder

**Fit.** App Builder runs the job without edge functions; it is serverless compute, not CDN compute.
- **Events:** AEM Assets author events can trigger a Runtime action directly: `aem.assets.asset.published`,
  `.unpublished`, `.deleted` and `.metadata_updated`.
- **Runtime limits** (Adobe I/O Runtime system settings, read 2026-10-16):
  - web / blocking actions 60 s, non-blocking 3 h;
  - 1 MB for a request payload and for an action result;
  - 100 concurrent activations per namespace;
  - 600 trigger firings per minute.

**Design.**
1. **Event action** (small, fast). Event payloads carry the `assetId` **and** the DAM path
   (`data.repositoryMetadata["repo:path"]`). The action records both and the event type in App Builder State as a
   dirty set, and returns.
2. **Sweep action**, every 15 minutes, non-blocking:
   - takes the dirty set, plus every asset whose `jcr:lastModified` or `cq:lastReplicated` is after the stored
     watermark (author QueryBuilder). The watermark part is what catches Touch UI edits and publishes, which send no
     `metadata_updated` (see 3);
   - rebuilds only the SKODA-517 shards those assets touch (their facet slices, year/type detail shard, keyed shard,
     head shard, facet index);
   - writes them to DA, previews and publishes them;
   - publishes the registry last.

   A bulk 504a publish of thousands of assets then becomes a few batched runs rather than thousands of concurrent
   activations.
3. **Nightly reconcile:** a full rebuild from author QueryBuilder, swapped in atomically.
   - It is **required**, not optional. `metadata_updated` **and `deleted`** fire only for Assets View and Assets
     OpenAPI actions, not for the Touch UI or other AEM APIs (including the `/api/assets` call the importer uses).
     Touch UI moves and deletes send no `unpublished` either. Removals made there reach the feed only through the
     reconcile, which drops rows for assets that are gone or unpublished.
   - AEM events have no SLA: delivery is at least once, unordered, may duplicate, and is retried on 429/5xx for 24 h
     only. Events shorten the delay; the sweep and the reconcile are what make the feed correct.
   - Shards and their contents go to DA directly. Nothing passes through the 1 MB result limit.

**Credentials** (detail in [`SKODA-APP-BUILDER-INTEGRATION.md`](SKODA-APP-BUILDER-INTEGRATION.md)):
- **Events:** the workspace's OAuth server-to-server credential, subscribed by an admin of an AEM product profile.
- **AEM author (QueryBuilder):** AEM **service credentials** (JWT technical account from the AEM Developer
  Console), read on `/content/dam/storyboard`. Classic endpoints don't take S2S tokens. The Assets OpenAPI would, but
  its search is experimental and our custom metadata there is unverified.
- **admin.hlx.page:** a site admin API key with the `publish` role.
- **DA:** **to verify** whether `admin.da.live` accepts an S2S token and which `permissions` entry grants it; the
  docs show only user IMS tokens.
- No tokens in the repo; the App Builder project holds the secrets.

**Same as before:**
- **Source:** author QueryBuilder over published assets under `/content/dam/storyboard` (the reconcile, and id
  resolution).
- **Output:** the shapes in C, written to DA, then previewed and published.
- **Atomic:**
  - write new shards under the build id;
  - publish the registry last;
  - a failed run leaves the previous registry live (511's "no partial feed" criterion).
- **Runtime:** App Builder, as above. A scheduled GitHub Action running the same reconcile is the fallback if the
  entitlement is late.
- **Freshness:** the registry is the only file that must revalidate. Check whether a config-service custom header can
  shorten its `max-age`.

## 4. Order of work

Source CDN removal leads (decision 2026-10-16).

1. **520 phase 1, now:**
   - rewrite DA source and the feed for masters that are already published: 5,222 page images, 4,581 page links,
     1,966 carrier images; 178 pages need nothing else;
   - drop the `/direct-download/` rewrite for those files.

   No client dependency; DA push needs its usual approval.
2. **520 phase 2 + #219:** publish the recorded-but-unpublished originals (developer machine, DAM token).
3. **518** (ledger + DAM provenance) in parallel. It is needed before phase 3 runs at scale.
4. **520 phase 3 with 504a:** ingest unrecorded masters (dedup, rights filter). Then the census gate goes to 0.
5. **517** (feed shapes + loader), against the generator's output.
6. **511** on App Builder writes 517's shapes from AEM Assets. Once entitled, it replaces the source-listing
   generator.
7. **519:** with no source links left, the cart index retires.
8. **513** closes with 520's carrier change and 517's shards.

## 5. Decisions and checks needed

| Item | Owner | Blocks |
|---|---|---|
| D5 rights / approval rule (rendition scheme decided: Media Bus) | Client | 504a scope for unrecorded masters |
| App Builder entitlement, Developer Console project, technical account with AEM author + DA + admin access | Client | 511 on App Builder |
| Processing-profile rendition for >10 MiB masters, and its anonymous delivery on publish | Team + client AEM admin | 520 for 350 oversized masters |
| Source CDN retirement date | Client | Hard deadline for 520 (we start now regardless) |
| DA Assets picker: what URL it writes into DA source | Team (check) | B matches newly authored content |
| Media Bus behaviour on re-preview of an ingested URL whose host is gone | Team (check) | Severity of the CDN risk before B lands |
| Load test: `/en/images` and a model page at 10k / 30k synthetic rows, mobile | Team | Confirms the projections in §2 |

## 6. Source-host census (2026-10-16)

- **Scope:** DA source and delivered `.plain.html` for the 408 indexed `/en` pages, 22 fragments and the media feed.
- **Matching:** each reference is matched to the manifest by its master key. "Published" means `steps.publish: done`
  with public proof.
- **Script:** `.migration/m2-assets/census.mjs` (to be committed as `media:source-census` in SKODA-520).

| Where | References | Master published | Recorded, not published | Not in the manifest |
|---|---:|---:|---:|---:|
| Page images (DA) | 8,179 | 5,222 | 1,292 | 1,665 |
| Page links (DA = delivered: 6,886 `/direct-download/`, 483 cdn) | 7,369 | 4,581 | 1,234 | 1,554 |
| Carrier fragment images (DA) | 2,285 | 1,966 | 3 | 316 |
| Feed `path` | 2,284 | 1,967 | 2 | 315 |
| Feed `original` | 317 | 0 | 2 | 315 |
| Feed `rendition-1920` | 1,993 | 1,680 | 0 | 313 |
| Feed `mp4` | 162 | 0 | 25 | 137 |

- Delivered HTML has no source **image** URLs (all `media_<hash>`). It does have every source **link**.
- Of 408 pages, 178 reference only published masters.
- 2,148 distinct masters behind pages and fragments are not yet published.
- `/metadata.json` and `/en/placeholders.json` have no source references.
- Not counted: 2,750 links to source **pages** (not yet migrated; the SKODA-605 allow-list).

## Sources

- Measurements: live `main--demo--skoda-storyboard.aem.live` feed, query index and cart index (2026-10-16); the
  committed manifest; DA source of `/en/skoda-model/elroq`; the local import store.
- [`SKODA-MEDIA-ITEMS-OPTIONS.md`](SKODA-MEDIA-ITEMS-OPTIONS.md) (option B, aem.live limits),
  [`../media/SKODA-ASSET-MAPPING.md`](../media/SKODA-ASSET-MAPPING.md) §9,
  [`tools/importer/media/README.md`](../../tools/importer/media/README.md),
  [`../planning/SKODA-DECISION-REGISTER.md`](../planning/SKODA-DECISION-REGISTER.md) (D5, D13, D14).
