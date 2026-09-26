# SKODA-222, Stories: featured model card on model tag archives (UI)
- **Epic:** E02, Core Blocks
- **Type:** block feature + visual
- **Phase:** A · **Milestone:** M1 Should (demo-visible on 11 model tag pages)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-26):** 🔵 TODO. **Content is already imported** (contract `stories-feature`, pinned):
  11 archives carry the card in DA, and the block ignores it until this ticket lands.

## Origin
SKODA-209 M1 slice (2026-09-26). It's split out because it spans two areas (stakeholder decision): the
**import** (done, SKODA-209) and the **UI representation** (this ticket: `stories` block + CSS).

## Source (measured 2026-09-26, `/en/tag/model/epiq/`)
- **Where:** 11 of the 13 model tag archives show `.featured-model` in the archive grid: Elroq, Enyaq, Epiq,
  Fabia, Kamiq, Karoq, Kodiaq, Octavia, Peaq, Scala, Superb. Kylaq and Slavia have none, and non-model tags have none.
- **Content:** an `h2.toggle` "Explore the <Model>", a model-specific image (1440 wide, not the model page hero),
  then a `ul` of CTAs. The primary `a.btn` "Discover the highlights" goes to the model page. The secondary
  `a.btn-secondary` "Images" and "Videos" go to the media listings, pre-filtered by model (some also by bodywork).
- **Placement is responsive.** In the DOM the card is the first grid child.
  - 1440: the **3rd visual slot** (right column, first row), **416×465**, about 2 story-card rows tall
    (story cards are 416×223).
  - 768: **first, full width**, 768×161, collapsed.
  - 390: **first, full width**, 390×201, collapsed. `h2.toggle` is the expand/collapse control.

## DA shape (already imported, contract `stories-feature` v1)
One extra row in the page's `Stories` table: `[feature, <cell>]`. The cell holds a `<picture>`, an `<h3>` title,
and one `<p>` per CTA. The primary CTA is wrapped in `<strong>`. The CTA hrefs are site-relative (SKODA-605).
Their targets go live with SKODA-208 (model pages) and SKODA-608 (Images/Videos listings); until then they 404, by
stakeholder decision (2026-09-26).

## Scope
- `blocks/stories`: read the `feature` row (it's cleared today with the other config rows) and render the card in
  the grid. Measure the placement and styling from the source with DevTools: the desktop slot/span, the
  mobile/tablet first-and-collapsible behaviour, image ratio, title, and button styles. Reuse the existing button
  tokens.
- Accessibility: the collapsible title is a real `<button aria-expanded>` (or `<details>`), and the CTAs are links.
- Load more keeps working, and the card doesn't count toward `initial` / `perpage`.
- Contract: move `feature` from `pending` to `stories.configKeys` on `main` in the same PR.
- Unit tests for the config read. Browser QA against the source at 1440 / 1024 / 768 / 390.

## Acceptance Criteria
- [ ] On the 11 archives, the card renders where the source shows it at 1440, 768 and 390 (±4px geometry), with
      the same content and CTAs.
- [ ] Below 1024 the card starts collapsed and the title toggles it (keyboard + screen reader).
- [ ] Archives without a `feature` row are unchanged, as are the other `stories` uses (home feed).
- [ ] No re-import needed (shape v1); the 11 pages re-QA'd.

## Dependencies
SKODA-209 (archives + import), SKODA-214 (`stories` block). The CTA targets come with SKODA-208 / SKODA-608.
