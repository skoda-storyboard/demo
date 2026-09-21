# Component Spec: Tags

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Stress-test re-verified live 2026-09-15 (story + press pages, 500/1024/1280): `.label` box `50.66x21`, padding `5px 10px`, radius `2px`, bg `#7c7d7e`, `#fff`, `11px/600/lh 11px/ls 1.1px/uppercase`, plus the desktop `li{display:block;float:left}` / `text-align:start` -> mobile `li{display:inline-block}` / `text-align:center` flip and the archive vs `?filter[...]` hrefs all matched. No corrections.

## 1. Identity

- **Component:** Tags (the per-article tag/category row; ~83% page coverage on story + press-release
  pages). A secondary "filter chip" (`.tag`) variant exists in facet/media-cart contexts.
- **EDS block:** `tags` (**NEW**, no existing block). Skimmed `cards-media` for pill/icon conventions.
- **Client PDF IDs:** (tag/category row shown across story + press templates).
- **Ticket:** SKODA-205.
- **Source references + selectors:**
  - Story: `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
    · `ol.entry-tags.tag-list` > `li` > `a.label`.
  - Press release: `https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/`
    · `ol.entry-tags.tag-list` > `li` > `a.label`.

## 2. Source anatomy

**Key finding, the live per-article tags render as `a.label`, not `.tag`.** The task brief assumed
items are `.tag`; measurement shows the entry-tags row on both story and press pages is:

```
<ol class="entry-tags tag-list">      list-style:none; margin:0; padding:0; float-based layout
  <li>                                display:block; float:left; margin:0 5px 0 0
    <a class="label" href="…" title="…">2026</a>   the pill/label
  </li>
  <li><a class="label" href="…" title="…">Epiq</a></li>
</ol>
```

The `.tag` class (a green rounded pill / filter chip) belongs to **other contexts** (media-room facet
filters, media-cart buttons, colorbox lightbox); it was **not present** on story, press, category,
media-room, or news pages during capture. Its rules are documented in §5 as the "filter-chip / selected"
variant so the block can support facet reuse, but the built `tags` block should reproduce `.label`.

**Libraries / patterns to retire:** the `float:left` + `:after{clear:both}` clearfix layout (replace with
`flex-wrap` + `gap`), the `!important` color overrides, jQuery `show-hidden-terms` expansion, and the
`#colorbox` scoping. Note `.label`'s `alt`/`title` duplication.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Story URL `…/skoda-epiq…/`,
press `…/superb-25-years…/`. Values identical on both pages and at every viewport (rem/px-based, not
responsive).

### List container (`ol.entry-tags.tag-list`)
- `display: block` (float-based, **not** flex/grid); `margin: 0`; `padding: 0`; `list-style: none`
  (· `…/skoda-epiq…/` · `.tag-list` · 1280).
- `text-align`: `start` at ≥768, `center` at 500 (source rule `.tag-list{text-align:center}` surfaces on
  mobile) (· `.tag-list` · 1280 vs 500).

### List item (`li`)
- `display: block`; `float: left`; `margin: 0 5px 0 0` (· `.tag-list li` · 1280). Item gap ≈ **5px**
  horizontal -> `--spacing-xs` (8px) is the nearest token but not exact; candidate `--tag-gap: 5px`.

### Pill (`a.label`), the built target
- `display: inline-block`; box ≈ **51×21px** (· `.tag-list .label` · 1280).
- `padding: 5px 10px` (· `.label` · all) -> no exact token; candidate `--tag-padding: 5px 10px`.
- `border-radius: 2px` (· `.label` · all) -> **no token** -> candidate `--tag-radius: 2px`.
- `background-color: rgb(124, 125, 126)` = **`#7c7d7e`** (· `.label` · all) -> the **undefined**
  `--skoda-grey-500` (`_FOUNDATIONS` §8 lists `#7c7d7e` as its header.css inline fallback; **define it**).
- `color: rgb(255,255,255)` (`#fff`, set `!important` in source) (· `.label` · all) -> `--skoda-white`.
- `font-size: 11px` (`0.6875rem`) (· `.label` · all) -> **no token** (`--body-font-size-xs` is 13px) ->
  candidate `--tag-font-size: 11px`.
