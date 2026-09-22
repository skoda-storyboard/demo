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
                                     │  upload-<name>.sh: wrap <body><main>, POST to DA
                                     ▼
                     admin.da.live/source/{org}/{repo}/{path}.html
                                     │  preview → publish
                                     ▼
                          query-index rebuilds → index-driven blocks populate
```

Two pipelines exist today and are the templates to copy:
- **`en-landing`** — the homepage (`import-en-landing.js` + `.bundle.js`): cards + carousel parsers, section transformers.
- **`en-stories`** — 48 story detail pages (`import-en-stories.js` + `.bundle.js`): plain content, cleanup transformer only.

---

## 2. The pieces

### `tools/importer/page-templates.json`
The registry. Each template entry has a `name`, `description`, and a `blocks` array mapping **block variant → DOM selectors** in the source page. This tells the parser layer which source elements become which EDS block. Story pages carry `blocks: []` — they're plain content shaped entirely by a transformer.

### `tools/importer/parsers/*.js` — block parsers
One per block variant. A parser recognizes a source DOM fragment (via the `page-templates.json` selectors) and emits the EDS block table for it. Current parsers: `cards-overlay`, `cards-media`, `cards-social`, `cards-toolbar`, `carousel`.

### `tools/importer/transformers/*.js` — page transformers
Whole-page shaping, run as `beforeTransform` / `afterTransform` hooks:
- **`skoda-cleanup.js`** — general chrome/noise removal.
- **`skoda-sections.js`** — section styling via the marker-`<hr>` + `Section Metadata` block pattern (this is what `decorateSectionMetadata` in `scripts.js` later reads).
- **`skoda-story-cleanup.js`** — story-specific flatten/cleanup (hero + title + intro + body; drops in-body galleries/embeds/media-box for the demo slice).

### `import-<name>.js` + `import-<name>.bundle.js`
The `import-<name>.js` wires it together: embeds the `page-templates.json` entry, registers parsers + transformers, runs the two hooks around `WebImporter.rules`, and writes a sanitized output path. The **`.bundle.js` is the runnable artifact** — that's what the bulk runner executes.

### `upload-<name>.sh`
Pushes results to DA: wraps each bare `.plain.html` in `<body><main>…</main></body>`, `POST`s to `https://admin.da.live/source/{org}/{repo}/{path}.html`, then previews and publishes. **Credentials are injected by the environment — never a token in the script or chat.**

### `urls-<name>.txt`
The input URL list for the run.

---

## 3. Running an import (existing template)

```bash
# 1) Run the bundled importer over its URL list (run-bulk-import.js from the
#    content-import skill drives the *.bundle.js). Output lands in content/<path>.plain.html
# 2) Preview locally
npx -y @adobe/aem-cli up          # inspect content/... at localhost:3000

# 3) Upload → preview → publish to DA (credentials injected)
bash tools/importer/upload-en-stories.sh
```

**Order matters:** upload → preview → **publish** → reindex. The query-index only sees *published* pages, so index-driven blocks (`stories`, `story-rail`) stay empty until publish completes and the index rebuilds.

---

## 4. Adding a new page type (the reuse path)

1. **Scrape a real example** of the new page type — never guess selectors. Inspect the cleaned markup.
2. **Add a template entry** to `page-templates.json` (name + block→selector map).
3. **Reuse or add parsers** — most new rails reuse `carousel` / `cards-*`; add a parser only for genuinely new block shapes.
4. **Reuse or clone a transformer** — e.g. a press-release detail is ~`skoda-story-cleanup` with a different category/section; clone and adjust.
5. **Assemble `import-<name>.js`**, bundle it, create `urls-<name>.txt` + `upload-<name>.sh`.
6. **Ingest + rewrite media** — after the content import, run the media toolkit
   (`tools/importer/media/`, see its `README.md`): `npm run media:build -- --pages content/<path>.plain.html`
   dedups to logical masters, **pre-conditions >~10 MB masters** (else the content bus 409s on publish),
   optionally ingests to the AEM DAM / DA archive, and writes `media-manifest.json`; then
   `npm run media:apply -- --pages content/<path>.plain.html` rewrites `<img src>` to each image's
   `delivery_url`. EDS auto-ingests those absolute URLs into its media bus at publish (self-hosted + webp),
   so the published page carries no legacy-CDN dependency and gets a masters-only responsive upgrade.
7. **Run → preview → publish → validate** the index picked it up.

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
