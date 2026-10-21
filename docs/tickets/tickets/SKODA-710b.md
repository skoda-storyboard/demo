# SKODA-710b, Publish side-effect register and one EN and one CS test release on the production host

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch / QA (a register, client and agency questions, a launch test)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The test releases run **before the DNS change**.
- **Estimate:** 1 SP · AI-assisted 0.5–1d / manual 1–2d, excluding client and agency time *(planning estimate, not a
  quote)*. From the review: +1 SP (register and rehearsal).
- **GitHub issue:** to create
- **Parent:** SKODA-710
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T6-01 (Medium, not re-verified).

## Why
- A WordPress publish refreshes the nginx page cache, syncs ElasticPress (search and every listing), rebuilds feeds
  and Yoast sitemaps, and (inferred from the app listing, the 4 mailguide lists and the AI-audio timings) sets off an
  app notification, newsletter sends and an AI-audio episode.
- An EDS publish does purge, index and sitemap only; the crontab `http` task is the only built-in outbound call.
- The pieces sit in SKODA-709 (purge), 850 (a one-line refresh order), 851 (generated data) and 908 (consumers). No
  ticket holds the full list, and no criterion publishes a test release on the production host and checks every
  downstream effect. A missed effect fails silently: a consumer just stops getting updates.
- The review's register has **14 effects**: 7 covered by a ticket, 2 with nothing to replicate, 4 under-scoped,
  1 unknown (server-side hooks, which need the agency).

## Scope
**Client and agency:**
- Hosting agency: `wp plugin list`, the cron events, and the publish hooks in `mu-plugins/` and `plugins/`.
- The answers owned elsewhere, entered as register rows: the app notification trigger (908, G-T6-02), what starts
  each mailguide send (908, G-T6-04), who produces the AI audio (850, G-T6-05).

**Team:**
- **Register** in the runbook, seeded from the review's 14 effects: effect, WordPress trigger, EDS trigger, owner,
  test. Each row is covered, replaced, signed off as manual, or dropped with a reason.
- **Test releases:** one EN and one CS release published on the production host before DNS, checked against every
  row: page, listings, feed, sitemap, app notification, newsletter (if automatic) and AI audio.

## Not in scope
- Building the triggers themselves: SKODA-908 (app, newsletter), 850 (AI audio, timed releases), 405 (feeds).
- CDN purge set-up: SKODA-709.

## Acceptance criteria
- [ ] The register lists the 14 effects (plus any the agency answer adds), each with an EDS trigger or a recorded
      manual step, an owner and a test.
- [ ] One EN and one CS test release published on the production host before DNS: page, listings, feed, sitemap,
      app notification, newsletter (if automatic) and AI audio are each confirmed, or signed off as manual.
- [ ] The register and the test results are linked from the runbook (SKODA-710).

## Dependencies
SKODA-710 (runbook), 709 (production host, purge), 850, 851, 908, 405. Client: hosting agency, Škoda Communications,
iComVision (app).
