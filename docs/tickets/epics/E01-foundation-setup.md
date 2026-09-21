# E01 — Foundation & Setup

- **Phase:** A · **Pilot:** Yes
- **Total effort:** 15 SP · AI-assisted ~5–9d / manual ~11–20d *(planning estimate, not a quote)*

## Epic Goal
Stand up the DA/EW-authored, Git-deployed, buildless Edge Delivery foundation for the Škoda Storyboard migration: a provisioned `da.live` site + GitHub repo wired to AEM Code Sync, the boilerplate scaffold (untouched `aem.js`, three-phase `scripts.js`, global styles/head), root config sheets (placeholders, metadata, redirects), the `helix-query.yaml` indexing skeleton that replaces DA's unavailable spreadsheet indexing, Sidekick v7 preview/publish, and re-derived design tokens + global CSS. This is the capability-pilot substrate every other Phase A epic builds on — no AEM Author, no Universal Editor, no JCR/crosswalk.

## Tickets
- **SKODA-101** — Provision DA/EW site + GitHub repo + AEM Code Sync (delivery on `*.aem.page`/`*.aem.live`).
- **SKODA-102** — Boilerplate scaffold: `scripts.js` three-phase loader, global styles, `head.html`; `aem.js` untouched.
- **SKODA-103** — Root config sheets: placeholders, metadata, redirects.
- **SKODA-104** — `helix-query.yaml` skeleton with per-locale index definitions (DA has no spreadsheet indexing).
- **SKODA-105** — Sidekick v7 setup + preview/publish workflow.
- **SKODA-106** — Design tokens + global CSS, re-derived from source (not ported from jQuery/Owl/Isotope theme).

## Dependencies
- **Upstream:** none (this epic is the root of the Phase A dependency graph).
- **Downstream:** E02 Core Blocks (needs 102, 106), E03 Chrome Fragments (102, 106), E04 Listings & Search (104), E05 Media Pipeline (102), E06 Import Pilot (102), E07 QA & Launch (indirect).

## Source-Doc Traceability
- `SKODA-EDS-DA-ARCHITECTURE.md` §2 (Target Platform Model — DA/EW, buildless repo, Code Sync, Sidekick v7), §6 (Listings & Search — `helix-query.yaml` because spreadsheet indexing is unsupported in DA), §11 (Non-Functional — three-phase load, redirects sheet, RUM).
- `SKODA-SYSTEM-BUILD-SPECS.md` §2 (index schema underpinning; DA-specific indexing note).
- `SKODA-EN-BLOCK-INVENTORY.md` §8 (design must be re-derived — block JS is jQuery/Owl/Isotope; CSS-only responsiveness ports cleanly).
