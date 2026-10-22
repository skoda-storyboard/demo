# SKODA-908c, Newsletter at cutover: manage and landing pages, consent renewal, mailguide send triggers

- **Epic:** E09, Dynamic Services
- **Type:** integration / cutover (pages, ESP configuration; amends SKODA-904)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The manage pages must answer on the day of the DNS switch.
  The long pole is mailguide (D4).
- **Estimate:** 4 SP · AI-assisted 2d / manual 3–4d, excluding vendor time *(planning estimate, not a quote)*. From
  the review: G-B-06 1–2 SP, G-KJ-05 1–2 SP, G-KT-04 1–2 SP once the contract is known; G-T6-04 0 SP if sends are
  manual. If a WordPress hook starts the sends and must be rebuilt (+1–2 SP, an App Builder poller), that is a new
  sub-ticket of SKODA-908.
- **GitHub issue:** [#454](https://github.com/skoda-storyboard/demo/issues/454) (created 2026-10-21, sub-issue of #424)
- **Parent:** SKODA-908
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-06 (Medium, CONFIRMED, was High),
  G-KJ-05, G-KT-04, G-T6-04 (Medium, not re-verified).

## Why
- **Manage pages (G-B-06, G-KJ-05).** skoda-motorsport.com links "Manage subscription" twice to
  `/en/newsletter-settings/`. CS manages at `/cs/sprava-newsletteru/` (mailguide login form); SK lands on
  `/sk/odber-noviniek/` and `/sk/odhlasenie-z-odberu-noviniek/` after subscribe and unsubscribe. 0 docs name the
  3 locale pages, and a page import drops the form. The refuters note that mailguide emails carry their own
  unsubscribe link.
- **Consent renewal (G-KT-04).** The settings page has a `mailguide-extend` form ("Predĺženie súhlasu") posting to
  `newsletter/v1/subscription/extend`, plus an `extend/{email}` route. 904 lists both routes but builds only
  subscribe and double opt-in, so re-permission emails after 2 Jan land on a page with no renewal.
- **Send triggers (G-T6-04).** The public forms post to 4 mailguide lists: 389 (EN stories, header and popup), 339
  (EN Media Room footer, "the latest press information and events"), 386 (CS manage page) and 342 (CS Media Room
  newsletter page). Something starts each send: an RSS campaign over `/en/feed/`, a WordPress hook calling
  mailguide, or a person. If RSS, it depends on feed continuity and guids (908b, 405); if a hook, it stops at
  cutover; if manual, nothing changes.

## Scope
- **Client:** C2 in the parent (lists, consent validity, re-permission dates and URL, redirect URLs, send triggers).
- **T2 Manage pages (amends SKODA-904).** One manage page per locale with a list (EN, CS), and the ESP landing pages
  (subscribe confirmed, unsubscribed; SK today). The EN page manages every list the account holds, including the
  motorsport lists. Add the 3 locale URLs to the 1004a / 1004c lists as "rebuild, not import". Update the mailguide
  redirect URLs at cutover.
- **T3 Renewal (amends SKODA-904).** An extend flow on the manage page, or an ESP-hosted page, per C2; a redirect
  for the extend links in emails already sent.
- **Send triggers.** Record the C2 answer per list as a SKODA-710b register row with a launch test; an RSS campaign
  points at the 908b feed URL.

## Not in scope
- The newsletter form block and ESP integration: SKODA-904. The `/en/newsletter/` carousel page: SKODA-845.
- Re-permission dates on the run calendar: SKODA-712.

## Acceptance criteria
- [ ] A motorsport test subscriber and an EN test subscriber can change and withdraw consent on the EN manage page.
- [ ] The CS manage page and the SK landing pages work after cutover; mailguide's redirect URLs point at them.
- [ ] A consent-extension link from a re-permission email renews the subscription.
- [ ] Each of lists 389, 339, 386 and 342 has a recorded send trigger; for each automatic one, a test send after
      cutover links EDS URLs only (G-T6-04).

## Dependencies
D4 (ESP), Q-7 (SK timing); Škoda marketing and mailguide (C2). SKODA-908 (parent), 904, 908b (feed), 405 (guids),
1004a, 1004c, 710b (register), 712 (re-permission dates), 711 (motorsport hosting).
