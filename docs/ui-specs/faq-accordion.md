# Component Spec: FAQ / Accordion

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
`media-room-515d2d102b.css` `.row-title` rules; open + closed states measured; screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** FAQ accordion, the collapsible question/answer list on a press kit (and a reusable
  accordion for any collapsible content, e.g. exec bios, spec groups). Live on the Peaq kit's FAQ page
  as a **SiteOrigin `row-toggle`** accordion (28 questions).
- **EDS block:** `accordion` (**NEW**, not in the local inventory, flagged in `SKODA-MASTER` §91).
- **Client PDF IDs:** MR-PK05 (Press-Kit FAQ); requirements §11.10.
- **Ticket:** SKODA-807.
- **Source references (URL used):**
  `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/frequently-asked-questions/`
  (reached from the kit landing "Frequently Asked Questions" tile + chapter-nav).
- **Top-level selectors:** `.so-panel.widget_ys-row-toggle` (one Q/A item; gains `.active` when open),
  `h2.row-title > span` (the trigger + `::after` icon), `.widget_siteorigin-panels-builder` (the answer
  panel, `display:none` when collapsed).

## 2. Source anatomy

```
.panel-grid.panel-no-style
└── .panel-grid-cell
    ├── .so-panel.widget_ys-row-toggle   (a Q/A item; toggles class .active when open)
    │   └── h2.row-title                  the TRIGGER (flex; space-between; cursor pointer)
    │       └── span                      question text (flex:1) + ::after icon (right)
    └── .so-panel.widget_siteorigin-panels-builder   the ANSWER panel
        └── .textwidget > p               rich-text answer (display:none until open)
```

Each question is an `<h2 class="row-title">` whose sibling builder panel is the answer. Clicking the
title toggles `.active` on the `.widget_ys-row-toggle` wrapper and shows/hides the answer. The icon is an
**icon-font glyph `\e027`** (a plus) on `span::after` that **rotates 45° on open**.

**No `<details>`, no `role=tab/region`, no `aria-expanded`** in source (a11y gaps to fix). **No FAQPage
structured data** was found on the page (`ld+json` present is `WebPage` only; no `FAQPage`/`acceptedAnswer`), 
a gap the rebuild must add.

**Libraries / patterns to retire:** SiteOrigin `ys-row-toggle` widget + its jQuery toggle, the icon-font
glyph (`\e027`), the `panels-builder` answer wrapper. Rebuild as one accessible vanilla accordion.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. Source = the FAQ page above.

### Trigger (`h2.row-title`)
- `display:flex; align-items:center; justify-content:space-between; cursor:pointer`
  (· source CSS `.row-title`).
- `font-size:1rem` (**16px**) / `line-height:18px` / `font-weight:600` / `color:#161718`
  (· `.row-title` · 1280) → `--body-font-size-m` (16px), `--weight-semibold`, `--skoda-ink`.
- `background:#fff` → `--skoda-white`; `border-top:1px solid #e4e4e4` + `border-bottom:1px solid #e4e4e4`
  (· source CSS) → reuse candidate `--divider-color: #e4e4e4` (`_FOUNDATIONS` §8).
- `padding:1.5rem` (**24px**) → `--spacing-l` (24px); `margin:0`. Measured trigger box `812×68` @1280.
- `.row-title` between items: `margin-top:2rem` (collapsed spacing), `margin-top:0` when adjacent (source CSS).

### Trigger text (`.row-title > span`)
- `flex:1 0 auto; max-width:100%; padding-right:1.45em; position:relative` (· source CSS).

### Icon (`.row-title > span::after`)
- `content:"\e027"` (plus glyph), `font-family:skoda-bnr-icons`, `font-size:1rem`, `font-weight:600`,
  `color:#161718`; positioned `right:0; top:50%; transform:translate3D(0,-50%,0)`; `padding:.5em`;
  `border-radius:50%` (round hit area) (· source CSS `.row-title>span:after`).
- **Open state:** transform adds `rotate(45deg)` (measured matrix `0.707,0.707,-0.707,0.707`) →
  the plus becomes an ×; `transition:transform .2s ease-in` (· measured, open item).
- **Hover:** `background:rgba(22,23,24,.0588)` on the icon (· source CSS `.row-title:hover span:after`).
- Rebuild → replace the icon-font glyph with an SVG chevron/plus + `aria-hidden`.

### Answer panel (`.widget_siteorigin-panels-builder`)
- Collapsed: `display:none; height:0` (· measured, item closed).
- Open: `display:block; height:auto` (measured `812×136` for the first answer) (· measured, item open).
- Answer text = rich text (`p` 16px/24px per story-detail.md prose scale).

## 4. Responsive behavior

- The accordion is not fluid: trigger `16px / weight 600`, padding `24px`, dividers `1px #e4e4e4` are
  fixed at every band (rem/px based). The trigger spans the reading column width (`812px` @1280 in the
  `.column-primary`; full width on the standalone FAQ page).
- Answer height animates on toggle (source uses `display` swap; the rebuild should animate `max-height`
  or `grid-template-rows` for a smooth expand while respecting `prefers-reduced-motion`).

## 5. Interaction states

- **Collapsed (default):** all answers `display:none`; icon = plus.
- **Expand:** click the trigger → wrapper gains `.active`, answer `display:block`, icon rotates 45°
  over `.2s ease-in`. Source allows **multiple open at once** (independent toggles, no single-open
  accordion group behavior observed). Re-verified live 2026-09-15 by scripting clicks: open icon
  `::after` transform = `matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, -16)` (45° rotate + the
  `translateY(-16)` centering); first answer panel opens to `812 × 136`; opening a second item leaves
  the first `.active` (multi-open confirmed).
