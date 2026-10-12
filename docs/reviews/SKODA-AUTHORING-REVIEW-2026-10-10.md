# Škoda Storyboard: Authoring Review (EDS + Document Authoring)

*2026-10-10. A review of the migration from an author's point of view: the people who will create and maintain pages in Document Authoring (DA) after go-live. For each area it records what we checked, the EDS/DA best practice, the current state with evidence, the shortcomings, and reconciliation ideas with a priority (**M1** = 15 Oct demo, **M2** = 02 Jan go-live), a rough effort (S ≤ 1 day, M 2–4 days, L ≥ 1 week) and an owning or new ticket.*

**Related:**
- [`SKODA-TEMPLATE-CONTENT-MODELS.md`](../planning/SKODA-TEMPLATE-CONTENT-MODELS.md)
- [`SKODA-BLOCK-DATA-MODEL.md`](../planning/SKODA-BLOCK-DATA-MODEL.md)
- [`SKODA-METADATA-SCHEMA.md`](../planning/SKODA-METADATA-SCHEMA.md)
- [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md)
- [`SKODA-DA-EW-EXTENSIBILITY.md`](../architecture/SKODA-DA-EW-EXTENSIBILITY.md)

---

## 1. Summary: the ten shortcomings that matter most

Ranked by author impact × go-live risk.

