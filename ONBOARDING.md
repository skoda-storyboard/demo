# Onboarding, Škoda Storyboard (AEM Edge Delivery)

**Start here.** This is the guided path for a developer joining the Škoda Storyboard EDS build. It stitches together the docs in the right reading order and front-loads the things that bite newcomers.

> The live slice is **`/en/`** (homepage + 48 story pages), published on Edge Delivery + Document Authoring. Everything is EN-first.

---

## Reading path (in order)

1. **[`AGENTS.md`](AGENTS.md)**, the rules that override defaults (what not to touch, what's retired). ~2 min.
2. **[`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md)**, architecture, the 15 blocks, core `scripts/`, the query-index pattern, design tokens, local dev/PR flow, gotchas. **The main read.**
3. **[`docs/architecture/IMPORT-PIPELINE.md`](docs/architecture/IMPORT-PIPELINE.md)**, how source pages become published content (parsers → transformers → DA push → publish/reindex).
4. **[`docs/analysis/SKODA-MASTER.md`](docs/analysis/SKODA-MASTER.md)**, the *why*: canonical findings from the source-site analysis, plus the confirmed scope + milestones (M1 demo 15 Oct 2026 / M2 go-live 02 Jan 2027). Its §16 indexes every source report.
5. **[`docs/tickets/OVERVIEW.md`](docs/tickets/OVERVIEW.md)**, the ticket backlog (epics + SKODA-* tickets), phases, and dependency map.
6. **[`docs/README.md`](docs/README.md)**, the full documentation map (topic subfolders) for anything else.

---

## First day

- [ ] Read AGENTS.md + the Developer Guide (§1–§7).
- [ ] `npm install`, then `npx -y @adobe/aem-cli up` → open `http://localhost:3000/en/`.
- [ ] Inspect real backend markup: `curl http://localhost:3000/en/index.plain.html`.
- [ ] Open a couple of blocks (`blocks/stories/`, `blocks/story-rail/`, `blocks/cards-overlay/`) alongside the guide's block catalogue.
- [ ] `npm run lint`, confirm a clean baseline.

## First week

- [ ] Read the import-pipeline doc; trace one story from `tools/importer/` → `content/en/stories/…` → DA.
- [ ] Skim SKODA-MASTER for context, then the ticket backlog (`docs/tickets/OVERVIEW.md`) for current scope and the critical path.
- [ ] Make a small block/CSS change on a feature branch; open a PR **with a `{branch}--demo--skoda-storyboard.aem.page/{path}` preview link** (required).
- [ ] Pair on one publish → reindex cycle so the "index only sees published pages" behavior is concrete.

---

## The five gotchas that bite first

1. **Never edit `scripts/aem.js`**, it's vendored EDS core. Customize in `scripts.js` / blocks.
2. **The query-index only sees *published* pages**, upload/preview isn't enough; `stories`/`story-rail` render empty until publish + reindex.
3. **Big images 409 the content bus**, pre-condition masters >~10 MB before publish; don't strip the `-WxH` suffix on demo images.
4. **Optimize images in place**, recreating an `<img>` node (vs `optimized-picture.js` in place) breaks DA Layout-mode editability.
5. **Code and content ship separately**, merging `main` ships code; content publishes via DA. A PR needs a preview link or it's rejected.

---

## Environments

| Env | URL |
|-----|-----|
| Local | `http://localhost:3000` |
| Feature branch | `https://{branch}--demo--skoda-storyboard.aem.page/{path}` |
| Preview | `https://main--demo--skoda-storyboard.aem.page/` |
| Live | `https://main--demo--skoda-storyboard.aem.live/` |

---

*Audience note: this onboarding currently covers **developers**. Authoring (Document Authoring / Experience Workspace) and administration (Config Service, permissions, Admin API) guides can be generated when content and ops team members join.*
