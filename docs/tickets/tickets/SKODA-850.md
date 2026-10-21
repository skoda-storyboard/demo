# SKODA-850, Day-2 authoring: scheduling, originals, embargo assets, path-limited publish, takedown, kits, templates

- **Epic:** E08, Editorial at Scale
- **Type:** setup / configuration + runbooks, with small template and check changes
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker: each item has a manual fallback, but
  without it HQ publishes by hand at the release minute and new downloads need a developer.
- **Estimate:** 6 SP · AI-assisted 2–3d / manual 4–6d, excluding Adobe onboarding and client AEM admin time *(planning
  estimate, not a quote)*. Assumes the native tools cover the author UX. A custom Downloads-row plugin (3–5 SP in
  the finding) would be a sub-ticket.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-01 (+ G-T1-03, G-KT-08), G-KJ-02
  (+ G-T1-01), G-KJ-03 (+ G-T1-02), G-T1-04 (all High, CONFIRMED); G-T1-05, G-KJ-07, G-T1-06, G-T1-07, G-T1-08, G-T2-03,
  G-KT-09 (Medium/Low, not re-verified).

## Why
- **HQ schedules.** In the last 12 months about half of EN stories (53 of 103) and EN releases (31 of 66) went live on
  an exact quarter hour, against about 7% by chance; CS 33–37%, SK/SR/DE 6–12%. EN releases cluster at 10:00 (14)
  and 09:00 (8). Requirement 6.3 "schedule" maps only to closed SKODA-602; SKODA-811 lists scheduling as "Related".
  The native tools are recorded nowhere: EW **Schedule Publish** (one document at a time; needs a prepare-tab row and
  registration at `da.live/apps/scheduler`), **Snapshots** (scheduling is early access) and **Request Publish** (Adobe
  onboarding, an email-sending API, allowed domains). The crontab sheet suits ops jobs only: `basic_author` can
  write it.
- **Downloads need a developer.** The 2026-10-19 EN release has 22 download links (20 images, 1 MP4, 1 PDF); 13 of the
  last 30 EN releases have body downloads. Each author path fails a gate:
  - DA upload caps MP4 at 36 MB and PDF at 20 MB and refuses ZIP; 71 of 91 migrated MP4s exceed 36 MB (median
    188 MB) and the Epiq kit ZIP is 728 MB. (The limits page says limits can be raised per customer.)
  - `media-cart-resolver.js` accepts only the DAM host or the source host, so Media Bus files aren't cart-able.
  - SKODA-101a I4 gives authors read access to AEM Assets. The author guide says "ask the project team".
  
  The refuters' workaround: a press group with AEM write + publish pastes DAM publish URLs into Downloads rows.
- **Embargoed assets leak.** The DA Assets picker needs a *published* asset, the AEM publish tier answers anonymously
  (HEAD 200, `access-control-allow-origin: *`), and the 511a feed sync lists published assets. Building a launch page
  ahead of time makes its assets public. D9 is green, but it has no asset mechanism. Preview-only images are also
  served on `.aem.live` (2 of 2); low impact alone, as hashes can't be enumerated.
- **Publish has no path.** The Edge Delivery `publish` role is site-wide (`live:write`, `live:delete`), and DA write
  implies delete. Any CS or agency publisher can publish or unpublish EN pages. 101a tests only DA edit scope.
- **Shared root docs** (`/redirects`, `/metadata`, `/nav`, `/footer`, `/media-room/*`) have no permission row, so a
  locale editor can't add a redirect. `/cs/nav` and `/sk/nav` are 200 on `.aem.page`, 404 on `.aem.live`.
- **Takedown and rename leave copies.** Unpublish needs the source deleted first; Media Bus copies stay reachable; RSS,
  media feed, app, carts and CDN keep theirs. The guide's rename steps never unpublish the old path, and a page leaves
  the index only on unpublish (409 EN index rows today). Whether a DA move unpublishes was not tested.
