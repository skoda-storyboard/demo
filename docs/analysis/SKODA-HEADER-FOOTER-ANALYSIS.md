# Škoda Storyboard — Header / Mega-Menu & Footer Structural Analysis

**Companion to:** the `SKODA-*` set. Closes coverage-gap **G1** flagged in `SKODA-ADVERSARIAL-REVIEW-2.md` — chrome was called "build as fragments" in every doc but never structurally analyzed.
**Date:** 2026-09-05
**Method:** read-only. Extracted and mapped the `<header>` and `<footer>` regions from the live homepage + the main JS bundle. No browser (interaction/mobile-render flagged `[RUNTIME-UNCONFIRMED]`), no import, no Git.

---

## 1. Executive Summary

The header and footer are **simpler than earlier reports implied** — good news for the build. The mega-menu is a **plain nested link list** (no images, no descriptions, no per-panel rich content), the footer is largely a **repeat of the same WordPress nav menu** plus social/app/legal, and both map cleanly to the standard EDS **Header/Footer block + `nav`/`footer` fragment** pattern.

**Three findings that matter:**
1. **Mega-menu = nested `<ul>` links only.** 3 top-level sections have children (Models, Lifestyle, Škoda World); the rest are flat links. **Zero images, zero `<br>`-descriptions** in the header — so this is *not* the image-grid megamenu some prior notes assumed. Standard EDS nav can express it.
2. **Mobile toggle is a CSS checkbox-hack with `aria-expanded`=0** — an **accessibility gap** to fix on rebuild (the EDS header block should use a real button + `aria-expanded`).
3. **Footer repeats the nav menu** (same WP menu, ~32 items) + social icons + app-store badges + RSS + a legal bar. It's a fragment, not bespoke — but note it carries a **press-specific "Škoda Media Room" mobile app** (iOS/Android) and a WhatsApp channel.

**Verdict:** Header 🔵 **Adapt** (nav fragment + megamenu CSS/JS + a11y fixes); Footer 🔵 **Adapt** (footer fragment). Neither is a blocker; combined effort **Medium**, lower than the "complex build" the audit feared.

---

## 2. Header / Mega-Menu — Structure

**Region size:** ~17.5 KB of the homepage HTML. **1 `<nav>`, 34 `<li>`, 6 `<ul>`, 50 links.**

### Top-level navigation (with mega-menu triggers)
| Item | Type | Mega-menu? |
|---|---|---|
| **Models** | category | ✅ has-children → panel of **12 models** (Fabia, Scala, Octavia, Superb, Kamiq, Karoq, Kodiaq, Epiq, Peaq, Elroq, Enyaq) + Classic Cars + Concepts |
| eMobility | category | flat link |
| **Lifestyle** | category | ✅ has-children → People, Sports, Adventures |
| **Škoda World** | category | ✅ has-children → Innovation & Technology, Design, Responsibility, Corporate Life, Heritage |
| Series | page | flat link |
| Škodapedia | custom | flat link |
| Podcast | category | flat link |
| Newsletter | custom | flat link (opens topbar newsletter dropdown) |

- **3 mega-menu panels** (Models / Lifestyle / Škoda World), each a nested `<ul class="sub-menu">` of plain links. **No imagery, no descriptions** — contradicts the earlier "rich image-grid megamenu" assumption (correction below).
- **Topbar:** a `right-section` with a **newsletter dropdown** (`topbar__dropdown__newsletter`, inline mailguide form) + the **language switcher** (`lang-links`).
- **Language switcher:** up to **6 locales** (en/cs/de/sk/sr/sl). ⚠️ *Corrected 2026-09-15 (live DevTools, `../ui-specs/_TEMPLATES.md`): the switcher shows only the locales a **given page/item** is translated into, NOT a fixed per-side count — observed 6 on the STO home, 4 on Škodapedia (en/cs/de/sk), 2–3 on a press release/model page. Drive it from available translations; do not hardcode a count.*
- **Brand logo:** inline SVG (per boilerplate `BRAND_LOGO` pattern).

### Behavior (JS)
- Main bundle uses simple **`toggle`** (15 refs) for menu open/close; **no `matchMedia`** branching in the header itself → desktop hover vs mobile is **CSS-driven**, not JS.
- **Mobile menu = CSS checkbox-hack** (1 `type="checkbox"` + `<label for>`), **`aria-expanded` = 0, 4 `<button>`s** but not wired to menu state.
- ⚠️ **Accessibility gap:** checkbox-hack nav without `aria-expanded`/proper button semantics is a known WCAG issue → the EDS rebuild should use a real toggle button with ARIA (a deliberate upgrade).

---

## 3. Footer — Structure

**Region size:** ~9.4 KB. **44 links, 6 `<ul>`, 2 inline SVGs, 0 `<img>`.**

**Sections observed:**
- **`footer-widgets` / `footer-content`** — the main body.
- **`footer-nav`** — **repeats the site's WordPress nav menu** (131 `menu-item` refs = the full nav tree reused, not a bespoke footer menu).
- **`social` / `social-links`** — Facebook, Instagram, YouTube, WhatsApp (icon-font `icon-*` classes, not images).
- **`app-download` / `app-download-badge`** — **"Škoda Media Room" mobile app** links: iOS (`apps.apple.com/.../id420627875`) + Android (`play.google.com/.../com.icomvision.skodamediaservices`) — a **press/journalist app**, plus a WhatsApp channel (`go.skoda.eu/whatsapp`).
- **RSS/feeds** — present (feed links).
- **Legal bar** — Data Protection, Copyright, Cookies policies, Whistleblower system.
- **`copyright-text` / `copyright-notice`** — bottom copyright bar.

