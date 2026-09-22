# SKODA-505, Demo media-cart + client-side zip download (device-ID, no login)
- **Epic:** E05, Media Pipeline
- **Type:** block
- **Phase:** A · **Pilot:** Yes (mission-critical demo deliverable) · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## Summary
Build the **device-ID, no-login media cart** the client scope names as **mission-critical for the 15 Oct demo**, collect press assets across pages, review the cart, and **download the selection as a single zip**. Bulk zip-download is the one non-EDS-native piece: it needs a **small serverless function** (build zip → write to storage → return a short-lived signed link) **or** a client-side (in-browser) zip. **Host is TBC, confirm in a short spike** (see `SKODA-MEDIA-CART-DOWNLOAD.md` Q8; App Builder caps an action result at 1 MB so a zip must be written to storage and returned as a link, not inline; AWS Lambda supports response streaming). **Per-story pre-zipped bundles** are the zero-risk fallback. See `SKODA-MEDIA-CART-DOWNLOAD.md` for the full options analysis (A–F).

**Supersedes** the earlier "media-cart deferred to Phase C" stance for the demo: per client scope, the cart is IN for M1. Production hardening (serverless zip endpoint, signed access, cross-device sync) stays in **SKODA-902** (re-scoped).

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/media-cart.md`](../../ui-specs/media-cart.md)** (captured via Chrome DevTools, add + cart-page states). Read it before implementing. This fills the cart **visual design** the ticket omitted (it was strong on behavior/architecture only).

Key facts from capture:
- Add affordance = round `40×40` `+` button (hover `#f1f1f1`). **Added state = `.in-cart`** overlays a 40%-dark scrim + large centered glyph on the thumbnail (opacity 0→1, `.3s`).
- Header **cart badge** = red `#ff6666` `24px` circle showing `attr(data-count)`, hidden at 0 (verified 0→"1" on add).
- Cart surface = a **dedicated page** ("Your downloads") with Download package / Empty package / Your packages bordered buttons (hover `#78faae`); item rows stack a remove control + link. (For EDS, confirm page vs drawer, see open decision.)
- New tokens: `--cart-badge-bg:#ff6666`, `--cart-added-scrim`, `--cart-dropdown-shadow`; reuse `--pill-radius:50px`, `--skoda-green-emerald`.
- Note: cart item/byte limit (`skoda-media-cart-limit`) has **no visual indicator** in source, add one for the a11y/UX gate.

