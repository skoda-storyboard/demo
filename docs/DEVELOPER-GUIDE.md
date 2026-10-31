# Škoda Storyboard, Developer Guide

*Practical onboarding for developers taking over the Škoda Storyboard AEM Edge Delivery Services build. Grounded in the actual repo (verified 2026-09-14). For the migration/analysis context behind *why* things are built this way, see [`analysis/SKODA-MASTER.md`](analysis/SKODA-MASTER.md); for the reusable content-import machinery, see [`architecture/IMPORT-PIPELINE.md`](architecture/IMPORT-PIPELINE.md).*

---

## 1. Quick reference

| Resource | Value |
|----------|-------|
| Code repository | `github.com/skoda-storyboard/demo` |
| Content source | Document Authoring (DA / Experience Workspace), content publishes separately from code |
| Preview | `https://main--demo--skoda-storyboard.aem.page/` |
| Live | `https://main--demo--skoda-storyboard.aem.live/` |
| Feature-branch preview | `https://{branch}--demo--skoda-storyboard.aem.page/{path}` |
| Local dev | `http://localhost:3000` (`npx -y @adobe/aem-cli up`) |
| Live demo slice | `/en/` (homepage + 48 story pages) |

> The primary working locale is **`/en/`**, the built + published test-migration slice. Everything below is EN-first.

---

## 2. Architecture in one screen

- **Vanilla JS (ES6) + CSS, no build step.** Files are served as-is. `devDependencies` only (linting); there is nothing to compile.
- **Content comes from the backend** (DA), decorated client-side by block JS. Always inspect real markup first: `curl http://localhost:3000/en/index.plain.html`.
- **`scripts/aem.js` is vendored, never edit it.** It's the EDS core library (`buildBlock`, `loadBlock`, `decorateSections`, `loadHeader/Footer`, `createOptimizedPicture`, …). Customization lives in `scripts/scripts.js` and the blocks.
- **Three-phase loading (Eager → Lazy → Delayed)** keeps Lighthouse high. Put render-critical work eager, everything else later.
- **Dynamic content is query-index-driven**, not hand-authored, several homepage blocks read a published `/en/query-index.json` and populate themselves (see §5).

### Project structure
```
blocks/              15 blocks (see §4)
scripts/
  aem.js             EDS core library — DO NOT EDIT (vendored)
  scripts.js         entry point: E-L-D orchestration + custom autoblocks
  query-index.js     shared memoized query-index loader (5 fetches → 1)
  ffetch.js          streaming fetch helper for the index
  optimized-picture.js  in-place image optimization (keeps layout-editability)
  consent-check.js   dummy CMP — consent declined by default
  consented.js       loads consented (analytics/martech) scripts when granted
styles/
  brand.css          Škoda design tokens (colors, type, spacing) — START HERE for CSS
  styles.css         global/layout styles
  fonts.css          @font-face (SKODA Next), loaded lazily
  lazy-styles.css    non-critical global styles
templates/           page templates with their own layout code (see below)
  press-release/     press-release.{js,css} (SKODA-607)
tools/importer/      content-import pipeline (see architecture/IMPORT-PIPELINE.md)
docs/                analysis + planning docs (see docs/README.md)
```

### Page templates (`templates/<name>/`)
A page type whose layout differs enough from the global one gets its own folder: `templates/<name>/<name>.js`
(default export `decorate(main)`) and `<name>.css` (scoped to `body.<name>`). It is selected by the `template`
metadata (`press_release` → `press-release`, the same `toClassName` as the body class) and must be listed in the
`TEMPLATES` allow-list in `scripts/scripts.js`, so an unknown value never requests a missing file. Loading order:
`decorateMain` applies the Section Metadata `Style` classes for template pages (`decorateTemplateSections`), then
`loadEager` awaits the template CSS + JS and runs `decorate(main)` **before** the first section is shown, so the
layout never shifts. Templates style page layout and default content only; block visuals stay in the blocks.
`npm run lint:css` covers `templates/**/*.css`. Today: `press-release` (SKODA-607). The story layout still lives in
`styles/styles.css` (candidate to move once 817/820/821 settle).