- `font-weight: 600` -> `--weight-semibold`.
- `line-height: 11px` (1.0) (· `.label` · 1280).
- `letter-spacing: 1.1px` (`0.1em`) (· `.label` · 1280) -> candidate `--tag-letter-spacing: 0.1em`.
- `text-transform: uppercase`; `white-space: nowrap`; `border: 0`; `box-shadow: none` (· `.label` · all).

### Linking + href pattern (tags DO link)
- Story tags → **tag archive**: `href="https://www.skoda-storyboard.com/en/tag/model/epiq/"`,
  `href=".../en/tag/years/2026/"` (· `…/skoda-epiq…/` · `a.label` · 1280).
- Press tags → **listing facet**: `href=".../en/news/?filter[years][]=2026"` (· `…/superb…/` · `a.label` · 1280).
- Pattern: `/en/tag/<taxonomy>/<slug>/` (archive) **or** `/en/news/?filter[<taxonomy>][]=<value>` (facet).
  Both are internal links; the block must preserve the authored `href`.

## 4. Responsive behavior

- The pill is **not fluid**: `padding`, `radius`, `font-size` are fixed px/rem at every band
  (11px measured at 1280/1024/768/500). Only the list `text-align` flips to `center` on mobile (500).
- Wrapping: source uses `float:left` so pills wrap to new rows naturally; the rebuild uses
  `display:flex; flex-wrap:wrap; gap:5px` for the same result without clearfix.

## 5. Interaction states

### `.label` (built target), measured base + source-CSS-derived states
- Base: as §3 (grey `#7c7d7e`, white text, radius 2px).
- **Hover / focus** (`a.label:hover`, `a.label:focus`): `text-decoration: underline`, `cursor: pointer`;
  color stays white (`color:#fff!important` on the base rule wins over the `color:inherit` hover rule)
  (source CSS `.tag-list a.tag:hover,a.label:hover{text-decoration:underline}` +
  `…a.label:hover{cursor:pointer;text-decoration:none;color:inherit}`, later `underline` wins for
  text-decoration). **No background change** on `.label` hover (the green hover is scoped to `.tag`).
- Active / selected: `.label` has no distinct active/selected state in source.
- **A11y upgrade:** add a visible `:focus-visible` ring (source relies on the default outline).

### `.tag` filter-chip / selected variant (facet contexts, from source CSS, for reuse)
Documented so the block can serve facet chips; **not** the per-article default. Two source shapes:
- **Green pill:** `border-radius: 2em; padding: .875rem 1.5rem; background:#78faae; color:#161718;
  font-size:1rem; display:inline-flex; justify-content/align:center`
  -> `--skoda-green-emerald` / `--skoda-ink`; `2em` radius -> candidate `--pill-radius` (note
  `card-teaser.md` proposes `50px` for a different pill, reconcile).
  - hover / focus / active / `.active`: `background:#a8ffcc` -> candidate `--skoda-green-emerald-hover`
    (already flagged in `card-teaser.md`).
- **Outlined chip:** `background:transparent; color:#000; box-shadow: inset 0 0 0 1px rgb(0 0 0 /.15);
  border-radius:.2em`; on hover / focus / active / `.active`: `background:#78faae; color:#fff;
  box-shadow:none`. `.active.tag` = the **selected** state.

## 6. Accessibility

- Each tag is a link with an accessible name (the tag text). Preserve `title` only if it differs from the
  visible text; otherwise drop it to avoid a redundant tooltip.
- The row is a list: keep `<ul>`/`<ol>` + `<li>` semantics so AT announces "list, N items".
- Add `:focus-visible` outline (source uses `outline:0` on the shared button/chip rule, reverse it).
- Selected facet chips (`.active`) should expose `aria-current="true"` (or `aria-pressed` if a toggle),
  which the source omits.
- Ensure `#7c7d7e` grey + white text meets contrast (≈ 3.9:1 for 11px bold, **below** 4.5:1). Flag: the
  source grey/white pill is a borderline AA failure at this size; recommend darkening to `--skoda-ink`
  background or enlarging text (open decision §8).

