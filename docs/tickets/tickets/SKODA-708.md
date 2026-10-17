# SKODA-708, Review protocol: click, heading-outline, outside-the-diff and deviation checks
- **Epic:** E07, QA / Launch
- **Type:** qa / process · **Phase:** A · **Milestone:** M2
- **Estimate:** 1 SP · AI-assisted under 1 day / manual 1–2 days *(planning estimate, not a quote)*
- **GitHub:** #384
- **Origin:** comparison of the M1 manual QA (#266, #272–#275, #284, #285, #296, #361) with the agent reviews in `docs/reviews/`. Of 94 manual observations, 57 were found by no agent review or agent-filed ticket.

## Summary
Put the checks that manual QA did and agent reviews didn't into the agent review protocol (AGENTS.md → Code review), not into CI. The repo will move, so CI logic here would be thrown away; the instructions travel with the agents.

## Problem
| Gap | Examples | Count |
|---|---|--:|
| **No interaction testing** | "+" add-to-cart does nothing on Images/Videos (#273); size-specific and video downloads fail (#273, #284); Media Box PDF cards not clickable (#274); card date overlaps arrow after Next (#272) | 11 of 15 functional findings |
| **Heading levels not compared** | h2 where origin has h3 (#272, #273, #274, #275, #284, #296). The registries recorded origin tags but compared only size/weight. | 9 |
| **Regressions outside the diff** | An agent fix (c7d06b7) deleted `icons/rail-arrow-*.svg` while `story-rail.css` still masked them; rail arrows were empty circles site-wide for 3 days (#361) | 1 (site-wide) |
| **Deviations accepted by agents** | Dropped spacers in long stories, unequal image widths, accordion spacing (#275, #296) judged "correct" by agent reviews | 33 visual |
| **Found but not filed** | Hover, arrows, quote, sidebar icons and sort colours were in agent review docs but stayed open until manual QA filed them | 21 |

## Scope
- AGENTS.md → Code review, new steps 4–9: click it; compare the heading outline (+ Lighthouse accessibility); look outside the diff (asset references, one page per template); look side by side after measuring; deviations need a human; found means filed.
- AGENTS-TEAM.md: the QA summary line points at the new steps.
- `.github/pull_request_template.md`: a "Deviations from origin" section.
- No CI changes.

## Acceptance Criteria
- [ ] AGENTS.md, AGENTS-TEAM.md and the PR template carry the checks above.
- [ ] The next agent review of a UI PR reports click results, the heading outline and any deviations from origin.

## Dependencies
- Related: SKODA-703 (#43, accessibility), SKODA-704 (#44, visual critique), #247 (QA E2E validation).
