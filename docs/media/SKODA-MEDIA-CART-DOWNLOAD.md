# Škoda Media Portal, Bulk Zip-Download Feasibility & Options

**Companion to:** `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` (§2.4 Media-cart), `SKODA-MEDIA-DEEP-DIVE.md` (§4 signed downloads), `SKODA-SYSTEM-BUILD-SPECS.md` (§3 Media Cart), `SKODA-ASSET-MAPPING.md`, `SKODA-MASTER.md`.
**Date:** 2026-09-07
**Purpose:** Treat the media-cart's *"select multiple assets → zip → download"* capability as its own migration problem, the way we treated the story flattener and asset mapping. Edge Delivery is static edge delivery; **on-demand server-side zip bundling is not native to it.** Yet the client's confirmed scope makes *"media cart functionality replicated"* **mission-critical for the 15 Oct demo**, delivered *via device-ID with no login*. This doc closes that tension with concrete, ranked build options and a demo-vs-production recommendation.
**Method:** Read-only, anonymous, non-mutating (consistent with the prior dives, no cart-add, no download fired). Rebuild designs are engineering options, not exercised code. Rendered/runtime behaviour and exact server internals are `[RUNTIME-UNCONFIRMED]`; anything inferred from route/JS shape is marked.

---

> **⚠⚠ Superseded for the DEMO 2026-09-21 (user).** The demo media-cart download delivers **full-quality ORIGINALS from AEM DAM**, not reduced renditions. A single selected asset downloads directly; **multiple** selected assets are **zipped client-side (`fflate`)** into one bundle. So the "purpose = size REDUCTION" headline below (and the resulting demotion of client-side zip) **does not apply to the demo** (M1): the goal is originals, and client-side zip is the chosen multi-download path (CORS-enabled AEM DAM delivery, SKODA-501/504, is the linchpin). The A–F options analysis below stays valid for the **M2 production** question (SKODA-902), where server-side reduction / signed access / cross-device may still be wanted. See `docs/planning/SKODA-DEMO-FALLBACK-CONFIRM.md` (media-cart row) and `docs/reviews/M1-BACKLOG-REVIEW.md` §E.

## 1. Headline

> **⚠ Corrected 2026-09-10 (post-alignment-call).** Two facts reframe this doc and **demote the earlier client-side-zip recommendation**: (1) **the feature's purpose is file-size REDUCTION for download**, not just bundling, the source already ships *reduced renditions* server-side (`data-size="giant|original"` per image; MP4 `…-1080p.mp4` resolution suffix). Press assets are JPEG/PNG/MP4, **already compressed, so zipping saves ~nothing**; the real lever is delivering a **smaller rendition before transfer**, which a browser cannot do. (2) The call confirmed **full migration = switch WordPress off**, so reusing the legacy service (Option C) is a bridge at most, **not an end-state**. Net: the download reduction job is **inherently server-side**, the only real choice is *reuse-legacy (interim) vs rebuild-on-Adobe/AEM-Assets (end-state)*. Adobe CDN is now the confirmed delivery network, so **Adobe-hosted edge/App Builder functions are available in-platform** for the rebuild. See §5A (why client-side is wrong for this purpose) and §5B/§7.

**Rendition-reduced bulk download is buildable in EDS, but the reduction must happen server-side (before transfer), so it needs a non-static helper; it must be designed, not assumed.** EDS pages are static and CDN-cached; they have no origin compute to resize/repackage N files on request. The viable paths: a **stateless serverless/edge function that generates reduced renditions + bundles them** (Adobe App Builder / edge worker), **AEM Assets / Dynamic Media renditions** (the DAM does the resize), or **reuse Škoda's existing signed-download service** as an interim bridge. Client-side zip is **not** a fit when the goal is smaller downloads (§5A).