> **Note:** there is **no `scripts/delayed.js` and no `scripts/utils.js`** in this repo. The delayed phase calls `loadDelayed()` in `scripts.js` but no separate delayed module is loaded today; consent/analytics is handled via `consent-check.js` + `consented.js`.

---

## 3. The E-L-D loading phases (in *this* repo)

`scripts/scripts.js` orchestrates the standard three phases:

| Phase | Function | What runs | Rule |
|-------|----------|-----------|------|
| **Eager** | `loadEager(doc)` | `decorateMain(main)` (autoblocks, buttons, icons, sections, section-metadata), first section, `waitForFirstImage` | Keep minimal, this blocks LCP |
| **Lazy** | `loadLazy(doc)` | remaining sections, `loadHeader`/`loadFooter`, `fonts.css`, `lazy-styles.css` | Non-critical UI goes here |
| **Delayed** | `loadDelayed()` | (hook present; consented scripts load via `consented.js` on consent) | Third-party/analytics only, never render-critical |

**Project-specific decoration** added in `decorateMain` / `buildAutoBlocks`:
- **Fragment autoblock**, links to `*/fragments/*` are auto-wrapped into the `fragment` block (`blocks/fragment/fragment.js` is the *only* sanctioned cross-block import).
- **Widget autoblock** (`buildWidgetAutoBlocks`), links to `*/widgets/*` become the `widget` block.
- **`decorateSectionMetadata`**, applies section styling from a `Section Metadata` block (the marker-`<hr>` + metadata pattern the importer emits; see §5 and the import pipeline doc).

---

## 4. Block catalogue (15 blocks)

Commit history separates **customized** blocks from untouched boilerplate. The workhorses are the cards family, carousel, and the two index-driven blocks.

| Block | Status | Purpose |
|-------|--------|---------|
| **`cards-overlay`** | custom (10 commits) | Card grid with text overlaid on the image (featured/promo + latest-articles). The canonical card style other blocks reuse. |
| **`stories`** | custom (8 commits) | **Index-driven.** Reads the query-index, keeps story pages, sorts by `publisheddate` desc, renders `latest` (2+3 grid + Load-more) or `promo` (1 big + 2 small; mobile = timed carousel) variants. Reuses `cards-overlay` markup/CSS. |
| **`cards-media`** | custom (7 commits) | Card with image above text (media style); includes the static social variant. |
| **`header`** | custom (5 commits) | Header/topbar/mega-menu chrome; `nav` fragment-driven. |
| **`cards-toolbar`** | custom (4 commits) | Card variant with a toolbar (media-cart/actions affordance). |
| **`carousel`** | custom (4 commits) | Horizontal drag/arrow/scroll-snap carousel; overlay + caption variants; reused by `story-rail` via `buildBlock`. |
| **`story-rail`** | custom (3 commits) | **Index-driven.** Tag-filtered teaser rail (eMobility/Lifestyle/Škoda World/Latest News), reads the index, filters by `category`, builds a `carousel` internally via `buildBlock`+`loadBlock`. |
| **`cards`** | custom (2 commits) | Base cards block. |
| **`footer`** | custom (2 commits) | Footer chrome (Storyboard variant); `footer` fragment-driven. *(A distinct Media Room footer is net-new scope, see mapping doc COM18 / ticket SKODA-304.)* |
| **`columns`, `hero`, `hero-image`, `fragment`, `newsletter-stub`, `widget`** | boilerplate / light (1 commit each) | `hero-image` = LCP hero; `fragment` = cross-block include (only sanctioned import); `newsletter-stub` = UI-only newsletter (no ESP, demo scope); `widget` = autoblocked `/widgets/*` embeds. |

