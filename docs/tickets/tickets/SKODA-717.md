# SKODA-717, Client confirmation of five as-built requirement defaults (COM04, STO-H01, STO-H08, MR-H10, MR-L05)

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** requirements / decisions (register rows, client answers); no build unless an answer changes a default
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Answers are due early enough for any follow-up ticket to land
  before the freeze.
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d, excluding client time *(planning estimate, not a quote)*. From the
  review: G-H-01 0.5 SP doc work; each answer that changes a default may add 0.5–2 SP to an M2 ticket.
- **GitHub issue:** to create
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-H-01 (Medium, PLAUSIBLE).

## Why
Five requirement IDs carry an open red gap in the
[traceability matrix](../../planning/SKODA-REQUIREMENTS-TRACEABILITY.md), but the feature is built and only a client
confirmation is left. Their tickets are closed on M1, so the question has no owner, no due date and no criterion.
The gap register calls STO-H01, STO-H08 (G6), MR-L05 and MR-H10 (G7) "spec clarifications on existing tickets",
and those tickets are now closed. None of the five has a row in the decision register.

Each item gives the open question, then the as-built state, which is the proposed default:
- **COM04**, the exact Model / secondary navigation structure. Default: the source Models dropdown in the header
  (SKODA-301, 308); per-locale menus authored from the source menus (SKODA-1006).
- **STO-H01**, §10 Q11: is the featured promo curated or the most recent, and how many items? Default: the Promo Box
  in index mode on `/en`, the newest three stories (SKODA-213, 827). Curated mode (three rows in author order) is
  available to authors.
- **STO-H08**, §10 Q12: what is the Latest News source, and is it in scope? Default: in scope, the home rail over
  `category=press-releases` (SKODA-402, 611b).
- **MR-H10**, where contacts and company content sit on the Media Room home. Default: no extra home band; the
  Contacts links in the Media Room footer (SKODA-305) and the `/en/contacts/` page (SKODA-810).
- **MR-L05**, the per-type result card definitions. Default: the story card for stories; date and title over the
  image for press releases and press kits (SKODA-402d); the media card for images and videos (SKODA-406).

## Scope
- **Register rows:** one row per question in the
  [decision register](../../planning/SKODA-DECISION-REGISTER.md), with the default above, the client owner, the
  asked-on date and the answer due date (Czech working days, as the register describes).
- **Ask:** send the five questions in one batch with the other open register items.
- **Record:** the answer per row; then turn the traceability row to ✅, or open a follow-up ticket on the owning M2
  ticket (1006, 213 / 842, 402, 810, 402d / 406) when an answer changes a default.

## Not in scope
- MR-L01 (listing search vs global search, §10 Q9): decided by D6, index-only at go-live; SKODA-901 is M3.
- MR-L03 (advanced filter and per-section scoping, §10 Q4): decided by D12, all 15 facets as on the source.
- MR-PR04 and MR-V04 (PDF and video download models): SKODA-523 (C1, Q-18), 523a, 523c and 850b.
- Building any change: the follow-up tickets.

## Acceptance criteria
- [ ] The decision register has the five rows, each with a default, an owner, an asked-on date and a due date.
- [ ] Each row has the client's answer, or the due date has passed and the default stands, recorded as such.
- [ ] The five traceability rows show ✅, or each changed default has a follow-up ticket with a milestone.

## Dependencies
SKODA-301 / 308, 1006, 213, 827, 842 (DA library), 402, 611b, 305, 810, 402d, 406; the decision register.
