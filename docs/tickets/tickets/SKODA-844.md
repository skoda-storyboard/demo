# SKODA-844, Featured-image mini-pages: Road to Christmas + classic-car pages (29)
- **Epic:** E08, Editorial at Scale
- **Type:** import / template · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** none yet (draft from the M2 readiness review, 2026-10-15)
- **Estimate:** 1–2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 📝 Draft, proposed. Needs a keep / drop answer first.

## Why
29 EN pages use `template-featured-image`. No ticket covered them: the 15 Sep recount saw the family but nothing was
cut for it.
- 22 are the **Road to Christmas** Advent days (`/en/road-to-christmas/` + `-01-12` … `-23-12`): ~220 words, 5 images
  and a quote widget each.
- 7 are classic-car mini pages (`/en/skoda-felicia/`, `/en/lk-skoda-110/`, `/en/skoda-superb/`, …): ~240 words, 3 images.

## Scope
- **Decision first:** keep, fold into stories, or drop (D7 content cutoff). The Advent set is seasonal and from a past year.
- If kept: page base (813) with the featured image as the hero, rich text and Quote (220). No new block.

## Acceptance criteria
- [ ] Client decision recorded.
- [ ] If kept: 29 / 29 imported; the hero image, text and quote match the source; there is an index link from
      `/en/road-to-christmas/` to each day.
- [ ] If dropped: redirect rows (to the closest story or category).

## Dependencies
813, 220 ✅, D7.
