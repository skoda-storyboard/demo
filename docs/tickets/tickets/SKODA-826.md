# SKODA-826, Global page gutter parity (10px at every width, not 24/40px)
- **Epic:** E01, Foundation & Setup (follow-up to SKODA-106, which is closed)
- **Type:** global CSS token fix
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** — (drafted on disk 2026-09-25; create at sign-off)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO, **draft**

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

## Dependencies
106 (closed; this is the token follow-up). It must land before 704 visual sign-off, because otherwise every 375 diff
fails.
