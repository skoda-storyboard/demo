# SKODA-709a, Alias hosts: which follow the switch, certificates, redirect rules per family, keep or retire

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure / launch (CDN rules, certificates, client decisions)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; date open, **Q-20**). The 3 hosts that follow the switch
  must work **on switch day**.
- **Estimate:** 2 SP · AI-assisted 1d / manual 2d, excluding Škoda IT lead time *(planning estimate, not a quote)*.
  From the review: the switch-day hosts +0.5 SP, the rule spec and tests +0.5–1 SP, on top of the alias inventory
  already in SKODA-709.
- **GitHub issue:** [#437](https://github.com/skoda-storyboard/demo/issues/437) (created 2026-10-21, sub-issue of #416)
- **Parent:** SKODA-709
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KI-04 (CONFIRMED), G-T5-01 (Medium,
  CONFIRMED, was High), G-T5-02, G-T5-04, G-T5-05, G-T5-08 (Low, CONFIRMED), G-T8-04, G-T9-01.

## Why
- **11 alias hosts** resolve to the WordPress IPs and redirect from its nginx with Let's Encrypt certificates valid to
  30 Nov 2026: `media.skoda-auto.com`, `storyboard.skoda-auto.com`, `media.skoda-storyboard.com`,
  `skoda-storyboard.cz`, `www.skoda-storyboard.cz`, `skodastoryboard.com`, `www.skodastoryboard.com`,
  `skoda-newsroom.com`, `www.skoda-newsroom.com`, `skodanewsroom.com`, `www.skodanewsroom.com`.
- **3 follow the switch** (G-T5-01, DoH re-query): `media.skoda-auto.com` is a CNAME to `media.skoda-storyboard.com`,
  which is a CNAME to the apex; `storyboard.skoda-auto.com` is a CNAME to `www`. When `www` and the apex move, they
  reach the production CDN at once. Without a certificate and a host rule there, browsers get a name or domain error,
  and `storyboard.skoda-auto.com` sends HSTS, so visitors can't click through. A rollback brings them back.
- **8 have their own records** (the `.cz`, `skodastoryboard` and newsroom families; each `www` is a CNAME to its own
  apex). They stay on WordPress until their zones are edited.
- **Bundled certificates** (G-T5-02): one certificate holds `media.skoda-auto.com` and `media.skoda-storyboard.com`
  (moving) with the 4 newsroom names (staying); another holds `storyboard.skoda-auto.com` (moving) with
  `skodastoryboard.com` and its `www` (staying). If the agency renews by HTTP-01 (method unknown), the renewal fails
  once 1 name points at the CDN, and the 6 staying names lose TLS, around late March 2027 on a 60-day cycle.
- **Path handling is WordPress's guess** (G-T5-05). The nginx prepends `/en/media-room/` (media and newsroom) or `/cs/`
  (`.cz`), and WordPress guesses a page: `/en/media-room/en/press-releases/` lands on `/en/news/`,
  `skoda-newsroom.com/en/` on an unrelated press release. EDS has no guess, so a 1:1 port gives 404s. `media.skoda-auto.com` also has 9,105
  archived URLs from the old SharePoint portal (`/Pictures` 4,636, `/app` 1,429, `/share` and `/sharesecure` 995,
  `/sitecollectionimages` 258, `/_layouts` 202); 723 `/Pictures/` URLs were first captured in 2024–26, and 2 of 2
  sampled are 404 today. Plain HTTP on every alias is a 302.
- **One DNS operator** (G-T5-08): all alias zones are run by Škoda IT; the "3 owner families" are registrar and brand
  groups. The decision per host is a business one (Media Room or Storyboard).
- **Domains lapse** (G-T5-04, G-T9-01): `skodastoryboard.com`, `skoda-newsroom.com` and `skodanewsroom.com` expire on
  2027-04-04 (joker.com), `skoda-storyboard.cz` on 2027-04-17 (ZONER). Retiring a redirect isn't dropping a domain; a
  lapsed press-facing newsroom domain can be registered by a third party.

## Scope
**Client:**
- Media Room and Storyboard business owners: keep or retire per host, and for each retired host, keep the
  registration defensively, yes or no, for how long (e.g. 2 years while SKODA-103b shows inbound traffic).
- SharePoint-era paths on `media.skoda-auto.com`: 410, or 301 to the Media Room landing?
- Hosting agency: the ACME challenge type and renewal schedule; can the bundled certificates be split before the
  switch?

**Team:**
- **Alias inventory:** one row per host (zone, record type, "follows the switch" or "own record", certificate bundle,
  decision, renewal owner), plus a `cdn.skoda-storyboard.com` row (permanent redirect-only host, 103b C3 default,
  G-T8-04; set up in 520/103b).
- **Switch-day hosts:** either certificates and host rules for the 3 on the production CDN by change request 2, or
  Škoda IT replaces the 3 CNAMEs with A records to the WordPress IPs in change request 1, which keeps them on nginx
  until a dated later move. Record which.
- **Rule spec per family** on the CDN: root to `/en/media-room` (media, newsroom) or `/cs` (`.cz`); `/{loc}/x` kept as
  `/{loc}/x` on `www` with no added prefix; the SharePoint patterns (`/Pictures/*`, `/app/*`, `/share*/*`,
  `/_layouts/*`, `/sitecollectionimages/*`, `/{loc}/Files/*`) to 410 or the Media Room landing; HTTP to HTTPS as a 301.
- **Own-record moves:** the change and its date, before the first post-switch renewal of the bundled certificates
  (dated in SKODA-710's calendar), or the agency splits the bundles first.
- **Test URLs:** about 15 per the review, sampled from the archive list, including legacy portal paths, handed to
  SKODA-713's redirect harness.

## Not in scope
- CDN set-up, `www`, the apex and the change requests themselves: SKODA-709. Registrar renewals: SKODA-712.
- The `cdn.` redirect host: SKODA-520, 103b. The nginx switch-off: SKODA-711.

## Acceptance criteria
- [ ] Every alias host has a row with its class, decision, owner and (if retired) a registration decision.
- [ ] On switch day, the 3 hosts that follow it answer with a valid certificate from the CDN (or still from nginx, if
      pinned by A records), and `media.skoda-auto.com/en/press-releases/` ends on a 200 page with no doubled segment.
- [ ] `www.skoda-storyboard.cz/cs/tiskove-zpravy/` ends on a 200 page with no doubled segment; each family root ends
      on its landing page; `http://` on each kept alias returns 301.
- [ ] A sampled SharePoint path returns the agreed 410 or redirect; none ends on an unrelated page.
- [ ] The own-record aliases have moved (or the certificates are split) before the dated renewal, and each kept alias
      still answers with a valid certificate after that date.
- [ ] The test URLs are in SKODA-713's harness and pass.

## Dependencies
SKODA-709 (CDN, change requests), 710 (calendar), 713 (harness), 712 (domain register), 103b (SharePoint patterns,
`cdn.` host), 711 (nginx). Client: business owners per brand, Škoda IT, the hosting agency.
