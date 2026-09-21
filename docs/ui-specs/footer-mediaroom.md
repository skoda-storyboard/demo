# Component Spec: Footer (Media Room) - delta from Storyboard footer

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; screenshots at 1280 + mobile).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
**Read [`footer.md`](footer.md) first**, this spec records only where the Media Room footer *differs*.

## 1. Identity

- **Component:** Media Room footer, the footer shown across `/en/media-room/` and the journalist /
  press-release listings.
- **EDS block:** `footer` (same block as Storyboard), resolved to a **different fragment** per section
  via `getMetadata('footer')`.
- **Client PDF IDs:** COM-18 (Footer nav / sitemap variant).
- **Ticket:** SKODA-305. Resolves the open decision "does the Media Room footer differ?", **yes,
  materially** (see §2).
- **Source reference:** `https://www.skoda-storyboard.com/en/media-room/`.
- **Source CSS:** same stylesheet as `footer.md`.
- **Top-level selectors:** identical shell (`.footer-content > .container > .footer >
  .footer-widgets`), but a different widget set inside `.footer-widgets`.

## 2. Delta table (Storyboard vs Media Room)

Both measured live 2026-09-15. Shell (dark-green band, container, social widget, app badges, copyright
notice, feed-links) is **identical**; the body content differs.

| Aspect | Storyboard (`/en/`) | Media Room (`/en/media-room/`) | Delta |
|---|---|---|---|
| `.footer-widgets` blocks | 1 (holds `app-download` empty + `social`) | **2**: block A = `app-download` + `social`; block B = `widget_nav_menu` + `skoda-mailguide` + `widget_text` | **material** |
| Mega-menu (`.footer-nav`) | **present**, 7-col sitemap, ~32 links repeating site nav | **absent**, no `.footer-nav` at all | **material** |
| Contacts | none | `widget_nav_menu` heading "Contacts", 2 links (Škoda Corporate Communications `/contacts/#corporate`, Škoda Product Communications `/contacts/#product`) | **material** |
| Newsletter | hidden nav item | dedicated **"Subscribe"** form widget (`skoda-mailguide`): email input + terms checkbox + submit | **material** |
| Company blurb | none | `widget_text` "Company", description + **Annual Report 2025** PDF link (`cdn…/Skoda_Auto-Annual_Report-2025_EN…pdf`) | **material** |
| Social set | Facebook / Instagram / YouTube / WhatsApp (4) | **same 4**, same hrefs | none |
| App badges | iOS + Android "Škoda Media Room" (135x40) | **same 2**, same hrefs | none |
| Feed links | RSS (`/en/feed/`) + RSS (News) (`/en/press-releases/feed/`) | **same 2** | none |
| Copyright notice | © Škoda Auto a.s. 2026 (weight 600) | **same** | none |
| Copyright usage text | "…for **Internet news for two years since publishing, worldwide (except USA, Canada, Japan)**…" | "…for **press, Internet, film, radio and TV news, all that without limitations**…" | **wording differs** |
| Legal bar (Data Protection/Copyright/Cookies/Whistleblower) | not in footer DOM | not in footer DOM | none (see footer.md §8) |

## 3. Measured visual spec (deltas only)

Source URL for every row: `https://www.skoda-storyboard.com/en/media-room/`. Shell values (band,
container, social icons 40x40 circle, badges 135x40, feed-links, hr) are unchanged, see
[`footer.md`](footer.md) §3.

### Content widgets (three new, replacing the mega-menu)
- **Structure (verified live 2026-09-15):** the Media Room footer renders **two** `.container >
  .footer-widgets` rows, not one widget set. Row A = `.app-download` + `.social` (then `<hr>`); row B =
  `widget_nav_menu` (Contacts) + `skoda-mailguide` (Subscribe) + `widget_text` (Company), then
  `.copyright-text` / `.copyright-notice` / `.feed-links`. So the three content widgets are siblings in
  a **second** `.footer-widgets`, below the social/app row.
