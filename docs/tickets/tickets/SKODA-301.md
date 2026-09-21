# SKODA-301, Header + mega-menu (3 nested-list panels) fragment+block
- **Epic:** E03, Chrome Fragments
- **Type:** fragment
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/header-megamenu.md`](../../ui-specs/header-megamenu.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that change this ticket:
- Heights confirmed: topbar `44px` (`#e6e6e6`) + main `64px` = `108px` (`--nav-height`). Header is `position:relative`, **NOT sticky** (scrolls away, no shrink).
- **Desktop→mobile breakpoint is `1080px`** (the block currently hardcodes `900px`, fix to the source ladder).
- Panels are **single-column dropdowns** anchored under each item, open on `:hover` (opacity `.1s`), one level deep, **not** wide multi-column mega-panels. Child counts (incl. the item link itself): Models 14, Lifestyle 4, Škoda World 6.
- Desktop shows **7** top-level items; **Newsletter is drawer-only** (not in the desktop bar).
- Hover = `2px` ink underline in source (EDS currently does a green color-swap, reconcile).
- **Section switcher (COM-04, Stories | Media Room) reflows across `1080` (verified live 2026-09-15):** desktop = left-aligned auto-width tab pair in the grey topbar (Subscribe + locales flush right); below `1080` it becomes a **full-width 50/50 centered tab bar** (`h44`, active = white segment `#fff`/`#000`, inactive = grey over `#e6e6e6`/`#7c7d7e`, both `14px`/`600`) while Subscribe + locales move into the drawer. **The current EDS `header.css` hides the whole topbar below 900, so it drops the switcher on mobile, a fidelity bug to fix.**
- New tokens: `--nav-topbar-height:44px`, `--dropdown-radius:4px`, `--dropdown-shadow`, `--dropdown-hover-bg:#f1f1f1`, `--divider-color:#e4e4e4`, `--body-font-size-2xs:12px`.

## Summary
Stand up the site header as an EDS Block Collection **Header block** loaded into `<header>`, driven by a **`nav` fragment** (DA document) with three sections, brand / menu / tools, and decorate the three mega-menu panels as plain nested link lists.

## Description
The structural analysis (`SKODA-HEADER-FOOTER-ANALYSIS.md`) confirmed the header is simpler than earlier reports assumed: the mega-menu is a **plain nested `<ul>` link list with zero images and zero descriptions**, not a rich image-grid megamenu. The nav content is authored as a `nav` DA fragment; `header.js` loads it and decorates it. Three of the eight top-level items have child panels; the rest are flat links. Responsiveness in the source is CSS-driven (checkbox-hack), not JS, the mobile toggle rebuild is split out to SKODA-302, and the language switcher to SKODA-303.

## Requirements / Spec
- **Header block** (Block Collection Header) loaded into `<header>`; boilerplate default pattern.
- **`nav` fragment** = DA document, three sections: **brand** (inline SVG logo, `BRAND_LOGO` pattern), **menu** (top-level items + nested panels), **tools** (topbar: newsletter dropdown placeholder + language-switcher slot, see SKODA-303).
- **Top-level items (8):** Models, eMobility, Lifestyle, Škoda World, Series, Škodapedia, Podcast, Newsletter.
- **Three mega-menu panels**, each a nested `<ul class="sub-menu">` of plain links (no imagery, no descriptions):
  - **Models** → 12 models (Fabia, Scala, Octavia, Superb, Kamiq, Karoq, Kodiaq, Epiq, Peaq, Elroq, Enyaq) + **Classic Cars** + **Concepts**.
  - **Lifestyle** → People, Sports, Adventures.
  - **Škoda World** → Innovation & Technology, Design, Responsibility, Corporate Life, Heritage (5 topics).
- Remaining top-level items are flat links.
- Desktop panel open/close via hover + click toggle; decoration is CSS/JS over the nested lists (do NOT assume rich per-panel content).
- Per-locale fragment (one `nav` doc per language); EN authored for the pilot.

## Acceptance Criteria
Measurable gates live in [`header-megamenu.md` §9](../../ui-specs/header-megamenu.md); summary:
- [ ] `<header>` renders brand / menu / tools; topbar `44px` + main `64px` = `108px`; `position:relative` (not sticky).
- [ ] Desktop bar shows the 7 items (Newsletter drawer-only); the 3 parents (Models/Lifestyle/Škoda World) open single-column dropdowns.
- [ ] Models dropdown = 12 models + Classic Cars + Concepts; Lifestyle = People/Sports/Adventures; Škoda World = 5 topics.
- [ ] Dropdowns are plain single-column link lists (no images/`<br>`-descriptions); open on hover (`.1s`), one open at a time.
- [ ] **Desktop→mobile switch at `1080px`** (not 900).
- [ ] Section switcher (COM-04) reflows correctly: `>=1080` left-aligned pair in the grey topbar; `<=1079` full-width 50/50 centered tab bar (`h44`), still visible on mobile (not hidden), with Subscribe/locales moved into the drawer. Active = white segment/`#000`, inactive = grey/`#7c7d7e`, `14px`/`600`.
- [ ] Hover state matches source (`2px` ink underline) unless reconciled to the EDS green treatment (decision).
- [ ] Brand logo inline SVG (`BRAND_LOGO`); tokens-only CSS; `npm run lint` clean.
- [ ] Visual diff vs source at 1280/1024/768 ≤ 2% per-pixel (closed + Models-open states).

## Dependencies
- Upstream: SKODA-102 (boilerplate scaffold), SKODA-106 (design tokens + global CSS) / Downstream: SKODA-302 (mobile toggle), SKODA-303 (language switcher)

## Risks / Flags
- 🟡 Mega-menu decoration is the only genuinely new work; keep it CSS/JS over nested lists, do not reintroduce the "rich image-grid" assumption corrected in the analysis.
- `[RUNTIME-UNCONFIRMED]`: desktop hover timing and focus management when a panel opens need browser verification.
- Newsletter dropdown in the tools/topbar ties to the deferred newsletter service, keep it off the critical path (placeholder/stub for pilot).
