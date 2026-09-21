# Škoda Storyboard, Custom Authoring UI in DA / Experience Workspace

**Scope:** how to satisfy a *custom authoring requirement* (a control the author needs that isn't a plain block/table) on this DA/EW-authored site, without leaving the Document Authoring model and without Adobe App Builder. Written to answer the recurring client question "can the WYSIWYG editor do X" for X beyond typing text into a table.
**Status:** the core route (DA library plugin + `DA_SDK`) is **build-confirmed in the client's own tenant** (`skoda-storyboard/demo`, 2026-09-16). Two working PoCs shipped: `poc/tag-multiselect/` and `poc/stories-tag/`.
**Relates to:** `SKODA-EDS-DA-ARCHITECTURE.md` (§2 DA-specific callouts, §4 content model), decision **D13** (DA vs Universal Editor) in `SKODA-DELIVERY-PLAN.md`.

---

## 1. The one-paragraph answer

DA/EW is not limited to typing into tables. Authors can be given **real custom controls** (multi-select pickers, dynamic dropdowns, validated inputs, asset/reference choosers) via a **DA library plugin**: a plain hosted HTML/JS page registered in a `library` config sheet that talks to the editor over the `DA_SDK` postMessage bridge. It needs **no App Builder and no Adobe Developer Console**, stays entirely inside the DA/EW content model, and surfaces in **both** the classic DA editor Library palette and the Experience Workspace canvas panel. App Builder / Universal Editor is only required for a narrower set of needs (per-field in-canvas editing of every component, or a dropdown bound to an AEM Cloud Service tag tree). This keeps D13 open rather than forcing a move to UE.

---

## 2. The extensibility ladder (cheapest → heaviest)

Reach for the lowest rung that satisfies the requirement.

| Rung | Mechanism | Gives the author | Enforced? | Cost | Doc/where |
|---|---|---|---|---|---|
| 0 | **Block variant / class** (`Block (variant)`) | pick a look from a fixed set | no (free-text cell) | ~0 | block table header |
| 1 | **Block library palette** (`library` sheet, block samples + pipe-delimited option lists) | a curated palette of blocks + seeded option values | no (seeds, doesn't forbid) | low | `docs.da.live/administrators/guides/setup-library` |
| 2 | **Config Sheets** (placeholders, metadata, redirects) | tabular key/value config | no (free text) | low | `/docs/authoring-tabular-data` |
| 3 | **Structured Content `enum`** | a single value from a fixed list as a real **dropdown** | yes (closed set) | low | `/docs/ew/administering/structured-content` |
| 4 | **DA library plugin (`DA_SDK`)** ⟵ *the workhorse for custom UI* | **anything you can build in HTML/JS**: multi-select, autocomplete, dynamic/governed lists, asset/reference pick, validation, composed output | as strict as you code it | medium (a small hosted app) | this doc §3 |
| 5 | **Universal Editor** (`component-models.json` + App Builder for custom fields) | per-field in-canvas editing; `select`/`multiselect`; `aem-tag` picker (AEM CS only) | yes | high (adopts UE, App Builder, Dev Console) | `SKODA-EDS-DA-ARCHITECTURE.md`; changes D13 |

Rungs 0–4 are all **DA/EW-native** and keep the content-source model unchanged. Rung 5 is a different model (see §7 and D13).

---

## 3. The workhorse: a DA library plugin (build-confirmed)

A DA library plugin is a hosted static page (`index.html` + JS + CSS) registered in the project's `library` config sheet. The editor loads it in an iframe and hands it a small SDK.

### 3.1 The SDK

```js
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
const { context, token, actions } = await DA_SDK;
```

- **`context`**, the current document/org/site/path.
- **`token`**, the signed-in user's auth token, so the plugin can call authenticated Adobe/DA APIs *as the author* (e.g. fetch a governed vocabulary sheet, or an internal service).
- **`actions`**, confirmed methods: `sendText(text)` (insert plain text at the cursor), `sendHTML(html)` (insert markup, e.g. a block table, at the cursor), `closeLibrary()`.

Write-back reality: the confirmed actions insert **at the cursor**. There is no *documented* "write directly to a metadata field." So the patterns are: emit a **Metadata/Tags block** via `sendHTML`, or drop a **value** via `sendText` into a metadata cell / prose. Both are demonstrated in `poc/stories-tag/` (two buttons: "Insert Stories block" = `sendHTML`; "Insert value" = `sendText`).

### 3.2 Registration (the `library` sheet)

At `da.live/config#/{org}/{site}/` add a sheet named **`library`** with this header row and one row per plugin:

| title | path | experience |
|---|---|---|
| Stories category | `https://main--demo--skoda-storyboard.aem.page/poc/stories-tag/index.html` | dialog |

- `path` = the HTTPS URL of the plugin's `index.html`.
- `experience = dialog` makes it an **interactive plugin panel** (vs a block-sample library entry). Icon (a `.png`) is optional.
- **Gotcha (cost us a debugging cycle):** DA's library loader runs `row.path.split(',')`. A missing or misnamed `path` column makes the **entire Library** throw `Cannot read properties of undefined (reading 'split')` and render nothing. Get the header names exactly right.

### 3.3 Hosting

Any HTTPS origin works. The simplest is the project's own preview: all committed repo files are served at `{branch}--{repo}--{owner}.aem.page/<path>` (the PoCs live under `poc/`, served because they aren't `.md`/dotfiles). **Localhost will not work** as a plugin inside the https canvas (mixed-content block); use the preview URL or any static host.

### 3.4 Connection pattern (don't hang the UI)

`DA_SDK` (its default export) is a **promise that only resolves after the parent-frame postMessage handshake**. If you `await` it before rendering, the plugin hangs forever when opened standalone (and is fragile in-frame). Pattern that works:

1. Render the control immediately with `state.sdk = null` (Insert disabled).
2. Connect in the background; short-circuit to `null` when `window.parent === window` (no host), and race a timeout as a backstop.
3. On connect, enable the write buttons.

This is implemented in both PoCs; it also makes the plugin openable standalone for a UI smoke test (the buttons stay disabled with a "Preview only" hint).

### 3.5 Where it shows up (confirmed)

- **Classic DA editor** (`da.live/edit`): floating toolbar → **Open library** → the plugin appears in the Library palette; clicking it opens the dialog.
- **Experience Workspace canvas** (`da.live/canvas`, "New Authoring"): the plugin renders in the **right-hand panel**. (Our earlier assumption that EW might not surface DA plugins was disproven on 2026-09-16, it does.)

---

## 4. Controlled vocabularies, including client-governed ones

The client's taxonomy question ("show a tag list and let authors pick") is the canonical custom-authoring case. Options for *where the list comes from*:

- **Hardcoded in the plugin**, trivial, fine for a stable dev-owned list (the 15-facet taxonomy, the 4 story categories). See `poc/tag-multiselect/taxonomy.js`.
- **Fetched from a published DA Sheet**, the plugin `fetch()`es a Sheet-as-JSON (optionally with the SDK `token` for a restricted sheet) and renders the options. The client then **governs the vocabulary from a spreadsheet, no code change**. This is the exact capability that native `enum`/`select` (static options only) can't offer, and the reason to reach for a plugin over structured-content for a governed or large list.
- **Fetched from a service**, same pattern against any API the `token` authorizes.

Single-select vs multi-select: native structured-content `enum` renders a single-select dropdown (confirmed); array-of-enum multi-select is **undocumented** and shouldn't be promised. A plugin does multi-select (and select-all/clear/search) with certainty, demonstrated.

---

## 5. Decision framework, "we need a custom authoring control for X"

Walk top to bottom; stop at the first Yes.

1. **Is X just picking a block's look, or a one-off config value?** → block variant/class (rung 0) or a config row (rung 2). No custom UI.
2. **Is X one value chosen from a small fixed list, as a dropdown?** → Structured Content `enum` (rung 3). Native, no hosting.
3. **Is X any of: multi-select · autocomplete · a governed/dynamic/large list · an asset or page reference pick · validated or composed input · a mini-form that writes a block?** → **DA library plugin** (rung 4). No App Builder. This covers the large majority of "custom authoring" asks.
4. **Is X per-field in-canvas editing of every component (Gutenberg-like), or a dropdown bound to the AEM Cloud Service tag tree (`aem-tag`)?** → Universal Editor + App Builder (rung 5). This changes the content-source model, that's decision **D13**, not a drop-in.

---

## 6. Cookbook, likely Škoda custom-authoring requirements → mechanism

Grounded in the requirement corpus (`SKODA-CLIENT-REQUIREMENTS-MAPPING.md`) and the walkthrough asks.

| Requirement | Mechanism | Notes |
|---|---|---|
| Pick tag(s) / facet(s) from the taxonomy | **DA plugin** (built: `poc/tag-multiselect/`) | multi-select; writes a Tags/Metadata block via `sendHTML` |
| Configure a listing/rail's category | **DA plugin** (built: `poc/stories-tag/`) + `blocks/stories/stories.js` `category` include | inserts a pre-configured block, or the value at cursor |
| Governed vocabulary the client edits themselves | **DA plugin** fetching a **DA Sheet** | no redeploy to change the list (§4) |
| One primary category/status per doc | Structured Content **`enum`** | native single-select dropdown |
| Related-articles / "manual recommendations" set | **DA plugin** (index-backed multi-pick → writes links) | maps to the "manual+tag recommendations" ask (D13 call notes) |
| Choose an embargo date/window | **DA plugin** (date UI) → writes metadata; enforcement is delivery-side | embargo is D9; the *picker* is a plugin, the *gate* is restricted folders/CDN |
| Pick a media-kit / asset set | **DA plugin** using `token` against the Assets/mediabox API | reference-in-place, not a copy |
| Banner targeting (market/locale/tag) | **DA plugin** writing a config block | the banner *delivery* is a service (out of static scope) |
| Per-field editing of every component like WordPress/Gutenberg | **Universal Editor** (rung 5) | the actual D13 fork; not needed for the above |

Takeaway: nearly every custom authoring requirement on this site is a **rung-4 DA plugin**, which is DA/EW-native and App-Builder-free. UE is reserved for the genuine per-field-editing model shift.

---

## 7. What still needs Universal Editor / App Builder (the honest boundary)

- **`select`/`multiselect` as native component fields, or per-component field editing** → Universal Editor (`component-models.json`). UE fields take **static** options only.
- **A dropdown fed from a dynamic source *as a native UE field*** → a **custom UE field-type UI extension**, which **requires App Builder + Adobe Developer Console**. (A DA plugin gets the same dynamic dropdown with none of that, prefer it unless you're already on UE.)
- **`aem-tag` tag-tree picker** → needs an **AEM Cloud Service** taxonomy backend; not available in a pure DA/EW project.

Adopting UE is decision **D13** and changes the content-source model (field-level `data-aue-*` instrumentation vs DA's text-vs-structure). Don't reach for it just to get a picker.

---

## 8. Build checklist for a new DA plugin

1. Write `index.html` + `<name>.js` (import `DA_SDK`) + CSS under `poc/<name>/` (or a permanent home).
2. Render first, connect in the background (§3.4); gate write buttons on `state.sdk`.
3. Build the vocabulary: hardcode, or `fetch()` a DA Sheet (with `token` if restricted).
4. On confirm, `actions.sendHTML(<block table>)` or `actions.sendText(<value>)`, then `actions.closeLibrary?.()`.
5. Lint (`eslint`/`stylelint` pass; no cross-block imports rule doesn't apply, it's a standalone app).
6. Push so it's served at the preview URL; register a `library` sheet row `title | path | experience=dialog` (mind the `path` header, §3.2).
7. Verify in the DA editor Library and the EW canvas panel; test both write paths.

Reference implementations: `poc/tag-multiselect/` (Tags block via `sendHTML`), `poc/stories-tag/` (category picker: `sendHTML` block **and** `sendText` value; consumes the new `category` include filter in `blocks/stories/stories.js`).
