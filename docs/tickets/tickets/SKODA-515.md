# SKODA-515, Media Box bulk-add fly-to-cart feedback

- **Epic:** E05, Media Pipeline
- **Type:** shared cart-presentation motion follow-up
- **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2 (planning priority, not a failed-add claim)
- **Source:** supplemental user observation `WIRELESS-05`, measured 2026-10-07; not a #266 workbook record.
- **Implementation reference:** closed #51 / SKODA-505b, reference only.
- **Prerequisite:** [#295 / SKODA-514](https://github.com/skoda-storyboard/demo/issues/295), the new M1 disclosure-row mask; recorded as a native GitHub blocked-by dependency.
- **GitHub issue:** [#294](https://github.com/skoda-storyboard/demo/issues/294)
- **Status (2026-10-15, from GitHub):** 🔵 TODO (M2), no owner. Starts after SKODA-514 (#295) closes: it is the stated prerequisite.

## Summary and M2 boundary

Add the missing bounded **fly-to-cart/badge cue** for the Media Box header's bulk-add action.
The demo already collects all seven individual files and animates selected thumbnail scrims/glyphs; this is not "no animation at all" or a failed-add report.
Treat cosmetic motion parity as M2. A genuinely broken add/count/selection or accessibility flow is M1 under its own owner.

This is a **new standalone follow-up**, not an extension/reopening of #51 or production-hardening #78.
Extract only this supplemental observation from the unpublished `QA266-M2-04` draft; its 20 workbook records remain there.

## Environment and measured evidence

- Origin: https://www.skoda-storyboard.com/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/
- Demo: https://main--demo--skoda-storyboard.aem.live/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones
- Evidence: serial Chrome DevTools DOM/computed-style/interaction inspection on **2026-10-07** at **1280 x 900, DPR 1**, with `prefers-reduced-motion: reduce` false. No screenshots.
- Origin control: `.search-results.media-box .search-results-stats .media-cart-action[data-id="447920"]`.
- Demo control: `.downloads-add-all`.

Click the **header** action, not an individual tile's plus control.
Origin creates a `.flying-to-cart` clone and flies it toward the floating cart over **700ms** (`easeInOutExpo`), then shrinks/fades it over approximately 400ms.
The badge changes at approximately one second with a wobble cue; the sampled clone disappeared by 1121ms.

Demo creates no observed flight clone, but its existing feedback works:

- Thumbnail scrim opacity and glyph scale animate with **0.3s duration + 0.3s delay**, using the bounce curve; glyph size changes from 64px to 48px.
- All **seven** tile controls acquire `data-in-cart`; bulk `aria-pressed="true"`, badge **7**.
- Accessible cart name is **"Media cart, 7 items"** and the live region announces **"7 items in the media cart"**.

Origin's header collects article ID 447920 as one collection entry; the demo collects seven individual files.
That model/count difference is not a new defect by itself and must not be changed merely to match the animation.
The observation does not verify package/ZIP output or download parity.
Both owned anonymous carts were restored to empty; no downloads or personal-data submissions were performed.

The generic cart spec's earlier Images-listing selection description is not evidence that this story has no header action; use this page-specific measured control.

## Acceptance criteria

- [ ] Add a bounded success-triggered flight/badge cue to the existing Media Box bulk-add action using shared cart presentation, without seven simultaneous flights, a new jQuery dependency or duplicate cart-state logic.
- [ ] Reproduce the origin's approximately 700ms flight and subsequent fade/shrink/badge feedback as the visual reference, but do not delay actual state, pressed state, count or ARIA announcements to imitate source timing.
- [ ] Preserve working thumbnail scrim/glyph animation, seven-file collection, accessible names/live region, selection persistence, per-tile actions and the established cart count model.
- [ ] With reduced motion enabled, avoid spatial flight/bounce and retain clear non-spatial success feedback; decorative clones are non-interactive, non-focusable and excluded from the accessibility tree.
- [ ] Animate only confirmed successful additions. Repeated clicks, already-selected state, refused/capped additions or failed resolution must not show misleading success, invent counts or silently hide real errors.
- [ ] Use transform/opacity and the existing presentation/lifecycle seam; clean up temporary clones, animations and listeners on completion/cancellation without layout shifts or scroll/resize regressions.
- [ ] After SKODA-514, verify collapsed/expanded Media Box layout, focus room, disclosure state and cart overlays remain correct. Serialize changes on the shared Downloads/cart surface.
- [ ] Regression-check per-tile add/remove, other story/release/press-kit bulk-add controls and floating-cart placement across 375/768/992/1080/1280 with normal and reduced motion.
- [ ] Run appropriate targeted repository checks and independent measured interaction QA; record actual state/ARIA and motion timing rather than screenshots or a passing static-check claim.

## Dependencies, collisions and exclusions

**[#295 / SKODA-514](https://github.com/skoda-storyboard/demo/issues/295) is the prerequisite for this shared-surface motion work.**
Coordinate with current Downloads/cart-presentation work; different milestone labels do not justify concurrent edits to the same component.
Serialize edits affecting Downloads controls, selected-state overlays, shared cart actions, floating badge and animation lifecycle.

#51 remains a completed implementation reference.
#78 remains production cart/backend hardening, not ownership of this cosmetic cue.
This issue does not change ZIP packaging, full-quality original delivery, non-image eligibility, source/demo collection models, or unrelated file-tile/icon/date polish.
Do not expand in-progress/review/done ticket scope to absorb it.

## Supporting context

- [Media cart presentation spec](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/media-cart.md)
- [Downloads spec](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/downloads.md)
- [Full-quality originals / ZIP contract](https://github.com/skoda-storyboard/demo/blob/main/docs/planning/SKODA-DEMO-FALLBACK-CONFIRM.md)
- [CSS / motion guardrails](https://github.com/skoda-storyboard/demo/blob/main/docs/guardrails/css-guidelines.md)
- [Team operating model](https://github.com/skoda-storyboard/demo/blob/main/AGENTS-TEAM.md)
