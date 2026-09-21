# Škoda Backlog — Adversarial Review (Consistency & Coverage)

**Target:** the `skoda/` delivery backlog (OVERVIEW + 10 epics + 40 tickets).
**Date:** 2026-09-05
**Method:** mechanical checks (template completeness, dependency integrity, estimate roll-ups, bidirectional deps) + coverage falsification (does every pilot requirement map to a *pilot-phase* ticket?) + cross-artifact drift (backlog vs exec deck).

> **✅ RESOLVED (2026-09-05):** All three findings actioned. **F1** — added pilot ticket **SKODA-206** (Škodapedia glossary block) to E02; SKODA-703 now references it; roll-ups updated (E02 16→21 SP, pilot 73→78 SP, total 40→41 tickets / 184→189 SP). **F2** — the backlog's ticket-derived pilot figure (~30–50 AI-days) is now marked **canonical**; deck alignment flagged in OVERVIEW §5. **F3** — downstream back-links added to hub tickets SKODA-102 and SKODA-603. The finding detail below is retained as the audit record.

---

## 1. Verdict Summary

| Check | Result |
|---|---|
| Template completeness (6 sections/ticket) | ✅ **40/40 pass** |
| Header fields (Estimate/Phase/Pilot) | ✅ all present |
| Dependency integrity (deps resolve to real tickets) | ✅ all resolve |
| Estimate roll-ups (per-epic + total) | ✅ **exact** — computed 184 SP matches OVERVIEW (E01=15,E02=16,E03=12,E04=16,E05=8,E06=11,E07=11,E08=34,E09=45,E10=16) |
| Bidirectional dependencies | ⚠️ **12 one-way mismatches** (hub tickets miss downstream back-links) |
| **Pilot coverage** | 🔴 **1 real gap: Škodapedia has no pilot build ticket** yet is listed as a pilot element and audited by a pilot ticket |
| Backlog vs exec-deck effort | ⚠️ **divergent** (28–47 vs 13–25 AI-days) — noted in OVERVIEW but decks not reconciled |

**Overall:** the backlog is structurally sound (templates, deps, and math all check out). Two substantive issues: **one scope contradiction (Škodapedia)** and **one cross-artifact number divergence**; plus minor dependency-hygiene noise.

---

## 2. Findings

### 🔴 F1 — Škodapedia: pilot element with no pilot ticket (scope contradiction)
- **The plan & OVERVIEW pilot definition** list **"Škodapedia (pre-baked)"** as an *in-pilot* capability.
- **But** the only ticket that builds the glossary is **SKODA-802** — **Phase B**, epic E08. There is **no Phase-A / E02 ticket** for the Škodapedia directory + A–Z/category filter + term-detail modal.
- **Worse — it creates an internal inconsistency:** **SKODA-703** (pilot accessibility audit, Phase A) explicitly says it will verify *"modal focus management for the gallery lightbox **and Škodapedia glossary**"* — i.e. a pilot QA ticket tests a block that no pilot ticket produces.
- **Impact:** either the pilot is under-scoped (missing a glossary block ticket) or over-scoped in QA (703 references out-of-pilot work). Left unresolved, the pilot can't pass 703's acceptance criteria.
- **Fix options (decision needed):**
  - **(a)** Add a pilot ticket **SKODA-206 "Škodapedia glossary block (directory + A–Z/category filter + term modal)"** to E02 (~5 SP) and keep the term-*content* pre-bake in 802; **or**
  - **(b)** Drop Škodapedia from the pilot definition and remove the glossary clause from SKODA-703. (Its earlier "self-contained, pilot-yes" rating in the block inventory argues for **(a)**.)

### ⚠️ F2 — Backlog pilot effort diverges from the exec deck (unreconciled)
- **Backlog OVERVIEW §5:** pilot = **73 SP, ~28–47 AI-days / ~56–81 manual**.
- **`SKODA-STORYBOARD-SITE-FACTS.html` deck:** pilot = **~13–25 AI-days / ~45–68 manual**.
- The backlog *explains* the gap (it makes foundation + import + QA explicit, which the deck folded into fewer chunks) — but the two artifacts now show **materially different headline numbers** for "the pilot." A stakeholder reading both will see a contradiction.
- **Fix:** pick one canonical pilot figure and align. Recommend the **backlog number (28–47 AI-days)** as the more complete, ticket-derived estimate, and update the deck to match (or add a one-line reconciliation note to the deck).

