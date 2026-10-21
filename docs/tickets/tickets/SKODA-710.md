# SKODA-710, Cutover runbook and calendar: freeze, delta import, go/no-go, rollback, link release

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch / process, plus one code release (`scripts/links.js`)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; date open, **Q-20**). **Go-live blocker:** the link release
  must ship with the DNS switch.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*. The review sized the
  runbook at 3 SP and the link release at 2–3 SP separately, so 3 SP is tight. The SKODA-803 delta mode (1–2 SP) is
  an amendment to 803, not counted here.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-02 (High, CONFIRMED), with G-KT-01
  merged (High, CONFIRMED); G-KT-02 (High, CONFIRMED, go-live blocker).

## Why
- **WordPress keeps publishing.** About 15 posts and press releases a week across locales (191 in the last 90 days,
  55 in the last 30; EN 45 in 90 days). Edits after publishing are routine: both 2026-10-19 releases (EN, CS) were
  edited the next day. SKODA-803 promises idempotent re-runs only; it has no freeze, delta or modified-since mode.
  The authoring review's importer freeze (AR-06 / D-1) was never ticketed.
- **Per-scope cutovers exist, nothing sequences them:** SKODA-520 (source CDN), 511a (feed generator), 103a (slash
  rule), 1004b–e (freeze and import before DNS, per Q-7). No document names go/no-go owners, smoke tests, the
  rollback path or how embargoed WordPress content in flight moves.
- **The calendar.** 02 Jan 2027 is a **Saturday**. With the Czech holidays (28 Oct, 17 Nov, 24–26 Dec, 1 Jan) there
  are **47 working days** from 22 Oct to 1 Jan, **7** of them from 21 Dec. The first staffed day after a Saturday
  switch is Mon 4 Jan. WordPress publishes over the holidays: posts and releases dated 15 Dec–10 Jan were EN 9 / 11 / 6
  and CS 12 / 13 / 9 in 2023 / 2024 / 2025 (refuter recount, within 1 of the finding), so the freeze and the delta
  are real content. **Q-20** default: a weekday switch in the week of 4 Jan, a content freeze from 18 Dec and a delta
  import before DNS.
- **`links.js` turns on itself at the switch** (worse than first stated). `LIVE_ORIGIN` / `LIVE_HOST` hard-code
  `[www.]skoda-storyboard.com`, and `policyHref()` checks `LIVE_HOST` before the same-origin branch. Once pages are
  served from `www`, every site-relative internal link resolves to `LIVE_HOST` and gets `target=_blank` with
  `rel="noopener noreferrer"`, except the 9 `DEMO_LISTINGS` paths, and the slash trim is skipped (simulated with the
  module). The 8 `LIVE_ONLY` patterns (non-EN locales, `/en/skodapedia`, podcast archives, feeds, contacts,
  `/en/documents/`, newsletter settings, `/direct-download/`) then point at EDS, and unmigrated targets 404.
  Separately, DA content holds 2,750 absolute source-page links in the 408 EN pages (520 census), written by the
  import-time allow-list. SKODA-605 and 609 are closed M1; AR-19 maps only to them.

## Scope
**Client:**
- **Q-20:** the switch day. Does Škoda IT accept a DNS change between 21 Dec and 4 Jan, and who is on call?
- Can editors freeze WordPress from a set date per locale, or must the team re-import what they publish until the
  switch? Who signs go/no-go on the Škoda side?

**Team:**
- **Calendar:** freeze date per locale, the date the DNS change request goes to Škoda IT (SKODA-709) against their
  year-end change freeze, the switch day, and the hypercare dates (rota from SKODA-712). Due dates in working days.
- **Delta import (amends SKODA-803):** a mode that lists every post, press release and page with `modified_gmt`
  after the bulk run (new and edited), re-imports them and reports the counts; also for the 1004a–e locale runs.
- **Runbook:** the order of SKODA-520, 511a, 103a, 103b, the redirects sheet, the delta import, publish, the link
  release and the DNS change; embargoed items in flight; smoke-test list; go/no-go criteria and owners. The
  smoke tests include "no redirect targets a preview host or `/drafts/`" (G-G-13: the live sheet still sends `/` to a
  feature-branch draft on `.aem.page`; the `/` row is replaced by SKODA-1003's routing).
- **Rollback:** DNS back to the WordPress ELB (TTL 300 s today) with WordPress kept warm and read-only. The window
  ends at the latest when the WordPress Let's Encrypt certificate lapses (≤ 90 days after DNS moves; SKODA-711).
- **Link release** (`scripts/links.js`, merged at the switch): shrink `LIVE_ONLY` to what is really absent at
  go-live, drop the new-tab rule for the own host, make own-host links site-relative (AR-19). Plus a relink pass
  over DA after the last import, or the runtime rewrite, for the 2,750 absolute links.
- **Rehearsal:** the whole sequence once, end to end, timed, before the freeze.

## Not in scope
- CDN, DNS and TLS set-up: SKODA-709. Legacy URL rules: SKODA-103a, 103b.
- The 6,886 `/direct-download/` links and source-CDN references: SKODA-520.
- WordPress archive and switch-off after the rollback window: SKODA-711. Support model and monitoring: SKODA-712.

## Acceptance criteria
- [ ] Q-20 is answered in the register; the calendar (freeze per locale, DNS request date, switch day, hypercare
      dates) is written, with named owners, and the switch day is a staffed working day or the exception is recorded.
- [ ] A delta run against a date lists every item with a later `modified_gmt`, including edits to existing posts,
      and its re-import passes `import:validate-blocks`; the run report shows counts per locale and type.
- [ ] The runbook has the ordered steps, a smoke-test list, go/no-go criteria with named owners and the rollback
      steps with their last possible date. It was rehearsed once, with timings recorded.
- [ ] Unit test: with base `https://www.skoda-storyboard.com/en/news/x`, `policyHref('/en/models/fabia')` returns no
      new tab, and `/en/models/fabia/` is trimmed. Each remaining `LIVE_ONLY` pattern is listed with its reason.
- [ ] Before go/no-go, a crawl of the production CDN (reached before the DNS change) with the link release finds 0
      internal 404s and 0 internal links with `target=_blank`; DA holds 0 absolute `www` links to migrated pages (or
      the runtime rewrite covers them).

## Dependencies
**Q-20**, Q-7 (non-EN timing), D7; SKODA-709 (DNS, CDN); amends SKODA-803 (delta mode); sequences SKODA-520, 511a,
103a, 103b and 1004a–e; SKODA-711 (rollback end), SKODA-712 (hypercare rota). Supersedes AR-19 for M2.
