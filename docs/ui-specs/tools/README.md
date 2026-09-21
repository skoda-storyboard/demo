# UI-spec measurement + visual-diff harness

Two small Playwright scripts that make the spec library repeatable and enforceable:

- **`measure.mjs`** reproduces any spec value (computed styles + box rect + inline
  attributes) for a set of selectors across breakpoints, in one command. No more
  hand-transcribing a manual DevTools pass, and no viewport artifacts.
- **`visual-diff.mjs`** screenshots the live source and an EDS preview at each
  breakpoint (or a specific element on both), pixel-diffs them, and reports the
  mismatch %. This is the enforceable side of every spec's "visual diff <= 2%" AC.

Self-contained on purpose: this folder has its own `package.json` so Playwright +
pixelmatch stay out of the EDS project deps. `docs/` is `.hlxignore`'d, so nothing
here ships. `node_modules/` and `out/` are gitignored.

## Setup (once)

```
cd docs/ui-specs/tools
npm install            # also runs `playwright install chromium`
```

Node 20+ (the repo runs Node 24). If the postinstall browser download is blocked in
your environment, run `npx playwright install chromium` manually when online.

## measure.mjs

Single target:

```
node measure.mjs \
  --url "https://www.skoda-storyboard.com/en/" \
  --selectors ".hero, .hero h1" \
  --viewports 500,768,1024,1280 \
  --out out/hero.json
```

Read inline JS-widget config (the miss class CSS-only capture keeps hiding):

```
node measure.mjs --url "https://www.skoda-storyboard.com/en/" \
  --selectors ".promo-box" --attrs "data-flickity" --viewports 768,1080
```

Batch (build a library of targets that mirror the specs):

```
cp targets.example.json targets.json    # edit to taste
node measure.mjs --config targets.json --out out/all.json
```

Flags: `--props` overrides the measured prop set (default = the spec schema §5 set);
`--all` measures every match, not just the first; `--renavigate` reloads per viewport
instead of resizing (use when a layout only reflows on a fresh load, e.g. a menu);
`--height` sets the viewport height (default 900). Colors are hex-normalized in the
stdout summary; the JSON keeps the raw `rgb()`.

## visual-diff.mjs

Whole viewport at each breakpoint:

```
node visual-diff.mjs \
  --source "https://www.skoda-storyboard.com/en/press-releases/<slug>/" \
  --target "https://main--demo--skoda-storyboard.aem.page/<path>" \
  --viewports 500,768,1024,1280 --threshold 2 --out out/pr
```

Element-scoped (the fairest component-level check, since page chrome differs):

```
node visual-diff.mjs --source <srcUrl> --target <edsUrl> \
  --selector ".column-primary" --threshold 2
```

Writes `out/<viewport>-{source,target,diff}.png` and prints a per-viewport table.
Exits non-zero if any viewport is over the gate, so it drops straight into CI or a
pre-merge check. `--full` diffs the full page (padded to a common canvas; dimension
mismatches are flagged in the report). `--pmthreshold` tunes pixelmatch's per-pixel
color tolerance (default 0.1) separately from the overall `--threshold` %.

## Notes

- Consent: both scripts auto-accept the OneTrust banner so it never covers content.
  We are capturing the fully-rendered reference, not the consent flow.
- Determinism: `deviceScaleFactor: 1`, `document.fonts.ready`, network-idle, and a
  short settle wait. Bump `--height` or the settle for long lazy pages.
- The `<= 2%` number matches the spec ACs; raise `--threshold` for pages with
  unavoidable dynamic content (feeds, ad slots) or diff a stable element instead.
