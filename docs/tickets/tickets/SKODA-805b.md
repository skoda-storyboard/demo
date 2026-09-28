# SKODA-805b, Press-kit chapter/resource child pages for the M1 hubs

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805/806)
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 **Could** tier (depends on decision D-1)
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

## Decision (2026-09-28)

**D-1 = A, import all children** (Lars). The source has **49** children, not 50: Peaq-2 13, Epiq-2 13,
Motorsport 23. Motorsport's 24th tile, "The new Enyaq RS Race – Press Kit", is a separate kit. It
stays an absolute live link that opens in a new tab. The 49 URLs are in `skoda-m1-url-set.txt`
under the `PRESS KITS ADDENDUM (49 children)` header. This supersedes the #189 selected-child slice
(the Peaq-2 Introduction only).

## Implementation (branch `skoda-805b-press-kit-children`, stacked on SKODA-805a)

All 49 pages use the source's `press_kit-template-default` shell, in 8 shapes: narrative with row
toggles, narrative without toggles (Motorsport), FAQ, Texts, Infographics, Technical data, Images,
and Videos. The #189 importer `import-press-kit-default.js` now handles all 8. It detects each
shape from the content, never from the URL:

- **Media Box is optional.** FAQ, Texts, Infographics, Technical data and Images pages have none.
  They get no `#media-box` section and no sidebar "+N" link. A page missing its title, body or
  Chapters list still fails.
- **Images pages.** Each `widget-title` gallery group becomes `## <group>` plus its own `Downloads`
  block, in source order (Peaq 246, Epiq 194, Motorsport 80 assets). The template collapses each
  group to 8 tiles behind Show more, as the source's togglebox does. The "related press releases"
  cover-box is dropped, as on every press-kit page.
- **Videos.** Each clip keeps its Vimeo embed plus a `Download MP4` link for the icon-only master
  download.
- **Layout tables.** SiteOrigin layout `<table>`s ("Find out more", the WhatsApp banner, the Texts
  chapter list) flatten to default content. The decorative 512px WhatsApp icon is dropped. The one
  data table, the Peaq FAQ's variant specs, becomes one labelled list per variant ("**Peaq 60**",
  then "Range: Over 450 km", …), because a block can't nest inside an Accordion cell. An irregular
  data table (colspan or ragged rows) fails the import instead of being flattened.
- **In-body `.sb-gallery`** (2 Motorsport pages): lead image, caption, and a `+N` link to the Media Box.
- **Image-only binary banners** are named `Download PDF` / `Download MP4` for the SKODA-503 gate.
- **Metadata.** A child is identified by its Chapters `link-intro` pointing at another page (the
  hub). It gets `template=press_kit_chapter`, `theme=press-kit` (to load the template),
  `presskit=<hub path>` and the hub's `model`/`tags`. Because the template is `press_kit_chapter`,
  children stay out of the model and MR Press Kits rails.
- **Template.** The Chapters menu marks the current page with `aria-current="page"`. Fixed in #189:
  the `body-column`/`sidebar` grid columns never applied (specificity), and the Media Box got a
  second Show more on top of the Downloads block's own (SKODA-510) disclosure.

**Verification (local).**
- The importer runs on the cached source for 49/49 pages, with 0 errors.
- `media:validate-metadata` 49/0; `import:validate-blocks` 49 checked, 0 errors.
- Link crawl: 0 broken in-site links (886 child → child, 49 child → hub).
- Browser QA at 1280, 768 and 375, one page per shape: 44px sticky nav, 2/3 + 1/3 columns from
  768, stacked at 375, 26px h1, closed accordions with button headings, no horizontal overflow.

**Open.**
- DA push and preview need admin auth. The SKODA-503 gate also needs AEM Assets ingest for the
  PDF/MP4 links, which is a developer-machine step. The SKODA-805a hubs must be in DA for
  hub → child → hub.
- The Motorsport Images page links to a stale chapter slug (`…/a-family-saloon-in-rally-skoda-1000-mb-and-1100-mb-b5`)
  that also 404s on the live source. It is kept as-is.
- Vimeo clips are domain-restricted, so they show "Sorry" outside skoda-storyboard.com.

The acceptance criteria stay open until the DA preview, browser QA and the no-404 crawl pass on
the branch preview.
