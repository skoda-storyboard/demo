# Content Import Pipeline

*How source-site pages become published Škoda Storyboard content. This is the reusable machinery in `tools/importer/` — not a one-off script. Companion to [`../DEVELOPER-GUIDE.md`](../DEVELOPER-GUIDE.md). Verified against the repo 2026-09-14.*

> **Golden rule:** never hand-write HTML into `content/`. Content is produced only by the bundled import script + the bulk-import runner, then pushed to Document Authoring. Hand-editing `content/` breaks reproducibility and the publish/reindex flow.

---

## 1. The shape of the pipeline

```
source URL(s)
   │  scrape (cleaned.html + metadata + images)
   ▼
page-templates.json  ──►  import-<name>.js  ──►  import-<name>.bundle.js
   (template + block          (parser registry +      (runnable artifact)
    selector map)              transformer registry
                               + two hooks)
                                     │  run via run-bulk-import.js
                                     ▼
                               content/<path>.plain.html   (local, bare <div> markup)
                                     │  media:build → media:apply → SKODA-506 gate
                                     │  SKODA-602: wrap <body><main>, POST to DA
                                     ▼
                     admin.da.live/source/{org}/{repo}/{path}.html
                                     │  preview → publish
                                     ▼
                          query-index rebuilds → index-driven blocks populate
```

Templates that exist today and are the ones to copy. All 17 public page types now
have an importer (SKODA-601 pilot + the all-page-types extension); the complex
**press-kit** N+1-document type is the one deferred type (SKODA-805–808).

Detail/CPT + shells:
- **`model-page`** — Škoda model page: hero + in-page-nav + key-facts + spec-table + 6 index-driven story-rails; Section Metadata.
- **`press-release`** — header default content + `gallery` / `tags` / `downloads` parsers, `skoda-press-release-cleanup`. Media Box → `Downloads`; PDFs/MP4 as links (SKODA-503).
- **`page-base`** — editorial "Page" shell: hero banner + SiteOrigin body flattened to plain default content.

Faceted listings (one engine, `listing.js` variant map keyed on the body-class token):
- **`pr-listing`** (news), **`images-listing`** (`template=image`, columns=4), **`videos-listing`** (`template=video`), **`search-listing`** (cross-type, `search=true`) — each emits a single index-driven `Listing` config block; SSR cards + source filter stack not ported.

Archives + directories (index-driven grids emitted as config, not ported cards):
- **`category-archive`** — category/tag archive (also covers podcast): hero + facet-less `Listing` scoped by canonical path.
- **`series-directory`** / **`series-hub`** — `series-grid.js` self-detects level from card `data-content-type`; hub tag from canonical slug.
- **`home-sto`** / **`home-mr`** — `promo-box` (curated cards) + `home-rail` (self-classifying index rails; social strip dropped).
- **`skodapedia`** — glossary directory index block (term-detail prebake → SKODA-802).

Flatten-to-default (SiteOrigin widget tree NOT reconstructed — deferred to SKODA-801/814/604/810/210):
- **`company-page`** — hero + `.entry-content` flattened; sub-type blocks/galleries → SKODA-810.
- **`story-detail`** — hero + primary `.content` flattened by SKODA-801; `.sidebar` rebuilt as a separate section; in-body Media Box deferred to SKODA-801a/604.
- **`error-404`** — `.error-message` dead-end copy + homepage link; site-root `404.html` shell.

> Detection is **content-driven only** — blocks are located by the `page-templates.json` DOM selectors; parsers self-identify from the DOM (body-class token, `data-content-type`, `type-<cpt>` class), never from URL/template/section-order/position. Where a URL is read (series/archive scope) it derives the *rail filter*, never the *detection*. A page with a novel arrangement of known sections/blocks imports without parser changes.
>
> **Deliberately deferred:** the **custom microsite** (`template-custom-full-width`) is NOT run through flatten — its body is ~264 gallery tiles + a stub intro, so flatten yields a near-empty page; it needs the real gallery block (SKODA-210). **Newsletter** is a subscriber service surface (SKODA-904), not a content page. **Press-kit** (hub + chapters + resources + shared sub-nav) is SKODA-805–808.

---

## 2. The pieces

### `tools/importer/page-templates.json`
The registry. Each template entry has a `name`, `description`, and a `blocks` array mapping **block variant → DOM selectors** in the source page. This tells the parser layer which source elements become which EDS block. Story pages carry `blocks: []` — they're plain content shaped entirely by a transformer.

