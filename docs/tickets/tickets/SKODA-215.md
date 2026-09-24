# SKODA-215, Gallery / lightbox "share this" social links

> **Created 2026-09-23** from a PR #103 (SKODA-203) review: the live origin page carries a
> gallery-embedded social-share affordance that neither the SKODA-203 ticket nor
> `docs/ui-specs/gallery-lightbox.md` captured, and the PR does not implement it. Split out as its
> own ticket rather than re-opening SKODA-203, which is otherwise complete against its own AC.

- **Epic:** E02, Core Blocks
- **Type:** block (extension of `gallery`)
- **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo, same milestone as SKODA-203)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*

## UI Specification
No dedicated spec yet. Verified live in isolated Chromium at 1280px and 500px on the origin page
`https://www.skoda-storyboard.com/en/emobility/an-icon-in-modern-form-the-electrifying-favorit/`
(2026-09-23; see markup evidence below). Should be folded into
`docs/ui-specs/gallery-lightbox.md` as a new subsection once measured with Chrome DevTools (add a
`## 11. Share affordance` section with computed styles/positions), this ticket's AC stands
independently in the meantime.

## Summary
The source gallery ships a **"share this content" affordance** distinct from the site's global
follow-us social icons (SKODA-304, footer): (a) a **"Share gallery"** dropdown below the on-page
thumbnail grid, and (b) matching share icons in the **lightbox top bar**. Both build share-intent
links (Facebook/Pinterest/X) for the *current article URL*, not a link to Škoda's own social
profiles. The SKODA-203 PR (#103) does not implement this; it is genuinely missing from that
ticket's Requirements/AC and from `gallery-lightbox.md`.

## Description
Confirmed live in the source HTML for the favorit article (a 5-image STO gallery):

```html
<div class="sb-gallery-bottom">
  <div class="sb-gallery-show-more" data-id="0">…<span>View 5 photos</span></div>
  <div class="sb-gallery-share"><span>Share gallery</span>…</div>
  <div class="sb-gallery-share-dropdown">
    <div class="sb-gallery-share-dropdown-flex">
      <a href="https://www.facebook.com/dialog/share?href=<article-url>&app_id=…">…</a>
      <a href="https://pinterest.com/pin/create/bookmarklet?url=<article-url>&media&description=<article-title>">…</a>
      <a href="https://x.com/intent/post?url=<article-url>&text=<article-title>">…</a>
    </div>
  </div>
</div>
```

and, separately, inside the (mobile-gated, source) lightbox top bar:

```html
<div class="sb-gallery-lightbox-top-right">
  <div class="sb-gallery-lightbox-overview-link">…Gallery overview</div>
  <div class="sb-gallery-lightbox-share">
    <a href="https://www.facebook.com/dialog/share?href=<article-url>…">…</a>
    <!-- + Pinterest/X, same pattern -->
  </div>
  <div class="sb-gallery-lightbox-close"></div>
</div>
```

This is **not** the same requirement as **COM15 (Social Share)** in
`docs/planning/SKODA-REQUIREMENTS-TRACEABILITY.md`, which currently maps COM15 only to **SKODA-304**
(the footer's "follow us" channel icons: FB/YT/IG/WhatsApp links to Škoda's own profiles, `40×40`
black circles, `--social-icon-*` tokens). The gallery/lightbox share links are **share-intent** URLs
built from the *current page's* URL + title (content sharing), a different capability that the
traceability matrix's "✅ footer social built" note does not cover. Update COM15's status in
`SKODA-REQUIREMENTS-TRACEABILITY.md` once this ticket ships (partial → full coverage).

Also confirmed on the source: the on-page dropdown sits next to the existing "View N photos" /
"show more" toggle. SKODA-203 already made a deliberate, stakeholder-approved call to drop the
"show all images" overview toggle, that decision is unaffected by this ticket; this ticket is scoped
to the share links only, not the overview grid.

## Requirements / Spec
- **On-page:** a "Share" affordance near the gallery (e.g. below the thumbnail rail, matching the
  source's position relative to the removed "show more" control) that opens/reveals share-intent
  links for the current page: Facebook, Pinterest, and X (match the source's 3
  networks; do not add networks not present in the source without a stakeholder ask, mirroring the
  SKODA-203 precedent of flagging deviations explicitly).
- **In the lightbox:** the same share links, placed in the top bar per the source (`sb-gallery-lightbox-share`), not gated to mobile only — SKODA-203 already established "one lightbox at all viewports" as the target, this ticket's share row follows that same precedent (no desktop/mobile split).
- Share URLs are share-intent links for the **article's own URL + title** (`window.location.href` /
  `document.title` equivalents at render time), not hardcoded to a fixed post.
- Icons: inline SVG, Trusted-Types-safe (matches `gallery.js`'s existing `svgIcon()` helper and
  house icon style, 24×24 solid fill), each link labeled via `aria-label` ("Share on Facebook" /
  "Share on Pinterest" / "Share on X") and opens in a new tab
  (`target="_blank" rel="noopener"`).
- Reuses `--gallery-accent` / existing gallery tokens for hover state; no new color tokens unless a
  measured capture says otherwise.
- Defensive: renders even if `document.title` is empty (falls back to a generic share text); no
  layout shift if JS share-URL construction runs after paint.

## Acceptance Criteria
- [ ] "Share gallery" affordance present on-page (position matches source intent: alongside the
      gallery, not buried in an unrelated section).
- [ ] Matching share affordance present in the lightbox top bar, at all viewports (no mobile-only
      gate, consistent with SKODA-203's "one lightbox" decision).
- [ ] Facebook / Pinterest / X share-intent links open with the correct current-page URL +
      title populated.
- [ ] Each link is a real `<a>`/`<button>` with an `aria-label`; visible `:focus-visible` ring;
      keyboard-operable.
- [ ] `npm run lint` (JS + CSS) clean, tokens-only CSS.
- [ ] `docs/planning/SKODA-REQUIREMENTS-TRACEABILITY.md` COM15 row updated to reference this ticket
      alongside SKODA-304 once shipped.

## Dependencies
- Upstream: SKODA-203 (gallery block must exist first; this extends it)
- Related: SKODA-304 (footer social icons — same visual icon-conversion pattern, different feature;
  do not conflate the two in implementation or in requirement tracking)

## Risks / Flags
- [RUNTIME-UNCONFIRMED]: only verified on one STO story gallery (favorit article, 5-image gallery);
  confirm the same markup/behavior is consistent on Media-Room galleries and press-release galleries
  before closing this ticket (Media-Room's `sb-gallery-lightbox-media-share.media-cart-actions` div
  is a *separate*, already-covered concern — media-cart add/download/copy-link, not social share —
  do not conflate the two).
- Low estimate (1 SP) assumes reuse of `gallery.js`'s existing icon/button patterns; re-estimate if a
  measured capture surfaces a materially different interaction (e.g. a full share-sheet modal rather
  than a simple link row).
