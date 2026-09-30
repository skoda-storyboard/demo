# SKODA-505a, Media-cart download logic (device-ID state + originals + multi-select zip)
- **Epic:** E05, Media Pipeline
- **Type:** block (logic layer) · **Phase:** A · **Pilot:** Yes (mission-critical demo) · **Milestone:** M1
- **Estimate:** ~5 SP (logic half of the former SKODA-505)
- **Split from:** SKODA-505 (paired with SKODA-505b presentation). Supersedes the download-contract wording in the old 505.

## Summary
The coherent, self-contained media-cart **download process**: device-ID collect/persist, cart operations, and the download itself. Press users download the **originals from AEM DAM** (NOT the web-optimized media-bus renditions EDS generates for on-page display). A single selected asset downloads directly; **multiple selected assets are zipped client-side with `fflate`** and downloaded as one bundle.

## Requirements / Spec
- **Device-ID cart (no login):** UUID minted on first add, stored in `localStorage`; cart contents (asset id, title, DAM delivery URL) persisted client-side; add/remove/dedupe/list/clear; count + review state.
- **Download originals:** cart items reference **CORS-enabled AEM DAM original-delivery URLs** (dep SKODA-501/504), not the on-page optimized renditions.
- **Single vs multi:** one asset -> direct `<a download>` of the original; multiple -> fetch each original as a Blob, `fflate` zip (store, no deflate for already-compressed JPEG/PNG/MP4), trigger one Blob download.
- **Item/size caps:** re-implement `skoda-media-cart-limit` as a client check (item count AND total-bytes cap); also protects the browser-memory ceiling.
- **Analytics hooks:** emit MediaCart (add/remove/view) + download/bulk-download dataLayer events (coordinate SKODA-804/905 stubs).

## Acceptance Criteria
- [ ] Anonymous visitor adds/removes assets across pages with no login; cart persists on the device and exposes a count + review model.
- [ ] Single-asset download returns the **DAM original**; multi-select returns **one client-side zip** of the originals with a sensible filename.
- [ ] Item + total-size caps enforced.
- [ ] Cart ops (add/remove/dedupe/persist/clear) and zip-manifest are covered by unit tests.
- [ ] `npm run lint` clean.