- Each of `widget_nav_menu` (Contacts), `skoda-mailguide` (Subscribe), `widget_text` (Company):
  `flex:0 0 33.333%; max-width:33.333%` at >=768 (· 1280 · `.footer-widgets > *`). At <768 all
  stack `flex:0 0 100%` (measured 500).
- `.social` still `flex:0 0 80%`, right-aligned; `.app-download` `0 0 20%` (measured 1280), so the
  social/app row sits above the three 33% content columns.

### Widget headings
- Widget title ("Contacts" / "Subscribe" / "Company"): font-size `26px`, weight `600`, margin-bottom
  `26px`, color `#fff` (· `h3.heading` · 1280) -> `--heading-font-size-l` (26px), `--weight-semibold`.
  Correction (verified live 2026-09-15): the heading is an **`<h3 class="heading">`**, not a
  `.widgettitle`; the measured values are unchanged.

### Subscribe form (`.skoda-mailguide`)
- email input: `193px × 45px`, padding `10px`, border-radius `4px 4px 0 0`, background
  `rgb(241 241 241)` (`#f1f1f1`), color `rgb(22 23 24)` = `#161718` (· `input[type=email]` · 1280)
  -> color `--skoda-ink`; `#f1f1f1` near `--skoda-grey-100 #f5f5f5` (candidate confirm), radius `4px`.
- fields: hidden `language=en_GB`, `lang=en`, `list=339`; visible `email` (placeholder
  "Enter your e-mail"), submit button, `terms` checkbox (consent).

### Contacts nav (`.widget_nav_menu`)
- 2 links only (not the 7-col sitemap). Same link type as body copy; author as a short list.

### Company blurb (`.widget_text`)
- descriptive paragraph + "Annual Report 2025" link to the PDF asset. Author as body text + one link.

## 4. Responsive behavior

Same shell ladder as `footer.md` §4 (widgets 3-up at 768; social 80%/app 20% at 768; stack < 768).
The three content widgets go `33.333%` each at >=768 and stack full-width < 768. There is **no**
7-column float grid here (no `.footer-nav`), so the `968/1024` mega-menu breakpoints do not apply on
Media Room pages.

## 5. Interaction states

- Social icons: identical hover behaviour to `footer.md` §5 (per-network brand tints).
- Subscribe input: focus state on the email field + submit; add a visible `:focus-visible` ring and an
  accessible validation message (source form is minimal).
- Links (Contacts, Annual Report, feed): emerald / white as per shell.

## 6. Accessibility

- Everything in `footer.md` §6, plus:
- Subscribe form needs a real `<form>` with a `<label>` for the email input (placeholder is not a
  label), the terms checkbox needs an associated `<label>` with the consent text, and the submit needs
  an accessible name. Announce success/error via `aria-live`.
- "Contacts" and "Company" widgets: use heading elements (`<h2>`/`<h3>`) so the columns are navigable
  landmarks; the Annual Report link should name the file type + year ("Annual Report 2025 (PDF)").

## 7. EDS target

Same `footer` block. Because the deltas are **material** (different widget set, no mega-menu, different
copyright wording, a live form), model Media Room as its **own fragment** selected by section metadata:

- Default site fragment: `/footer` (Storyboard, per `footer.md`).
- Media Room fragment: e.g. `/media-room/footer`, selected by setting `footer` **Section Metadata**
  (or page metadata) on Media Room templates so `getMetadata('footer')` resolves to it. No block-code
  change needed, `footer.js` already reads `getMetadata('footer')`.

### DA fragment authoring model (`/media-room/footer`)

Sections separated by `---`:
1. **Social** (-> `.footer-social`): same as Storyboard (heading + `:facebook: :instagram: :youtube:
   :whatsapp:` + two app-store badges).
