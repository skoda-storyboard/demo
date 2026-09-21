# E07 — QA, Perf, A11y & Launch (Phase A)

## Goal
Verify the pilot is production-grade and sign it off. Lint + unit-test block logic, hit Lighthouse ≈100 + RUM with a clean three-phase (eager/lazy/delayed) load, pass an accessibility audit (nav ARIA, gallery/glossary modal focus-trap, contrast, keyboard — several items are `[RUNTIME-UNCONFIRMED]` and need a real browser), and close with a visual critique vs source plus consent (OneTrust) and analytics (GTM / `skoda-analytics`) wired as **stubs only**, then pilot sign-off.

## Phase
**A — capability pilot (EN).** All four tickets are pilot-scoped. SKODA-704 is the final gate.

## Tickets
- **SKODA-701 — Lint + unit tests for block logic.** `npm run lint` clean; unit tests for pure block logic (facet filter/sort/paging, embed provider-URL parsing incl. `dnt=1`, glossary class-matching). — deps E02,E03,E04 — 2SP — Y
- **SKODA-702 — Performance (Lighthouse≈100, RUM, LCP/CLS, 3-phase load).** Lighthouse ≈100, RUM enabled, LCP/CLS in budget, three-phase load verified; all 🟠 integrations + third-party scripts confined to delayed phase. — deps 603 — 3SP — Y
- **SKODA-703 — Accessibility audit (nav ARIA, modal focus-trap, contrast, keyboard).** Nav ARIA (from SKODA-302), modal focus-trap/Escape/return-focus for gallery + glossary, contrast, keyboard nav; clear the `[RUNTIME-UNCONFIRMED]` items in a browser; backfill empty alts. — deps 603 — 3SP — Y
- **SKODA-704 — Visual critique vs source + consent/analytics stubs + pilot sign-off.** Visual critique vs source; OneTrust consent + GTM/`skoda-analytics` as delayed-phase, consent-gated stubs; pilot sign-off (proven vs deferred). — deps 702,703 — 3SP — Y
- **SKODA-706 — Branded 404.** Real HTTP 404 on a branded "dead end" page that keeps the STO chrome (header + footer) + homepage link. Added 2026-09-15 (ui-specs). — deps 301,304 — 1SP — N (M2). Spec `ui-specs/template-404.md`.

## Effort Roll-up
| Ticket | Type | SP | AI-assisted | Manual |
|---|---|---|---|---|
| SKODA-701 | QA | 2 | 1d | 1–2d |
| SKODA-702 | QA | 3 | 1–2d | 2–3d |
| SKODA-703 | QA | 3 | 1–2d | 2–4d |
| SKODA-704 | QA | 3 | 1–2d | 2–3d |
| SKODA-706 | template | 1 | 0.5d | 0.5–1d |
| **Total** | | **12 SP** | **4.5–7.5d** | **7.5–13d** |

*(Planning estimates, not a quote.)* SKODA-701 runs in parallel (deps E02/E03/E04); SKODA-702 + SKODA-703 depend on SKODA-603; SKODA-704 depends on 702 + 703 → final gate.

## Source-Doc Traceability
- **`SKODA-EDS-DA-ARCHITECTURE.md`** — §11 (non-functional: keeping-it-100, three-phase load, RUM, low-CLS from source dimensions; WCAG rebuild — carousel pause, modal focus-trap, gallery keyboard; OneTrust gates analytics in delayed phase), §13 (residual `[RUNTIME-UNCONFIRMED]`: modal focus-trap, mega-menu timing, real LCP/CLS).
- **`SKODA-SYSTEM-BUILD-SPECS.md`** — §7 (consent/analytics coupling — OneTrust + `skoda-analytics` dataLayer, delayed phase, stub for pilot), per-system a11y notes (facet labels/keyboard, modal focus `[RUNTIME-UNCONFIRMED]`, iframe titles).
- **`SKODA-MEDIA-DEEP-DIVE.md` §10** — lightbox/LCP `[RUNTIME-UNCONFIRMED]` (needs a browser).
