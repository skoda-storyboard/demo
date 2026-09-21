# Component Spec: Newsletter

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS confirmed by curl; screenshots at 1280).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Related: [`footer.md`](footer.md) (Newsletter is a hidden footer-nav category), [`header-megamenu.md`](header-megamenu.md) (topbar host).

## 1. Identity

- **Component:** Newsletter subscribe (email capture + consent). Two live presentations: a **topbar
  dropdown** (site-wide, in the header) and an **inline sidebar widget** (story/press pages).
- **EDS block:** `newsletter-stub` (`blocks/newsletter-stub/newsletter-stub.{js,css}`), **UI-only**
  for the pilot, no ESP wiring (see §8).
- **Client PDF IDs:** COM-16 (Newsletter signup); COM-904 is the production subscriber service.
- **Ticket:** SKODA-D05 / COM-16 (M1 UI-only stub); real service E09 / COM-904 (deferred).
- **Source references:**
  - Topbar dropdown: `https://www.skoda-storyboard.com/en/`, trigger `.topbar__newsletter`,
    panel `.topbar__dropdown__newsletter` (form `data-form-code="NewsletterFormHeader"`).
  - Inline widget: `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
, `.sidebar .newsletter-subscribe-widget` (form `data-form-code="NewsletterFormShortcode"`).
- **Source CSS:** `https://cdn.skoda-storyboard.com/dist/26.8.1/skoda-bnr-web/dist/styles/media-room-515d2d102b.css`.
- **Backend (not ported):** mailguide ESP (`mailguide-form`, hidden `list=389`, `language=en_GB`);
  submit posts to the mailguide `newsletter/v1` service. **Intentionally not wired in M1.**

## 2. Source anatomy

Topbar dropdown (the primary signup surface):

```
a.topbar__newsletter            trigger: mail SVG (#mail) + "Subscribe to our stories"
.topbar__dropdown__newsletter(.hidden)   absolute panel, dark-green
└── form.mailguide-form.mailguide-subscribe  (data-form-code="NewsletterFormHeader")
    ├── input[type=hidden name=language value=en_GB]
    ├── label[for=topbar-newsletter-email]   "Subscribe to our stories, so you don't miss out…"
    ├── a.topbar__dropdown__newsletter-close.icon.icon-close   ✕ (icon-font glyph)
    ├── .response-wrapper > .response         error/success message slot
    ├── input.title-name  (HONEYPOT: "Your title and name", visually hidden, required)  ← spam trap
    ├── .topbar__dropdown__newsletter-form    (flex row)
    │   ├── input[hidden name=lang value=en]
    │   ├── input[hidden name=list value=389]
    │   ├── input[name=email].email[type=email placeholder="Enter your email address"]
    │   └── button.btn[type=submit]           "Subscribe"
    └── .topbar__dropdown__newsletter__terms.terms   (flex)
        └── input#mailguide_terms_dropdown.checkbox + consent label (link a.light emerald)
```

Inline sidebar widget:

```
section.newsletter-subscribe-widget          dark-green card, border, radius .5rem
├── header                                    angled image box (clip-path), h3 overlay
│   ├── img (newsletter_subscribe.webp)
│   └── h3  "Be the first to get the latest stories"
└── form.mailguide-form.mailguide-subscribe   (data-form-code="NewsletterFormShortcode")
    ├── fieldset.inputs > .input > input[name=email]
    ├── button (spinner :before when .loading)
    ├── .hidden-content .terms  (consent checkbox + links, revealed after focus)
    └── .response-wrapper > .response
```

Other source variants (NOT in M1 scope, noted for completeness): `.content .newsletter-widget`
(50/50 banner+form, angled clip-path), `#newsletter-popups .newsletter-popup` (modal interstitial),
`.newsletter-mailguide .mailguide` (input-group style). Newsletter also appears as a **hidden** footer
menu category (`.newsletter-menu{display:none}`, see footer.md).

**Libraries / patterns to retire:** jQuery show/hide toggle; icon-font `skoda-bnr-icons` (mail glyph,
`icon-close` ✕); mailguide plugin JS; Bootstrap `.btn`. Replace icons with inline SVG (`:name:`
token → `decorateIcons`); the honeypot stays as a hidden field (good practice, keep in the real build).

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Topbar rows use
`https://www.skoda-storyboard.com/en/`; widget rows use the Epiq story URL. Source-CSS refs point to
the curled `media-room-*.css`.

