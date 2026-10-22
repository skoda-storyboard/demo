# SKODA-850a, Timed releases: Schedule Publish, Snapshots, Request Publish, listing freshness, AI-audio step

- **Epic:** E08, Editorial at Scale
- **Type:** setup / configuration (Experience Workspace tools, one header or fetch change) + runbook
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker: without it HQ publishes by hand at
  the release minute.
- **Estimate:** 3.5 SP · AI-assisted 1.5–2d / manual 3–4d, excluding Adobe onboarding *(planning estimate, not a
  quote)*. From the review: G-KJ-01 3–5 SP (G-T1-03 2–3 and G-KT-08 1–2 merged into it), planned at the low end;
  +0.5 SP listing freshness (G-T6-06); the AI-audio runbook step is part of G-T6-05's 0.5 SP (shared with 850d).
- **GitHub issue:** [#447](https://github.com/skoda-storyboard/demo/issues/447) (created 2026-10-21, sub-issue of #427)
- **Parent:** SKODA-850
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-01 (High, CONFIRMED; + G-T1-03,
  G-KT-08), G-T6-05, G-T6-06 (Medium, not re-verified).

## Why
- **HQ schedules.** In the last 12 months about half of EN stories (53 of 103) and EN releases (31 of 66) went live on
  an exact quarter hour, against about 7% by chance; CS 33–37%, SK/SR/DE 6–12%. EN releases cluster at 10:00 (14)
  and 09:00 (8). Requirement 6.3 "schedule" maps only to closed SKODA-602; SKODA-811 lists scheduling as "Related".
- **The native tools are recorded nowhere.** EW **Schedule Publish** works one document at a time and needs a
  prepare-tab row and registration at `da.live/apps/scheduler`. **Snapshots** scheduling is early access. **Request
  Publish** needs Adobe onboarding, an email-sending API and allowed domains, and its approvers need `basic_publish`.
  The crontab sheet suits ops jobs only: `basic_author` can write it.
- **Listings lag the page (G-T6-06).** On WordPress a 10:00 release shows at once on every listing. On EDS,
  `/en/query-index.json` and `/en/media-feed.json` are served `cache-control: max-age=7200, must-revalidate`, and
  `scripts/query-index.js:48` calls a plain `fetch()`. A journalist who opened the Media Room at 09:00 and reloads at
  10:01 keeps the 09:00 index: the MR promo, `/en/news` and the rails miss the release until about 11:00. The
  authoring review recorded the 2 h lag as a doc item only (AR-10/11).
- **The AI audio is a per-release step after publish (G-T6-05).** Every AI-audio release gets its own Buzzsprout
  episode, dated on the exact hour (88/88 EN, 89/89 CS); 48/88 EN and 48/89 CS fall within 5 minutes of the release
  time. Live case: a CS release went live 2026-10-21 at 14:01:44, its episode is dated 14:00:00, and the release
  was edited at 14:19:01. Of the latest 40 releases, 16 EN and 16 CS with audio were last modified 2–60 minutes after
  publish. Each insert is a re-publish that touches the index, the feeds and the app (SKODA-908a). 0 ticket files
  mention AI audio; D-05's amendments to 204, 842 and D19 were never applied.

## Scope
- **Schedule Publish:** enable it; rules for who may schedule, CET/CEST in the UI vs UTC, the 5-minute grain, and
  the refresh order after a timed publish (index, RSS, media feed, CDN purge, app).
- **Snapshots** for multi-locale launches (EN + CS together); ask Adobe for snapshot scheduling.
- **Request Publish:** onboard it with the email service, sender and agency domains the parent's client question
  returns; the approvers are the per-path publishers SKODA-850d defines.
- **Listing freshness (G-T6-06, amends SKODA-401):** a shorter browser `max-age` for `/*/query-index.json` and
  `/*/media-feed.json` through the config-service headers (e.g. `max-age=300`), or `fetch(url, { cache: 'no-cache' })`
  in `scripts/query-index.js`. Pick one and record why.
- **AI-audio step in the release runbook (G-T6-05):** who produces it, when, pasting the Buzzsprout URL, the
  re-publish; for a scheduled release, schedule the episode for the same hour. The producer's role is in 850d
  (101a, 809).
- Map requirement 6.3 here (with the parent); SKODA-811 depends on this ticket.

## Not in scope
- The embargo asset gate: SKODA-850c. Publish rights per path: SKODA-850d.
- The app notification and its de-duplication on re-publish: SKODA-908a. Feed delivery: SKODA-908b.
- D-05's amendments to SKODA-204, 842 and D19 (the AI-audio box): applied in those tickets.

## Acceptance criteria
- [ ] A release scheduled for 10:00 CET goes live within 5 minutes of 09:00 UTC; an EN + CS timed release was
      rehearsed, index and feeds included.
- [ ] A returning visitor who loaded `/en/media-room` 1 h before a timed release sees it on the MR promo,
      `/en/news` and the rails within 5 minutes of the release, after a reload (G-T6-06).
- [ ] An author without publish rights sends a Request Publish; an approver receives the email and publishes.
- [ ] The release runbook has the AI-audio step; one rehearsed scheduled release with audio has its episode and
      the release on the same hour (G-T6-05).
- [ ] The scheduling rules and the refresh order are in the SKODA-712 guide.

## Dependencies
D9; Adobe onboarding (Request Publish, snapshot scheduling); Škoda Communications (AI-audio producer, parent).
SKODA-850 (parent), 850d (approvers, producer role), 811, 401 (index), 405 and 908b (feeds), 709 (CDN purge),
710b (side-effect register), 908a (app notification), 204 / 204a (AI-audio box), 712 (guide).
