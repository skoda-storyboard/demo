# SKODA-805b, Press-kit chapter/resource child pages for the M1 hubs

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805/806)
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (D-1 = A, Architect 2026-09-28; was Could)
- **Estimate:** 5–8 SP (option A, chosen 2026-09-28) · was 3 SP planned for option B · option C (link-out) ≈ 1 SP *(planning estimate, not a quote)*
- **Parent:** SKODA-805 (#66) · **GitHub issue:** [#129](https://github.com/skoda-storyboard/demo/issues/129)

## Summary
The 3 in-scope tiles hubs link to **49 child pages** outside the 43-URL set: Peaq 13, Epiq 13, Motorsport 23
(the original count of 50 included Motorsport's cross-kit Enyaq RS Race tile). The children are the substance of a
press kit: chapter narrative, resources and media groups. Without them a hub is a "brochure cover".

**Decision D-1** (gap review) chooses between:

| Option | Scope | Effort |
|---|---|---|
| **A. Import all 50** | Child pages via the 805c `press_kit-template-default` importer (story-detail-style two-column article). Adds a sticky Chapters sub-nav. | 5–8 SP |
| **B. Import one kit's children (recommended)** | Peaq, 13 pages: the flagship narrative plus model tie-in. Epiq and Motorsport tiles link out to live via SKODA-609. | 3 SP |
| **C. Link out** | All tiles open the live source in a new tab (SKODA-609 policy b). | ≈1 SP, inside 609 |

## Requirements / Spec
- **Options A and B:**
  - reuse the SKODA-805c importer and its row-toggle accordion
  - map the media groups to `downloads` (SKODA-502); the whole-kit ZIP (806) stays M2
  - add the sticky Chapters sub-nav from [`press-kit-template.md`](../../ui-specs/press-kit-template.md), 44px, as
    a light section/nav
- **Option C:** no content work; the SKODA-609 link policy applies.
- **Tracking:** record the chosen option and its URL list in the SKODA-603 tracker and in `skoda-m1-url-set.txt`
  (under an addendum header).

## Acceptance Criteria
- [x] The chosen option is recorded in the gap review decision log (§12 D-1 = A).
- [ ] Options A/B: every imported child renders its chapter content, accordions, downloads and Chapters sub-nav, and
      navigating hub → child → hub works.
- [ ] Option C: no tile produces an in-site 404, and external tiles open in a new tab.

## Dependencies
- Upstream: SKODA-805a, SKODA-805c, SKODA-502, SKODA-609, SKODA-602.

## Decision: D-1 = A, import all 50 (Architect sign-off 2026-09-28)

Milestone moves from Could to **M1 scope**. The 50 tile targets (Peaq-2 13, Epiq-2 13,
Motorsport 23 + its cross-kit Enyaq RS Race tile) are listed under `PRESS KITS: CHILDREN (50)`
in `skoda-m1-url-set.txt` and in the link allow-list.

**Source census (2026-09-28, trial import in a scratch workspace):**
- All 50 are `press_kit-template-default`, imported by `import-press-kit-default`.
- **36 chapter pages import as-is.**
- **14 resource pages fail**: Texts, FAQ, Infographics, Technical data, Images, Videos (Peaq and
  Epiq), plus Motorsport Texts and Images. They have an article body but **no Media Box**, which the
  importer requires. Content: inline image grids (246 / 196 / 82 items), video grids (11), FAQ row
  toggles (28 / 5), Texts tables with 8–20 PDFs. Mapping (Architect): reuse existing blocks,
  grids → Downloads, toggles → Accordion, PDFs → Downloads file rows.
- **40 of 50 link PDFs/MP4s (≈102)**: their DA push is held by the SKODA-503 binary gate until the
  developer-machine DAM ingest.

## Implementation (#189 on `main`, reconciled with PR #202)

Two implementations were written in parallel: #189's (merged, and imported/published) and PR #202's.
The merge keeps whichever behaviour was correct for each case, verified by importing all 51 pages
(50 children + first-glimpse) with both bundles and the merged one. Every page shape is detected from
the content, never from the URL:

- **Media Box is optional.** Resource pages get no `#media-box` section and no sidebar "+N" link.
- **Images pages (PR #202 output, #189 ordering).** Each gallery group becomes `## <widget-title>` plus
  its own `Downloads` block with `collapse | auto`, as the source's togglebox shows two rows first. The
  whole `.search-results-gallery` is converted *before* the body is flattened, so every image keeps its
  Original + 1920px links, and the gallery's select-all toolbar and Show more/less text no longer leak
  into the page. #202 converted after flattening, which lost the download sizes and failed Motorsport
  Images ("no download URL"); #189 converted only the inner grid, which leaked that chrome and dropped
  the group titles.
- **Videos (#189).** Each clip keeps its embed plus a `Download video` link to the MP4 master. #202
  linked the first cart action, which is the add-to-cart `#` on Videos pages, so it emitted none.
- **Tables (#189's engine, layout case fixed).** A one-column table (Texts chapter list) becomes its
  header as an `h3` plus a list. A data table (2+ rows with 2+ text cells; the Peaq FAQ variant specs)
  becomes one text line per row. Any other multi-column table is layout: its cells become content with
  their links and images, and the decorative WhatsApp icon is dropped. Before the fix, #189 read a
  single-row layout table as a header and kept only the first cell's text, so the "What's up, Škoda?"
  WhatsApp callout vanished from 36 pages and the Enyaq RS Race "130 years" banner lost its image and link.
- **In-body `.sb-gallery` (PR #202; 3 pages: 2 Motorsport chapters + Enyaq RS Race):** lead image,
  caption, and a `+N` link to the Media Box, instead of the lead plus four 384px thumbnails.
- **Image-only binary links (#189).** A real alt becomes the link `title` (for example "Technical data
  Peaq"); a placeholder alt is replaced by what the link does ("Download PDF", "Share by email"). The
  SKODA-503 gate reads the title.
- **Metadata (PR #202).** A page whose Chapters `link-intro` points at another page is a child:
  `template=press_kit_chapter`, `theme=press-kit` (loads the template), `presskit=<hub path>` and the
  hub's `model`/`tags`. The 49 children therefore leave the Press Kits rails and listings, which on
  2026-09-29 still showed 45 published children as `press_kit`. The hubs and the standalone kits
  (first-glimpse, Enyaq RS Race) keep `press_kit`.
- **Chapters nav (PR #202).** The hub link takes its `title` ("Škoda Peaq – Press Kit") instead of a
  second "Introduction". The template marks the current page with `aria-current="page"`.

**Merge verification (2026-09-29).** Imported all 51 pages (50 tiles + first-glimpse) with `main`'s
bundle, PR #202's bundle and the merged bundle:

- PR #202 alone failed Motorsport Images; the merged importer passes 51/51.
- Merged vs `main`: no PDF, MP4 or image download link changed, and no body text was lost (contact
  cards 16/16). Every difference is intended: the chapter metadata on the 49 children, the hub-link
  label, Images headings and `collapse auto` without chrome, the WhatsApp callout back on 36 pages, the
  Enyaq "130 years" link, and the in-body gallery "+N".
- Shared transformers: the other importers' bundles change only by the `presskit` passthrough and the
  regenerated (same-set, sorted) link allow-list.
- Runtime: the press-kit grid specificity fix puts the sidebar beside the body from 768; on `main` it
  sat below the body, full width.

**Re-import.** The published children still carry the #189 output. They change on the next re-import
and push (metadata, Images, WhatsApp callout, in-body galleries). That wave also reindexes the Press
Kits rails.
