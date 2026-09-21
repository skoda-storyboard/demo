# Škoda Storyboard — Autonomous-Agent Handoff Candidates

**Purpose:** track which parts of the migration can be handed to an autonomous agentic implementation team (AI agents driving a framework we want to evaluate). Living document — add/re-tier as decisions resolve.

**Date:** 2026-09-11 · **Related:** `SKODA-CLIENT-REQUIREMENTS-MAPPING.md`, `docs/tickets/OVERVIEW.md`, `SKODA-DELIVERY-PLAN.md` §8 (decision log).

---

## 1. The filter (a part is handoff-ready when it scores on all five)

1. **Bounded** — one block / one transform; few cross-block deps (EDS blocks are naturally isolated — no cross-block JS imports per AGENTS.md).
2. **Decided** — not blocked on an open decision (D-item) or a client walkthrough / live example.
3. **Objective oracle** — the agent can self-verify unattended. **Hard constraint (user, 2026-09-11): NO visual-fidelity checks** — neither this harness nor another LLM can be trusted to judge pixels to 100%. Acceptable oracles are deterministic only: unit tests over fixtures, standards validators (RSS/sitemap/schema.org/XML), structural DOM/text output-diff, link/route integrity, count reconciliation, and **rule-based** behaviour assertions (e.g. Playwright asserting `aria-expanded` toggles + focus returns — not "looks right").
4. **Low blast radius** — no shared-state corruption; no live systems/credentials (DA push, publish/reindex, AEM Assets) in the agent's own loop. Publish/credential steps stay behind a human gate.
5. **Representative** — real work, so the eval is meaningful.

**Corollary — split every block into a logic/data/structure layer vs a presentation layer.** The logic layer has objective oracles and is handoffable; the presentation layer is the visual-fidelity judgment we exclude → stays with a human (or block-design-expert + visual-critique behind a human gate).

---

## 2. Why RSS was initially missed (post-mortem → workaround)

