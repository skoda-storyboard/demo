# M1 open-ticket review (2026-10-11)

There are 20 open M1 issues, plus #310 (M1 work with no milestone) and #246 and #219 (no milestone).

I couldn't read Project #1 (the Status field) with the current credential, because GraphQL `projectsV2` returns FORBIDDEN. Readiness here therefore comes from the issues, PRs and measurements, not from the board.

## Ready to pick up (move to Ready)

| Issue | Note |
|---|---|
| #256 SKODA-834 | Specified with acceptance criteria. Assigned to vijayr. No PR yet. |
| #53 SKODA-707 | Demo assembly. Acceptance criteria are clear. **No owner**, and the demo is 15 Oct. |
| #273 Media listings QA | Triaged and measured. Assigned to saran. No PR. |
| #274 Press releases QA | Triaged. Assigned to Vjyramesh. No PR. |
| #284 Model pages QA | Triaged. **No owner.** No PR. |
| #296 Stories QA | Triaged. Assigned to vijayr. EPQ #4 has moved to #79. |
| #43 SKODA-703 | Ready once the glossary modal is dropped (SKODA-206 is M2). **No owner.** |

## In review (PR open, so not Ready)

| Issue | PR |
|---|---|
| #272 | #306 |
| #275 | #307 |
| #285 | #308 |
| #295 SKODA-514 | #307 (already QA'd) |
| #38 SKODA-604 | #315, stacked on #307; human gate |
| #42 SKODA-702 | #288 (mergeable clean) |
| #243 SKODA-303a | #299. The decision is in the comment from 10-08, but the body still says "needs a decision". |

## In progress or a gate

- **#44 SKODA-704:** sign-off. The acceptance criteria are stale: the user's comment from 10-05 drops consent and analytics, and the target is visual parity, not pixel-perfect.
- **#247:** the QA epic.

## Done: close

| Issue | Evidence |
|---|---|
| #46 SKODA-705 | Load more on main = origin, both measured at 1440: white fill, 2px `rgb(22,23,24)` border, 50px radius, weight 600, 178×44. |
| #40 SKODA-606 | "Manage Cookies" appears on 0 of 285 cached published pages and is absent from live `/en`. |
| #300 SKODA-838 | 23/23 pages published. The only thing left is the WebP 404, which is #219. |
| #310 SKODA-839 | 11/11 tag pages published. The card frame aspect is tracked on #306. |

## Duplicates

- **#246** duplicates #247: it has an empty body and no milestone.
- **#266** is superseded by the 7 per-template QA tickets, which cover all 12 variations.

## Duplicate work across tickets

- **Rail card title hover and date gap:** #306 fixes these only for `.story-rail-home`. The same defect is in #284, #296 and #274. Fix it once, shared in card-teaser / story-rail.
- **Lighthouse SEO 69** in #272, #275 and #285: caused by the `x-robots-tag: noindex, nofollow` header on every demo host. Not a defect.
- **Accessibility 92/93:** route to #43.

## Tagging fixes made

- #310: milestone M1, labels epic:E06 and type:import.
- #219: milestone M2, labels epic:E05, type:integration and BLOCKED.
- #266: label epic-QA.
- Removed the `milestone:"M1: 15 Oct demo" -` prefix from the titles of #272–275, #284, #285 and #296; they now start "M1 QA:".

## Disk drift

About 40 OVERVIEW rows still show M1 work as open or in review, but their issues are closed (`crosscheck.mjs`).

## Actions taken (2026-10-11, user go-ahead)

- **Closed with evidence comments:**
  - #46, #40, #300 and #310 as completed;
  - #246 and #266 as duplicates.
- **Acceptance-criteria comments:**
  - #43 (glossary out, inputs listed);
  - #44 (consent and analytics → SKODA-804, visual-parity criterion);
  - #243 (rule decided, in review via #299).
- **New ticket:** #323 (SKODA-228), the shared rail and card title-hover fix. It's linked from #274, #284, #296 and #306.
- **This PR:**
  - OVERVIEW: 48 rows marked closed (one, SKODA-219, as not planned), 5 open M1 rows updated, and rows added for 707, 705, 606, 303a, 228 and 514.
  - Status sections added to SKODA-703, 704, 705, 606, 838 and 839.
  - New file `SKODA-228.md`.
- **Not done:** moving the board Status to Ready, because the credential can't read Project #1.
- **Missing ticket files:** SKODA-303a and SKODA-514 are on the issues only. Their files were in PR #270, which was closed without merging.
