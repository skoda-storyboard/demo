# SKODA-309, Media Room side chrome (MR nav, active switcher tab, nav/footer metadata)
- **Epic:** E03, Chrome Fragments
- **Type:** content + import + small header change
- **Phase:** A · **Milestone:** M1 (demo-visible on **16** Media Room URLs)
- **GitHub issue:** [#145](https://github.com/skoda-storyboard/demo/issues/145)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO. **Unblocked:** SKODA-305 / PR #134 merged (8b2a18a). The DevTools-sweep draft
  SKODA-825 (same scope) is **folded in here** and removed; the corrections are below.

## Origin
Demo URL/block sweep, 2026-09-25 (report §5, chrome group).

## Problem (measured)
- On `/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company` (1440 + 390) the source shows the **Media Room**
  tab active (123×44 at x195) and the Media Room nav: News / Press Kits / Models (11-item dropdown) / Images / Videos /
  Company (dropdown) / Škodapedia. EDS shows the **Stories** tab active and the Stories nav.
- `/media-room/nav.plain.html` and `/media-room/footer.plain.html` return 404. The MR pages only carry
  `template=press_release`; no `nav`/`footer` metadata is emitted. The header already supports `getMetadata('nav')`, and the footer supports
  `getMetadata('footer')` (the MR footer variant is SKODA-305, PR #134).

- **Re-verified 2026-09-25 on main after #134** (CDP re-check on `main--demo--skoda-storyboard.aem.page`): `/media-room/footer.plain.html`
  returns 200, `/media-room/nav.plain.html` still returns **404**. The Klaus press release still has no `nav`/`footer`
  meta, so it renders the Storyboard topnav and footer.
- **16 MR URLs, not 11** (folded from SKODA-825): 5 press releases, **5 model pages (`/en/skoda-model/**`, topnav
  starts "News · Press Kits")**, 4 press kits, Images, Videos. `header.js:136` and `footer.js:103` already read
  `getMetadata('nav'|'footer')`; the switcher marks the active tab by longest href match, so MR paths default to
  Storyboard.

## Scope
- Author and **publish** `/media-room/nav` (and the `/media-room/footer` from 305).
- MR importers (607 press release, 805a/c press kits, image/video listings, news) emit `nav: /media-room/nav` and
  `footer: /media-room/footer` Metadata.
- Header active-tab logic: activate the Media Room tab for MR pages (from a metadata `section` key or an authored path
  list: `/en/press-releases/`, `/en/press-kits/`, **`/en/skoda-model/`**, `/en/news/`, `/en/images/`, `/en/videos/`,
  `/en/skodapedia/`), not by tab-href prefix. Keep longest-match as the default; add a unit test next to the header
  tests.
- Bulk metadata (`metadata.json`) `nav`/`footer` rows for the MR path globs. **Activate them only after both
  fragments return 200 on preview and live** (preview content is shared across branches). Do not activate the draft
  placeholder title/description rows.
- Out of scope: unifying STO/MR chrome (client decision, 305 "Open"), the MR locale list (303), the footer block (305).
- The SKODA-602 push tool's fragment check will then also require the MR fragments to be live.

## Acceptance Criteria
- [ ] On all **16** MR-side M1 URLs: Media Room tab active, MR nav + MR footer render (1440 + 390), on `.aem.live`.
      All 26 STO-side URLs keep the Storyboard chrome and tab. Checked by the DevTools chrome probe (nav/footer DOM
      text), not by screenshot.
- [ ] MR nav 1280 / 992 / 375 geometry matches `header-megamenu.md` MR values; mobile drawer unchanged (SKODA-302).
- [ ] Safe failure: rows go live only after both fragments return 200. A failed fragment load leaves the
      header/footer **empty without throwing** (SKODA-307 null guard). 0 uncaught console errors on the 16 MR URLs.
- [ ] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company`.

## Dependencies
SKODA-301 (header), SKODA-305 (MR footer, PR #134 ✅ merged), **SKODA-307 (null guard)**, SKODA-607, SKODA-805a,
SKODA-602 (fragment check), SKODA-603 (page set previewed). DA write access for the nav doc + metadata rows (Lars).
**Blocks** the SKODA-704 visual sign-off of every MR template (607, 208, 805a/c, 608 listings).
Owners (§11.2 proposal): Lars DA nav doc + rows 0.5; vijay header active state + QA 1.5.
