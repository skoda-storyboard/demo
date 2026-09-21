# E03 — Chrome Fragments (Phase A)

## Goal
Stand up the site chrome — header/mega-menu and footer — as EDS **Header/Footer blocks driven by `nav` and `footer` fragment documents** (DA docs), plus the accessibility and i18n concerns that ride on the nav. The structural analysis found the chrome is **simpler than earlier reports feared**: the mega-menu is 3 nested-list panels with **no imagery and no descriptions**, and the footer is largely a repeat of the same nav menu plus social/app/legal. Both map cleanly to the standard Block Collection Header/Footer + fragment pattern; the only genuinely *new* work is decorating the 3 nested-list panels and rebuilding the mobile toggle properly with ARIA.

## Phase
**A — capability pilot (EN).** All four tickets are pilot-scoped and locale-resolved per-fragment (one `nav` + one `footer` doc per language; EN mapped for the pilot).

## Tickets
- **SKODA-301 — Header + mega-menu (3 nested-list panels) fragment+block.** Header block loaded into `<header>` + `nav` DA fragment (brand / menu / tools sections); decorate 3 mega-menu panels (Models → 12 models + Classic Cars + Concepts; Lifestyle → People/Sports/Adventures; Škoda World → 5 topics) as plain nested `<ul>` links — no images, no rich panels. — deps 102,106 — 5SP — Y
- **SKODA-302 — Mobile nav toggle with ARIA.** Rebuild the source's CSS checkbox-hack (which ships `aria-expanded`=0, unwired) as a **real `<button>` with proper `aria-expanded`/ARIA state** — a deliberate WCAG accessibility upgrade over the source. — deps 301 — 2SP — Y
- **SKODA-303 — Language switcher (6 locales).** The 6-locale (en/cs/de/sk/sr/sl) switcher in the nav **tools** section, wired to per-locale link targets. — deps 301 — 2SP — Y
- **SKODA-304 — Footer fragment.** `footer` DA fragment loaded into `<footer>`: nav-menu repeat + social (FB/IG/YT/WhatsApp) + app-store badges ("Škoda Media Room" iOS/Android app) + legal bar + brand SVG. Icon-font → inline SVG conversion. — deps 102,106 — 3SP — Y
- **SKODA-305 — Media Room footer variant** (2SP, **M1**) — the Media Room footer differs from the Storyboard footer (confirmed 2026-09-14 call); a second `footer` fragment (or a unified one if the client agrees to unify). Closes traceability gap G1 (COM18). — deps 304,301 — 2SP — Y

## Effort Roll-up
| Ticket | Type | SP | AI-assisted | Manual |
|---|---|---|---|---|
| SKODA-301 | fragment+block | 5 | 2–3d | 4–6d |
| SKODA-302 | block | 2 | 1d | 1–2d |
| SKODA-303 | fragment | 2 | 1d | 1–2d |
| SKODA-304 | fragment | 3 | 1–2d | 2–4d |
| SKODA-305 | fragment | 2 | 1d | 1–2d |
| **Total** | | **14 SP** | **6–8d** | **9–16d** |

*(Planning estimates, not a quote.)*

## Source-Doc Traceability
- **`SKODA-HEADER-FOOTER-ANALYSIS.md`** — §2 header/mega-menu structure (8 top-level items, 3 with children, 12 models under Models; 0 `<img>`/0 `<br>`), §2 mobile checkbox-hack + `aria-expanded`=0 a11y gap, §2 language switcher (6 locales in topbar), §3 footer structure (nav repeat + social + Škoda Media Room app + legal + brand SVG), §4 EDS/DA mapping table, §6 corrections (mega-menu is nested link lists, not rich image grid).
- **`SKODA-EDS-DA-ARCHITECTURE.md`** — §3 Blocks table (Header/Footer/nav → Block Collection Header/Footer as fragments), §5 "Chrome as fragments" (`nav`/`footer` DA docs, one source, CDN-cached, locale-resolved), §9 i18n (per-locale content trees, 6 locales), §11 accessibility (rebuild interactive chrome to WCAG).
