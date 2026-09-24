# SKODA-801 Story Flatten — Coverage Review (import test)

**Date:** 2026-09-24 · **Method:** stratified random import of 16 EN stories from the
census dataset (`SKODA-STORY-WIDGET-DATASET.csv`) — 6 common Page-Builder stories across
the widget-count range + one story per rare-widget category + the 208-widget outlier + a
non-Page-Builder linear story. Imported with the current shipped bundle (PR #113
`import-story-detail.bundle.js`), analysed source-vs-output per story.

**Bottom line:** the common shape (rich text + image carousel + spacers + quote + button +
related rail) flattens correctly and robustly. The review found **2 content-loss defects** (D1
milestones dropped, D2 figure/infobox mis-handled in multi-column) plus **1 minor
editor-hygiene issue** (D4 empty-text/over-encoded inline links). D3 (interactive defer) works
as designed. None crash; the losses are **silent** — the widget is classified, but content is
dropped or de-semanticised without a warning.

---

## A. Blocks we identified AND correctly import ✅

| Widget | EDS output | Verified on | Status |
|---|---|---|---|
| `sow-editor` / tinymce | default content (h/p/ul, inline img/embed) | every story | ✅ solid |
| `skoda-offset` | dropped (spacer) | most stories | ✅ correct |
| `skoda-carousel-widget` (link-free) | **Gallery** block | designers-peaq, common #3 | ✅ correct (content-routed) |
| `skoda-carousel-widget` (linked) | **Cards** block | (routing unit-tested; none in this sample were linked) | ✅ by test |
| `skoda-quote` | `<blockquote>` | supercomputer (3 quotes) | ✅ correct |
| `sow-button` (+ wire) | EDS button (`<p><strong><a>`) | how-to-have-fun (2 CTAs) | ✅ correct (label + PDF href) |
| `.sidebar` related | Cards + Tags in `Style:sidebar` section | every story | ✅ correct |
| Two-column body + aside layout | grid-on-main | every story | ✅ renders |
| Single-column multi-grid stories | linearized default content | most | ✅ correct |
| Genuine multi-column rows | `Columns` block | icons-makeover, era-of-influencers | ✅ block emitted (but see D2) |
| **Linear (non-PB) story** | plain-post default content, no flatten | tour-de-france | ✅ fallback works |
| Large trees | guarded walk | (208-widget URL is now a **404 on live** — could not test at scale; synthetic 293-grid unit test passes) | ⚠️ unproven on real 200+ |

## B. Things MISSED / defective (found by this review) ❌

### D1 — `ys-milestones` timeline is silently dropped (real content loss)
- **Where:** steering-wheel-decades-of-changes (`ys-milestones`).
- **Source:** 11 dated milestone entries + **11 images** (1905, 1925, 1932, 1940, 1952…).
- **Output:** **0 of those years, 0 of those 11 images.** Story scored 62.4% completeness.
- **Cause:** `ys-milestones` is in the parser's `DROPPED` set (mapped as "timeline → omit for demo").
  That was a reasonable M1 call for a *rare* widget, but it is genuine editorial content, not chrome.
- **Fix:** needs a **timeline block** (or, minimum, flatten each milestone to an image + dated
  heading/paragraph so the content survives). 9 EN stories carry it.

### D2 — `skoda-captioned-image` / `skoda-image-box` lose figure semantics in multi-column rows — **FIXED 2026-09-24**
> **Resolution:** `figureNodes` now **lifts the native `<figure>`/`<figcaption>`** (caption source
> order: native figcaption → data-caption → alt), and `skoda-image-box` is remapped from the image
> path to a new `infoboxNodes` emitter that keeps the definition **text** (+ image if present).
> Verified: the infobox story recovered **88.2% → 95.3%** completeness (all 4 definition boxes —
> Up-cycling / Recharging / Recuperation / Sustainable materials — now survive). 3 unit tests added.
> *(Correction to the original diagnosis: `createTable` does NOT flatten a figure — it `append`s the
> node intact. The real loss was `figureNodes` ignoring the native figure, and `image-box` being
> routed to an image path that needs an `<img>` the infobox often lacks.)*

- **Where:** the-mobile-command-center (`captioned-image` ×3), a-journey-that-will-not-burden
  (`image-box` ×4). Both sit in **2-cell panel-grids** → routed through `emitMultiColumn`.
- **Symptom:** output has **0 `<figure>`/`<figcaption>`** — the images emerge as loose
  `img` + text inside `Columns` cells; caption/figure semantics gone.
- **Cause A (figure):** the widget contains a **native `<figure class="figure">`** (sometimes
  with a `<figcaption>`), but `figureNodes()` **builds a new figure and only reads
  `data-caption`** — it ignores the native figure/figcaption. And in the multi-column path the
  built figure is flattened by `createTable` cell rendering anyway.
