# SKODA-713e, VideoObject structured data for applicable public video content

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-713b (#431), structured data and article metadata
- **Type:** enhancement / structured data and metadata validation
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2, source requirement is Should; applicability requires SA confirmation
- **Owner:** supplier engineering with SA SEO and media/content owners
- **Estimate:** unestimated pending eligible page types and video metadata
- **GitHub issue:** [#532](https://github.com/skoda-storyboard/demo/issues/532)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_SEO_02 specifies Article/VideoObject as applicable and correct live-locale
hreflang. Existing SKODA-713b covers Article/NewsArticle, BreadcrumbList and Organization;
SKODA-1001/1005 already own hreflang. No existing ticket explicitly covers VideoObject.

## Scope

- Agree which public page types and video representations need VideoObject, including editorial
  embeds and DAM-backed video where applicable. EDS has no page per media-feed item; do not
  invent a new asset-detail template or claim rich-result eligibility for every listing.
- Establish authoritative name, description, thumbnail, upload date and applicable duration,
  embed/content URL metadata, with correct locale and production-host references.
- Extend the existing structured-data helper rather than add competing JSON-LD generation.
  Do not contact a third-party video provider before the required consent to obtain metadata.

## Acceptance criteria

- [ ] SA SEO accepts applicable page/video types and the metadata/source contract; any Should
      deferral or non-applicability has an explicit recorded decision.
- [ ] Representative applicable pages emit accurate VideoObject using available authoritative
      metadata, valid production URLs and no fabricated dates/durations or unpublished assets.
- [ ] Structured-data validation and focused helper tests cover eligible video, missing/invalid
      metadata and non-video pages; Article/FAQ output, CSP and consent behaviour are preserved.
- [ ] Validation evidence covers agreed live locales and applicable page types; link existing
      hreflang evidence from SKODA-1001/1005 rather than duplicate that implementation.

## Dependencies and boundaries

SKODA-713b (shared helper), 523/511 (video identity and metadata), 907 (consent),
714 (CSP), 709b (delivery URLs) and 1001/1005 (locale relationships).
This adds video schema coverage, not another video player or a new media-details page.
