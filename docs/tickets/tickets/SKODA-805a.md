# SKODA-805a, Press-kit tiles hub, M1 demo slice + importer

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805)
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo), pulled forward from M2 by the 43-URL scope
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*
- **Parent:** SKODA-805 (#66) · **GitHub issue:** [#128](https://github.com/skoda-storyboard/demo/issues/128)

## UI Specification
[`press-kit-template.md`](../../ui-specs/press-kit-template.md) covers the landing: overlay hero plus the chapter-tile
grid. Reuse [`hero.md`](../../ui-specs/hero.md) (landing variant) and `card-teaser.md` for tiles.

## Summary
Three URLs in the 43-URL set are `press_kit-template-template-tiles` hubs:

| Hub URL | Tiles |
|---|---|
| `/en/press-kits/skoda-peaq-press-kit-2/` | 13 |
| `/en/press-kits/skoda-epiq-press-kit-2/` | 13 |
| `/en/press-kits/125-years-of-skoda-motorsport-press-kit/` | 24: 20 historical chapters, 3 resources, 1 cross-kit link |

SKODA-805 to 808 are all M2, and **origin/main has no press-kit importer or page-template entry**. This ticket
delivers only the **hub**, as defined in the Requirements below.

The chapter and resource children are SKODA-805b. The single default-template kit (first-glimpse) is SKODA-805c.

## Requirements / Spec
- Add a `press-kit-hub` entry to `page-templates.json` and an `import-press-kit-hub.js` importer, including the `urls-`
  list, that emits:
  - an overlay hero (existing `hero` variant)
  - a tile grid (existing `cards` variant, no new block)
  - optional intro text
  - Metadata: `template=press_kit`, `model`, `category`, `date`, `tags`
- Tiles keep their source order, image and label, and tolerate a variable count (13 vs 24) and mixed tile types
  (chapter / resource / external kit).
- Tile hrefs follow SKODA-609 and decision D-1 (import the children vs link out to live).
- Use the MR chrome (SKODA-305 footer) and the MR header state.
- **Out of scope for M1:**
  - the sticky Chapters sub-nav: it lives on child pages
  - the variant selector (808)
  - FAQ (807)
  - whole-kit ZIP (806)

## Acceptance Criteria
- [ ] All 3 hubs import through SKODA-602 and render the hero plus the full tile grid in source order at
      1280/768/375.
- [ ] Every tile link resolves (imported child, or policy-compliant external). The SKODA-609 crawl shows no in-site
      404.
- [ ] Hubs appear in the index with `template=press_kit`, so they can feed the Peaq/Epiq model "Press Kits" rails.
- [ ] Visual diff against the source is ≤2% at 1280/768, or deviations are documented. Lint is clean.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - The tile grid uses the SKODA-221 `tiles` variant: 1:1 + 2:1 tiles, 20px gap, 16/500 title, no date, no hover
    zoom. Until 221 lands, plain cards are the documented deviation (221 is Could).
  - The 2-up WhatsApp / direct-ZIP banner pair on Peaq and Epiq. The whole-kit ZIP is a static `<a>`, not scripted.
  - At 375 a dark caption sits below the image. The h1 is 28px at 768.

## Dependencies
- Upstream: SKODA-601/602, SKODA-202 (hero), SKODA-201 (cards), SKODA-305 (MR footer), SKODA-609.
- Related: SKODA-805b (children), SKODA-805c (default template), SKODA-208 (model Press Kits rail).
