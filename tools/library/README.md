# DA block library and page templates (SKODA-842)

The DA editor's **Library** panel lists the project's blocks and page templates. This folder builds
both from code, so the library changes when a block does.

| File | What it holds |
|---|---|
| `library-spec.mjs` | One entry per authorable block: the description authors see, and each variant (class tokens, label, description). `EXCLUDED` lists the blocks that aren't authored, with the reason. `SECTION_STYLES` lists the section `Style` tokens. |
| `templates-spec.mjs` | The five page templates (story, press release, press-kit hub, press-kit chapter, model page). Each copies the structure of one canonical live page and replaces its content with `[prompts]`. It also holds the author note, `README`. |
| `build-library.mjs` | Writes the DA documents (see below) and refreshes `blocks/<block>/metadata.json`. |
| `library-check.mjs` | Fails when a block in `blocks/`, a contract variant (`tools/importer/push/block-contracts.json`, `main` + `pending`) or a contract section style has no library entry. It runs in `npm test`. |

## Rebuild after a block or contract change

1. Edit `library-spec.mjs` (and `templates-spec.mjs` if a template uses the block). Then run
   `npm run library:check`.
2. Run `npm run library:build -- --refresh`. This caches the published pages in
   `.migration/library-refs`, then writes the documents to `content/library/`:
   - `blocks/<block>.plain.html`: one section per variant, with a `library-metadata` name and description. The
     example is the smallest live instance of the block, with placeholder images and neutral file links. A variant
     no page uses yet gets a synthesized example.
   - `blocks.json`, the Blocks sheet (`name | path`).
   - `templates/<key>.plain.html` and `templates.json`, the Templates sheet (`key | value`).
   - `README.plain.html`, the author note (DA `/library/README`).
3. Upload `content/library/blocks/`, `content/library/templates/` and `README` to DA with the app's DA upload.
   It maps `<name>.plain.html` to `library/.../<name>` and uploads the placeholder images too.
4. POST the two sheets to the DA Source API:
   `curl -X POST -F "data=@content/library/blocks.json;type=application/json" https://admin.da.live/source/skoda-storyboard/demo/library/blocks.json`
   (the same for `templates.json`).
5. Commit the spec and the refreshed `blocks/*/metadata.json` (served files are excluded in `.hlxignore`).

## DA configuration (one-off, done 2026-10-10)

- **Library panel:** the site config `library` tab has rows `Tag picker` (SKODA-211), `Blocks` and `Templates`. The
  Config API's POST replaces the whole config, so always GET, merge and POST.
- **No Placeholders row:** `/en/placeholders.json` holds UI strings for the code (`Load more`, gallery labels). These
  aren't author snippets, and the project doesn't resolve DA's `{{key}}` tokens.
- **Not indexed:** the bulk metadata sheet (`/metadata.json`) has `/library/** | robots: noindex, nofollow`. It went
  live on 2026-10-11, together with the library documents (published at the user's request, noindex).
- **The live bulk sheet is a subset.** DA and preview hold 9 more language rows (cs/de/sk/sr), which were kept off live.
  Publishing the sheet from DA ships them, so ask first. To publish without them, publish a copy without those rows,
  then restore DA and re-preview.

## Known limits

- The story template still carries the newsletter card. SKODA-840 replaces it with one fragment.
- The fixed icons in the templates (newsletter, WhatsApp, PDF and share banners) still point at the origin CDN, like
  every migrated page (AR-01).
- The `Tags` block in the templates is empty, so it shows the page's `tags` metadata. SKODA-841 makes the metadata the
  single place to enter tags.
