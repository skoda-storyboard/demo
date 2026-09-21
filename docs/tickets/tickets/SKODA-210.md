# SKODA-210, Custom microsite (full-width event-gallery / campaign) scope + template
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*, **pending a migrate/fold/drop decision (see Risks)**

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/custom-microsite.md`](../../ui-specs/custom-microsite.md)** (structure + core layout measured via Chrome DevTools on the Peaq world-premiere gallery). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md). Block-universe evidence: [`docs/analysis/SKODA-BLOCK-RECOUNT.md`](../../analysis/SKODA-BLOCK-RECOUNT.md) §2/§6/§8.

Key facts from the block recount (2026-09-15) that create this ticket:
- **201 pages (5.8% of the site)**, a whole STO page family with **no prior spec, ticket, or `_TEMPLATES` entry**: `template-custom-full-width` event-gallery + campaign microsites (world-premiere galleries, `womens-day/*`).
- Full-bleed shell (SiteOrigin `.panel-grid` `max-width:none`, no 1248 cap) fronting a **large colorbox photo gallery** (264 tiles measured on one page) + a centered ~856px intro text column.

## Summary
Decide whether these 201 dated microsites migrate, fold into the generic Page shell, or are dropped, and deliver the chosen path. Recommended default: no bespoke template, migrate the still-relevant ones as generic Pages with a full-width Section Metadata style + the `gallery` block, archive the expired campaigns.

## Description
Confirmed live. These are gallery-heavy campaign/event pages on a full-width shell. They compose only existing components (`siteorigin-body` + `gallery` + `card-teaser`), so the work is mostly a scope decision + the full-bleed layout mechanism, not new UI:
- **Full-bleed layout:** a Section Metadata `Style: full-width` on the generic Page shell (SKODA-813), not a new template.
- **Gallery:** reuse the `gallery` block (SKODA-203); these carry the site's largest image sets, so lazy-loading + colorbox `rel`-group scoping matter most here.
- **Scope:** agree a cutoff with the client; migrate live/relevant microsites, archive expired campaigns.

## Requirements / Spec
- Full-bleed content region (no 1248 cap) with the intro copy constrained to its centered `~856px` column.
- Gallery tiles `≈16:9`, lazy-loaded, lightbox scoped to the page's set (`gallery-lightbox.md`).
- Compose from existing blocks; no bespoke one-off CSS.

## Acceptance Criteria
Measurable gates live in [`custom-microsite.md` §9](../../ui-specs/custom-microsite.md); summary:
- [ ] Full-bleed region spans the viewport (no 1248 cap); intro copy stays in its centered `~856px` column.
- [ ] Gallery tiles `≈16:9`, lazy-load, open the lightbox scoped to this page's set.
- [ ] Composes from `siteorigin-body` + `gallery` + `card-teaser` (no bespoke CSS).
- [ ] A11y gate inherited from `gallery-lightbox.md` §6 (dialog, focus trap, Escape, arrows, alts).
- [ ] Visual diff vs source at 1280/768/mobile ≤ 2% per-pixel (excluding image content), for any migrated page.

## Dependencies
- Upstream: SKODA-203 (gallery), SKODA-813 (generic Page base / full-width shell), SKODA-814 (SiteOrigin body flatten), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Migrate / fold / drop decision (🔴 blocking scope):** 201 mostly-dated campaign pages, needs a client call + cutoff date before build. Estimate assumes the "fold into generic Page + drop expired" path; a bespoke template would be larger.
- **Gallery volume (🟡):** 264 tiles on one page, lazy-load + performance budget matter.
- `featured-image` micro-posts (~30 pages, recount §2) are a related minor long-tail, fold into the same decision.