| # | Shortcoming | Why it matters to authors | Fix (see §5) | When |
|---|---|---|---|---|
| 1 | **Every content image and image download still points at the origin** (`cdn.skoda-storyboard.com`, `www.skoda-storyboard.com/direct-download/`). In the sampled pages: 56 of 58 `<img>` and every image "Original / 1920px" link | Pages render now from the media-bus copies made at preview. After the origin is switched off, any edit and re-preview re-fetches those URLs, and the downloads break | AR-01 | M2 (blocker) |
| 2 | **No author tooling in DA:** no block library, no page templates; the library config holds one plugin (Tag picker) | A new story, press release or press kit can only be made by copying an existing page and deleting its content | AR-02, AR-03 | M2 (M1: a demo template) |
| 3 | **Tags are entered four times** on a story: the visible `Tags` block, metadata `tags`, and the facet rows (`model`, `years`, …). The tag picker writes only the visible block | Rails, listings and archives read metadata, not the Tags block, so a picker-tagged page can still be missing from a rail | AR-04 | M2 |
| 4 | **The newsletter card is copied into every story:** a 12-row `Newsletter Stub (card)` table, about 1.2 KB, in all 68 live stories | Changing the copy or consent text means editing every story | AR-05 | M2 (S) |
| 5 | **Importer-owned values that authors can't see or change:** `MODEL_CARD_IMAGES`, `BANNER_ZIP_CORRECTIONS`, the link allowlist, `CATEGORY_PARENTS`, model `TAGS`; plus a dead `skoda-model-metadata.js` with hard-coded Elroq data | A re-import silently reverts author decisions; nobody in DA knows these exist | AR-06, AR-07 | M2 |
| 6 | **Config-heavy blocks:** `story-rail` 16 keys plus facets, `stories` 16, `newsletter-stub` 12, `listing` 9; `order` takes raw page paths (#306) | Name/value tables with exact keys and slug values, which authors can't discover or validate (David's Model, Rule #14) | AR-08, AR-09 | M2 |
| 7 | **Index-driven areas behave invisibly:** a card's image is the page's share image (SKODA-839). Pages appear only after publish, and the index can lag by up to 2h | Authors edit a page and "nothing changes" on the home or rails | AR-10, AR-11 | M1 (doc) / M2 |
| 8 | **Very large documents:** the press-kit Images chapter is 90 KB, 195 images, 396 download links in 9 tables. Peaq Images (247 images) can't be previewed at all (200-image limit) | Hard to edit; one added image can block preview | AR-12 | M2 |
| 9 | **Unvalidated, inconsistent conventions:** section `Style` in 10 tokens and two casings (`Style` / `style`), the same token set in different orders, 5 of 34 Section Metadata tables placed at the section start | Authors copy whatever they see; mistakes fail silently, or loudly (`downloads` throws on a bad `collapse` / `columns` value) | AR-13, AR-14 | M2 |
| 10 | **Two vocabularies:** `/config/tags.json` (29 tags, used by the picker) vs `/en/facet-values.json` (275 values, used by the listings) | Tags drift; a picked tag may have no facet label, or the reverse | AR-15 | M2 |

What is already good and should be kept:
- **Bulk metadata** assigns nav, footer and section by URL (`/metadata.json`, 32 rows).
- **Fragments:** nav and footer are plain, block-free fragments.
- **Redirects:** a `redirects` sheet exists.
- **Default content:** most body copy is default content, not blocks.
- **Facets:** a governed facet sheet exists.
- **Push conflict guard:** the push tool refuses to overwrite DA edits without `--force`.
- **Clean HTML:** there is no HTML, CSS or JSON in documents (Rule #15).

---

## 2. Method and limits

- **Best practice sources:**
  - aem.live: David's Model, Markup / Sections / Blocks, Page Metadata, Bulk Metadata, Placeholders, Fragments, Indexing, Redirects, Block Collection, Sidekick Library, Go-Live Checklist;
  - Experience Workspace / DA: Set up library, Authoring, Administering.
  - The links are in §7.
- **Evidence:**
  - 14 DA source documents, read through `admin.da.live`, one or two per template (§6);
  - the DA folder tree and config;
  - the shared sheets: `metadata`, `redirects`, `placeholders`, `facet-values`, `config/tags`;
  - the fragments;
  - the block JS headers and `cfg` keys;
  - the importer and transformer constants;
  - the planning docs and tickets listed above.
- **Limits:**
  - **There was no hands-on DA editor session.** The author experience was judged from document structure and contracts. AR-16 proposes a moderated session with a real editor.
  - Only English was reviewed in depth.
  - Nothing was changed or published.

---

## 3. Areas

### 3.1 Content model and block design
- **What we checked:** the block inventory (24 blocks) and its variants; the config keys per block; how tables look in DA.
- **Best practice:**
  - Blocks are "not great for authoring": prefer default content (David's Model, Rule #1).
  - Keep the number of blocks and variants small (Rule #9).
  - Use name/value pairs "only for configuration … in exceptional cases" (Rule #14).
  - Limit columns (Rule #10).
  - Reuse Block Collection models (Rule #11).
- **Current state:**
  - 24 blocks with about 30 variants: `cards` (`overlay`, `tiles`, `key-facts`, `social`, `media`, `toolbar`, `series-directory`); `gallery` (`slider`, `preview`, `story`); `hero-image` (`overlay`, `archive`); `downloads` (`media-box`, `gallery`); `columns` (`banners`, `callout`, `stats`, `split-62 portrait-235`); `newsletter-stub` (`card`, `topbar`); `tags` (`chips`); `accordion` (`faq`).
  - Config keys read from the block code: `story-rail` 16 plus the index facets; `stories` 16; `newsletter-stub` 12; `listing` 9; `downloads` 6; `embed` 4.
  - `Downloads` rows are **content-sniffed**: the image cell, links cell and date cell are recognised by content, not position. That's robust, but invisible to authors.
- **Shortcomings:**
  - Variant names are developer-speak, and some are cryptic (`split-62 portrait-235`).
  - Rails and feeds are entirely configuration.
  - Several blocks have no visible fallback when a key is wrong.
- **Reconciliation:**
  - Document each block's authoring contract in the block library (AR-02).
  - Rename or alias cryptic variants (AR-13).
  - Replace hand-typed config with library plugins where values are vocabularies, such as rail `template` / `category` / `tags` (AR-08).

### 3.2 Index-driven vs authored content
- **What we checked:** which page areas are edited on the page, and which come from the query index.
- **Best practice:**
  - The index holds published pages only, the same on `.page` and `.live` (Indexing).
  - Author-facing behaviour should be predictable, and documented where it's indirect.
- **Current state:**
  - The home and Media Room homes are almost all index-driven: `promo-box`, `stories`, 6 `story-rail` blocks, 2–5 KB of config. Listings are a single `listing` table.
  - A card shows the target page's `title`, `description` and `image`, so the Models card image is the tag page's metadata `Image`, which is also its share image (SKODA-839).
  - Ordering a rail needs exact page paths (`order`, #306).
- **Shortcomings:**
  - Authors can't tell from the page which document controls a card.
  - Changes appear only after publish, and the index can lag by up to 2h.
  - One field (`Image`) serves both the card and social sharing.
- **Reconciliation:**
  - An author note per rail in the library: "this rail lists X; change a card on its page's Metadata, then publish" (AR-10).
  - A separate `card-image` metadata field with a fallback to `image` (AR-11, open decision D-2).
  - A rail-order picker plugin that writes the `order` row from the index (AR-09).

### 3.3 Metadata
- **What we checked:** the Metadata table per template; bulk metadata; how values are entered.
- **Best practice:**
  - A Metadata table at the end of the document (Page Metadata).
  - Bulk metadata for site-wide or section-wide values (Bulk Metadata).
  - Controlled vocabularies through a library plugin (our own `SKODA-DA-EW-EXTENSIBILITY.md` §4).
- **Current state:**
  - Templates carry 3–13 metadata rows. The press release has 13: `Title`, `Description`, `Image`, `publisheddate`, `template`, `category`, `tags`, `model`, `bodywork`, `technology`, `years`, `company`, `happening`.
  - Values are slugs (`peaq-en`, `karoq-6`, `new-fabia`) that authors must know.
  - The section-wide `nav` / `footer` / `section` values come from bulk `/metadata.json` (32 rows), which is good.
  - `publisheddate` is free text in ISO form. `template` is a free-text enum that every block filter depends on.
- **Shortcomings:**
  - Nothing validates a page's metadata before publish; a typo in `template` or `category` removes the page from every rail.
  - Tags and facets are duplicated (§1 #3).
- **Reconciliation:**
  - A metadata-check step in the publish workflow that reuses `validate-metadata.mjs`, plus a sidekick or plugin button "check this page" (AR-17).
  - A single tag/facet picker that writes the metadata rows *and* the Tags block (AR-04).
  - Move constants such as `template` per folder into bulk metadata (`/en/press-releases/**` → `template: press_release`), so authors never type them (AR-18).

### 3.4 Importer vs DA as the source of truth
- **What we checked:** what happens to author edits on re-import; values that live only in importer code.
- **Best practice:** content lives in the content source; code lives in Git (Rule #15, and the separation of content and code).
- **Current state:**
  - The push records a hash per page and stops on "DA changed since our last push" unless `--force` is used. That held up on 2026-10-09 / 10, when another importer's chapter edits and a DA save were both detected.
  - Values that exist only in code:
    - `MODEL_CARD_IMAGES` (11 card images);
    - `BANNER_ZIP_CORRECTIONS`;
    - `DEMO_PATHS` / `LIVE_ONLY_PATHS` (link allowlist, 281 paths);
    - `CATEGORY_PARENTS`;
    - `TAGS` in `skoda-model-tags.js`;
    - `skoda-model-metadata.js`, which hard-codes **Elroq** title, description, image, model and tags. No import script uses it any more (the model importer uses the shared `skoda-metadata.js`, and the live model pages carry their own model and tags), so it's dead code from the pilot that could mislead a maintainer;
    - `NEWSLETTER_DEFAULTS`.
- **Shortcomings:**
  - There is no written cut-over rule for when DA becomes the source of truth and re-imports stop.
  - Hard-coded values silently overwrite author changes on a forced re-import.
  - The dead Elroq transformer invites reuse.
- **Reconciliation:**
  - Set an importer freeze date per template. After it, only targeted re-imports, after diffing against DA, with author sign-off (AR-06, open decision D-1).
  - Move the content-like constants into DA sheets the importer reads: card images, ZIP corrections, category tree (AR-07).
  - Delete the unused `skoda-model-metadata.js` (AR-07, S).

### 3.5 Links
- **What we checked:** internal vs origin links, the link form authors paste, trailing slashes, filtered links.
- **Best practice:**
  - Authors paste the full URLs they see in the browser (Rule #4).
  - Redirects for moved or retired URLs are kept in the `redirects` sheet (Redirects).
- **Current state:**
  - The link rewrite allowlist now covers every live page (#312).
  - What stays absolute by policy:
    - image downloads;
    - newsletter-settings and consent pages;
    - filtered links to live-only hubs;
    - non-migrated pages.
  - At runtime, `scripts/links.js` (SKODA-609):
    - drops the trailing slash on site-relative links;
    - keeps a short list of origin listing URLs (`DEMO_LISTINGS`) relative;
    - opens every other origin-host link in a new tab.
  - `/en/` and `/slug/` *typed or linked from outside* still return 404 on the demo.
  - The Media Room nav has 11 origin links.
  - `redirects` has 6 rows.
- **Shortcomings:**
  - An author who pastes `https://www.skoda-storyboard.com/en/…` (the old site) gets a new-tab link to the origin, even when the page exists on EDS. At runtime only `DEMO_LISTINGS` are kept in the site.
  - The import-time allowlist doesn't help authors after migration.
- **Reconciliation:**
  - **Extend `scripts/links.js`:** a same-site absolute URL whose path is a published page (checked against the query index, or the published list from #312) becomes site-relative (AR-19).
  - Add trailing-slash and old-host redirects to the `redirects` sheet for the top entry points (AR-20).
  - Clean the Media Room nav links (AR-20).

### 3.6 Images and media
- **What we checked:** how images, PDFs and videos are referenced; size limits; alt text; Media Box authoring.
- **Best practice:**
  - Images are uploaded in DA or referenced by absolute URL; the media bus ingests them at preview.
  - Alt text carries only alt text, with no hidden semantics (Rule #13).
  - Keep documents manageable.
- **Current state:**
  - Image references:
    - **56 of 58 sampled images are origin-CDN URLs**, and image "Original" / "1920px" downloads link `www.skoda-storyboard.com/direct-download/`.
    - PDFs and MP4s link the AEM Assets publish tier, which a developer-machine pipeline uploads and activates (the media manifest).
  - Limits:
    - documents over 200 images can't be previewed (Peaq Images, 247);
    - masters over 10 MB must be pre-conditioned (SKODA-506).
  - Media Box tiles:
    - tile titles often all equal the story title, so every tile has the same name and alt;
    - lightbox-only captions are dropped, except WLTP / CO₂ notes.
  - Tooling: there is no DA-side way to add a PDF or MP4 that the binary gate accepts.
- **Shortcomings:**
  - The dependence on the origin after decommission (§1 #1).
  - Authors can't add downloadable files without a developer.
  - Many tiles share one title.
- **Reconciliation:**
  - **Before decommission, rewrite every DA `<img src>` to its media-bus URL** (read from `.plain.html`) or its DAM delivery URL, and every image download to its AEM Assets original. Script it with the existing media tooling (AR-01, L, M2 blocker).
  - Define the M2 asset flow for authors: AEM Assets → the asset selector in DA, or a plugin that inserts DAM links (AR-21; relates to SKODA-503 / 505).
  - Title tiles from the asset's own title or caption where the source has one (AR-22).
  - Split image-heavy chapters into fragments automatically, keeping each under 150 images (already done for Peaq; AR-12).

### 3.7 Fragments and global content
- **What we checked:** nav and footer fragments, newsletter, placeholders, locale chrome.
- **Best practice:**
  - Fragments for content repeated across pages (Fragments). Fragments "may be harmful" when overused for page content (Rule #12).
  - Placeholders for UI strings, per locale (Placeholders).
- **Current state:**
  - Fragments exist:
    - `/nav`, `/footer`, `/media-room/nav`, `/media-room/footer`, `/nav-newsletter`;
    - nav fragments for cs / de / sk / sr.
  - Unpublished fragments empty the live pages (seen 2026-09).
  - The story newsletter card is **inline in every story** rather than a fragment.
  - `/en/placeholders.json` has 8 keys. The code calls `fetchPlaceholders` in 16 places, but 8 block or script files keep their own hard-coded `LABELS` / `STRINGS`.
  - `/en/fragments/media-feed-images-*` (12) are pipeline carrier documents that authors must not edit.
- **Shortcomings:**
  - The duplicated newsletter card (§1 #4).
  - Most control text can't be translated or edited without code.
  - Generated carrier documents sit among author content.
- **Reconciliation:**
  - Move the story newsletter card into a `/fragments/newsletter-card` fragment, or into block defaults plus placeholders, and strip it from the stories on the next re-push (AR-05).
  - Move all `LABELS` / `STRINGS` keys to placeholders with code defaults (SKODA-1003, AR-23).
  - Move carrier documents to a clearly named folder (`/en/.generated/` or `/tools/feeds/`), add a README document, and exclude it from author views (AR-24).

### 3.8 Sections and Section Metadata
- **What we checked:** the `Style` vocabulary and its placement.
- **Best practice:** a Section Metadata table inside the section it styles, with a small set of documented styles (Markup, Sections, Blocks).
- **Current state:**
  - 10 tokens across the samples: `body-column`, `highlight-dark`, `dark`, `full-width`, `media-box`, `sidebar`, `press-kit-chapters`, `press-kit-banners`, `cover-box`, `compact`.
  - The key is written both `Style` and `style`.
  - The same set appears in different orders (`dark, full-width, media-box` / `media-box, dark, full-width`).
  - 5 of 34 tables sit at the start of their section.
  - The pipeline turns `Style` into classes, so all of these render.
- **Shortcomings:**
  - There is no list of allowed styles.
  - Some tokens (`body-column`, `sidebar`) are layout plumbing that authors shouldn't need to type.
- **Reconciliation:**
  - Publish the style list, with a sample section for each, in the block library (AR-02).
  - Normalise the casing and order on the next re-push (AR-13, S).
  - Longer term, derive the plumbing styles from the template rather than authored styles (AR-14).

### 3.9 Publishing workflow
- **What we checked:** preview → publish, the index timing, who publishes, human gates.
- **Best practice:**
  - Preview on `.page`, publish to `.live`. The index updates on publish (Authoring, Indexing).
  - Go-live checklist: redirects, sitemap, robots, 404, metadata (Go-Live Checklist).
- **Current state:**
  - Migration publishing runs through `push-to-da.mjs` (push, preview, publish).
  - Authors will use the DA / sidekick publish.
  - `human-gate` labels mark visual sign-offs (for example #38).
  - The query index and media feed are cached for up to about 2h.
- **Shortcomings:**
  - There is no author-facing explanation of "published but not in the rail yet".
  - There is no checklist for publishing a new story: metadata, image, tags, then publish the page and any fragment.
- **Reconciliation:**
  - A one-page author runbook: publish order, index timing, how to check the page in the index (AR-25).
  - Add the pre-publish metadata check (AR-17).

### 3.10 Document readability
- **What we checked:** document size and table load for the sampled templates (§6).
- **Best practice:**
  - Documents should read like documents.
  - Avoid nested and very wide tables (Rules #2 and #10).
- **Current state:**
  - Listings and archives are 1–2 KB.
  - Stories are 18–34 KB with 16–19 tables.
  - Press-kit chapters are about 27 KB; the press-kit Images chapter is 90 KB with 9 Downloads tables.
  - There are no nested tables and no nbsp leftovers (the push restores U+F00A0).
- **Shortcomings:**
  - In stories, Media Box tables and rail config dominate the end of the document. Authors scroll past hundreds of download rows to reach the body.
- **Reconciliation:**
  - Move the Media Box into a per-page fragment (`/fragments/media-box/<slug>`), or have it generated from the DAM folder (AR-26, M2; ties to AR-21).

### 3.11 Accessibility in authored content
- **What we checked:** heading structure, alt text, link text, empty links.
- **Best practice:**
  - One `h1` per page.
  - Meaningful alt text and link text.
- **Current state:**
  - **The home, Media Room home and listing pages have no `h1`** in DA (QA #296 reports SEO 69 and accessibility 92–93).
  - Media Box "Original" / "1920px" links get descriptive `aria-label`s from the block.
  - The flattened RS 245 press kit has 3 empty anchors and 222 cart leftovers (SKODA-836).
  - Duplicate tile alts (§3.6).
- **Reconciliation:**
  - Add a visually hidden `h1` to the home and listing documents, or have the template supply it from the metadata title (AR-27, M1, S).
  - Fix RS 245 under SKODA-836.
  - Use asset titles for alts (AR-22).

### 3.12 Author tooling
- **What we checked:** the DA library, templates, the sidekick, author documentation.
- **Best practice:** a library of block documents, page templates (with their required blocks, section breaks, section metadata and metadata), placeholders and icons (Set up library). The sidekick library works the same way for document authoring (Sidekick Library).
- **Current state:**
  - No `/library`, `/blocks` or `/templates` folders in DA.
  - The `library` config sheet has one entry, the Tag picker plugin (SKODA-211), which reads `/config/tags.json`.
  - There is no author guide in the repo or in DA.
  - 33 QA drafts live under `/drafts`.
- **Shortcomings:** new pages can only be made by copying; contracts are known only to developers; draft clutter.
- **Reconciliation:**
  - Build the library: one block document per block and variant, each with an example and a short "how to author" note. Add a `blocks` sheet and the library config (AR-02, M).
  - Page templates for story, press release, press-kit hub, press-kit chapter, and model page (AR-03, M; an M1 demo template for a story is S).
  - Archive the QA drafts to `/drafts/qa/` (AR-24, S).

### 3.13 Localization (M2)
- **Current state:**
  - Only `/en` has content. cs / de / sk / sr have nav fragments and one sample page each.
  - The language switcher uses hreflang (#299).
  - `LABELS` are English.
- **Best practice:** a locale root folder per language with its own placeholders and bulk metadata (Placeholders, Bulk Metadata); translation projects in Experience Workspace.
- **Reconciliation:** follow SKODA-1001 / 1002 / 1003. The prerequisites are AR-23 (placeholders) and AR-18 (bulk metadata per folder).

### 3.14 Editorial governance (M2)
- **Current state:** roles (SKODA-809), embargo (SKODA-811) and audit (SKODA-812) are open M2 tickets.
- **Best practice:** group content the way author teams are organised, for access control (Rule #8).
- **Note:** the current tree (`/en/press-releases`, `/en/press-kits`, the story categories) maps cleanly to Media Room and Storyboard teams, which is a good basis for SKODA-809.

---

## 4. Author journeys (contract walk-through)

| Journey | Steps today | Friction | Fix |
|---|---|---|---|
| **Create a story** | Copy an existing story; delete its body, galleries, Media Box rows and newsletter card values; set 10 metadata rows (template, category, categories with ancestors, tags, model, years, …); add the Tags block; insert images; preview; publish | No template; the categories ancestry and facet slugs must be known; tags entered 3–4×; the newsletter card is copied along | AR-03, AR-04, AR-05, AR-17 |
| **Publish a press release with a Media Box** | As above, plus Downloads rows (image, title, Original + 1920px links) for each asset; PDFs need the DAM pipeline | No author path for PDFs / MP4s; large table; download links point at the origin | AR-21, AR-26, AR-01 |
| **Change a Models card or the rail order** | Card: edit the tag page's metadata `Image`, then publish. Order: edit `order` on `/en` (after #306), then publish `/en` | Indirect (a different page); the image is also the share image; raw paths; index lag | AR-10, AR-11, AR-09 |
| **Replace an image or a PDF** | Image: replace it in the document, then preview (the media bus ingests). PDF: needs a developer (upload, activate, manifest) | Fine for images; impossible for PDFs; a re-import might revert | AR-21, AR-06 |
| **Edit the nav or footer** | Edit `/nav`, `/footer` (or the Media Room ones); preview; **publish the fragment** | Easy, but forgetting to publish the fragment empties `.live`; the MR nav has 11 origin links | AR-25, AR-20 |

---

## 5. Reconciliation backlog

| ID | Action | Area | Priority | Effort | Ticket |
|---|---|---|---|---|---|
| AR-01 | Rewrite DA image `src` and image download links from the origin to media-bus / AEM Assets URLs before decommission | 3.6 | **M2 blocker** | L | new (E05) |
| AR-02 | DA block library: a block document per block and variant with authoring notes; `blocks` sheet; style list | 3.1, 3.8, 3.12 | M2 | M | new (E08) |
| AR-03 | Page templates (story, press release, press-kit hub / chapter, model page); M1: a story template for the demo | 3.12 | M1 (story) / M2 | S / M | new |
| AR-04 | One tag / facet picker that writes the metadata rows and the Tags block together | 3.3 | M2 | M | SKODA-211 (extend) |
| AR-05 | Newsletter card as a fragment or as block defaults; strip the per-story copies on the next re-push | 3.7 | M2 | S | new (with SKODA-904) |
| AR-06 | Written importer-freeze and source-of-truth rule per template | 3.4 | M2 | S | new (E06) |
| AR-07 | Move content-like importer constants to DA sheets; delete the unused Elroq `skoda-model-metadata.js` | 3.4 | M2 (delete: M1) | S / M | new |
| AR-08 | Library plugins for rail and listing config values (template, category, tags) | 3.1 | M2 | M | SKODA-211 family |
| AR-09 | Rail-order picker writing `order` from the index | 3.2 | M2 | S | #306 follow-up |
| AR-10 | Per-rail author notes ("where does this card come from") | 3.2 | M1 (doc) | S | this review |
| AR-11 | Separate `card-image` metadata with a fallback to `image` | 3.2 | M2 | S | SKODA-839 follow-up |
| AR-12 | Automatic fragment split for image-heavy chapters, under 150 images each | 3.6, 3.10 | M2 | M | SKODA-806 |
| AR-13 | Normalise Section Metadata casing and order; alias cryptic variants | 3.1, 3.8 | M2 | S | new |
| AR-14 | Derive layout-plumbing styles (`body-column`, `sidebar`) from the template | 3.8 | M2 | M | new |
| AR-15 | One vocabulary: generate `config/tags.json` from `facet-values`, or the reverse | 3.3 | M2 | S | SKODA-401 / 211 |
| AR-16 | Moderated hands-on DA session with a Škoda editor, using the five journeys | 2 | M1 / M2 | S | new |
| AR-17 | Pre-publish metadata check (reuse `validate-metadata.mjs`; sidekick or plugin button) | 3.3, 3.9 | M2 | M | SKODA-401 |
| AR-18 | Folder-level constants (`template`, `category`) through bulk metadata | 3.3 | M2 | S | new |
| AR-19 | Runtime: same-site absolute links to published pages become site-relative (`links.js`) | 3.5 | M2 | S | SKODA-605 / 609 |
| AR-20 | Redirects for the top trailing-slash and old-host entry points; clean the MR nav origin links | 3.5 | M1 (nav) / M2 | S | SKODA-609 |
| AR-21 | Author asset flow: AEM Assets → DA (asset selector or plugin) for images, PDFs and MP4s | 3.6 | M2 | L | SKODA-503 / 505 |
| AR-22 | Tile titles and alts from the asset title or caption, not the page title | 3.6, 3.11 | M2 | S | SKODA-830 follow-up |
| AR-23 | All UI strings to placeholders (per locale) | 3.7 | M2 | M | SKODA-1003 |
| AR-24 | Move generated carrier documents and QA drafts out of author space | 3.7, 3.12 | M1 | S | new |
| AR-25 | One-page author runbook (publish order, fragments, index timing) | 3.9 | M1 | S | this review |
| AR-26 | Media Box as a per-page fragment or DAM-folder-driven | 3.10 | M2 | M | SKODA-806 / 505 |
| AR-27 | `h1` on the home, Media Room home and listing pages | 3.11 | **M1** | S | #296 |

### Open decisions

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| D-1 | When does DA become the source of truth (importer freeze)? | a) per template once its QA passes; b) one site-wide date before go-live; c) never (keep re-importing) | **a**, with a written rule (AR-06). Re-imports after the freeze only on request, diffed against DA |
| D-2 | Card image vs share image | a) keep one `Image` (status quo); b) add `card-image` with a fallback to `image` (AR-11) | **b**: cheap, and editors can change one without the other |
| D-3 | How authors pick tags and facets | a) free text; b) extend the Tag picker to write the metadata rows (AR-04); c) Structured Content `enum` for single values | **b** for tags and facets; **c** for `template` / `category`, if they don't move to bulk metadata (AR-18) |
| D-4 | Media Box authoring model | a) authored Downloads tables (status quo); b) a per-page fragment; c) generated from a DAM folder (AR-21 / 26) | **c** for M2, if AEM Assets is the single source of truth (the user's earlier direction), else **b** |
| D-5 | Origin decommission order | rewrite images and downloads before the switch-off (AR-01) | Do AR-01 before any origin shutdown date is fixed |
| D-6 | M1 demo scope from this review | AR-03 (story template), AR-10 / 25 (author notes and runbook), AR-24 (draft clean-up), AR-27 (`h1`), AR-07 dead-code delete, AR-20 MR nav | Small, low-risk items only; everything else M2 |

---

## 6. Appendix A: sampled DA documents

| Template | Path | Size | Images | Tables | Metadata rows | Origin links | `h1` |
|---|---|---|---|---|---|---|---|
| home | `/en` | 3 KB | 1 | 18 | 5 | 2 | 0 |
| Media Room home | `/en/media-room` | 2 KB | 3 | 9 | 3 | 4 | 0 |
| story | `/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia` | 18 KB | 31 | 16 | 10 | 28 | 1 |
| story (long) | `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague` | 34 KB | 66 | 19 | 10 | 60 | 1 |
| press release | `/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain` | 19 KB | 18 | 9 | 13 | 23 | 1 |
| press-kit hub | `/en/press-kits/skoda-peaq-press-kit-2` | 5 KB | 17 | 4 | 10 | 0 | 1 |
| press-kit chapter | `/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-rs-1975-…` | 27 KB | 33 | 10 | 11 | 51 | 1 |
| press-kit Images | `/en/press-kits/skoda-epiq-press-kit-2/images` | 90 KB | 195 | 14 | 13 | 396 | 1 |
| model page | `/en/skoda-model/elroq` | 7 KB | 9 | 10 | 8 | 1 | 1 |
| series hub | `/en/series/130-years` | 5 KB | 16 | 3 | 7 | 13 | 1 |
| category archive | `/en/category/emobility` | <1 KB | 1 | 3 | 3 | 0 | 1 |
| tag archive | `/en/tag/model/elroq` | 1 KB | 3 | 3 | 6 | 0 | 1 |
| News listing | `/en/news` | <1 KB | 0 | 2 | 3 | 0 | 0 |
| Images listing | `/en/images` | <1 KB | 0 | 2 | 4 | 0 | 0 |

"Tables" counts blocks, including Section Metadata and Metadata. "Origin links" are mostly image download links (`/direct-download/`).

**Shared content:**

| Kind | Items |
|---|---|
| Fragments | `/nav` (42 links), `/footer` (40), `/media-room/nav` (33, 11 to the origin), `/media-room/footer` (Newsletter Stub), `/nav-newsletter` (`Newsletter Stub (topbar)`) |
| Sheets | `/metadata` (32 rows: `nav`, `footer`, `section`, `alternates`), `/redirects` (6), `/en/placeholders` (8 keys), `/en/facet-values` (275), `/config/tags` (29) |
| Config | `library`: Tag picker only |
| Other | 33 QA drafts under `/drafts`; 12 media-feed carrier documents in `/en/fragments` |

## 7. Appendix B: best-practice references

- [David's Model, second take](https://www.aem.live/docs/davidsmodel): Rules #1–#15 cited above.
- [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)
- [Authoring and Publishing Content](https://www.aem.live/docs/authoring) · [Where to author your site](https://www.aem.live/docs/authoring-guide)
- [Page Metadata](https://www.aem.live/docs/metadata) · [Bulk Metadata](https://www.aem.live/docs/bulk-metadata)
- [Placeholders](https://www.aem.live/docs/placeholders) · [Fragments](https://www.aem.live/docs/fragments)
- [Indexing](https://www.aem.live/developer/indexing): the index holds published pages only.
- [Redirects](https://www.aem.live/docs/redirects) · [Go-Live Checklist](https://www.aem.live/docs/go-live-checklist)
- [Block Collection](https://www.aem.live/developer/block-collection) · [Sidekick Library](https://www.aem.live/docs/sidekick-library)
- [Experience Workspace: set up library](https://www.aem.live/docs/ew/administering/set-up-library) (blocks, templates, placeholders, icons) · [Authoring](https://www.aem.live/docs/ew/authoring) · [Administering](https://www.aem.live/docs/ew/administering)
- Project: [`SKODA-DA-EW-EXTENSIBILITY.md`](../architecture/SKODA-DA-EW-EXTENSIBILITY.md) (the custom-authoring ladder: variants → library → sheets → enum → DA plugin → Universal Editor).