### ⚠️ F3 — 12 one-way dependency links (doc hygiene)
- Upstream links exist but the reciprocal **downstream** back-links are missing on hub tickets — chiefly **SKODA-102** (foundation scaffold, missing downstream to 201/202/203/204/205/301/304/501/502/601) and **SKODA-603** (missing downstream to 804/1001).
- **Impact:** low — forward planning is intact; only *reverse* navigation ("what does 102 unblock?") is incomplete. Not blocking, but 102/603 are exactly the hub tickets where a complete downstream list is most useful.
- **Fix:** add the downstream lists to SKODA-102 and SKODA-603 (and optionally stop maintaining downstream on leaf tickets to avoid the upkeep).

### ✅ Things that held up (attacked, passed)
- **Estimate math is exact** — no roll-up drift anywhere (a common backlog error; clean here).
- **All 40 tickets** have the full template and valid dependency IDs.
- **Corrected facts propagated correctly** into tickets: 15 facets (SKODA-401), masters-only + data-caption (SKODA-501), banner per-market (SKODA-903), skoda-analytics cross-cutting (SKODA-905), mobile-nav ARIA fix (SKODA-302), pre-baked glossary → static (SKODA-802).
- **pushState/load-more** (SKODA-402) and **ARIA** (SKODA-302, 703) are present and correctly placed.

---

## 3. Coverage Matrix (pilot requirements → ticket)

| Pilot requirement | Ticket | Phase | OK? |
|---|---|---|---|
| Cards/Teaser (3 variants) | SKODA-201 | A | ✅ |
| Hero | SKODA-202 | A | ✅ |
| Gallery + lightbox | SKODA-203 | A | ✅ |
| Embeds (4 providers, dnt=1, lazy) | SKODA-204 | A | ✅ |
| Tags | SKODA-205 | A | ✅ |
| **Škodapedia glossary** | **— (only 802/Phase B)** | — | 🔴 **GAP (F1)** |
| Header + mega-menu | SKODA-301 | A | ✅ |
| Mobile nav ARIA fix | SKODA-302 | A | ✅ |
| Language switcher | SKODA-303 | A | ✅ |
| Footer | SKODA-304 | A | ✅ |
| Query-index (15 facets) | SKODA-401 | A | ✅ |
| Faceted listing + load-more | SKODA-402 | A | ✅ |
| Search (index-only) | SKODA-403 | A | ✅ |
| Masters-only ingest | SKODA-501 | A | ✅ |
| Downloads block | SKODA-502 | A | ✅ |
| PDF/MP4 handling | SKODA-503 | A | ✅ |
| Import parsers/transformers | SKODA-601 | A | ✅ |
| DA source-API push | SKODA-602 | A | ✅ |
| Pilot page set | SKODA-603 | A | ✅ |
| Lint/tests | SKODA-701 | A | ✅ |
| Performance | SKODA-702 | A | ✅ |
| Accessibility | SKODA-703 | A | ✅ (but audits F1's missing block) |
| Visual QA + consent/analytics stubs + sign-off | SKODA-704 | A | ✅ |

**19 of 20 pilot capabilities have a dedicated pilot ticket; Škodapedia is the one gap.**

---

## 4. Recommended Actions (priority order)

1. **Resolve F1** — decide (a) add pilot ticket SKODA-206 Škodapedia glossary block, or (b) drop Škodapedia from the pilot + edit SKODA-703. *Blocks a clean pilot definition.*
2. **Resolve F2** — pick the canonical pilot effort figure; align the SITE-FACTS deck to the backlog (or add a reconciliation note).
3. **Tidy F3** — add downstream back-links to SKODA-102 and SKODA-603.

*(None auto-applied — this is an audit. On request I'll implement the chosen F1 option and the F2/F3 fixes.)*

---

## 5. Residual / Out of Scope for this audit
- Did **not** re-verify each ticket's *technical* spec against the source system contracts (that's the build-spec docs' job) — this pass audited the **backlog's** internal consistency and coverage only.
- Estimate *magnitudes* were checked for internal roll-up consistency, **not** for real-world accuracy (they remain planning estimates, not a quote).
- Browser-dependent `[RUNTIME-UNCONFIRMED]` items are correctly deferred to SKODA-703 — not a backlog defect.
