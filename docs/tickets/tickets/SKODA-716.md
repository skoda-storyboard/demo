# SKODA-716, Go-live accessibility gate: WCAG target, axe on the M2 templates, the screen-reader pass

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** QA / audit; fixes become follow-up tickets
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The audit is done before the DNS switch.
- **Estimate:** 3 SP · AI-assisted 1–1.5d / manual 2–3d, excluding fixes *(planning estimate, not a quote)*. From
  the review: G-H-02 3–5 SP for both NFRs plus a fix tail. The performance half is SKODA-715.
- **GitHub issue:** [#468](https://github.com/skoda-storyboard/demo/issues/468) (created 2026-10-22, sub-issue of #8)
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-H-01 (Medium, PLAUSIBLE), G-H-02,
  G-G-10 (Medium, not re-verified). Requirement **8.6**.

## Why
- **8.6 has no open ticket.** It maps only to SKODA-302 and 703, both M1. The gap register (G8) still lists the
  WCAG level as "TBD (client)".
- **703 covered M1 only.** The [audit](../../reviews/SKODA-703-A11Y-AUDIT-2026-10-15.md) ran axe-core 4.14
  (WCAG 2.0 / 2.1 A + AA) on the 134 M1 pages and an 18-page coverage set.
- **Open after 703:**
  - the human screen-reader pass (audit §6: 7 steps, NVDA + Chrome and VoiceOver + Safari);
  - SKODA-703a, the mega-menu disclosure semantics (M2);
  - the Škodapedia glossary modal (SKODA-206, M2);
  - third-party embeds, whose inner content wasn't audited.
- **Source greys below AA were accepted as parity.** The Subscribe CTA and the inactive language links use `#7c7d7e`
  (3.30:1 on the topbar); 703 records this as "not an AA pass". #403 (Subscribe contrast) and #411 (inactive sort
  contrast) have no milestone.
- **The M2 templates are not audited:** 206, 209, 810, 813, 843–845, and the non-EN chrome (SKODA-1006).
- **Captions:** SKODA-523 C3 asks whether video and podcast captions are needed (WCAG 1.2.1 / 1.2.2, EAA); 703 doesn't
  test 1.2.x.

## Scope
- **Client question (G-G-10):** WCAG 2.1 AA or 2.2 AA, and does Škoda want an accessibility statement page?
  Proposed default: WCAG 2.1 AA, the 703 baseline. Record the answer in the decision register.
- **Coverage set:** extend 703's set to one page per M2 template, EN and CS, plus the header search, media cart,
  listing filters and lightboxes.
- **Automated pass:** axe at 375 and 1280 on the set; the scripted keyboard, focus and ARIA pass as in 703.
- **Human pass:** audit §6, plus one step per new template.
- **Source greys:** under the chosen target, keep them as accepted parity or restore the AA tokens (#403, #411).
- **Captions:** record the WCAG 1.2.x result with 523 C3's answer.

## Not in scope
- Building 703a or the 206 glossary modal: those tickets.
- Producing captions or transcripts: client content (SKODA-523).
- Performance: SKODA-715.

## Acceptance criteria
- [ ] The WCAG target and the statement-page answer are recorded in the decision register.
- [ ] axe on the extended set shows no nodes beyond the PO-accepted list, or each has a fix ticket or a human
      acceptance.
- [ ] The screen-reader pass is recorded in this ticket, pass or fail per step.
- [ ] #403 and #411 have a decision under the target.
- [ ] SKODA-703a is done before go-live, or its deferral is accepted by a human.
- [ ] The statement page is in SKODA-843's legal set, or declined.

## Dependencies
SKODA-703 (method, coverage set), 703a, 206, 1006, 523 (C3), 843 (legal set), 708 (review protocol). Feeds the
go/no-go in SKODA-710.