The footer is **content, not code** — authored, locale-resolved, and reused across pages.

---

## 4. EDS / DA Mapping

| Element | EDS/DA mechanism | Notes |
|---|---|---|
| Header shell | **Header block** (Block Collection) loaded into `<header>` | boilerplate default |
| Nav content | **`nav` fragment** (DA document) — 3 sections: brand / menu / tools | `/docs/fragments`, block-collection/header |
| Mega-menu panels | Nested `<ul>` in the nav doc → CSS/JS megamenu decoration | plain links only → simple to model |
| Language switcher | Tools section of nav fragment; per-locale links | up to 6 locales, **driven by the page's available translations** (not a fixed count — corrected 2026-09-15); ties to i18n architecture |
| Newsletter dropdown | Small block/embed in the topbar (ties to newsletter service) | keep out of critical path |
| Mobile toggle | **Rebuild with real button + `aria-expanded`** (drop the checkbox-hack) | a11y upgrade |
| Footer shell | **Footer block** loaded into `<footer>` | boilerplate default |
| Footer content | **`footer` fragment** (DA document) | nav repeat + social + app + legal |
| Social / app / RSS | Links + icon-font (→ inline SVG icons in EDS) + feed generation | RSS from the EDS index |
| Legal bar | Fragment content | preserve links |

**Both are per-locale fragments** (one `nav` + one `footer` doc per language), consistent with the i18n architecture in `SKODA-EDS-DA-ARCHITECTURE.md`.

---

## 5. Effort & Risk

| Piece | Fit | Effort | Risk |
|---|---|---|---|
| Header shell + nav fragment | 🔵 Adapt | Low–Med | 🟢 |
| Mega-menu (3 panels, plain links) | 🔵 Adapt | Med (CSS/JS decoration) | 🟡 |
| Mobile toggle a11y rebuild | 🔵 Adapt | Low | 🟢 (upgrade) |
| Language switcher | 🔵 Adapt | Low | 🟢 |
| Footer fragment (nav repeat + social + app + legal) | 🔵 Adapt | Low–Med | 🟢 |

**Combined: Medium** — meaningfully **lower than the "complex build" the audit feared**, because the megamenu has no rich per-panel content. The only real *new* work is decorating 3 nested-list panels and doing the mobile toggle properly with ARIA.

---

## 6. Corrections to Prior Docs

1. **"Mega-menu" was over-described.** Earlier docs (Discovery/Implementation-Review) implied a rich megamenu with panels/imagery; the actual header has **no images and no descriptions** — it's nested link lists. **This lowers header effort.** *(Recommend softening the "megamenu" language where it implies rich panels.)*
2. **Header responsiveness is CSS-driven, not JS** (checkbox-hack) — reinforces the "mostly CSS-only responsive" finding, but adds an **a11y defect** (`aria-expanded` absent) to the WCAG-gap list.
3. **Footer is a nav-menu repeat**, not a bespoke multi-column information architecture — simpler than a typical corporate footer.
4. **New detail:** a **press-specific mobile app** ("Škoda Media Room", iOS+Android) + WhatsApp channel live in the footer — worth noting as brand/press links to preserve.

---

## 7. Open Questions & Residual Unknowns

- **`[RUNTIME-UNCONFIRMED]`:** desktop hover timing, mobile drawer animation, focus management when the megamenu opens, keyboard nav through panels — all need a browser to verify (and to confirm the a11y gap severity).
- **Per-locale nav differences:** whether each locale's nav/footer has the same structure or market-specific items (only EN mapped here).
- **Newsletter dropdown** in the topbar ties to the newsletter service boundary (see complex-systems dossier) — its rebuild depends on that decision.
- **Icon fonts → SVG:** the social icons are an icon-font (`icon-facebook` etc.); EDS convention is inline SVG — a small conversion.

---

## Appendix — Evidence

- Header region: 17.5 KB; 1 nav / 34 li / 6 ul / 50 links; classes incl. `menu-item-has-children` (×3), `sub-menu` (×3), `topbar`, `lang-links`, `topbar__dropdown__newsletter`.
- Top-level items enumerated (8 sections; 3 with children; 12 models under Models); 0 `<img>`, 0 `<br>` in header.
- Mobile toggle: 1 `type="checkbox"`, `aria-expanded`=0, label-for `topbar-newsletter-email` + `mailguide_terms_dropdown`.
- Footer region: 9.4 KB; 44 links / 6 ul / 2 SVG / 0 img; social `icon-facebook|instagram|youtube|whatsapp`; app links (Apple `id420627875`, Google `com.icomvision.skodamediaservices`), WhatsApp `go.skoda.eu/whatsapp`; legal (Data Protection/Copyright/Cookies/Whistleblower); `copyright-notice`; RSS present; 131 `menu-item` refs (full nav reused).
- Main JS: `toggle` ×15, no header `matchMedia`.
- **Limitation:** homepage sample, EN only, anonymous, no browser — interaction/mobile/a11y-severity flagged for a browser follow-up.
