# SKODA-706, Branded 404 (Page not found)
- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** template
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-10-19):** 🔵 in PR (branch `skoda-706-404`). The re-measure found the 2026-09-15 capture wrong: there is
  no grey band and no separate sign image. The live 404 serves one of **two** variants at random ("You’ve reached a dead
  end." and "Welcome to our remote car park"), each a full-bleed photo band with the message over it.
  - **Built:** both variants, as DA fragments (`/en/fragments/404/<slug>`, `import-404.js`) that `404.html` loads at
    random (`templates/error-404`).
  - **Measured:** the band, message box, type, colours and footer overlap match the source at 11 widths (spec §3).
  - **Re-estimate:** ≈ 2–3 SP with the importer and the fragments.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-404.md`](../../ui-specs/template-404.md)** (captured via Chrome DevTools on a live dead URL). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket (*superseded by the 2026-10-19 re-measure; see Status and the spec*):
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
Measured gates are in [`template-404.md` §8](../../ui-specs/template-404.md). The deviations from origin, open until a
human approves them, are in §7.
- [x] Serves HTTP **404** with the branded page; STO header + footer present.
- [x] Both source variants, one at random per visit, from DA fragments (authorable; per-locale copies are SKODA-1001).
- [x] Each variant matches the source at 1920–375: the 900px photo band, the message box (x / y / width / height), the
      label / heading / copy type, the colours and the footer overlap (5.263% of the width).
- [x] The desktop photo from 720, the mobile photo below; the photo is decorative (`alt=""`) and the eager LCP image.
- [x] The `homepage` link (green → `/`) is keyboard-focusable with a visible ring.
- [ ] The `/en/fragments/404/*` fragments are published with the merge (a separate content step).

## Dependencies
- Upstream: SKODA-301 (header), SKODA-304 (footer), SKODA-106 (tokens)
- Downstream: SKODA-1001 (per-locale 404 copy)

## Risks / Flags
- ~~**Mobile headline scale (🟡)**~~: measured; the source's mobile copy is 32/36.8 below 720 (spec §3).
- ~~Ensure the EDS/CDN config actually returns a 404 status for unknown paths (not a soft-200).~~ Verified: aem.page and aem.live return 404.