### `tools/importer/parsers/*.js` — block parsers
One per block variant. A parser recognizes a source DOM fragment (via the `page-templates.json` selectors) and emits the EDS block table for it. Current parsers: `hero`, `in-page-nav`, `key-facts`, `spec-table`, `story-rail` (model-page); `gallery`, `tags`, `downloads` (press-release); `listing` (faceted listing); `hero-banner`, `archive-list` (page/archive templates). Every parser defensively unwraps-and-bails if its expected fragment is absent, and self-identifies from the DOM rather than assuming position.

### `tools/importer/transformers/*.js` — page transformers
Whole-page shaping, run as `beforeTransform` / `afterTransform` hooks:
- **`skoda-model-cleanup.js` / `skoda-press-release-cleanup.js` / `skoda-listing-cleanup.js` / `skoda-page-cleanup.js`** — per-template chrome/noise removal (all selectors DOM-verified against the scraped sample). The press-release cleanup also strips per-request `#s_aid=` analytics fragments in `afterTransform` so output is deterministic (SKODA-602 idempotent re-push).
- **`skoda-model-sections.js`** — section breaks via the marker-`<hr>` + `Section Metadata` block pattern (what `decorateSectionMetadata` in `scripts.js` later reads); reused by every multi-section template.
- **`skoda-metadata.js`** — the shared, content-type-agnostic query-index Metadata block (SKODA-401); logic mirrored 1:1 by the unit-tested `skoda-metadata-extract.mjs`. All importers append it; do not hand-roll per-page metadata.
- **`skoda-images.js`** — after block parsing, normalize default-content images to direct `<div>` children, preserve alt, and render `data-caption` without duplicating native figure captions. Wired into the M1 home, story, press-release, model, series-hub, and images/videos importers; future importers should reuse it.

### `import-<name>.js` + `import-<name>.bundle.js`
The `import-<name>.js` wires it together: embeds the `page-templates.json` entry, registers parsers + transformers, runs the two hooks around `WebImporter.rules`, and writes a sanitized output path. The **`.bundle.js` is the runnable artifact** — that's what the bulk runner executes.

### DA source push (SKODA-602)
The source-API upload needs to wrap each bare `.plain.html` in `<body><main>…</main></body>`, POST to `https://admin.da.live/source/{org}/{repo}/{path}.html`, then preview and publish. The previously documented `upload-<name>.sh` scripts are **not in this checkout**; use the verified SKODA-602 content-ops route once available. Never paste credentials in a script or chat.

### `urls-<name>.txt`
The input URL list for the run.

---

## 3. Running an import (existing template)

```bash
# 1) Run the bundled importer over its URL list (run-bulk-import.js from the
#    content-import skill drives the *.bundle.js). Output lands in content/<path>.plain.html
# 2) Prepare delivery images; fail if any requested page/image cannot be resolved.
npm run media:build -- --pages content/<path>.plain.html
npm run media:apply -- --pages content/<path>.plain.html
# 3) Validate metadata, then inspect locally against previewed DA content.
node tools/importer/validate-metadata.mjs content/<path>.plain.html
npx -y @adobe/aem-cli up          # inspect content/... at localhost:3000
# 4) Only after rights approval, optional DAM original ingest, and SKODA-506's
#    separate enforced oversize gate: push → preview → publish via SKODA-602.
```

**Order matters:** import → media build/apply → metadata validation → SKODA-506 pre-publish gate → DA push → preview → **publish** → reindex. SKODA-501's media builder selects publish-safe renditions, but does **not** enforce SKODA-506's gate on every preview/publish. The query-index only sees *published* pages, so index-driven blocks stay empty until publish and reindex.

---

## 4. Adding a new page type (the reuse path)