### Topbar trigger (`.topbar__newsletter`)
- font-size `12px` (`.75rem`), weight `600`, color `#7c7d7e` (`rgb(124 125 126)`) (· 1280 ·
  `.topbar__newsletter`) -> `--skoda-grey-500` (define per `tags.md`), `12px` -> candidate
  `--body-font-size-2xs`. Correction (verified live 2026-09-15): base text is **grey `#7c7d7e`**, not
  `#161718`/`--skoda-ink`.
- margin `0 30px 0 0`; icon `20×16px`; active state adds a `2px` `#161718` underline bar
  (`.newsletter-button__active:after`).

### Topbar dropdown panel (`.topbar__dropdown__newsletter`)
- position `absolute`; right `16.5%` (measured `211px`) (· 1280; source CSS `right:16.5%`).
- padding `2em 3em` (measured `25.6px 38.4px`); background `rgb(14 58 47)` = `#0e3a2f`
  (· 1280) -> `--skoda-green`; **border-radius `0`; box-shadow `none`** (flat panel); width `~627px`.
- label: display `block`, color `#fff` -> `--skoda-white`, max-width `550px`, font-size `12.8px`
  (· 1280; source CSS `label{display:block;color:#fff;…max-width:550px}`).
- close (`.topbar__dropdown__newsletter-close`): absolute `right:.5em; top:.5em`, color `#fff`,
  font-size `2em` (`25.6px`) (· 1280; source CSS).

### Topbar email input (`input[name=email]`)
- flex `1 1 100%`; margin-right `15px`; min-width `300px`; padding `.875em` (`11.2px`);
  background `#fff`; **border `0`; border-radius `0`**; font-size `12.8px`
  (· 1280; source CSS `.topbar__dropdown__newsletter input{padding:.875em;background-color:#fff}` +
  `-form input{flex:1 1 100%;margin-right:15px;min-width:300px}`).

### Topbar submit button (`button[type=submit]`)
- display `block` (revealed by `-form button{display:block}`); border-radius `2em` (`32px`);
  padding `0 2em`; height auto (`~42px`); background `#78faae` -> `--skoda-green-emerald`;
  color `#161718` -> `--skoda-ink`; font-size `16px` (· 1280; source CSS).
- `2em` pill radius ≠ card-teaser `--pill-radius:50px`, keep distinct; candidate
  `--pill-radius-2em: 2em`. Hover (shared mailguide `.row button:hover`) background `#a8ffcc`
  -> candidate `--skoda-green-emerald-hover`.

### Topbar consent (`.terms` + `#mailguide_terms_dropdown`)
- container flex, `align-items:flex-start`, margin-top `10px` (· 1280; source CSS `__terms{…}`).
- checkbox input margin `5px 10px 0 0` (source CSS `__terms input`); rendered as a `1×1px`
  visually-hidden native input with a styled replacement. Consent label links emerald `#78faae`
  (`a.light`).

### Inline widget container (`.newsletter-subscribe-widget`)
- background `#0e3a2f` -> `--skoda-green`; border `1px solid #ededed`; border-radius `.5rem` (`8px`)
  -> `--card-radius` (· Epiq · 1280).
- header: `padding-top:55%` (image aspect box), `clip-path:polygon(0 0,100% 0,100% 100%,0 75%)`
  (angled bottom edge), border-radius `.5rem .5rem 0 0`, overflow hidden (· 1280; source CSS).
- header `h3`: absolute, color `#fff`, font-size `1.5em` (`24px`), weight `400`, line-height `1.5rem`,
  top `15%` (· 1280) -> `--heading-font-size-m` (22px) is closest; `24px` candidate.
- label color `#d8d8d8`, font-size `.875em` (· source CSS).

### Inline widget input (`.inputs .input input`)
- background `#fff`; border-bottom `1px solid #5a5b5c`; border-radius `4px 4px 0 0`;
  padding `1em` (`14px`); width `100%`; margin `0 0 16px`; font-size `.875em` (`14px`) -> `14px` =
  `--body-font-size-s` (· 1280 · `.inputs .input input`). `#5a5b5c` -> `--gallery-divider` (reuse).
  Correction (verified live 2026-09-15): input margin-bottom is **`16px`**, not `24px`.
- focus: border-bottom `2px solid #419468` (· source CSS) -> `#419468` = `--gallery-accent`/`--facet-active` (reuse).

### Inline widget button (`.inputs button`)
- display `flex`; width `60%` (measured `177px`@1280 / `102px`@768 / `258px`@500); margin `0 auto 14px`
  (centered) (· 1280; source CSS). Background emerald, radius, spinner `:before` when `.loading`.

