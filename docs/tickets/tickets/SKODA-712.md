# SKODA-712, Operating model and year-one run calendar: hypercare, training, hand-over, renewals, monitoring

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / operations (configuration, documents and training; little code)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Training and the hand-over precede go-live; hypercare and
  the first renewal dates follow it (March–April 2027).
- **Estimate:** 4 SP team time · AI-assisted 2d / manual 3–4d, excluding training days *(planning estimate, not a
  quote)*. Was 3 SP; round 2 adds about 1–1.25 SP: domain and account rows ≈0.25, recurring operations ≈0.5,
  capacity checkpoints ≈0.25, vendor lines and the storage-key resend (inside the register).
- **GitHub issue:** [#419](https://github.com/skoda-storyboard/demo/issues/419) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-07 (High, CONFIRMED), G-G-04,
  G-KT-06, G-G-08 (Medium, not re-verified), the time challenge to G-G-07 in §6. Round 2 (not re-verified): G-T5-04,
  G-T8-04, G-T9-01, G-T9-02, G-T9-04, G-T9-05, G-T9-06, G-T9-07.

## Why
- **No operating model.** D15 (🔴) covers editorial roles only. Nothing names who fixes a broken block or a failed
  publish after go-live, or who is on call in the first weeks. SKODA-101a T4 replaces demo accounts in the two
  permission layers but doesn't move the GitHub repo (`skoda-storyboard/demo`), the AEM Code Sync app, the
  config-service admin role or the DA org. Only SKODA-511b asks the client for an operating owner, for the sync job.
- **Training.** `docs/client/AUTHOR-GUIDE.pdf` (17 pages) teaches the M1 demo blocks, with 0 sections on embargo
  (811), roles (809), translation (1005) or redirects; newsletter, banners and the Assets metadata authors must fill
  (D20, Q-11) are missing too. No training sessions are planned.
- **Costs and renewals in no register:** App Builder entitlement (C1, SKODA-521), hosted search (901), the ESP (904),
  Buzzsprout, Vimeo, OneTrust via Škoda. The first dates fall in January–August 2027 (G-KT-06, G-T9-01):
  - the CA/B maximum certificate life drops to 100 days on **2027-03-15**, so a manually bought OV certificate for
    the production CDN would need renewal about every 3 months;
  - the WordPress rollback deadline (about 2027-01-29 or 2027-03-30, fixed by SKODA-710, G-T9-02);
  - `cdn.skoda-storyboard.com`: DigiCert QuoVadis OV certificate issued to Škoda Auto a.s., valid to **2027-04-01**.
    It ran 198 days from 2026-09-15, so the 200-day cap already applies. Under SKODA-103b's C3 default the host
    stays as a permanent redirect-only host, so this is a **permanent** line (G-T8-04);
  - **7 registered domains** at 3 registrars: `skoda-storyboard.com`, `skodastoryboard.com`, `skoda-newsroom.com`
    and `skodanewsroom.com` on **2027-04-04** (joker.com); `skoda-storyboard.cz` on **2027-04-17** (ZONER via
    CZ.NIC); `skodamedia.com` on 2027-05-20 (Amazon Registrar, no known owner); `skoda-motorsport.com` (the sister
    site) on 2027-08-16 (joker.com). Retiring an alias redirect isn't dropping its domain: a lapsed press-facing
    newsroom domain can be registered by a third party (G-T5-04);
  - the site API key lasts at most 365 days; CDN purge and push-invalidation tokens and admin-API keys for any cron
    are outside 511b's register, which lists only the site API key, the AEM service credential and the S2S secret.
- **Vendor and account lines missing** (G-T9-07): the 3 registrar accounts, the DigiCert account, mailguide (it runs
  until D4's replacement and the re-permission hand-over), the AEM Sites, Assets and Dynamic Media terms (Media Bus
  and D20 depend on them), and the Real Media Library licence and AWS hosting (in SKODA-711, undated).
- **Recurring chores on no calendar** (G-T9-04, G-T9-03, G-T9-06):
  - the copyright year, hard-coded `© Škoda Auto a.s. 2026` in `/footer` and `/media-room/footer` (up to 12
    fragments with the locale footers, 1003), unless SKODA-304's amendment writes the current year;
  - the year vocabulary: `/config/tags.json` and `facet-labels.json` stop at 2026, so on 2 Jan 2027 the DA picker
    has no 2027 (seeded under SKODA-851, then every 1 Dec);
  - a new-model checklist: 16 model values today (Epiq and Peaq added in 2025–26); a launch needs the facet
    vocabulary and category tree (851), the header mega-menu, the home Models rail (11 tag pages) and a model page
    (207/208); `MODEL_CARD_IMAGES` is re-import only;
  - consent cycles: the newsletter re-permission period (asked in SKODA-908 C2) and the CCM's 365-day OneTrust
    reconsent, which Škoda runs; the OneTrust inventory Storyboard shows lists 0 `skoda-storyboard.com` cookies, and
    EDS adds the `skoda-media-cart` and `fonts-loaded` storage keys (907).
- **No capacity checkpoints** (G-T9-05): `/en/query-index.json` has 409 rows against 3,216 EN documents (CS 4,027;
  2025 added 263 EN and 391 CS items); `/en/media-feed.json` has 2,475 rows against the ≈20k-row sheet shard;
  `/redirects.json` has 6 rows, while 103b plans ≈16.4k.
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
  offices). Should Škoda policy require OV certificates, confirm the renewal process and the DigiCert account holder.
