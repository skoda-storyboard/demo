# SKODA-305, Media Room footer variant
- **Epic:** E03, Chrome Fragments
- **Type:** fragment
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Build the **Media Room footer** as a distinct `footer` fragment variant. The 2026-09-14 walkthrough call confirmed the Media Room footer **differs** from the Storyboard footer (SKODA-304 delivers only the Storyboard variant). Closes traceability gap **G1** (COM18). Requirement: COM18.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/footer-mediaroom.md`](../../ui-specs/footer-mediaroom.md)** (captured via Chrome DevTools; leads with a Storyboard-vs-MediaRoom **delta table**). Read it before implementing.

**Decision resolved by capture → (b) two section-resolved fragments.** The footers differ *materially*: Media Room has **5 widgets** (`app-download`, `social`, a Contacts nav with 2 links, a "Subscribe" mailguide form, and a "Company" text widget + Annual Report PDF) and **no 7-column sitemap**; content columns go `33.33%` at ≥768; copyright wording differs. The social/app/feed/notice shell is identical. Deltas are too large for one fragment, so ship `/footer` + `/media-room/footer` via the existing `getMetadata('footer')` (zero code change). Unification remains a possible later client simplification, but is not recommended given current fidelity.

## Description
COM18 requires the footer to remain aligned with the standard Škoda footer pattern, but the client confirmed Storyboard and Media Room currently run **different footers**. SKODA-304 built the Storyboard footer; this ticket adds the Media Room variant as a second `footer` DA fragment loaded by the same Footer block, selected per section (decision above).

## Requirements / Spec
- Second `footer` DA fragment for the Media Room section (or a unified fragment if the client agrees).
- Loaded by the existing Footer block; section-resolved (Stories → Storyboard footer, Media Room → MR footer).
- Reuse the SKODA-304 patterns (inline-SVG social, app-store badges, legal bar, brand SVG); only the content/links/sitemap differ.
- Confirm the exact deltas (link set, legal, app-badge presence) against the live Media Room footer before locking.

## Acceptance Criteria
Measurable gates + the delta table live in [`footer-mediaroom.md`](../../ui-specs/footer-mediaroom.md); summary:
- [ ] Media Room pages render the MR footer (`/media-room/footer` fragment); Storyboard pages render the Storyboard footer; resolved by `getMetadata('footer')`.
- [ ] MR footer reflects the captured deltas: Contacts nav (2 links), Subscribe form, Company widget + Annual Report PDF, **no 7-column sitemap**; content columns `33.33%` at ≥768.
- [ ] Shared shell (social 40×40 circles, app badges, feed links, copyright) reuses SKODA-304 patterns.
- [ ] MR copyright wording matches source; `npm run lint` passes.

## Dependencies
- Upstream: SKODA-304 (Storyboard footer + Footer-block patterns), SKODA-301 (section resolution)
- Downstream: SKODA-1001 (per-locale footer fragments)

## Risks / Flags
- 🟢 Low effort; a fragment variant, not new block code.
- **Open (client):** unify vs keep-distinct footer/nav across both sites, resolve before build (the client is open to unifying).
- Exact MR-footer deltas to confirm against the live page.
