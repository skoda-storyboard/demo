# SKODA-806, Press Kit grouped media/download areas + whole-kit ZIP
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*
- **Status (2026-10-08):** 🟡 IN REVIEW (Images chapters), branch `skoda-806-press-kit-media`. Draft: `/drafts/skoda-806-press-kit-images`.
  The whole-kit ZIP (DAM hosting) is a follow-up PR; see Build notes. Spec: [`press-kit-media.md`](../../ui-specs/press-kit-media.md) §11.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/press-kit-media.md`](../../ui-specs/press-kit-media.md)** (captured via Chrome DevTools on the live Peaq kit). Read it before implementing.

Key facts from capture (resolves §11.11-12):
- **Decision resolved → STACKED separate sections/pages** (no tabs, no accordion chrome in source). The presentation variant defaults to stacked.
- Five ordered groups: Texts, Infographics, Technical data, Images, Videos. Images reuse `downloads.md` (round `50px` download button, Original/1920px).
- Whole-kit ZIP is **not in the static DOM** (dynamic/scripted) → wire to the media-cart "Download package" **server-side reduction** path (D2), not a second bespoke zip.

## Summary
Deliver the five grouped supporting-content areas on a Press Kit detail page, Texts, Infographics, Technical data, Images, Videos, with per-item downloads, plus the whole-kit ZIP download. Reuses the Downloads block (SKODA-502) and the media-cart download path (SKODA-505/902); the ZIP reduction/packaging is the non-EDS-native piece.

## Description
Confirmed on the live Peaq kit (requirements §11.11) as **five sequential named areas** in order:
1. **Texts**, downloadable text content (article text, backgrounders).
2. **Infographics**, the preview-image → PDF pattern (same as §11.4 / MR-PR05).
3. **Technical data**, structured specification data for the model/variant.
4. **Images**, downloadable image set (Original / 1920px dual-rendition pattern used site-wide).
5. **Videos**, downloadable/embeddable video set.

Whether these render as **tabs, accordion, or stacked sections** is a visual/interaction detail to confirm during design (§11.11), the content model (five grouped, ordered areas of download items) is the ticket; presentation is a variant.

**Whole-kit ZIP (MR-PK07, §11.12):** in addition to per-item downloads, the kit downloads as a single ZIP. This was not observable in the static snapshot (dynamic/scripted control), mechanism to confirm with the technical team. It is the **same non-EDS-native download-packaging problem as the media cart**, so it rides on the D2 reframe: **server-side reduction/packaging** (App Builder / AEM Assets renditions), client-side zip demoted.

## Requirements / Spec
- Grouped-download block: N ordered named groups, each a list of download items (title + size label + rendition link), populated at import from `mediakit/v1/mediabox` data (per SKODA-502).
- Infographics group uses the preview-image→PDF pattern (shared with MR-PR05).
- Images group exposes the Original / 1920px dual rendition (ties to rendition strategy, D2/§6.9).
- Presentation variant (tabs / accordion / stacked) selectable via block config/section metadata, default stacked, confirm in design.
- Whole-kit ZIP action wired to the media-cart download-reduction service (SKODA-505 demo / SKODA-902 prod); do **not** build a second bespoke zip path.
- Individual asset download (MR-PK06) = the existing per-item Downloads behaviour.

## Acceptance Criteria
- [x] All five groups render in the confirmed order with per-item downloads. *(The five areas are the kit's child pages, as on the source (805b). Peaq-2 Images no longer 404s once pushed: its Exterior group is a fragment.)*
- [ ] Infographic items show a preview image linking to a downloadable PDF.
- [x] Image items expose the Original + 1920px renditions. *(Per-tile menu Original / 1920px; group pills "Original" (adds the group) / "1920px" (inert, originals-only cart).)*
- [ ] "Download complete press kit" produces a single package via the shared reduction/packaging service (no separate bespoke zip implementation).
- [x] Presentation is **stacked** (source-confirmed; no tabs/accordion). Any optional tab/accordion variant stays accessible (keyboard + ARIA) if used.
- [x] Output passes lint and matches source grouping in local preview. *(All ten Peaq group headings at the source offsets at 1280/520/390, ±1px at 992/768; spec §11.)*
- [ ] Visual diff vs source at 1280/768 ≤ 2% per-pixel (per [`press-kit-media.md` §9](../../ui-specs/press-kit-media.md)).

## Dependencies
- Upstream: SKODA-805 (press-kit template hosts these areas), SKODA-502 (Downloads block + mediabox), SKODA-505 (media-cart download reduction, demo), SKODA-501 (masters-only ingest)
- Downstream: SKODA-902 (production download-reduction hardening, the ZIP at scale)

## Risks / Flags
- **Demo path available (SKODA-505a, #50):** `downloadItems(items, { onProgress, signal })` in `/scripts/media-cart.js` zips an explicit list of DAM originals client-side (STORE, within the cart caps of 80 items and 1 GiB). The items come from `resolve(href)` in `/scripts/media-cart-resolver.js`. Items past the caps come back in `failed`. Several kits are larger (Epiq 9.3 GiB, Peaq 8.7 GiB), so a full whole-kit zip still needs the D2 server-side reduction. `addMany(entries)` adds a gallery to the cart with the source's partial-fill cap. The whole-kit zip can use them in M1 until the D2 server-side reduction exists; don't build a second zip path.
- **ZIP mechanism (🟠, §11.12):** dynamic/scripted control not seen in snapshot, confirm implementation with the technical team; depends on the D2 media-cart reduction approach.
- **Presentation TBD (🟡, §11.11):** tabs vs accordion vs stacked, design decision; if tabs/accordion, adds a11y focus/ARIA scope.
- Rendition strategy (Original/1920px) ties to Dynamic Media confirmation (D5/§6.9).

## Build notes (2026-10-08)
- **Source findings that changed the plan:**
  - **The whole-kit ZIP is not dynamic.** The hub's download banner (`ikony_sb_landscape_down…png`, 604×302) links a
    pre-built ZIP on the source CDN (`2026/09/Skoda_Peaq_323f2835.zip`, `2026/08/Skoda_Epiq_c5a5f2fe.zip`), and the
    EDS hubs already carry it (`Columns (banners)`). Moving it to the DAM needs an `archive` kind in the shared binary
    pipeline (SKODA-503 gate: the hubs would hold publish until the ingest), so it is a separate PR. **The ZIP AC stays
    open.**
  - **Source Images groups collapse** (two rows + a fading 64px opener bar), so collapsing stays.
- **`Downloads (gallery)`** (`blocks/downloads`, the owning block; the default and Media Box variants are unchanged):
  - the source tile (thumb only, discs over the lower left), the Media Box grid ladder, the opener bar and group gaps;
  - the "Original" / "1920px" group pills ("Original" adds the group, "1920px" is inert because the cart holds
    originals only).
- **Heading:** the group heading is styled as the source h3 (`templates/press-kit/press-kit.css`) and stays an h2.
- **Importer:**
  - `press-kit-media.js` emits the variant;
  - `import-press-kit-default.js` moves an Images chapter's largest groups to fragments past 195 tiles (Peaq-2:
    Exterior → `/fragments/en/press-kits/skoda-peaq-press-kit-2/images/exterior`), each imported from
    `?fragment=<slug>`;
  - `push-lib` `pagePath()` maps that URL to the fragment path;
  - `urls-press-kit-default.txt` lists it. Contract: `main.downloads.variants` gains `gallery`.
- **PR #287 review (2026-10-08):**
  - **publish order:** `import:push` publishes a page's content fragments first and holds the page while one is
    missing or failed (`contentFragmentPaths` / `fragmentOrder` / `fragmentHolds`, push regression tests);
  - **image limit:** the split counts every image the page keeps, refuses a group over 200, and checks each emitted
    document (boundary tests);
  - **Media Box precedence:** a `gallery` block in a Media Box section loses the class, with a CSS isolation test.
- **Follow-ups:**
  - the ZIP in the DAM (archive kind + manifest rows);
  - the Texts table rows, the Infographics spacer rhythm and the Technical-data image width (template / importer
    polish);
  - pushing the re-imported Images chapters and the fragment after merge (`import:push`, with
    `--publish-fragments` not needed: the fragment is a listed page, and push publishes it before the chapter).