- Who holds the joker.com, ZONER and Amazon Registrar accounts, and is auto-renew on? Is `skodamedia.com` Storyboard's
  at all (G-T5-09 found a separate Digital News Press newsroom)?
- Contract end dates: AEM Sites/EDS, Assets, Dynamic Media, App Builder, mailguide, Vimeo, Buzzsprout, Real Media
  Library.

**Team:**
- **Support model:** tiers, contacts and the hypercare window with a named rota (dates set in SKODA-710's calendar).
- **Hand-over:** transfer of the GitHub org/repo, Code Sync, config-service admin and the DA org; keep one documented
  break-glass admin (with SKODA-101a T4). Admin and developer guides for the client team.
- **Training:** an M2 update of the author guide (the workflows above) and sessions per group.
- **Renewal and cost register:** one dated calendar with owner and reminder per line: production CDN certificate
  (automated, or the confirmed OV process), the `cdn.` certificate (permanent), the rollback deadline (reminder 14
  days before, from SKODA-710), CDN and admin-API tokens, every vendor licence and contract term above. SKODA-511b's
  register joins it.
- **Domain rows:** one per registered domain (registrar, account holder, auto-renew on or off, expiry). Each retired
  alias is kept renewed for a set period (for example 2 years, while 103b shows inbound traffic) or lapses with a
  recorded decision (SKODA-709a).
- **Recurring operations:** 1 Dec, next year in facet values and tags (851); 1 Jan, copyright year in every footer
  fragment (unless 304 automates it); the new-model checklist (owner: the editorial owner from 851 / D15); the
  newsletter re-permission dates once 908 C2 is answered; an annual cookie-notice review with the CCM owner, and the
  EDS storage-key list resent with each release that adds a key (907).
- **Capacity checkpoint**, quarterly: index rows and gzip bytes per locale, the largest feed shard, redirects rows,
  documents near 200 images; thresholds at 80% of each limit (the 50k index cap, the sheet shard size, the payload
  budget from the 401 amendment G-KT-05, the 200-image documents in 850), with an owner.
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
- [ ] The renewal register lists every certificate, all 7 domains, every token, key, account, licence and contract
      above with an expiry date, owner and reminder; the rollback-deadline reminder fires 14 days before it, and the
      first renewal reminder before 2027-03-15.
- [ ] The recurring operations are on the calendar with owners; the 1 Dec 2026 vocabulary step has run, so the DA
      picker offers 2027 on 2027-01-02.
- [ ] The first quarterly capacity check is recorded, with the measured values and thresholds.
- [ ] RUM data for the production host is visible to the client; the uptime check alerts on a forced failure; the
      404 review ran daily for 4 weeks.
- [ ] HEAD requests on the production host return 404 for the 179 files (for example
      `/docs/reviews/proposed-gh-commands.sh`, `/tools/importer/media/media-lib.mjs`); the site still works.

## Dependencies
**D15**; SKODA-101a (accounts), 511b (sync register), 521 (App Builder), 709, 709a (production host, CDN tokens,
alias decisions), 710 (hypercare dates, rollback deadline), 711 (licence and hosting dates), 713 (SEO monitoring),
520 and 103b (`cdn.` host), 304 (copyright year), 851 (year vocabulary), 907 (storage keys), 908 (re-permission),
401 (payload budget). Client: operating owner, vendor owners, registrar account holders.