- **Cause B (image-box):** `skoda-image-box` is **NOT an image** here — it's an
  `<abbr class="infobox">` **glossary/definition box** ("Up-cycling — …"). Mapping it to
  `figureNodes` (which looks for an `<img>`) is wrong; the box text only survived incidentally.
- **Fix:** (a) `figureNodes` should **lift the existing `<figure>`** and read the native
  `<figcaption>` before `data-caption`; (b) `emitMultiColumn` must preserve figures (don't let
  createTable flatten them); (c) `skoda-image-box` needs its own mapping (infobox/callout →
  a small callout block or a styled blockquote), not the image path.

### D3 — deferred interactive widgets confirmed (expected, but verify the drop is clean)
- **Where:** my-enyaq-iv (`k2tools-charge-map` + `k2tools-charging-calculator`).
- **Output:** both correctly `deferred` + logged, no crash. ✅ as designed — but this is the
  first real page carrying **both** a charge-map and a calculator; confirms the defer path.
  Still needs the Škoda render-vs-drop decision.

### D4 — editor-passthrough hygiene: empty-text links + over-encoded hrefs (minor)
- **Where:** how-to-have-fun (inside `sow-editor` content, NOT the buttons).
- **Finding:** `sow-button` itself is **correct** — the "DOWNLOAD GREY/WHITE MODEL HERE" CTAs
  rendered with proper labels + clean PDF hrefs. ✅ But inline `<a>` inside the rich text passed
  through with **empty link text** (image-wrapping anchors) and **mangled over-encoded hrefs**
  (`https://apps.apple.com/us/app/%2525252525C5%2525252525A1koda-…` — quintuple-encoded from the
  source WordPress). These are a11y ("link has no discernible text", story-detail §6) + link-rot
  concerns, not a widget-mapping defect.
- **Fix (low priority):** in `editorNodes`, drop/patch empty-text anchors and normalise
  multiply-encoded hrefs (decode once). Editor cleanup, not a new block.

## C. Blocks we still need to develop 🔨

| Need | For | Note |
|---|---|---|
| **Timeline block** | `ys-milestones` (9 EN stories) | D1 — currently dropped; real content |
| **Infobox / callout block** | `skoda-image-box` (16 stories) | D2 — glossary/definition box, mis-mapped to image |
| **Figure-preserving Columns path** | captioned-image / image in multi-col rows | D2 — fix `emitMultiColumn` + `figureNodes` |
| **Gallery block (runtime)** | all image carousels/sliders | `blocks/gallery` still not on `main` (SKODA-203) → emitted Gallery tables render inert |
| **Cards block (runtime) — confirm** | linked carousels + sidebar related | `blocks/cards` exists; verify it decorates the emitted table shape |
| **Timeline decision** | — | build vs omit-for-M1 (D18-style call) |

## D. Non-defects (correctly deferred, per scope)
- In-body `.sb-gallery` / `a.colorbox` lightbox galleries, video embeds, Media Box → dropped +
  logged, **deferred to SKODA-604** (full-fidelity restore). Working as intended.
- `ys-embed-share` (social share) → dropped, no leak into body. ✅ correct (chrome, not content).
- `sow-button` → EDS button (`<p><strong><a>`). ✅ present in how-to-have-fun output.
- Bottom `.cover-box.dark .related-stories` band → dropped (duplicate of sidebar related). ✅

## E. Test-corpus caveat
The census's **208-widget outlier** URL
(`/en/skoda-world/innovation-and-technology/electricity-cng-or-perhaps-hydrogen-judge-for-yourselves/`)
**now returns a 404 on the live site** — it was removed/moved since the census. So the
"robust to 200+-widget real trees" AC is **still unproven on real content** (only the synthetic
293-grid unit test covers it). Need to re-pick a live large-tree story from the dataset for that AC.

## Recommended follow-ups (tickets)
1. **D1 timeline** — new `ys-milestones` mapping (+ block or flatten-to-content). *Content loss; prioritise.* → **SKODA-815** (created 2026-09-24).
2. ~~**D2 figure/infobox**~~ — **FIXED in SKODA-801** (2026-09-24): `figureNodes` lifts the native
   figure/figcaption; `skoda-image-box` → new `infoboxNodes` (text + optional image). 3 unit tests.
3. **Re-select a live large-tree story** to satisfy the 208-widget AC (the census URL is dead).
4. Confirm `blocks/gallery` (SKODA-203) lands so emitted Gallery tables actually render.
5. **D4 editor hygiene** (low) — drop empty-text inline anchors + normalise over-encoded hrefs in `editorNodes`.
