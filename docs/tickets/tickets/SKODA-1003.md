# SKODA-1003 — Language-negotiated root routing + per-locale placeholders
- **Epic:** E10 — Localization
- **Type:** localization
- **Phase:** D  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Reproduce the source's `Accept-Language`-negotiated root redirect and externalize UI strings per locale via placeholders.

## Description
The source root (`/`) 301-redirects to `/en/`, `/de/`, `/cs/`… based on the `Accept-Language` header (a behavior missed until the adversarial pass). This ticket reproduces it via a CDN/edge redirect or a small root-doc script, with a decision on whether to keep auto-detection or default to `/en/`.

It also externalizes UI strings ("Load more", "Search", etc.) into per-locale **placeholders** (`/docs/placeholders`) so blocks render localized chrome without code changes per locale.

## Requirements / Spec
- Root (`/`) routing negotiated by `Accept-Language` → correct locale prefix; documented fallback (default `/en/`).
- Implementation via CDN/edge redirect or a minimal root-doc script (decision recorded).
- Per-locale placeholders sheet(s) for all UI strings used by blocks; blocks read placeholders (no hardcoded strings).
- Graceful default when a negotiated locale is unavailable.

## Acceptance Criteria
- [ ] Root requests with `Accept-Language: de`/`cs`/… redirect to the matching locale; unknown/absent → documented default.
- [ ] UI strings render localized from placeholders in each locale (e.g., "Load more"/"Search").
- [ ] No hardcoded UI strings remain in block code.
- [ ] A decision record captures auto-detect vs. default-to-EN.

## Dependencies
- Upstream: SKODA-303 (language switcher in nav tools), SKODA-1001 (per-locale trees) / Downstream: none

## Risks / Flags
- **R13 (Low–Med):** language-negotiated root routing to reproduce or consciously drop — stakeholder decision on auto-detect vs. default.
- Edge/CDN redirect capability depends on the hosting config — confirm the mechanism available in EDS/CDN.
