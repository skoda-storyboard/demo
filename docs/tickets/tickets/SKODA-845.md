# SKODA-845, Media Room Newsletter page: press-release carousels by plant (`template-carousel-listing`)
- **Epic:** E08, Editorial at Scale
- **Type:** template / import · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#365](https://github.com/skoda-storyboard/demo/issues/365) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 1–2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner.

## Why
`/en/newsletter/` is linked from the Media Room nav **Company** menu. It is the only page on
`template-carousel-listing`: a hero, then 2 carousels with 30 press-release teasers in total. These are the plant
newsletters, grouped by plant (Kvasiny, Vrchlabí, …).

The 24 Sep import plan routed it to page base, which would lose the carousels.

## Scope
- Reuse Story Rail `press` (SKODA-224), one rail per plant, fed from the query index (press releases whose title or tag
  names the plant). No new block.
- Page metadata on the MR side (nav, footer).

## Acceptance criteria
- [ ] Same rails, same order, same newest items as the source at QA time. Each card links to a live press release or
      to the source (link allow-list).
- [ ] New plant newsletters appear without editing the page (index-driven).

## Dependencies
224 ✅, 401 ✅, 309 ✅. Find out how the source groups the items (tag vs title) before building.
