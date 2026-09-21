# Component Spec: Social Share

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS confirmed by curl; screenshots at 1280).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Cross-ref: [`footer.md`](footer.md) (site-level brand social set, already measured, reused not re-measured here).

## 1. Identity

- **Component:** Page/story-level social **share** control, a floating trigger that expands into a
  row of per-network share links. Distinct from the footer **follow** links (brand profiles).
- **EDS block:** new `social-share` (`blocks/social-share/*`), build-ready target below.
- **Client PDF IDs:** COM-15 (Share); STO-D10 (story share). Network set per requirements PDF §8.11.
- **Ticket:** COM-15 / STO-D10.
- **Source reference:** `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
, trigger `.btn-group.social a.btn.icon-share`, expanded menu `.btn-group.social .social-container`.
- **Source CSS:** `https://cdn.skoda-storyboard.com/dist/26.8.1/skoda-bnr-web/dist/styles/media-room-515d2d102b.css`.

**Site-level vs page-level (important distinction):**
- **Site-level (footer, follow):** black `40px` circles linking to Škoda brand *profiles*
  (Facebook / Instagram / YouTube / WhatsApp). See [`footer.md`](footer.md) §3, do not rebuild here.
- **Page-level (this spec, share):** a floating button that expands into *share-intent* links for the
  current URL (X / Pinterest / LinkedIn / Facebook / WhatsApp). Different set, different purpose.

## 2. Source anatomy

```
.btn-group.social(.color)                     floating group (fixed/sticky, bottom-right)
├── a.btn.icon.icon-share                      TRIGGER (share glyph \e02e)
└── .social-container                          expandable menu (flex column-reverse)
    ├── a.btn.icon.icon-x        [data-ctatype=X]          twitter.com/intent/tweet
    ├── a.btn.icon.icon-pinterest[data-ctatype=Pinterest]  pinterest.com/pin/create/bookmarklet
    ├── a.btn.icon.icon-linkedin [data-ctatype=Linkedin]   linkedin.com/shareArticle
    ├── a.btn.icon.icon-facebook [data-ctatype=Facebook]   facebook.com/dialog/share (app_id)
    └── a.btn.icon.icon-whatsapp [data-ctatype=Whatsapp]   whatsapp://send  (mobile-only)
```

Each share link carries `target="_blank"` and a fully-built intent URL (current page URL + title
URL-encoded) plus a `data-ctatype` analytics hook. Expansion is toggled by adding `.expanded` to
`.btn-group.social` (source: jQuery click).

