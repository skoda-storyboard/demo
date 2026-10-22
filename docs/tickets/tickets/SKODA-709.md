# SKODA-709, Production launch: CDN, DNS for www, the bare domain and 11 alias hosts, TLS, production host

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure / launch (configuration and client change requests, little code)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; the date itself is open, **Q-20**). **Go-live blocker.** The
  long pole is Škoda IT: the zone, the CDN choice and two change windows.
- **Estimate:** 3 SP for this ticket (CDN, `www` and the bare domain, both DNS change requests, coordination) ·
  AI-assisted 1–2d / manual 2–3d, excluding Škoda IT lead time (the review notes 2–4 weeks is common in corporate IT;
  not confirmed by Škoda IT) *(planning estimate, not a quote)*. Round 2 added about 2.5–3 SP (the second change
  request +0.5, the aliases that follow the switch +0.5, the alias rule spec +0.5–1, the document host +1), so the
  total is 6 SP: sub-tickets 709a alias hosts 2 SP, 709b document host 1 SP.
- **GitHub issue:** [#416](https://github.com/skoda-storyboard/demo/issues/416) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-01 (Critical, CONFIRMED), with G-G-01
  and G-KI-04 merged; G-F-08. Round 2: G-T5-01 (Medium, CONFIRMED, was High), G-T5-03 (go-live blocker), G-T5-07,
  G-T5-08 (Low, CONFIRMED), G-T5-09, G-T8-01 (High, CONFIRMED).

## Why
No ticket provisions the production edge. SKODA-103a assumes "the production CDN in front of aem.live (Adobe-managed
or BYO, per D14)", and **D14** is still 🔴. Measured on 2026-10-21 (CONFIRMED by the refuters):
- **DNS is Škoda's.** NS `skoda2.skoda-auto.cz`, `skoda3.skoda-auto.cz` and `isp2.viapraga.cz`; SOA
  `domains.skoda-auto.cz`. `www` is a CNAME to the bare domain, whose A records (18.157.207.232, 18.157.226.196,
  TTL 300) point at the WordPress nginx on AWS eu-central-1. The switch inverts this: `www` to the CDN, and the bare
  domain needs an A/ALIAS record or a redirect, because a zone apex can't be a CNAME. All 8 zones involved (the 6
  Storyboard-family zones, `skoda-auto.com`, `skoda-motorsport.com`) share these nameservers, so one Škoda IT team
  makes every change (G-T5-08).
- **TLS.** The origin certificate is Let's Encrypt (SAN bare domain + `www`, valid to **2026-11-30**). The CDN needs
  its own certificate for both names before the switch. While the names still point at WordPress, HTTP-01 can't
  validate, so the CDN's CA needs DNS validation records (`_acme-challenge` or the provider's own) in up to 6 zones
  for up to 13 names: a **second change request** before the switch (G-T5-03). No zone has CAA records, so any CA
  may issue. The site sends HSTS `max-age=31536000; includeSubDomains`, so browsers that visited allow no HTTP
  fallback. (The header also says `preload`, but hstspreload.org reports the domain is not on the list.)
- **Production host.** The demo still serves the non-production `robots.txt` (`Disallow: /`) and
  `x-robots-tag: noindex`. They clear only once the production host is configured (`cdn.prod.host`,
  `x-forwarded-host`, push invalidation).
- **11 alias hosts** (G-KI-04; split in G-T5-01): **3 follow the switch** through CNAME chains
  (`media.skoda-auto.com` → `media.skoda-storyboard.com` → apex; `storyboard.skoda-auto.com` → `www`), so they land
  on the production CDN on switch day; **8 have their own records** and stay on WordPress until their zones are
  edited. Scope and rules: SKODA-709a.
- **Zone records to keep** (G-F-08, G-T5-07): the apex TXT records (Search Console
  `google-site-verification=wle3hXqK…`, an unknown token `_40hmtm87…`, SPF `include:amazonses.com -all`) and the live
  subdomains `sgtm` (Google Cloud), `cdn` (CloudFront, until SKODA-520), `stage` and `test` (ELB, until SKODA-711) and
  `media` (CNAME to the apex). No wildcard and no MX; the full zone export isn't public.
- **Documents** are served from the raw AEM publish host, whose `robots.txt` is `Disallow: /` (G-T8-01, Q-21):
  SKODA-709b.