- **Icon hover:** subtle tint `rgba(22,23,24,.0588)` on the round icon.
- **Collapse:** click the open trigger again → `.active` removed, answer hidden, icon rotates back.
- **Keyboard (rebuild):** Enter/Space on the trigger toggles; the source `h2 > span` click target is not
  keyboard-operable (a11y gap).

## 6. Accessibility (HARD GATE)

Source ships an `<h2>`-as-clickable with no ARIA and no keyboard support. The rebuild MUST:
- Make each trigger a real `<button aria-expanded="true|false" aria-controls="{answerId}">` **inside** the
  heading (`<h3><button>…</button></h3>`), so the heading structure and the control both exist.
- Give each answer panel `id` + `role="region" aria-labelledby="{triggerId}"`; `hidden` when collapsed.
- **Keyboard:** Enter/Space toggles; Tab moves between triggers; (optional) Up/Down arrows + Home/End move
  between headers per the WAI-ARIA accordion pattern.
- Visible `:focus-visible` ring on every trigger (source relies on browser default).
- Icon is decorative (`aria-hidden`); open/closed state conveyed by `aria-expanded`, not icon rotation alone.
- Respect `prefers-reduced-motion` (no rotate / height animation).
- **FAQPage structured data:** emit `application/ld+json` `FAQPage` with `mainEntity` `Question` /
  `acceptedAnswer` `Answer` for each Q/A (absent in source; a search-visibility upgrade).

## 7. EDS target

**New block `accordion`** (default = FAQ). DA authoring: one row per Q/A, cell 1 = question, cell 2 =
answer (rich text). A `Accordion (faq)` variant emits FAQPage JSON-LD.

### DA authoring table (worked example)

| What is the Škoda Peaq? | The Škoda Peaq is the new flagship and brand shaper… |
| How much will the Peaq cost? | Pricing will be announced closer to launch… |
| What is the electric range? | Up to … km (WLTP). |

Variants: `Accordion (faq)` → adds FAQPage JSON-LD + FAQ semantics; `Accordion (single)` → single-open
group (only one panel open at a time); default = independent multi-open (matches source).

### `decorate()` outline (repo conventions, `_FOUNDATIONS` §7)

1. Rows → items: for each row, cell 1 = question text, cell 2 = answer content (content-sniff; skip empty
   rows defensively).
2. Build `<h3><button aria-expanded="false" aria-controls="acc-<i>-panel" id="acc-<i>-btn">{question}
   <span class="accordion-icon" aria-hidden="true"></span></button></h3>` + `<div id="acc-<i>-panel"
   role="region" aria-labelledby="acc-<i>-btn" hidden>{answer}</div>`.
3. Click / Enter / Space toggles `aria-expanded` + `hidden` (+ `.active` for CSS); animate `max-height`
   under a `prefers-reduced-motion` guard. Single-open variant closes siblings.
4. If `faq` variant: collect Q/A text, build a Trusted-Types-safe `FAQPage` JSON-LD `<script>` (per
   `_FOUNDATIONS` §7 security).
5. CSS scoped to `.accordion`; tokens only (trigger `--body-font-size-m`/`--weight-semibold`/`--skoda-ink`,
   dividers `--divider-color`, padding `--spacing-l`, icon rotate `.2s ease-in`).

## 8. Open decisions + recommended default

- **Per-kit authored vs shared pool, RESOLVED → per-kit authored (default).** Evidence: the Peaq FAQ is
  a **kit-specific page** of model questions (`postid-445921`, questions all about the Peaq) authored inline
  as `row-toggle` items, not pulled from a shared FAQ pool. Recommend **per-kit authored** Q/A as the
  default (each kit owns its FAQ). A shared-pool / tagged-reuse model can be a later enhancement if the
  client wants cross-kit FAQ reuse (assumption to confirm).
- **Open behavior:** source allows **multiple panels open at once** (independent toggles). Recommend
  keeping multi-open as the default; offer a `single` variant.
- **Structured data:** add `FAQPage` JSON-LD (absent in source) for the `faq` variant.
- **Tokens:** reuse `--body-font-size-m: 16px`, `--weight-semibold`, `--skoda-ink`, `--skoda-white`,
  `--spacing-l: 24px`; define/reuse `--divider-color: #e4e4e4` (`_FOUNDATIONS` §8); icon transition
  `transform .2s ease-in`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Trigger: `.accordion button` / all / `16px / 18px / weight 600 / #161718`; flex space-between;
      `padding 24px`; `border-top/bottom 1px #e4e4e4`; bg `#fff`; cursor pointer.
- [ ] Icon: trigger `::after`/SVG / all / plus icon right, round hit area; **rotates 45° on open** over
      `.2s ease-in`; hover tint `rgba(22,23,24,.0588)`.
- [ ] Collapsed: answer `hidden` (`display:none`), icon = plus, `aria-expanded=false`.
- [ ] Expand: click/Enter/Space → answer visible, icon rotated, `aria-expanded=true`; smooth height
      animation (unless `prefers-reduced-motion`).
- [ ] Multi-open: opening a second item does not close the first (default variant).
- [ ] **A11y GATE:** each trigger is a `<button aria-expanded aria-controls>` inside a heading; answer is
      `role=region aria-labelledby`; Enter/Space toggles; visible `:focus-visible`; icon `aria-hidden`;
      state not icon-only. (Blocking.)
- [ ] Structured data: `faq` variant emits valid `FAQPage` JSON-LD (Q/A pairs), validates in Rich Results.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel.

## 10. Reference screenshots

`assets/faq-accordion/`: `faq-open-1280.png` (the Peaq FAQ with the first question expanded: `row-title`
triggers, `#e4e4e4` dividers, rotated icon, rich-text answer). Closed-state + mobile captures pending.
