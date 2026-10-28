# SKODA-850f, MR-I06 delivery-level embargo: deny asset access even from an already-public page

- **Epic:** E08, Editorial at Scale
- **Parent:** SKODA-850c (#449), embargo marker/feed/preview gate
- **Type:** governance / asset-delivery control and end-to-end QA
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, new Must acceptance criterion for embargoed assets
- **Owner:** DAM/platform owner with supplier architect, editorial owner and SA security
- **Estimate:** unestimated pending a supported restricted-delivery design
- **GitHub issue:** [#531](https://github.com/skoda-storyboard/demo/issues/531)
- **Status (2026-10-27):** TODO; no embargo-compliance claim until independent QA

## Source and gap

Client Functional Requirements, MR-I06 (Must): an embargoed DAM asset remains inaccessible
even when referenced by an already-public page.
SKODA-850c covers marker/feed exclusion and avoiding published links during preview; its
current acceptance criteria do not prove direct delivery is denied. D20/522 also identify
the lifetime of copies made by EDS. An unlisted/hash-only public URL is not access enforcement.

## Scope

- Agree a supported DAM/EDS/CDN release mechanism and responsibility for originals, renditions,
  copies and caches, including how existing public references behave before and after the embargo.
- Implement the applicable delivery control and safe editorial preview, composing with 850c's
  marker/feed behaviour rather than duplicating it.
- Include assets referenced from a previously published page and assets with an existing
  delivery/cached-copy history; do not rely solely on hiding a feed entry or withholding new links.
- If the required guarantee is unsupported, keep this gate open and seek an authorised requirement
  change/risk decision. Do not silently downgrade MR-I06 to discovery prevention.

## Acceptance criteria

- [ ] SA/DAM/security approve the delivery/preview design and its original/rendition/cache coverage.
- [ ] Before release, anonymous direct asset requests and references on an already-public test page
      do not reveal embargoed asset bytes; tests cover all applicable delivery and copied-asset paths.
- [ ] Authorised preview works without introducing a public bypass; failure/unavailable release
      metadata cannot accidentally expose an asset.
- [ ] At the approved release time access and feed visibility become correct; timed/cached behaviour
      and repeated transitions are recorded. No unapproved site-controlled public copy remains during
      the embargo; this does not promise recall of files already downloaded outside the service.
- [ ] Independent QA records requests/statuses and observed public-page behaviour; 850c/811 and
      the author guide reference this stronger gate. Any deviation requires authorised human approval.

## Dependencies and boundaries

SKODA-719/722 (architecture/security), 811/101a (page/preview restrictions), 850c/511a
(marker/sync), 850a (schedule), 522/D20 (copies/lifecycle), 709b (delivery host) and DAM ownership.
The asset-access gate is distinct from page staging and normal post-release unpublish policy.