**I had RSS in context the whole time** (it's in the migration memory as "RSS feed still deferred", and in requirements §9 "RSS feed continuity is still desirable"). I still missed it in the first candidate scan.

**Root cause — enumeration frame too narrow.** My scan was anchored to the **ticket backlog** (`SKODA-*`) and the requirements-mapping table. RSS is **un-ticketed deferred work** (deferred 2026-09-09, footer link left as-is, no ticket cut) → it fell outside the frame I was enumerating over. The gap wasn't missing context; it was **enumerating from the wrong surface.**

**Workaround (applied in §3/§4):** enumerate from the *full artifact surface*, not just tickets —
- (a) **deferred / stubbed** items (memory: RSS, load-more, series auto-rotate, live social feed, rail "All" links, newsletter stub, other locales);
- (b) **chrome / non-page artifacts** (footer links, feeds, config);
- (c) the **machine-consumed-output class** — anything whose deliverable is an XML/JSON/YAML document rather than a rendered page. This class is *inherently* visual-fidelity-free and standards-validated, so it is the single best fit for the no-visual constraint — and it was entirely absent from the first pass. RSS is one member; there are several more (§3.A).

---

## 3. Candidates — objective oracle covers the whole job (no visual check)

### A. Machine-readable output artifacts (the class the first pass missed) ⭐ best fit for the constraint

| # | Candidate | Ticket | Oracle (deterministic, no pixels) | Blocked by |
|---|---|---|---|---|
| A1 | **RSS feed generation** (query-index → RSS 2.0 XML) | *un-ticketed (deferred); cut new ticket* | W3C Feed Validator + RSS 2.0 schema; item-count == filtered index; RFC-822 `pubDate`; per-item field diff vs index; link-integrity | Generation: none. *Delivery* (`/en/feed/` content-type / edge fn) = separate, human/infra |
| A2 | **XML sitemap generation** (index → `sitemap.xml`) | part of §8.1 (no ticket) | XML sitemap schema validation; URL set reconciliation vs query-index; `lastmod` format; no 404/loop | none (generation) |
| A3 | **JSON-LD structured data** (Article/Person/BreadcrumbList/ImageObject) | part of SKODA-205 / arch §9 | schema.org validator / Rich-Results structured-data test; required-property presence; value diff vs source metadata | none |
| A4 | **hreflang / available-locale computation** (per-article "which locales exist") | SKODA-1003 / §6.8 | set-membership assertion (index → alternate links); no dead links; reciprocity check | full rollout waits on D1, but the *mechanism* is logic-only and testable now |
| A5 | **Redirects / SEO-metadata sheet** (legacy + cross-locale → targets) | SKODA-103 | validate against sitemap/REST URL set; assert no loops/404s | *publish* gated to human |
| A6 | **query-index config (`query.yaml`) authoring** | SKODA-104/401 | admin config-service response (201 create / 400 malformed); GET-readback diff | none (config-surface only) |

### B. Pure logic / data transforms (all logic, ~no bespoke CSS)

| # | Candidate | Ticket | Oracle | Blocked by |
|---|---|---|---|---|
| B1 | **Metadata-normalization layer** (category-from-URL, 4-way date fallback, per-facet extraction) | slice of SKODA-401 | fixture unit tests (source HTML/URL → expected fields) | facet *subset* = D12, but core logic decided |
| B2 | **Query-index data logic** (filter/sort/dedupe-by-slug/offset-limit) | slice of SKODA-402 | unit tests over JSON index fixtures | none (data layer; rendering excluded) |
| B3 | **Škodapedia term pre-bake** (~189 terms → `/modals/` docs) | slice of SKODA-802 | output-diff of extracted text/structure + link-integrity + doc-count reconciliation | none (directory+filter decided) |
| B4 | **Import transformer logic** (cleanup + canonical Metadata block) | SKODA-601 | structural output-diff (nodes/attrs/metadata keys) — not pixels | none |
| B5 | **Media pre-conditioning** (detect >~10 MB masters → strip/replace with sized derivative) | SKODA-506 | assert no image over threshold in output + derivative present; content-bus 200 on preview | none (import-artifact concern; independent of AEM Assets) |

### C. Logic-half of a mixed block (hand off logic, keep presentation)

| # | Candidate | Ticket | Hand off (assertable) | Keep in-house (visual) |
|---|---|---|---|---|
| C1 | **FAQ block** | SKODA-807 | FAQPage JSON-LD + ARIA/keyboard behaviour (rule-based Playwright) | accordion look |
| C2 | **Embeds** | SKODA-204 | provider detection, URL→markup map, `dnt=1`, lazy IO wiring | negligible (provider iframes) |

---

## 4. Unlocked IF the open questions resolve

**Assumption (user): ZIP-creation approach (D2) is defined AND an AEM Assets instance is stood up + its API/path scheme frozen (D5).** Then these move from "keep in-house" into handoffable — *still logic-only, no visual check*:

| # | Candidate | Ticket | Becomes handoffable because… | Oracle | Residual gate |
|---|---|---|---|---|---|
| U1 | **Media-cart STATE logic** (device-ID collect, add/remove, dedupe, localStorage persistence, count) | SKODA-505 | cart state is pure client logic once the download contract is fixed | unit tests on cart ops (add/remove/dedupe/persist/clear) | none for state; the *download call* uses the frozen endpoint |
| U2 | **Whole-kit ZIP manifest builder** (asset+rendition list to package) | SKODA-806 | with zip mechanism defined, building the manifest is pure data | manifest == expected asset/rendition set (reconciliation) | the zip *service* itself stays infra |
| U3 | **S3→AEM Assets mapping manifest** (URL → Assets path, dedup) | SKODA-504 | with the instance + path scheme frozen, mapping is a deterministic transform | manifest reconciliation + path-scheme validation + dedup count | *upload* execution gated to human/credentialed step |
| U4 | **Rendition-URL generation** (Original / 1920px etc.) | SKODA-501/§6.9 | with the Dynamic Media/Assets rendition scheme defined, URL construction is logic | rendition-URL pattern assertion + HTTP 200 reachability | — |

**Still NOT unlocked even then:** the zip *serverless endpoint / signed access* (SKODA-902), the actual **AEM Assets upload/ingest execution**, **publish/reindex orchestration** (SKODA-803), and anything wiring **consent/`skoda-analytics`** (804/905, cross-cutting, D10). These fail the blast-radius / isolation filter regardless of the two assumptions.

---

## 5. Recommended eval order (ascending size, each fully test-verified)

1. **A1 RSS generation** — smallest, public-standard oracle (feed validator), non-blocking. Purest test of the framework: success == green validator run.
2. **B1 Metadata-normalization** — real, isolated pure functions; unblocks 401/402.
3. **B3 Škodapedia pre-bake** — tests parallel fan-out with a per-item objective oracle.
4. **A2 sitemap / A3 JSON-LD** — more machine-output-class, reuses the harness pattern.
5. *(if D2 + AEM Assets resolve)* **U1 cart-state logic** — the biggest jump, still test-only.

**Explicitly out of the eval (visual-fidelity dominated):** cards, hero, carousel, gallery/lightbox styling, story-flatten *fidelity* (its structural mapping is diff-able and could be a stretch item, but "looks like source" is the excluded judgment).

---

## 6. What the agent needs handed to it (the contract — same for every candidate)

- **Frozen interface:** input contract (query-index shape / DA table shape / source-HTML fixture set) + output contract (XML/JSON schema or decorated-DOM structure) + allowed `scripts/` helpers + the no-cross-block-import rule.
- **Runnable unattended harness** = the scoreboard: `npm run lint`, unit tests, standards validators, structural/reconciliation diffs — **no human squint step.**
- **Explicit out-of-scope list:** presentation/CSS, publish/credential steps, the coupled parts (consent, special widgets, live services).

> Next step options: cut the **RSS ticket** (generation + deferred delivery decision), and/or draft the **agent-handoff brief** for the top eval pick (A1 RSS or B1 metadata-normalization) — frozen contract + fixtures + validator harness + out-of-scope list.