1. **Scrape a real example** of the new page type — never guess selectors. Inspect the cleaned markup.
2. **Add a template entry** to `page-templates.json` (name + block→selector map).
3. **Reuse or add parsers** — most new rails reuse `carousel` / `cards-*`; add a parser only for genuinely new block shapes.
4. **Reuse or clone a transformer** — e.g. a press-release detail is ~`skoda-story-cleanup` with a different category/section; clone and adjust.
5. **Assemble `import-<name>.js`**, bundle it, create `urls-<name>.txt`, and use the SKODA-602 DA push process.
6. **Ingest + rewrite media** — after the content import, run the media toolkit
   (`tools/importer/media/`, see its `README.md`): `npm run media:build -- --pages content/<path>.plain.html`
   dedups to logical masters, **pre-conditions >~10 MB masters** (else the content bus 409s on publish),
   optionally ingests to the AEM DAM / DA archive, and writes `media-manifest.json`; then
   `npm run media:apply -- --pages content/<path>.plain.html` rewrites `<img src>` to each image's
   `delivery_url` and removes the old derivative-ladder `srcset`. EDS auto-ingests those absolute URLs into its media bus at publish (self-hosted + webp),
   so the published page carries no legacy-CDN dependency and gets a masters-only responsive upgrade.
7. **Validate metadata (gate, SKODA-401)** — run `node tools/importer/validate-metadata.mjs content/<path>.plain.html`
   over the generated pages. It fails (non-zero) if any indexed page's Metadata block is missing `template`,
   comma-separated `tags`, `category`, or an ISO `publisheddate` — the query-index contract. This catches a
   mis-wired importer before publish, so the `tags`/facet columns and the tags-block fallback don't ship
   silently empty. (`template=page` nav/utility pages are exempt from the rail-facet requirements.)
8. **Require SKODA-506's enforced pre-publish media gate**, then push → preview → publish via SKODA-602 and validate that the index picked it up.

**Metadata is generic, not per-page.** All importers should append the shared
`tools/importer/transformers/skoda-metadata.js` transformer (content-type-agnostic: derives
title/description/image/publisheddate/template/category/tags + the 15 facets from any source page), passing
only CPT-fixed overrides via the template entry. Do not hand-roll per-page metadata literals. Contract:
Metadata `tags` = comma-separated slugs → AEM emits `<meta property="article:tag">` → read by both the
query-index (`query.yaml` selects `property="article:tag"`) and the tags block's `article:tag` fallback.

This is exactly how the M1 backlog scopes Series (SKODA-207), the Media Room home/Model/Press-Kit pages, and the full Images/Videos listings — assembly of the existing pipeline, not new machinery.

---

## 5. Gotchas specific to import

| Gotcha | Detail |
|--------|--------|
| **`buildAutoBlocks` runs first** | The runtime rewrites `/fragments/` and `/widgets/` links before block JS runs — account for it when shaping output. |
| **DA wrap** | Page docs MUST be wrapped `<body><main>…</main></body>` on upload (the script does this). Library/fragment docs must **NOT** be wrapped. |
| **Bare `.plain.html` = empty store** | POSTing an unwrapped `.plain.html` to DA source stores 0 bytes / renders empty. |
| **Publish before you expect listings** | Index-driven blocks need published pages + a rebuilt index. |
| **Media masters** | 20–40 MB masters 409 the content bus; pre-condition first. Don't strip the `-WxH` suffix on demo images. |
| **`.bundle.js` is the runnable one** | Edit `import-<name>.js`, then re-bundle; the bulk runner executes the bundle, not the source. |
| **Scraper drift + shared work dir** *(2026-09-14 page-analysis pass)* | The excat scraper repeatedly landed on the **Peaq model page** for several different URLs — some Media Room URLs do a **client-side redirect** the headless browser follows, and a **shared `migration-work/` dir** let parallel runs overwrite each other's `page-structure.json`/`metadata.json`. **Mitigation:** scrape each URL into its **own** output dir; when a page client-redirects, verify against a **raw SSR `curl`** (the target returns 200 with self-canonical HTML) rather than trusting the headless capture; treat drifted artifacts as suspect. |
| **Press-kit = N+1 documents** | A press kit is a **hub + 8 chapter sub-pages + 5 resource sub-pages** sharing one **chapter sub-nav fragment** (`fragment.js` is the sanctioned cross-block import). Import the sub-nav once as a fragment, not per page. Whole-kit ZIP is a **pre-built static CDN asset** (author-managed link), not on-demand packing. |

---

## 6. Related

- [`../DEVELOPER-GUIDE.md`](../DEVELOPER-GUIDE.md) — the runtime side (blocks, query-index, E-L-D).
- [`../analysis/SKODA-MASTER.md`](../analysis/SKODA-MASTER.md) §9 — target architecture + import-pipeline design rationale.
- [`../planning/SKODA-DELIVERY-PLAN.md`](../planning/SKODA-DELIVERY-PLAN.md) — which page types are scoped to which milestone.
