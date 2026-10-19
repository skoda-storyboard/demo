# Template Spec: 404 (Page not found)

Status: **CAPTURED + BUILT** (re-measured 2026-10-19 with Playwright computed boxes on the live variant pages and the
branch drafts; SKODA-706). The 2026-09-15 capture, a "grey band" with a separate sign image, a ~36px grey label and
16/24 copy, was wrong and is replaced below.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).
Contract: `not-found` (section style) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md).

## 1. Identity

- **Template:** branded 404 / page-not-found. The WP body class is `error404` and there is no CPT. The `<title>` is
  "Page not found - Škoda Storyboard".
- **Side:** Storyboard chrome; the STO header and footer are kept.
- **Variants:** the source serves one of two `template-404` pages **at random** (22 / 18 of 40 loads), both with HTTP
  404. Each is also a stable page (HTTP 200), which also rotates the variant it shows:

  | Variant | WP page | Stable URL | Text | Label | Photos (desktop / mobile) |
  |---|---|---|---|---|---|
  | "You’ve reached a dead end." | 135057 | `/en/youve-reached-a-dead-end/` | ink `rgb(22,23,24)` | "404" | `Storyboard_404_3000px_01a` 3000×1879 / `…1125px_01a` 1125×2436 |
  | "Welcome to our remote car park" | 135055 | `/en/welcome-to-our-remote-car-park/` | white (inline `color:#fff`) | none | `…3000px_02_r` / `…1125px_02` |

- **Copy:** the heading; a line with a Škodapedia `term-explain` tooltip ("rear-view camera" / "Park Assist 3.0");
  "Or return to the [homepage]." (`/`).
- **CS** has its own variants (e.g. "Vítejte na odstavném parkovišti", page 135072): SKODA-1001.
- **EDS:** the site-root `404.html` (`template: error-404`) loads one variant from `/en/fragments/404/<slug>` at random
  (`templates/error-404`).
- **QA drafts:** `/drafts/skoda-706-404-youve-reached-a-dead-end` and
  `/drafts/skoda-706-404-welcome-to-our-remote-car-park` (the variant section plus `Template: error-404`, noindex).

## 2. Structure (source)

```
header (STO)
article.error-404 (margin-bottom −5.263% of the width: the footer overlaps the band)
├── .message-mobile   (≤ 719)  full-bleed row, min-height 900, the 1125px photo (background, cover, 50% 50%)
│   └── .error-message: [div.subheading "404"] h3 p p
└── .message-desktop  (≥ 720)  full-bleed row, min-height 900, the 3000px photo (background, cover, 50% 50%)
    └── SiteOrigin row: two 50% cells from 781 (one cell ≤ 780), the message in the left one
        └── .error-message: [div.subheading "404"] h1 p p
footer (STO)
```

The photos are SiteOrigin row background images (`#pg-<id>> .panel-row-style { background-image: … }`), not `<img>`.

## 3. Measured visual spec

**Band:** min-height 900 at every width. The photo is `cover`, centred, the desktop photo from 720. The footer's top
is 900 − 5.263% of the width below the band's top: 799 @1920, 824 @1440, 833 @1280, 843 @1080, 848 @992, 859 @780,
862 @720, 880 @375.

