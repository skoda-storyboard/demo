# Škoda Storyboard, AEM Edge Delivery Services (demo)

An Edge Delivery Services (Document Authoring / Experience Workspace) stub for the Škoda
Storyboard / Media Room migration, carrying the full technical documentation set. Built on the
AEM boilerplate: vanilla JS + CSS, **no build step**, content authored in Document Authoring and
served from Edge Delivery.

## 👉 New here? Start with [ONBOARDING.md](ONBOARDING.md)

It gives a guided reading path, a first-day/first-week checklist, and the gotchas that bite first.

## Key docs

| Doc | What |
|-----|------|
| [ONBOARDING.md](ONBOARDING.md) | Guided start for new developers |
| [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) | Architecture, blocks, scripts, query-index pattern, design tokens, gotchas |
| [docs/architecture/IMPORT-PIPELINE.md](docs/architecture/IMPORT-PIPELINE.md) | Content import: parsers → transformers → DA push → publish |
| [docs/README.md](docs/README.md) | Full documentation map (analysis, architecture, planning, tickets, ui-specs, reviews) |
| [AGENTS.md](AGENTS.md) | Repo rules that override defaults |

## Environments

- **Preview:** https://main--demo--skoda-storyboard.aem.page/
- **Live:** https://main--demo--skoda-storyboard.aem.live/
- **Local:** http://localhost:3000

## Quick start

```sh
npm install                    # devDependencies only (lint tooling)
npx -y @adobe/aem-cli up       # serve local code + previewed content at localhost:3000
npm run lint                   # eslint + stylelint — must pass before a PR
```

> A PR without a `{branch}--demo--skoda-storyboard.aem.page/{path}` preview link is rejected.
> Merging `main` ships **code**; content publishes **separately** via Document Authoring.

## Platform documentation

- [Edge Delivery Services docs](https://www.aem.live/docs/)
- [Developer Tutorial](https://www.aem.live/developer/tutorial)
- [Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
- [Web Performance (keeping it 100)](https://www.aem.live/developer/keeping-it-100)
- [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)
