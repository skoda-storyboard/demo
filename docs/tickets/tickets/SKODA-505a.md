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

## Dependencies
- Upstream: SKODA-501 + SKODA-504 (CORS-enabled AEM DAM delivery, the linchpin), SKODA-502 (mediabox data), SKODA-601 (import wires per-asset hooks).
- Paired: SKODA-505b (presentation + live delivery wiring).
- Downstream: SKODA-603; SKODA-902 (production hardening).

## Agent handoff
`agent-fit` + first-wave `agent-eval`: the download process is a closed unit with a deterministic oracle (unit tests over cart ops + zip-manifest reconciliation), no visual judgment, no live credentials in the loop. The live CORS/DAM delivery hookup is in 505b (human).
