# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

**New to this repo?** Start at [`ONBOARDING.md`](ONBOARDING.md) → [`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md) → [`docs/architecture/IMPORT-PIPELINE.md`](docs/architecture/IMPORT-PIPELINE.md).

**Operating model (durable, reread on every execution cycle + after any context compaction/reset):** the migration runs as an Architect → Developer → QA team loop defined in [`AGENTS-TEAM.md`](AGENTS-TEAM.md). Do not rely on conversation history for the team structure, parallelism/collision rules, QA/visual-fidelity requirements, or the convergence/termination conditions, reread `AGENTS-TEAM.md` before continuing work. It defines *how the team operates*; project knowledge stays under `docs/*` and the ticket backlog under `docs/tickets/`.

## Chrome DevTools MCP isolation

- Before browser work in parallel, give each agent its **own Chrome DevTools MCP server process** configured with `--isolated` (for example, MCP args `["-y", "chrome-devtools-mcp@latest", "--isolated"]`). This gives each process a temporary Chrome profile; the default profile is shared and can be locked by another browser.
- A new tab, `select_page`, or page-ID routing in a **shared** server is not browser isolation. Do not use `--autoConnect`, a shared `--browser-url`, or the same `--userDataDir` across agents. If a persistent login is required, assign a distinct `--userDataDir` and server process per agent instead of `--isolated`.
- If the client cannot provide separate MCP processes, do not claim isolated concurrent access: serialize use of the shared server or use independently provisioned browser automation. Never close, reset, or reconfigure another agent's server, browser, profile, or tabs; clean up only your own session.

See the [Chrome DevTools MCP advanced usage guide](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/advanced-usage.md) and [configuration reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/configuration.md).

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

## Code review (mandatory for every PR review)

Any agent reviewing a PR must, before giving a verdict:

1. **Read the ticket.** Open the `SKODA-*` ticket(s) the PR addresses under `docs/tickets/` and review against its scope + acceptance criteria, not just the diff.
2. **Read the supporting docs under `docs/`** for that ticket: the relevant `docs/ui-specs/` spec (via `_TEMPLATES.md`), `docs/planning/` data models/requirement mapping, `docs/analysis/SKODA-MASTER.md` sections, and `docs/guardrails/css-guidelines.md` for CSS changes.
3. **UI-affecting PRs: measure against origin with Chrome DevTools MCP.** Load the origin (live source) page and the PR's `{branch}--demo--skoda-storyboard.aem.page/{path}` preview, and compare **measured** values (computed styles, box geometry, typography, spacing, colors, DOM structure) at the spec's viewport bands (768/992/1080 plus mobile). **No screenshots**: evidence is measured numbers, not images. Follow the MCP isolation rules above.
4. Report deviations as origin-vs-PR values with the selector and viewport; a UI review without measurements is incomplete.

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
- Migrated PDFs/MP4s get rows in `tools/importer/media/media-manifest.json` (`kind: document|video`), like images; commit it with the import. The DAM ingest runs on a developer machine, not here (`tools/importer/media/README.md`, "PDF/MP4 links").
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).
