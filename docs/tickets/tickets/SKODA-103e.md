# SKODA-103e, Inbound file links: /direct-download/, a permanent redirect-only CDN host, wp-json

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN rules, redirect host)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Live **before the DNS switch**; the CDN host before the
  source CDN goes (520).
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d, excluding Škoda IT and Cloud Manager time *(planning
  estimate, not a quote)*. Round 2 adds the document-host target and the rendition strip (≈ 0.5 SP).
- **GitHub issue:** [#436](https://github.com/skoda-storyboard/demo/issues/436) (created 2026-10-21, sub-issue of #422)
- Parent: SKODA-103b ([#422](https://github.com/skoda-storyboard/demo/issues/422))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-08 (G-KO-01 merged), G-T3-05,
  G-T8-01, G-T8-04.

## Why
- **Inbound files and APIs (G-B-08, High, confirmed; G-KO-01, Medium).** `/direct-download/{yyyy}/{mm}/{file}`,
  `cdn.skoda-storyboard.com` URLs and `/wp-json/*` callers have no plan. EN pages alone hold 6,886
  `/direct-download/` and 483 CDN links (520 census), the EN feed 139 CDN images in 10 items. Wikipedia has 219
  links in 101 articles (40 to the CDN), Wikidata 19 (12 to the CDN).
- **Dirty cited URLs (G-T3-05, Low).** 5 of 38 cited CDN files carry a GA4 `_gl` query, 1 ends in `.pdf/`.
- **The CDN host must be permanent (G-T8-04, Medium).** 48 of 96 sampled PDFs link 126 CDN files, including 35 of 37
  release PDFs from 2026. The files can't change after release, so Q-18's exit condition never comes true. 124 of
  126 targets already have a manifest row; the 2 misses are a `-768x256` rendition and an unmapped PNG. The `cdn.`
  certificate expires 2027-04-01.
- **The wrong target (G-T8-01, High, confirmed).** "The AEM Assets delivery URL" is
  `publish-p220607-e2281243.adobeaemcloud.com`: its `robots.txt` is `Disallow: /`, it sends files as attachments
  with `max-age=600`, and its name carries program and environment ids. A Google-indexed CDN PDF would 301 to a
  blocked URL. 2,831 manifest rows point at it today.

## Scope
- **T1 `/direct-download/*`.** Map to the document host URL through the media manifest; drop the query and a
  trailing `/` first. Misses get the 404 page with search.
- **T2 Redirect-only CDN host (C3 default, G-T8-04).** Keep `cdn.skoda-storyboard.com` permanently: manifest map,
  strip the `-WxH` rendition suffix to the master, strip the query (e.g. `_gl`) and a trailing `/`. Misses get the
  404 page with search.
- **T3 Target host (Q-21, G-T8-01).** Redirect to the branded document host Q-21 chooses (e.g.
  `media.skoda-storyboard.com` in front of AEM publish, or `/content/dam/*` through the production CDN), never the
  raw publish host. Build targets from one configurable base, as 503/520 should write `public_url`.
- **T4 `/wp-json/*`** returns 410 or a documented replacement.

## Not in scope
- The document host's setup, certificate and DNS: SKODA-709 (with the Cloud Manager admin); the certificate renewal
  line: 712. Non-EN document ingest: SKODA-523 (the manifest has 242 document rows, all EN). Index policy: 713a.

## Acceptance criteria
- [ ] `/direct-download/2018/12/57_KODIAQ_RS_ext-1920x1280.jpg` reaches the document-host copy of the file; an
      unmapped file gets the 404 page with search.
- [ ] The 6 cited CDN URLs with `_gl` or `.pdf/` resolve to their files.
- [ ] Of the 126 PDF-linked CDN URLs, the 124 with a manifest row resolve, and the `-768x256` rendition reaches its
      master; the unmapped PNG gets the 404 page with search.
- [ ] No redirect target is on `*.adobeaemcloud.com`; changing the base moves every target.
- [ ] `/wp-json/wp/v2/posts` returns 410 or the documented replacement.

## Dependencies
- Q-21, parent C3 (Q-18, 520), SKODA-709 (`cdn.` and document hosts), 712 (certificate line), 523 and 503/520
  (manifest rows, `public_url` base), 103a (order), 713c (harness). Parent: SKODA-103b.
