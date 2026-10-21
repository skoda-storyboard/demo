# SKODA-850, Day-2 authoring: scheduling, originals, embargo assets, path-limited publish, takedown, kits, templates

- **Epic:** E08, Editorial at Scale
- **Type:** coordination ticket with sub-tickets (setup / configuration + runbooks, small template and check changes)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker: each item has a manual fallback, but
  without it HQ publishes by hand at the release minute and new downloads need a developer.
- **Estimate:** 1 SP for this ticket (client questions, D-4, requirement 6.3, guide and register hand-off) ·
  AI-assisted 0.5d / manual 1d, excluding Adobe onboarding and client AEM admin time *(planning estimate, not a
  quote)*. The first draft said 6 SP and the review's §7.1 8 SP, but the findings sum to more: G-KJ-01 3–5,
  G-KJ-02 5–8 (of which a plugin 3–5), G-KJ-03 2–3 (+3–5 on 811 in G-T1-02), G-T1-04 1–2, G-T1-05 1, G-KJ-07 1,
  G-T1-06 0.5–1, G-T1-07 2–3, G-T1-08 1, G-KT-09 0.5, G-T2-03 0.5; round 2 G-T6-05 0.5 and G-T6-06 0.5. Total
  17 SP, mostly at the low end: 850a 3.5, 850b 3, 850c 3, 850d 3.5, 850e 3. A custom Downloads-row plugin (3–5 SP)
  is not counted; it becomes a new sub-ticket only if 850b's native path fails its criteria.
- **GitHub issue:** [#427](https://github.com/skoda-storyboard/demo/issues/427) (created 2026-10-21, sub-issue of epic #9)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-01 (+ G-T1-03, G-KT-08), G-KJ-02
  (+ G-T1-01), G-KJ-03 (+ G-T1-02), G-T1-04 (all High, CONFIRMED); G-T1-05, G-KJ-07, G-T1-06, G-T1-07, G-T1-08, G-T2-03,
  G-KT-09 (Medium/Low, not re-verified). Round 2: G-T6-05, G-T6-06 (Medium, not re-verified).

## Why
After go-live, the authors' everyday release work has no configured path on EDS (detail in each sub-ticket):
- **HQ schedules** (850a). About half of EN stories (53 of 103) and EN releases (31 of 66) went live on an exact
  quarter hour in the last 12 months. Requirement 6.3 "schedule" maps only to closed SKODA-602. Schedule Publish,
  Snapshots and Request Publish are recorded nowhere, and each needs an enablement step.
- **Listings lag a timed release** (850a, G-T6-06). `query-index.json` and `media-feed.json` are served
  `max-age=7200`, so a returning visitor may not see a 10:00 release on the listings until about 11:00.
- **The AI audio is a step after publish** (850a, G-T6-05). Its Buzzsprout episode is dated on the release hour
  (88/88 EN, 89/89 CS), the producer adds it with a re-publish, and no ticket or role names that producer.
- **Downloads need a developer** (850b). DA upload caps MP4 at 36 MB and PDF at 20 MB and refuses ZIP; the cart
  resolver accepts only the DAM or source host; authors have read access to AEM Assets only.
- **Embargoed assets leak** (850c). The DA Assets picker needs a *published* asset, the AEM publish tier answers
  anonymously, and the 511a feed sync lists published assets.
- **Publish has no path** (850d). The Edge Delivery `publish` role is site-wide; the shared root docs have no
  permission row; takedown and rename leave copies in the index, feeds and Media Bus.
- **New press kits and templates** (850e). The chapter bar is authored in every chapter, a chapter over 200 images
  fails at preview, and the DA templates carry `/en` paths and source-CDN images.

## Scope
**Client:**
- DAM team: how do launch assets stay hidden in AEM Assets until release, and who releases them? (850c)
- Request Publish: which email service and sender, which agency domains? (850a) Legal: the required takedown time
  (850d).
- **D-4** (authoring review, not yet in the register): Media Box from a DAM folder (recommended) or authored rows
  (850b).
- Škoda Communications (G-T6-05): who produces the AI audio, with which TTS tool, from which text (the pre-release
  draft or the published page), and will they keep doing it on EDS? (850a, 850d)
- AEM / Cloud Manager admin: the document host (**Q-21**), which the originals' links use (850b, with 709b).

**Team (this ticket):**
- Map requirement 6.3 to 850a in the requirements mapping; amend SKODA-811 to depend on 850a.
- Hand the runbooks to SKODA-712's guide and training as one Day-2 chapter.
- Enter the timed-release, AI-audio and takedown rows in SKODA-710b's publish side-effect register, each with an
  owner.
- Keep the amendments the sub-tickets make to other tickets consistent: 101a (I4, T1, T2), 809, 811, 511a, 805, 806a,
  842, 520.

## Sub-tickets
| Ticket | Covers | SP |
|---|---|--:|
| [SKODA-850a](SKODA-850a.md) | Timed releases: Schedule and Request Publish, Snapshots, listing lag, AI audio | 3.5 |
| [SKODA-850b](SKODA-850b.md) | Downloadable originals: AEM Assets editor group, folders, picker, kit ZIPs | 3 |
| [SKODA-850c](SKODA-850c.md) | Embargo asset gate: marker, feed-sync skip, launch preview without published URLs | 3 |
| [SKODA-850d](SKODA-850d.md) | Publish rights per path, shared root documents, takedown and rename runbooks | 3.5 |
| [SKODA-850e](SKODA-850e.md) | New press kits and locale-aware DA templates | 3 |

## Not in scope
- Sign-in, IdP and preview protection (SKODA-101a). Asset-to-page lifecycle (SKODA-522, D20). Translation (1005).
- Feed variants and delivery (SKODA-405, 908b). Ops cron jobs in the crontab sheet. A serverless cart ZIP (SKODA-902).
- The app's new-article notification (SKODA-908a).

## Acceptance criteria
- [ ] The client answers above are recorded in the decision register or in the sub-tickets.
- [ ] Requirement 6.3 maps to SKODA-850a; SKODA-811 lists 850a as a dependency.
- [ ] SKODA-710b's register has the timed-release, AI-audio and takedown rows, each with an owner and a test.
- [ ] The criteria of 850a–850e are met, and their runbooks are one chapter of the SKODA-712 guide.

## Dependencies
D9, **D15**, D-4, D20, **Q-21**; Adobe onboarding (Request Publish, snapshot scheduling); client AEM admins.
Sub-tickets SKODA-850a–e. SKODA-101a, 809, 811, 812, 511a, 517, 522, 805, 806, 806a, 842, 902, 1005, 1006, 103, 103a,
520, 709b, 710b, 712 (guide, training), 908a.
