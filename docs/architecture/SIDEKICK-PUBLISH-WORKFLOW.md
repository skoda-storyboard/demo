# Sidekick v7 + Preview/Publish Workflow (SKODA-105)

Operating runbook for previewing and publishing content on this project. Preview/publish is
already live and working (`index`, `nav`, `footer`, and `/en/placeholders.json` all serve on
`*.aem.live`), so this is the "how it works" reference. The remaining acceptance checks are
pure-UI confirmations (the browser extension loading, a Bulk Operations run) that an author
does in the UI.

## Sidekick v7 install

- Sidekick v7 is a **browser extension** (Chrome/Edge), replacing the v6 bookmarklet. Install
  "AEM Sidekick" from the Chrome Web Store.
- It **auto-detects** the project from any `*.aem.page` / `*.aem.live` tab, so no repo config is
  needed for basic preview/publish.
- Optional project config: a `tools/sidekick/config.json` (schema:
  `https://tools.aem.live/sidekick/config.schema.json`; fields `project`, `host`, `previewHost`,
  `liveHost`, `plugins[]`) can add custom plugins, host overrides, or a review environment. Not
  needed for the pilot; add it later only if we want custom Sidekick plugins.

## Per-doc preview → publish

1. Author in DA/EW (`da.live`).
2. **Preview** (Sidekick "Preview") promotes the doc to
   `https://main--demo--skoda-storyboard.aem.page/{path}`.
3. **Publish** (Sidekick "Publish") promotes it to
   `https://main--demo--skoda-storyboard.aem.live/{path}`.

Sheets (`.json`) preview/publish the same way but the `.json` extension must be kept. Note: the
DA MCP preview/publish tool strips `.json` and cannot preview sheets, so for sheets use Sidekick
or the admin API directly:
`POST https://admin.hlx.page/preview|live/skoda-storyboard/demo/main/{path}.json`.

## Bulk preview/publish (Bulk Operations)

- EW **Bulk Operations** (`da.live`) preview/publish a set of docs en masse and can emit URL
  lists / Traverse output.
- Validate into a **drafts scope first** (EW native Import is flagged destructive). This
  underpins SKODA-602 (bulk import push) and SKODA-603 (pilot validation), where it gets
  exercised for real.

## Block/section library (reuse snippets)

For a DA/EW project the block library is a **`library` config sheet** at
`da.live/config#/skoda-storyboard/demo/`, columns `title | path | format | ref | icon |
experience`. A "Blocks" entry points `path` at a blocks sheet (columns `name | path`, mapping a
block name to its sample document URL); it surfaces in the DA editor Library palette and the EW
canvas panel. Full guide: `docs.da.live/administrators/guides/setup-library`. Setting this up is
an author/admin UI step.

## Acceptance criteria status

| AC | Status |
|---|---|
| Sidekick loads + shows preview/publish/library | Human UI confirmation (install the extension, open a project page) |
| A doc previews (`*.aem.page`) then publishes (`*.aem.live`) | Proven by existing live content; per-doc flow above |
| Bulk Operations preview/publish a set + emit a URL list | Human UI step (EW Bulk Operations); exercised for real in SKODA-602/603 |

## Risks / flags

- Publishing/Git-adjacent actions run through the Console/Sidekick UI, never agent `git`
  commands.
- Bulk publish is powerful: validate into a drafts scope first before publishing at scale.
