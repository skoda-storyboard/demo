# SKODA-306, Footer outbound-link browsing-context parity
- **Epic:** E03, Chrome Fragments
- **Type:** QA follow-up / fragment behavior
- **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP
- **Parent:** #25 (SKODA-304)
- **Discovered in:** #101 QA against the live Storyboard footer on 2026-09-23

## Summary
Preserve the live footer's browsing-context behavior for outbound links. The initial SKODA-304 ticket specifies destinations and accessible labels, but does not capture whether links open in the current tab or a new tab.

## Current behavior
On `https://www.skoda-storyboard.com/en/`, all of these footer links use `target="_blank"`:

- two app-store badges;
- Facebook, Instagram, YouTube, and WhatsApp;
- Data Protection, Copyright, Cookies policies, and Whistleblower system;
- RSS and RSS (News).

In the #101 preview, each corresponding anchor has an empty target and replaces the current EDS page.

## Requirements
- Preserve `target="_blank"` for the outbound app, social, legal, and feed links listed above.
- Add repository-standard protection for external new-tab links (`rel="noopener noreferrer"`) where the authoring/runtime layer does not add it automatically.
- Keep internal footer sitemap navigation in the current tab.
- Prefer expressing the behavior in the DA `/footer` fragment; add `footer.js` decoration only if DA cannot retain the authored target safely.
- Preserve the accessible labels and inline-SVG behavior delivered by SKODA-304.

## Acceptance Criteria
- [ ] App-store links: 2/2 open in a new tab with the expected destinations.
- [ ] Social links: 4/4 open in a new tab with the expected destinations.
- [ ] Confirmed legal links: 4/4 open in a new tab with the expected destinations.
- [ ] Feed links: 2/2 open in a new tab with the expected destinations.
- [ ] Internal sitemap links do not acquire `target="_blank"`.
- [ ] New-tab links retain accessible names and do not introduce console or lint errors.
- [ ] Chrome DevTools DOM inspection confirms target/rel behavior on the branch preview.

## Scope boundary
The following QA findings remain fixes under #25 because SKODA-304 already captures them: source-equivalent navigation destinations, confirmed legal content, measured responsive styling, and the ≤2% visual-diff gate. This follow-up must not defer those corrections from the parent ticket.
