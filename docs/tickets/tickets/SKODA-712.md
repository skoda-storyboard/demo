# SKODA-712, Operating model and year-one run calendar: hypercare, training, hand-over, renewals, monitoring

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / operations (configuration, documents and training; little code)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Training and the hand-over precede go-live; hypercare and
  the first renewal dates follow it (March–April 2027).
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding training days *(planning estimate, not a
  quote)*
- **GitHub issue:** [#419](https://github.com/skoda-storyboard/demo/issues/419) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-07 (High, CONFIRMED), G-G-04,
  G-KT-06, G-G-08 (Medium, not re-verified), the time challenge to G-G-07 in §6.

## Why
- **No operating model.** D15 (🔴) covers editorial roles only. Nothing names who fixes a broken block or a failed
  publish after go-live, or who is on call in the first weeks. SKODA-101a T4 replaces demo accounts in the two
  permission layers but doesn't move the GitHub repo (`skoda-storyboard/demo`), the AEM Code Sync app, the
  config-service admin role or the DA org. Only SKODA-511b asks the client for an operating owner, for the sync job.
- **Training.** `docs/client/AUTHOR-GUIDE.pdf` (17 pages) teaches the M1 demo blocks, with 0 sections on embargo
  (811), roles (809), translation (1005) or redirects; newsletter, banners and the Assets metadata authors must fill
  (D20, Q-11) are missing too. No training sessions are planned.
- **Costs and renewals in no register:** App Builder entitlement (C1, SKODA-521), hosted search (901), the ESP (904),
  Buzzsprout, Vimeo, OneTrust via Škoda. The first dates fall in Q1 2027 (G-KT-06):
  - `cdn.skoda-storyboard.com`: DigiCert QuoVadis OV certificate issued to Škoda Auto a.s., valid to **2027-04-01**
    (until SKODA-520 retires the host);
  - the CA/B maximum certificate life drops to 100 days on **2027-03-15**, so a manually bought OV certificate for
    the production CDN would need renewal about every 3 months;
  - the domain `skoda-storyboard.com` expires **2027-04-04** (joker.com, renewed yearly);
  - the site API key lasts at most 365 days; CDN purge and push-invalidation tokens and admin-API keys for any cron
    are outside 511b's register, which lists only the site API key, the AEM service credential and the S2S secret.
- **No monitoring** (G-G-04). RUM is on in the vendored `aem.js` (1 in 100 sampling), but SKODA-702 records "Field
  data … not verified (needs the domain key)", and nobody holds the key. After the switch, RUM's 404 checkpoint is
  the safety net for ≈ 15,000 slashed legacy URLs (103a) and 42,275 attachment pages (103b), and nobody is assigned
  to read it. There is no uptime check and no JS-error alerting; 511b monitors the sync job only.
- **Tooling is public** (G-G-08). `.hlxignore` excludes `*.md` and `docs/client/`, but 179 other committed files
  under `docs/`, `tools/` and `poc/` are served (8 of 9 sampled return 200 on `.aem.live`), e.g.
  `docs/reviews/proposed-gh-commands.sh`, `docs/planning/skoda-published-url-set.txt`,
  `tools/importer/media/media-lib.mjs`; their siblings name the AEM author host. No secrets were found. Once the
  production host points at this repo, they are part of `www`.

## Scope
**Client:**
- Who operates Storyboard after go-live (code, content, accounts), and for how long do you want Adobe hypercare?
- Name the owners for each register line, the alert channel, and the training groups (HQ, Media Room agency, local
  offices). Should Škoda policy require OV certificates, confirm the renewal process.

**Team:**
- **Support model:** tiers, contacts and the hypercare window with a named rota (dates set in SKODA-710's calendar).
- **Hand-over:** transfer of the GitHub org/repo, Code Sync, config-service admin and the DA org; keep one documented
  break-glass admin (with SKODA-101a T4). Admin and developer guides for the client team.
- **Training:** an M2 update of the author guide (the workflows above) and sessions per group.
- **Renewal and cost register:** one dated calendar with owner and reminder per line: production CDN certificate
  (automated, or the confirmed OV process), the `cdn.` certificate, the domain, CDN and admin-API tokens, every
  vendor licence. SKODA-511b's register joins it.
- **Monitoring:** the RUM domain key for the production host and RUM explorer access for the client; a daily
  404/redirect review for the first 4 weeks feeding the redirects sheet; an uptime check on 5 URLs and
  `query-index.json`; a JS-error alert; a named on-call for the first 2 weeks.
- **Served files:** add `docs/`, `tools/` and `poc/` to `.hlxignore` (or move the tooling to its own repo). A grep
  today finds no block or script that loads from these paths; re-check before the change.

## Not in scope
- Editorial roles and permissions: D15, SKODA-809, 101a. Sync-job monitoring: SKODA-511b.
- Search Console and SEO monitoring: SKODA-713. The cutover runbook: SKODA-710.

## Acceptance criteria
- [ ] The client names the operating owner and the hypercare length; the support model is written, with contacts.
- [ ] The repo, Code Sync, config-service admin and DA org are administered by client accounts; the break-glass admin
      is documented and tested.
- [ ] The M2 author guide covers embargo, roles, translation, redirects, newsletter, banners and Assets metadata;
      each training group had a session.
- [ ] The renewal register lists every certificate, domain, token, key and licence above with an expiry date, owner
      and reminder; the first reminder fires before 2027-03-15.
- [ ] RUM data for the production host is visible to the client; the uptime check alerts on a forced failure; the
      404 review ran daily for 4 weeks.
- [ ] HEAD requests on the production host return 404 for the 179 files (for example
      `/docs/reviews/proposed-gh-commands.sh`, `/tools/importer/media/media-lib.mjs`); the site still works.

## Dependencies
**D15**; SKODA-101a (accounts), 511b (sync register), 521 (App Builder), 709 (production host, CDN tokens), 710
(hypercare dates), 713 (SEO monitoring), 520 (`cdn.` host retirement). Client: operating owner and vendor owners.