## Scope
**Client (Škoda IT, blocking):**
- **C1, D14:** which production CDN (Adobe-managed or Škoda's own) and who operates it. Register default:
  Adobe-managed unless Škoda IT requires its own.
- **C2, the zone:** lead time and change window for 2 change requests; may the bare domain become an ALIAS or a
  redirect to `www`? Send the full export of the `skoda-storyboard.com` zone. The windows are set with SKODA-710.
- **C3, aliases:** one Škoda IT owner for all alias zones; the keep or retire answer per host comes from the Media Room
  and Storyboard business owners (SKODA-709a).
- **C4, TXT records:** whose the `_40hmtm87…` token is, and that all 3 apex TXT records stay. The Search Console
  property holder and team access are asked in SKODA-713.

**Team:**
- **CDN set-up** per the aem.live go-live checklist: origin `main--demo--skoda-storyboard.aem.live`,
  `cdn.prod.host` and the push-invalidation credentials in the site config (credentials stored as secrets, and
  their renewal entered in SKODA-712's calendar).
- **Certificates** for `www`, the bare domain and every name in 709a and 709b, live on the CDN before the switch.
- **Bare domain:** 301 to `www` (or ALIAS, per C2), path and query kept.
- **Change request 1** (about 4–6 weeks before the switch): the certificate validation records for every CDN name,
  in every zone.
- **Change request 2** (the switch): the new `www` and apex records, the TTL plan, and a keep-list of every non-`www`
  record from the zone export (at least the 3 TXT records and `sgtm`, `cdn`, `stage`, `test`, `media`). The alias
  records go in this request or a dated later one (709a). Both dates go in SKODA-710's calendar.
- **Legacy-origin route:** if D2 (902 Option C), 903 or 904 keep any WordPress endpoint, give that origin its own
  hostname (with TLS from day 1) and a CDN path route; otherwise record "none".
- **WordPress admin paths** (G-F-10, Low, not re-verified): an optional CDN rule that returns 410 for `/wp/*`,
  `/wp-*.php` and `/xmlrpc.php` on the production host. If WordPress stays up as a legacy origin, restrict its admin
  by IP.
- **Sub-tickets:** SKODA-709a (alias hosts), SKODA-709b (document host, Q-21).

## Not in scope
- The rules that run on this CDN: trailing slash and case (SKODA-103a), legacy URL patterns (SKODA-103b), root locale
  routing (SKODA-1003), security headers (SKODA-714), RSS delivery (SKODA-908).
- Production sitemap, robots content per locale and Search Console monitoring: SKODA-713.
- `cdn.skoda-storyboard.com` (CloudFront, its own certificate) and its redirect-only role: SKODA-520, 103b.
- The cutover order, freeze and rollback: SKODA-710. Certificate and domain renewals after go-live: SKODA-712.
- Switching off the WordPress nginx: SKODA-711.
- `www.skodamedia.com`: a separate Digital News Press newsroom on Route 53 that shares no IP, nameserver or
  certificate with the WordPress origin (G-T5-09).

## Acceptance criteria
- [ ] D14 is 🟢 in the register: CDN type and operator named. C2–C4 have written answers with a named Škoda IT owner.
- [ ] Change request 1 is done and the CDN holds a valid certificate for `www` and the bare domain before change
      request 2 (checked with `openssl s_client` against the CDN).
- [ ] After the change, `www` resolves to the CDN; `https://skoda-storyboard.com/en/news?x=1` 301s to
      `https://www.skoda-storyboard.com/en/news?x=1`; no response is served over plain HTTP without a redirect.
- [ ] On the production host, `robots.txt` no longer disallows `/` and no page sends `x-robots-tag: noindex`; on
      `*.aem.page` and `*.aem.live` both are unchanged.
- [ ] A page published from DA shows its new content on the production host without a manual purge.
- [ ] After the change, every record on the keep-list is unchanged (DNS query against the zone export), and the
      Search Console property is still verified.
- [ ] The legacy-origin route exists with its own hostname, or the record says no WordPress endpoint is kept.
- [ ] SKODA-709a and 709b are closed.

## Dependencies
**D14**, **Q-20**, **Q-21** and Škoda IT (C1–C4); D2 / SKODA-902, 903, 904 (legacy origin). Blocks SKODA-103a, 103b,
1003, 713 and 714 on production. Timed by SKODA-710; feeds SKODA-711 and SKODA-712 (renewals). Sub-tickets:
SKODA-709a, 709b.