2. **Contacts + Company + Subscribe** (-> `.footer-nav`, three-column region): three sub-blocks, 
   a "Contacts" heading with 2 links; a "Company" heading with blurb + Annual Report PDF link; a
   "Subscribe" heading + a newsletter form. The newsletter form is a small block (e.g. reuse/author a
   `form` block) rather than free content, since it posts to the mailguide endpoint (`list=339`).
3. **Legal** (-> `.footer-legal`): the **Media Room copyright wording** ("…for press, Internet, film,
   radio and TV news, all that without limitations…"), the `© Škoda Auto a.s. 2026` notice, and the
   feed links.

### decorate() outline

Unchanged from `footer.md` §7, the same `decorate(block)` handles both fragments; the three-column
middle section decorates the same way as the Storyboard nav grid (fewer, wider columns since there are
3 widgets not 7). Add newsletter-form handling if the form is authored as content rather than a block.

## 8. Open decisions + recommended EDS-native default

- **Unified vs distinct fragment, recommend (b) TWO section-resolved fragments** (assumption to
  confirm). Evidence: the deltas are material, Media Room drops the entire 7-column sitemap, adds a
  Contacts widget, a live Subscribe form, and a Company/Annual-Report block, and changes the copyright
  wording. A single fragment with conditional hiding would carry dead content and the wrong copyright on
  one of the two contexts. Two fragments (`/footer` default + `/media-room/footer`) selected via the
  existing `getMetadata('footer')` mechanism is the EDS-native, zero-code-change solution and keeps each
  context's content authorable independently. Only the shared shell (band, social, badges, feed,
  notice) is duplicated; consider factoring the social+legal rows into a shared sub-fragment if
  duplication becomes a maintenance cost.
- **Subscribe form:** confirm the target endpoint/list id (`list=339`) and whether to reuse a generic
  `form` block or build a dedicated newsletter block (SKODA newsletter is also referenced as a hidden
  nav item on Storyboard). Assumption: reuse a `form` block posting to the mailguide endpoint.
- **Copyright wording:** author the Media Room legal paragraph verbatim (it is not the Storyboard text).
- **Tokens:** reuse the set from `footer.md` §8; plus confirm `#f1f1f1` input bg maps to
  `--skoda-grey-100` (`#f5f5f5`) or add `--input-bg:#f1f1f1`, and input radius `--input-radius:4px`.

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en/media-room/` render to source. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Widget set: `.footer` / all / social + app row, then **three** content columns (Contacts,
      Company, Subscribe); **no** 7-col sitemap.
- [ ] Content columns: each widget / >=768 / `33.333%` width; / <768 / stacked full width.
- [ ] Widget headings: / all / `26px` weight `600` white.
- [ ] Contacts: / all / exactly 2 links (Corporate + Product Communications, correct hrefs).
- [ ] Company: / all / blurb + "Annual Report 2025" PDF link (correct href).
- [ ] Subscribe: / all / email input `~193×45`, radius `4px`, bg `#f1f1f1`, ink text; terms checkbox +
      submit present; posts to newsletter endpoint.
- [ ] Copyright text: / all / **Media Room wording** ("…press, Internet, film, radio and TV news…"),
      not the Storyboard variant.
- [ ] Shell parity: social icons `40×40` set of 4, badges `135×40` ×2, feed-links "RSS | RSS (News)",
      `© Škoda Auto a.s. 2026`, identical to `footer.md`.
- [ ] Fragment routing: Media Room pages resolve `getMetadata('footer')` -> `/media-room/footer`;
      other pages still `/footer`.
- [ ] A11y: form has labels + consent label + `aria-live`; headings are real; icon links labelled;
      `:focus-visible` visible; contrast >= 4.5:1.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel.

## 10. Reference screenshots

`assets/footer-mediaroom/`, `1280.png` (social row + 3 content columns), `mobile.png` (stacked,
~500px). 1024/768 pending.
