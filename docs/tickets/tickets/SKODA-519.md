# SKODA-519, Retire the code-bus media cart index: resolve from DAM URLs, legacy keys in content shards

- **Epic:** E05, Media Pipeline
- **Type:** integration / shared script
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 1.5 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **GitHub issue:** not created yet
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Starts once SKODA-517's keyed shards exist and the SKODA-504a
  source-CDN sweep is near 0. Proposed in [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3D.

## Why
- `scripts/media-cart-index.json` (SKODA-505a) maps source keys to DAM originals. It is code:
  - a newly published DAM file isn't downloadable until `media:cart-index` runs and a PR merges;
  - it is 477 KB raw / 102 KB gzip for 2,741 assets, ~1.1 MB gzip at ~30k, loaded whole on the first cart action.
- Once page links and feed rows carry DAM URLs (504a, 511), `media-cart-resolver.js` already resolves them through
  `damPath()`. The index is then needed only for links still on the source CDN.

## Scope
- Feed rows carry `bytes` and `mime` for `original` / `mp4`. A feed add uses them, with no index and no HEAD request.
- The resolver reads legacy source keys from SKODA-517's keyed shards (one small fetch per key prefix) instead of
  the code-bus file.
- The sync job (511) writes those keys, so a DAM publish is downloadable after the next sync, without a code deploy.
- Delete `scripts/media-cart-index.json` and `build-cart-index.mjs` after cutover, or keep the builder as a
  shard writer.
- Unchanged: the resolver's contract (`{ id, url, filename, bytes, mime, kind, sourceKey }`), the cart store and the
  "unavailable" state for unresolved links.

## Acceptance criteria
- [ ] Adding to the cart from a listing, a rail, a lightbox and a Media Box gives the same item (id, bytes, MIME) as
      before, for a recorded sample of 20 assets across types.
- [ ] A DAM asset published after the last code deploy becomes downloadable after a sync run, with no code change.
- [ ] No request to `/scripts/media-cart-index.json`. A cart session with 10 adds fetches at most the keyed shards it
      needs (counted).
- [ ] Resolver unit tests cover: DAM URL with feed bytes, DAM URL with HEAD fallback, legacy key, a miss, a transient
      failure.

## Dependencies
SKODA-505a ✅, SKODA-517, SKODA-511, SKODA-504a.
