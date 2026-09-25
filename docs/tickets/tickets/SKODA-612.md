# SKODA-612, Press-release "Related Press Releases" band is imported as default content
- **Epic:** E06, Import Pilot Content
- **Type:** import / content model
- **Phase:** A · **Milestone:** M1 Should (visible on every press release)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
SKODA-508 (2026-09-25). 508 kept the band as published (Title-only AC). This ticket carries the ticket's
"never emit an empty-href link" rule.

## Problem (measured, Zellmer press release)
- The second `.cover-box.dark` › `.search-results.type-press_release` (10 `article.article-teaser` cards) isn't
  matched by any press-release parser. The downloads parser takes only `.search-results.media-box`.
- The band lands as loose default content: each card is `<p><a href=""><picture></a></p>`, a date paragraph and an
  `h3` link. The image link has an **empty `href`** (the source `a.colorbox href=""`), so clicking a card image
  goes nowhere. The published pages have the same 10 empty links.
- Stories don't have this problem: `skoda-story-cleanup.js` `relatedBand()` turns their related band into a Story
  Rail table.

## Scope
- Press-release importer: replace the band with the same Story Rail (or a query-driven rail) as stories, feeding
  from the index (tags as on the source, "Based on tags: …"). Otherwise, at minimum give each card image the card's
  `h3` href and never emit an empty `href`.
- Rebuild the press-release bundle. Re-import and republish the press releases (with SKODA-603).

## Acceptance Criteria
- [ ] No `href=""` in any press-release import output.
- [ ] The related band renders as a rail on the branch preview at 1440 and 390, measured against the source.

## Dependencies
SKODA-508, SKODA-212 (rail), SKODA-603 (republish).
