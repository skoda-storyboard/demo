# SKODA-714, Security headers and CSP on the production CDN, tested against GTM, OneTrust and the Škoda CCM

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure (headers config) / QA
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Must be live on the production host **before the DNS
  switch**.
- **Estimate:** 2.5 SP · AI-assisted 1–1.5d / manual 2d, excluding the client's security sign-off and CDN lead time
  *(planning estimate, not a quote)*. Was 2 SP; the `frame-src` rule and the package test (G-T4-03) add about
  0.5 SP. The review gives no separate number for this part (its +1 SP for G-T4-03 sits with SKODA-849).
- **GitHub issue:** [#421](https://github.com/skoda-storyboard/demo/issues/421) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-05. Round 2: G-T4-03 (Medium, not
  re-verified), G-T5-07 (Low).

## Why
**The source sends (story and home, measured):**
- HSTS `max-age=31536000; includeSubDomains; preload`;
- `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer-when-downgrade`;
- `Permissions-Policy` with `geolocation=(*)` and camera, microphone, payment and others off;
- a CSP allow-list of 39 hosts, with `'unsafe-inline'` and `'unsafe-eval'` in `script-src`.

**The demo sends** (G-F-05, High, confirmed):
- HSTS `max-age=31557600` without `includeSubDomains`;
- the boilerplate CSP from `head.html`, already moved to an HTTP header (refuter correction): `'nonce-aem'`,
  `'strict-dynamic'`, `frame-src 'self' https:`, `require-trusted-types-for 'script'`, and **no `frame-ancestors`**.

So the production pages could be framed by any site (clickjacking on the newsletter and cart UI). No doc or ticket
mentions `X-Frame-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` or custom headers.

**Vendor scripts are untested under this CSP:**
- The Trusted Types default policy in `scripts/scripts.js` strips `<script>` from `createContextualFragment` and
  `document.write`, which GTM custom-HTML tags and some vendor snippets use. SKODA-804 doesn't mention the CSP.
- SKODA-907 adds Škoda's sDrive and CCM (`cross.skoda-auto.com`, `sdrive.azureedge.net`), whose `endpoint.js` and
  `zero-tracking.js` load synchronously in `<head>` on the source (G-A-04), and server-side GTM on Cloud Run.
- The source list isn't a template: `gomexlive` is a stale entry and Hotjar is inactive (area A, A10/A11).

**The interactive HTML packages** (G-T4-03) are framed from a third origin too: 30 entry URLs in 30 docs (cdn
`/iframes/` 19, `/unboxing/` 1, `/concept-cars/` 3, S3 `/Assets/` 4, S3 eu-central-1 `/iframes/` 3). Some load old
code: jQuery 2.1.1 (known XSS CVEs) and Google Fonts over `http://` in the ENYAQ RS comparison, CreateJS (2015) in
the info-lights package. `ivet-car-2024` resizes its iframe and scrolls the parent through `window.postMessage`.
SKODA-849 prefers hosting them same-origin under `/iframes/` on the production host, where that code would run in
the site origin; the review proposes a separate static origin (or sandboxed iframes) as the Q-19 default.

hstspreload.org lists skoda-storyboard.com as not preloaded, so leaving out `preload` carries no list-removal risk.

## Scope
**Client:**
- **C1 Škoda IT security:** is there a VW-group header baseline the site must meet? Sign off the header set.
- **C2 Škoda IT (with SKODA-709):** confirm that every `skoda-storyboard.com` subdomain serves TLS before
  `includeSubDomains` is set. This holds today (G-T5-07): `sgtm`, `cdn`, `stage`, `test` and `media` all answer over
  HTTPS, and the zone has no wildcard. Re-check against the zone export, and any new hostname (the legacy origin in
  709, the document host in 709b) must have TLS from day 1.

**Team:**
- **T1 Header set** on the production host, through the config-service custom headers or the CDN (SKODA-709 decides):
  - `Content-Security-Policy: frame-ancestors 'self'`, plus `X-Frame-Options: SAMEORIGIN` for older browsers;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy` without geolocation, unless a widget needs it (check the charging-calculator widget);
  - HSTS with `includeSubDomains` once C2 holds; no `preload` unless the client asks.
- **T2 CSP.** Keep nonce + `strict-dynamic` + Trusted Types; don't port the 39-host list or `'unsafe-eval'`.
  `frame-ancestors` only works in an HTTP header (a meta CSP ignores it), so verify it on the response.
- **T3 Vendor test (amends SKODA-804's AC, with SKODA-907).** Run GTM-M5GMBWF with its custom-HTML tags, OneTrust
  through the CCM, the sDrive scripts and the embeds. Record CSP and Trusted Types violations before and after
  consent, per locale (the CCM picks the OneTrust script per locale). Every script 907 adds to `head.html` carries
  the nonce.
- **T4 Exceptions.** A tag that needs a `<script>` through `document.write` is either rewritten by the GTM owner or
  gets a documented policy exception. Record which, and why.
- **T5 Docs.** The header set, the reasons and the sign-off go in the repo and in D16 (NFRs).
- **T6 Package origin (with SKODA-849, Q-19).** `frame-src` names the origin the packages are served from. If T2
  narrows `frame-src` from `'self' https:` to the embed hosts in 849's verdict table, the package origin is on the
  list. The packages don't run in the site origin unless the iframe is sandboxed (849 sets the attributes). Their
  `postMessage` resize must still work under the CSP.

## Not in scope
- Consent and tracking behaviour, and pre-consent pings: SKODA-907, 804 (Q-16).
- The production CDN, DNS and TLS: SKODA-709 (D14).
- Repo files served on the production host: SKODA-712 (G-G-08).

## Acceptance criteria
- [ ] On the production host, the home, a story, a press release and the search page send `frame-ancestors 'self'`,
      `X-Frame-Options: SAMEORIGIN`, `nosniff`, the agreed `Referrer-Policy` and `Permissions-Policy`, and HSTS
      (with `includeSubDomains` if C2 holds).
- [ ] A test page on another origin can't frame a production page.
- [ ] With GTM, OneTrust/CCM and sDrive loaded, 1 page per template per locale shows 0 CSP and 0 Trusted Types
      violations, before and after consent, and GA4 hits reach server-side GTM.
- [ ] The media cart, the newsletter form and the YouTube, Vimeo and Buzzsprout embeds still work.
- [ ] One package per origin and prefix in use (including `ivet-car-2024`) renders in its story on the production
      host with 0 CSP violations, its `postMessage` resize works, and it doesn't run unsandboxed in the site origin.
- [ ] Every exception from T4 is documented, and the client's security sign-off (C1) is recorded.

## Dependencies
SKODA-709 (production host and CDN, D14), 709b (document host), SKODA-849 and Q-19 (package origin), SKODA-907 (the
vendor script list), SKODA-804 and 905 (GTM), SKODA-102 (`head.html`, the Trusted Types policy). SKODA-713's JSON-LD
helper must pass this CSP. D16; client C1–C2.