- **New press kits by hand.** The chapter bar is authored in every chapter (22 links × 14 Epiq docs). A chapter over
  200 images returns 409 at preview (Peaq 2 Images: 247); only the SKODA-806 importer splits it. 806a is migration-only.
- **Templates are EN-only.** `templates-spec.mjs` has 9 literal `/en…` values, 6 source-CDN images and 5 `www` links;
  SKODA-520's census leaves `/library/**` out.

## Scope
**Client:**
- DAM team: how do launch assets stay hidden in AEM Assets until release, and who releases them?
- Request Publish: which email service and sender, which agency domains? Legal: the required takedown time.
- **D-4** (authoring review, not yet in the register): Media Box from a DAM folder (recommended) or authored rows.

**Team:**
- **Scheduling:** enable Schedule Publish; rules for who may schedule, CET/CEST in the UI vs UTC, the 5-minute grain,
  the refresh order (index, RSS, media feed, CDN purge, app). Snapshots for multi-locale launches; ask Adobe for
  snapshot scheduling. Onboard Request Publish. Map 6.3 here; amend 811 to depend on it.
- **Originals:** an AEM Assets editor group with upload + publish per tree (amends 101a I4); a folder convention
  (`/content/dam/storyboard/{loc}/{type}/{slug}/`); picker settings (`aem.asset.mime.renditions`) that link originals;
  the 1920px rendition with SKODA-902; new kit ZIPs as a DAM upload (amends 806a).
- **Embargo asset gate** (amends 811, 511a): an embargo marker (field or restricted folder) the feed sync skips until
  the date; the launch preview avoids published delivery URLs; document that Media Bus preview images are public by URL.
- **Path-limited publish** (amends 809, 101a T2, with D15): few HQ/MR publishers plus Request Publish approvers per
  `/{loc}/*` pattern, or site-wide publish with SKODA-812 audit. Per-document rows for the shared root docs (amends
  101a T1), and a redirect-request step for locale editors. Publishing the locale chrome is a go-live step (1006).
- **Runbooks** for SKODA-712's guide: takedown (unpublish order, 410 vs redirect, CDN purge, feed refresh, Media Bus
  removal via Adobe support); rename (slashless redirect row → publish → move → publish new → unpublish old →
  dead-link check → re-link the translation pair, 1005).
- **Press kits and templates** (amends 805, 842): the chapter bar from one per-kit source; a "press-kit image group as
  fragment" library entry, an image count in the pre-publish check (AR-17); per-locale templates or a `[locale]`
  prompt the check rejects; DAM/Media Bus URLs and site-relative links in `templates-spec.mjs`; `/library/**` in 520.

## Not in scope
- Sign-in, IdP and preview protection (SKODA-101a). Asset-to-page lifecycle (SKODA-522, D20). Translation (1005).
- Feed variants and delivery (SKODA-405). Ops cron jobs in the crontab sheet. A serverless cart ZIP (SKODA-902).

## Acceptance criteria
- [ ] A release scheduled for 10:00 CET goes live within 5 minutes of 09:00 UTC; an EN + CS timed release was
      rehearsed, index and feeds included.
- [ ] An HQ and an SK author, without repo access, publish a release with a Media Box, a PDF and an MP4; the cart
      adds them.
- [ ] Before release, an embargoed asset is in no media feed and its delivery URL isn't linked from any public page.
- [ ] A CS author can't publish `/en/x` without approval, or the D15 decision records site-wide publish plus audit.
- [ ] A CS editor gets a redirect live without write on `/metadata`; after a rename the old path is in no query index.
- [ ] Renaming a kit chapter edits one document; a 201-image chapter is flagged before preview.
- [ ] A CS page from each template has 0 `/en` values and 0 source-CDN references; the runbooks are in the guide.

## Dependencies
D9, **D15**, D-4, D20; Adobe onboarding (Request Publish, snapshot scheduling); client AEM admins. SKODA-101a, 809,
811, 812, 511a, 517, 522, 805, 806, 806a, 842, 902, 1005, 1006, 103, 103a, 520, 712 (guide, training).
