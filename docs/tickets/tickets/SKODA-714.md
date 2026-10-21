# SKODA-714, Security headers and CSP on the production CDN, tested against GTM, OneTrust and the Škoda CCM

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure (headers config) / QA
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Must be live on the production host **before the DNS
  switch**.
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d, excluding the client's security sign-off and CDN lead time
  *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-05.

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

hstspreload.org lists skoda-storyboard.com as not preloaded, so leaving out `preload` carries no list-removal risk.

## Scope
**Client:**
- **C1 Škoda IT security:** is there a VW-group header baseline the site must meet? Sign off the header set.
- **C2 Škoda IT (with SKODA-709):** confirm that every `skoda-storyboard.com` subdomain serves TLS before
  `includeSubDomains` is set.

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
- [ ] Every exception from T4 is documented, and the client's security sign-off (C1) is recorded.

## Dependencies
SKODA-709 (production host and CDN, D14), SKODA-907 (the vendor script list), SKODA-804 and 905 (GTM), SKODA-102
(`head.html`, the Trusted Types policy). SKODA-713's JSON-LD helper must pass this CSP. D16; client C1–C2.
