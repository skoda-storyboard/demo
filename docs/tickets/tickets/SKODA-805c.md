# SKODA-805c, `press_kit-template-default` article (Peaq "first glimpse")

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805/807)
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 **Should** tier (P1, 15 Oct demo) · fallback = the SKODA-607 PR shell without accordions
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3d *(planning estimate, not a quote)*
- **Parent:** SKODA-805 (#66) · **GitHub issue:** [#130](https://github.com/skoda-storyboard/demo/issues/130)

## UI Specification
Two-column article per [`story-detail.md`](../../ui-specs/story-detail.md) / [`template-press-release.md`](../../ui-specs/template-press-release.md);
accordion per [`faq-accordion.md`](../../ui-specs/faq-accordion.md). Reference:
`https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`.

## Summary
`skoda-peaq-first-glimpse-…` is **not a tiles hub**. It is a `single-press_kit` page using
`press_kit-template-default`, which is the same shell that press-kit child/chapter pages use. The live source has:
- an article body with **8 row-toggle accordions**
- tags
- a Buzzsprout AI-audio embed and a Vimeo embed
- a **Media Box of 60 images** (per the API; about 120 DOM media articles)

Treating it as a hub loses the content, and treating it as a press release loses the press-kit metadata and the
accordions.

## Requirements / Spec
- **Importer.** `import-press-kit-default.js` plus a `page-templates.json` entry. It is built on the SKODA-607
  press-release shell and emits:
  - a hero or no hero, as on the source
  - article default content
  - an **Accordion** for row toggles; this is the minimal SKODA-807 behaviour, using native
    `<details>/<summary>` unless the spec requires otherwise
  - `embed` (SKODA-204)
  - `tags` (SKODA-205)
  - `downloads` (SKODA-502)
  - Metadata `template=press_kit`
- **Accordion.** Add `blocks/accordion`, which does not exist on main:
  - keyboard accessible
  - the heading level is preserved
  - collapsed by default, matching the source
- **Media Box.** Large media sets must pass the SKODA-506 pre-conditioning gate. The downloads block paginates or
  lazy-loads, and does not render 60 eager images.
- **Reuse.** SKODA-805b child pages reuse this importer.

## Acceptance Criteria
- [ ] The first-glimpse page renders all 8 accordions (with correct open/close and ARIA), the embeds, the tags and
      the Media Box (60 assets, Original/1920 per SKODA-502).
- [ ] LCP and CLS are unaffected by the Media Box (lazy-loaded). The Lighthouse mobile score is ≥90 on the page.
- [ ] Visual diff against the source is ≤2% at 1280/768, or deviations are documented. Lint and the accordion block
      test pass.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - 6 intro PDF/JPG downloads, 2 PDF/share banners, 2 contact cards, the 3-link sidebar menu and the Images +51
    preview.
  - The first glimpse is **Vimeo** (not Buzzsprout).
  - The accordions are multi-open, with keyboard/ARIA support.
  - The Media Box collapses behind "Show more" above 8 assets (708px collapsed, 139×44 pill; routed here from the
    closed 502).

## Dependencies
- Upstream: SKODA-607 (PR shell), SKODA-204, SKODA-205, SKODA-502, SKODA-506, SKODA-305 (MR footer).
- Downstream: SKODA-805b (children), SKODA-807 (full FAQ, M2).

## Import contract (SKODA-603)
Contract(s) `accordion`, `quote` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Accordion`, one row per toggle `[summary, body]`, all closed by default. Quotes use the `quote` contract. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
