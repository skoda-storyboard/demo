# SKODA-709, Production launch: CDN, DNS for www, the bare domain and 11 alias hosts, TLS, production host

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure / launch (configuration and client change requests, little code)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; the date itself is open, **Q-20**). **Go-live blocker.** The
  long pole is Škoda IT: the zone, the CDN choice and the change window.
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding Škoda IT lead time (the review notes 2–4
  weeks is common in corporate IT; not confirmed by Škoda IT) *(planning estimate, not a quote)*
- **GitHub issue:** [#416](https://github.com/skoda-storyboard/demo/issues/416) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-01 (Critical, CONFIRMED), with G-G-01
  and G-KI-04 merged; G-F-08.

## Why
No ticket provisions the production edge. SKODA-103a assumes "the production CDN in front of aem.live (Adobe-managed
or BYO, per D14)", and **D14** is still 🔴. Measured on 2026-10-21 (CONFIRMED by the refuters):
- **DNS is Škoda's.** NS `skoda2.skoda-auto.cz`, `skoda3.skoda-auto.cz` and `isp2.viapraga.cz`; SOA
  `domains.skoda-auto.cz`. `www` is a CNAME to the bare domain, whose A records (18.157.207.232, 18.157.226.196,
  TTL 300) point at the WordPress nginx on AWS eu-central-1. The switch inverts this: `www` to the CDN, and the bare
  domain needs an A/ALIAS record or a redirect, because a zone apex can't be a CNAME.
- **TLS.** The origin certificate is Let's Encrypt (SAN bare domain + `www`, valid to **2026-11-30**). The CDN needs
  its own certificate for both names before the switch. The site sends HSTS `max-age=31536000; includeSubDomains`,
  so browsers that visited allow no HTTP fallback. (The header also says `preload`, but hstspreload.org reports the
  domain is not on the list.)
- **Production host.** The demo still serves the non-production `robots.txt` (`Disallow: /`) and
  `x-robots-tag: noindex`. They clear only once the production host is configured (`cdn.prod.host`,
  `x-forwarded-host`, push invalidation).
- **11 alias hosts** (G-KI-04, CONFIRMED) resolve to the same WordPress IPs and redirect from its nginx with their own
  Let's Encrypt certificates (valid to 30 Nov 2026): `media.skoda-auto.com`, `storyboard.skoda-auto.com`,
  `media.skoda-storyboard.com`, `skoda-storyboard.cz`, `www.skoda-storyboard.cz`, `skodastoryboard.com`,
  `www.skodastoryboard.com`, `skoda-newsroom.com`, `www.skoda-newsroom.com`, `skodanewsroom.com`,
  `www.skodanewsroom.com`. That is 6 registered domains in 3 owner families; 2 hosts sit in Škoda's own
  `skoda-auto.com` zone. Moving `www` doesn't move them, and today's rules already break deep links:
  `media.skoda-auto.com/en/press-releases/` → `/en/media-room/en/press-releases/`, `www.skoda-storyboard.cz/cs/…` →
  `/cs/cs/…`. `www.skodamedia.com` (CloudFront, 403) is unknown.
- **TXT records** (G-F-08, Low, not re-verified): Search Console is verified by the apex TXT
  `google-site-verification=wle3hXqK…` (no meta tag on the pages). The zone also holds an unknown token
  (`_40hmtm87…`) and SPF `include:amazonses.com -all`. All 3 must survive the zone edit.

## Scope
**Client (Škoda IT, blocking):**
- **C1, D14:** which production CDN (Adobe-managed or Škoda's own) and who operates it. Register default:
  Adobe-managed unless Škoda IT requires its own.
- **C2, the zone:** who changes `skoda-storyboard.com`, with what lead time and change window; may the bare domain
  become an ALIAS or a redirect to `www`? The window itself is set with SKODA-710 (Q-20).
- **C3, aliases:** which of the 11 hosts must keep working after go-live, and who changes `media.skoda-auto.com` and
  `storyboard.skoda-auto.com` in the `skoda-auto.com` zone and the newsroom and `.cz` domains.
- **C4, TXT records:** whose the `_40hmtm87…` token is, and that all 3 apex TXT records stay. The Search Console
  property holder and team access are asked in SKODA-713.

**Team:**
- **CDN set-up** per the aem.live go-live checklist: origin `main--demo--skoda-storyboard.aem.live`,
  `cdn.prod.host` and the push-invalidation credentials in the site config (credentials stored as secrets, and
  their renewal entered in SKODA-712's calendar).
- **Certificates** for `www`, the bare domain and every kept alias, live on the CDN before the DNS change.
- **Bare domain:** 301 to `www` (or ALIAS, per C2), path and query kept.
- **Alias inventory:** one row per host (zone owner, decision: 301 at the CDN with the path kept and mapped per
  locale, a redirect by its registrar or Škoda IT, or retire), plus test URLs for the redirect harness (SKODA-713).
- **DNS change request** to Škoda IT: the new `www` and apex records, the 3 TXT records kept, the TTL plan.
- **Legacy-origin route:** if D2 (902 Option C), 903 or 904 keep any WordPress endpoint, give that origin its own
  hostname and a CDN path route; otherwise record "none".
- **WordPress admin paths** (G-F-10, Low, not re-verified): an optional CDN rule that returns 410 for `/wp/*`,
  `/wp-*.php` and `/xmlrpc.php` on the production host. If WordPress stays up as a legacy origin, restrict its admin
  by IP.

## Not in scope
- The rules that run on this CDN: trailing slash (SKODA-103a), legacy URL patterns (SKODA-103b), root locale routing
  (SKODA-1003), security headers (SKODA-714), RSS delivery (SKODA-908).
- Production sitemap, robots content per locale and Search Console monitoring: SKODA-713.
- `cdn.skoda-storyboard.com` (CloudFront, its own certificate): SKODA-520.
- The cutover order, freeze and rollback: SKODA-710. Certificate and domain renewals after go-live: SKODA-712.
- Switching off the WordPress nginx: SKODA-711 (the aliases must move first).

## Acceptance criteria
- [ ] D14 is 🟢 in the register: CDN type and operator named. C2–C4 have written answers with a named Škoda IT owner.
- [ ] Before the DNS change, the production CDN serves the site for `www` and the bare domain with a valid
      certificate for both names (checked with `openssl s_client` against the CDN).
- [ ] After the change, `www` resolves to the CDN; `https://skoda-storyboard.com/en/news?x=1` 301s to
      `https://www.skoda-storyboard.com/en/news?x=1`; no response is served over plain HTTP without a redirect.
- [ ] On the production host, `robots.txt` no longer disallows `/` and no page sends `x-robots-tag: noindex`; on
      `*.aem.page` and `*.aem.live` both are unchanged.
- [ ] A page published from DA shows its new content on the production host without a manual purge.
- [ ] Each of the 11 alias hosts has a recorded decision and owner. Every kept alias answers with a valid certificate,
      and `media.skoda-auto.com/en/press-releases/` and `www.skoda-storyboard.cz/cs/tiskove-zpravy/` end on a 200
      page with no doubled path segment.
- [ ] After the change, the 3 apex TXT records are unchanged (DNS query) and the Search Console property is still
      verified.
- [ ] The legacy-origin route exists with its own hostname, or the record says no WordPress endpoint is kept.

## Dependencies
**D14**, **Q-20** and Škoda IT (C1–C4); D2 / SKODA-902, 903, 904 (legacy origin). Blocks SKODA-103a, 103b, 1003,
713 and 714 on production. Timed by SKODA-710; feeds SKODA-711 (alias moves before the hosting ends) and SKODA-712
(renewals).
