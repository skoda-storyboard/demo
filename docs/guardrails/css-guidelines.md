# CSS & Responsive Design Guardrail

Canonical source of truth for frontend CSS and responsive-design practices,
for developers and AI coding agents alike.

## 1. Core Principle

Don't start with "what breakpoint should I use?" Start with "how can this
layout be fluid and intrinsic, and what actual behavior requires a discrete
transition?"

Decision order, cheapest solution first:

```text
Can natural sizing / fluid CSS solve it?
        ↓
Can Flexbox, Grid, or intrinsic layout solve it?
        ↓
Is the behavior local to a component? → use a container query
        ↓
Does the viewport require a real structural/behavioral transition?
        ↓
Add a breakpoint — the smallest number necessary
```

A breakpoint represents a layout-state transition, not a device (phone,
tablet, etc.). Never pick one merely because it matches a device category.

## 2. Three-Layer CSS Architecture

Apply in order; don't reach for a later layer when an earlier one solves it.

### Layer 1 — Fluid CSS

Solve sizing/spacing fluidly first, with `%`, `rem`, `em`, `dvh`/`svh`/`lvh`,
`min()`, `max()`, `clamp()`, `calc()`.

```css
.component {
  width: min(100%, var(--component-max-width));
  padding-inline: clamp(var(--space-3), 3vw, var(--space-6));
}
```

### Layer 2 — Intrinsic / Adaptive CSS

Use layout that naturally adapts to available space: Flexbox, Grid,
wrapping, `auto-fit`/`auto-fill`, `minmax()`, content-based sizing.

```css
.cardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--card-min-width), 1fr));
  gap: var(--grid-gap);
}
```

Don't add a media query when this layer solves the requirement cleanly.

### Layer 3 — Breakpoint / Behavioral CSS

Use a media query only for a discrete structural/behavioral transition:
nav collapsing, a sidebar becoming a drawer, a toolbar overflowing actions,
a multi-column composition changing information layout.

## 3. Breakpoints & Mobile-First

- Minimize breakpoint count — add only what a robust layout needs.
- Name breakpoint tokens by layout state (`compact`, `content`, `wide`),
  not device (`mobile`, `tablet`).
- Default to mobile-first progressive enhancement unless the existing
  architecture justifies otherwise. Don't force desktop-first CSS onto
  mobile through large override chains.

## 4. Container Queries

Prefer container queries for reusable components whose layout depends on
their own available width — cards, dashboard widgets, panels, sidebars,
modular content blocks, design-system components. Viewport queries remain
appropriate for page-level behavior genuinely tied to the viewport.

## 5. Design Tokens

Reuse existing project tokens before introducing new ones. Hierarchy:

- **Primitive** — raw palette/scale values.
- **Semantic** — purpose-oriented (surface, text, action, danger).
- **Component** — meaningful component-level configuration.

Components should consume semantic tokens over hard-coded values.

Any `font-size`, `line-height`, `margin`, `padding`, `gap`, `border-width`,
`border-radius`, `width`, `height`, or other dimension that represents a
design-scale decision (a spacing step, type size, radius, border weight,
or component dimension meant to stay consistent project-wide) must come
from a token:

- Token exists → use it.
- No matching token exists → define a new semantic token for it, then use
  that token. Do not hardcode a scale-relevant value just because its
  token doesn't exist yet.

A bare number is still fine for values that aren't a design-scale
decision: structural/intrinsic sizing (`100%`, `auto`, `1fr`, content-based
sizing), a value already derived from another property (an icon at `1em`
tied to `font-size`), `calc()` offsets against an existing token, and
genuine one-off values with no design significance and no chance of
reuse (e.g. an optical-alignment nudge). Don't create a token just to
satisfy this rule when the value isn't actually a design decision.

Avoid magic numbers and near-duplicate tokens.

## 6. Global vs. Component CSS

Global CSS is limited to: reset/normalization, `box-sizing` and document
defaults, root/application design tokens, global typography, app-wide
themes, global accessibility rules, and intentionally global utilities.

Everything else — including a component's responsive rules — lives with
that component, not in global stylesheets.

## 7. Layout & Typography

- Grid for two-dimensional layouts, Flexbox for one-dimensional
  alignment/distribution.
- Prefer content-driven sizing; use fixed dimensions only for a genuine
  design constraint. Avoid fixed heights for content-driven UI.
- Avoid spacer elements, unnecessary absolute positioning, excessive
  negative margins, JS layout measurement, and `overflow: hidden` used to
  mask a layout bug.
- Prefer fluid typography (`clamp()`) and constrain readable text-line
  widths.
- Use logical properties (`margin-inline`, `padding-block`, logical inset)
  so layouts tolerate RTL, text expansion/translation, and font scaling.
  Avoid `white-space: nowrap` unless single-line is an intentional
  requirement.

## 8. Accessibility & Interaction

- Never remove visible keyboard focus without an accessible replacement;
  support `:focus-visible`.
- Don't rely on hover as the only interaction state; consider
  `prefers-reduced-motion`.
- Don't infer input capability from viewport width — use `hover`/`pointer`
  media features when interaction capability matters.
- Touch targets stay usable at narrow widths and with coarse pointers.

## 9. Responsive Media & Performance

- Images/SVG/video shouldn't unintentionally overflow containers. Use
  `aspect-ratio`, `object-fit`, and reserved space to reduce layout shift.
- Choose `dvh`/`svh`/`lvh` deliberately over blindly using `100vh`.
- Prefer `transform`/`opacity` for animation. Avoid continuous
  layout-triggering animation, duplicate declarations, huge selector
  trees, and unnecessary JS-driven style updates.

## 10. Specificity, States & Compatibility

- Keep selectors simple and specificity low; avoid deep, DOM-dependent
  nesting.
- Avoid `!important` except as an intentional, documented exception.
- Represent themes via semantic variables; explicitly support relevant
  states (default, hover, focus, active, disabled, selected, loading,
  error, success). Use a defined z-index scale, not arbitrary numbers.
- Use modern CSS only where compatible with the project's supported
  browser matrix — don't adopt a feature solely because it's newer.

## 11. Anti-Patterns

- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- Device-specific breakpoints, or breakpoint proliferation.
- Fixed widths/heights for dynamic or translated content.
- Component CSS in global stylesheets.
- JavaScript-driven viewport layout.
- Hiding functionality just because the viewport is narrow.
- Hard-coding a design-scale value (spacing step, type size, radius,
  border weight, recurring component dimension) instead of using or
  creating a token — for that class of value, "no token exists yet" is
  not an excuse to hardcode.
- Ignoring localization/RTL/text-expansion, reduced-motion, or
  font-scaling preferences.
- Hover-only interaction behavior.

## 12. AI Self-Review

Before returning CSS changes, verify:

- Followed the three-layer architecture; breakpoints are behavior-driven,
  minimal, and consider intermediate widths — not just named device sizes.
- Container queries considered for reusable components.
- Existing tokens reused; new ones only where meaningful.
- Every design-scale value (spacing, type size, radius, border weight,
  recurring dimension) uses a token — a new semantic one was created if
  none existed. Structural, intrinsic, and genuine one-off values were
  left as bare numbers rather than forced into a token.
- Global CSS holds only global concerns; component CSS stays local.
- Fixed dimensions are justified; specificity low; no unjustified
  `!important`; no JS solving a CSS-solvable problem.
- Focus, reduced motion, touch interaction, text scaling, localization,
  RTL, and layout shift all remain intentional and usable.
- The result is understandable and maintainable.
