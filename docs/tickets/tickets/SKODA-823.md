# SKODA-823, Story sidebar newsletter sign-up widget (UI stub)
- **Epic:** E08, Editorial at Scale (UI); production service stays E09 / SKODA-904
- **Type:** block + import
- **Phase:** A · **Milestone:** M1 (demo, UI only, no ESP wiring)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO

## Origin
Side-by-side QA of the Epiq story (2026-09-24). No existing ticket covers the **inline sidebar**
presentation. SKODA-904 is the M2 subscriber backend, and `docs/ui-specs/newsletter.md` names a
`newsletter-stub` block that was never built (not in `blocks/`).

## Problem
The source sidebar opens with `.sidebar .newsletter-subscribe-widget` (345×355 at 1440, top of the
aside, above "Explore more"). It has a car image header with "Be the first / to get the latest
stories", an e-mail field, and a mint "Subscribe now!" pill on dark green. `skoda-story-aside.js`
drops it, so the EDS aside starts directly with "Explore more".

## Scope
- Build the UI-only stub per **`docs/ui-specs/newsletter.md`** (inline sidebar presentation; the
  spec was measured on this exact Epiq page): image header + heading, e-mail input, consent,
  honeypot, and the "Subscribe now!" button. Submit shows a stubbed "check your email" state and
  posts nothing (ESP wiring is SKODA-904).
- Share the component with the topbar "Subscribe to our stories" dropdown where possible (same spec).
- Importer: `skoda-story-aside.js` emits the stub block at the top of the sidebar section instead
  of dropping the widget. Heading text + image come from the source widget, so it stays authorable.
- Out of scope: the side banner (`.side-banner .sa-bnr`, 345×345) → **SKODA-903** banner platform.

## Acceptance Criteria
- [ ] 1440: widget at the top of the aside, 345px wide, matching newsletter.md (colours, button, input).
- [ ] Accessible form: labelled input, real button, visible focus, and an error for an invalid e-mail.
- [ ] No network submission in M1; the stub state is clearly non-functional to QA.

## Dependencies
SKODA-904 (production service), SKODA-801 (aside rebuild), SKODA-903 (side banner, separate).
