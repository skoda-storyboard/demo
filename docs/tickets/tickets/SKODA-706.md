# SKODA-706, Branded 404 (Page not found)
- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** template
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 0.5–1d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-404.md`](../../ui-specs/template-404.md)** (captured via Chrome DevTools on a live dead URL). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- Branded 404 (`error404`) that **keeps the Storyboard chrome** (header + footer) and serves a real HTTP 404.
- Content: "404" label + `h1 56px/61.6/700` "You've reached a dead end." + subcopy `16/24/400` (with a "rear-view camera" link) + "Or return to the [homepage]" (green link → `/`) + a dead-end road-sign image (right on desktop, stacked on mobile).

## Summary
Deliver the branded 404 page as the EDS `404.html`, reusing the standard header/footer, with the "dead end" headline + copy + homepage recovery link + sign image, and a correct 404 status.

## Description
Confirmed live. This ticket delivers:
- **`404.html` at the site root** (EDS serves it for unknown paths), returning HTTP 404 (not 200).
- **STO chrome** (header + footer) kept.
- **404 content block:** headline + subcopy + homepage link + decorative sign image; two-part desktop layout, stacked on mobile; localizable copy.

## Requirements / Spec
- Reuse the standard header/footer decoration; author the message as a simple block.
- Server returns 404 for not-found; the `homepage` link is the primary recovery action.
- Copy per-locale (E10).

## Acceptance Criteria
Measurable gates live in [`template-404.md` §10](../../ui-specs/template-404.md); summary:
- [ ] Serves HTTP **404** with the branded page; STO header + footer present.
- [ ] "404" label + `h1 56px/61.6/700` headline + subcopy `16/24/400`; `homepage` link (green) → `/`.
- [ ] Desktop two-part (text left / sign image right); stacks single-column on mobile.
- [ ] Sign image `alt=""` (decorative); homepage link keyboard-focusable with visible ring.
- [ ] Visual diff vs source at 1280/500 ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-301 (header), SKODA-304 (footer), SKODA-106 (tokens)
- Downstream: SKODA-1001 (per-locale 404 copy)

## Risks / Flags
- **Mobile headline scale (🟡):** default add a modest reduction for the `56px` headline on narrow screens.
- Ensure the EDS/CDN config actually returns a 404 status for unknown paths (not a soft-200).
