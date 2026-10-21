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

## Amendment (2026-10-21, M2 gap review)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 and §7.6.
- **Estimate (amended):** 3 SP · AI-assisted 1–1.5d / manual 2–3d *(planning estimate, not a quote)*. 1 SP above,
  plus ≤ 0.5 SP for the variant decision and its rows (G-E-04), plus 1–1.5 SP for the lookup and the prefilled
  search (G-T7-01, G-T7-04).

**Added scope:**
- **Two variants (G-E-04, Low).** The source 404 rotates two variants: "You've reached a dead end" (rear-view camera,
  the one in `template-404.md`) and "Welcome to our remote car park" (Park Assist 3.0), which a sampled unknown URL
  served. Record the decision: one variant, or rotate both (then spec the second variant's copy and image).
- **Two indexable content pages (G-E-04).** `/en/youve-reached-a-dead-end/` and `/en/welcome-to-our-remote-car-park/`
  are WordPress pages that answer 200 with `index, follow`. Add redirect rows to `/en` (SKODA-103 sheet) instead of
  migrating them.
- **Slug lookup (G-T7-01, G-T7-04; was SKODA-103b T4, now SKODA-103d).** The 404 page reads the per-locale slim slug
  map that 103d generates, never the full query-index (about 0.7–0.85 MB per 404 view at full scale). It normalises
  the last path segment with 103d's spec (decode, lowercase, strip trailing junk, a non-locale first segment counts
  as `en`), and replaces the location on an exact or unique-prefix match within the locale and section. The lookup
  is a fallback for people; search engines don't render 4xx pages, so SEO-relevant moves are edge rows (103d).
- **Prefilled search (G-T7-01).** On no match or an ambiguous prefix, offer the locale search with the slug words as
  the query (`?q=`, which the search block reads).

**Added acceptance criteria:**
- [ ] The variant decision is recorded here and in `template-404.md`; both content URLs 301 to `/en` (G-E-04).
- [ ] On the production host, the 4 G-KJ-04 probes and the 12 unique-prefix truncations in the gap review's
      `probes.json` reach their target page from the 404 page (G-T7-01).
- [ ] A slug with a trailing `%20`, `&quot;` or `...` resolves like the clean slug (G-T7-01).
- [ ] The 4 ambiguous truncations and an unknown slug show the locale search prefilled with the slug words (G-T7-01).
- [ ] The response stays HTTP 404, and the page fetches only the slim map or one shard, not `query-index.json`
      (G-T7-04).
- **Dependencies (added):** SKODA-103d (slug map, normalisation spec), 103 (redirect rows), 103b (rule order).
