# SKODA-825, Media Room side resolution: MR nav fragment + per-path nav/footer routing
- **Epic:** E03, Chrome Fragments
- **Type:** fragment + content config (bulk metadata) + small header change
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** — (drafted on disk 2026-09-25; create at sign-off)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO, **draft**

## Origin
The 2026-09-25 DevTools URL→block sweep ([`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §4).
**16 of the 42 M1 pages are Media Room (MR) side:** 5 press releases, 5 model pages, 4 press kits, Images and Videos.
On the source they render the MR header and the MR footer:
- nav: News · Press Kits · Models · Images · Videos · Company…
- footer: Contacts · Subscribe · Company

The main preview of the Klaus Zellmer press release renders the **Storyboard** header (Models · eMobility · Lifestyle
· Škoda World…) and the Storyboard 7-column footer instead. This was verified with DevTools on 2026-09-25: there is
no `nav`/`footer` meta tag on the page.

SKODA-305 (PR #134) builds the MR footer **variant** and the `/media-room/footer` fragment. It does not own:
- the **MR nav fragment**, which no ticket builds;
- the **routing**, i.e. the bulk-metadata rows that make MR paths resolve to the MR fragments. PR #134 lists this
  under "Follow-ups (not in this PR)".

SKODA-607 / 805a / 208 each *assume* "MR chrome", and none of them delivers it.

## Problem
- `blocks/header/header.js:136` and `blocks/footer/footer.js:103` (main @ `752b919`) already read `getMetadata('nav')` /
  `getMetadata('footer')`. The code path exists, but:
  - DA has no `/media-room/nav` document;
  - the bulk metadata sheet has no `nav` or `footer` column for MR paths. Today it has only
    title/description/image/robots rows for `/en/**` and `/en/press-releases/**`.
- The section switcher marks the active tab by longest path match. `/en/press-releases/…`, `/en/skoda-model/…`,
  `/en/press-kits/…`, `/en/images/` and `/en/videos/` do not sit under the Media Room tab's href, so the switcher
  defaults to "Storyboard".

## Scope
- **Content (DA):** author `/media-room/nav`, measured against `header-megamenu.md` (MR state):
  - topbar with the switcher (Media Room active) and Subscribe;
  - MR primary nav: News, Press Kits, Models mega-menu (the same model list), Images, Videos, Company dropdown.
- **Config (DA bulk metadata `metadata.json`):** add `nav: /media-room/nav` and `footer: /media-room/footer` rows for
  `/en/press-releases/**`, `/en/press-kits/**`, `/en/skoda-model/**`, `/en/images`, `/en/videos`, `/en/media-room/**`
  and `/en/news/**`.
  - Activate the footer rows only after PR #134 merges. Preview content is shared across branches, so activating
    earlier would feed the new fragment to main's old footer code.
  - Do not activate the draft placeholder title/description rows.
- **Code (header):**
  - Add an optional `section` metadata value (or allow a data attribute on the switcher item), so MR pages mark the
    Media Room tab as active even when their path isn't under the tab's href.
  - Keep the longest-match rule as the default.
  - Add a unit test next to the existing header tests.
- Out of scope:
  - unifying the STO and MR chrome (client decision, SKODA-305 "Open");
  - the MR locale list (SKODA-303);
  - the MR footer block itself (SKODA-305).

## Acceptance Criteria
- [ ] On the main preview, all 16 MR-side M1 URLs render the MR nav and the MR footer. All 26 STO-side URLs keep
      the Storyboard chrome. This is checked by the sweep's `verify.mjs` chrome probe (DOM text of nav and footer
      columns), not by screenshot.
- [ ] The switcher shows **Media Room** as active on every MR-side URL and **Storyboard** on every STO-side URL.
- [ ] MR nav 1280 / 992 / 375 geometry matches `header-megamenu.md` MR values within the sweep thresholds. Mobile
      drawer behaviour is unchanged (SKODA-302).
- [ ] Fragment failure is safe and never goes live by accident:
  - The `nav`/`footer` metadata rows are activated only after `/media-room/nav` and `/media-room/footer` return
    200 on preview **and** live.
  - If an MR fragment still fails to load, the header/footer block stays **empty without throwing**. That is
    SKODA-307's null guard, covered by 307's unit test; there is no automatic retry to `/nav`.
  - A console-error check on the 16 MR URLs shows 0 uncaught errors.
- [ ] Preview link: `https://skoda-825-mr-side--demo--skoda-storyboard.aem.page/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company`

## Dependencies
- 305 / PR #134: footer rows are activated after it merges.
- 307: empty-but-no-throw guard on a failed fragment load.
- 301: header.
- 603: the page set must be previewed for the AC check.
- DA write access to `metadata.json` and `/media-room/nav` (Lars; D-6 credentials).
- **Owners (sweep §9):** Lars does the DA nav doc + metadata rows (0.5). vijay does the header active state (0.5)
  and QA on the 16 MR URLs (0.5).
- **Blocks the visual sign-off (704)** for every MR template: 607, 208, 805a/c and the 608 listings.