**Message box** (x and y from the band's top-left; source and EDS identical):

| Width | x, y | Width | Height (dead end / car park) |
|---|---|---|---|
| 1920 | 356, 120 | 584 | 325 / 266 |
| 1440 | 116, 120 | 584 | 325 / 266 |
| 1280 | 40, 120 | 580 | 325 / 266 |
| 1080 | 40, 120 | 480 | 325 / 266 |
| 1079 | 40, 70 | 480 | 325 / 266 |
| 992 | 40, 70 | 436 | 325 / 294 |
| 781 | 40, 70 | 331 | 415 / 385 (EDS 356, §7) |
| 780 | 20, 70 | 390 | 415 / 356 |
| 720 | 20, 70 | 360 | 415 / 356 |
| 719 | 20, 20 | 679 | 175 / 145 |
| 375 | 20, 20 | 335 | 236 / 206 |

- **Rules:**
  - x is `max(40, 50% − 604)` from 781, 20 below.
  - The width is `min(50% − 60, 584)` from 781, 50% for 720–780, and 100% − 40 below 720.
  - y is 120 from 1080, 70 for 720–1079, 20 below 720.

**Type** (`getComputedStyle`; source and EDS identical):

| Element | ≥ 720 | ≤ 719 |
|---|---|---|
| "404" label | 28.8 / 43.2 / 300, mb 16 | 25.6 / 38.4 / 300, mb 16 |
| Heading | h1 56 / 61.6 / 700, mb 24 | h3 32 / 36.8 / 700, mb 16 (EDS h1, §7) |
| Copy `p` | 19.2 / 28.8 / 400, mb 32 | 16 / 24 / 400, mb 20 |

- **Colours:** dead end `rgb(22,23,24)`; car park `rgb(255,255,255)`.
- **Link:** `homepage` is `rgb(65,148,104)` with no underline. On hover it takes the text colour (ink or white).
- **Focus:** the source draws no outline.

## 4. EDS implementation

- **Content:** `tools/importer/import-404.js` on the two stable URLs writes `/en/fragments/404/<slug>`. Each holds one
  section:
  - the desktop photo `<p><img></p>` and the mobile photo `<p><img></p>` (read from the row style rules, `alt=""`);
  - the label `<p>404</p>` (dead end only), the `h1`, the copy (`term-explain` unwrapped) and the homepage `<p>`;
  - Section Metadata `Style: not-found` (+ `not-found-white`).
- **Template:** `templates/error-404/error-404.{js,css}`; `404.html` carries `<meta name="template" content="error-404">`.
  - **Load:** `decorate(main)` picks a variant at random, loads its fragment and replaces 404.html's fallback message.
    A QA draft that already carries the section is laid out in place.
  - **Photo:** the two photos become one `<picture class="not-found-photo">`: the desktop photo from `(width >= 720px)`,
    the mobile one below, eager with `fetchpriority=high` (the LCP image). It sits behind the message at
    `z-index: -1`, under the overlapping footer.
- **CSS:** `--not-found-*` tokens.
  - **L1:** the mobile message.
  - **L2:** the band is an `inline-size` container.
  - **L3:** container queries at 720 (desktop type, 70px down, half width), 781 (the two-cell column) and 1080 (120px
    down).
- **Fallback:** if the fragment can't load, 404.html shows "Page not found" and the homepage link.

## 5. Interaction / behavior

- Static apart from the random pick. The only action is the homepage link.
- The float dock and the media cart still render.

## 6. Accessibility

- HTTP **404** status (verified on the branch preview: 404 for `/en/no-such-page-…`).
- A single `h1` at every width. The photo is decorative (`alt=""`).
- The homepage link is keyboard-reachable with the site's 2px focus ring in the message colour. The source has none.

## 7. Deviations from origin (open, pending human approval)

1. **Škodapedia terms are plain text:** no dotted green underline, help cursor or tooltip, until SKODA-206.
2. **One `h1` on mobile** instead of the source's `h3`: the source duplicates the message and uses `h3` in the mobile
   copy.
3. **Focus ring:** EDS shows the site's 2px ring, in the message colour; the source has no outline.
4. **Text wrap at 781 (car park):** the source wraps one more line (385 vs 356) at the identical 331px width. Every
   other width matches.
5. **EN variants on every locale:** `/cs/…` and other locales show the EN variants until SKODA-1001 adds per-locale
   fragments.
6. **The source's two variant pages aren't migrated as pages.** They are indexable 200 pages on the source; their
   redirect is SKODA-609.

## 8. Acceptance criteria

- [x] HTTP 404 with the branded page; STO header and footer present.
- [x] Both variants, picked at random; each matches the source's band, message box, type, colours and footer overlap
      at 1920 / 1440 / 1280 / 1080 / 1079 / 992 / 781 / 780 / 720 / 719 / 375 (except §7.4).
- [x] Desktop photo from 720, mobile photo below; one decorative LCP `<picture>`, eager.
- [x] Homepage link → `/`, green, ink or white on hover, visible focus ring.
- [ ] Publish `/en/fragments/404/*` with (or before) the merge: a separate content step.
