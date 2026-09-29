# SKODA-826, Global page gutter parity (10px at every width, not 24/40px)
- **Epic:** E01, Foundation & Setup (follow-up to SKODA-106, which is closed)
- **Type:** global CSS token fix
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** [#149](https://github.com/skoda-storyboard/demo/issues/149)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 In review. Implemented on `skoda-826-gutter`, ready for QA (see Implementation notes).

## Origin
In the 2026-09-25 DevTools URL→block sweep
([`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §5), every group reported the same
375px delta on almost every block: source **355px**, EDS **327px** (hero, tags, cards, rails, press-release title,
Media Box, in-body slider…). The Architect re-measured it with computed styles on 2026-09-25:

| Page @375 | Source | EDS main |
|---|---|---|
| Epiq story, body `p` | left 10 / width 355. The chain is `.container` pl 10 → `.panel-layout` ml −10 → `.panel-grid-cell` pl 10 | left 24 / width 327, from `.default-content-wrapper` pl 24 (`--spacing-l`) |
| Klaus press release, body `p` | left 10 / width 355 (`.container` → `.columns` → `.column-primary`) | left 24 / width 327 |
| Both @768 / @992 | content left edge 10 | 24 / 40 |
| Both @1280 | container 1248 centred (ml 16) + 10 → content left edge 26, inner width 1228 | same 1248 cap, but 40 padding → edge 40–56, inner 1168 |

The source uses a constant Bootstrap 10px gutter (`.container` pl 10 + `.row` −10 + col 10) at **every** width, up
to the 1248px container. EDS uses `main > .section > div { padding: 0 var(--spacing-l) }` (24px) below 992 and
`var(--spacing-xl)` (40px) from 992 up. So content is 28px narrower on phones and 60px narrower on desktop. Each
per-block width delta in the sweep is really this one global cause: for example the story hero at 1280 is
1168 on EDS vs 1228 on the source.

## Scope
- `styles/styles.css`: introduce a `--page-gutter: 10px` token and use it on `main > .section > div` at every width.
  - Drop the 992 step-up to `--spacing-xl`.
  - Keep `--content-max-width: 1248px`, which already matches the source container.
  - Follow `docs/guardrails/css-guidelines.md`: this removes a breakpoint and adds none.
- Re-check the full-bleed bands that the source draws edge to edge at 375: rails, the Media Box dark band, the Related
  Stories band and the hero image. They must not inherit the gutter.
- Owner surface: global `styles/*`. This lands **after** the 213/217/218 styles WIP merges (review §10 collision
  rule), and the story CSS from 817/821 rebases onto it.

## Acceptance Criteria
- [ ] At 375, body text, headings, tags, cards and the press-release title start at x=10 and are 355px wide on the
      Epiq story, the Klaus press release, home and one model page (DevTools, computed box).
- [ ] At 768 / 992 / 1280, the content left edge is 10 / 10 / 26 and the inner width at 1280 is 1228. Blocks that
      set their own inner padding are re-checked with the sweep `measure.mjs` pair diff (no new deltas).
- [ ] `npm run lint:css` is clean, and the guardrail self-check is noted in the PR.
- [ ] Preview link: `https://skoda-826-gutter--demo--skoda-storyboard.aem.page/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`

## Recheck after the gutter change (from the SKODA-217 review, [PR #188](https://github.com/skoda-storyboard/demo/pull/188))
- **Social media cards at 500px:** EDS 452×361.6 at x24 (band 1321px) vs live 460×368 at x20 (band 1340.5px): the
  section's 24px side padding against live's narrower inset. Don't count SKODA-217's 500px check as passed until this
  lands; re-measure the cards and band then.
- **The 1 → 3 column switch** of `Cards (social)` is a 592px container query: 640px viewport − 2 × 24px section
  padding (`blocks/cards/cards.css`). When the gutter changes, retune it to 640 − 2 × the new gutter and recheck
  639 (1 column) / 640 (3 columns). Measured 2026-09-28: 1 column at 639, 3 at 640 on live and EDS; cards 184 vs
  186.7px wide at 640.

## Implementation notes (2026-09-29, branch `skoda-826-gutter`)
- **Re-measured before the change (main):** the story body, the press release and the series hub already sat at
  10/26 (their own template insets, from SKODA-801/607/207). Still on the old 24/40 gutter: home, model pages, the
  Images/Videos listings, press kits, archives and the story hero. The live site measures 10/355, 10/748, 10/972 and
  26/1228 at 375/768/992/1280 on every template.
- **Change:**
  - `--page-gutter: 10px` on `main > .section > div` at every width; the 992 step-up is removed (one breakpoint
    fewer, none added).
  - The wrapper is now `box-sizing: border-box`. Without it the 1248 cap applied to the content and 1280 gave
    16/1248 instead of 26/1228.
  - `--story-inset` and `--pr-gutter` now derive from `--page-gutter`; their values are unchanged.
  - `.promo-box`'s bleed uses `--page-gutter` (its own 992 step-up is removed).
- **After (local, 8 templates × 375/768/992/1280/1440):** 10/355, 10/748, 10/972, 26/1228 and 106/1228 everywhere;
  no horizontal overflow.
  - Regression pair diff against main: press release and series hub identical; story changes only its hero
    (→ 10/355 and 26/1228). Home, model and listing blocks move to the new edge only.
  - Full-bleed parts are unchanged: the story Related Stories rail (0/375), the promo box (375 at 375, 1248 at
    1280) and the Media Box band (section 0/375, dark).
- **Recheck results (below):**
  - `Cards (social)` container query retuned 592 → **620** (640 − 2 × 10): 1 column at 639, 3 at 640, as live.
  - The social grid also gets the live 10px slot insets (`--social-card-inset`, grid max 720), so the card sizes
    match live exactly: 335/460/599/186.7/220 at 375/500/639/640/1280, with equal card and band heights. This
    closes the SKODA-217 500px open item.
- **Follow-ups:**
  - SKODA-308 (header topbar) and SKODA-821 (story body at 1440) rebase onto `--page-gutter`.
  - Open PR #192 copies the old 24/40 section padding into `--news-rail-gutter`. Retune it to `--page-gutter`
    before or after merge.
  - Hero geometry beyond the wrapper edge stays with SKODA-828.

## Dependencies
106 (closed; this is the token follow-up). It must land before 704 visual sign-off, because otherwise every 375 diff
fails.

**Related tickets from the parallel sweep (88c1b48): neighbours, not duplicates.**
- [SKODA-308](SKODA-308.md) fixes the **header topbar** inline padding (10 vs 24). That is header CSS only.
- [SKODA-821](SKODA-821.md) fixes the 34px extra inset of story **body text** inside `.body-column` at 1440.
- 826 is the underlying **section** gutter token. Land it first; 308 and 821 then rebase their values onto it, so
  none of the three double-counts the correction.
