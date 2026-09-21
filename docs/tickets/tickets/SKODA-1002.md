# SKODA-1002 — EW Translation projects rollout (DE/CS/SK/SR/SL)
- **Epic:** E10 — Localization
- **Type:** localization
- **Phase:** D  ·  **Pilot:** No · **Milestone:** M2 (go-live — DE/SK/SR/SL only; CS demo scope is M1, see note below)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual varies (content ops) *(planning estimate, not a quote)*

## Summary
Roll out the five non-EN locales (DE/CS/SK/SR/SL) using EW's native Translation projects (URL-list based), filling per-locale gaps on demand. Largely content-ops; effort scales with translated volume.

> **Milestone split (deck §3/§7):** **Czech (CS) is in the M1 demo** (EN + CS are the two primary demo languages) — the demo CS story set is produced as part of the M1 story/import work (SKODA-801/603), not here. **This ticket is M2** and covers the **four on-demand languages (DE/SK/SR/SL)** at go-live. EN and CS share the identical component set (`SKODA-STORY-WIDGET-CENSUS.md`), so CS adds volume, not complexity.

## Description
With per-locale trees and indexes in place (SKODA-1001), use the **EW Translation app** (Google Translate default; pluggable connectors) and **Translation projects** to roll content into DE/CS/SK/SR/SL. Because content is per-locale docs, uneven coverage is native — Translation projects fill gaps on demand rather than forcing a uniform 6× duplication. The transcreate / localize / rollout workflow from the strategy docs frames stakeholder expectations.

This is primarily a **content-ops** effort (project setup, connector config, review workflow); the code effort is the connector/project wiring. Volume — and therefore manual effort — varies with how much of the EN corpus each locale actually needs.

## Requirements / Spec
- EW Translation service connection configured (default Google Translate or a provided connector).
- URL-list-based Translation projects per target locale (DE/CS/SK/SR/SL).
- Content-ops workflow: map which items exist/are needed per locale (uneven coverage), review + publish.
- Published translations land in the correct per-locale tree and are picked up by the per-locale index.

## Acceptance Criteria
- [ ] Translation service connection works for all five target locales.
- [ ] A URL-list Translation project can be created, run, reviewed, and published per locale.
- [ ] Translated docs land in the correct locale tree and appear in that locale's query-index.
- [ ] Uneven coverage is handled (locales missing an item are not blocked).

## Dependencies
- Upstream: SKODA-1001 (per-locale trees + indexes) / Downstream: none

## Risks / Flags
- **R12 (Med):** uneven per-language translation means rollout can't assume parity; content-ops must map per-locale coverage first.
- Manual effort varies widely with volume (content ops) — not code-bound; estimate is for wiring, not translation volume.
- Translation service = EW default (Google) unless a connector is provided — stakeholder decision.
