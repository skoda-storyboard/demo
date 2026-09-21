# Škoda Storyboard → Edge Delivery Services (Document Authoring / Experience Workspace) — Architecture

**Target authoring surface:** **Document Authoring (DA) / Experience Workspace (EW)** — *not* AEM Author, *not* Universal Editor, *not* JCR/crosswalk.
**Date:** 2026-09-04
**Basis:** the eight prior `SKODA-*` analysis artifacts + the **current aem.live documentation** (fetched this session from `https://www.aem.live/docpages-index.json`, 204 pages). Every architectural mechanism cites a live doc path; where docs are silent it is flagged as an open question, not asserted.
**Nature:** architecture/design document. No code, no import, no Git.

> **Platform note (confirmed from docs):** "Document Authoring is now **Experience Workspace**" (`/docs/ew/da-is-ew`). Same foundation, HTML documents, `da.live` source — now with a visual editor, AI assistant, native **Import**, **Bulk Operations**, **Translation**, **Sheets**, and an **MCP** endpoint. Nothing about the classic EDS delivery model changes; EW adds authoring/agentic tooling on top. This architecture targets EW/DA specifically and calls out where it differs from AEM-authored EDS.

---

> **Build-confirmed update (2026-09-10):** the EN homepage + listings/rails slice was built and shipped end-to-end on EDS+DA (commits #2–#18). Findings that refine this doc, all marked inline with "build-confirmed": index config is an **admin config-service `query.yaml` PUT**, not repo `helix-query.yaml` (§1.1, §2, §6); the indexer **only sees published pages** (§6); taxonomy/date fields need a **per-field extraction/normalization layer**, not clean selectors (§6, R-A1); heavy source masters (25–40 MB) **409 the content bus** and need pre-conditioning (§7, R-A6); story-flatten fidelity for this slice is **browser-confirmed** (R-A2). The core static-index → client-block architecture is **validated**; no strategic reversal.

> **Note (2026-09-05):** Integration boundary refined by `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`: the Škodapedia glossary can be fully static IF terms are pre-baked as `/modals/` docs (recommended) — otherwise the A–Z directory and letter/category filter are 100% client-side (no fetch) but term *detail* is a thin API fetch on click; `mediakit/v1/mediabox` lets press-page downloads be a static block (media-cart only needed for cross-page bulk collection); banner campaigns are per-market/locale+tag-targeted; zero cookies on anonymous load validates the cacheable-static-pages assumption.

---

## 1. Executive Architecture Summary

Škoda Storyboard becomes a **DA/EW-authored, Git-deployed, buildless Edge Delivery site**: content lives as HTML documents in DA (`da.live`), code lives in a GitHub repo, and pages are served from `*.aem.page` (preview) / `*.aem.live` (production) (`/developer/anatomy-of-a-project`). The classic table-driven block model applies — **no component models, no UE, no JCR**.

**The five decisions that shape the architecture:**

1. **Content source = DA/EW (BYOM-class HTML).** This has one hard architectural consequence up front: **spreadsheet-based indexing is NOT supported in DA** (`/developer/indexing`) — so listings/search indexes are built with **CSS-selector indexing over published HTML**, not authored spreadsheets. This is the single biggest DA-vs-AEM design difference for this site. **⚠ Config-surface correction (2026-09-10, build-confirmed):** the selector config is **NOT `helix-query.yaml` in the repo** for this DA project — it is submitted to the **admin config service** (`PUT https://admin.hlx.page/config/{org}/sites/{site}/content/query.yaml`; `helix-query.yaml` is retired). The *strategy* is unchanged (selector index over published HTML → `/{locale}/query-index.json` → client blocks); only the *configuration surface* moved from repo file to admin service. See §6.
2. **The dynamic backend systems don't migrate as content** — ElasticPress, the 46-banner ad platform, the media-cart, and the subscriber/newsletter account system sit **outside** the static model and become explicit service boundaries (client-side calls or dropped for the pilot).
3. **Stories must be de-builder'd.** ~5,282 story pages (37.5%) are SiteOrigin Page Builder panel/widget trees; the import pipeline flattens them into DA sections + blocks.
4. **Media is masters-only.** Ingest ~28.3k logical masters (not the ~200k-file derivative ladder); EDS regenerates responsive `<picture>`/webp; large PDF/MP4 go to Assets/DAM or reference-in-place.
5. **i18n uses EW's native Translation + per-locale content trees**, with per-locale query indexes — not duplicated code.

**Target in one line:** *DA/EW documents → helix-query indexes → vanilla EDS blocks (Block Collection + ~12 custom) → `aem.live` delivery, with four dynamic features re-integrated as bounded client-side services and a scripted DA-source-API import pipeline for bulk content + media.*

---

## 2. Target Platform Model (DA / EW)

| Layer | Choice | Doc anchor |
|---|---|---|
| **Authoring** | Document Authoring / Experience Workspace (`da.live`) — visual + doc editor, AI assistant, MCP | `/docs/ew/da-is-ew`, `/docs/ew/authoring/document-editor`, `/docs/ew/authoring/mcp` |
| **Content format** | HTML documents (BYOM-class); blocks = tables; sections = `---`; metadata = trailing table | `/developer/markup-sections-blocks`, `/docs/metadata`, `/developer/byom` |
| **Code** | Buildless GitHub repo + AEM Code Sync bot; `blocks/`, `styles/`, `scripts/` | `/developer/anatomy-of-a-project` |
| **Delivery** | `{branch}--{repo}--{owner}.aem.page` (preview) / `.aem.live` (prod) | `/developer/anatomy-of-a-project` |
| **Config / tabular data** | Sheets for placeholders, metadata, redirects, headers, CDN config | `/docs/authoring-tabular-data`, `/docs/ew/authoring/editing-sheets` |
| **Publishing** | Preview → Publish per doc; bulk via Bulk Operations | `/docs/ew/authoring/publishing`, `/docs/ew/authoring/bulk-operations` |
| **Import** | EW native **Import** (by Query Index or by URL) + scripted **DA source API** (`POST admin.da.live/source/{org}/{repo}/{path}.html`) | `/docs/ew/administering/import`; DA source API per project `AGENTS.md` |
| **Sidekick** | Sidekick v7 for preview/publish/library | `/docs/sidekick`, `/developer/sidekick-v7-migration` |

**DA-specific callouts vs AEM-authored EDS:**
- ❌ No spreadsheet-based indexing — selector-based index config is **submitted to the admin config service** (`PUT admin.hlx.page/config/{org}/sites/{site}/content/query.yaml`), **not** a repo `helix-query.yaml` (retired). — `/developer/indexing`, §6.
- ❌ No Universal Editor / component-model / JCR content packages — `/developer/component-model-definitions` is out of scope.
- ✅ **Custom authoring controls are still available without UE/App Builder** (build-confirmed 2026-09-16): a **DA library plugin** (hosted HTML/JS registered in a `library` config sheet, talking to the editor via `DA_SDK`) gives authors real multi-select pickers, dynamic/governed dropdowns, asset/reference choosers, and validated inputs, surfacing in both the classic DA editor and the EW canvas panel. This is the answer to "can the WYSIWYG editor do complex config"; UE is only needed for per-field in-canvas editing or an AEM-CS `aem-tag` picker. Full guide + decision framework + cookbook: **`SKODA-DA-EW-EXTENSIBILITY.md`**. PoCs: `poc/tag-multiselect/`, `poc/stories-tag/`.
- ✅ Media can be uploaded **directly into DA** (saved to a per-doc dotfolder) *or* served from **AEM Assets/Dynamic Media** if the integration is enabled — `/docs/ew/authoring/adding-media`. (For this site's scale, see §7.)

---

## 3. Fit Assessment Matrix

**Fit scale:** 🟢 **Native fit** (works out-of-box / boilerplate) · 🔵 **Adapt** (custom block/config, standard patterns) · 🟠 **Rebuild-as-service** (needs a backend outside EDS) · 🔴 **Drop / defer**.

### Templates
| Source element | Fit | Target mechanism | Doc anchor |
|---|---|---|---|
| Press release (47.5%) | 🔵 Adapt | DA doc: sections + teaser/gallery/download blocks + metadata table | markup-sections-blocks; metadata |
| Story (37.5%, **Page Builder**) | 🟠 Adapt-hard | Import **flattens** SiteOrigin panel/widget tree → DA sections/blocks | importer; markup-sections-blocks |
| Page (9.6%) | 🟢 Native | DA doc + default content | markup-sections-blocks |
| Škodapedia (5.4%) | 🔵 Adapt | DA docs + A–Z index + **modal via `/modals/`** — A–Z directory + letter/category filter are 100% client-side static (no fetch); term *detail* is a thin `skodapedia/v1/term/{id}` fetch (ready-rendered HTML) — **eliminable**: pre-bake each term as a `/modals/` doc (recommended) → fully static | block-collection/modal |
| Listing / index (~7) | 🔵 Adapt | Custom listing block over **query-index** | indexing; block-collection/search |

### Blocks (12–14)
| Block | Fit | Target |
|---|---|---|
| Cards / Teaser (3 variants) | 🟢/🔵 | Block Collection *Cards* + variants |
| Hero | 🟢 | Block Collection pattern; real `<img>` → optimized `<picture>` |
| Tags | 🟢 | Default content / small block |
| Header / Footer / nav | 🟢 | Block Collection **Header/Footer** as **fragments** (`nav`, `footer` docs) — `/developer/block-collection/header`,`/footer`, `/docs/fragments` |
| Embeds (Vimeo/YT/Buzzsprout/Spotify) | 🔵 | Embed block + autoblocking; preserve `dnt=1` |
| Gallery (Owl + column-JS) | 🔵 | New block: native carousel + responsive grid |
| Gallery **lightbox** | 🔵 | **Modal via `/modals/`** convention — block-collection/modal |
| Carousel / promo rotation | 🔵 | New block (native) |
| Parallax | 🔴 defer | Decorative; drop or CSS-only |
| Škodapedia glossary + A–Z | 🔵/🟢 | New block + modal — A–Z directory + letter/category filter are fully client-side static (no fetch); term *detail* is a thin `skodapedia/v1/term/{id}` fetch (ready-rendered HTML) that is **eliminable** by pre-baking terms as `/modals/` docs → fully static |
| Faceted listing / load-more | 🔵 | New block over query-index (see §6) |
| Search | 🔵 | Block Collection **Search** over `/query-index.json` — block-collection/search |

### Backend systems
| System | Fit | Target |
|---|---|---|
| ElasticPress — **facets/listings** | 🔵 Adapt | query-index + client faceting (§6) |
| ElasticPress — **full-text body/relevance** | 🟠 Rebuild-as-service | hosted search (Algolia/Elastic/Adobe) fed by index — *pilot: index-only* |
| Banner ad platform (bespoke WP plugin + React) | 🟠 Rebuild-as-service | **Bespoke** (not off-the-shelf) — rebuild as a small vanilla block; data source = **reuse `skoda-banners/v1` API** *or* **re-home to an EDS sheet/DA feed**; or 🔴 drop for pilot (§8) |
| Newsletter / subscriber account | 🟠 Rebuild-as-service | external form/consent service (mailguide or replacement) |
| Media-cart | 🟠 Rebuild-as-service | needs stateful backend; 🔴 drop for pilot (plain download links) |
| Consent (OneTrust) / GTM / Hotjar | 🔵 Adapt | load in `delayed.js` phase |

### Media & i18n
| Element | Fit | Target |
|---|---|---|
| Content images (masters) | 🟢 Native | EDS optimized `<picture>`/webp (§7) |
| Derivative ladder (~200k files) | 🔴 Drop | EDS regenerates — don't migrate |
| PDF / hi-res / MP4 (signed) | 🟠 Adapt | Assets/DAM or reference-in-place; MP4 needs hosting decision |
| 6 locales, uneven translation | 🔵 Adapt | EW **Translation** + per-locale trees + per-locale index (§9) |
| Language-negotiated root routing | 🔵 Adapt | edge/CDN redirect or JS locale detect |

---

## 4. Content Model in DA

**Document = page.** Content authored as HTML docs in DA; structure per `/developer/markup-sections-blocks`:
- **Sections** separated by `---`; **section styling/ids** via a **Section Metadata** block (`Style`→class, `Id`→anchor) — `/developer/block-collection/section-metadata`.
- **Blocks** = tables whose first cell names the block (+ variant in parentheses).
- **Page metadata** = a trailing **Metadata** table (title, description, `image`, `robots`, hreflang, structured-data hints) — `/docs/metadata`; site-wide defaults via a **bulk metadata** sheet — `/docs/bulk-metadata`.

**Template → DA document mapping:**
- **Press release** → hero/lead section · body default-content · `Gallery` block · `Download` block · `Tags` · `Metadata` (date, category, model taxonomy, hreflang).
- **Story (the hard one)** → the importer must **flatten SiteOrigin `panel-grid`/`so-widget` trees**: each `so-panel` row → a DA section; `sow-editor` widgets → default content; `skoda-carousel`/`skoda-offset` widgets → the corresponding block table. This is a parser responsibility (§10), not an authoring one.
- **Škodapedia** → term docs + an index doc; term detail rendered in a **modal** (`/modals/` link convention) so it overlays the index — `/developer/block-collection/modal`.
- **Listing/index** → a doc containing a single faceted-listing block that reads the query-index.

---

## 5. Block Architecture

- **Reuse Block Collection first** (`/developer/block-collection`) — Cards, Header, Footer, Search, Modal, Breadcrumbs, Icons, Buttons, Section Metadata all map to existing patterns; copy `.css`/`.js` and extend.
- **~12 custom/extended blocks** (per `SKODA-EN-BLOCK-INVENTORY.md`): gallery (+lightbox modal), carousel, faceted-listing, glossary, promo-banner (if kept), embeds, teaser variants. The **glossary can be fully static IF terms are pre-baked as `/modals/` docs** (recommended): the A–Z directory + letter/category filter are 100% client-side static (no fetch), and term *detail* — otherwise a thin `skodapedia/v1/term/{id}` API fetch on click (which returns ready-rendered HTML) — is eliminated by pre-baking each term as a `/modals/` doc, making the whole block fully static.
- **Variant strategy:** compound classes (`cards`, `cards.overlay`) authored as `Cards (overlay)` — consistent with the existing repo's variant conventions.
- **Decoration patterns:** classic `export default function decorate(block)`; **rebuild vanilla** (no jQuery/Owl/Isotope/React — see `SKODA-BLOCK-IMPLEMENTATION-REVIEW.md`). Modals use the Block Collection `autoLinkModals()` + `/modals/` docs.
- **Accessibility:** the source has WCAG gaps (auto-rotating carousels, focus traps). New blocks add pause controls, focus management, keyboard nav — a deliberate upgrade, not a port.
- **Chrome as fragments:** `nav` and `footer` DA documents loaded as fragments (`/docs/fragments`, header/footer block docs) — one source, CDN-cached, locale-resolved.

---

## 6. Listings & Search Architecture

**The DA constraint drives this section.** Spreadsheet indexing is unavailable in DA, so:

- **Index = CSS-selector config submitted to the admin config service**, applied to **published HTML** (`/developer/indexing`, `/docs/indexing-reference`). **Build-confirmed (2026-09-10):** the config is a `query.yaml` `PUT` to `https://admin.hlx.page/config/{org}/sites/{site}/content/query.yaml` (Content-Type `text/yaml`; 201 on create; 404 = unset, 400 = wrong resource) — **not** a repo `helix-query.yaml` (retired). Keep a source-of-truth copy in-repo for the record (we did: `tools/importer/query-index-config.yaml`) but understand it is not what the platform reads. Define per-locale indexes; output served at `/{locale}/query-index.json`.
- **⚠ Operational gotcha — the index only sees PUBLISHED pages (build-confirmed).** Previewed-only pages are invisible to the indexer; `/query-index.json` 404s until ≥1 page is **live-published**, and each page is omitted until its own live publish. This imposes a strict order on every content increment: **upload → preview → publish (live) → reindex** (`POST admin.hlx.page/index/...`), with a few-seconds preview↔live lag. Not modeled in the original plan; it is a real sequencing/throughput constraint for bulk migration (see delivery plan M2).
- **Index columns** (selector-extracted): `path, title, description, image, template, date, category, model, + taxonomy facets, tags`. This supplies the **15 taxonomy facets** the source exposes.
- **⚠ Field extraction is a normalization exercise, not clean selectors (build-confirmed).** On real content, the fields we most needed were **not reliably in usable meta tags**: `category` had to be **derived from the URL path segment** (no dependable `article:section`), and press-release **publish dates** required a **4-way fallback chain** (`article:published_time` meta → `data-publish-date` attribute → Yoast JSON-LD `datePublished` → visible `.entry-published` span). Treat the 15-facet index as a **per-field extraction/normalization layer** in the importer, not a straight CSS-selector map. This is where SKODA-401's real cost lives.
- **Faceted listing + "load more"** → custom block: fetch the locale index JSON, filter/sort/paginate client-side, and reproduce **deep-link paging** via `history.pushState` (as the source does). No server round-trip.
- **Auto-populated, tag-filtered, de-duplicated rails are a real sub-feature (build-confirmed).** The homepage rails are **not** five independent static carousels — they are index-driven blocks that filter by tag, sort by date, and **exclude anything already shown above them** (featured promo + Latest Stories), which requires awaiting the async upstream block's `data-blockStatus === 'loaded'` before reading its links. Budget the homepage as a **small orchestration of interacting index-driven blocks**.
- **Blueprint pattern — reuse a block's UI without cross-importing it.** To render a dynamic rail with the existing carousel's exact look/behaviour, build a real carousel block and let EDS decorate it: **`buildBlock('carousel', rows)` → `decorateBlock` → `loadBlock`** (from `scripts/aem.js`). This respects the repo rule that the only cross-block JS import is `fragment.js`. Codify this idiom + the auto-populate/dedupe pattern as reusable blueprint components before the blocks pool is split across engineers.
- **⚠ Layout-mode editability is STRUCTURAL in DA/EW (build-confirmed 2026-09-10).** EW decides what an author can edit in-place in **Layout (WYSIWYG) mode** by mapping a rendered node back to its source-document cell. **A block's `decorate()` must PRESERVE (move) the original document nodes** — text, headings, links, and crucially the **`<img>`/`<picture>`** — for them to stay editable. **Recreating a node breaks editability:** the reference/boilerplate pattern `img.closest('picture').replaceWith(createOptimizedPicture(img.src, …))` builds a *brand-new* `<picture>` and discards the mapped node, so the image is **no longer editable in Layout** (observed: featured-promo images uneditable while their titles — moved — were fine). Fix shipped: `scripts/optimized-picture.js` (`optimizeImageInPlace`) emits the same webp/responsive renditions but **keeps the original `<img>`** (swaps `<source>`s + re-points `src`); applied to `cards-overlay`, `carousel`, `cards-media`. **Note the fork:** the `data-aue-*` / `moveInstrumentation` API in the boilerplate is **Universal-Editor-only** — it does **not** apply to this DA/EW project, where editability is purely structural (no attribute to add). Final in-EW click-confirmation is pending EW authoring access (D13 track).
- **Editability boundary — index-driven blocks are NOT layout-editable, by design.** `stories` and `story-rail` build their card DOM **entirely from the query-index JSON**, which is *not* in the authored document — so there is nothing for EW to map, and per-card content is **not** editable in Layout. The author's editable surface for these is the **block's config rows** (index / category / limit / exclude), edited in **Content mode**. This is expected, not a defect; it is the DA/EW text-vs-structure split that sits at the heart of the authoring-model decision (D13).
- **Search** → Block Collection **Search** block over `/query-index.json` (`/developer/block-collection/search`) for the demo.
- **The honest boundary:** an index carries **title/summary/tag** matching + facets + sort — it does **not** replicate ElasticPress **full-text body search, fuzzy/typo tolerance, or relevance ranking**. Pilot = index-only (accept reduced recall); production = optional hosted search fed by the same index. *(Consistent with `SKODA-STORYBOARD-DRILLDOWN.md` §1.)*

---

## 7. Media & DAM Architecture

Grounded in `SKODA-MEDIA-DEEP-DIVE.md` (measured) + `/docs/ew/authoring/adding-media`.

- **Two EW media modes:** (a) upload directly into DA (per-doc dotfolder) — fine for small/inline; (b) **AEM Assets / Dynamic Media** integration for curated, reused brand content. For ~28.3k masters + heavy press assets, **AEM Assets/DM is the natural DAM** if licensed; otherwise reference-in-place on the legacy CDN for the demo.
- **Images: masters-only.** Ingest ~28.3k logical masters; **drop the ~200k-file derivative ladder** — EDS's pipeline emits responsive `<picture>` + webp on demand (a net perf upgrade; source is JPEG-only). Cuts footprint from ~80–110 GB to ~34 GB.
- **⚠ Heavy masters must be pre-conditioned before publish (build-confirmed).** A story page embedding 4 full-resolution masters (**25–40 MB each**) **409'd the content bus on publish** ("error from content-bus"). Fix that shipped: strip the oversized inline `<picture>` masters and keep the sized derivatives (the metadata `og:image` derivative still drives the card). This is a concrete instance of the abstract "~200k files" media-weight risk and **will recur at scale** — the import pipeline needs a **media pre-conditioning step** that detects images over a threshold (~10 MB) and strips/replaces them with a sized derivative before the publish call. Feeds E05 (see SKODA-501–505).
- **`<img>` must be a direct child of a `<div>`** for EDS `<picture>` wrapping (repo `AGENTS.md` gotcha); block JS lifts images out of `<p>`.
- **Press-page downloads = a static block.** The source `mediakit/v1/mediabox/post/{id}/{lang}` endpoint returns the per-post downloadable image set, so a press page's downloads can be baked into a **static downloads block** at import — **no media-cart service required**. The media-cart is only needed for *cross-page bulk collection* (§8).
- **PDFs** (press kits/reports, up to 26 MB) → link/DAM, never the image pipeline.
- **MP4** uses a **signed-S3 download flow** (`/direct-download/` → expiring S3 URL) — re-host as plain assets or rebuild a signed-download service; a hosting decision, not a static copy.
- **CORS:** the legacy CDN sends **no `access-control-allow-origin`** — reference-in-place works for simple `<img>`/download but blocks cross-origin canvas use; a reason to ingest into the EDS/Assets pipeline for production.
- **Metadata:** 96% alt coverage (good); **53% captions live in `data-caption`** — the import parser MUST carry these into figure captions or half are lost.

---

## 8. Integration Architecture (the static ↔ dynamic boundary)

EDS delivers static HTML; anything stateful is a **bounded client-side integration** loaded late (`delayed.js`) or an external service.

| Feature | Pattern | Pilot stance |
|---|---|---|
| **Consent (OneTrust), GTM, Hotjar** | Third-party scripts in delayed phase | Include |
| **Newsletter / subscriber** | External form + consent service (mailguide or replacement); client posts to API | Stub/defer (or embed provider form) |
| **Banner ad platform** | **Bespoke WP plugin** (not off-the-shelf) — rebuild as a small **vanilla-JS block** (few hundred lines): fetch locale feed → tag-match to page → geo check → `localStorage` frequency-cap → render sidebar/inline/pop-up (timer/scroll trigger) → tracked-redirect clicks; consent-gated. **Data-source decision:** reuse the existing `skoda-banners/v1` API (fast, legacy dependency) **or** re-home banner management to an EDS **sheet/DA feed** (columns: image, type, target-tags, geo, frequency, link). Campaigns are **locale-scoped** (cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1) + content-tag/geo/frequency targeting → block must be **locale- and tag-aware**. *Also consider whether the full ad-server machinery is needed vs a simpler "featured promo" block.* | **Drop for pilot** |
| **Media-cart** | Requires session/state backend; client SDK against a cart service — **only for cross-page bulk collection** (per-page downloads are a static block fed by `mediakit/v1/mediabox`, §7) | **Drop for pilot** (plain download links) |
| **Search (body/relevance)** | Hosted search service fed by the index | Index-only for pilot |
| **Embeds** | Native lazy `<iframe>` autoblock | Include |

**Principle:** the pilot proves the *static* architecture end-to-end; each 🟠 service is a separate, independently-scheduled workstream with a clear API boundary — none blocks the content migration.

---

## 9. Internationalization Architecture

Grounded in `/docs/translation-and-localization`, `/docs/ew/administering/translation-strategy`, `/docs/ew/authoring/translation-projects`.

- **Content tree per locale** (`/en/`, `/de/`, `/cs/`, `/sk/`, `/sr/`, `/sl/`) — the docs explicitly discuss the `/xx/` region-first IA and its SEO/duplication trade-offs; mirror the source's existing locale-prefix structure.
- **EW Translation app** (Google Translate default; pluggable connectors) + **Translation projects** (URL-list based) handle rollout — `/docs/ew/administering/translation-service-connection`. **Transcreate/localize/rollout** vocabulary from the strategy doc frames stakeholder expectations.
- **Uneven translation is native, not a problem:** since content is per-locale docs, a story existing in 4 of 6 languages is simply 4 docs — translation projects fill gaps on demand. (Corrects the earlier "uniform 6×" assumption.)
- **Per-locale query-index** via admin config-service `query.yaml` locale definitions (§6; not repo `helix-query.yaml`).
- **Placeholders per locale** (`/docs/placeholders`) externalize UI strings ("Load more", "Search").
- **Language-negotiated root routing** (`/` → `/de/` by `Accept-Language`) → reproduce via CDN/edge redirect or a small root-doc script; **[decision]** whether to keep auto-detection or default to `/en/`.

---

## 10. Import & Authoring Pipeline

Two complementary paths, both doc-supported:

1. **EW native Import** (`/docs/ew/administering/import`) — import an existing EDS project *by Query Index or by URL* into EW; good for re-importing already-EDS content and for validating into a **drafts folder** first (the docs flag it as destructive).
2. **Scripted DA-source-API import** (this project's established pattern) — for the bulk source-site migration:
   - Per-template **parsers/transformers** (this repo's `tools/importer/` + bundled importer) convert source HTML → clean DA HTML. **The story parser must flatten SiteOrigin Page Builder** (the key new parser complexity).
   - `POST` each generated doc to `https://admin.da.live/source/{org}/{repo}/{path}.html` (credentials injected; no token in chat).
   - **Media bulk-load:** ingest masters-only; rewrite `<img>` to DA/Assets references; carry `alt` + `data-caption`.
   - **Bulk Operations / Traverse** (`/docs/ew/authoring/bulk-operations`) to preview/publish en masse and to generate URL lists.
- **AI/MCP option:** EW's **MCP** endpoint (`/docs/ew/authoring/mcp`) lets an agent create/move/publish docs programmatically — usable to orchestrate or QA the migration.

**Ordering:** discover URLs (sitemaps/REST, per prior reports) → parse per template → push to DA drafts → validate → publish. Content-driven detection only (per repo `AGENTS.md` import rules).

---

## 11. Non-Functional Architecture

- **Performance (`/developer/keeping-it-100`):** buildless, three-phase load (eager/lazy/delayed), RUM for field data. Masters-only + webp + `<picture>` + `width/height` (source already has dimensions → low CLS) targets Lighthouse ~100. Defer all 🟠 integrations to `delayed.js`. **The source sets zero cookies on anonymous load and every stateful system (banners, newsletter, media-cart, search state) is opt-in** — this *validates* the assumption that EDS static pages stay fully CDN-cacheable and dynamic features bolt on client-side without breaking the static delivery model.
- **SEO/GEO (`/docs/seo-geo`):** EDS ships canonical content in initial HTML (SSR-equivalent) — a gain over the source's AJAX listings. Preserve the source's rich structured data (Article, Person, BreadcrumbList, ImageObject) via metadata; keep `hreflang` (per-locale) accurate.
- **Redirects (`/docs/redirects`):** a `redirects` sheet at project root (Source/Destination) — migrate the source's legacy redirects and the cross-locale ones; audit the known dead/redirect-loop URLs.
- **Accessibility:** rebuild interactive blocks to WCAG (carousel pause, modal focus-trap/Escape/return-focus, gallery keyboard nav); backfill the ~4% empty alts.
- **Security/consent:** OneTrust consent gates analytics; no secrets in repo; DA source API credentials injected by the harness (never pasted).
- **Governance:** DA/EW version history, snapshots, live preview, and MCP/agent collaboration (`/docs/ew/authoring/*`) provide editorial workflow.

---

## 12. Fit-Driven Phased Roadmap

- **Phase A — Capability pilot (prove the static architecture), EN:** stand up the **reusable capability** — blocks (teaser/cards, hero, gallery(+modal), embeds), header/footer fragments, **query-index listing + Block-Collection search** (index-only), media masters-only — validated on a **press-release article + its listing** (+ a couple of representative pages). **Story / SiteOrigin-Page-Builder flattening is deferred to Phase B** (hardest template; not needed to prove the static model). Defer all 🟠 services (plain download links, no cart/banner/newsletter). — *validates §4–§7, §10. Effort: ~13–25 AI-days (capability, not one page).*
- **Phase B — Editorial at scale (EN):** the **story template incl. SiteOrigin-Page-Builder flattening** (the hardest parser work), plus remaining templates (Škodapedia + modal, press-kits, pages); scripted DA-source-API import + Bulk Operations; wire consent/analytics (incl. the bespoke `skoda-analytics` event layer); redirects sheet.
- **Phase C — Dynamic services:** decide + build the 🟠 items (hosted search, banner API, newsletter/consent service, media-cart) each behind its API boundary.
- **Phase D — Localization:** EW Translation projects roll out DE/CS/SK/SR/SL; per-locale indexes + placeholders; root language routing.

**Sequencing rationale:** fit rating = phase. 🟢/🔵 content and blocks go first (they *are* the site); 🟠 services are deferred because none blocks content delivery; 🔴 items (derivative ladder, parallax) are simply not migrated.

---

## 13. Risks, Assumptions & Open Questions

**Architectural risks:**
- **R-A1 (re-characterized 2026-09-10, build-informed):** the "can we index at all" worry is **retired** — the static index → client-block model is browser-confirmed on real content. The residual risk is **index field-mapping + publish ordering**, not index design: (a) taxonomy/date fields need a **per-field extraction/normalization layer** (category-from-URL, multi-source date fallback), not clean selectors (§6); (b) config is a **`query.yaml` PUT to the admin config service**, not repo `helix-query.yaml`; (c) the indexer **only sees published pages**, so every increment carries an ordered upload→preview→publish→reindex step. *(Med — was High.)*
- **R-A6 (new):** Heavy source masters (25–40 MB) **409 the content bus on publish**; bulk migration needs a **media pre-conditioning step** (strip/replace images over ~10 MB with sized derivatives) or publishes fail at scale (§7, E05). *(Med)*
- **R-A2 (lowered 2026-09-10, build-informed):** Story flatten is **less risky than the already-downgraded estimate**. For the shipped story/rails slice the "flatten" was a light cleanup transformer + one canonical Metadata block; the `sow-editor` + carousel model held and is now **browser-confirmed**, not merely structural. Full-corpus long tail (interactive widgets, multi-column) still warrants the parser work at go-live. *(Med — was High.)*
- **R-A3:** Four dynamic services have no native EDS equivalent; each needs a build/drop decision before "full parity" is claimed. *(High)*
- **R-A4:** Media DAM choice (AEM Assets vs direct-DA vs reference-in-place) affects perf, rights, and cost; unresolved. *(Med)*
- **R-A5:** MP4 signed-download flow + no-CORS CDN complicate reference-in-place. *(Med)*

**Assumptions:** DA/EW is licensed and available; the org/site in `da.live` exists; AEM Assets integration availability is TBD; translation service = EW default (Google) unless a connector is provided.

**Open questions (stakeholder):** DAM ownership & AEM Assets availability (now sharpened — source masters are too heavy to publish as-is, so the demo pipeline fallback needs a conditioning step; see §7/R-A6); **which of the 15 taxonomy facets are demo-critical for listings vs. deferable** (facet extraction is a normalization layer, not free — §6/SKODA-401); hosted-search procurement; fate of media-cart/banners/newsletter; language-routing policy; content cutoff/archival scope.

**Residual `[RUNTIME-UNCONFIRMED]`** (need a browser, carried from prior reports): modal focus-trap behavior, lightbox interaction, mega-menu hover timing, real LCP/CLS, whether the lightbox fetches larger originals. **Now browser-confirmed (2026-09-10):** homepage layout + all rail carousels (overlay/caption card styles, prev/next arrows, pointer-drag), the query-index → client-block data flow, story-flatten fidelity for the story/rails slice, and pixel-match against the source at 1440px — these are retired from the unconfirmed list.

**Doc-gap note:** the aem.live docs index did not contain an explicit `da.live` *source-API* reference page (the `POST admin.da.live/source/...` contract used here comes from this project's `AGENTS.md`, not from `/docpages-index.json`). Treat the source-API specifics as project-established, not doc-cited.

---

## 14. Appendix — Cited aem.live Docs (fetched 2026-09-04)

| Doc path | Why it matters here |
|---|---|
| `/docs/ew/da-is-ew` | Confirms DA = Experience Workspace; scope of EW tooling |
| `/developer/anatomy-of-a-project` | Repo/delivery model, `aem.page`/`aem.live` |
| `/developer/markup-sections-blocks` | Sections/blocks/auto-blocking authoring model |
| `/developer/byom` | BYOM/HTML content-source class (DA) |
| `/developer/indexing` + `/docs/indexing-reference` | **No spreadsheet indexing in DA**; CSS-selector indexing via admin config-service `query.yaml` (not repo `helix-query.yaml`) |
| `/developer/spreadsheets` + `/docs/authoring-tabular-data` | Sheets for placeholders/metadata/redirects/config |
| `/developer/block-collection` (+ search, modal, header, footer, section-metadata) | Reusable block patterns; modal `/modals/` convention |
| `/docs/fragments` | Header/footer/nav as fragments |
| `/docs/metadata` + `/docs/bulk-metadata` | Page + site-wide metadata |
| `/docs/redirects` | Redirects sheet |
| `/docs/placeholders` | Per-locale UI strings |
| `/docs/ew/administering/import` | EW native import (by index/URL) |
| `/docs/ew/authoring/bulk-operations` | Bulk publish/URL collection/Traverse |
| `/docs/ew/authoring/adding-media` | DA-direct vs AEM Assets/DM media |
| `/docs/translation-and-localization` + `/docs/ew/administering/translation-strategy` + `/docs/ew/authoring/translation-projects` + `/docs/ew/administering/translation-service-connection` | i18n model, rollout, connectors |
| `/docs/seo-geo` | SSR-equivalent SEO, structured data |
| `/developer/keeping-it-100` | Performance/RUM |
| `/docs/ew/authoring/mcp` | Agentic authoring/import orchestration |
| `/docs/ew/authoring/publishing` + `/docs/publishing-from-authoring` | Publish flow |
| `/docs/sidekick` (+ v7 migration) | Preview/publish tooling |

**Cross-references:** builds on `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md` (consolidated findings), `-DISCOVERY`, `-DRILLDOWN`, `-EN-BLOCK-INVENTORY`, `-BLOCK-IMPLEMENTATION-REVIEW`, `-MEDIA-INTEGRATION-REVIEW`, `-MEDIA-DEEP-DIVE`, `-ADVERSARIAL-REVIEW`, `-COMPLEX-SYSTEMS-DEEP-DIVE`. All findings analysis-only; no code, import, or Git performed.
