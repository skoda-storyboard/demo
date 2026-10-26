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

## M2 readiness review (2026-10-15)
- **Volume (EN):** 201 `template-custom-full-width` pages. About 111 are event-gallery pages: day pages have 60+ colorbox images (e.g. Classic Days 2025, day one: 63). About 36 are legacy press kits authored as pages; some 302 to `/en/press-kits/…`. About 54 are other: campaign pages with Czech slugs, several with ~4 words, plus Company Logo (→ 810).
- Event-gallery hubs also sit on `template-tiles` (~23) and `page-template-default` (~17). The migrate / fold / drop decision should cover all three.
- Census: [coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2.

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [M2 integration gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, finding G-E-01
(High, confirmed).

**Added scope**
- Moved to SKODA-210a.
- The "archive expired campaigns" default does not hold for event galleries. The newest hub (Epiq Covered Drive,
  9 day pages) is dated Jan–Mar 2026, so these are current photo services for journalists (G-E-01).
- Volume: the M2 readiness note above already lists the three templates (201 `template-custom-full-width`,
  ~23 `template-tiles`, ~17 `page-template-default`). The total is about 240 pages, not the ~150 in Q-5. Q-5
  in the decision register needs the same correction (outside this ticket) (G-E-01).
- Client question: "Event galleries from media drives (latest Epiq Covered Drive, 2026) offer per-photo downloads
  to journalists. Are they a service that must keep working at go-live, and from which event date?" (G-E-01).

**Added acceptance criteria**
- Moved to SKODA-210a.
- [ ] The migrate / fold / drop decision and its event-date cutoff cover all ~240 pages across the 3 templates
      (G-E-01).

**Estimate**
- Estimate after the split: 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*, as today:
  scope decision, full-bleed shell, campaign pages and plain galleries. G-E-01's 2–3 SP (media-card tiles + cart
  wiring) is in [SKODA-210a](SKODA-210a.md) (2–3 SP; depends on 210, 406, 505). The image ingestion itself stays in
  517/520.
