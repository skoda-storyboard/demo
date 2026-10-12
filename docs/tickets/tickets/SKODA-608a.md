# SKODA-608a, Media feed refresh: Images / Videos rails stop at 25 Sep / 2 Sep
- **Epic:** E06 (follow-up to SKODA-608, #117; the ongoing sync is SKODA-511)
- **Type:** data (media feed) · **Milestone:** M1 (15 Oct demo)
- **GitHub issue:** [#342](https://github.com/skoda-storyboard/demo/issues/342)
- **Estimate:** 1 SP *(planning estimate)*
- **Status (2026-10-12):** 🔵 TODO. Found while fixing the Media Room home rails (PR on `mr-rails-parity`).

## Problem (measured 2026-10-12)
`/en/media-feed.json` (live) feeds the Media Room home's Images / Videos rails, the model pages' media rails and the
Images / Videos listings. It hasn't been rebuilt since SKODA-608 (2026-10-01):

| | Source `/en/media-room/` | Our feed |
|---|---|---|
| Newest image | 12. 10. 2026 (Škoda Epiq Sportline infographics) | 2026-09-25 (1,714 images) |
| Newest video | 12. 10. 2026 ("Video \| Škoda Epiq Sportline - Footage II") | 2026-09-02 (51 videos) |
| Titles | the asset title | 14 images titled with their file name, e.g. `hudebni-leto_ee2dfc93`, `103_Skoda_Peaq_81f5a394_e69b6c98`, `Front-parking-sensorsM_f9bb95d2` |

So the Media Room rails now look like the source (media cards, model ladder), but they show older items, and some cards have
a file name as their title.

## Scope
- Rebuild the feed from the source listings (`npm run media-items:build`, see `tools/importer/media-items/`). Bring the
  new binaries into AEM Assets through the DAM ingest (developer machine, `tools/importer/media/README.md`), then
  publish the feed.
- Titles: use the asset title (the source card title / `alt`), not the file name. List the 14 rows, and check whether
  the source has a real title for each.
- The index is cached for about 2 hours: QA in a fresh context.

## Acceptance criteria
- [ ] On `/en/media-room` the first Images / Videos cards are the source's newest items (same titles and dates as the
      source rail at QA time).
- [ ] No feed row has a file name as its title, or each remaining one is documented as untitled on the source.
- [ ] The model page media rails and the Images / Videos listings still render, with no empty rail where the source has items.

## Dependencies
SKODA-608 (feed), SKODA-511 (ongoing sync), SKODA-505 (DAM ingest).
