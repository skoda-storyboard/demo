# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

**New to this repo?** Start at [`ONBOARDING.md`](ONBOARDING.md) → [`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md) → [`docs/architecture/IMPORT-PIPELINE.md`](docs/architecture/IMPORT-PIPELINE.md).

**Operating model (durable, reread on every execution cycle + after any context compaction/reset):** the migration runs as an Architect → Developer → QA team loop defined in [`AGENTS-TEAM.md`](AGENTS-TEAM.md). Do not rely on conversation history for the team structure, parallelism/collision rules, QA/visual-fidelity requirements, or the convergence/termination conditions, reread `AGENTS-TEAM.md` before continuing work. It defines *how the team operates*; project knowledge stays under `docs/*` and the ticket backlog under `docs/tickets/`.

## Avoid
- `scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/scripts/`.

## CSS Guidelines

For any frontend CSS, styling, responsive-layout, or UI-component work:

- Read and follow [`docs/guardrails/css-guidelines.md`](docs/guardrails/css-guidelines.md). Treat it as a mandatory engineering constraint. A strict `.stylelintrc.json` encodes it; check with `npm run lint:css`. (Pre-commit enforcement via husky is staged but intentionally off until demo's boilerplate CSS conforms, see `.husky/pre-commit`.)
- Prefer fluid CSS, intrinsic layout, and container queries before viewport breakpoints.
- Use the three-layer CSS architecture, in order: (1) fluid, (2) intrinsic/adaptive, (3) breakpoint/behavioral.
- Use CSS variables/design tokens for reusable dimensions, spacing, typography, and colors. Don't add a breakpoint without a concrete layout/behavior reason.
- Keep global CSS to genuinely global concerns; keep component-specific CSS with the component.
- Perform the guardrail self-check before returning CSS changes.

## Outdated
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.

## Analysis & planning (read before scoping/estimating)
`docs/` is organized into topic subfolders (see `docs/README.md`): `analysis/` (findings + block/widget data), `architecture/`, `media/`, `planning/` (technical data models + requirement mapping), `reviews/`, `archive/` (superseded, kept as reference), plus `tickets/` and `ui-specs/`.
- `docs/analysis/SKODA-MASTER.md` is the canonical findings doc; its §16 map indexes every source report, and it carries the confirmed scope + milestones (M1 demo 15 Oct 2026 / M2 go-live 02 Jan 2027).
- `docs/planning/SKODA-CLIENT-REQUIREMENTS-MAPPING.md`, requirement IDs → build status → tickets; `docs/planning/SKODA-REQUIREMENTS-TRACEABILITY.md`, the bidirectional requirement↔ticket matrix + gap register.
- `docs/planning/SKODA-METADATA-SCHEMA.md`, `-BLOCK-DATA-MODEL.md`, `-TEMPLATE-CONTENT-MODELS.md`, `-RAIL-FEED-MAP.md`, the demo migration data model (index contract, reuse-vs-new blocks, per-template DA shapes, rail sizing).
- `docs/planning/SKODA-AGENT-HANDOFF-CANDIDATES.md`, parts fit for autonomous-agent handoff.
- `docs/tickets/OVERVIEW.md`, the ticket backlog (epics + SKODA-* tickets).
- `docs/ui-specs/`, measured component + template spec library (live-DevTools DOM/CSS at 768/992/1080); `_TEMPLATES.md` maps every source page type to its blocks + ticket.

## Remember
- `npx -y @adobe/aem-cli up`: local code, previewed content.
- Merging `main` ships code; content publishes separately.
- A PR without a `{branch}--demo--skoda-storyboard.aem.page/{path}` link is rejected.
- All committed files are served. Use `.hlxignore`.
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).
