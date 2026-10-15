# SKODA-847, Press-kit corpus: enumerate every EN kit and run the three importers
- **Epic:** E08, Editorial at Scale
- **Type:** import · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#366](https://github.com/skoda-storyboard/demo/issues/366) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 3–5 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner.

## Why
104 EN press-kit URLs are live (25 hubs). The source has at least **80 hubs and 617 chapter / resource pages** in its
3 press-kit sitemaps. It has more besides, because the sitemaps are stale: 95 of our live press-kit URLs aren't in them.
Press kits have no REST endpoint (`wp/v2/press_kit` → 404).

| Press-kit template | Hubs | Chapters / resources | Importer |
|---|--:|--:|---|
| `press_kit-template-default` | 46 | 565 | `import-press-kit-hub` / `import-press-kit-default` (805a–c) |
| `press_kit-template-template-press-release` | 22 | 51 | SKODA-836 (#280, in progress) |
| `press_kit-template-template-layout-article` | 12 | 1 | **none**: single long pages (e.g. `new-skoda-superb-press-kit`: 3,283 words, 69 images, 314 teasers). Not analysed before this census |

## Scope
- Build the complete EN list from the `/en/press-kits/` listing (load-more until empty), and merge in the sitemaps for the
  older kits.
- `layout-article` kits: profile 2 of them, then decide between extending `import-press-kit-default` and a new template
  entry.
- Run every kit through its importer in batches. Media through the DAM path (503 / 806a).

## Acceptance criteria
- [ ] One URL list with every EN kit hub and child page; its count is reconciled against the listing's total.
- [ ] All three templates have an importer that passes `validate-metadata`.
- [ ] Every kit is imported, or excluded with a reason (D7 cutoff).

## Dependencies
805 / 836 / 806a, 803 (automation), D7.

## Collision scope
Press-kit importers and parsers. Serialize with 836.
