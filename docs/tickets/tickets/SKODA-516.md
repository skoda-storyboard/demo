# SKODA-516, Model-page Images / Videos rails come out empty: media feed lacks bodywork / derivative facets

- **Epic:** E05, Media Pipeline
- **Type:** data / media feed
- **Phase:** A · **Milestone:** M1 (15 Oct demo). **Risk:** the full fix needs DAM ingest on a developer machine.
- **Estimate:** 2 SP · AI-assisted 1d / manual 2d *(planning estimate, not a quote)*
- **Split (hybrid):**
- **GitHub issue:** [#334](https://github.com/skoda-storyboard/demo/issues/334)
- **Status (2026-10-15, from GitHub):** 🔵 M2 (moved from M1 on 2026-10-15). Data gap in the media feed; the full fix needs a DAM ingest; goes with 608a / 511.
  - **Agent half:** the rail sweep, the feed rebuild logic (`media-items-lib.mjs` keeps `bodywork-*` / `derivative-*`) and the fallback, if chosen, with tests.
  - **Human half:** the DAM ingest on a developer machine (credentials), the PO decision on the fallback, and publishing the rebuilt feed.
- **Origin:** reported in manual review on 2026-10-11 (`/en/skoda-model/new-fabia` "missing images, videos").

## Problem
- **Fabia page in DA:** it has Images and Videos rails (`index /en/media-feed.json`, `model fabia`, `bodywork hatchback`, `limit 20`). Like the source, rows AND together.
- **Source:** Fabia + Hatchback matches **395 images / 24 videos**.
- **`/en/media-feed.json`:** 7 Fabia images and 7 Fabia videos, and **none** tagged `hatchback`. Only 526 of 1,714 images carry any bodywork value. The feed is the source library ∩ the published DAM, so most Fabia media isn't ingested yet.
- **Result:** both rails match nothing and hide themselves, so the page looks like it is missing its media. Its Press Kits rail shows 1 kit against the source's 4 (content scope).

**Sweep of all 23 model pages** (each rail's filter evaluated against its index, as `story-rail` does; the sweep script is kept with the migration notes and can be committed with the fix):
- 15 pages have at least one hidden rail.
- Examples: Fabia (Images, Videos); Kodiaq (News, Images, Videos); Kamiq and Scala (4–5 rails each); Superb iV (News, Images, Videos); Enyaq Coupé / Sportline / RS; Karoq Sportline; Elroq RS / Sportline.
- In most cases, the model alone would match items: for example Karoq Sportline images (15) and Enyaq Coupé images (91).

## Scope / decision
1. **Data (preferred):**
   - ingest the Fabia, Kodiaq, Kamiq, Scala and Superb media the rails need into the DAM;
   - rebuild the feed with the source card classes, which already carry `bodywork-*` / `derivative-*`;
   - check that `media-items-lib.mjs` keeps them.
2. **Demo fallback (Architect / PO decision):** if ingest can't land before 15 Oct, either:
   - an author-visible empty state ("No images yet" plus the All link); or
   - a rail-level fallback that drops the bodywork / derivative rows when nothing matches.

   Both diverge from the source, so record the decision.
3. Report the remaining empty rails per page after the rebuild.

## Acceptance criteria
- [x] On every model page, each rail either shows items, or has a recorded reason (PO-accepted scope gap). The sweep is re-run and attached.
  - Attachment: [SKODA-516-RAIL-SWEEP-2026-10-16.md](../../analysis/SKODA-516-RAIL-SWEEP-2026-10-16.md).
  - The PO's acceptance of the remaining gaps is still open.
- [x] `/en/skoda-model/new-fabia` shows Images and Videos rails with items, or the agreed fallback. Measured at 1440 / 375.
- [x] The media manifest and feed are rebuilt with no regressions on the Images / Videos listings (counts before and after).

## Status (2026-10-16, branch `skoda-516-model-media-rails`)
No fallback was needed: the feed is rebuilt with the source's card classes, so `bodywork-*` and `derivative-*` are
kept, plus the rail queries the model pages need. The rail pages were imported and pushed, and the feed is
published.

**Sweep** (107 rails on the 23 model pages, published site):
- 64 rails show as many cards as live, 32 show fewer, and 11 are hidden.
- 203 live cards are missing in all. Every one has a cause in the attachment:
  - 112 are releases and kits that are imported but held at the push gate, because their PDF / MP4 links await
    the DAM ingest (the human half).
  - 58 are on Kamiq and Scala: their live versions predate the media-feed rails, and the re-imports are held at
    the gate by their Technical Data PDFs. Evaluated against the published feed, the re-imports show as many
    Images / Videos cards as live.
  - 29 are videos the feed leaves out: 15 Vimeo-restricted to skoda-storyboard.com, 14 with no thumbnail.
  - 2 are cards in another locale, 1 is a kit outside the import lists, and 1 is a Peaq video the source Videos
    library does not list.

**Fabia** (`/en/skoda-model/new-fabia`, ours vs live):
- 1440: Press Kits 6 / 6, Images 20 / 20, Videos 20 / 20; first cards 354×199 and 261×287 on both.
- 375: the same counts; first cards 318×179 and 318×319 on both.

**Feed** (`media-items/items.json`, `main` → branch, the branch feed being the published one):
- images 1,714 → 2,280, videos 51 → 191, assets 4 → 4 (total 1,769 → 2,475).
- 4 items left the feed, all corrections:
  - two no longer exist on the source (404);
  - two were story pages the old build took for videos with no playable source.

**Still needs a person:**
- the DAM ingest on a developer machine, then pushing the 69 held releases and kits plus Kamiq and Scala;
- the PO's acceptance of the remaining gaps above.

## Dependencies
- Related: #178 (SKODA-511 Assets → media feed sync), #179 (SKODA-512 taxonomy), #219 (WebP publish, BLOCKED), #284 (model page QA).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
