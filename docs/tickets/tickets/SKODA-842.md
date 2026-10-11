# SKODA-842, DA block library and page templates for authors

- **Epic:** E08, Editorial at Scale
- **Type:** setup (DA library) + docs
- **Phase:** A · **Milestone:** M2 (a story template could serve the M1 demo)
- **GitHub issue:** [#320](https://github.com/skoda-storyboard/demo/issues/320)
- **Origin:** authoring review [`SKODA-AUTHORING-REVIEW-2026-10-10.md`](../../reviews/SKODA-AUTHORING-REVIEW-2026-10-10.md), AR-02 + AR-03 (user, 2026-10-10: "present a fix", tickets only)
- **Related:**
  - SKODA-211 (the existing `library` config row: Tag picker);
  - SKODA-841 (the options sheet registered here);
  - SKODA-840 (templates without the newsletter table);
  - [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md) and
    `tools/importer/push/block-contracts.json` (the block contracts the library documents).
- **Tooling:** the `excat-block-library` plugin was enabled on 2026-10-10 (user). It generates sample block documents,
  uploads them to DA and wires the Library panel. Use it, then review its output against the contracts.
- **Status (2026-10-10):** 🟡 IN PROGRESS. PR [#322](https://github.com/skoda-storyboard/demo/pull/322) holds the generator, the
  spec and the coverage check (`tools/library/`). The DA sheets, the config rows and the `/library/**` noindex row (preview)
  are done, and the documents are uploaded and previewed (2026-10-11). Waiting on: the acceptance checks in the editor and the live publish of
  the bulk metadata sheet. See "Progress".

## Problem
- **The library is empty.** DA has no `/library`, `/blocks` or `/templates`, and the project `library` config holds one
  row (Tag picker). In the editor, **Blocks** and **Templates** show nothing.
- **New pages start from copies.** A new story, press release or press kit can only be made by copying an existing
  page and stripping its content and metadata.
- **The contracts are hidden.** 24 blocks with about 30 variants and their config keys are documented only in code
  comments and developer docs.

## Fix
Follow the Experience Workspace "Set up library" guide.

1. **`/library/blocks/<block>`:** one document per block, with every variant as an example table (visual variants as
   `Block (variant)`, content variants under a heading).
   - Each gets a `library-metadata` description: purpose, config keys and allowed values, what an omitted row does.
   - It is generated from `block-contracts.json` and the block headers, not hand-written.
2. **`/library/blocks` sheet:** `name | path` (`https://content.da.live/skoda-storyboard/demo/library/blocks/<block>`).
3. **`/library/templates/<template>`:** a full starter page with sections, section `Style`, placeholder prompts
   ("Headline", "Lead paragraph…") and a Metadata table with the fixed values pre-filled. One per template:
   - story;
   - press release;
   - press-kit hub;
   - press-kit chapter;
   - model page.

   Each is built from one canonical live page with its content replaced.
4. **`/library/templates` sheet:** `key | value`.
5. **Project config `library` tab:** Blocks, Templates and Placeholders rows (keep the Tag picker row), plus the
   SKODA-841 options sheet.
6. **Style vocabulary:** a `section-metadata` library entry listing the allowed `Style` tokens (`dark`, `full-width`,
   `media-box`, `highlight-dark`, `cover-box`, `compact`, …) with an example section each.
7. **Regeneration:** a script (or the plugin re-run) rebuilds the library from the contracts whenever a block contract
   changes. Add it to the block PR checklist.

## Acceptance criteria
- [ ] In the DA editor and the Experience Workspace canvas, **Blocks** lists every block and variant on `main`, with
      descriptions. Inserting each renders without block errors on preview.
- [ ] **Templates** lists the 5 templates. A page created from each previews without errors and has valid metadata
      (`validate-metadata`). A story and a press release created from templates appear in their rails after publish.
- [ ] The library documents match `block-contracts.json`. A unit test or check fails when a block on `main` has no
      library entry.
- [ ] The library and templates live outside the content tree authors browse daily, and aren't indexed (`noindex`
      bulk metadata for `/library/**`).
- [ ] A short author note (in DA, `/library/README`): how to start a page from a template, which blocks to use, and the
      publish order.

## Effort
About 2–3 days for blocks and templates; the story template alone is about half a day.

## Progress (2026-10-10, PR #322)
- **Blocks:**
  - 18 authorable blocks with 25 variants, plus Section Metadata with 12 Style examples. They're generated from
    `tools/library/library-spec.mjs` and the smallest live instance of each variant. Variants no page uses yet get
    synthesized examples.
  - Not in the library, with the reason: `header`, `footer`, `float-dock`, `carousel`, `hero`, `widget`.
  - Local render: every block loads without block errors.
- **Templates:**
  - The five templates, each from one canonical live page with `[prompts]`.
  - Unfilled, each fails `validate-metadata` (on the `publisheddate` prompt). Filled in, each passes.
  - The Tags block is empty, so it shows the `tags` metadata (one entry, toward SKODA-841).
- **Check:** `library-check` (in `npm test`) fails on a block, contract variant or contract section style without a
  library entry.
- **DA:**
  - `library/blocks.json` and `library/templates.json` are uploaded.
  - The config `library` tab has Tag picker, Blocks and Templates.
  - The bulk metadata row `/library/** | robots: noindex, nofollow` is previewed.
- **Decisions:**
  - **No Placeholders row:** `/en/placeholders.json` holds code UI strings, and DA `{{key}}` tokens aren't resolved.
  - **Regeneration** is `npm run library:build`, documented in `tools/library/README.md`.
- **Uploaded (2026-10-11):**
  - 19 block documents, 5 templates, `/library/README` and the placeholder images are in DA and previewed (not published).
  - On the branch preview, all 24 documents load every block with no block errors, and they carry `robots: noindex,
    nofollow` from the bulk row. The README previews at `/library/readme`.
  - The only console errors are for `library-metadata`, a table the library panel reads, not a block.
- **Open:**
  1. Editor checks: insert each block from the Library panel, start a story and a press release from a template, and
     check they appear in their rails after publish.
  2. Publish `/metadata.json`. This waits on the 9 previewed but never published language rows (cs/de/sk/sr) that the
     publish would also ship.
  3. Templates still carry origin-CDN icons (AR-01) and the newsletter card (SKODA-840).
