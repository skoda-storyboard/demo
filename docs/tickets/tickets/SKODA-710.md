# SKODA-710, Cutover runbook and calendar: freeze, delta import, go/no-go, rollback, link release

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch / process; the code release (`scripts/links.js`) is SKODA-710a
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; date open, **Q-20**). **Go-live blocker:** the link release
  must ship with the DNS switch.
- **Estimate:** 3 SP for this ticket (calendar, runbook, rollback, rehearsal) · AI-assisted 1–2d / manual 2–3d
  *(planning estimate, not a quote)*. The review sized the runbook at 3 SP and the link release at 2–3 SP; round 2
  adds the publish side-effect register and test releases (+1 SP) and the certificate and alias dates (+0.25–0.5 SP).
  Total 7 SP: sub-tickets 710a link release 3 SP, 710b publish side effects 1 SP. The SKODA-803 delta mode (1–2 SP)
  is an amendment to 803, not counted here.
- **GitHub issue:** [#417](https://github.com/skoda-storyboard/demo/issues/417) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-02 (High, CONFIRMED), with G-KT-01
  merged (High, CONFIRMED); G-KT-02 (High, CONFIRMED, go-live blocker). Round 2: G-T5-01, G-T5-02, G-T5-03, G-T9-02,
  G-T6-01.

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
- **Two DNS changes, not one** (G-T5-03): the CDN certificates need validation records in up to 6 Škoda IT zones
  first (about 4–6 weeks ahead), then the switch, both against Škoda IT's year-end change freeze (SKODA-709).
- **Aliases** (G-T5-01, G-T5-02): 3 alias hosts follow `www` and the apex on switch day; the 8 others share bundled
  Let's Encrypt certificates with them, which can fail at the first renewal after the switch (around late February
  2027 on a 60-day cycle), taking the staying names' TLS with them (SKODA-709a).
- **The rollback deadline can be measured** (G-T9-02). The WordPress certificates (`www`, apex, 7 measured aliases)
  were issued 2026-09-01 for 90 days by HTTP-01, which can't renew once DNS points at the CDN. For a switch in the
  week of 4 Jan, the certificate in place lapses about 2027-01-29 if the late-December renewal doesn't run in the
  holiday freeze, or about 2027-03-30 if it does. HSTS (`includeSubDomains`) rules out click-through, so after that
  date a DNS rollback leaves every visitor on a TLS error.
- **`links.js` turns on itself at the switch** and DA holds 2,750 absolute source-page links: SKODA-710a.
- **No ticket lists what a WordPress publish sets off** (14 effects): SKODA-710b.

## Scope
**Client:**
- **Q-20:** the switch day. Does Škoda IT accept DNS changes between 21 Dec and 4 Jan, and who is on call?
- Can editors freeze WordPress from a set date per locale, or must the team re-import what they publish until the
  switch? Who signs go/no-go on the Škoda side?
- Hosting agency: the certbot schedule and renewal logs; a forced renewal (or DNS-01) in the 48 h before the switch.

**Team:**
- **Calendar:** freeze date per locale; **2 DNS request dates** (validation records, then the switch) against Škoda
  IT's year-end freeze; the switch day; the move date of the own-record aliases, before the first post-switch
  renewal of the bundled certificates (or the date the agency splits them); the hypercare dates (rota from
  SKODA-712). Due dates in working days.
- **Delta import (amends SKODA-803):** a mode that lists every post, press release and page with `modified_gmt`
  after the bulk run (new and edited), re-imports them and reports the counts; also for the 1004a–e locale runs.
- **Runbook:** the order of SKODA-520, 511a, 103a, 103b, the redirects sheet, the delta import, publish, the link
  release (710a) and the DNS change; embargoed items in flight; smoke-test list; go/no-go criteria and owners. The
  smoke tests include the 3 aliases that follow the switch (709a) and "no redirect targets a preview host or
  `/drafts/`" (G-G-13: the live sheet still sends `/` to a feature-branch draft on `.aem.page`; the `/` row is
  replaced by SKODA-1003's routing).
- **Rollback:** DNS back to the WordPress ELB (TTL 300 s today) with WordPress kept warm and read-only. The agency
  forces a renewal within 48 h before the DNS change (or moves to DNS-01); the resulting `notAfter` is the rollback
  deadline, written in the runbook and in SKODA-712's calendar with a reminder 14 days before. SKODA-711 dates the
  switch-off from it.
- **Rehearsal:** the whole sequence once, end to end, timed, before the freeze.
- **Sub-tickets:** SKODA-710a (link release), SKODA-710b (publish side effects and production test releases).

## Not in scope
- CDN, DNS, TLS and alias set-up: SKODA-709, 709a. Legacy URL rules: SKODA-103a, 103b.
- The 6,886 `/direct-download/` links and source-CDN references: SKODA-520.
- WordPress archive and switch-off after the rollback window: SKODA-711. Support model and monitoring: SKODA-712.

## Acceptance criteria
- [ ] Q-20 is answered in the register; the calendar (freeze per locale, both DNS request dates, the alias move date,
      switch day, hypercare dates) is written, with named owners, and the switch day is a staffed working day or the
      exception is recorded.
- [ ] A delta run against a date lists every item with a later `modified_gmt`, including edits to existing posts,
      and its re-import passes `import:validate-blocks`; the run report shows counts per locale and type.
- [ ] The runbook has the ordered steps, a smoke-test list (including the 3 switch-day aliases), go/no-go criteria
      with named owners and the rollback steps. It was rehearsed once, with timings recorded.
- [ ] The rollback deadline is a date (the `notAfter` of the WordPress certificate in place at the switch, read
      after the forced renewal), in the runbook and in SKODA-712's calendar with its reminder.
- [ ] SKODA-710a and 710b are closed before go/no-go.

## Dependencies
**Q-20**, Q-7 (non-EN timing), D7; SKODA-709, 709a (DNS, CDN, aliases); amends SKODA-803 (delta mode); sequences
SKODA-520, 511a, 103a, 103b and 1004a–e; SKODA-405 (feed guids, carried by the delta import); SKODA-711 (switch-off
dated from the rollback deadline), SKODA-712 (hypercare rota, calendar). Sub-tickets: SKODA-710a, 710b.
