# E06 — Import Pilot Content (Phase A)

## Goal
Stand up the scripted import pipeline (per-template parsers/transformers, this repo's `tools/importer/` pattern) that converts source-site HTML to clean DA HTML, pushes it to DA via the source API, and previews/publishes it through EW Bulk Operations — then use it to migrate and validate the **pilot page set**: a press-release article + the PR listing + a couple of representative pages. Detection is **content-driven only** (no URL/template/positional assumptions). The hard **story / SiteOrigin Page-Builder flattening** is explicitly **deferred to Phase B (SKODA-801)** — not needed to prove the static model.

## Phase
**A — capability pilot (EN).** All three tickets are pilot-scoped. SKODA-603 is the pilot integration point.

## Tickets
- **SKODA-601 — Import infra: per-template parsers + transformers.** Build the parser/transformer set for the pilot templates (press release, PR listing, representative pages) using content-driven block/section detection; story/SiteOrigin flattening explicitly excluded (Phase B). — deps 102 — 5SP — Y
- **SKODA-602 — DA source-API push + bulk-op preview/publish.** `POST https://admin.da.live/source/{org}/{repo}/{path}.html` (credentials injected by harness — never a token in chat), then EW Bulk Operations to preview/publish (drafts-first) and generate URL lists. — deps 601 — 3SP — Y
- **SKODA-603 — Pilot page set (PR article + PR listing + reps) imported + validated.** Run the pipeline on the pilot set and validate against source (content, blocks, media, metadata). — deps 601,602,201,202,203,204,205,501,502 — 3SP — Y
- **SKODA-604 — Full-fidelity restore on 1–2 hero demo stories** (2SP, **M1**) — re-import 1–2 visually rich stories with in-body galleries + video embed + Media Box preserved (rest stay flattened). Bounded demo deliverable surfaced by the 22-URL analysis (D18). — deps 203,204,502,505,601,602,801 — 2SP — Y

## Effort Roll-up
| Ticket | Type | SP | AI-assisted | Manual |
|---|---|---|---|---|
| SKODA-601 | import | 5 | 2–3d | 4–6d |
| SKODA-602 | integration | 3 | 1–2d | 2–3d |
| SKODA-603 | import | 3 | 1–2d | 2–3d |
| SKODA-604 | import | 2 | 0.5–1d | 1–2d |
| **Total** | | **13 SP** | **4.5–8d** | **9–14d** |

*(Planning estimates, not a quote.)* Critical path: SKODA-601 → SKODA-602 → SKODA-603 (widest dependency fan-in — blocks + media + import infra). SKODA-604 (full-fidelity restore, +2 SP) added 2026-09-14 per D18.

## Source-Doc Traceability
- **`SKODA-EDS-DA-ARCHITECTURE.md`** — §10 (import pipeline: per-template parsers/transformers, DA source-API push, Bulk Operations preview/publish, content-driven detection, drafts-first validation), §4/§3 (press-release → sections + gallery/download/tags/metadata; story flatten is a parser responsibility, deferred), §12 (Phase A capability pilot = PR article + its listing + a couple representative pages; story deferred to Phase B).
- **`SKODA-SYSTEM-BUILD-SPECS.md` §7** — cross-system pilot boundary map.
- **`.register.md`** — SKODA-603 deps (601,602,201,202,203,204,205,501,502); SKODA-801 = Phase B story flattening.
