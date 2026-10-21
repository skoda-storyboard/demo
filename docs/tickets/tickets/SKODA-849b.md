# SKODA-849b, Interactive HTML packages (`ys-embed-share`): inventory, a separate origin, resize contract, audit

- **Epic:** E06, Import Pilot Content
- **Type:** import (story and release transformers) + embed block branch + static hosting
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Before the SKODA-803 bulk run and before the CDN sunset
  (SKODA-520).
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d, excluding the package copy (size unmeasured) and the Q-19
  decision *(planning estimate, not a quote)*. Parts: importer 1, generic iframe branch 1–2, inventory, resize
  contract and dependency audit +1.
- **GitHub issue:** [#445](https://github.com/skoda-storyboard/demo/issues/445) (created 2026-10-21, sub-issue of #426)
- Parent: SKODA-849 ([#426](https://github.com/skoda-storyboard/demo/issues/426))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KI-01 (High, CONFIRMED), G-T4-03
  (Medium, not re-verified).

## Why
- **`ys-embed-share` is content, not share chrome (G-KI-01).** Every cached widget wraps an iframe to first-party HTML
  (360° tours, before/after sliders, animations). `story-flatten.js` maps it to `share`, which is in `DROPPED`;
  SKODA-801, the widget census and the flatten review call that correct. The source also handed the embed code to
  third parties.
- **The inventory (G-T4-03).** 30 distinct package entry URLs in 30 docs: `cdn.skoda-storyboard.com/iframes/` 19,
  `/unboxing/` 1, `/concept-cars/` 3; `skoda-storyboard.s3.amazonaws.com/Assets/` 4;
  `skoda-storyboard.s3.eu-central-1.amazonaws.com/iframes/` 3. Both S3 buckets refuse listing (403).
- **Uses:** `ys-embed-share` in 16 docs (posts EN 7, SR 3, SK 2, SL 1; press releases CS, DE, EN 1 each). The
  press-release importer turns any iframe into a bare URL, so those 3 become links to the CDN that 404 at sunset.
- **Resize contract.** `ivet-car-2024` resizes its iframe and scrolls the parent through `window.postMessage`
  (3 docs), and 16 docs carry an inline `calcRatio` script. Without that contract the packages clip at a fixed height.
- **Old code.** Of 5 package index pages fetched, the ENYAQ RS comparison loads Google Fonts over `http://` (blocked
  as mixed content) and jQuery 2.1.1 (known XSS CVEs); unboxing bundles jQuery, info-lights CreateJS 2015. Hosting
  them same-origin under `/iframes/` on the production host would run that code in the site origin.

## Scope
- **Q-19 default (in SKODA-849):** keep the packages as static assets on a **separate origin** (a static bucket Škoda
  keeps), or sandboxed iframes; not same-origin on www.
- **Importer:** `ys-embed-share` → an Embed of the package URL that keeps the aspect ratio, in the story and the
  press-release paths, with the URL rewritten to the new host.
- **Embed block:** a first-party generic-iframe branch (amends SKODA-204) that implements the postMessage height and
  scroll-to-top contract and the `calcRatio` ratio; `sandbox` attributes set as SKODA-714 needs.
- **Inventory:** per package, the entry URL, files, the docs that use it, the new URL and a dependency audit (jQuery,
  fonts over `http://`, CreateJS). Add the five prefixes to the SKODA-520 / 504a inventory and to 523b's census.
- **Client inputs:** package sizes and file lists from the bucket owner (`aws s3 ls --recursive --summarize` per
  prefix), since public listing is refused.

## Not in scope
- The CSP `frame-src` entry for the package origin: SKODA-714 (T6). Consent for third-party embeds: SKODA-907.

## Acceptance criteria
- [ ] Unit test: `ys-embed-share` classifies to an embed in both importers.
- [ ] Dry run on the 8 cached `ys-embed-share` pages and the 3 press releases: the packages render from their new
      host at full height, and `import:validate-blocks` passes.
- [ ] The inventory lists all 30 entry URLs with a new URL and an audit verdict; no package loads over `http://`.
- [ ] No package runs in the production site origin.

## Dependencies
**Q-19**; SKODA-204, 520 / 504a (inventory), 523b (census), 714 (`frame-src`), 711 (bucket owner before the
decommission). Parent: SKODA-849.
