# Template Spec: 404 (Page not found)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP at 1280/500 on a live dead URL).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Template:** branded 404 / page-not-found.
- **WP body class:** `error404`. No CPT (the only template with none).
- **Side:** Storyboard chrome (switcher = Stories; STO header + footer are **kept**).
- **Source URL:** any dead path, e.g. `https://www.skoda-storyboard.com/en/this-page-does-not-exist-xyz/`
  (HTTP 404, `<title>` "Page not found").
- **Ticket:** SKODA-706 (new). In EDS this is the `404.html` at the site root.

## 2. Page anatomy

```
header.header (STO variant)          108px, kept
main  (grey band background at top)
├── left column
│   ├── "404"                         (label, ~36px, grey)
│   ├── h1  "You've reached a dead end."   (56px/700)
│   ├── p   subcopy  ("...reverse out of here. A [rear-view camera] might come in handy...")
│   └── p   "Or return to the [homepage]."   (homepage = green link -> /)
└── right column
    └── img  dead-end road sign        (decorative)
footer.footer (STO variant)
```

## 3. Composed components

[`header-megamenu`](header-megamenu.md) (STO) → a bespoke 404 content block (headline + copy + image) →
[`footer`](footer.md) (STO). Global media-cart + `social-share` floats still render.

## 4. Template-specific structure

- **404 content block:** the only unique piece, a two-part layout (text left, sign image right) on a
  light grey band. Copy is fixed/branded ("dead end" / "rear-view camera" / "homepage").
- Chrome is the standard STO shell, do not drop the header/footer.

## 5. Measured template-level visual base

Values `getComputedStyle`, cited `(selector · viewport)`.

**Layout**
- STO header at top (`108px`); content on a grey band; text left, sign image right (two-part) at desktop.
- Content within the standard `1248` content width.

**Typography** (→ token)
- "404" label: `~36px`, grey (· biggest non-h1 · 1280).
- Headline `h1`: `56px / 61.6 / 700`, color `#161718` (· `main h1` · 1280). Candidate `--display-xl: 56px`.
- Subcopy `p`: `16px / 24 / 400`, `#161718`; inline links (`rear-view camera` underlined; `homepage`
  green `--skoda-green`).

**Spacing / responsiveness**
- Desktop: two-part (text left / image right). Mobile (500): stacks to single column (text over image).
- Headline scale: verify whether `56px` reduces on mobile (capture shows the desktop value; add a mobile
  step if it overflows).

## 6. Interaction / behavior

- Static. The only actions are the inline links (`homepage` → `/`, and a "rear-view camera" link). No
  template-level JS.

## 7. Accessibility

- Correct **HTTP 404 status** must be served (EDS `404.html`).
- Single `h1` = the "dead end" headline; the sign image is decorative (`alt=""`); the `homepage` link is
  the primary recovery action and must be keyboard-reachable with a visible focus ring.

## 8. EDS target

- **`404.html` at the site root** (EDS serves it for unknown paths). Reuse the standard header/footer
  decoration; author the headline + copy + image as a simple block. Keep copy localizable.
- Ensure the server returns 404 (not 200) for the not-found response.

## 9. Open decisions + recommended default

- **Mobile headline scale** (🟡): default add a modest reduction for the `56px` headline on narrow
  screens (assumption to confirm vs source-faithful).
- **Localized copy:** the branded "dead end" copy is EN here; provide per-locale copy (E10).

## 10. Pixel-perfect acceptance criteria

- [ ] Serves HTTP **404** with the branded page; STO header + footer present.
- [ ] "404" label + `h1 56px/61.6/700` headline + subcopy `16/24/400`; `homepage` link (green) → `/`.
- [ ] Desktop two-part (text left / sign image right); stacks single-column on mobile.
- [ ] Sign image `alt=""` (decorative); homepage link keyboard-focusable with visible ring.
- [ ] Visual diff vs source at 1280/500 ≤ 2% per-pixel.

## 11. Reference screenshots

- `assets/template-404/desktop-1280.png`, `assets/template-404/mobile-500.png`.