## Description
Edge Delivery is static edge delivery, there is no origin compute in the delivery path to zip N files on request, so the bundle step needs a non-static helper. For the **demo** the cheapest, most EDS-native helper is the **browser**:
- **Cart state:** a **device-ID** (random UUID) minted on first cart action and stored in `localStorage`; cart contents (asset `id`, `size`, `title`, delivery URL) in `localStorage` (or IndexedDB if lists grow). **No login, no account, no PII**, consistent with the site's cookieless-until-action model.
- **Zip:** on "download all", fetch each selected asset as a `Blob` and zip in-browser with **`fflate`** (streaming; **store, don't deflate** already-compressed JPEG/PNG/MP4), then trigger a `Blob` download.
- **CORS linchpin:** client-side fetch of asset bytes requires **CORS on the asset origin**. Today's raw S3/CloudFront CDN has none; **AEM Assets delivery provides it**, so cart items must reference **AEM Assets delivery URLs** (ties to SKODA-501/504). If CORS is not in place for the demo asset set, fall back to per-story pre-zipped bundles (below).
- **Fallback (zero-risk):** bake a per-press-post "download all" zip at import and link to it statically, guarantees a working bulk download even if the interactive client-zip slips (covers story-scoped, not arbitrary cross-page selection).
- **Analytics:** re-emit the `skoda-analytics` **MediaCart** (add/remove/view) and **download/bulk-download** `dataLayer` events (coordinate with SKODA-905 / SKODA-804 stubs), budget this inside this ticket.

## Requirements / Spec
- **Device-ID cart (no login):** UUID minted on first add, stored in `localStorage`; cart contents persisted client-side; add/remove/list/clear; cart count + review view.
- **Per-asset hooks:** reuse the source contract, `data-action="add|download|link"`, `data-id`, `data-size="giant|original"`, so import-generated markup wires in.
- **Item/size caps:** re-implement the `skoda-media-cart-limit` behaviour as a client check (item count **and** total-bytes cap); surface the limit in the UI; also protects the browser-memory ceiling.
- **Client-side zip:** `fflate` (or JSZip), streaming, store (no deflate) for compressed assets; progress indicator for large bundles; consider a Web Worker to keep zipping off the main thread.
- **Asset origin:** cart items reference **CORS-enabled AEM Assets delivery URLs** (dep SKODA-501/504). Document the CORS requirement.
- **Fallback:** per-story pre-zipped bundle link when CORS/asset-set isn't ready or for a story-scoped "download all".
- **Analytics:** MediaCart + bulk-download events to the dataLayer; consent-gated; loads in the lazy/delayed phase (not eager).
- **A11y:** real `<button>` controls with labels + `aria-pressed`; cart count via `aria-live`; keyboard-operable; focus management on the review view.

## Acceptance Criteria
- [ ] Anonymous visitor can add/remove press assets across pages with **no login**; cart persists on the device (`localStorage` device-ID) and shows a count/review view.
- [ ] "Download all" produces **one zip** of the selected assets (client-side) with a sensible filename.
- [ ] Item **and** total-size caps are enforced with clear UX (mirrors `skoda-media-cart-limit`).
- [ ] Cart + bulk-download interactions emit MediaCart/download events to the dataLayer.
- [ ] Per-story pre-zipped fallback works when interactive client-zip is unavailable or CORS is not in place.
- [ ] Cart controls are keyboard-operable and screen-reader labelled; cart block is not in the eager phase.
- [ ] Visual (per [`media-cart.md` §9](../../ui-specs/media-cart.md)): add = round `40×40 +`; added = `.in-cart` scrim+glyph; header badge = red `#ff6666` `24px` circle with count, hidden at 0.
- [ ] Item/size cap has a visible indicator (source has none, add for the UX/a11y gate).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-502 (static Downloads block / mediabox data), SKODA-501 + SKODA-504 (**CORS-enabled AEM Assets delivery**, the linchpin), SKODA-601 (import wires per-asset hooks + bakes fallback zips).
- Coordinate: SKODA-804 (consent/analytics stubs), SKODA-905 (full dataLayer rebuild).
- Downstream: SKODA-603 (pilot page set), SKODA-902 (production hardening, serverless endpoint / signed access / cross-device sync).

## Risks / Flags
- **🟠 CORS on the asset origin is the gating dependency.** Client-side zip only works if demo assets are served from CORS-enabled AEM Assets delivery (SKODA-501/504). If not ready → pre-zipped fallback (Option D). Confirm early (Q1 in `SKODA-MEDIA-CART-DOWNLOAD.md` §9).
- **🟠 Browser memory** for large press masters, enforce count + total-size caps; stream with `fflate`; store (no deflate); Web Worker.
- **Scope confirmation:** does the demo need **arbitrary cross-page selection** or is **story-scoped "download all"** (fallback alone) enough? (Q5, `SKODA-MEDIA-CART-DOWNLOAD.md` §9). If story-scoped is sufficient, this ticket shrinks toward the fallback.
- **Analytics contract:** MediaCart/download event schema must match Škoda's dataLayer (Q7), the re-emit cost sits inside this ticket.
- `[RUNTIME-UNCONFIRMED]`: live cart-add/zip UX and large-zip browser-memory behaviour, need a browser + real assets.
- `[UNVERIFIED]`: AEM Assets anonymous/device-ID collection-download (Option F) as an alternative, worth a 1-hour spike (Q6).
- **🟠 Zip-host spike (Q8):** the serverless host is not interchangeable, Adobe App Builder caps an action's direct result at **1 MB** (→ write-to-storage + signed link, 60 s web-action timeout), whereas AWS Lambda supports response streaming and a CDN worker streams with CPU limits. **Validate host + pattern in a short spike before committing** the demo approach; client-side (in-browser) zip avoids the result cap if CORS is solved via AEM Assets.

## Cart resolver seam (2026-09-21)
The "download original" DAM path is surfaced via **`content/media-index.json`**, emitted by the media toolkit ([`tools/importer/media/`](../../../tools/importer/media/README.md), SKODA-504): `logical_id → { dam_asset_path, original_download_url, alt }`. The cart block resolves an asset → its DAM original through this single **seam**. **Demo-only:** this covers migrated pages; production author-picked assets need the DM/OpenAPI reference-URL route (or hash-reconciliation) — **decision deferred post-M1 demo** (see [`SKODA-ASSET-MAPPING.md` §9](../../media/SKODA-ASSET-MAPPING.md)). Swapping the seam's source is config, not a cart rebuild. M1 "download original" = a DA-published copy (author DAM path is IMS-gated).
