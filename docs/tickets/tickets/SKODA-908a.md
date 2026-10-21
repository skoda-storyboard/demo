# SKODA-908a, Mobile app at cutover: content contract and new-article notification with de-duplication

- **Epic:** E09, Dynamic Services
- **Type:** integration / cutover (vendor contract, a feed or JSON contract, a notification trigger)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The app must show current content against the EDS host
  on the day of the DNS switch. The long pole is iComVision.
- **Estimate:** 4 SP · AI-assisted 2d / manual 3–4d, excluding vendor time *(planning estimate, not a quote)*. From
  the review: 3–8 SP depending on the contract (G-B-01), +1–2 SP for an App Builder poller or 0 if the vendor polls
  (G-T6-02). 4 SP assumes the app can read an index-shaped JSON or the RSS feed and the trigger is a vendor poll or
  a crontab `http` task. An App Builder adapter raises it to about 6–8 SP: re-estimate and split when C1 is answered.
- **GitHub issue:** to create
- **Parent:** SKODA-908
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-01 (High, PLAUSIBLE), G-T6-02
  (Medium, not re-verified).

## Why
- **The app is live (G-B-01, PLAUSIBLE).** The Škoda Media Room app (iOS id420627875, Android
  `com.icomvision.skodamediaservices`) is at v7.1.37 of 2026-03-10, seller ŠKODA AUTO a.s., Android package by
  iComVision. Its listing promises press releases, press kits, Stories, annual reports, images and videos, and
  new-article notifications. The docs know only its store badges (304, 810).
- **Its likely sources stop at the switch:** `wp/v2` posts and releases, the uncalled `site-info` routes of G-B-02,
  `/{loc}/feed/`. **Not observed:** the app may read its own iComVision backend. It becomes Critical if the client
  confirms it reads WordPress.
- **Notifications need a trigger (G-T6-02).** EDS has no outbound webhook on publish, so a notification needs a
  vendor poller (an index or RSS diff), an App Builder poller with state (credentials per SKODA-521) or a crontab
  `http` task.
- **Re-publishes are routine.** Of the 40 latest releases per locale, 29 EN and 26 CS were last modified at least
  2 minutes after going live: 18 EN and 16 CS within an hour, which matches the AI-audio insert (SKODA-850a). Both
  2026-10-19 releases were edited the next day. A trigger fired on every publish would send duplicates; without a
  trigger, notifications stop silently on 2 Jan.

## Scope
- **Client:** C1 in the parent (URLs, parameters, auth, the notification trigger and its de-duplication key).
- **T1 Content contract.** Write the contract C1 returns: an index- or sheet-shaped JSON with the fields the app
  reads, the RSS feed (908b), or an App Builder adapter (credentials per SKODA-521).
- **T2 Notification trigger.** Pick it with C1: vendor poll, App Builder poller or crontab `http` task. Key it on a
  new path in the index, not on a publish event, so a re-publish or an edit sends nothing.
- **Test** both with the vendor before DNS, then on launch day; the result goes into SKODA-710b's register.

## Not in scope
- Feed delivery: SKODA-908b. Timed releases and the AI-audio step: SKODA-850a. Store badges: SKODA-304, 810.

## Acceptance criteria
- [ ] C1 is answered in writing, and the app shows current releases and Stories against the EDS host (tested before
      DNS with the vendor, then on launch day).
- [ ] A new release sends exactly one notification within the time agreed with the vendor; a re-publish or edit
      sends none (G-T6-02).
- [ ] An unpublished release doesn't leave a dead notification target.

## Dependencies
Client and iComVision (C1). SKODA-908 (parent), 908b (RSS), 521 (credentials), 401 (index), 850a (re-publish after
the AI audio), 710b (register), 709 (production host).