## 7. EDS target

Block: `tags` (NEW). Author as a list of tag links; count-agnostic. Follow repo conventions
(`_FOUNDATIONS` §7): rows → `<ul>/<li>`, content sniffing (cell with `<a>` = linked tag; plain text =
static label), defensive decoration (skip empty cells), tokens-only CSS scoped to `.tags`.

### DA authoring table (worked examples)

`Tags`, one row, each cell (or each `<a>`) a tag:
| [2026](/en/tag/years/2026/) | [Epiq](/en/tag/model/epiq/) |
|-----------------------------|-----------------------------|

Alternatively one cell holding several links (comma or newline separated) → each `<a>` becomes a pill.

Variant `Tags (chips)` → the green filter-chip style (§5) with an `.active` selected state, for
facet/listing reuse.

### decorate() outline (new block)

1. `const ul = document.createElement('ul'); ul.className = 'tags-list';`
2. Collect all `<a>` (and bare text nodes) from `block` cells; for each, create
   `<li><a class="tag-label" href=…>text</a></li>` (linked) or `<li><span class="tag-label">text</span></li>`
   (static). Optional-chain missing hrefs.
3. Drop empty cells / whitespace-only entries (`.label:empty{display:none}` in source).
4. `if (block.classList.contains('chips')) …` → apply the green-pill/outlined-chip variant; read an
   `active` marker (e.g. `**text**` in `<strong>`) → `.active` + `aria-current="true"`.
5. `block.replaceChildren(ul);` Scope CSS to `.tags`; layout `display:flex; flex-wrap:wrap; gap:5px`.

## 8. Open decisions + recommended default

- **`.label` vs `.tag`:** recommend building the per-article default to the **measured `.label`** (grey
  `#7c7d7e`, 2px radius, 11px uppercase) and treating the green `.tag` pill as an opt-in `chips` variant
  (assumption to confirm, the ticket brief assumed `.tag`).
- **Contrast fix:** recommend swapping the grey pill background to `--skoda-ink` (or keep grey but bump
  text to 12–13px) to clear AA at small sizes (assumption to confirm).
- **New tokens** (assumption to confirm): define `--skoda-grey-500: #7c7d7e`; add `--tag-radius: 2px`,
  `--tag-padding: 5px 10px`, `--tag-font-size: 11px`, `--tag-letter-spacing: 0.1em`, `--tag-gap: 5px`;
  reconcile `--pill-radius` (`2em` here vs `50px` in `card-teaser.md`) and reuse
  `--skoda-green-emerald-hover: #a8ffcc` for the chip variant.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Item type: per-article tags render as grey labels (`.label` parity), not green pills · `.tags a` · all.
- [ ] Pill box: `padding = 5px 10px`, `border-radius = 2px` · `.tags a` · all.
- [ ] Pill color: background `#7c7d7e` (`--skoda-grey-500`), text `#fff`, `text-transform: uppercase` · all.
- [ ] Pill type: `font-size 11px / weight 600 (--weight-semibold) / line-height 1 / letter-spacing 0.1em` · all.
- [ ] Layout: pills wrap; horizontal gap ≈ `5px`; list semantics preserved (`ul`/`li`) · all.
- [ ] Linking: each tag is an `<a>` with the authored `href` (tag-archive or `?filter[…]` facet) · all.
- [ ] Hover: `.tags a:hover` = underline, cursor pointer, no background change · all.
- [ ] Chips variant: green pill `background #78faae / radius 2em / color #161718`; hover/active `#a8ffcc`;
      selected `.active` present · when `Tags (chips)`.
- [ ] Mobile alignment: list `text-align: center` at <768 · `.tags` · 500.
- [ ] A11y: `:focus-visible` ring; selected chip `aria-current`; grey/white contrast reviewed (≥ 4.5:1
      target, see §8 open decision).
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel.

## 10. Reference screenshots

`assets/tags/`: `story-tags-1280.png` (the `entry-tags` `.label` row on a story detail page). Press-release
tags render identically (same `a.label` markup, facet hrefs).
