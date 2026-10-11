# JavaScript Guardrails

Mandatory for JavaScript development and defect fixes in blocks, shared scripts,
templates, importers, and tests. Follow existing repository conventions and ESLint;
these rules supplement, not replace, the ticket's acceptance criteria.

## Core JavaScript

These language-level rules apply to browser code, Node tooling, and tests. ESLint
enforces syntax/style conventions; review and tests must verify behavior.

### Values and Comparisons

- Default to `const`; use `let` only when reassignment is needed, never `var`. `const` prevents rebinding, not object/array mutation.
- Prefer strict equality (`===`/`!==`) and explicit conversions at input boundaries. Do not rely on implicit coercion when comparing or calculating with authored, URL, or remote values.
- Distinguish missing values from valid falsy values. Use `??` for null/undefined defaults when `0`, `false`, or `''` must survive; use `||` only when all falsy values should trigger the fallback.
- Use optional chaining for genuinely optional data, not to hide broken required contracts. Validate required fields and types at the boundary; keep internal code working with a known shape.
- Validate numeric input before use: reject blank strings when they are not valid numbers, convert explicitly, and check `Number.isFinite` plus domain bounds. Use `Number.isInteger`/`Number.isSafeInteger` where required; `parseInt` accepts partial input and is not whole-value validation.

### Functions and Control Flow

- Give variables and functions descriptive, domain-specific names; name booleans as predicates (`isOpen`, `hasItems`). Replace meaningful repeated literals with named constants rather than unexplained magic values.
- Keep functions focused on one responsibility with explicit inputs and predictable return values. Prefer guard clauses over deep nesting; avoid nested ternaries and boolean expressions used only for side effects.
- Separate parsing/validation and pure calculation from DOM/network side effects when it makes behavior easier to test. Prefer explicit parameters over hidden dependencies on mutable module state.
- Do not mutate caller-owned inputs or shared results unless mutation is the API's explicit contract. Local mutation is acceptable; remember spread copies are shallow and nested values remain shared.
- Use default parameters/destructuring only when they clarify the contract. Avoid boolean mode flags or long positional argument lists when a small named options object would make calls unambiguous.

### Objects and Collections

- Use `map` for transformation, `filter` for selection, `find` for one match, and `some`/`every` for predicates. Do not use `map` for side effects or force a complex multi-step operation into `reduce`; choose the clearest loop allowed by the local lint configuration.
- Handle empty collections and missing matches explicitly. Give `reduce` an initial value, and use numeric comparators for numeric sorting. `sort`/`reverse` mutate arrays; copy first when callers must retain the original order.
- Use `Set` for uniqueness and `Map` for dynamic key/value lookups where appropriate. For plain-object own-property checks, use `Object.hasOwn` where supported or `Object.prototype.hasOwnProperty.call`; never trust an input object's own `hasOwnProperty` method.
- Validate external object shapes before destructuring or merging them. Do not blindly merge untrusted keys into configuration/state; select allowed fields explicitly and preserve required defaults.
- Use standard structured APIs (`JSON.parse`, `URL`, `URLSearchParams`) rather than hand-written string parsing for their formats. Catch malformed input at its boundary; parsing JSON does not validate its schema.

### Promises and Errors

- Every promise must be awaited, returned to a caller that handles it, or explicitly given a rejection handler for intentional background work. Never use an async `forEach` callback when completion or failures must be tracked.
- Run independent work concurrently with `Promise.all` only when all results are required; use `Promise.allSettled` when partial success is meaningful and handle each outcome. Bound concurrency for large collections; keep dependent work sequential. Promise rejection does not cancel sibling operations.
- Use `AbortController` for cancellable fetches and guard against stale completions. Release resources in `finally` when cleanup must happen after both success and failure.
- Throw `Error` instances, not strings. Catch only where code can recover, add useful context, or present a fallback; otherwise let the owning boundary handle the failure. Preserve the original cause when wrapping errors and avoid duplicate logging or returning fake success values.
- Keep `try` blocks narrow enough to distinguish expected operational failures from programming errors. Treat cancellation separately from failure; do not retry indefinitely or retry non-idempotent operations without an explicit policy.
- Choose language features supported by the project's browser/Node targets. Do not assume newer syntax or built-ins are available merely because the editor accepts them; do not add polyfills or runtime dependencies without agreement.

## EDS Contracts

- Read the ticket, relevant UI spec, and owning implementation before editing. Inspect actual backend markup (`curl http://localhost:3000/{path}.plain.html`); `buildAutoBlocks` transforms it before block decoration.
- For styling-only or small behavioral differences, keep variants in one block directory and decoration entry point, selected by authored variation classes (e.g. `Gallery (story)` -> `.gallery.story`). Reuse shared markup/helpers and scope variant CSS to `.block.variant`; do not create a separate block. Split only for materially different authoring contracts, structure, or responsibilities, and justify the decision.
- Select block variants through authored classes/options, not URL or page-type guessing. Decorate defensively: authors omit/add cells; handle empty, single-item, and malformed content without breaking readable fallbacks.
- Keep block decoration in its `export default decorate(block)` entry point; await required async work. Respect eager (render-critical/LCP), lazy (remaining content), and delayed (noncritical/third-party) phases; do not delay essential UI or block rendering on unrelated requests.
- Use native ES modules with explicit import extensions. No runtime bundling/transpilation assumptions or new runtime dependencies without agreement. Never edit vendored `scripts/aem.js`.
- Reuse `/scripts/` helpers for shared behavior. `fragment/fragment.js` is the only allowed cross-block import; preserve existing public APIs and default variants.
- Preserve authored content, heading semantics, alt text, captions, links, and editor hooks. Use existing image-optimization helpers, preserving authored media nodes where supported; lazy-load below-fold images, not the LCP image.

## Code and State

- Apply the core JavaScript rules above using the simplest existing pattern. Avoid unnecessary abstractions, duplicated utilities, globals, and unrelated cleanup.
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
- For core logic, cover relevant boundary values (missing vs. falsy, invalid numbers, empty collections), input non-mutation where promised, and async rejection/cancellation/stale-result behavior. Assert observable results, not incidental implementation details.
- Run the narrowest relevant tests first, then `npm run lint`. For UI changes, compare measured source/main behavior at the ticket's viewport bands using Chrome DevTools; follow the repository review protocol (no screenshots).
- Self-check: value/coercion and mutation contracts explicit; collection edge cases handled; promises/errors owned; runtime features supported; authored variants/fallbacks preserved; state and IDs isolated; safe DOM/URLs; consent respected; keyboard/focus usable; lifecycle and cleanup correct; tests/lint and applicable UI evidence recorded. Explicitly report anything unverified; development completion is not QA acceptance.