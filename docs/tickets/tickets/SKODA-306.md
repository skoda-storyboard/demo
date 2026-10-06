# SKODA-306, Footer outbound-link browsing-context parity

- **Epic:** E03, Chrome Fragments
- **Type:** QA follow-up / fragment behavior
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Parent:** SKODA-304 (#25) · **GitHub issue:** [#102](https://github.com/skoda-storyboard/demo/issues/102)
- **Discovered in:** #101 QA against the live Storyboard footer on 2026-09-23

> Ticket file created during the 2026-09-24 M1 gap review. The issue existed without a file; the content below
> mirrors issue #102.

## Status (2026-10-05): 🟡 built on branch `skoda-306-footer-links` (local); `/footer` content edit pending
**Measured on the live footers** (`/en/` and `/en/media-room/`, 1280 and 390), live vs ours:

| Links | Live | Ours before |
|---|---|---|
| App Store + Google Play (2), Facebook/Instagram/YouTube/WhatsApp (4) | new tab, both footers | same tab, both footers |
| Legal: Data Protection, Cookies policies, Whistleblower system (skoda-auto.com) + Copyright (live site) | new tab; **Storyboard footer only**, inline in the disclaimer ("For more details see …") | missing |
| RSS, RSS (News); Media Room consent/contacts/newsletter links | new tab | new tab already (SKODA-609 link policy) |
| Sitemap (own pages) | same tab | same tab |

**Built.**
- **Code:** `blocks/footer/footer-sections.js` `openOutboundLinks()`. A footer link to another origin with no target yet opens in a new tab, and `rel` gains `noopener noreferrer`.
  - DA keeps only `href`/`title` on links (its parser drops `target`), so authoring it in the fragment isn't possible. That's why it's in `footer.js`.
  - Links the link policy already settled when the fragment loaded (live site → new tab, demo listings → same site) are left as they are.
  - Same-site, `mailto:`, `tel:` and `#` links stay in the tab.
  - Accessible names are unchanged.
- **Content (pending approval):** the live sentence "For more details see Data Protection, Copyright, Cookies policies and Whistleblower system." appended to the `/footer` disclaimer paragraph.
  - It's a DA edit, because `/footer` is an adopted fragment with no importer.
  - The existing `.footer-legal .copyright-text a` rule already styles the links.
  - **Measured with the edit applied:** emerald `#78faae`, 12px/18px, weight 300, no underline, as on live.

**Amendment correction:** the 2026-09-25 amendment says the legal links are present "on both footer variants (STO + MR)". The live Media Room footer has **no** legal links (re-checked 2026-10-05), so `/media-room/footer` is unchanged.

**Verified (local code, 1280 / 390):**
- Storyboard: 9 third-party links in a new tab (6 app/social + 3 legal), 5 live-site links in a new tab (policy), 26 sitemap links in the tab.
- Media Room: 6 third-party links in a new tab.
- No horizontal overflow.

**Tests:** `blocks/footer/footer.test.mjs` (+4) covers app/social/legal in a new tab with names unchanged, same-site sitemap and feeds in the tab, policy-settled and non-web links left alone, a kept and extended `rel`, a malformed href, and no origin.

**Not changed (SKODA-609 policy):** ours opens Škodapedia, Podcast and the Media Room contacts/newsletter links in a new tab, because they point at the live site. Live opens them in the same tab, since they're its own pages.

## Summary
Preserve the live footer's browsing-context behaviour for outbound links. SKODA-304 specifies the destinations and
accessible labels, but not whether the links open in the current tab or a new one.

On `https://www.skoda-storyboard.com/en/`, the following footer links use `target="_blank"`:
- the 2 app-store badges
- Facebook, Instagram, YouTube and WhatsApp
- Data Protection, Copyright, Cookies policies, and Whistleblower system
- RSS and RSS (News)

In the #101 preview, the matching anchors have no target and replace the current page.

## Requirements / Spec
- Preserve `target="_blank"` on the outbound app, social, legal and feed links listed above.
- Add `rel="noopener noreferrer"` to external new-tab links where the authoring or runtime layer doesn't already add
  it.
- Keep internal footer sitemap navigation in the current tab.
- Prefer expressing the behaviour in the DA `/footer` fragment. Only add `footer.js` decoration if DA can't safely
  retain the authored target.
- Preserve the accessible labels and inline-SVG behaviour delivered by SKODA-304.
- This is aligned with the SKODA-609 link-containment policy: out-of-set chrome links → absolute + new tab.

## Acceptance Criteria
- [ ] App-store links, 2 of 2: open in a new tab to the expected destinations.
- [ ] Social links, 4 of 4: open in a new tab to the expected destinations.
- [ ] Legal links, 4 of 4: open in a new tab to the expected destinations.
- [ ] Feed links, 2 of 2: open in a new tab to the expected destinations.
- [ ] Internal sitemap links do not get `target="_blank"`.
- [ ] New-tab links keep their accessible names and add no console or lint errors.
- [ ] Chrome DevTools DOM inspection on the branch preview confirms the target/rel behaviour.
- [ ] **Amendment (2026-09-25, sweep reconciliation D3: 306 owns the legal links, removed from SKODA-308):** the 4
      legal links are **present** in the footer disclaimer on both footer variants (STO + MR), in `#78faae`. They are
      Data Protection, Copyright, Cookies policies and Whistleblower system, and they exist in the source DOM
      (parallel sweep V9). Add them to the `/footer` (and `/media-room/footer`) fragment content if they are missing.
      The © line wording is correct per side.

## Scope boundary
These QA findings stay under #25, because SKODA-304 already covers them:
- source-equivalent navigation destinations
- confirmed legal content
- measured responsive styling
- the ≤2% visual-diff gate

## Dependencies
- Upstream: SKODA-304. Related: SKODA-609.
