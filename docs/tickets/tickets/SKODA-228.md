# SKODA-228, Card titles keep their colour on hover in every rail and card grid

- **Epic:** E02, Core Blocks
- **Type:** block CSS (shared card primitive)
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **GitHub issue:** [#323](https://github.com/skoda-storyboard/demo/issues/323)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-10-11):** 🔵 TODO, ready to pick up
- **Origin:** M1 ticket review, 2026-10-11. One root cause behind observations in #274, #284 and #296. #306 (#272) fixes it for the home rails only.

## Problem
The global `a:hover` rule in `styles/styles.css` (`--link-hover-color` `#0E3A2F` plus underline) reaches the card title links. Rails and card grids use a stretched link, so the whole card is the hover area. On origin the title keeps its colour and gets no underline.

Measured on `main` (live), 1280 × 900, first card of each block, colour + `text-decoration-line` before → on hover:

| Page | Block | `main` | Origin (QA tickets) |
|---|---|---|---|
| Model page (`/en/skoda-model/new-superb`) | `story-rail` press-kit / news (`carousel center caption`) | `rgb(0,0,0) none` → `rgb(14,58,47) underline` | unchanged, no underline (#284) |
| Model page | `story-rail` stories (`carousel`) | `rgb(255,255,255) none` → `rgb(14,58,47) underline` | unchanged (#284) |
| Model page | images / videos rails (`carousel media caption image|video`) | `rgb(22,23,24) none` → `rgb(14,58,47) underline` | unchanged (#284) |
| Story (Epiq) | Explore more (`cards overlay`) | `rgb(255,255,255) none` → `rgb(14,58,47) underline` | unchanged (#296) |
| Story (Epiq) | Related Stories (`carousel`) | `rgb(255,255,255) none` → `rgb(255,255,255) underline` | unchanged (#296) |
| Press release (Zellmer) | Related Press Releases (`carousel press`) | `rgb(255,255,255) none` → `rgb(255,255,255) underline` | unchanged (#274) |
| Media Room home | rails (`carousel`) | `rgb(255,255,255) none` → `rgb(14,58,47) underline` | unchanged |
| Storyboard home | rails | `rgb(0,0,0) none` → `rgb(0,0,0) underline` | fixed by #306 (home only) |

## Scope
- **One rule, in the shared card primitive** (`styles/card-teaser.css`): `.card-teaser-title a:hover` (and the stretched-link focus state) keep `color: inherit` and `text-decoration: none`. This covers story-rail, cards, stories and listing cards together.
- **Remove the home-only copy** that #306 adds (`.story-rail.story-rail-home .card-teaser-title a:hover`) once this lands, or land this first and drop it from #306. Coordinate with the #306 author.
- **Keyboard focus stays visible:** the `:focus-visible` ring on the card link is unchanged.
- **Out of scope:**
  - The date-to-title gaps (#306 has the home value, 12px). #284 asks for 8px on model rails. They're per template, so they stay with their QA tickets.
  - Heading levels (`h3`), which are content and import work.

## Acceptance criteria
- [ ] On every row of the table, at 1440 / 992 / 768 / 390, the hovered title's computed `color` equals its resting colour and `text-decoration-line` is `none`. Measured with Chrome DevTools against origin, no screenshots.
- [ ] Ordinary text links (body copy, footer, Additional info) keep the global hover.
- [ ] The card link's `:focus-visible` ring is unchanged (AA).
- [ ] `npm run lint:css` is clean. Card / story-rail tests pass.
- [ ] #274, #284 and #296 link this ticket for their hover rows. #306 doesn't keep a duplicate rule.

## Dependencies
- Related: #306 (home QA, scoped copy of this fix), #272, #274, #284, #296. CSS guardrails: `docs/guardrails/css-guidelines.md`.