### Response / states (`.mailguide-form .response`)
- padding `.5rem .75rem`; background `#fff`; font-size `.875rem`, weight `500`; `:empty{display:none}`.
- `.error` color `#e82b37` -> candidate `--error-color`; `.success` color `#419468`
  (· source CSS `.mailguide-form .response .error/.success`). Loading: button `:before` spinner
  (`animation:a 7s infinite`, `border-radius:50%`).

### Existing EDS stub (`blocks/newsletter-stub`)
- block padding `40px 24px`, centered, background `--light-color` (`#f2f2f2`); `h2/h3` margin
  `0 0 8px`; `p` max-width `48ch`; CTA `<a>`: inline-block, padding `12px 28px`, radius `4px`,
  background `--dark-color` (`#0e3a2f`), color `#fff`, weight `700`, `aria-disabled` on click.
  (Current stub is a single CTA button, **not** the measured form, see §8.)

## 4. Responsive behavior

- **Topbar dropdown:** absolute overlay anchored `right:16.5%` at desktop; the `-form` is a flex row
  (email + button side by side). On small viewports the header collapses to the mobile nav and the
  signup surfaces via `.topbar__dropdown__newsletter-mobile` / the `#nl-form` hash target
  (`.topbar__newsletter` href `…/#nl-form`). Rebuild: stack email over button below `768`.
- **Inline sidebar widget** (measured): sits in the `.sidebar` column `flex:0 0 33.333%`
  (width `345px`@1280 / `185px`@768). At **<768** the sidebar stacks full-width (`480px`@500) below
  the article; the widget button (`60%`) scales `177 → 102 → 258px`. Radius stays `8px` at every band.
- The `#newsletter-popups .newsletter-popup` modal stacks its form column-reverse below the
  breakpoint (not in M1 scope).

## 5. Interaction states

- **Topbar trigger:** click toggles `.newsletter-button__active` (adds a `2px` `#161718` underline)
  and reveals the panel (removes `.hidden`). Close via `.topbar__dropdown__newsletter-close` ✕.
- **Submit button hover/focus/active:** background `#a8ffcc`, color `#161718`
  (source CSS `.mailguide-form .row button[type=submit]:hover/:focus/:active`).
- **Loading:** button gains `.loading` → animated spinner `:before` (border circle, `animation:a`).
- **Success/error:** `.response` fills with `.success` (`#419468`) or `.error` (`#e82b37`) text;
  empty response hidden.
- **Inline widget terms:** `.hidden-content` (consent block) is `display:none` until interaction,
  then revealed; invalid submit shows `.checkbox-error` tooltip (bg `#78faae`, small pill).
- **Input focus:** inline input border-bottom thickens to `2px #419468`.

## 6. Accessibility

- Trigger is a real control; give it `aria-expanded` + `aria-controls` pointing at the panel, and
  make the panel dismissable with `Esc` (source uses a plain click toggle).
- `label[for=topbar-newsletter-email]` must actually match the email input `id` (source label points
  at `topbar-newsletter-email`); wire the `for`/`id` pair in the rebuild.
- Email input: `type=email`, `autocomplete=email`, `inputmode=email`, `required`, and an accessible
  validation message tied via `aria-describedby` to `.response`.
- Consent checkbox `#mailguide_terms_dropdown`: real `<input type=checkbox>` with a visible, clickable
  label; the terms link must be keyboard reachable. Do not ship consent as a `1×1` unlabeled control.
- Announce `.response` as an `aria-live="polite"` region for success/error.
- Close ✕ is icon-only → `aria-label="Close"`; convert icon-font glyph to inline SVG.
- Keep the honeypot `input.title-name` `aria-hidden="true"` + `tabindex="-1"` (already visually hidden).
- Contrast: white / emerald on `#0e3a2f` pass AA; verify `#d8d8d8` label on green ≥ 4.5:1.

## 7. EDS target

Block: `newsletter-stub` (exists, UI-only). For M1 keep it non-submitting; author the **form layout**
(email + consent + button) rather than only a CTA link, so the demo shows the real signup shape.
Follow repo conventions (`_FOUNDATIONS` §7): `decorate(block)`, CSS scoped to `.newsletter-stub`,
`:name:` icon tokens → `decorateIcons`, button decoration (link in `<strong>` → `.button.primary`).

### DA authoring table (worked example)

