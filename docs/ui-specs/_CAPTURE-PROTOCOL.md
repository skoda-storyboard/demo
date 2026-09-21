# UI Specs, Capture Protocol

The repeatable browser-measurement method for producing a component spec. Capture is fanned out
across parallel browser-driving subagents (`aem-qa` or `general-purpose`, both carry the Playwright
toolset), one agent per component. It is collision-free: each agent reads a distinct source URL and
writes a distinct output (its own `<component>.md` draft plus `assets/<component>/` screenshots).

Shared files (`README.md`, `_FOUNDATIONS.md`, `OVERVIEW.md`, traceability, `.hlxignore`, per-ticket
edits) are written only by the main session, so there is no write contention. Cap concurrency at 3-4
agents per wave. The main session may run its own `chrome-devtools` MCP pass to spot-verify.

## Inputs handed to each capture agent

- The component name and the source URL(s) plus top-level selector(s) (from the README matrix).
- The spec schema (the 10 sections, below).
- The `_FOUNDATIONS.md` token + breakpoint tables (so raw values get mapped, not just dumped).

## Steps

1. `browser_navigate` to the source URL. `browser_snapshot` for the DOM + accessibility tree; record
   the real DOM nesting and class names for the component root and its parts.
2. Resize to each source band and, at each, `browser_take_screenshot` (into
   `assets/<component>/<viewport>.png`) plus `browser_evaluate` reading `getComputedStyle` for the
   key elements:
   - **1280** (desktop, >= 1080)
   - **1024** (small desktop, 992-1079)
   - **768** (tablet, 768-991)
   - **375** (mobile, < 768)
   Capture: display/flex/grid config + column count, gap, padding, margin, width/max-width,
   font-size, line-height, font-weight, color, background, border, border-radius, box-shadow, and
   image aspect-ratio/object-fit.
3. Confirm the component's own `@media` breakpoints against the source ladder (768/992/1080; secondary
   720/576). If a rule fires at a secondary step, sample that sub-state too. Cite the exact px.
4. Capture interaction states: `browser_hover` (hover), `browser_evaluate`/`focus()` (`:focus-visible`),
   `browser_click` for open/close/selected, each followed by a screenshot and computed-style read.
   Record transition/animation timing where present.
   - **Read inline JS-widget config, not just CSS (added 2026-09-15 after the promo-box autoplay miss).**
     Behaviors like auto-rotation, autoplay interval, pause-on-hover, wrap, dots/arrows live in **inline
     attributes** (`data-flickity`, `data-owl`, `data-*`, inline `<script>` init), NOT in the stylesheet.
     A CSS-only capture will silently miss them. For every carousel/slider/accordion/tab/modal, dump the
     component root's attributes (`el.outerHTML.slice`, `el.dataset`) and JSON-parse any widget config;
     record autoPlay/interval, pause behavior, arrows/dots, wrap, and the `watchCSS` breakpoint at which
     the widget actually boots (a widget can be a static grid at one band and a carousel at another).
5. Map every raw value to the nearest `_FOUNDATIONS` token. If none matches, flag it as a candidate
   token (e.g. an undefined mid-grey maps to the missing `--skoda-grey-500`).
6. Where useful, load the built `/en` EDS slice
   (`https://main--demo--skoda-storyboard.aem.page/en/`) and record the current gap between
   source and EDS for the same element.
7. Return a completed `<component>.md` draft following the schema, with **every measured value cited
   by source URL + selector + viewport**.

## Value provenance rule

No bare numbers. Each measurement reads `<value>  (<source-url> · <selector> · <viewport>)` and,
where applicable, `→ <token>`. This lets the Architect spot-verify and lets the build agent trust
the value.

## The 10-section schema (each `<component>.md`)

1. **Identity**, component; EDS block(s); client PDF IDs; ticket(s); source URL(s) + selector(s).
2. **Source anatomy**, annotated DOM tree, CSS classes, libraries to retire (jQuery/Owl/Isotope/
   Flickity/React/etc.).
3. **Measured visual spec**, per band (375/768/1024/1280): layout, box model, typography, color,
   radius/shadow/border, image aspect. Values cited + token-mapped.
4. **Responsive behavior**, exact breakpoints and what changes at each.
5. **Interaction states**, hover, `:focus-visible`, active, selected, open/close, timing.
6. **Accessibility**, roles/ARIA, keyboard, focus management, source gaps to fix.
7. **EDS target**, block name + variant model; DA authoring table (worked example);
   `decorate()` outline citing repo conventions from `_FOUNDATIONS` §7; reuse notes.
8. **Open decisions + recommended EDS-native default**, for TBD components; mark "assumption to
   confirm."
9. **Pixel-perfect acceptance criteria**, measurable, per viewport, in WHAT / WHERE / viewport /
   expected / actual form (per `AGENTS-TEAM.md`), plus a visual-diff threshold and the a11y gate.
   No "matches source in local preview" without a number.
10. **Reference screenshots**, links into `assets/<component>/`.
