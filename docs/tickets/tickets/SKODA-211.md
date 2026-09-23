# SKODA-211, DA tag-management library plugin (DA_SDK multi-select, productionize PoC)
- **Epic:** E02, Core Blocks (authoring)
- **Type:** integration · **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** ~3 SP
- **Relates to:** decision D13 (DA vs Universal Editor), build-confirmed in this tenant 2026-09-16.
- **GitHub status:** CLOSED (done).

## Summary
Give authors a real tag-management control inside DA / Experience Workspace so they can pick taxonomy tags without App Builder or Universal Editor. Productionize the build-confirmed PoC (skoda-storyboard/poc/tag-multiselect/) into a demo DA library plugin: a hosted HTML/JS page that talks to the editor over the DA_SDK postMessage bridge and writes a Tags block via sendHTML. This is rung 4 of the extensibility ladder in docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md.

## Requirements / Spec
- Host the plugin under the demo repo (e.g. poc/tag-multiselect/), served at the preview URL (localhost will not load inside the https canvas).
- Register a library config sheet row: title | path | experience=dialog (mind the exact path header).
- Vocabulary: the 15-facet taxonomy + 4 story categories, hardcoded initially, with the option to fetch a governed DA Sheet later (no redeploy to change the list).
- Multi-select with select-all / clear / search; render-first, connect-in-background pattern so the panel never hangs.
- On confirm, actions.sendHTML(Tags block table) aligned to the SKODA-205 Tags-block markup and the SKODA-401 facet taxonomy; then closeLibrary().
- Must surface in BOTH the classic DA editor Library palette and the Experience Workspace canvas panel.

## Acceptance Criteria
- [ ] An author opens the plugin, multi-selects tags, and it inserts a Tags block that SKODA-205 renders and SKODA-401 facets recognise.
- [ ] Emitted Tags-block HTML matches the expected markup for a given selection (unit/smoke test).
- [ ] Works in the DA editor Library AND the EW canvas panel.
- [ ] Vocabulary can be swapped to a DA Sheet without code change (documented, even if hardcoded for the demo).
- [ ] npm run lint clean.

## Dependencies
- Upstream: SKODA-102 (repo + preview hosting), SKODA-205 (Tags block output contract), SKODA-401 (facet taxonomy).
- Reference: skoda-storyboard/poc/tag-multiselect/, docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md §3/§8.

## Agent handoff
hybrid: the vocabulary handling + DA_SDK sendHTML write logic is a self-contained agent slice (oracle: emitted Tags-block HTML matches expected for a given selection; openable standalone for a smoke test). The picker UI/UX and the in-editor verification are the human visual gate.