## Implementation (2026-09-30, developer-verified; QA pending)
Design agreed with the product owner on #50 (D1–D7, R1–R3). The approach is headless: no new CSS and no new surfaces (those are 505b).
- **`scripts/media-cart.js`** is the store.
  - Storage: `localStorage['skoda-media-cart']` = `{ v:1, deviceId, items[], updatedAt }`. `deviceId` is `crypto.randomUUID()`, minted on the first successful add and never transmitted (reserved for SKODA-902).
  - Items are keyed by DAM path. An item is kept only if its URL is the DAM original on the publish host. Corrupt or tampered state is reset.
  - Blocked storage falls back to memory; a full storage refuses the add (`storage`).
  - A `storage` event syncs other tabs.
  - Every change fires `media-cart:change` (detail = cart) and `onChange` listeners.
  - Caps (D2): 80 items **and** 1 GiB, re-checked after resolving, so parallel adds can't overshoot. 1 GiB also stays under fflate's non-ZIP64 limit.
  - API for 505b / 806 (all promise-based where async):
    - `getCart() → { deviceId, items, count, bytes, limits }`
    - `add({ href, title }) → { ok, item?, reason? }`
    - `addMany(entries) → { added, skipped[{ href, reason }] }`: fills in order up to the cap (the source's cart-limit behaviour) and fires one change.
    - `remove`, `has`, `clear`, `onChange(cb) → unsubscribe`
    - `download(opts)`, `downloadItems(items, opts)`
    - `trackView()`, `bindCartControl(el, { href, title })`
  - Refusal reasons: `unresolved | duplicate | limit-items | limit-bytes | storage`.
- **`scripts/media-cart-resolver.js`** maps a page link to the DAM original `{ id, url, filename, bytes, mime, kind }` (D3).
  - DAM links pass through; unindexed ones are sized with a HEAD request.
  - Source links (`cdn.skoda-storyboard.com/YYYY/MM/…`, `/direct-download/…`) are looked up in `scripts/media-cart-index.json`: the exact key first, then the `-WxH` / `-scaled` stripped one.
  - The resolver never falls back to a source or WordPress URL.
  - The index is fetched once, on the first add, hover or focus of a cart control; a failed fetch is retried.
- **`scripts/media-cart-index.json`** is generated from `media-manifest.json` by `npm run media:cart-index` (`tools/importer/media/build-cart-index.mjs`).
  - Size: 2,360 assets and 2,320 keys, about 84 KB gzipped.
  - R1: the 34 keys shared by identical PDFs filed twice map to the first copy. R2: derivative keys are left out. R3: keys stay percent-encoded.
  - D7: `npm run media:cart-index -- --check` fails when the committed index is stale. Run it after DAM publishes; it isn't an `npm test` gate.
- **`scripts/media-cart-download.js`** is loaded only when a download starts.
  - One item: an `<a download>` to the DAM URL, with no fetch.
  - Two or more:
    - Originals are fetched one at a time (CORS, no credentials) and checked against the indexed size.
    - They are streamed into a STORE zip with the vendored **fflate 0.8.3** (`scripts/vendor/`, D1), which handles CRC32, UTF-8 names and de-duplicated names.
    - Output: one `skoda-storyboard-media-YYYY-MM-DD.zip`.
    - Failed files are skipped and reported; `AbortSignal` cancels without saving. Progress is `{ done, total, loaded, totalBytes }`.
  - fflate is pinned as an exact devDependency. `npm run vendor:fflate` refreshes it, and a test asserts that the vendored copy is byte-identical to `node_modules`.
- **Analytics (provisional, SKODA-905):**
  - `media-cart:analytics` always fires.
  - `{ event:'trackEvent', eventCategory:'MediaCart'|'Download', eventAction, eventLabel }` is pushed to `window.dataLayer` only if the page already has one, so there's no pre-consent queue.
- **Bound controls (D4/D6):** the existing add controls become cart toggles.
  - The cart module is dynamically imported only where an add control renders; until then the control stays `aria-disabled`.
  - State shows as `aria-pressed` (buttons) or `menuitemcheckbox` + `aria-checked` (size-menu rows), plus `data-in-cart` for 505b to style.
  - A `#` control never navigates.
  - Links that resolve nowhere are disabled after the first hover or focus (or after a refused click), which fires `media-cart:refused` `{ href, reason }`.
  - Covered controls:
    - `scripts/media-card.js` (listing `/en/images`, `/en/videos`): the image *Original* row and the video add. *1920px* stays inert (D5).
    - `blocks/story-rail` media rails (media room, model pages): the add button (`data-href` = original / MP4).
    - `scripts/lightbox.js`: the one add button per overlay is re-pointed at each item's `cartHref` (new item field; `media-lightbox.js` sets the original / MP4). Gallery images have no DAM original, so their add is disabled.
- **Tests:** `scripts/media-cart*.test.mjs`, `scripts/lightbox-cart.test.mjs` and `tools/importer/media/build-cart-index.test.mjs`. They cover cart ops, dedupe, caps, persistence, corrupt/blocked/full storage, cross-tab sync, binding, the resolver and the index generator. The zip test reconciles the manifest against the archive: it unzips with fflate and checks CRC32 against `zlib`. The media-card and story-rail tests were updated.
- **Known limits (demo data, not code):**
  - 37 of 51 videos in the media feed are `publish: pending` in the manifest, so their add stays disabled until they are published and the index is regenerated.
  - Page links that aren't in the index (the #219 WebP originals) show as unavailable.
  - Live CORS zipping end to end is 505b's acceptance. The DAM sends `Access-Control-Allow-Origin: *`.

## Dependencies
- Upstream: SKODA-501 + SKODA-504 (CORS-enabled AEM DAM delivery, the linchpin), SKODA-502 (mediabox data), SKODA-601 (import wires per-asset hooks).
- Paired: SKODA-505b (presentation + live delivery wiring).
- Downstream: SKODA-603; SKODA-902 (production hardening).

## Agent handoff
`agent-fit` + first-wave `agent-eval`: the download process is a closed unit with a deterministic oracle (unit tests over cart ops + zip-manifest reconciliation), no visual judgment, no live credentials in the loop. The live CORS/DAM delivery hookup is in 505b (human).
