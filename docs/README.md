# Škoda Storyboard, Documentation Map

Analysis, architecture, and delivery docs for the Škoda Storyboard → AEM Edge Delivery migration.
Organized into topic subfolders. All `.md` here is `.hlxignore`'d (as is `ui-specs/assets/`), these
documents are **not served** by EDS; they are project knowledge only.

**New developer?** Start at [`../ONBOARDING.md`](../ONBOARDING.md) → [`DEVELOPER-GUIDE.md`](DEVELOPER-GUIDE.md) → [`architecture/IMPORT-PIPELINE.md`](architecture/IMPORT-PIPELINE.md).

**Analysis start point:** [`analysis/SKODA-MASTER.md`](analysis/SKODA-MASTER.md) is the canonical findings doc;
its §16 Document Map indexes every source report with its current path.

## Folders

| Folder | What's in it |
|---|---|
| **`analysis/`** | Canonical findings (`SKODA-MASTER.md` + coverage proof) and the source analysis reports behind them, block/widget inventories + datasets, complex-systems deep-dive, flattener POC, header/footer analysis, discovery & drilldown. |
| **`architecture/`** | Target-state build & architecture specs (`SKODA-EDS-DA-ARCHITECTURE.md`, `SKODA-SYSTEM-BUILD-SPECS.md`, `SKODA-DA-EW-EXTENSIBILITY.md`), the import-pipeline guide (`IMPORT-PIPELINE.md`), and `SKODA-DIAGRAMS.md` (Mermaid: integration / authoring-flow / import-pipeline diagrams). |
| **`media/`** | Media pipeline, media-cart/download feasibility, asset mapping, media deep-dive & integration review. |
| **`planning/`** | The demo migration data model and requirement mapping: `SKODA-METADATA-SCHEMA.md` (index contract), `SKODA-BLOCK-DATA-MODEL.md` (reuse-vs-new + shared shells), `SKODA-TEMPLATE-CONTENT-MODELS.md` (per-template DA shapes), `SKODA-RAIL-FEED-MAP.md` + `skoda-rail-feed-corpus.txt` (rail sizing/corpus), `SKODA-CLIENT-REQUIREMENTS-MAPPING.md` (requirement IDs → status → tickets), `SKODA-REQUIREMENTS-TRACEABILITY.md` (bidirectional requirement↔ticket matrix + gap register), `SKODA-POC-URL-SET.md` + `skoda-poc-urls.json`/`.txt` (minimal live-URL coverage set), `SKODA-POC-COVERAGE-MATRIX.md` (URL × component × requirement join), `SKODA-AGENT-HANDOFF-CANDIDATES.md`, and `SKODA-DEMO-FALLBACK-CONFIRM.md` (dynamic-feature scope). |
| **`reviews/`** | Adversarial reviews, correctness audit, block-implementation review. |
| **`archive/`** | **Superseded material, retained as reference** (not deleted). Prior consolidated overview (`SKODA-STORYBOARD-ANALYSIS-OVERVIEW`), succeeded by `analysis/SKODA-MASTER.md`. |
| **`ui-specs/`** | **Measured UI spec library**, 25 component specs (card, hero, footer, carousel, …) + 6 template specs, each with DOM + CSS captured live via Chrome DevTools at breakpoints 768/992/1080. `README.md` = component/template index + full requirement coverage matrix; `_TEMPLATES.md` = page-type → blocks → ticket census; `_FOUNDATIONS.md` = tokens/breakpoints; `_CAPTURE-PROTOCOL.md` = method; `tools/` = the Playwright measurement + visual-diff harness. |
| **`tickets/`** | Delivery backlog, `OVERVIEW.md`, epics, and SKODA-* tickets. |

## Conventions
- **Nothing is deleted.** Obsolete docs move to `archive/` with a banner pointing to their successor, so newer docs stay uncluttered while history remains a reference point.
- Cross-doc references use the doc's **filename** (unique across the corpus); resolve paths via this map or `SKODA-MASTER.md` §16.
- When adding a doc, drop it in the matching topic folder and, if it's a source report, add a row to `SKODA-MASTER.md` §16.