**When adding/editing a block:** scope all CSS to `.blockname` (the `-wrapper`/`-container` classes are section-level, owned by the framework). Authors omit and add cells freely, **decorate defensively** (don't assume a cell exists).

---

## 5. The query-index pattern (the thing to understand first)

The homepage's "Latest Stories" and the four category rails are **not hand-authored**, they mirror the source site's search-result components. They populate at runtime from a published index:

1. **`scripts/query-index.js`**, a shared, memoized loader. The homepage renders ~5 index-driven blocks; without sharing, each would fetch `/en/query-index.json` independently. This module fetches each index URL **at most once** and hands every caller the same promise (5 fetches → 1). Returned rows are **shared read-only**, filter/slice into your own array, never mutate in place.
2. **`stories`** reads the index → keeps story pages → sorts by `publisheddate` desc → renders cards.
3. **`story-rail`** reads the index → filters by `category` tag → builds a `carousel` via `buildBlock`.
4. **Signals:** `category` is derived from the URL folder; `publisheddate` has a fallback chain. These are emitted as page metadata by the import pipeline.

> **Critical gotcha:** the query-index **only sees *published* pages.** Uploading/previewing a page is not enough, a block will render empty until the page is published and the index rebuilt. See §7.

---

## 6. Design system

Tokens live in **`styles/brand.css`** (not `styles.css`), start there for any visual change.

**Colors:** `--skoda-green` `#0e3a2f` (dark sections/theme), `--skoda-green-emerald` `#78faae` (accent), `--skoda-ink` `#161718` (text), grey ramp `--skoda-grey-100/200/border`.

**Type:** `SKODA Next` (`--body-font-family`/`--heading-font-family`); body 16/14/13px; headings xxl 44 → xs 16px; weights 400/500/600/700.

**Spacing:** `--spacing-xs..xxl` (8→64px); `--section-padding` 40px; `--content-max-width` 1248px; `--nav-height` 108px (44 topbar + 64 nav).

**Cards:** `--card-radius` 8px, `--card-shadow`, `--card-border`.

`fonts.css` (SKODA Next `@font-face`) loads **lazily**, never eagerly (render-blocking). Section styles (e.g. dark) are applied via the `Section Metadata` mechanism, not ad-hoc classes.

For the CSS layering model, breakpoint ladder, naming convention, and lint-enforced guardrails (especially relevant since most block CSS is now AI-authored), see [`docs/guardrails/css-guidelines.md`](guardrails/css-guidelines.md).

---

## 7. Critical gotchas (read before you touch anything)

1. **Never edit `scripts/aem.js`**, it's vendored core. Extend via `scripts.js` / blocks.
2. **Index only sees published pages.** Upload → preview → **publish** → reindex, in that order, or index-driven blocks render empty. Merging `main` ships *code*; content publishes *separately*.
3. **Media pre-conditioning:** source masters of 20–40 MB will 409 the content bus on publish. Images must be pre-conditioned (sized derivatives) before publish. Don't strip the `-WxH` suffix on demo images.
4. **Layout-editability constraint:** `scripts/optimized-picture.js` optimizes images **in place** so featured/carousel/social images stay editable in DA Layout mode. Recreating a node (e.g. `createOptimizedPicture` + `replaceWith`) makes it uneditable, index-driven blocks are inherently not layout-editable (their editable surface is the config rows in Content mode).
5. **`buildAutoBlocks` rewrites content before your block runs**, account for fragment/widget autoblocking.
6. **Markup comes from the backend**, `curl localhost:3000/x.plain.html` before writing a parser or decorator; don't guess selectors.
7. **All committed files are served**, use `.hlxignore` (it excludes `*.md`, dotfiles, test/, etc.).
8. **DA page uploads need a `<body><main>` wrapper**, a bare `.plain.html` POST to the DA source stores empty. (Library/fragment docs must NOT be wrapped.)

---

## 8. Local development

```bash
# One-time
npm install                       # devDependencies only (lint tooling)

# Run against local code + previewed content
npx -y @adobe/aem-cli up          # serves http://localhost:3000, auto-reloads

# Lint before every PR
npm run lint                      # eslint + stylelint
npm run lint:fix                  # auto-fix
```

- No Node version is pinned (`package.json` has no `engines`; no `.nvmrc`), a current LTS is fine.
- `aem up` serves **local code** against **previewed content**, so you see your JS/CSS changes against real DA content.

---

## 9. Git & PR workflow

- Branch off `main` (`feature/…`, `fix/…`; keep short, branch name is in the preview URL).
- **A PR without a `{branch}--demo--skoda-storyboard.aem.page/{path}` preview link is rejected.** Always include the preview link for the changed page.
- `npm run lint` must pass.
- **Merging `main` ships code only**, content is published separately via DA (see the import pipeline doc). A code merge does not publish content, and vice-versa.

### Parallel local PR reviews (macOS)

The standard-library Python launcher opens one **new Terminal.app window per PR**,
with a named Copilot CLI session, detached worktree pinned to the PR head, and its
own Chrome DevTools MCP process using `--isolated`.
Each newly prepared review session explicitly selects **GPT-6.1 Sol**
(`--model gpt-6.1-sol`) with **high reasoning** (`--reasoning-effort high`),
overriding saved/default model preferences without changing global configuration.
The launcher does not substitute another model if access is unavailable; resolve
any Copilot account or organization-policy error before reviewing.

Requirements: Python 3.9+, Git, authenticated `gh` and Copilot CLI, Node/npm (`npx`),
and Google Chrome. Run `copilot login` / `gh auth login` first if needed. The CLI
must support `--additional-mcp-config`, `--enable-mcp-server`, `--allow-tool`,
`--deny-tool`, `--allow-url`, `--model`, `--reasoning-effort` and
`copilot mcp list --json` (verified with 1.0.105).
No pip packages are needed.

```bash
# Replace the example URLs with open PRs from this repository.
# First inspect the plan: reads GitHub/MCP metadata, but creates nothing.
python3 tools/pr-review/review_prs.py --dry-run \
  https://github.com/skoda-storyboard/demo/pull/123 \
  https://github.com/skoda-storyboard/demo/pull/124

# Then create worktrees and open one window per PR.
python3 tools/pr-review/review_prs.py \
  https://github.com/skoda-storyboard/demo/pull/123 \
  https://github.com/skoda-storyboard/demo/pull/124

# Launcher tests (no GitHub requests, Chrome or Terminal windows).
python3 -B -m unittest discover -s tools/pr-review -p 'test_*.py'
```

Move each Terminal window to the desired screen. The launcher does not rearrange
your displays. URLs may include `/files`, `/commits`, `/checks`, query strings or
fragments. Duplicate URLs, closed PRs and PRs from another repository are rejected.
Use `--repo /path/to/checkout` when invoking it from elsewhere.

Every invocation creates a fresh directory under `../demo-reviews/` by default;
`--output-dir` changes the parent, which must be outside the checkout. Each PR
directory contains `worktree/`, `evidence/`, `prompt.txt`, `session.json`,
`status.json` and `launch.command`. Supporting screenshots and test downloads go
in `evidence/`; no `review.md` or other local review report is requested.
Failed/partial runs are retained and their location is printed.
No source changes or uncommitted files are copied into the review checkouts.
Both head and actual base commits are fetched by SHA; neither `main` nor
`FETCH_HEAD` is assumed. The launcher rechecks both SHAs before opening windows,
and the review prompt requires another check before the verdict.

Global MCP settings are **not modified**. Each session gets an ephemeral Chrome
configuration; `npx` downloads the MCP package on first use if necessary. Other
configured MCP servers are disabled for that session to prevent accidental shared
browser use, while the built-in GitHub MCP is enabled. The browser starts on first
tool use, not merely when Terminal opens. The launcher checks CLI process startup;
the review's initial browser tool call checks actual MCP/browser readiness.
Organization MCP policies still apply.

One-time macOS Automation permission (your launching app controlling Terminal),
Copilot login, folder trust and tool approvals may need confirmation. Check
`/permissions` is **manual** and `/ide` is not connected to the other PR's workspace.
Existing saved approvals/settings are not reset: this is not a read-only sandbox.
The launcher adds a per-session **allowlist**, not allow-all or AI-assisted approval:

- Selected Git reads (`status`, `diff`, `show`, `log`, `rev-parse`, `ls-files`,
  `ls-tree`, `grep`, `merge-base`) and GitHub CLI reads (`pr view/diff/checks`,
  `issue view`, `run view`, `repo view`) are pre-approved.
- Selected Chrome tools for navigation, viewport changes, CSS/DOM inspection,
  screenshots, hover/click/key/fill interactions and console/network inspection
  are pre-approved for the isolated review server only.
- Named GitHub MCP read tools are pre-approved; GitHub writes are not.
- Native file-writing tools and common Git mutations are explicitly denied.
  Supporting screenshots/downloads still use the external evidence directory;
  native write denials do not constrain MCP or shell filesystem access.
- Arbitrary `evaluate_script` JavaScript, uploads, unknown commands/tools, package
  scripts and GitHub writes remain approval-gated. Unfamiliar actions may still
  prompt even when harmless: a strict allowlist cannot identify every safe action.
  There is no blanket approval for `gh api`, `curl`, shells, interpreters or servers.
- Only GitHub/API HTTPS URLs are pre-approved by this policy. Other URL/path,
  folder-trust and organization-policy confirmations may still appear.

The runner disables inherited allow-all and assisted-approval environment flags,
but does not clear persisted approvals or change global settings. Keep permission
mode manual; if your saved default is assisted/allow-all, change it to manual
before reviewing. On resumed sessions, inspect their saved approvals as well.
CLI command rules match command stems, not all argument semantics; Chrome clicks
can affect remote state. The prompt limits routine browser actions to PR
origin/preview testing, requires confirmation for sensitive interactions, and
forbids accessing secrets or unrelated systems. These rules are not OS sandboxing,
network isolation or a guarantee that only dangerous actions will prompt. Use a
container/VM and least-privilege credentials for untrusted PR execution.

Do not use allow-all mode for untrusted PRs. Review sessions must not fix findings
or create, edit, delete or rename codebase files (including tests, configuration,
lockfiles and generated files). Auto-fix tools, formatters, code generators,
project dependency installation and Git-changing operations are prohibited.
Only checks that leave the codebase unchanged are allowed; inspect package scripts
and obtain approval before running them. Checks needing missing dependencies or
codebase changes remain blocked. Implementation belongs in a separate task;
permission to post feedback never authorizes a code change in a review session.
Publishing and GitHub writes still require approval. Environment-only tokens
are not copied into launcher files or new Terminal windows; use stored
logins. `COPILOT_HOME`, when set, is preserved without copying its contents.

Review findings appear in the terminal, ordered by P0/P1/P2/P3 priority, with
file/line, impact, reproduction and evidence. Before posting, the agent must show
the exact proposed text, destination and action, and obtain explicit permission
for that PR. Declining or not granting permission leaves the findings on screen
without a GitHub write. Repository-required defect filing still needs permission.
With no issues, the agent recommends whether approval is appropriate; blocked,
pending or unverified checks mean "not ready to approve," not a clean pass.
Approvals are never submitted automatically and also require explicit permission.
Before a permitted post, the agent rechecks commits and existing GitHub feedback
to avoid stale or duplicate posts. Changed commits require reassessment and fresh
permission. These are agent instructions, not a technical GitHub write restriction.
Copilot's normal conversation history may still persist terminal review output;
this change does not disable CLI history or delete existing reports.

The launcher uses deployed preview URLs from the PR/ticket, rather than starting
local servers or publishing content. Missing previews (especially fork PRs) remain
a review blocker. If a local server is needed, assign a distinct port per worktree.
Coordinate overlapping fixes/merges, shared DA state and GitHub writes; worktrees
still share Git refs/configuration and account limits.
Follow the QA gates in [`../AGENTS.md`](../AGENTS.md), with the user-requested
exception that reviews do **not** run local Lighthouse/PSI audits. AEM PSI already
runs on GitHub for each PR. The prompt directs the agent to inspect those check
results and linked reports for the pinned PR head SHA and show their status and
URLs on screen. Pending, failed, missing, skipped, cancelled, inaccessible or stale results
remain unverified/blocked, never a pass or a reason to run a local audit.
Only report accessibility coverage actually present in CI; retain browser
measurements, real interactions, heading outlines and other QA checks.
These prompt and model-selection changes apply to newly prepared sessions;
existing sessions retain their saved prompts/launch arguments until relaunched
with a fresh launcher invocation.

On a failed launch, inspect `status.json` and the Terminal window before retrying.
`launch.command` resumes that prepared review's UUID session and reissues its review
prompt; it refuses a second concurrent process for the same prepared review.
Alternatively use `copilot --resume SESSION_UUID` from the recorded worktree, with
the MCP flags recorded in `session.json`, only after the previous process has stopped.
The launcher prints session names and non-forced `git worktree remove` commands.
Stop the review and any servers it owns before removing its worktree; preserve the
evidence you need. Do not force-remove dirty worktrees or kill unrelated browsers.

---

## 10. Common tasks

**Add a block:** create `blocks/{name}/{name}.js` (`export default function decorate(block)`) + `blocks/{name}/{name}.css` (scope to `.{name}`). Decorate defensively. Test at `localhost:3000`.

**Change global look:** edit tokens in `styles/brand.css`; verify across pages; watch CLS.

**Add analytics/martech:** wire it through `consented.js` (consent-gated), never eager, never in `scripts.js`.

**Add index-driven content:** author the pages, publish them, confirm the index rebuilt, then the `stories`/`story-rail` blocks pick them up. Reuse `scripts/query-index.js` (don't add a second index fetch).

**Import pages from the source site:** use the pipeline in `tools/importer/`, see [`architecture/IMPORT-PIPELINE.md`](architecture/IMPORT-PIPELINE.md). Never hand-write HTML into content.

---

## 11. Troubleshooting

| Symptom | Check |
|---------|-------|
| Index-driven block renders empty | Are the pages **published** (not just previewed)? Did the index rebuild? |
| Publish fails / 409 | Oversized master image, pre-condition (§7.3) |
| Block doesn't decorate | Folder name matches block class? `export default decorate`? Real markup matches (`curl …plain.html`)? |
| Image not editable in DA Layout mode | A block recreated the `<img>` node instead of optimizing in place (§7.4) |
| Styles leak across blocks | CSS not scoped to `.blockname` (you styled `-wrapper`/`-container`) |
| Fragment/widget not building | `buildAutoBlocks` runs before blocks, confirm the `/fragments/` or `/widgets/` link form |

---

## 12. Where to go next

| Need | Doc |
|------|-----|
| Why it's built this way (source-site analysis, canonical findings) | [`analysis/SKODA-MASTER.md`](analysis/SKODA-MASTER.md) (§16 indexes every source report) |
| Content-import machinery (parsers/transformers/DA push) | [`architecture/IMPORT-PIPELINE.md`](architecture/IMPORT-PIPELINE.md) |
| Target architecture, build specs | [`architecture/`](architecture/) |
| Milestones, scope, decision log (D1–D19) | [`planning/SKODA-DELIVERY-PLAN.md`](planning/SKODA-DELIVERY-PLAN.md) |
| Backlog (epics + SKODA-* tickets) | [`tickets/OVERVIEW.md`](tickets/OVERVIEW.md) |
| The rules that override defaults | [`../AGENTS.md`](../AGENTS.md) |
| EDS platform docs | https://www.aem.live/docs/ |

*Onboarding entry point: [`../ONBOARDING.md`](../ONBOARDING.md).*