`Newsletter (stub)`:
| (heading + copy cell)                                   | (form cell)                                   |
|---------------------------------------------------------|-----------------------------------------------|
| ### Be the first to get the latest stories \n Subscribe so you don't miss out. | Email: (placeholder "Enter your email address") \n [ ] I agree to the [terms](/en/terms/) \n **Subscribe** |

Variants: author `Newsletter (stub)` (dark card, sidebar) vs `Newsletter (stub) inline` (topbar/full).
Add a `dark` section style → green band, white text (matches source).

### decorate() outline

```
export default function decorate(block) {
  // classify cells: heading/copy cell vs form cell (content-sniff: cell containing an email hint + a checkbox line)
  // build a real <form> (novalidate off): email <input type=email required autocomplete=email>,
  //   consent <input type=checkbox id=nl-terms> + <label for=nl-terms>, submit <button>
  // M1 stub: form.addEventListener('submit', e => e.preventDefault()); show a static "thanks" affordance
  // convert :close:/:mail: icon tokens; decorateIcons(block)
  // NO network call — real ESP (mailguide/COM-904) is E09, deferred
}
```

Reuse notes: the existing stub already strips `action` and disables submit; extend it to render the
labelled email + consent controls and a mocked success message. Wire the emerald button + green card
from tokens.

## 8. Open decisions + recommended default

- **Scope (confirmed):** M1 ships **UI only**, no ESP, no POST, no double-opt-in. The real service
  (mailguide, list `389`, `NewsletterForm*` codes, `newsletter/v1`) is **E09 / COM-904, deferred**.
  Recommend the stub renders a real form shape with a client-side "Thanks, we'll be in touch" mock so
  the demo is representative; flag clearly in the block comment that it does not subscribe anyone.
- **Which presentation for M1?** Recommend the **inline dark card** (matches
  `.newsletter-subscribe-widget`: green, radius `8px`, emerald button) as the authorable block, plus a
  note that the topbar dropdown is a header concern (build with `header-megamenu`, not this block).
  Assumption to confirm.
- **New/reused tokens** (assumption to confirm): reuse `--skoda-green`, `--skoda-green-emerald`,
  `--skoda-ink`, `--card-radius`, `--body-font-size-s`, `--gallery-accent` (`#419468` focus/success),
  `--gallery-divider` (`#5a5b5c` input underline). Add `--skoda-green-emerald-hover:#a8ffcc`,
  `--error-color:#e82b37`, `--pill-radius-2em:2em`, `--body-font-size-2xs:12px`, and a placeholder
  grey `#b2b2b2` / `#7a7a7a` only if the `.newsletter-mailguide` input-group variant is built.
- **Consent copy + terms URL:** pull the exact GDPR consent wording + link target from the client
  (source label text was truncated in capture). Do not synthesize legal copy.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Card: `.newsletter-stub` / all / background `#0e3a2f` (`--skoda-green`), border-radius `8px`
      (`--card-radius`), white text.
- [ ] Email input: `.newsletter-stub input[type=email]` / all / white bg, full-width, `14px` text,
      placeholder "Enter your email address"; `type=email` + `required` + `autocomplete=email`.
- [ ] Submit button: `.newsletter-stub button` / all / background `#78faae`
      (`--skoda-green-emerald`), color `#161718`, pill radius `2em`; hover background `#a8ffcc`.
- [ ] Consent: real `<input type=checkbox>` + clickable `<label>`; terms link emerald `#78faae`,
      keyboard reachable.
- [ ] Topbar dropdown (if built): panel bg `#0e3a2f`, flat (radius `0`, no shadow), email+button in a
      flex row ≥768 / stacked <768; close ✕ top-right `2em`.
- [ ] Responsive: sidebar widget 33.33% col ≥768, full-width stacked <768; button width `60%`.
- [ ] States: submit disabled/mocked in M1 (no network); success + error message slot present,
      `aria-live`; loading spinner optional.
- [ ] A11y: `label[for]`↔`input[id]` paired; consent labelled; honeypot `aria-hidden`+`tabindex=-1`;
      `Esc` closes dropdown; contrast ≥ 4.5:1. Keyboard: tab reaches email → consent → submit.
- [ ] Visual diff vs source (inline widget) at 1280/1024/768/mobile ≤ 2% per-pixel (excluding the
      header background image).

## 10. Reference screenshots

`assets/newsletter/`, `1280-topbar-dropdown.png` (open header panel), `1280-sidebar-widget.png`
(inline dark card). 768/mobile pending.
