# JavaScript Guardrails

Mandatory for JavaScript development and defect fixes in blocks, shared scripts,
templates, importers, and tests. Follow existing repository conventions and ESLint;
these rules supplement, not replace, the ticket's acceptance criteria.

## EDS Contracts

- Read the ticket, relevant UI spec, and owning implementation before editing. Inspect actual backend markup (`curl http://localhost:3000/{path}.plain.html`); `buildAutoBlocks` transforms it before block decoration.
- For styling-only or small behavioral differences, keep variants in one block directory and decoration entry point, selected by authored variation classes (e.g. `Gallery (story)` -> `.gallery.story`). Reuse shared markup/helpers and scope variant CSS to `.block.variant`; do not create a separate block. Split only for materially different authoring contracts, structure, or responsibilities, and justify the decision.
- Select block variants through authored classes/options, not URL or page-type guessing. Decorate defensively: authors omit/add cells; handle empty, single-item, and malformed content without breaking readable fallbacks.
- Keep block decoration in its `export default decorate(block)` entry point; await required async work. Respect eager (render-critical/LCP), lazy (remaining content), and delayed (noncritical/third-party) phases; do not delay essential UI or block rendering on unrelated requests.
- Use native ES modules with explicit import extensions. No runtime bundling/transpilation assumptions or new runtime dependencies without agreement. Never edit vendored `scripts/aem.js`.
- Reuse `/scripts/` helpers for shared behavior. `fragment/fragment.js` is the only allowed cross-block import; preserve existing public APIs and default variants.
- Preserve authored content, heading semantics, alt text, captions, links, and editor hooks. Use existing image-optimization helpers, preserving authored media nodes where supported; lazy-load below-fold images, not the LCP image.

## Code and State

- Prefer `const`, clear names, small functions, and the simplest existing pattern. Avoid unnecessary abstractions, duplicated utilities, globals, and unrelated cleanup.
- Scope DOM queries, styles/classes, and state to the owning block unless deliberately implementing shared page behavior. Multiple block instances must remain independent; generate unique IDs for ARIA relationships.
- Use explicit state transitions and one source of truth. Avoid duplicate initialization/listeners when reinitialization is supported; release timers, observers, and listeners when their owning UI is removed or replaced.
- Handle async failures at the owning boundary: check `response.ok`, distinguish cancellation, and keep a usable fallback. Prevent stale responses from overwriting newer state; reuse shared caching and never mutate shared read-only results. Do not silently swallow errors.

## Security and Consent

- Treat authored, URL, and remote data as untrusted. Prefer `createElement`, `textContent`, and DOM APIs; HTML parsing must use the approved sanitization/Trusted Types path. Never bypass the policy, use `eval`/`new Function`, or build executable code from content.
- Validate URL protocols/destinations before assigning navigation, embed, or fetch targets; allow-list dynamic module/template choices. Never expose secrets or personal data in client code or logs.
- Use the existing consent helpers for third-party scripts, embeds, and analytics; do not load them before the required consent. Failed or denied consent must leave a meaningful fallback.

## Accessibility and Performance

- Use semantic buttons for actions and links for navigation. Provide accessible names, accurate state/relationships, keyboard operation, and visible focus; preserve logical heading order and appropriate image alt text.
- Dialogs need a label, focus containment (including authored links), Escape dismissal, and focus return. Announce meaningful dynamic changes with appropriate live regions; honor reduced motion.
- Prefer CSS for layout/responsiveness; read [CSS Guidelines](css-guidelines.md) when styling. Use `matchMedia` only for behavioral changes; avoid per-frame DOM rebuilds, unthrottled high-frequency handlers, and interleaved layout reads/writes.
- Fetch only needed data, avoid duplicate requests, and defer optional heavy work/modules. Use existing optimized media and loading helpers instead of competing loaders or speculative preloads.

## Before Handoff

- Add/update focused tests using existing helpers: normal flow, malformed/empty content, async failure where applicable, multiple instances, and keyboard/focus behavior. For defects, pin the failing behavior with a regression test when practical.
- Run the narrowest relevant tests first, then `npm run lint`. For UI changes, compare measured source/main behavior at the ticket's viewport bands using Chrome DevTools; follow the repository review protocol (no screenshots).
- Self-check: authored variants/fallbacks preserved; state and IDs isolated; safe DOM/URLs; consent respected; keyboard/focus usable; lifecycle and cleanup correct; tests/lint and applicable UI evidence recorded. Explicitly report anything unverified; development completion is not QA acceptance.