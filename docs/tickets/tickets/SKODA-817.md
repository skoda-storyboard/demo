# SKODA-817, Story aside: duplicated "Explore more" teasers + sidebar visual parity
- **Epic:** E08, Editorial at Scale
- **Type:** import + styling
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#120](https://github.com/skoda-storyboard/demo/issues/120)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** ✅ **Done.** Importer merged in PR #113; sidebar CSS merged in
  [PR #160](https://github.com/skoda-storyboard/demo/pull/160); #120 closed.

## Origin
Side-by-side QA of the Epiq story (1440px, 2026-09-24).

## Problem (measured)
- **Content bug (fixed in PR #113):** the sidebar initially showed **6 cards for 3 teasers**:
  one image-less row and one image row per story. Published Epiq content now has
  3 image-bearing rows and both "Explore more" and "Tags" headings.
- **Visual (remeasured with Chrome DevTools, 2026-09-25):** source headings are
  16px/600/45px above 768px and 20px/600/45px at and below 768px; EDS rendered
  34px/600/42.5px at every width. Source teaser titles are 16px/500/20px versus
  EDS 18px/400/21.6px. Source cards measure 345×194 at 1440px, 185×104 at 768px
  and 355×200 at 375px; EDS measured 328×185, 200×113 and 327×184 respectively.
  **Both already overlay their titles and have an 8px radius and shadow**. The source
  uses a 64px start/0 end inset in the two-column sidebar and 10px on each side
  when stacked; EDS used 40px/40px at 1440px and 24px/24px below 992px.

## Cause
`tools/importer/transformers/skoda-story-aside.js` `relatedCards()` selects
`.related .article-teaser, .related article`. On the source each teaser is
`div.article-teaser > article`, so both nodes match. The dedupe only removes identical nodes, so
3 teasers become 6 rows. Both rows reference the same `<img>`, and `createTable` moves it into the
second row, which leaves the first row image-less.

## Scope
- Keep only the outermost matched teaser (drop matches nested inside another match).
- Emit the "Tags" heading before the Tags block. Keep using the existing **Tags block (SKODA-205)**
  for the tag labels. It already renders correctly (`2026`, `EPIQ` chips), so no new tag markup or CSS.
- Scope sidebar insets and responsive headings to `body.story .section.sidebar`,
  and teaser-title typography and the single-column card grid to the story sidebar
  in `blocks/cards/cards.css`. Preserve the existing overlay, 8px radius and shadow.
- Newsletter sign-up widget → SKODA-823. Side banner (`.side-banner .sa-bnr`) → SKODA-903 (banner
  platform); both stay dropped by this importer until then.

## Acceptance Criteria
- [x] Exactly 3 teaser rows, each with an image and a linked title (published Epiq markup).
- [ ] At 1440, "Explore more" and "Tags" are 16px/600/45px in `rgb(53,53,53)`;
      cards are ~345×194 with white 16px/500/20px titles over the image, the existing
      8px radius/shadow, no toolbar, and a 32px gap above "Tags".
- [ ] At 768 and 375, headings are 20px/600/45px and cards match the source widths (~185px and ~355px); the body
      and aside still stack below 768px, with 3 full-width teasers in one column at 767px.
- [x] Unit/regression check on the transformer (nested teaser markup gives N rows, not 2N).

## Heading levels, #387 / #404 (2026-10-29, branch `fix-387-404-story-headings`)
- **#387, the "Explore more" card titles:** the source has them as h2, under the h3 "Explore more"
  (`h3.sidebar-heading` + `.related article h2.title`; outline measured on the Peaq and wireless-charging
  stories). All 386 card titles on main were h3. `skoda-story-aside.js` now writes them as h2; the section
  headings stay h3 (#296 / #336). The card title's type and box don't change (`.card-teaser-title`, any level):
  16/20 px 500, title 313×40 / card 345×194 at 1280, the same at 768 and 390, measured on the real template;
  the card click still opens its story. The outline equals the source's.
- **Empty source headings:** the Mallorca and olive-oil stories space paragraphs with `<h6>&nbsp;</h6>`; the
  importer kept them as empty headings. `skoda-story-cleanup.js` drops a heading with no text and no media.
- **#404:** already fixed on main for 137 of 139 stories (re-imports since 20 Oct). Two left:
  - "RS four ways" is one of the 40 stories in the 28 Oct DA batch (see below);
  - the Enyaq / Elroq gaming-consoles story is blocked by the push's binary gate: its MP4 isn't in the DAM.
- **Content:** the 139 stories (132 EN + 7 in the locale trees) were re-imported with this branch and compared
  with preview:
  - 393 card titles h3 → h2 and 8 #404 section headings h2 → h3;
  - 109 links on 55 stories now point at the migrated page instead of the source;
  - the source's current "Explore more" picks;
  - Spacer blocks (#380);
  - restored body sections and quote names (gaming consoles, Sportline, Enyaq RS Race).

  `import:push --dry-run`: 98 update, **40 conflict**, 1 blocked. The 40 were saved in DA on 2026-10-28
  12:03–12:05 by two team members, mostly without a preview; their images now point at DA-hosted copies
  (`content.da.live/…`). A re-push would put the source CDN URLs back, so they are held until the order is agreed
  with whoever ran that batch.
- **Pushed and published, 2026-10-29 (PO requests; PR #548):**
  - **91 EN stories:** pushed, previewed and published. On live, all 268 card titles are h2 and every section
    heading is h3; no empty headings; DA equals what was pushed. Push record committed (15d5387).
  - **7 stories in the locale trees** (4 CS, DE, SK, SR): pushed and previewed, **not published**. The publish
    gate stops on their `/{cs,de,sk,sr}/fragments/newsletter-card`: CS is preview-only; DE / SK / SR don't exist.
    Open: publish the CS fragment and create the others, or publish the stories without them, as they are live
    today.
  - **40 held** (the 28 Oct DA image batch, above) and **1 blocked** (gaming consoles: its MP4 isn't in the DAM)
    keep their old content: h3 card titles, and on "RS four ways" the #404 h2 section headings.
- **Checked on live** (PR #548):
  - the outline equals the source's (`H3 Explore more | H2 ×3 | H3 Tags`);
  - the card type and boxes are unchanged at 1280 / 768 / 390;
  - real clicks: a migrated target opens in the same tab, an unmigrated one the source in a new tab;
  - axe: no new violations; the existing `heading-order` (the newsletter h3 after the h1, as on the source) and
    one body-link contrast remain;
  - no broken images, no visible Spacer text, the in-site links resolve;
  - the newsletter-card fragment re-imports unchanged.
- **Found, not changed here (notes, no issues filed):**
  - some hero images carry a literal `<br>` in their alt (`ŠKODA 4×4: <br>Your Best Bet in the Snow`), on main
    too;
  - the locale stories' newsletter-card fragments (above);
  - the card title box is 313×40 against the source's 345×72 at 1280 (type equal), on main before this change too.

## Dependencies
SKODA-801 (aside rebuild), SKODA-201 (cards/card-teaser overlay style).