Related share surfaces (out of this block's scope, cross-referenced): `.sb-gallery-share`
(gallery lightbox dropdown, see `gallery-lightbox.md`), `.skoda-embed-share` (embed/iframe share modal,
see `embeds.md`). The `.round-icon` / `.sticky-button` scroll-top + downloads buttons share the same
pill styling.

**Float container varies per template (verified live 2026-09-15):** two implementations exist. Story
pages use `.btn-group.social` (compact float, `bottom:30px; right:7em` @1280, see §3). Press-kit /
Media-Room detail pages instead render a single **horizontal `.sticky-buttons` bar**
(`position:fixed; bottom:8px; right:16px; z-index:1000`, ~`384×70`) that lays the share toggle + 5
social links + the [`media-cart`](media-cart.md) button + `scroll-top` out in one inline row. The EDS
rebuild should pick one float model for both; recommend the inline bar (it groups all global page
actions together and is easier to keep clear of the cookie banner).

**Libraries / patterns to retire:** jQuery toggle; icon-font `skoda-bnr-icons` glyphs
(`\e02e` share, per-network glyphs); Bootstrap `.btn-group` + jQuery-UI `.ui-dialog-buttonset`
(both selectors are aliased in source CSS). Replace glyphs with inline SVG (`:name:` →
`decorateIcons`); prefer the native Web Share API (`navigator.share`) with the intent links as
fallback.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Source URL for every row is the Epiq
story above. Source-CSS refs point to the curled `media-room-*.css`.

### Group container (`.btn-group.social`)
- `position:fixed` (base rule), floated bottom-right; z-index `1000`; `pointer-events:none` on the
  wrapper (children re-enable) (· source CSS `.btn-group.social{position:fixed;…z-index:1000;pointer-events:none}`).
- offset: `bottom:30px; right:7em` @1280 (measured); `bottom:20px; right:4.9em` @768;
  `bottom:40px; right:4.9em` @500 (· measured across bands; source CSS has `bottom:40px;right:4.9em`
  base, `bottom:20px;right:4.9em` and `bottom:30px;right:7em` media overrides).

### Trigger (`a.btn.icon.icon-share`)
- On the story page it renders in the `.sticky-button`/`.round-icon` presentation: background `#fff`
  -> `--skoda-white`; color `#161718` -> `--skoda-ink`; border-radius `4px`; box-shadow
  `0 3px 8px rgba(0,0,0,.15)`; size **`3.625rem` (`58×58px`) @1280** / **`40×40px` @768 and @500**
  (· measured; source CSS `.sticky-button …a.btn.icon-share{width:2.5rem;height:2.5rem}` then
  `{width:3.625rem;height:3.625rem}` at wider bands). Share glyph `\e02e`, font-size `1.5rem`.
- The bare (non-sticky) trigger rule is background `rgba(22,246,115,.8)` (translucent emerald),
  box-shadow `0 5px 25px rgba(0,0,0,.25)` (· source CSS `.btn-group.social .btn.icon-share`). Use the
  white sticky presentation as the built default (measured live), emerald as the alt.

### Expanded menu (`.social-container`)
- collapsed: `opacity:0; visibility:hidden; pointer-events:none`, `transform:translateX(15%)`
  (· 1280 measured); flex, `flex-direction:column-reverse` (buttons stack upward from the trigger).
- expanded (`.btn-group.social.expanded .social-container`): `opacity:1; visibility:visible;
  pointer-events:all; transform:translateX(0)` (· source CSS).
- transition: collapse `all .4s cubic-bezier(.55,-.59,.2,.37) .2s`; expand
  `all .2s ease-out .2s` (· source CSS).

### Per-network buttons (`.social-container a.btn.icon-<network>`)
- size `3.625rem` (`58×58px`) @1280 / `40×40px` @768 / @500 (· measured); border-radius `4px`;
  color `#fff` -> `--skoda-white`; padding `.5em`.
- **Brand backgrounds (measured live + source CSS):**
  - X (Twitter) `icon-x`: `#000` (first item, margin `0 .5rem 0 0`) -> `--skoda-ink`-ish / candidate `--social-x:#000`.
  - Pinterest `icon-pinterest`: `#cb2027` -> candidate `--social-pinterest`.
  - LinkedIn `icon-linkedin`: `#0a66c2` -> candidate `--social-linkedin`.
  - Facebook `icon-facebook`: `#3b5998` -> candidate `--social-facebook` (matches footer.md).
  - WhatsApp `icon-whatsapp`: `#43d854` -> candidate `--social-whatsapp` (matches footer.md).
- Full source palette (available, unused on this page): twitter `#00aced`, googleplus `#dd4b39`,
  instagram `#125688`, rss `#ff7900`, vimeo `#00bf8f`, youtube `red`, download `#b00`.

### Share intent hrefs (measured)
- X: `https://twitter.com/intent/tweet?url={URL}&text={TITLE}`
- Pinterest: `https://pinterest.com/pin/create/bookmarklet?url={URL}&media={IMG}&description={TITLE}`
- LinkedIn: `https://linkedin.com/shareArticle?mini=true&url={URL}&title={TITLE}&summary={TITLE}`
- Facebook: `https://www.facebook.com/dialog/share?href={URL}&app_id=1300185317518957`
- WhatsApp: `whatsapp://send?text={TITLE} - {URL}`

## 4. Responsive behavior

- **Button size:** `58px` (`3.625rem`) at desktop (≥ ~1080), `40px` at tablet/mobile
  (measured 768 and 500). Rebuild: `58px` desktop, `40px` below `992`.
- **Offset:** `right:7em`/`bottom:30px` desktop; `right:4.9em` with `bottom:20px` (tablet) and
  `bottom:40px` (mobile). Keep clear of other fixed UI (cookie banner, scroll-top).
- **WhatsApp:** present in the DOM but `display:none` at `500` (measured), source shows it only on
  touch/mobile (the `whatsapp://` scheme). Rebuild: show WhatsApp only on coarse-pointer/mobile.
- **Direction:** menu expands **upward** (`column-reverse`) from the trigger; ensure it never
  overflows the viewport top on short screens.

## 5. Interaction states

- **Trigger click:** toggles `.expanded` on `.btn-group.social` → menu fades/slides in
  (`.2s ease-out .2s`), out over `.4s`. Trigger itself has `transition:all .2s ease-in-out`.
- **Network hover:** `.btn:hover` color `rgba(255,255,255,.7)`; `icon-x:hover` color `#ccc`
  (· source CSS). Backgrounds stay brand-colored.
- **Focus:** source sets no visible focus ring (a11y regression), add `:focus-visible` in rebuild.
- **Click network:** opens the intent URL in a new tab (`target=_blank`); fire the `data-ctatype`
  analytics event.

## 6. Accessibility

- Trigger: real `<button>` with `aria-label="Share this story"`, `aria-expanded`, `aria-controls`
  pointing at the menu; `Esc` collapses; focus returns to trigger on close.
- Menu: `role` group / list of links, each an `<a>` with an accessible name
  (`aria-label="Share on X"` etc.) since they are icon-only. Convert icon-font glyphs to inline SVG.
- Keyboard: trigger reachable + toggle on Enter/Space; arrow or tab through the revealed links;
  collapsed links must be `inert`/not focusable (`pointer-events:none` alone is not enough).
- Add visible `:focus-visible` rings (source has none).
- Contrast: white glyph on each brand color, verify (X `#000` ok, Pinterest/FB/LinkedIn ok;
  WhatsApp `#43d854` white glyph ≈ 1.7:1 fails, use a darker glyph or outline for WA).
- Prefer `navigator.share()` where available (one accessible button) with the per-network list as a
  progressive-enhancement fallback.

## 7. EDS target

Block: new `social-share`. Content is index/URL-driven (share targets are the *current* page), so the
block needs little authored input, a variant flag and optional network subset. Follow repo
conventions (`_FOUNDATIONS` §7): `decorate(block)`, CSS scoped to `.social-share`, `:name:` icons →
`decorateIcons`, Trusted-Types-safe if any `innerHTML`.

### DA authoring table (worked example)

`Social share`:
| networks                          |
|-----------------------------------|
| x, pinterest, linkedin, facebook, whatsapp |

(Empty/omitted cell → default set from PDF §8.11. A `Social share (inline)` variant renders in-flow
under the article header instead of floating.)

### decorate() outline

```
export default function decorate(block) {
  const set = readList(block) || ['x','pinterest','linkedin','facebook','whatsapp'];
  const url = window.location.href;
  const title = document.title; // or getMetadata('og:title')
  const img = getMetadata('og:image');
  block.textContent = '';
  const trigger = button({ariaLabel:'Share this story', ariaExpanded:false}, icon('share'));
  const menu = ul(); // aria-hidden until expanded
  set.forEach(n => menu.append(li(a({href: intentURL(n,{url,title,img}), target:'_blank',
                 rel:'noopener', ariaLabel:`Share on ${label(n)}`, dataset:{ctatype:label(n)}}, icon(n)))));
  trigger.addEventListener('click', () => block.classList.toggle('expanded'));
  // Esc closes + focus return; :focus-visible via CSS; WhatsApp only on (pointer:coarse)
  block.append(trigger, menu); decorateIcons(block);
  if (navigator.share) { /* progressive enhancement: single native-share button */ }
}
```

Reuse notes: brand-color tokens are shared with `footer.md`; icon SVGs (`:facebook: :whatsapp:` …)
already exist in the icon set. `intentURL()` is a small pure helper (unit-testable).

## 8. Open decisions + recommended default

- **Placement:** recommend a **floating bottom-right** control (matches source) with an **inline**
  variant under the article header for stories. Assumption to confirm which the client wants primary.
- **Network set:** default to PDF §8.11, **X, Pinterest, LinkedIn, Facebook, WhatsApp** (matches the
  measured live set). Confirm whether to add Email/Copy-link (common modern additions).
- **Native share:** recommend `navigator.share()` as the primary path on supporting browsers, intent
  links as fallback (fewer popups, better mobile UX). Assumption to confirm.
- **Trigger style:** recommend the measured **white pill** (`#fff`, radius `4px`, shadow
  `0 3px 8px rgba(0,0,0,.15)`) over the translucent-emerald alt. Confirm brand preference.
- **New tokens** (assumption to confirm): `--social-share-size-desktop:58px`,
  `--social-share-size-compact:40px`, `--social-x:#000`, `--social-pinterest:#cb2027`,
  `--social-linkedin:#0a66c2`; reuse `--social-facebook:#3b5998`, `--social-whatsapp:#43d854`
  from footer.md, and `--card-radius`-adjacent `4px` (candidate `--icon-btn-radius:4px`).

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Trigger: `.social-share button` / ≥1080 / `58×58`, radius `4px`, bg `#fff`, shadow
      `0 3px 8px rgba(0,0,0,.15)`; / <992 / `40×40`.
- [ ] Menu expand: `.social-share.expanded` / all / links fade/slide in over ~`.2s`, collapse ~`.4s`;
      `column-reverse` (expands upward).
- [ ] Network set: exactly X, Pinterest, LinkedIn, Facebook, WhatsApp (per §8.11), each an `<a>`
      `target=_blank rel=noopener` with a correct intent URL for the current page.
- [ ] Brand colors: X `#000`, Pinterest `#cb2027`, LinkedIn `#0a66c2`, Facebook `#3b5998`,
      WhatsApp `#43d854`; white glyphs.
- [ ] WhatsApp: shown only on coarse-pointer/mobile; hidden on desktop pointer.
- [ ] Hover: network `:hover` glyph `rgba(255,255,255,.7)` (X → `#ccc`).
- [ ] Offset: floating group clears the cookie banner + scroll-top; bottom-right per band.
- [ ] A11y: trigger `aria-label` + `aria-expanded` + `aria-controls`; `Esc` closes + focus returns;
      each link labelled; `:focus-visible` ring; collapsed links not focusable; WA contrast fixed.
- [ ] Site-level vs page-level: footer follow-links unchanged (footer.md); this block is share-only.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding SVG glyph rendering).

## 10. Reference screenshots

`assets/social-share/`, `1280-share-trigger.png` (floating trigger, collapsed). Expanded + 768/mobile
pending (source toggles `.expanded` via JS + the `whatsapp://` link suppresses on desktop).
