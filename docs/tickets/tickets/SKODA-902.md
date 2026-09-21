# SKODA-902 — Media-cart production hardening (serverless zip endpoint + signed access + cross-device state)
- **Epic:** E09 — Dynamic Services
- **Type:** service
- **Phase:** C · **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–12d *(planning estimate, not a quote)*

## Summary
**Production hardening** of the media cart, beyond the demo build. The device-ID cart + **client-side** zip download ships in **M1 (SKODA-505)**. This ticket adds what the client-side approach can't do at production scale: a **serverless/edge zip endpoint** for large/unlimited or gated selections, **signed/expiring access** to protected assets, and **cross-device / server-authoritative cart state**. Decision-gated (reuse legacy service vs rebuild). See `SKODA-MEDIA-CART-DOWNLOAD.md` (Options B/C, §5) and `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.4.

**Re-scoped (2026-09-07):** previously "Media-cart service (state + signed-download), 13 SP, deferred — pilot ships plain links." The cart + bulk zip are now a mission-critical **M1 demo** deliverable (SKODA-505), so this ticket no longer builds the cart from scratch — it hardens it for production. SP reduced 13 → 8.

## Description
The demo's client-side zip (SKODA-505) has real production limits: browser memory caps the bundle size, it needs CORS on every asset origin, and cart state lives only on one device. Production may also need to gate access to protected/embargoed assets with **signed, expiring URLs** (as the source `/direct-download/` flow does: signed-S3, ~24h, `Content-Disposition: attachment`). This ticket covers the server-side helper that removes those limits:
- **(a) Serverless / edge zip endpoint (Option B):** a **stateless** function — `POST /zip {assetIds[]|urls[]}` → returns the zip with attachment disposition. Fetches masters server-side (no browser CORS/memory ceiling), handles large/unlimited selections. Candidates: AWS Lambda + API Gateway (**response streaming** — stream the zip directly), Cloudflare/Fastly Worker (streams, CPU-time limits), or **Adobe App Builder / I/O Runtime** (**1 MB action-result cap → must write the zip to storage and return a short-lived signed link, not inline**; 60 s web-action timeout). **Host is not a drop-in choice — validate in a spike (Q8).**
- **(b) Signed access:** reproduce S3-signing **server-side** (keys never client-side), expiring URLs, attachment disposition — for gated/protected assets.
- **(c) Cross-device / server-authoritative state (optional):** a device-ID-keyed cart-state backend (`add/remove/list`, server-side item-limit) if the business needs the cart to sync across devices or be enforced server-side. If not required, the client-side store from SKODA-505 stands.
- **(d) Reuse-vs-rebuild decision (Option C):** whether to call the **existing** Škoda `media-cart/v1` + `/direct-download/` service directly (keeps a WordPress dependency) instead of building (a)/(b). Governance-gated (D2).

## Requirements / Spec
- Serverless zip endpoint: stateless, streams `application/zip`, attachment disposition, handles large selections; fetches assets server-side.
- Signed-download: server-side signing, expiring URLs, no keys exposed client-side (for gated assets).
- Optional cross-device state backend: device-ID-keyed, `add/remove/list`, enforced item limit, opt-in (no state until first add).
- Graceful degradation: if the endpoint is unavailable, the SKODA-505 client-side zip / per-story fallback still functions.
- Consent-gated; MediaCart/download events emitted per the analytics contract (coordinate SKODA-905).

## Acceptance Criteria
- [ ] Serverless zip endpoint returns a working zip for a large multi-asset selection (beyond the client-side memory ceiling), with attachment disposition.
- [ ] Gated assets resolve via an expiring signed URL; no signing keys are exposed client-side.
- [ ] (If in scope) cart state syncs across devices via a device-ID-keyed backend; item limit enforced server-side.
- [ ] Reuse-vs-rebuild decision (D2) recorded; if reusing the legacy service, its API is called with CORS permitting the EDS origin.
- [ ] With the service disabled, SKODA-505's client-side zip + per-story fallback still work (graceful degradation).
- [ ] Bulk-download interactions emit events to the dataLayer per the analytics contract.

## Dependencies
- Upstream: SKODA-505 (demo device-ID cart + client-side zip — the M1 baseline this hardens), SKODA-502 (mediabox data) / Downstream: SKODA-905 (MediaCart event wiring)

## Risks / Flags
- **🟠:** standing up + securing a serverless endpoint (rate-limit, abuse, cost) and/or a state backend — quantifiable but real infra.
- **Open (D2):** reuse the existing signed-download / `media-cart/v1` service (keeps WordPress) vs rebuild — governance/ownership + how long the legacy backend lives.
- POST/stateful contracts were described from routes/JS, not fired (non-mutating probe) — exact request bodies unconfirmed.
- Media-cart add/large-bundle flow is `[RUNTIME-UNCONFIRMED]` — needs a browser + (for some paths) real state.
