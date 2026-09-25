# SKODA-309, Media Room side chrome (MR nav, active switcher tab, nav/footer metadata)
- **Epic:** E03, Chrome Fragments
- **Type:** content + import + small header change
- **Phase:** A · **Milestone:** M1 (demo-visible on 11 Media Room URLs)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Demo URL/block sweep, 2026-09-25 (report §5, chrome group).

## Problem (measured)
- On `/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company` (1440 + 390) the source shows the **Media Room**
  tab active (123×44 at x195) and the Media Room nav: News / Press Kits / Models (11-item dropdown) / Images / Videos /
  Company (dropdown) / Škodapedia. EDS shows the **Stories** tab active and the Stories nav.
- `/media-room/nav.plain.html` and `/media-room/footer.plain.html` return 404. The MR pages only carry
  `template=press_release`; no `nav`/`footer` metadata is emitted. The header already supports `getMetadata('nav')`, and the footer supports
  `getMetadata('footer')` (the MR footer variant is SKODA-305, PR #134).

## Scope
- Author and **publish** `/media-room/nav` (and the `/media-room/footer` from 305).
- MR importers (607 press release, 805a/c press kits, image/video listings, news) emit `nav: /media-room/nav` and
  `footer: /media-room/footer` Metadata.
- Header active-tab logic: activate the Media Room tab for MR pages (from a metadata `section` key or an authored path
  list: `/en/press-releases/`, `/en/press-kits/`, `/en/news/`, `/en/images/`, `/en/videos/`, `/en/skodapedia/`), not by
  tab-href prefix.
- The SKODA-602 push tool's fragment check will then also require the MR fragments to be live.

## Acceptance Criteria
- [ ] On every MR URL of the demo set: Media Room tab active, MR nav + MR footer render (1440 + 390), on `.aem.live`.
- [ ] Storyboard pages unchanged.

## Dependencies
SKODA-301 (header), SKODA-305 (MR footer, PR #134), SKODA-607, SKODA-805a, SKODA-602 (fragment check).

## Import contract (SKODA-603)
Contract(s) `media-room-chrome` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Page metadata only (`nav`/`footer` rows on MR pages once the fragments exist); the push tool's fragment check applies. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