**Recommendation in one line:**
- **Demo (15 Oct, may slip 1–2 wks):** deliver a *real, working* cart whose "download" returns **reduced renditions**, simplest credible path is **AEM Assets/Dynamic Media renditions fetched + bundled by a thin Adobe App Builder action** (write-to-storage + signed link, §5B), with **per-story pre-baked reduced bundles (Option D)** as the zero-risk fallback. Cart state via **device-ID in `localStorage`**, no login, exactly as scoped.
- **Production:** the **serverless/edge rendition-zip endpoint (Option B)** on Adobe, or **AEM Assets/Dynamic Media collection download (Option F)** if it supports the anonymous/device-ID flow. **Legacy `/direct-download/` reuse (Option C) is an interim bridge only**, it keeps WordPress alive, which the migration exists to end.

**This supersedes the earlier "drop the cart for pilot" stance (§2) AND the interim "client-side zip is the demo path" recommendation**, the latter predates the "purpose = size reduction" + "switch WP off" clarifications from the alignment call.

---

## 2. Scope reconciliation, the cart is IN for the demo

Earlier analysis (`SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §5, `SKODA-SYSTEM-BUILD-SPECS.md` §3, epic **E05**, tickets **SKODA-503 / SKODA-902**) concluded: *pilot = static downloads block only; media-cart service + signed bulk download deferred to Phase C.* That was the right call **before** the client scope was fixed.

The client's confirmed requirements changed this:

> - "Media cart functionality replicated", listed under the **mission-critical** 15 Oct demo deliverables.
> - Demo cart works **via device-ID, no login**.

So for the demo, "drop it / plain links only" is not an acceptable answer. **What "replicated" minimally means for the demo** (our working definition, to confirm with Škoda, §9):

1. A visitor can **add press assets to a cart** across one or more press pages (no login).
2. The cart **persists on the device** (device-ID) and shows a count / review view.
3. The visitor can **download the selected assets as one bundle** (a zip), the headline behaviour.
4. An enforced **item/size limit** (mirrors today's `skoda-media-cart-limit`).

**Consequence for the backlog:** E05/SKODA-503/SKODA-902 must be **re-pointed** so the cart + bulk download move from *Phase C / deferred* into the **M1 demo** scope. This doc flags that (§8); the ticket edits are a separate, explicit follow-up, not silently rewritten here.

---

## 3. Current state, how bulk download works today

From `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.4 and `SKODA-MEDIA-DEEP-DIVE.md` §4 (all GET/read-only evidence):

- **Cart state, `media-cart/v1`:** opt-in, server-side. `GET /history` → `{"hasHistory":false}` and `GET /actions` → `{"mediaCart":""}` when anonymous. **No cookie is set on anonymous load**; state is created only after an add action. An **item limit** is enforced by `skoda-media-cart-limit` JS (cookie-based).
- **Asset source, `mediakit/v1/mediabox/post/{id}/{lang}`:** returns the per-press-post downloadable image set, `{images:[{imageUrl, link, translated, title}]}`.
- **Per-asset hooks in markup:** `data-action="add|download|link"`, `data-id`, `data-size="giant|original"`, `data-event-type="Attachment"`.
- **Bulk download, `/direct-download/…`:** the request goes **through the site**, which **redirects to a signed S3 URL** (`skoda-storyboard.s3.eu-central-1.amazonaws.com`, `X-Amz-Signature`, ~**24 h expiry**, `Content-Disposition: attachment`). For MP4 the route carries a resolution suffix (`…-1080p.mp4`).
- **Where zipping happens today `[RUNTIME-UNCONFIRMED]`:** the multi-asset bundle is assembled **server-side in WordPress/the origin** (the signed-S3 delivery is the *result* of that server step). We did not fire a bulk download (non-mutating rule), so whether the zip is pre-staged to S3 or streamed on the fly is inferred, not observed.
- **Delivery infra:** S3 + CloudFront; **no CORS** on the CDN; masters + an ~8-size derivative ladder (`SKODA-MEDIA-DEEP-DIVE.md` §1, §3).
- **Analytics coupling:** `skoda-analytics` instruments **MediaCart (8 refs)** and **downloads (23 refs)** into `window.dataLayer` (`SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.6), any rebuild must re-emit these events or Škoda loses its measurement taxonomy.

---

## 4. The EDS-native gap, why this needs a helper

Edge Delivery serves **static, CDN-cached HTML and assets**. There is deliberately **no origin application server in the delivery path**, that is the source of its speed and its 100/100 profile. Consequences for "zip N selected files on demand":

- **No server-side zip step exists** to port. The WordPress origin that assembles today's bundle has no like-for-like in EDS's static delivery.
- **A cart is per-visitor, uncacheable state**, the antithesis of a static page. It has to live **client-side** (device storage) and/or in a **separate small service**, bolted onto the static page (which is fine, the site is already "cookieless until action", so pages stay cacheable).
- **The zip must be produced somewhere that isn't the static origin:** the browser, a serverless/edge function, or an external service.

So this is **not** "static vs impossible", it's "static page + one small non-static helper for the bundle step." That helper is the whole decision, and it's a small, well-bounded one.

---

## 5. Options for zip-and-download in EDS

| # | Option | Where the zip is made | Solves cross-page cart? | New infra | Fit | Effort `[est.]` | Risk |
|---|---|---|---|---|---|---|---|
| **A** | **Client-side zip** (`fflate`/JSZip) | Browser | ✅ | None (needs CORS origin) | 🟢 EDS-native ethos | S–M | 🟠 CORS + big-file memory |
| **B** | **Serverless / edge zip endpoint** | Lambda / Worker / App Builder action | ✅ | 1 stateless function | 🟢 clean API boundary | M | 🟠 build + host a service |
| **C** | **Reuse legacy `/direct-download/` + `media-cart/v1`** | Existing WP/origin | ✅ | None (keeps WP) | 🟡 works, keeps dependency | S | 🟠 governance / legacy lifespan |
| **D** | **Pre-zipped per-story bundles at import** | Build/import time | ❌ (story-scoped only) | None | 🟢 fully static | S | 🟢 low |
| **E** | **No-zip fallback** (individual `<a download>`) | N/A | ⚠️ partial (multi-file prompt) | None | 🟢 fully static | XS | 🟢 low, but not "one bundle" |
| **F** | **External DAM / download SaaS** (AEM Assets collection download) | Vendor service | ✅ (if supported) | Vendor capability | 🟡 depends on product | S–M | 🟠 capability `[UNVERIFIED]` |

### A. Client-side zip (browser), ⚠ WRONG FIT when the purpose is size reduction
- **How:** cart client fetches each selected asset as a `Blob`, zips in-browser with **`fflate`** or JSZip, triggers a `Blob` download.
- **Why it does NOT serve this feature's purpose (corrected 2026-09-10):** the media-cart download exists to deliver **smaller files** (reduced renditions), and:
  - **Zip ≠ compression here.** JPEG/PNG/MP4 are already compressed, our own §8 guidance is *store, don't deflate*, so bundling yields **~0 size saving** wherever it runs.
  - **Reduction must precede transfer, and a browser can't reduce.** To download smaller files the resize/transcode has to happen **before** the bytes cross the wire. Client-side zip can only bundle what it already fetched, so it either (a) pulls the full **25–40 MB masters** into browser memory (no reduction + memory blow-out risk), or (b) fetches server-made reduced renditions, in which case **the server already did the job** and re-bundling client-side is pure waste.
- **Residual niche:** only defensible as a demo shortcut for a handful of already-small assets where "one file" convenience, not size, is the point. Not the real answer.
- **Verdict:** **demoted.** The reduction is server-side (Option B/F); see below.

### B. Serverless / edge zip endpoint
- **How:** a tiny **stateless** function, `POST /zip {assetIds[]|urls[]}` fetches masters server-side (no browser CORS issue), builds the zip, and returns the download. Options: AWS Lambda + API Gateway, Cloudflare/Fastly Worker, or **Adobe App Builder / I/O Runtime** action (keeps it in the Adobe ecosystem).
- **⚠️ Host-specific limits matter, check before committing (verified 2026-09-07 against Adobe's App Builder system-settings docs):**
  - **Adobe App Builder / I/O Runtime:** an action's **direct result is capped at 1 MB**, and **POST payload is also 1 MB**, so you **cannot return the zip bytes inline**. The action must **write the zip to object storage** (App Builder Files SDK / S3-compatible) and **return a short-lived signed URL** (which mirrors the source site's existing `/direct-download/` signed-S3 flow, a good sign). Web-action **timeout is 60 s** (blocking; raisable to a few minutes non-blocking/async), **memory ≤ 4096 MB**, **~600 MB local scratch**. Large carts → pre-stage or async. Net: **workable, but not "return the zip from the action", write-to-storage + signed link is mandatory.**
  - **AWS Lambda:** supports **response streaming** (stream the zip directly), sidesteps a result-size cap; still bounded by memory/time.
  - **CDN/edge worker (Cloudflare/Fastly):** can stream a zip; CPU-time limits apply.
- **Pros:** closest analogue to today's server-side behaviour; no browser-memory ceiling; can gate access (signed/short-lived); handles large/unlimited selections; keeps keys server-side.
- **Cons:** it **is** a service to build, host, monitor, and secure (rate-limit, abuse, cost). Host choice is not interchangeable, the result-size/streaming model differs per platform (above), so **validate the exact host in a short spike** rather than assuming App Builder is a drop-in.
- **Fit:** **the production answer** for large/unlimited carts and gated assets. Usable for the demo too (App Builder with the write-to-storage pattern), but adds infra to stand up before 15 Oct.

### C. Reuse the existing Škoda service as-is
- **How:** the EDS cart client calls the **existing** `media-cart/v1` + `/direct-download/` endpoints; the legacy backend keeps assembling and signing bundles.
- **Pros:** least new code; behaviour already exists and is battle-tested; fast to wire.
- **Cons:** keeps a **WordPress/legacy dependency alive** past migration, the opposite of decommissioning it; governance/ownership question (is the API allowed to be called from the new front-end, and for how long?); CORS on that API must permit the EDS origin.
- **Fit:** a pragmatic **bridge**, good for the demo or an interim production phase; not a clean end-state.

### D. Pre-zipped per-story bundles at import
- **How:** at import, build a single **"download all" zip per press post** from the `mediabox` image set and store it as a static asset; the page links to it directly.
- **Pros:** **fully static, zero runtime infra, zero CORS issue**, a plain link. Trivially fast and cacheable.
- **Cons:** only covers **"download everything for this story"**, it does **not** support an arbitrary **cross-page cart selection**. Bundles go stale if assets change (re-bake at import).
- **Fit:** an excellent **demo de-risker / fallback**, guarantees a working "bulk download" even if the interactive cart slips. Pair with A or B, don't rely on it alone if cross-page selection is required.

### E. No-zip fallback (individual downloads)
- **How:** each cart item is a plain `<a download>`; "download all" triggers sequential downloads (browser may prompt for multiple files).
- **Pros:** simplest, fully native, no CORS (same-origin `download` attr works; cross-origin `download` filename is ignored but the file still downloads).
- **Cons:** **not "one zip"**, poor UX for many files; browsers throttle/prompt multi-file downloads. Fails the spirit of "media-cart replicated."
- **Fit:** last-resort safety net only.

### F. External DAM / download SaaS (AEM Assets collections)
- **How:** if **AEM Assets** (the confirmed DAM, D5) exposes a **collection / bundle-download** capability, use it: add-to-collection = cart, collection download = the zip.
- **Pros:** no bespoke zip code; leverages the DAM the client already mandated; rights/approval handled in the DAM.
- **Cons:** **capability + anonymous/device-ID access pattern is `[UNVERIFIED]`**, AEM Assets collection download is typically an authenticated authoring feature, not an anonymous public-visitor flow. Needs product confirmation before relying on it.
- **Fit:** worth a **1-hour spike** because the asset origin is AEM Assets anyway; likely complements A (CORS delivery) rather than replacing it.

---

## 6. Device-ID / no-login cart-state model

The scope says the demo cart works **via device-ID, no login**, which fits the site's existing **cookieless-until-action** model perfectly.

- **Identity:** a **device-ID** (random UUID) minted **on first cart action**, stored in `localStorage` (persists across visits on that device/browser). No account, no PII, no login.
- **Cart contents:** store the selected asset descriptors (`id`, `size`, `title`, source URL) in **`localStorage`** (small, or **IndexedDB** if lists get large). This alone is enough for a **fully client-side cart** (pairs with Option A or D, no backend).
- **Optional state service:** only needed if the cart must **sync across devices** or be **server-authoritative** (e.g. for enforcing limits server-side or analytics). For the demo, client-only storage meets the requirement; a device-ID-keyed state service is a production enhancement, not a demo blocker.
- **Item/size limit:** re-implement `skoda-media-cart-limit` as a client check (count + total-bytes cap), also protects Option A's browser-memory ceiling.
- **Privacy/consent:** device-ID in `localStorage` is first-party, non-tracking, created only on explicit action → **consistent with the site's zero-cookie-on-load posture** and OneTrust gating. Document it in the consent notice; it's a functional store, not marketing.

---

## 7. AEM Assets angle, the CORS linchpin

The client confirmed **AEM Assets** as the approved asset source (D5), and `SKODA-504` already builds the S3→AEM-Assets mapping. This matters directly here:

- **CORS:** AEM Assets / its delivery CDN can serve assets with proper **CORS headers**, which is exactly what **Option A (client-side zip)** needs and what today's raw S3/CloudFront CDN **lacks**. So the asset-origin migration that's happening anyway (SKODA-501 masters ingest + SKODA-504 mapping) is the thing that **unlocks the cleanest, backend-free zip path**.
- **Delivery URLs:** cart items should reference **AEM Assets delivery URLs**, not the legacy S3 CDN, then client-side fetch-and-zip "just works."
- **Bundle capability (Option F):** worth verifying whether Assets' own collection/download-bundle can be reused (spike), but the **primary win is CORS-enabled delivery unlocking Option A.**
- **Dependency:** this doc's demo recommendation is therefore **coupled to SKODA-501/504** delivering the demo assets *through AEM Assets* (not reference-in-place on the no-CORS S3). Flag in §9.

---

## 8. Analytics, accessibility & performance

- **Analytics (must-have):** re-emit the `skoda-analytics` `dataLayer` events for **MediaCart** (add/remove/view) and **download/bulk-download** so Škoda's measurement taxonomy is preserved (`SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.6). Wire into the cart block's `decorate()`; load in the delayed phase; consent-gated. **Hidden cost, budget it into the cart ticket, not separately.**
- **Accessibility:** cart controls are real `<button>`s with `aria-pressed`/labels; the cart count is announced (`aria-live`); "download bundle" is a labelled control; keyboard-operable; focus management on the cart review view.
- **Performance:**
  - Keep the cart block out of the eager phase, it's an interactive add-on, lazy/delayed.
  - **Client-side zip (A):** stream with `fflate`; **store (no deflate)** for JPEG/PNG/MP4 (already compressed) → faster, less memory; enforce **count + total-size caps**; show a **progress indicator** for large bundles; consider a Web Worker to keep the zip off the main thread.
  - **Bundle size guardrail:** define a max (e.g. cart item cap × size) so the browser (A) or function (B) never chokes; surface the limit in the UI like the current `skoda-media-cart-limit`.

---

## 9. Open questions & decisions for Škoda

| # | Question | Why it matters | Affects |
|---|---|---|---|
| Q1 | **Can AEM Assets / Dynamic Media generate the REDUCED renditions the download needs, by 15 Oct?** | The whole purpose is smaller files, the DAM (or an App Builder action) must produce the reduced rendition server-side. Determines whether the demo download is real vs pre-baked (Option D). | Demo path; SKODA-501/504 |
| Q1b | **What reduced sizes/resolutions must the download offer?** (image long-edge px; video resolution) | Mirrors today's `data-size` + `…-1080p.mp4`; defines the rendition set to generate. | Rendition spec |
| Q2 | **Reuse the legacy `media-cart/v1` + `/direct-download/` service, or rebuild?** | Governance + how long WordPress stays alive. Option C vs A/B. | Prod architecture |
| Q3 | **What are the acceptable cart item count & total zip size caps?** | Drives client-side vs serverless (browser memory ceiling). | Option A vs B |
| Q4 | **Is device-ID in `localStorage` acceptable (no cross-device sync) for the demo?** | If cross-device/server-authoritative is required, add a state service. | Cart-state model |
| Q5 | **For the demo, is "download all assets for this story" (Option D) enough, or is arbitrary cross-page cart selection required?** | Story-scoped bundles are zero-risk; cross-page selection needs the full cart. | Demo scope / fallback |
| Q6 | **Does AEM Assets offer an anonymous/device-ID collection-download we can reuse (Option F)?** | Could remove bespoke zip code entirely. | 1-hour spike |
| Q7 | **Must the `skoda-analytics` MediaCart/download events be preserved 1:1?** | Confirms the analytics rebuild cost sits inside the cart ticket. | Effort |
| Q8 | **Which serverless host for the zip endpoint (Option B)?** | Limits differ per platform, App Builder caps an action result at **1 MB** (must write-to-storage + return a signed link, not inline; 60 s web-action timeout), while AWS Lambda supports response streaming. Not a drop-in choice. | **Spike**, validate host + pattern before committing |

---

## 10. Impact on the backlog (flag, do not silently rewrite)

The current backlog defers the cart + bulk download to **Phase C**:
- **E05** goal: *"the cross-page media-cart service and the signed-S3 `/direct-download/` bulk flow are out of scope (deferred to Phase C, SKODA-902)."*
- **SKODA-503**: *"MP4 signed-S3 cart flow deferred to Phase C."*
- **SKODA-902**: Phase C signed-download / cart service.

Given the client scope (cart is mission-critical for the 15 Oct demo), these need re-pointing:
- **New/expanded M1 ticket** for the **device-ID cart + bulk zip** (client-side zip A, with D as fallback), including the **analytics re-emit** and **item/size caps**.
- **SKODA-503 / E05** notes updated so bulk download is **not** blanket-deferred, the demo needs a working bundle.
- **SKODA-902** re-scoped to the **production** hardening (serverless endpoint B / signed access / cross-device sync), not "the cart, deferred."
- **Dependency link** to **SKODA-501/504** for CORS-enabled AEM Assets delivery (the linchpin, §7).

**These edits are a separate, explicit step**, proposed here, applied on your go-ahead, so the backlog change is deliberate and reviewable.

---

## 11. Method, confidence & limitations

- **Read-only / anonymous / non-mutating:** consistent with the prior dives, no cart-add, no bulk download fired, no login. Rebuild designs are engineering options, not exercised code.
- **`[RUNTIME-UNCONFIRMED]`:** where today's zip is assembled (WP origin vs pre-staged S3), the live cart-add/bulk-download UX, and browser-memory behaviour of large client-side zips (needs a browser + real assets).
- **`[UNVERIFIED]`:** AEM Assets anonymous/device-ID collection-download capability (Option F) and its CORS delivery specifics, confirm with product/access.
- **Estimates** (S/M/XS, SP) are **planning-level, not a quote.**
- **Traceability:** all current-state facts sourced from `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.4/§2.6, `SKODA-MEDIA-DEEP-DIVE.md` §1/§3/§4, `SKODA-SYSTEM-BUILD-SPECS.md` §3, `SKODA-ASSET-MAPPING.md`, and the client scope (`SKODA-MASTER.md` §1).
- **No Git operations performed** (project rule, the user manages Git via the Console UI).
