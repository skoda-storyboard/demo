# SKODA-850d, Publish rights per path, shared root documents, takedown and rename runbooks

- **Epic:** E08, Editorial at Scale
- **Type:** governance / configuration (amends SKODA-809, 101a T1 and T2) + runbooks
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Publishing the locale chrome is a go-live step (1006).
- **Estimate:** 3.5 SP · AI-assisted 1.5–2d / manual 3–4d, excluding D15 and client admin time *(planning estimate,
  not a quote)*. From the review: G-T1-04 1–2 SP (decision + config), G-T1-05 1 SP, G-KJ-07 1 SP plus an Adobe
  support path, G-T1-06 0.5–1 SP; the AI-audio producer row is part of G-T6-05's 0.5 SP (shared with 850a).
- **GitHub issue:** to create
- **Parent:** SKODA-850
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T1-04 (High, CONFIRMED); G-T1-05,
  G-KJ-07, G-T1-06, G-T6-05 (Medium, not re-verified).

## Why
- **Publish has no path (G-T1-04).** The Edge Delivery `publish` role is site-wide (`live:write`, `live:delete`) and
  roles map to an email, a wildcard or a group, with no path field. DA write implies delete. Any CS or agency
  publisher can publish or unpublish EN pages. SKODA-101a tests only DA edit scope.
- **Shared root docs (G-T1-05)** (`/redirects`, `/metadata`, `/nav`, `/footer`, `/media-room/*`) have no permission
  row, so a locale editor can't add a redirect. `/cs/nav` and `/sk/nav` are 200 on `.aem.page`, 404 on `.aem.live`.
- **The AI-audio producer has no role (G-T6-05).** After go-live they need DA edit and publish (or Request Publish)
  on the EN and CS release paths; no role exists in 101a or 809.
- **Takedown and rename leave copies (G-KJ-07, G-T1-06).** Unpublish needs the source deleted first; Media Bus
  copies stay reachable; RSS, media feed, app, carts and CDN keep theirs. The guide's rename steps never unpublish the
  old path, and a page leaves the index only on unpublish (409 EN index rows today). Whether a DA move unpublishes
  was not tested.

## Scope
- **Client:** legal's required takedown time (parent).
- **Publish model (amends SKODA-809, 101a T2, with D15):** few HQ/MR publishers plus Request Publish approvers per
  `/{loc}/*` pattern, or site-wide publish with SKODA-812 audit. Record the choice in D15.
- **AI-audio producer:** a row in the model (EN and CS release paths, edit + publish, or edit + Request Publish);
  101a and 809 carry it.
- **Shared root docs (amends 101a T1):** per-document rows, and a redirect-request step for locale editors.
- **Runbooks** for SKODA-712's guide:
  - takedown: unpublish order, 410 vs redirect, CDN purge, feed refresh, Media Bus removal via Adobe support, the
    legal deadline;
  - rename: slashless redirect row → publish → move → publish new → unpublish old → dead-link check → re-link the
    translation pair (1005);
  - test once whether a DA move unpublishes, and write the result into the rename runbook.

## Not in scope
- IdP federation, sign-in and preview protection: SKODA-101a. The audit trail: SKODA-812.
- Scheduling and the approval email set-up: SKODA-850a.

## Acceptance criteria
- [ ] A CS author can't publish `/en/x` without approval, or the D15 decision records site-wide publish plus audit.
- [ ] A CS editor gets a redirect live without write on `/metadata`.
- [ ] After a rename the old path is in no query index; after a takedown the page is in no index, feed or CDN cache,
      and the Media Bus request to Adobe is logged.
- [ ] The producer's test account can publish (or request publish) an EN and a CS release and has no write outside
      the release paths.
- [ ] The DA-move test result and both runbooks are in the guide.

## Dependencies
**D15**; client legal and AEM admins; Adobe support (Media Bus removal). SKODA-850 (parent), 850a (Request
Publish), 101a (T1, T2), 809, 812, 1005, 1006, 405, 908b (feeds), 712 (guide).
