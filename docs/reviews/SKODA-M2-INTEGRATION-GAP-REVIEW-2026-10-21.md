# M2 gap review: third-party integrations, untouched areas and what has no ticket (2026-10-21)

A gap review for M2 (go-live 02 Jan 2027). It covers:
- every third-party integration touchpoint of the source site;
- the parts we haven't touched (Škodapedia, podcasts, video, event galleries, attachment pages and the like);
- the launch, operations and "outside the site" dependencies.

An adversarial pass then challenged the findings and looked for areas the checklists missed. This follows the
[readiness review](SKODA-M2-READINESS-REVIEW-2026-10-15.md) and the
[locale review](SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md). Their findings are the baseline and are not repeated
here.

**Method (read-only, 2026-10-21):**

- **Inventory.** A machine inventory of the source:
  - 60 sample pages, one per body template plus key families and the six locale homes;
  - the CSP, script, iframe and link hosts;
  - the vendor signatures, forms, JSON-LD and meta;
  - the `wp-json` index (26 namespaces, 289 routes) and the 27 sitemap types;
  - `robots.txt`, the well-known files and the chrome hosts.
  
  Plus a ticket digest (179 ticket files, 210 GitHub issues) with a drift list.
- **Discovery.** Eight area reviewers worked in parallel through fixed checklists of 6–15 items, enlarged from the
  inventory:
  - **A:** runtime third parties, consent and tracking (the only one with a browser);
  - **B:** backend APIs and external consumers;
  - **C:** Škodapedia;
  - **D:** podcasts, audio and video;
  - **E:** untouched page families;
  - **F:** SEO, URLs and cutover;
  - **G:** operations and governance;
  - **H:** requirements and backlog.
  
  A browser follow-up answered the 6 browser-only requests.
- **Adversarial pass:**
  - 2 refuters re-checked every High, Critical and CONTRADICTED finding: they re-fetched the evidence, grepped
    `docs/` and judged severity and duplicates;
  - 4 blind-spot critics looked only for what the review didn't cover, by user journey, by time (cutover to year
    one), outside the site, and inventory completeness;
  - 3 top-up reviewers took the new areas the critics backed with evidence, one per lens (round-robin, cap 3).
- **Hand spot-checks:** G-B-01 (mobile app), G-F-01 (production launch) and G-KO-02 (annual reports). All three held.
- **Finding classes:** NEW (no ticket), UNDER-SCOPED (a ticket misses it), CONTRADICTED (the docs say otherwise),
  ESTIMATE-RISK (the volume or effort assumption is wrong), NO-OWNER (ticketed or known, but nobody owns it).
- **Working files:** per-area reports, JSON records, scratch data, browser answers and transcripts are in
  `.migration/m2-gap-review/` (local, not committed).

## 1. Summary

**107 findings: 1 Critical, 23 High, 58 Medium, 25 Low.**
- **Verification:**
  - the refuters checked 36 High, Critical and CONTRADICTED findings from the areas: 32 confirmed, 3 plausible, 1
    rejected;
  - a second round checked the 12 High findings from the critics and top-ups: all 12 confirmed, 2 downgraded to
    Medium;
  - 11 findings were merged into others;
  - the 32 Medium and Low critic and top-up findings were not re-verified (see §6).
- **80 third-party touchpoints** are listed in §3.
- **Coverage:** 99 of 117 inventory items are covered. The 18 left are social links, one-off body links, Google CSP
  hosts covered through the GTM findings, and the known charging-calculator widget.

**What the backlog doesn't have:**

1. **Nobody owns the launch itself** (G-F-01, the only Critical). No ticket covers:
   - the production CDN (D14 is still red);
   - the DNS change for www, the bare domain and 11 alias hostnames (old newsroom and Media Room domains, `.cz`,
     `storyboard.skoda-auto.com`) on Škoda's own nameservers (G-KI-04);
   - TLS (the current certificate expires on 2026-11-30);
   - the config-service production host, push invalidation, or a legacy-origin route.
   
   Around it:
   - **Runbook:** there is none: freeze, delta import on `modified_gmt`, go/no-go, rollback (G-G-02).
   - **Calendar:** go-live is **Saturday 2 Jan, after the Czech holidays**, with only 7 working days in the last two
     weeks (G-KT-01).
   - **Decommission:** WordPress decommissioning has no owner. That covers personal data in 3 environments,
     licences and hosting, and skoda-motorsport.com runs on the same hosting (G-G-03).
   - **After go-live:** there is no operating model (G-G-07) and no year-one run calendar (G-KT-06).
   - **Internal links:** the demo's `links.js` still sends LIVE_ONLY paths to "the live site", which becomes EDS
     itself at the switch (G-KT-02).
2. **Consent and tracking are Škoda-central systems, not one tag** (G-A-01, G-A-02, G-A-03, G-A-05):
   - Škoda's group SDK **sDrive** and its consent manager (CCM) load on every page from `cross.skoda-auto.com`;
   - they ping Cloud Run endpoints **before consent**, make a first-visit redirect hop and need a `legal-entity-id`
     meta per locale;
   - they pick the OneTrust script per locale, and SL has no banner;
   - the GTM container routes on Škoda dataLayer keys and sends to server-side GTM on Cloud Run.
   
   That contradicts SKODA-804's "zero vendor calls before consent" criterion and D10's "no bespoke dataLayer"
   default.
3. **Systems outside the site break at cutover:**
   - the **Škoda Media Room mobile app** (iOS and Android, version 7.1.37, March 2026, push alerts) reads an
     undocumented WordPress source (G-B-01);
   - skoda-motorsport.com sends its subscribers to Storyboard's newsletter settings, and the CS and SK manage pages
     have no owner (G-B-06, G-KJ-05);
   - 5 RSS feeds have **356 Feedly subscribers**, and nothing serves feeds on EDS (G-B-03, G-KJ-06, G-T3-03);
   - two Buzzsprout podcast shows syndicate to Apple, Spotify, Amazon and YouTube with Storyboard links, and the EN
     show is owned by a personal Gmail (G-D-04);
   - **Google News** treats Storyboard as a publisher (G-F-03);
   - Wikipedia and Wikidata hold 219+ links (G-B-08, G-T3-01);
   - the annual reports 2011–2025 live only on the source CDN and are cited 26 times (G-KO-02).
4. **Legacy URLs that WordPress resolves dynamically have no rule:**
   - **42,275 indexed attachment pages** in three URL shapes (G-F-04, G-T3-02);
   - the `?p=`, `?attachment_id=` and `?s=` routes;
   - old and truncated slugs and wrong category paths, which WordPress 301s and EDS 404s (G-KJ-04);
   - inbound `/direct-download/`, source-CDN and `wp-json` links (G-B-08);
   - press-release PDFs that hard-link the CDN (G-KO-01).
   
   The exact-match redirects sheet and the 103a slash rule can't serve these.
5. **Untouched content is bigger than scoped:**
   - the self-hosted **MP4 library is about 0.4–0.6 TB** (867+ files, 52 h), not "zero video" (G-D-01);
   - event-gallery day pages are **download galleries** (~240 pages, not ~150) (G-E-01);
   - the in-body **Škodapedia glossary** (`span.term-explain`) would be silently lost, and ~750 Škodapedia URLs have
     no continuity plan (G-C-01, G-C-03);
   - **self-hosted interactive embeds** (360° tours, before/after sliders, animations) that the importer drops
     (G-KI-01);
   - Spotify, Instagram, LinkedIn and `skoda_iframe` embeds are dropped (G-KI-02, G-KI-05);
   - **54 server-graded quiz stories** whose answer keys exist only in the WordPress database (G-KI-03);
   - captions and transcripts are nobody's scope (G-D-02).
6. **Authoring on day 2 doesn't work end to end:**
   - **no scheduled publishing**, though half of HQ's releases go live on a quarter hour (G-KJ-01, G-T1-03);
   - authors can't add downloadable originals (PDF, MP4, kit ZIP) without a developer (G-KJ-02, G-T1-01);
   - **an embargoed launch leaks its assets**, because the picker inserts only published assets and the media feed
     lists them (G-KJ-03, G-T1-02);
   - **publish rights can't be limited by path**: any local publisher can publish or unpublish EN (G-T1-04);
   - takedown and rename leave copies behind (G-KJ-07, G-T1-06);
   - DA templates are EN-only and carry source-CDN images (G-T1-08, G-T2-03).
7. **Data scraped from the source freezes at decommission.** Facet vocabularies (no 2027 year), category parents and
   other generator outputs can only be regenerated from WordPress (G-T2-01, G-T2-02, G-KT-03). The link allow-list
   is the exception: it reads the EDS live index and retires at the freeze, and its runtime side is in SKODA-710.
8. **SEO and security drop at the switch:**
   - no production sitemap or robots file (G-F-02);
   - no JSON-LD (G-F-03);
   - no security headers or tested CSP (G-F-05);
   - no SEO owner or measurement baseline (G-F-06, G-KT-07);
   - fragments are indexable (G-F-07);
   - 179 planning and tooling files are publicly served (G-G-08).
9. **Backlog hygiene:**
   - the register has no client owners, due dates or question log (G-H-05);
   - requirement 6.3 "schedule" and 11 more IDs map only to closed M1 tickets (G-H-01);
   - epics don't hold their children: E10 #96 exists, but the locale tickets sit under #83 (G-H-09);
   - 29 SP of out-of-scope tickets still sit on M2 (G-H-08).

**Rough unticketed effort:** the new tickets proposed in §7 add about **55–65 SP**, against 203–214 SP of open M2 work.
Several items depend on client lead time (DNS, CDN, vendors), not team time.

## 2. Matrix

Areas A–H plus the blind-spot critics ("critics") and the top-up reviewers ("top-up"). Each cell gives the count of
findings and, in brackets, the highest severity (C, H, M or L).

| Area | NEW | UNDER-SCOPED | CONTRADICTED | ESTIMATE-RISK | NO-OWNER | Total |
|---|--:|--:|--:|--:|--:|--:|
| A | 1 (M) | 3 (H) | 3 (H) | 1 (M) | – | 8 |
| B | 6 (H) | 4 (H) | – | – | 1 (M) | 11 |
| C | 1 (H) | 2 (M) | 3 (M) | – | 1 (L) | 7 |
| D | – | 1 (M) | 2 (M) | 1 (H) | 1 (L) | 5 |
| E | 3 (L) | 2 (H) | – | – | – | 5 |
| F | 5 (C) | 3 (H) | – | – | 2 (H) | 10 |
| G | 2 (H) | 7 (M) | – | – | 3 (H) | 12 |
| H | 1 (M) | 2 (M) | 2 (M) | 1 (M) | 5 (H) | 11 |
| critics | 4 (H) | 12 (H) | 2 (H) | 1 (M) | 4 (H) | 23 |
| top-up | 2 (M) | 9 (H) | – | – | 4 (M) | 15 |

| Severity | Kept | CONFIRMED | Go-live blockers |
|---|--:|--:|--:|
| Critical | 1 | 1 | 1 |
| High | 23 | 22 | 8 |
| Medium | 58 | 10 | 1 |
| Low | 25 | 2 | 0 |

Rejected: 1. Possible cross-area duplicates: 4.

## 3. Third-party touchpoint register

One row per system the source depends on or that depends on the source, merged from all reviewers.

| Touchpoint | Areas | Purpose | Where used | Owner | Data / consent | EDS approach | Ticket |
|---|---|---|---|---|---|---|---|
| /direct-download/ (signed S3) | E | Per-tile original and 1920px download on event-gallery day pages | 164 download links on 1 sampled event-gallery day page (82 tiles) | source agency / Škoda | none; n/a | media cart + DAM delivery (505/902, 517–520) | SKODA-902 (not linked to 210) |
| Adobe App Builder / I/O Runtime | H | media feed sync runtime | 511a, 521 (C1-C7) | Škoda Adobe org + delivery team | asset metadata, credentials; n/a | serverless job | SKODA-521 |
| AEM Assets author + publish (p220607-e2281243) | topup-day2-authoring-journeys | PDF/MP4/ZIP originals, picker source, media feed source | 2 DAM links on the sampled demo release; 3,609 manifest rows (242 document, 149 video) | Škoda/Adobe (C1, I4) | assets; publish tier anonymous (HEAD 200, ACAO *, public max-age=600); n/a | linked by URL; cart resolver accepts only this host | 503 (closed), 511, 517-522, 101a I4 (read only) |
| AEM Assets publish host (publish-p220607-e2281243) | topup-frozen-source-generated-data | cart index targets | scripts/media-cart-index.json 2,741 assets / 2,671 keys | Škoda AEM | assets; n/a | SKODA-519 replaces index | SKODA-519 |
| AEM Edge Delivery robots/sitemap/headers config (config service) | F | production robots.txt, sitemap.xml, custom headers | demo serves the defaults: robots Disallow / (non-prod), 1 default sitemap of 433 URLs, CSP from head.html, HSTS only | delivery team | none; n/a | configure via tools.aem.live (robots-edit, sitemap, headers) | none |
| Amazon SES | F | outbound mail for the domain (SPF include:amazonses.com -all) | DNS TXT | unknown | email addresses; n/a | not served by EDS; keep or drop SPF with the ESP decision (D4/904) | SKODA-904 (implicit) |
| Apple Podcasts / Amazon Music / YouTube podcasts | D | syndication of the EN show | Buzzsprout show page links | Škoda / show owner | none on Storyboard; n/a | none (off-site); channel link must resolve after cutover | none |
| AWS EC2 nginx origin (eu-central-1) | F | serves WordPress for www + apex today | every page; Let's Encrypt cert CN www, SAN apex, valid to 2026-11-30 | Škoda / WP hosting vendor (unknown) | WP DB (users, subscribers, carts); n/a | replaced by the EDS production CDN; keep as a legacy origin only if D2/903/904 reuse WP endpoints | none (decommission: G-B-13) |
| AWS ELB eu-central-1 + nginx (WordPress hosting) | G | origin of www, stage., test. | 18.157.207.232, 18.157.226.196 | hosting agency (unknown) | WordPress DB: authors, 2FA secrets, cart history, newsletter front; n/a | decommission after rollback window; archive copy decision | none (G-G-03) |
| Buzzsprout | B,D | podcast hosting + feed / podcast hosting for 2 shows; AI-voiced press-release readings embedded in releases | 36/60 samples link it / EN 89/100 + CS 91/100 recent PRs; MR nav link; ~195 EN pages (EN block inventory) | Škoda podcast team / unknown (EN show owner email [personal email address, kept in the working files]) | none / listener IP/UA to buzzsprout.com via iframe; embed consent / none on origin (ungated, per A G-A-06) | embed (204) / embed block (buzzsprout provider, 200 px), autoblock | SKODA-204 / SKODA-204, 204a |
| Buzzsprout (#ExploreSkoda News, AI-voiced) | A | AI audio reading on press releases + podcasts | press releases (Klaus Zellmer, 936 km, ...) | Skoda Auto (Buzzsprout account 1730804) | iframe; ungated on origin | embed block (works) | SKODA-204 |
| Buzzsprout AI-voiced readings | G | AI audio box on press releases | most EN/CS releases (G-D-05) | Škoda comms | player analytics on load; gated on EDS (embed-consent.js) | embed; disclosure only inside the iframe | SKODA-204/204a, D19 (G-G-09) |
| cdn.skoda-storyboard.com | topup-frozen-source-generated-data | images in importer constants and DA library templates | MODEL_CARD_IMAGES 11+11 URLs, templates-spec.mjs 6 URLs | Škoda (S3) | images; n/a | Media Bus / AEM Assets URLs | SKODA-520 (pages, fragments, feed; not /library) |
| cdn.skoda-storyboard.com (CloudFront d37wqhjyfq7840) / S3 | B | source media + theme assets | every page; feeds; emails | WP agency / Škoda AWS | public media; n/a | AEM Assets + Media Bus; sunset plan missing for inbound | SKODA-520 |
| cdn.skoda-storyboard.com (term images + /direct-download/ MP4) | C | featured images of terms, tooltip thumbnails, MP4 downloads in the Škoda Connect term | 704 featured images (EN 184, CS 184, DE 183, SK 153); 24 MP4 links (8 per EN/CS/DE term); every span.term-explain carries a -384x216 thumbnail URL | source WP / S3 | none; none | Media Bus via import; MP4 rows in media-manifest.json | SKODA-5xx media pipeline; not named in 802 |
| CloudFront (cdn.) + nginx (www) logs | topup-inbound-link-inventory | referrer + path evidence for the redirect map | cdn.skoda-storyboard.com (d37wqhjyfq7840.cloudfront.net), www origin | Skoda IT / WordPress hosting agency | IP addresses in logs (PII); n/a (legitimate interest; strip IPs before sharing) | one-off export to seed the harness | none (B-08 asks 30 days of cdn logs) |
| data-store consent store | B | cookiebar permissions (prefs/analyze/social/internal) | inline config on every page; POST /wp-json/data-store/v1/permission | WP agency | consent state, hashed cookie; is the consent layer | replaced by the go-live consent platform | SKODA-804 (says OneTrust) |
| EDS config service roles (tools.aem.live user-admin) | topup-day2-authoring-journeys | preview/publish/unpublish rights | site-wide roles; no path dimension | project admins | author emails; n/a | native | 101a T2, 809 |
| EDS live query index (main--demo--skoda-storyboard.aem.live/en/query-index.json) | topup-frozen-source-generated-data | published list for the link allow-list | build-link-allowlist.mjs:34 | project | page index; n/a | native | SKODA-605/801a |
| EDS RUM (Operational Telemetry) | G | field CWV, 404s, clicks | every page via aem.js, 1/100 sampling | unassigned | cookieless, no personal data; not required (cookieless) | built in; needs domain key + reader | SKODA-702 (closed, field data unverified) |
| EW Request Publish (plugin + inbox app + Adobe email worker) | topup-day2-authoring-journeys | path-based approver workflow | 0 doc mentions | none; Adobe onboarding + Škoda email provider | author/approver emails sent through a customer-provided email API; n/a (employee/agency processing) | native, needs onboarding | none |
| EW Schedule Publish (Prepare menu + da.live/apps/scheduler) | topup-day2-authoring-journeys | timed publish of one page or sheet | not enabled; 0 doc mentions | none | none; n/a | native plugin, needs prepare-tab row + site registration | none |
| EW Snapshots (.aem.reviews) | topup-day2-authoring-journeys | password-protected review and one-click publish of a page set; scheduled snapshot publish is early access | 0 doc mentions | none | snapshot password; n/a | native; scheduling needs Adobe enablement | none |
| Experience Workspace (da.live) editor + library | topup-day2-authoring-journeys | authoring, templates, Tag picker, Assets picker | all journeys; site config has 3 library rows + 1 data row (aem.repositoryId) | Adobe (product); config: project admins | author IMS identities; n/a (internal tool) | native | SKODA-842, 101a |
| Feedly (feed readers) | topup-inbound-link-inventory | RSS subscribers | /en/feed/ 236, /en/press-releases/feed/ 94, /cs/feed/ 12, /en/feed/?post_type=press_release 12, /de/feed/ 2; /sk/feed/, /en/category/podcast-en/feed/, http /en/feed/ unknown to Feedly; /cs/feed/?post_type=press_release 0 | readers (no outreach) | none; n/a | feed must answer at these URLs or 301 from them on day one | SKODA-405 (delivery unowned, KJ-06) |
| GA4 (7 ids in container; G-CR52PEW89M fires on en) via server-side GTM sgtm-hq-prod-qi2yta3k2a-ez.a.run.app | A | analytics | all locales after consent | Skoda analytics | GA4_ga cookies, events; C0002 | via GTM | SKODA-804/905, D10 |
| GitHub (skoda-storyboard/demo issues, milestones, sub-issues) | H | backlog of record | 210+ issues, 2 milestones, 10 epic issues | delivery team | none; n/a | n/a | none (housekeeping, G-H-09/G-H-10) |
| GitHub org skoda-storyboard + AEM Code Sync | G | code repo and deploy | github.com/skoda-storyboard/demo | delivery team today | code only; n/a | transfer to client at hand-over | none (G-G-07) |
| go.skoda.eu | B | Škoda shortlink service | footer WhatsApp (59/60), campaign links | ŠKODA AUTO a.s. | none; n/a | redirect test list | none |
| Google Search Console | F,topup-inbound-link-inventory | indexation, sitemaps, migration monitoring / Links report (top linking sites/pages), coverage | DNS TXT google-site-verification=wle3hXqK… on the apex (no meta tag on pages) / property verified by apex DNS TXT (F-08) | unknown (Škoda marketing / SEO agency) / unknown (client) | search analytics / none; n/a | keep the TXT record at the DNS switch; submit the new sitemap(s); watch coverage + 404s / export before cutover; monitor after | none |
| Google Tag Manager GTM-M5GMBWF | A | tag container | all locales | Skoda analytics | dataLayer; container loads pre-consent; tags gate on OneTrust groups | delayed phase OK after dataLayer seed | SKODA-804 |
| Hotjar, gomexlive, ads-twitter, cloudfunctions sync server | A | CSP-only leftovers | CSP only; 0 runtime, 0 GTM refs | - | -; - | not needed | SKODA-804 lists Hotjar + cloudfunctions |
| IIHF 2021 app (iihf-app.skoda-storyboard.loc) + reCAPTCHA 6LdvOMAa... | A | 2021 campaign app / contest form | 9 template-iihf-2021 pages; 3 mill pages load the dead dev host | none | -; - | drop; import mill pages as generic | none (coverage matrix says 1 page) |
| Let's Encrypt (YE1) | F | TLS for www + apex | origin cert, 90-day renewal | origin host admin | none; n/a | the production CDN issues its own cert for both names; no CAA record blocks any CA | none |
| Mailguide (mailguide.cz) newsletter lists | H | newsletter ESP | 904, locale 5.4 Q4 (lists 389/339/386/342) | Škoda | subscriber PII; marketing | form block to ESP API | SKODA-904 (D4 red) |
| mailguide.cz (newsletter/v1) | B | newsletter subscribe, login, manage, extend | header/popup/footer forms; /newsletter-settings/; also used by skoda-motorsport.com | Škoda marketing (ESP vendor mailguide) | email, lang, list, recipientId, token (PII); explicit (terms checkbox) | form block posting to the ESP | SKODA-904, SKODA-845 (cross-site lists: none) |
| Media Bus | topup-day2-authoring-journeys | image copies for DA-uploaded and picker-inserted images | 4/4 img src on the sampled release | Adobe | content-addressed copies, not deletable by authors; n/a | native | 522 / D20 |
| media-cart/v1 + /direct-download/ + signed S3 | B | download packages, history, tracked downloads | cart pages, Media Box, 6,886 EN links | WP agency / Škoda | pseudonymous history cookie, generated ZIPs; functional | device-ID client ZIP (D2); inbound redirects missing | SKODA-902, 505, 519, 520 |
| Meta pixel 403695356637052 + 3720597658035807, CAPI param builder (capi-automation.s3.us-east-2.amazonaws.com) | A | ads measurement | after Accept All | Skoda marketing | _fbp cookie; C0004 | via GTM | D10 |
| OneTrust / Škoda CCM | H | consent manager | 804, requirement 8.3 | contested (G-H-11) | consent state; n/a | delayed-phase script | SKODA-804 |
| OneTrust geolocation | A | country for consent rules | with CCM | OneTrust/Skoda | IP; necessary | via CCM | SKODA-804 |
| Production CDN (Adobe-managed or BYO) | G | serve aem.live under www.skoda-storyboard.com | not chosen | unknown | access logs; n/a | required for go-live; hosts 103a slash rule | none (G-G-01); 103a assumes it |
| Real Media Library + real-product-manager (devowl.io) | B | media folders, licence/telemetry client | WP admin | WP agency (licence) | folder tree; n/a | AEM Assets folders (mapping not planned) | none |
| RSS feeds (WordPress) | B | full-text feeds per locale and type | footer RSS links; 6 EN variants answer 200 | Storyboard | public; n/a | index-generated RSS | SKODA-405 |
| sdrive (cross.skoda-auto.com, sdrive.azureedge.net) | B | Škoda group tracking SDK | script on 60/60 samples; 21 track* methods | ŠKODA AUTO a.s. (group digital) | page, content, download, cart, form and video events; analytics (assumed) | keep or drop decision | none |
| sDrive zero-tracking (sdrive.azureedge.net/sdrive/zero-tracking.js) | A | cookieless pre-consent page_view to zt-qi2yta3k2a-ez.a.run.app | all pages, 2 requests per page view | Skoda central | page URL, title, page.* dataLayer, utm/gclid/fbclid; pre-consent by design | head script; needs page.* dataLayer | none |
| Signed S3 MP4 downloads (skoda-storyboard.s3.eu-central-1) | D | MP4 originals behind /direct-download/ | 2,663 video attachments; 32/100 EN PRs | Storyboard WP | none; n/a | AEM Assets / media manifest kind:video | SKODA-503, 504a, 520 (demo scope only) |
| site-info/* + global-categories | B | site/locale/category info for an unknown consumer | no site caller; also on skoda-motorsport.com | WP agency platform | public taxonomy; n/a | none yet | none |
| Skoda CCM (cross.skoda-auto.com/sdrive/ccm.js) + OneTrust | A | consent banner; picks the OneTrust domain script per legal entity + language | en/cs/de/sk/sr (not sl) | Skoda central (97 OneTrust mappings in ccm.js) | OptanonConsent/OptanonAlertBoxClosed, geolocation, consent receipts to privacyportal-de.onetrust.com; CMP | loaded by endpoint.js; no domain lock (works on aem.page) | SKODA-804 (under-scoped) |
| Škoda corporate DNS (skoda2/skoda3.skoda-auto.cz, isp2.viapraga.cz; SOA domains.skoda-auto.cz) | F | authoritative DNS for skoda-storyboard.com | www (CNAME to apex) + apex A 18.157.207.232 / 18.157.226.196; cdn CNAME d37wqhjyfq7840.cloudfront.net | Škoda Auto IT (domains.skoda-auto.cz) | none; n/a | www CNAME to the production CDN; apex needs A/ALIAS to the CDN or a redirect service; keep the TXT records | none |
| Škoda DNS (skoda2/skoda3.skoda-auto.cz, isp2.viapraga.cz) | G | authoritative DNS for skoda-storyboard.com | www (CNAME to apex), apex A records TTL 300, cdn CNAME to CloudFront | Škoda IT (presumed) | none; n/a | CNAME www to the production CDN; apex 301 to www | none (G-G-01) |
| Škoda IdP (Adobe IMS federation) | H | author sign-in | 101a (I1-I4), Q-15 | Škoda IT | author identities (PII); n/a | DA/EW auth | SKODA-101a |
| Škoda Media Room app (iComVision) | B | journalist app: releases, kits, stories, models, push | store badges on 60/60 samples; content source unknown | ŠKODA AUTO a.s. / iComVision | none on site; app may hold push tokens; n/a on site | contract to define (JSON from index or adapter) | none |
| Skoda sDrive endpoint (cross.skoda-auto.com/sdrive/endpoint.js?=v3) | A | Skoda Group cross-domain visitor id (aid), first-visit top-level redirect sync, loads the CCM | all pages, all 6 locales, sync <head> script after <meta name=legal-entity-id> | Skoda Auto central digital (sDrive project, Cloud Run project qi2yta3k2a) | aid/opt_sync/__uid cookies, page URL, dataLayer to redirection-server + watcher-main; runs pre-consent (necessary per Skoda) | head.html sync script + per-locale legal-entity-id metadata | none (804 does not name it) |
| skoda-auto.com (Skoda Auto global web) | topup-inbound-link-inventory | home tile + /company/about link to Storyboard and Media Room | home 2x /en/, about 2x /en/ + /en/media-room/ | Skoda Auto digital (HQ) | none; n/a | 103a slash 301; owner can switch to slashless now | none |
| skoda-auto.rs (Autocacak) | topup-inbound-link-inventory | Storyboard tile 'Nove Skoda price' | 1x /sr/ on the homepage | Autocacak (Q-9) | none; n/a | /sr via 1004d; demo /sr 404 today | SKODA-1004d (target only) |
| skoda-banners/v1 | B | per-market banner list + tracked redirect | /list/{lang} (46 EN banners) | Škoda marketing | geo blacklist, frequency caps; analytics for tracking | sheet/feed + click event, no redirect endpoint | SKODA-903 |
| skoda-motorsport.com | topup-inbound-link-inventory | Media Room deep link + newsletter manage link | /en/news/?filter[search]=motorsport&_search_type[]=press_release&sortby=newest; 2x /en/newsletter-settings/ | Skoda Motorsport | newsletter subscribers; marketing | see G-B-06 | none (G-B-06) |
| skoda-motorsport.com (sister WP site) | B | links newsletter management + filtered news to Storyboard | home: 3 links | Škoda Motorsport / WP agency | subscribers via mailguide; newsletter | keep targets working | none |
| skoda.ro (Skoda Romania) | topup-inbound-link-inventory | homepage news tile | 1x /en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/ | Skoda importer Romania | none; n/a | 103a slash 301 (target 200 on demo) | none |
| skoda.si (Porsche Slovenija) | topup-inbound-link-inventory | Storyboard links in chrome/tiles | 13x /sl/ on the homepage | Porsche Slovenija (Q-9) | none; n/a | /sl via 1004e; demo /sl 404 today | SKODA-1004e (target only, no outreach) |
| skodaid.vwgroup.io | C | outbound link in the ŠKODA ID term | 1 link per locale term (EN, CS, DE) | VW Group | none on our side; none | plain link | none needed |
| Social share intents (LinkedIn, Pinterest, Twitter, Facebook dialog, WhatsApp) | E | Share cluster | every story/PR (5 intents on the sampled story) | n/a | page URL only; none (plain links) | float-dock + scripts/share.js | SKODA-215 |
| speeches/v1/speech (WP REST, POST) | E | Speaker directory widget: loads title, date, text, featured image, CV and file for a speech item | media-room-9f302361c5.js; window.ys.speeches_api is on every MR page; widget markup found on 0 of 20 sampled pages | source agency | none; n/a | static content if any page uses it; else drop | none |
| Spotify (open.spotify.com) | D | podcast episode player on podcast-en pages; show link | 29/30 EN, 19/20 CS, 19/21 SR, 8/17 SL podcast posts; 1/100 PRs per locale | Škoda (show 4ywat2rxDqNidxx7FQxXGb) | iframe, Spotify cookies; ungated on origin | embed block (spotify provider) | SKODA-204 |
| stage./test.skoda-storyboard.com | B | non-production WP environments | AWS ELB eu-central-1 | WP agency | likely DB copies; n/a | decommission | none |
| Unknown TXT token _40hmtm87x8kvnnioayret58jt1ul9vq | F | a domain-verification token (vendor unknown) | apex TXT | unknown | none; n/a | keep at the DNS switch until the owner is known | none |
| Vimeo | A,D | video embeds + api/player.js on every page / video player for PR/story/media-item videos (enterprise account 'Škoda') | player.js on 17/17 page loads; 5 iframes on Media Room / EN 31/100, CS 24/100, SK 20/100, SR 13/100 recent PRs; 246 EN pages | Skoda Vimeo account / Škoda | player cookies / player.vimeo.com iframe, dnt=1; OneTrust lists in C0003 but loads pre-consent on origin / OneTrust C0003 on origin config, but loads ungated | embed block, gated by 204a stub / embed block, dnt=1 | SKODA-204/204a / SKODA-204, 608 |
| Vimeo player (in term bodies) | C | feature videos inside the Škoda Connect term | 8 iframes in each of the EN, CS and DE Škoda Connect term (24 total); 0 in SK | Škoda (Vimeo account app_id 122963) | player loads Vimeo cookies even with dnt=1; marketing/media embed | embed block (204); domain lock may block playback on EDS | SKODA-204 (generic); none for term bodies |
| Wikidata | topup-inbound-link-inventory | references for Skoda Auto facts (Q29637 etc.) | 19 references in 12 items, 12 to the CDN | community; Skoda Comms/IR may update references with disclosure | board CV (.docx) on CDN; n/a | 301 + optional reference update once the annual-report home is decided | none (KO-02) |
| Wikimedia Commons | topup-inbound-link-inventory | source/provenance links for licensed Skoda files | 3 file pages (Green iV logotype, Narcis Podsednicek photo attachment page, Skoda wordmark via /direct-download/) | Commons uploaders | none; n/a | 301 for attachment + direct-download shapes | none |
| Wikipedia (21 language editions queried, 14 answered with hits) | topup-inbound-link-inventory | citations to Storyboard pages, PDFs, annual reports | 348 links in 185 articles (14 editions with hits: en 153, cs 40, ru 30, uk 25, de 24, fr 23, pt 12, es 9, nl 9, it 8, pl 7, hu 5, sk 2, sr 1); 1 http-protocol link (cs) | volunteer editors; Skoda can't edit under the COI guideline | none; n/a | permanent 301s (103a + sheet + CDN redirect host); no outreach possible | none (B-08 / F-06 / KJ-04 partial) |
| WordPress admin-ajax (skoda_ajax_loader / ys_ajax_loader) | E | Load more on archives and listings (POST, nonce) | every listing and archive page (ajax_url in window.ys on every sampled page) | source agency (WP theme) | none; n/a | replaced by query-index paging (214, 402, 209a) | SKODA-214 / SKODA-402 |
| WordPress REST /wp-json/wp/v2/categories | topup-frozen-source-generated-data | category tree for ancestor expansion | build-category-parents.mjs:26 | WordPress | taxonomy; n/a | DA sheet | none (AR-07 never ticketed) |
| WP 2FA plugin (wp-2fa, passkeys) | G | author second factor | wp-json wp-2fa-methods/v1, wp-2fa-passkeys/v1 | WordPress admin | author 2FA secrets, passkeys; n/a | replace with IdP/IMS MFA | SKODA-101a (MFA not stated) |
| WP REST skodapedia/v1/term/{id} | C | term-detail HTML for the directory side panel | only caller: media-room-9f302361c5.js on /{loc}/skodapedia/ (window.ys.skodapedia_api.rest_url); story tooltips do not call it | source WP (agency) | public term HTML, no PII; none (first party) | retire; pre-bake term docs (802) | SKODA-206, SKODA-802 |
| www.skoda-storyboard.com HTML (listing filter forms, sitemaps, page heads) | topup-frozen-source-generated-data | scraped by build-facet-labels, build-locale-alternates, build-media-items, 19 import-*.js | 36 non-test, non-bundle tools files reference www/cdn (19 importers + 17 libs/generators); 5 generators fetch and write committed or DA data | Škoda / WordPress vendor until decommission | public content, no PII; n/a (build time) | retire at freeze; replace runtime data with DA sheets / query index | G-G-02 (freeze), G-KT-03, none for the register |
| Yoast SEO (WordPress plugin) | F | sitemaps (91 files, 27 types), JSON-LD graph, OG/Twitter, robots meta, title suffix | every page (1 ld+json graph per page) | WP vendor | author login names in the Person node; n/a | EDS sitemap config + metadata + a JSON-LD helper | none (807 does FAQPage only) |
| YouTube | D | video embeds (iframe + lite-youtube) | EN 6/100, CS 5, SK 9, SR 8 recent PRs; 201 EN pages | Škoda | youtube.com iframe/poster; gated on origin (C0004) | embed block + facade (702a, 818) | SKODA-204, 702a, 818 |
| YouTube (+ i.ytimg.com posters) | A | video embeds | stories | - | Google cookies; gated on origin (.page-embed_cookie); poster image loads pre-consent | embed block, gated | SKODA-204a |

## 4. Untouched areas: status

| Area | What the source has | Gap | Findings |
|---|---|---|---|
| **Škodapedia** | 189 EN / 189 CS / 188 DE / 158 SK terms; directory, A–Z, categories; terms open in a panel through `wp-json skodapedia/v1/term` with the canonical on the archive; an **in-body glossary** in 106 of 3,374 sampled docs (386 spans, still used in 2026) | The in-body glossary has no importer handling; 206 and 802 disagree on scope; ~750 URLs; the parser drops facets; no authoring flow or owner | G-C-01 … G-C-07 |
| **Podcasts** | Two Buzzsprout shows (252 + 421 episodes) syndicated to 4 platforms; `/…/category/podcast-en/` archives in EN, CS, SR and SL | Archive sent to WordPress (LIVE_ONLY); channel links and owner at cutover; Spotify players dropped | G-D-03, G-D-04, G-KI-02 |
| **AI audio box** | A Buzzsprout iframe of AI-voiced readings on 89/100 EN and 91/100 CS recent releases; off-platform workflow | 204 step 7 describes it wrongly; no authoring path; the AI-voice disclosure sits inside the iframe | G-D-05, G-G-09 |
| **Video** | 867+ self-hosted MP4 files (0.4–0.6 TB); Vimeo, 20% of media-library ids domain-locked | Volume missing from 204, 517 and 520; captions; Vimeo allow-list owner | G-D-01, G-D-02, G-KO-04 |
| **Event galleries** | ~240 day pages with download tiles (82 tiles, 164 downloads on one hub) | 210 scopes plain galleries | G-E-01 |
| **Attachment pages** | 42,275 indexed (`/attachment/`, root-level `/<image-slug>/`, `?attachment_id=`) | No rule | G-F-04, G-T3-02 |
| **Interactive embeds and quizzes** | `ys-embed-share` HTML (tours, sliders); 54 quizzes graded by `skt/result` | Dropped by the importer; answer keys only in the WordPress database | G-KI-01, G-KI-03 |
| **Global categories, 404, speeches** | 18 locale-less archives; two rotating 404 variants; `speeches/v1` widget (0 uses in 4,099 bodies) | Not in the matrix or 848; 706 has one variant; speeches can be dropped | G-E-03 … G-E-05 |
| **Annual reports and press PDFs** | Annual reports 2011–2025 only on the CDN; release PDFs hard-link CDN media | No page and no manifest rows; Q-2 proposes dropping the page | G-KO-01, G-KO-02 |

## 5. All findings

Sorted by severity. "Verdict": CONFIRMED or PLAUSIBLE come from the refuters (both rounds) or the browser follow-up;
"not required" marks Medium and Low findings that no refuter checked.

| Id | Sev | Class | Verdict | Blocker | Title | Tickets | Proposed action |
|---|---|---|---|---|---|---|---|
| G-F-01 | Critical | NEW | CONFIRMED | yes | No ticket owns the production launch: CDN choice, DNS switch of www + apex, TLS, push invalidation and the legacy-origin route | SKODA-103a, SKODA-1003, SKODA-520, SKODA-902, D14 | new ticket 'Production launch: CDN, DNS, TLS, robots/sitemap/headers config, cutover runbook' (Phase D, owner on the Adobe and Škoda IT side) + new decision D14a 'which CDN (Adobe-managed vs Škoda BYO) and does it run redirect rules'. Client question to Škoda IT: 'Who changes the skoda-storyboard.com zone, what is the lead time, and may the apex become an ALIAS or a redirect to www?' |
| G-A-01 | High | UNDER-SCOPED | CONFIRMED | yes | Consent runs through Škoda's central sDrive/CCM, not a plain OneTrust tag; 804 does not scope it and the docs misread sDrive as a charging/SSO app | SKODA-804 | amend SKODA-804: replace 'OneTrust tag' with the Škoda sDrive/CCM integration: per-locale legal-entity-id metadata (bulk metadata), head.html sync endpoint.js + zero-tracking.js, a dataLayer seeded with importer.BID and page.LanguageVersion before them, and the embed gate (204a setEmbedConsent) wired to OneTrustGroupsUpdated. Client question: who owns sDrive/CCM at Škoda, and must Storyboard on EDS stay on it? |
| G-A-02 | High | CONTRADICTED | CONFIRMED | yes | Origin tracks before consent by design (cookies + cookieless pings); 804's 'zero cookies, no vendor calls pre-consent' AC contradicts Škoda's own stack | SKODA-804, D10 | new decision D21 (pre-consent measurement): keep Škoda zero-tracking + aid sync on EDS (and rewrite 804 AC 1 to 'only Škoda-classified necessary cookies and the zero-tracking ping before consent'), or drop them (Škoda loses its pre-consent numbers). Client question to Škoda privacy/analytics: 'Is the sDrive zero-tracking ping and the opt_sync/__uid cookie classified as necessary for skoda-storyboard.com, and must the new site keep them?' |
| G-B-01 | High | NEW | PLAUSIBLE | yes | Škoda Media Room mobile app (iOS id420627875 / Android com.icomvision.skodamediaservices) has an undocumented content source that will break at cutover | SKODA-304, SKODA-810 | client question to Škoda + iComVision: 'Which URLs does the Škoda Media Room app call (REST routes, feeds, push trigger), with which parameters and auth, and who triggers the new-article notification?' Then a new ticket: app content contract on EDS (JSON from query-index/sheets with the same shape, or an App Builder adapter), plus a cutover test with the app. |
| G-B-07 | High | UNDER-SCOPED | CONFIRMED | yes | Non-EN pages keep thousands of /direct-download/ and source-CDN links; the zero-reference gates in 520 and 504a are EN-only | SKODA-520, SKODA-504a, SKODA-1004a, SKODA-605 | amend SKODA-520 and SKODA-504a: the census, rewrite and zero-reference gate cover every locale; amend SKODA-1004a-e: a per-locale media:source-census run before the locale publish |
| G-B-08 | High | UNDER-SCOPED | CONFIRMED |  | Inbound links to /direct-download/*, cdn.skoda-storyboard.com and /wp-json/* from outside have no redirect or keep-alive plan | SKODA-520, SKODA-103a, SKODA-103 | new ticket (or amend 103a): CDN prefix rules on the production host: /direct-download/* to the AEM Assets delivery URL via the manifest map (a 404 page with search for misses), /wp-json/* to 410 or a documented replacement, feed variants to the RSS URL; new decision: keep cdn.skoda-storyboard.com as a redirect-only CloudFront for N months vs hard sunset; client question: 'Can you share 30 days of CloudFront and nginx logs (referrer, path) for cdn.* and /direct-download/?' |
| G-C-01 | High | NEW | CONFIRMED |  | In-body glossary (span.term-explain with inline JSON) in stories and press releases has no importer handling and no EDS equivalent | SKODA-801, SKODA-803, SKODA-206, SKODA-802 | New ticket (or amend SKODA-801 + 803) before the bulk import: the story/release transformer rewrites span.term-explain to a marked link to the term (data-explain.id → the target locale's term path; when the doc's locale has no term, as for SK→CS and SL→EN, fall back by rule). A small scripts/ enhancement then adds an accessible popover (focusable trigger, Escape, no hover-only behaviour), or the client agrees in writing to plain links or plain text. Add an author pattern to the DA library. |
| G-D-01 | High | ESTIMATE-RISK | CONFIRMED |  | Self-hosted MP4 library is ~0.4-0.6 TB (867+ distinct files, 52 h), not the 'zero video' SKODA-204 and the media footprint assume | SKODA-204, SKODA-503, SKODA-504a, SKODA-520, D5 | new decision (D5 amendment): which MP4 originals migrate (in-use only vs library), where they live (AEM Assets vs Vimeo-only downloads) and how >1 GB files are delivered; amend SKODA-520/504a with the full-corpus video volume; correct SKODA-204 de-risking note |
| G-E-01 | High | UNDER-SCOPED | CONFIRMED |  | Event-gallery day pages are media-cart download galleries, not plain colorbox galleries; SKODA-210 scopes them as gallery + teaser only | SKODA-210, SKODA-505, SKODA-902, SKODA-517, SKODA-520 | amend SKODA-210: gallery tiles must carry the media-cart add and download actions (reuse the press-kit media / 406 media card, not the plain gallery); add the event-gallery image volume to 517/520 ingestion; correct Q-5 to ~240 pages across 3 templates; client question: 'Event galleries from media drives (latest Epiq Covered Drive, 2026) offer per-photo downloads to journalists. Are they a service that must keep working at go-live, and from which event date?' |
| G-F-02 | High | NEW | CONFIRMED | yes | No sitemap or robots configuration for production: the default sitemap is 1 EN file of 433 URLs with chrome and fragments, and no hreflang | SKODA-1001, SKODA-1005, SKODA-405 | new ticket 'SEO config': sitemap config per locale (index + 6 sitemaps, hreflang alternates from the translation pairs of 1005), exclude nav/footer/fragments/drafts/test/tools/library, production robots.txt with the Sitemap line, submit in GSC at the switch |
| G-F-03 | High | UNDER-SCOPED | CONFIRMED |  | Structured data and article meta are not reproduced: 0 JSON-LD on the demo vs a Yoast graph on every source page | SKODA-807, SKODA-401, SKODA-610 | new ticket 'SEO head parity': a scripts.js JSON-LD helper (NewsArticle for releases, Article for stories, BreadcrumbList, Organization publisher, no WP login names), og:type/site_name/locale, article:published_time from publisheddate, robots max-image-preview:large via bulk metadata, title-suffix decision; Rich Results test on 1 page per template |
| G-F-04 | High | UNDER-SCOPED | CONFIRMED |  | 42,275 indexed attachment pages and the ?p= / ?attachment_id= / ?s= query routes have no rule; the exact-match sheet and the slash rule can't serve them | SKODA-103a, SKODA-103, SKODA-406, SKODA-1003 | amend SKODA-103a (or the G-F-01 launch ticket): CDN pattern rules: '*/attachment/*' to the parent post (or 410), '?attachment_id=' to 410 or the media listing, '?p=<id>' via a generated id-to-path map (static JSON + edge lookup, or a 404-page script), '?s=' to /{loc}/search?q=. Record the 410 vs 301 choice as a decision |
| G-F-05 | High | NEW | CONFIRMED |  | Security headers drop at the switch: no X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy or Permissions-Policy on EDS, and the CSP isn't tested against GTM/OneTrust | SKODA-804, SKODA-102, D16 | new ticket (or part of the G-F-01 launch ticket): a headers config for production (frame-ancestors 'self' or XFO SAMEORIGIN, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy without geolocation unless a widget needs it, HSTS includeSubDomains after checking every subdomain has TLS); amend SKODA-804 AC: GTM container + OneTrust run under the nonce/strict-dynamic/Trusted-Types CSP with 0 CSP violations. Client question to Škoda IT security: 'Is there a VW-group header baseline the site must meet?' |
| G-F-06 | High | NO-OWNER | CONFIRMED |  | No search-engine migration plan: no URL inventory to redirect against, no pre-launch redirect test, no post-launch index/404 monitoring, no SEO owner | SKODA-103, SKODA-103a, SKODA-803, SKODA-848, SKODA-843 | new ticket 'URL migration QA': inventory, classification, a redirect test harness run against the production host before DNS, a GSC/RUM monitoring runbook for 8 weeks with a named SEO owner; fix the 2 slashed sheet rows and the '/' row (with 1003). Client question: 'Who owns SEO and Search Console for skoda-storyboard.com after go-live?' |
| G-G-02 | High | NEW | CONFIRMED | yes | No cutover runbook: content freeze, delta import of what WordPress publishes after the bulk run, go/no-go, rollback window and WordPress read-only fallback are unplanned | SKODA-803, SKODA-1004, SKODA-520, SKODA-103a | new ticket (E07, M2): cutover runbook + rehearsal: freeze date per locale, delta import by modified_gmt since the bulk run, the order of 520/511a/103a/redirects/publish, smoke-test list, go/no-go owners, rollback (DNS revert, WordPress kept read-only N weeks); amend SKODA-803: a modified-since delta mode; client question: 'Can editors freeze WordPress from date X, or must we re-import what they publish until the switch?' |
| G-G-03 | High | NO-OWNER | CONFIRMED |  | WordPress decommission has no ticket: archive copy, database with PII (subscribers, cart history, authors), plugin licences and hosting end are nobody's scope |  | new ticket (M2 + post-go-live): WordPress decommission and archive: read-only snapshot (static crawl or DB dump) with retention period and owner, export of subscriber/consent data to the ESP, deletion of DBs/backups on all 3 environments with a dated record, plugin licence and hosting termination; client question: 'Must a read-only copy of the WordPress site be kept after 02 Jan 2027, for how long, and who signs off deleting its database?' |
| G-G-07 | High | NO-OWNER | CONFIRMED |  | The post-go-live operating model has no ticket: support/hypercare, author training, technical ownership hand-over (GitHub org, Code Sync, config service, DA org) and a licence register | D15, SKODA-101a, SKODA-511b | new ticket (E07, M2): operating model and hand-over: support tiers + hypercare window with named contacts, author training per group (HQ, Media Room agency, local offices) with an M2 author-guide update, transfer of GitHub org/repo + Code Sync + config-service admin + DA org, a licence and cost register with owners; client question: 'Who operates Storyboard after 02 Jan 2027 (code, content, accounts), and for how long do you want Adobe hypercare?' |
| G-H-05 | High | NO-OWNER | CONFIRMED |  | Decision register has no client owner, due date or 'asked on' for any of its 18 red and 16 amber decisions, 73 days before go-live |  | new decision: add 'client owner', 'asked on', 'answer due' and 'fallback applies on' columns; agree with the client that each default applies automatically if unanswered by a date (e.g. 2026-11-13 for the volume-setting D7/Q-6/Q-7); close D11 |
| G-KI-01 | High | CONTRADICTED | CONFIRMED |  | The 'ys-embed-share' widget is self-hosted interactive HTML (360 tours, before/after sliders, animations), not share chrome; the story importer drops it, and its files sit on the CDN and S3 bucket that 520 retires | SKODA-801, SKODA-204, SKODA-204a, SKODA-520, SKODA-504a, SKODA-803 | Amend SKODA-801 and the story importer: ys-embed-share becomes an Embed of the iframe URL (keep the aspect ratio), plus a warning log line for every dropped iframe. New decision: where the ~22 HTML packages live after 520. Options: (a) copy them into the code repo under /iframes/ (served by the code bus, same origin, no consent), (b) a static bucket Škoda keeps, or (c) replace them with a video or still image and drop the interactivity. Add the packages and the S3 /Assets/ prefix to the 520/504a inventory. Amend SKODA-204 with a first-party generic-iframe branch. Re-check the 801 flatten review's 'correct' verdict. |
| G-KJ-01 | High | UNDER-SCOPED | CONFIRMED |  | Timed publication is the normal HQ workflow, but no ticket builds or configures scheduled publish on EDS | SKODA-811, SKODA-602, SKODA-809, SKODA-405, SKODA-511a, D9 | New ticket (E08, M2): scheduled publish. Configure the crontab or snapshot schedule through the config service. Give authors a DA plugin that writes schedule rows (as a 'process' sheet), not raw crontab edits. Handle CET/CEST to UTC and the 5-minute granularity. Restrict who may schedule (809). Order the follow-on tasks: publish-index, CDN purge via http, RSS and media-feed refresh, app notification. Amend 811 to depend on it. Add 6.3 to G-H-01's list of requirement IDs with only closed tickets. |
| G-KJ-02 | High | NEW | CONFIRMED | yes | After go-live, authors can't add downloadable originals (PDF, MP4, image originals, kit ZIPs) without a developer | SKODA-503, SKODA-505, SKODA-806a, SKODA-517, SKODA-518, SKODA-519, SKODA-842, D5 | Add D-4 to the decision register, with option (c) DAM-folder-driven as the default. Then a new ticket (E05/E08, M2): author asset flow. The DA Assets picker (or a plugin) inserts AEM Assets delivery URLs for originals, PDFs and MP4s into Downloads rows, or the Media Box is generated from an AEM Assets folder. New kits get their ZIP through a DAM upload. Acceptance: an HQ author and an SK author, both without repo access, publish a release with a Media Box, a PDF and an MP4, and the cart adds them. |
| G-KJ-03 | High | UNDER-SCOPED | CONFIRMED |  | Embargoed launch assets leak: the public media feed lists every published AEM asset, and preview images live immutably on the public host | SKODA-811, SKODA-511a, SKODA-517, SKODA-522, D9, D20 | Amend 811 and 511a/517: add an embargo marker (an asset 'embargo-until' field or a restricted folder) that the feed sync skips until the date. The release preview uses author-side or signed renditions, not published delivery URLs. Document that preview images on the Media Bus are public by URL. Client question to the DAM team: 'How do launch assets stay hidden in AEM Assets until the release time, and who flips them?' |
| G-KT-02 | High | NO-OWNER | CONFIRMED | yes | links.js still sends LIVE_ONLY paths to 'the live site', which is EDS itself from the DNS switch on; AR-19 maps only to closed M1 tickets | SKODA-605, SKODA-609, SKODA-520, SKODA-103a | new M2 ticket (or add it to the launch ticket G-F-01): a 'cutover link release' merged at the DNS switch. It shrinks LIVE_ONLY to what is really absent, drops the new-tab rule for the own host, and makes own-host links site-relative (AR-19). Add a post-import relink pass over DA, plus a crawl that shows 0 internal 404s before go/no-go. |
| G-T1-04 | High | UNDER-SCOPED | CONFIRMED |  | Publish rights in Edge Delivery can't be limited by path: any CS publisher or agency publisher can publish or unpublish every EN, Media Room and Storyboard page | SKODA-809, SKODA-101a, SKODA-812, D15 | amend SKODA-809 and 101a T2: state the limit, and decide (D15) between (a) few HQ/MR publishers plus Request Publish approvers per /{loc}/* and /en/press-* pattern, or (b) site-wide publish for local offices with 812 audit as the control. Add an AC: a CS author can't publish /en/x without approval. |
| G-A-03 | Medium (was High) | CONTRADICTED | CONFIRMED |  | D10's proposal 'GA4 + FB pixel via GTM, no bespoke dataLayer' won't work with the live container: tags route on Škoda dataLayer keys | SKODA-804, SKODA-905, D10 | amend D10: the proposal must keep the skoda-analytics page.* + importer.BID + matrixId dataLayer contract (905's schema), because the existing container keys on it; or Škoda rebuilds the container. Fix 804's server-side endpoint to sgtm-hq-prod-...run.app. Client question: 'Please export GTM-M5GMBWF (or give us read access) and confirm the GA4 property per locale.' |
| G-A-04 | Medium | ESTIMATE-RISK | not required |  | First-visit redirect bounce and 2 render-blocking head scripts from sDrive: a CWV cost no performance ticket accounts for | SKODA-804, SKODA-701, SKODA-707 | amend SKODA-804/707: measure Lighthouse/CWV with the sDrive scripts in head.html; ask Škoda whether endpoint.js can be async/deferred and whether the sync bounce can be skipped for Storyboard |
| G-A-05 | Medium | NEW | not required |  | Slovenian locale has no consent manager at all (legal entity 298 excluded from the Škoda CCM) | SKODA-804, SKODA-1004 | client question: 'Slovenia (LEID 298) is excluded from the Škoda cookie manager and shows no consent banner on Storyboard. Which CMP should /sl/ use on the new site, and who owns it?' |
| G-A-06 | Medium | UNDER-SCOPED | not required |  | Embed consent: origin gates only YouTube, and nothing maps providers to OneTrust groups | SKODA-204a, SKODA-804 | amend SKODA-804: provider-to-group table (YouTube C0004, Vimeo C0003, Buzzsprout/Spotify: ask Škoda), wire setEmbedConsent per provider, poster images served first-party |
| G-B-02 | Medium | NEW | not required |  | Public site-info/info and site-info/global-categories endpoints have no caller on the site; the global-categories taxonomy is not in the data model | SKODA-512 | client question (with G-B-01): 'Who calls /wp-json/site-info/* and uses global-categories?'; if anyone does, amend SKODA-METADATA-SCHEMA/SKODA-512 to carry a global-category field into the index and publish an equivalent JSON. |
| G-B-03 | Medium | UNDER-SCOPED | not required |  | Source feeds are full-text and come in more variants than SKODA-405 builds (atom, rdf, press_kit, skodapedia) | SKODA-405 | amend SKODA-405: decide summary vs full text (and image URLs from DAM, not the source CDN); add press_kit and skodapedia feeds or redirect rows; redirect /feed/atom/ and /feed/rdf/ to the RSS URL; client question: 'Which systems or partners subscribe to the Storyboard feeds?' |
| G-B-06 | Medium (was High) | NEW | CONFIRMED | yes | Storyboard's /en/newsletter-settings/ is also the subscription-management page for skoda-motorsport.com subscribers | SKODA-904, SKODA-845, SKODA-402 | client question: 'Which other Škoda sites send subscribers to storyboard /newsletter-settings/, and which mailguide lists must that page manage?'; amend SKODA-904/845: the settings page manages every list that links to it (or a redirect agreed with the sister sites), test with a motorsport list; amend SKODA-402 or SKODA-103: map the motorsport deep link (filter[search]=motorsport + _search_type[]=press_release) to an EDS filter or a redirect row. |
| G-B-09 | Medium | UNDER-SCOPED | not required |  | Server-side download history (/your-downloads/, media-cart/v1/history) disappears without a redirect or data-retention decision | SKODA-902, SKODA-505, SKODA-103 | amend SKODA-902: state that package history is dropped (D2), add redirect rows for /{loc}/your-downloads/ to the EDS cart page, and add a decommission step: delete the stored ZIP packages and history records (pseudonymous cookie IDs) with the WP shutdown; client question: retention period for generated packages |
| G-B-10 | Medium | NEW | not required |  | Real Media Library folder tree (paid devowl.io plugin) is not exported or mapped to AEM Assets folders | SKODA-504a, SKODA-517, SKODA-512 | client question: 'Do editors rely on the Real Media Library folders, and should AEM Assets mirror them?'; if yes, amend SKODA-504a: an authenticated RML export before decommission and a folder/collection mapping in the ledger |
| G-B-11 | Medium | NO-OWNER | not required |  | go.skoda.eu shortlinks (Škoda-owned) point at slashed Storyboard URLs; no inventory of them exists | SKODA-103a, SKODA-103, SKODA-209 | client question to the go.skoda.eu owner: 'Export every go.skoda.eu link whose target is skoda-storyboard.com'; add the targets to the 103a test list and to SKODA-209 archive scope (130years) |
| G-C-02 | Medium (was High) | CONTRADICTED | CONFIRMED |  | Škodapedia scope is still contradictory: 206 says it is not migrated, 802/1004a-c generate about 724 term docs, and D8 asks only about owners | SKODA-206, SKODA-802, SKODA-1004a, SKODA-1004b, SKODA-1004c | Widen D8 into a scope decision and ask the client: 'Škodapedia has 724 terms in EN/CS/DE/SK, 70% of EN terms are unchanged since 2019, and about 300 stories and releases link terms inline. At go-live, do we (a) migrate it as is, (b) migrate after pruning discontinued-model terms, or (c) retire it with redirects to the archive / the model pages? Who owns the term content after 2 January 2027?' Then align 206's caveat and the mapping row with the answer. |
| G-C-03 | Medium | UNDER-SCOPED | CONFIRMED |  | About 750 indexable Škodapedia URLs (terms, category archives, /f/ filter permalinks) have no continuity plan once terms move to /modals/ | SKODA-802, SKODA-206, SKODA-103a | Amend SKODA-802: generate each term doc at its public path /{loc}/skodapedia/{slug}. Those docs serve standalone and are fetched as .plain.html for the modal, so no redirects are needed and the term gets a self-canonical. Otherwise add 724 + 28 redirect rows to /{loc}/skodapedia. Accept or decide how /f/ permalinks are handled (an archive-side ?f= query instead, with the old subpaths lost or handled by a CDN rule). |
| G-C-04 | Medium | CONTRADICTED | CONFIRMED |  | The directory data model disagrees three ways, and the existing parser drops the model and category facets | SKODA-206, SKODA-802 | Amend SKODA-206/802: pick one model (recommended: term docs with models/categories metadata plus a skodapedia index sheet per locale), make the parser emit the facets, and drop /en/skodapedia (and the locale archives) from LIVE_ONLY when the block ships. |
| G-D-02 | Medium | CONTRADICTED | CONFIRMED |  | Captions and transcripts are nobody's scope: 204 says the provider handles captions, but 9/12 sampled Vimeo videos and 0/673 Buzzsprout episodes have none | SKODA-204, SKODA-703 | client question: 'Do migrated videos/podcasts need captions or transcripts at go-live (WCAG 1.2.1/1.2.2, EAA), or is source parity accepted?'; amend SKODA-703 to record the 1.2.x result either way; drop the 204 captions claim |
| G-D-03 | Medium | CONTRADICTED | CONFIRMED |  | Podcast is a live category archive (/en/category/podcast-en/, 30 EN + 20 CS + 21 SR + 17 SL episodes) that the demo sends to WordPress; 209 records it as 'not an archive' | SKODA-209, SKODA-848, SKODA-609, SKODA-1004e | amend SKODA-848: name /{locale}/category/podcast-* as keep archives; amend SKODA-209: correct the 'not an archive' note and re-author nav/footer to /en/category/podcast-en; add to the cutover checklist: delete LIVE_ONLY/LIVE_ALIASES entries in scripts/links.js once targets exist |
| G-D-05 | Medium | UNDER-SCOPED | not required |  | AI audio box is EN+CS only (89/100 and 91/100 recent PRs, 0 in SK/SR/DE) and comes from an off-platform Buzzsprout workflow the DA authoring model does not describe | SKODA-204, SKODA-842, D19, SKODA-1004 | amend SKODA-204 step 7 (Buzzsprout iframe, not a widget); amend SKODA-842 / author guide: 'AI audio' library entry with the paste-URL workflow for EN and CS; add the AI voice to D19's notice |
| G-F-07 | Medium | NEW | not required |  | Fragments, nav/footer and test documents are publicly indexable on the production host (no noindex rule) | SKODA-103, SKODA-806, SKODA-1006 | amend SKODA-103 (bulk metadata): robots 'noindex' for /**/fragments/**, /fragments/**, /nav*, /footer, /*/nav, /*/footer, /drafts/**, /**/test/**, /tools/**; exclude the same from the sitemap config (G-F-02) |
| G-G-04 | Medium | UNDER-SCOPED | not required |  | Production observability has no owner: RUM field data was never verified, no domain key is handed over, and there is no uptime, 404 or JS-error monitoring for the cutover | SKODA-702, SKODA-511b, SKODA-103a | new ticket (E07, M2) or amend the cutover runbook: get the RUM domain key for the production host, hand RUM explorer access to the client, a daily 404/redirect review for the first 4 weeks feeding the redirects sheet, an uptime check on 5 URLs + query-index, a named on-call for the first 2 weeks |
| G-G-05 | Medium | UNDER-SCOPED | not required |  | D16 'NFRs / logging' was narrowed to the audit trail; availability, RTO/RPO, content backup, browser support and the security-header baseline have no decision | SKODA-812, D16 | amend D16: split into D16a audit (812) and D16b NFR baseline with proposed defaults (aem.live SLA as availability, DA restore path via version history + a nightly source export, browsers = last 2 evergreen + iOS Safari, security headers per F5); client question: 'Which availability, recovery and browser-support targets does Škoda require for Storyboard?' |
| G-G-06 | Medium | UNDER-SCOPED | not required |  | Authors use WordPress 2FA with passkeys today; SKODA-101a never states MFA, and the Q-15 fallback (separate Adobe accounts) could drop it for agency authors | SKODA-101a, Q-15 | amend SKODA-101a: add an AC 'every author sign-in, internal or external, enforces MFA (IdP conditional access or IMS org policy)' and a check in T5; extend Q-15 wording: 'Must agency and local-office authors use MFA, and does the guest-account route in the Škoda IdP enforce it?' |
| G-G-08 | Medium | NEW | not required |  | Internal tooling and planning data are publicly served from the code repo and will be on www after go-live (179 files incl. the AEM author host) |  | amend the cutover runbook (G-G-02) or a small M2 ticket: add docs/, tools/, poc/ to .hlxignore (or move the tooling to its own repo) and re-check with HEAD requests before the DNS switch |
| G-G-09 | Medium | UNDER-SCOPED | not required |  | The only 'AI-generated voice' disclosure for the AI audio box sits inside the Buzzsprout iframe, which EDS hides behind the consent placeholder; D19 covers only the build-tool notice | SKODA-204, SKODA-204a, D19 | amend D19: add AI-generated site content (audio readings) to its scope and close the build-tool notice with a dated record; client question (legal): 'Must AI-voiced readings carry a visible label on the page, also before consent?'; if yes, amend SKODA-204a: the Buzzsprout placeholder shows an authored 'read by an AI-generated voice' line |
| G-G-10 | Medium | UNDER-SCOPED | not required |  | No M2 accessibility gate: SKODA-703 closed with the human screen-reader pass open, the WCAG level is still 'TBD', and the M2 templates get no audit | SKODA-703, SKODA-703a, SKODA-708, #403 | new ticket (E07, M2): pre-go-live accessibility regression: axe on a coverage set of M2 templates and services, the open human screen-reader pass, a decision on #403; client question: 'Which WCAG level and version is the target (2.1 AA or 2.2 AA), and does Škoda want an accessibility statement page?' |
| G-G-11 | Medium | UNDER-SCOPED | not required |  | No performance budget for M2: targets conflict (Lighthouse ≥ 90 vs ≈ 100), 702 closed with the category LCP open, and nothing re-measures with the real consent and analytics stack | SKODA-702, SKODA-804, SKODA-901 | amend SKODA-804 (or a new E07 ticket): a per-template budget table (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 in RUM; Lighthouse mobile ≥ 90) measured with the production consent/analytics stack before the DNS switch; client question: 'Is the performance target Lighthouse ≥ 90 or Core Web Vitals at p75?' |
| G-H-01 | Medium (was High) | NO-OWNER | PLAUSIBLE |  | 12 requirement IDs carry an open red gap but map only to closed M1 tickets: no M2 vehicle, ACs or owner | SKODA-301, SKODA-201, SKODA-402, SKODA-403, SKODA-401, SKODA-503, SKODA-103, SKODA-702, SKODA-703, SKODA-808, SKODA-808a, SKODA-807 | new decision rows for the client-input items (COM04, STO-H01, STO-H08, MR-H10, MR-L01/Q9, MR-L03/Q4, MR-L05, MR-PR04, MR-V04) with a default each; re-point MR-PK03/MR-M02 to 808a and close MR-PK05 on the register default; route 8.1/8.5/8.6 per G-H-02/G-H-03 |
| G-H-02 | Medium | NEW | not required |  | No M2 ticket or decision owns go-live NFR acceptance (8.5 CWV, 8.6 WCAG): 702/703 closed on M1 pilot pages | SKODA-702, SKODA-703, SKODA-703a | new ticket 'Go-live NFR gate: CWV + WCAG 2.1 AA sweep over one page per template and a corpus sample' (E07, M2) + new decision row splitting D16 into D16a thresholds (proposed default: WCAG 2.1 AA, Lighthouse mobile >= 90 / CWV good at p75) and D16b logging; milestone #403/#411/#412 to M2 under it |
| G-H-03 | Medium | UNDER-SCOPED | not required |  | Traceability and requirements-mapping docs are frozen at 14/11 Sep: 42 of 67 open tickets are untraced, decisions shown open that are resolved |  | amend the traceability doc: reverse-index rows for the 42 tickets (most map to MIG02/MIG04/MIG05/6.4/6.8/6.9/8.1), add G-L1..G-L4 and new rows for 'non-EN import', 'source CDN cutover' and 'author identity'; refresh the OVERVIEW epic totals |
| G-H-04 | Medium | CONTRADICTED | CONFIRMED |  | SKODA-834 closed on GitHub, but main still turns any link containing /widgets/ into a widget and inserts a failed response | SKODA-834 | reopen #256 with an M2 milestone (or a new follow-up issue); 1 SP |
| G-H-07 | Medium (was High) | UNDER-SCOPED | CONFIRMED |  | Locale review section 5.2 amendments to 17 tickets and its gap rows G-L1 to G-L4 were never applied | SKODA-1001, SKODA-1002, SKODA-1003, SKODA-843, SKODA-904, SKODA-840, SKODA-511, SKODA-517, SKODA-520, SKODA-803, SKODA-847, SKODA-802, SKODA-405, SKODA-103, SKODA-609, SKODA-303a, SKODA-804 | amend the 17 tickets per locale review 5.2 (doc PR) and add G-L1..G-L4 to the traceability gap register; re-estimate 1003/843/904 for CS |
| G-H-08 | Medium | ESTIMATE-RISK | not required |  | 29 SP of M2 tickets contradict their own decision defaults (901, 903, 905, 906 are 'not at go-live' in the register) | SKODA-901, SKODA-903, SKODA-905, SKODA-906 | new milestone 'M3 / post-go-live' for 901/903/906 (and 905 if D10's default holds), or re-word the defaults; estimate the 7 unestimated M2 tickets |
| G-H-09 | Medium | NO-OWNER | not required |  | Epic trees on GitHub are stale: 63 of 65 open epic-labelled issues are not under their epic, E01 is closed with open children | SKODA-101a, SKODA-103a, SKODA-1001, SKODA-1002, SKODA-1003 | GitHub housekeeping (needs a go-ahead): reopen E01 or move 101a/103a; attach every open M2 issue to its epic; put 1004-1006 under E10 #96 (keep #83 as a related link) |
| G-H-11 | Medium | CONTRADICTED | CONFIRMED |  | Consent scope contradicts itself: requirement 8.3 is 'OUT of Adobe scope, no ticket' while SKODA-804 builds the OneTrust gate | SKODA-804, SKODA-204a | new decision row D10b 'who integrates and operates the CMP on EDS' (proposed default: Škoda supplies the CCM/OneTrust config, Adobe wires it in 804); update 8.3 in the traceability doc |
| G-H-12 | Medium | NO-OWNER | not required |  | D19 AI-tool notice to Škoda owed since 2026-09-14 with no ticket, date or confirmation |  | client question / action: send the notice now and record the date in the register (or a ticket under E01) |
| G-KI-02 | Medium | UNDER-SCOPED | not required |  | The story importer converts only YouTube and Vimeo iframes; Spotify players on the podcast episodes (and Instagram, LinkedIn and VW-stream embeds) are dropped by html2md | SKODA-801, SKODA-801a, SKODA-803, SKODA-204, SKODA-1004d, SKODA-1004e | Amend SKODA-803 (bulk run) or SKODA-801a: videoUrl/videosToUrls emits the bare URL for every EMBED_HOSTS iframe (Spotify, Buzzsprout) and logs any other iframe host. Add a corpus check: 'iframes in source = embeds in output + logged drops'. Decide Instagram/LinkedIn/VW-stream: link or drop. |
| G-KI-03 | Medium | UNDER-SCOPED | not required |  | 54 quiz stories in 6 locales are graded server-side by /wp-json/skt/result; the backlog holds one quiz page, and the answer keys exist only in the WordPress database | SKODA-801a, SKODA-803, SKODA-1004a, SKODA-1004c, SKODA-1004d, SKODA-1004e | New decision (with a client question): 'Storyboard has 54 interactive quizzes (2018-2025) that WordPress grades. Do we (a) migrate them as static question lists, (b) export the answer keys and build a small client-side quiz block, or (c) retire them with redirects?' Whatever the answer, add 'export skt answer keys and result texts from the WP DB' to the decommission ticket (G-G-03) before deletion. |
| G-KI-05 | Medium | CONTRADICTED | not required |  | story-flatten has no mapping for the 'skoda_iframe' widget (YouTube players, 30 of 200 cached SL stories) or 3 other non-census widgets; the parser drops them, and the SL review called SL 'a subset of the EN widget set' | SKODA-801, SKODA-803, SKODA-1004e, SKODA-204a | Amend SKODA-801 (or 1004e for SL): add a 'skoda_iframe' and 'skoda-video-embed' kind that keeps the provider URL (embed block), plus a classifyWidget test case. For sow-google-map, decide between a static map image, a link or a drop. Extend the widget census to DE, SK, SR and SL before the bulk run (803), and make 'unknown widget' a failing count in the run report, not a console.warn. |
| G-KJ-04 | Medium | UNDER-SCOPED | not required |  | WordPress resolves truncated slugs, wrong category paths and old slugs with a 301; EDS 404s them, and a sitemap-based URL inventory can't see them | SKODA-103, SKODA-103a, SKODA-706 | Fold into the 'URL migration QA' ticket from G-F-06. Export _wp_old_slug and category history from the WordPress DB into the redirect map (client/agency DB query). Add a cheap stand-in for permalink guessing in 404.html: look up the last path segment in the locale query-index, replace the location on an exact slug match, otherwise offer search (amend 706). |
| G-KJ-05 | Medium | UNDER-SCOPED | not required |  | CS and SK subscribers' manage, confirmation and unsubscribe pages have no owner; 904 and B-06 cover only /en/newsletter-settings/ | SKODA-904, SKODA-845, SKODA-1004a, SKODA-1004c, D4 | Amend SKODA-904: a per-locale manage page and ESP landing pages (subscribe confirmed, unsubscribed) for every locale with a list. Record the mailguide redirect URLs and update them at cutover. Add these URLs to the 1004a/1004c page lists as 'rebuild, not import'. Merge with G-B-06. |
| G-KJ-06 | Medium | UNDER-SCOPED | not required |  | RSS can be generated but not delivered: no ticket serves application/rss+xml at /{loc}/feed/ or refreshes it on publish | SKODA-405, SKODA-103a, D14 | Amend 405 or the launch ticket (G-F-01): choose the delivery mechanism (an edge worker on the production CDN is the default), refresh on publish, set the content type, exempt the route from the slash rule, and cover per-locale feeds plus the release feed. Merge with G-B-03. |
| G-KJ-07 | Medium | NEW | not required |  | Takedown and correction have no defined flow: unpublishing is a two-step operation, Media Bus copies stay reachable, and downstream copies are not listed | SKODA-811, SKODA-812, SKODA-522, D20 | Add a takedown runbook to the operating-model ticket (G-G-07): unpublish order, a 410-vs-redirect rule, CDN purge, feed refresh, and Media Bus removal through Adobe support with an SLA. Client question: 'What takedown time does Škoda Legal require for a release or an image?' |
| G-KO-02 | Medium | NO-OWNER | not required |  | Škoda's annual reports (2011-2025, EN + CZ, up to 28 MB) live only on cdn.skoda-storyboard.com; Wikipedia and Wikidata cite them, they have no page and no manifest row, and 810 proposes dropping them | SKODA-810, SKODA-520, SKODA-504a | client question (Škoda Communications / IR): 'Where should the annual reports, and other corporate documents with no page (board CVs, old technical-data sheets), live after go-live, and who owns them?'; amend SKODA-520: add an 'externally referenced orphan documents' list (seeded from the Wikipedia/Wikidata lists and the CDN logs) that is ingested and redirected; amend SKODA-810: keep or redirect the annual-reports sub-type to the agreed home |
| G-KO-03 | Medium | UNDER-SCOPED | not required |  | Nobody owns continuity for the reports that consume Storyboard analytics: every URL changes form, outside-clicked downloads lose their server-side count, and 905 never names a report or its owner | SKODA-905, SKODA-804, SKODA-520 | client question to Škoda analytics (with G-A-03/G-B-04): 'Which reports or dashboards read Storyboard GA4/sDrive data (PR KPIs, download counts), and must their series continue across the cutover?'; amend SKODA-905: a cutover annotation, path normalisation guidance for reports, a download-KPI parity decision (DAM delivery logs or redirect-with-event), and the cross-domain list updated for the DAM delivery host |
| G-KT-03 | Medium | UNDER-SCOPED | not required |  | Listing filters are frozen at the source snapshot: a 2027 Year option (and any new model) will not be offered on News, Images, Videos or Press kits, and the generator scrapes the WordPress site that is being shut down | SKODA-402, SKODA-402d, SKODA-401, AR-15 | amend SKODA-402d: values not in the page list are offered after the listed ones (at least for `years`), and the labels plus page lists move to an author-owned DA sheet. Add a test with a 2027 row; retire the scrape after cutover. |
| G-KT-04 | Medium | UNDER-SCOPED | not required |  | Newsletter consent is time-limited and renewed on Storyboard ('Predĺženie súhlasu'); no ticket builds the extend flow, so subscribers lapse after cutover | SKODA-904, SKODA-845, D4 | client question to Škoda marketing and mailguide: 'How long is newsletter consent valid, when do re-permission emails go out, and which URL do they link to?' Then amend SKODA-904: an extend flow (or an ESP-hosted page) plus a redirect for the links in emails already sent. |
| G-KT-05 | Medium | ESTIMATE-RISK | not required |  | Every story page loads the full locale index; at full corpus that is ~4.3 MB of JSON in ~5 sequential requests, growing ~150-370 rows a year, and no ticket measures it | SKODA-401, SKODA-702 | amend SKODA-401 (or the M2 NFR gate, G-H-02/G-G-11): add a slim index for rails and cards (recent N months, or per template, with fewer columns), keep the full index for listings and search, and set a budget per page type. Load a 5k-row synthetic index and measure. |
| G-KT-06 | Medium | UNDER-SCOPED | not required |  | Certificates and the domain all come up for renewal in Q1 2027, and the only expiry register covers the media sync | SKODA-511b, SKODA-520, D14 | amend the launch ticket (G-F-01) or SKODA-511b: one site-wide renewal calendar with owners and reminders. It covers the production CDN certificate (ACME automation, or a confirmed renewal process if Škoda policy needs OV), the cdn certificate until 520 retires the host, the domain, CDN purge/push-invalidation tokens, every admin-API key, and the WordPress fallback's TLS for the length of the rollback window. |
| G-KT-07 | Medium | NEW | not required |  | Analytics continuity is unplanned: every URL changes form at cutover, and nothing covers the baseline, annotations or the mapping of page dimensions | SKODA-804, SKODA-905, D10 | amend SKODA-905 (or the SEO migration plan G-F-06): export a 4-week baseline per template and locale before the freeze, annotate the switch, document old-to-new page.* values, add a slash-normalised page dimension, and compare week 1 and month 1 with the baseline. |
| G-KT-08 | Medium | NO-OWNER | not required |  | Scheduled publishing has no M2 vehicle: requirement 6.3 'schedule' maps only to closed M1 SKODA-602, and the press office releases on the hour | SKODA-602, SKODA-811, D9 | amend SKODA-811 (or a 1-2 SP ticket): decide the mechanism (a scheduler in aem.live/DA if the client is entitled, or a cron Action/App Builder job calling the admin API, whose key then joins the renewal calendar G-KT-06). Rehearse one timed release, including the index refresh, before go-live. |
| G-T1-05 | Medium | UNDER-SCOPED | not required |  | Shared root documents (/redirects, /metadata, /nav, /footer, /media-room/*) have no permission row or locale owner; a local office can't add its own redirect or switch its chrome | SKODA-101a, SKODA-103, SKODA-103a, SKODA-1006 | amend 101a T1: per-document DA rows for the shared root docs (HQ admins write, locale editors read), and either a 'request a redirect/bulk row' step for locale editors or locale-scoped write on /redirects with a check that rejects rows outside the editor's locale. Note in 1006 that publishing the locale chrome is a go-live step. |
| G-T1-06 | Medium | UNDER-SCOPED | not required |  | The move/rename runbook leaves the old URL in the query index, the rails and the sitemap: it never says to unpublish the old path | SKODA-103, SKODA-103a, SKODA-1005 | amend the author guide (842 README / client guide) and G-KJ-07's runbook: redirect row (slashless) → publish /redirects → move → publish the new path → unpublish the old path → fix backlinks via a dead-link check → re-link the translation group. Optionally extend `import:deadlinks` into an author report. |
| G-T1-07 | Medium | NEW | not required |  | A new press kit by hand: the chapter list is copied into every chapter, the 200-image split needs a developer, and the whole-kit ZIP has no post-go-live path | SKODA-805, SKODA-806a, SKODA-847, SKODA-842, SKODA-902 | amend 806a: post-go-live ZIP = an editor upload to AEM Assets (needs G-T1-01's group) or a cart-built ZIP (902); amend 805/842: the chapter bar from one per-kit fragment (or the kit folder in the index), and a library note on splitting image chapters into fragments without a developer. |
| G-T2-01 | Medium | UNDER-SCOPED | not required |  | The listing's facet vocabulary is a third, code-bus copy scraped from WordPress: it is already stale (new VIP option 'biene'), it gates all 15 facets on 4 pages, and SKODA-841's 'one vocabulary' leaves it out | SKODA-841, SKODA-402d, SKODA-402, AR-15, G-KT-03 | amend SKODA-841 step 4: facet-labels.json (labels, `_pages`, `_hidden`) is generated from /en/facet-values.json (or listing reads facet-values with a per-page column); values not in a page list are offered after the listed ones; retire build-facet-labels.mjs at the freeze. Until then run `--check` before each import batch. Merge with G-KT-03. |
| G-T2-02 | Medium | NO-OWNER | not required |  | Parent category archives depend on ancestor tokens that only the importer writes (CATEGORY_PARENTS); a story authored after cutover in a child category doesn't appear on /en/category/skoda-world, /models or /lifestyle | SKODA-841, SKODA-831, SKODA-842, AR-07 | amend SKODA-841: publish the tree as a DA sheet (/en/category-tree.json, from CATEGORY_PARENTS) and have the stories block expand a configured category to its descendants (or have the options sheet write ancestors); fix the template prompt; retire build-category-parents.mjs. |
| G-T2-03 | Medium | UNDER-SCOPED | not required |  | The DA page templates (SKODA-842) hard-code 6 cdn.skoda-storyboard.com images and live-site links that every new page copies; SKODA-520's census and gate leave out /library/** | SKODA-520, SKODA-842, AR-01 | amend SKODA-520: add /library/** (templates and block samples) to media:source-census and the zero-reference criterion; amend 842: templates-spec.mjs uses DAM/Media Bus URLs and site-relative links, regenerate and re-upload. |
| G-T3-01 | Medium | UNDER-SCOPED | not required |  | The Wikimedia citation list behind B-08 / KJ-04 covers 5 wikis; 9 more editions, the http protocol and Commons add 132 links (+55%), 53 new URLs and twice the annual-report citations | SKODA-520, SKODA-810, SKODA-103a | fold into the 'URL migration QA' ticket (G-F-06): build the external-citation list from the Wikimedia externallinks dumps (all ~330 wikis + Wikidata + Commons, offline, no rate limit), refresh it 4 weeks before the DNS switch, and use it as the KO-02 orphan-document seed list |
| G-T3-02 | Medium | UNDER-SCOPED | not required |  | Root-level attachment pages (/en/<image-slug>/) are a third attachment shape; the proposed '/attachment/' regex misses them, and they are 3% of the externally cited URLs | SKODA-103a, SKODA-103 | amend the G-F-04 / G-E-02 rule set: export all attachment slugs + file URLs + post_parent from the WordPress DB (client/agency query), generate redirect rows (root-level slug -> parent post, else the DAM file or the media listing), keyed on the raw source path; add 10 root-level samples to the harness |
| G-T3-03 | Medium | UNDER-SCOPED | not required |  | The press-release category feed /en/press-releases/feed/ has 94 Feedly subscribers; the day-one feed set is 5 URLs and 356 subscribers, not 262 | SKODA-405, SKODA-103a | amend SKODA-405 / KJ-06 delivery: the day-one acceptance list is /en/feed/, /en/press-releases/feed/ (+ slashless), /en/feed/?post_type=press_release, /cs/feed/, /de/feed/, each 200 application/rss+xml or a single 301 to the EDS feed; exempt them from the slash rule or test the 2-hop chain with a real reader (Feedly 'refresh' after cutover) |
| G-T3-04 | Medium | NO-OWNER | not required |  | No owner or timeline for referrer outreach; Skoda-owned referrers can switch to slashless URLs today, which work on WordPress and EDS | SKODA-1004d, SKODA-1004e, SKODA-103a | new task under the launch/URL-QA ticket (G-F-01 / G-F-06): owner outreach list (md table) sent by Skoda Communications by 2026-11-15, owners switch to slashless URLs before 2026-12-15, re-crawl the list after the DNS switch; client question: 'Who in Skoda Communications sends the link-update notice to importers and Skoda web teams?' |
| G-A-07 | Low | CONTRADICTED | CONFIRMED |  | Hotjar, gomexlive, Twitter ads and the cloudfunctions sync server are dead CSP entries; 804 scopes Hotjar and the wrong sGTM host | SKODA-804 | amend SKODA-804: drop Hotjar and the cloudfunctions endpoint; build the EDS CSP (if any) from measured hosts, not the WP CSP |
| G-A-09 | Low | UNDER-SCOPED | not required |  | IIHF 2021 template: 9 pages, not 1; 3 mill pages load a dead dev host and carry the site's only reCAPTCHA key | SKODA-210, SKODA-843 | amend SKODA-210/843: import the 3 mill pages as generic pages without the app; redirect or retire the IIHF app pages (843 already asks keep/redirect) |
| G-B-05 | Low | NEW | not required |  | speeches/v1 is dead: the Speeches category is empty and the speeches widget renders nowhere sampled; only the archive URL needs a redirect | SKODA-209, SKODA-103 | amend SKODA-103: redirect row for /{loc}/category/media/speeches/ (to the Media Room) if it is not in the archive list |
| G-B-13 | Low | NEW | not required |  | Two more WordPress environments (stage., test.skoda-storyboard.com) and a dev-host script reference sit outside the decommission scope | SKODA-210, SKODA-843 | client question for the decommission plan: list every WP environment and database copy and confirm deletion dates; ask whether IIHF submission data still exists |
| G-C-05 | Low | CONTRADICTED | CONFIRMED |  | Counts in the backlog are off ('212 terms', SK 159), and the empty SR/SL archives are not planned | SKODA-206, SKODA-1004c, SKODA-1004d, SKODA-1004e | Fix the numbers in 206, the ui-spec and 1004c; add /sr/skodapedia and /sl/skodapedia redirects (to EN or the locale home) to 1004d/e. |
| G-C-06 | Low | UNDER-SCOPED | not required |  | Term bodies carry Vimeo embeds, MP4 downloads and featured images that 802 ('reuse blocks, no new blocks') does not list | SKODA-802, SKODA-204 | Amend SKODA-802: list embeds, MP4 manifest rows and featured images in the generator; skip or fix the empty SK term. |
| G-C-07 | Low | NO-OWNER | not required |  | No authoring flow for adding or editing a term (directory row, term doc, in-body link) and no owner | SKODA-802, SKODA-842 | Amend SKODA-802: an authoring section plus a DA library entry for the term doc and the in-body term link; name the owner under D8. |
| G-D-04 | Low | NO-OWNER | not required |  | Two Buzzsprout shows feed Apple/Spotify/Amazon/YouTube with Storyboard links; the EN show is owned by a personal Gmail and no one owns the cutover update | SKODA-103a, SKODA-309 | client question: 'Who owns the Buzzsprout account(s) ([personal email address, kept in the working files]) and will update the show website links after go-live?'; add the two show links to the cutover runbook (verify 301 + archive 200) |
| G-E-03 | Low | NEW | not required |  | 18 locale-less global-categories archives are missing from the coverage matrix and SKODA-848 | SKODA-848 | amend SKODA-848: add the 18 global-categories URLs to the redirect list (model terms to /en/models/{model}, others to the facet listing) and add a matrix row |
| G-E-04 | Low | UNDER-SCOPED | not required |  | The source 404 rotates two variants and both exist as indexable pages; SKODA-706 specifies only one | SKODA-706 | amend SKODA-706: record the variant decision (one, or rotate both); redirect the 2 content URLs to /en |
| G-E-05 | Low | NEW | not required |  | The speeches/v1 widget is live code with unknown usage; the 'not a CPT' check never looked for pages that render it | SKODA-803, SKODA-847 | amend SKODA-803/847: add a 'speeches__list-directory' signature to the corpus run and list the pages that hit it. If any do, the content must be baked in at import (POST is not allowed in read-only review, so it can't be fetched now) |
| G-E-06 | Low | NEW | not required |  | The privacy link on the footer-linked copyright page is dead on the source; the press-kit privacy statement 301s to itself | SKODA-843 | amend SKODA-843: the legal owner confirms the privacy target (likely /en/documents/consent-…); fix the link at import |
| G-F-08 | Low | NO-OWNER | not required |  | Search Console is verified by a DNS TXT record and the zone holds 2 more TXT tokens of unknown owners; the DNS change must keep them |  | client question: 'Who holds the Search Console property for skoda-storyboard.com (domain or URL-prefix), and can the delivery team get read access before go-live? Whose is the TXT token _40hmtm87…?' |
| G-F-09 | Low | UNDER-SCOPED | not required |  | Minor taxonomy sitemaps outside SKODA-848: /global-categories/* (18, no locale), /en/type/gallery\|video (post_format) and the 6-locale taxonomy volume | SKODA-848, SKODA-209, SKODA-1001 | amend SKODA-848: extend the keep/redirect rule to every locale and to global-categories, post_format and skodapedia-catagory (redirect /global-categories/* and /en/type/* to the matching listing) |
| G-F-10 | Low | NEW | not required |  | WordPress admin paths stay publicly reachable until cutover; after it EDS 404s them, with no 410/block rule at the CDN |  | note in the launch ticket (G-F-01): optional CDN 410 for /wp/*, /wp-*.php, /xmlrpc.php; IP-restrict the admin if WP is kept as a legacy origin |
| G-G-12 | Low | UNDER-SCOPED | not required |  | EDS adds its own client-side identifiers (persistent media-cart device ID in localStorage) that are not in the Škoda CCM cookie inventory, and 902's server-side cart state has no retention rule | SKODA-804, SKODA-902 | amend SKODA-804: list the EDS storage keys for the CCM owner and request a cookie rescan on the production host at cutover; amend SKODA-902: retention and deletion for any server-side cart state |
| G-G-13 | Low | NO-OWNER | not required |  | The live redirects sheet still sends '/' to a feature-branch draft on .aem.page; the 702 follow-up was never filed | SKODA-702, SKODA-1003, SKODA-103 | amend SKODA-1003: delete the '/' row (interim: '/' → '/en') and add 'no redirect targets a preview host or /drafts/' to the cutover smoke tests (G-G-02) |
| G-H-10 | Low | NO-OWNER | not required |  | Milestone and file drift: 5 issues still open on the past M1 milestone, 7 new defects unmilestoned, 26 closed tickets whose files say TODO or in review | SKODA-704, SKODA-514, SKODA-703a, SKODA-842, SKODA-215, SKODA-834 | close or move the 5 M1 issues to M2; milestone #403-#413; open an issue for 703a; one pass to sync ticket-file Status lines with GitHub state; reopen or follow up 842 if the DA library ACs are unmet |
| G-KO-04 | Low | NO-OWNER | not required |  | The Vimeo privacy allow-list is a Škoda vendor setting nobody owns: 20% of media-library videos only play on skoda-storyboard.com, and 608's 'not emitted' rule drops them from production too | SKODA-608, SKODA-204 | client question to the Vimeo account owner: 'Add *.aem.page and *.aem.live to the allow-list for QA, or confirm production-only playback'; amend SKODA-608: emit restricted ids on the production build |
| G-KT-09 | Low | UNDER-SCOPED | not required |  | The 200-image preview limit is handled only by the importer; press kits that authors build after go-live hit it with no guard or guidance | SKODA-806, SKODA-842, AR-12 | amend SKODA-842 (DA library) or 806: a 'press-kit image group as fragment' library entry, an image count in the pre-publish check (AR-17), and one line in the author guide. |
| G-KT-10 | Low | NEW | not required |  | The copyright year is hard-coded '© Škoda Auto a.s. 2026' in the authored footers, so it is stale on launch day | SKODA-304, SKODA-1003 | amend SKODA-304/1003: the footer block replaces a 4-digit year in .copyright-notice with the current year (or add it to the annual run calendar). |
| G-T1-08 | Low | NEW | not required |  | The DA library templates are EN-only: hard-coded /en paths, the EN media feed and EN banners land in every CS/SK page created from them | SKODA-842, SKODA-1001, SKODA-1003 | amend 842 (or 1001): generate templates per locale from the 1001 base map, or use a [locale] prompt that the metadata check (AR-17) rejects if left unchanged. |
| G-T2-04 | Low | NO-OWNER | not required |  | No register says which source-scraped generators retire, which move to DA sheets and who owns them after the freeze; AR-07 was never ticketed, and its M1 delete of the dead Elroq transformers isn't done | AR-06, AR-07, G-G-02 | add a 'generated data at cutover' table (tool, output, retire/replace, owner) to the cutover runbook from G-G-02 or to SKODA-803; delete the 2 dead transformers. |
| G-T3-05 | Low | UNDER-SCOPED | not required |  | A CDN redirect map keyed on exact file paths misses cited URLs that carry GA4 _gl linker queries or a trailing slash after .pdf | SKODA-520, SKODA-103a | add to the B-08 CDN redirect-host spec: normalise (drop query, strip trailing '/') before the manifest lookup; add these 6 URLs to the harness |
| G-T3-06 | Low | NO-OWNER | not required |  | Nobody has asked for the Search Console Links export or the www referrer logs, and both disappear or go stale at cutover |  | client question (extend F-08): 'Please export the Search Console Links report (top linked pages, top linking sites, top linking text) and 90 days of www and cdn access logs (path, status, referrer, user agent; IPs removed) by 2026-11-30, and keep the logs until 8 weeks after go-live.' |

## 6. Adversarial pass

**Refuters** checked 36 findings: 32 CONFIRMED, 3 PLAUSIBLE, 1 REJECTED.

- **Rejected:** G-B-12. The live consent layer is OneTrust through the Škoda CCM, not the WordPress cookie bar; the
  browser confirmed it.
- **Merged:**
  - G-G-01 → G-F-01 (production launch);
  - G-B-04 → G-A-01 (sDrive);
  - G-E-02 → G-F-04 (attachments);
  - G-A-08 → G-D-05 (AI audio);
  - G-H-06 → G-H-05 (one owned decision and question log).
- **Downgraded High → Medium**, with the refuters' reasons:
  - G-A-03: D10 is already open and 804/905 need the container spec;
  - G-B-06: `/en/newsletter-settings/` is in D4/904; this is an AC amendment;
  - G-C-02: D8's default is what 802 follows; 206 is stale;
  - G-H-01: MR-L01/L03 have D6/D12 defaults;
  - G-H-07: the locale amendments are listed and await a go-ahead.

**Blind-spot critics** raised 26 findings and 24 challenges to existing findings. The challenges that change a finding's
scope:

| Challenge | Effect |
|---|---|
| Inventory → G-F-01 | DNS covers **11 alias hostnames** in 3 owner families, not just www + the bare domain |
| Inventory → G-G-03 | **skoda-motorsport.com shares the WordPress hosting**, so ending the hosting takes it down |
| Inventory → G-B-07 | A zero-reference gate passes when the importer *drops* a reference (ys-embed-share, Spotify), so the gate needs a drop count too |
| Journeys → G-H-01 | Requirement **6.3 "schedule"** is missing from the list of IDs mapped to closed tickets |
| Journeys → G-G-02 | The delta import must key on `modified_gmt`: post-publish edits are routine |
| Outside → G-B-08 | Referrer volume can be measured: Wikipedia has 219 links in 101 articles, 40 of them to the CDN |
| Outside → G-F-03 | Google News surfaces 44 EN and 100+ CS items in 30 days, so JSON-LD and article meta are closer to a blocker |
| Time → G-G-03 | The rollback window is capped by the WordPress certificate, which can't renew once DNS moves (≤ 90 days) |
| Time → G-H-05 | 73 calendar days are **47 Czech working days**, 7 of them in the last 2 weeks; set due dates in working days |

**New areas.** The cap of 3 applied round-robin per lens:

| Lens | New area | Status |
|---|---|---|
| Journeys | Day-2 authoring journeys | **Run** (G-T1-01 … G-T1-08) |
| Time | Source-generated data that freezes | **Run** (G-T2-01 … G-T2-04) |
| Outside | Inbound-link inventory | **Run** (G-T3-01 … G-T3-06) |
| Inventory | Full-corpus census of in-body widgets vs importer handling | **Not run**: proposed as part of N11 |
| Inventory | Legacy domain, certificate and shared-hosting estate | **Not run**: folded into N1 and N3 |
| Journeys | What a WordPress publish triggers (mailguide, app push, AI audio, feed pings) | **Not run**: needs agency or database access |
| Journeys | Dynamic URL resolution parity (old slugs, guessed permalinks) | **Not run**: needs `_wp_old_slug` and nginx logs |
| Outside | Distributed documents (PDFs, kits, technical data) | **Not run**: partly covered by G-KO-01/02 |
| Time | Year-one run calendar | **Not run**: folded into N4 |

**Second verification round (before ticketing).** Three refuters re-checked the 12 High findings from the critics and
top-ups: **all 12 confirmed**.
- **Merged:**
  - G-KI-04 → G-F-01 (alias domains in the launch scope);
  - G-KT-01 → G-G-02 (calendar as a runbook criterion);
  - G-KO-01 → G-B-08 (PDF links are inbound links);
  - G-T1-01 → G-KJ-02;
  - G-T1-02 → G-KJ-03;
  - G-T1-03 → G-KJ-01.
- **Downgraded to Medium:** G-KO-01 and G-T1-03.
- **Refined:**
  - G-KJ-01: the native Experience Workspace Schedule Publish plugin replaces a custom scheduler (≈ 1–2 SP).
  - G-KJ-02: not a go-live blocker. Press-office authors can paste DAM publish URLs.
  - G-KT-02 is worse than stated: on the production host, `links.js` opens every internal link in a new tab with
    `noreferrer`.
  
The 32 Medium and Low critic and top-up findings were not re-verified. One was spot-checked by hand (G-KO-02, which
holds).

**Hand spot-checks:**
- **G-B-01:** the app exists, published by ŠKODA AUTO a.s., v7.1.37. The docs mention only its badges and promo page.
- **G-F-01:** only 103a mentions a production CDN. The nameservers are Škoda's own.
- **G-KO-02:** the 2024 annual report returns 200 on the CDN, `/en/annual-reports/` returns 404, and there are 0
  manifest rows.

All three hold.

## 7. Proposed changes (pending approval; nothing has been changed)

### 7.1 New tickets

| # | Ticket | Covers | Rough size |
|---|---|---|---|
| N1 | **Production launch:** CDN choice (D14), DNS for www, bare domain and 11 alias hosts, TLS, the config-service production host, push invalidation, legacy-origin route | G-F-01, G-KI-04, G-KT-06 (certificates) | 3 SP + Škoda IT lead time |
| N2 | **Cutover runbook and calendar:** freeze, delta import on `modified_gmt`, go/no-go, rollback window, holiday calendar, `links.js` LIVE_ONLY switch | G-G-02, G-KT-01, G-KT-02 | 3 SP |
| N3 | **WordPress decommission and archive:** read-only archive, personal data in 3 environments, licences, hosting end, the skoda-motorsport.com dependency, stage and test environments | G-G-03, G-B-13, inventory challenge | 3 SP |
| N4 | **Operating model and year-one run calendar:** hypercare, training, hand-over (GitHub, Code Sync, config, DA), licence and renewal register with dates, RUM and 404 monitoring | G-G-07, G-G-04, G-KT-06 | 3 SP |
| N5 | **SEO migration:** production sitemap and robots per locale, JSON-LD and article meta (Google News), noindex for fragments, SEO owner, baseline and post-launch monitoring | G-F-02, G-F-03, G-F-06, G-F-07, G-KT-07 | 5 SP |
| N6 | **Legacy URL resolution beyond the sheet:** attachment pages (3 shapes), query routes, old slugs (a 404 lookup against the index), inbound `/direct-download/`, CDN and `wp-json` paths | G-F-04, G-KJ-04, G-B-08, G-T3-02, G-T3-05 | 5 SP |
| N7 | **Security headers and CSP** on the production CDN, tested against GTM, OneTrust and the CCM | G-F-05 | 2 SP |
| N8 | **Škoda consent and group tracking:** sDrive and CCM, `legal-entity-id` per locale, OneTrust ids, SL banner, embed-to-consent-group map; amends 804 and 905 | G-A-01, G-A-02, G-A-05, G-A-06 | 3 SP |
| N9 | **External consumers:** the mobile app's content source and vendor contact, newsletter manage pages (EN, CS, SK, motorsport), RSS delivery (5 feeds), podcast channel links and owner, referrer outreach | G-B-01, G-B-06, G-KJ-05, G-KJ-06, G-B-03, G-T3-03, G-D-04, G-T3-04 | 5 SP + vendor time |
| N10 | **Media beyond images:** the MP4 library (0.4–0.6 TB), annual reports and release PDFs, non-EN CDN references, captions and transcripts, Vimeo allow-list owner | G-D-01, G-KO-01, G-KO-02, G-B-07, G-D-02, G-KO-04 | 5 SP |
| N11 | **In-body widget census and handling:** Škodapedia glossary spans, `ys-embed-share` HTML, Spotify/Instagram/LinkedIn, `skoda_iframe`, quizzes; plus a "dropped" count in the import gate | G-C-01, G-KI-01, G-KI-02, G-KI-03, G-KI-05 | 5 SP |
| N12 | **Day-2 authoring:** Schedule Publish, Snapshots and Request Publish enablement, downloadable originals, the embargo asset gate, path-limited publishing, shared root docs, takedown and rename runbooks, new press kits, locale-aware DA templates | G-KJ-01 … 03, G-KJ-07, G-T1-01 … 08, G-KT-08, G-KT-09, G-T2-03 | 8 SP |
| N13 | **Source-generated data after the freeze:** move facet vocabularies and category parents to DA sheets or the index; a register of all generators with owners | G-T2-01, G-T2-02, G-T2-04, G-KT-03 | 3 SP |

### 7.2 Ticket amendments
| Ticket | Amendment | From |
|---|---|---|
| 210 | Event-gallery day pages are download galleries (~240); image volume into 517/520 | G-E-01 |
| 802 / 206 | Reconcile the scope (206 is stale), facets in the parser, term URLs at their public path, panel replacing the `wp-json` endpoint, term-body media | G-C-02 … G-C-06 |
| 204 / 204a | AI audio = Buzzsprout iframe; authoring path; disclosure outside the iframe | G-D-05, G-G-09 |
| 405 | Feed variants (atom, rdf, press kits, Škodapedia), full text vs summary, delivery | G-B-03, G-KJ-06 |
| 848 | Podcast archives and 18 global-categories archives | G-D-03, G-E-03 |
| 706 | Both 404 variants | G-E-04 |
| 843 | Fix the dead privacy link on `/en/copyright/` | G-E-06 |
| 904 / 845 | Motorsport cross-site lists, CS and SK manage pages, consent renewal ("extend") flow | G-B-06, G-KJ-05, G-KT-04 |
| 608 / 511 | Domain-locked Vimeo ids after cutover; stale feed items | G-KO-04, browser note |
| 101a | State MFA (WordPress has 2FA and passkeys today) | G-G-06 |
| 304 | Copyright year from the build or a placeholder, not hard-coded | G-KT-10 |
| 401 / 402 | Index size at full corpus (~4.3 MB, 5 requests per story page) | G-KT-05 |

### 7.3 Decision register (new rows)
| # | Question | Proposed default | From |
|---|---|---|---|
| Q-16 | Pre-consent tracking: keep Škoda's sDrive "zero-tracking" pings before consent (as today) or gate everything | Keep parity with skoda-auto.com, as decided by Škoda's privacy office | G-A-02 |
| Q-17 | Attachment pages (42,275): redirect each to its parent post, to the asset, or 410 | 301 to the parent post where one exists; otherwise 410 | G-F-04 |
| Q-18 | Self-hosted MP4 library (0.4–0.6 TB): AEM Assets, Vimeo, or keep the CDN | AEM Assets originals with Media Bus posters; the CDN stays read-only until references are gone | G-D-01 |
| Q-19 | Quizzes (54) and interactive embeds | Keep the interactive HTML as static assets; quizzes need a client keep or drop answer | G-KI-01, G-KI-03 |
| Q-20 | Go-live date: Saturday 2 Jan after the holidays, or a weekday in January | A weekday switch with a freeze from 18 Dec | G-KT-01 |
| D14 (update) | Production CDN: which one, and who operates it | Adobe-managed CDN unless Škoda IT requires its own | G-F-01 |

**Register hygiene (G-H-05):** add owner, asked-on and due date (in working days) to every red and amber row, and keep
one client-question log.

### 7.4 Questions for the client
1. **Škoda IT (DNS, CDN, certificates):**
   - Who changes the DNS for skoda-storyboard.com and the 11 alias hosts, with what lead time?
   - Which production CDN do you use?
2. **Mobile app (iComVision):** Which endpoint does the app read? Who maintains it, and can it switch to the EDS index
   or RSS?
3. **skoda-motorsport.com:** It shares the WordPress hosting and the newsletter settings. Who owns it after the
   decommission?
4. **Privacy office:**
   - Is pre-consent sDrive tracking acceptable as today?
   - Where is the SL consent banner?
5. **Podcasts:** Who owns the Buzzsprout shows (the EN show is on a personal Gmail)? Who updates the channel links at
   cutover?
6. **Content:**
   - Keep or drop the 54 quizzes and the annual-report page?
   - Should Wikipedia and Wikidata citations be updated?
7. **Go-live date:** Saturday 2 Jan, or a weekday?
8. **Vendors:** Vimeo allow-list, Buzzsprout, mailguide and OneTrust account owners and renewal dates.

### 7.5 Backlog hygiene (H)
- Put the 63 epic-labelled issues under their epics. E10 #96 should hold 1001–1006. E01 #1 is closed while #402 and
  #407 are open (G-H-09).
- Move 901, 903, 905 and 906 (29 SP) off M2 if their register defaults hold (G-H-08).
- Add M2 vehicles for the 12 requirement IDs mapped only to closed M1 tickets, plus 6.3 (G-H-01).
- Apply the locale review's §5.2 amendments (G-H-07).
- Reopen or fix SKODA-834: the widget autoblock still has no origin check (G-H-04).

## 8. Limits
- **Read-only and sampled:**
  - 60 inventory pages and 32 browser page loads;
  - Škodapedia sampled on 3,374 bodies;
  - no server logs, database exports, GTM export, or Search Console or analytics access.
- **Not measured:** referrer volumes, plugin publish hooks and old-slug traffic. These need agency, database or log
  access (§6, areas not run).
- **Estimates:** the "rough size" column is a planning estimate, not a quote.

### Checklist status per area

- **A:** A1 runtime requests per template: done: 11 source pages measured pre-consent (home en, story Peaq, 3 press release; A2 OneTrust: done: Skoda CCM selects OneTrust script per legal entity; 5 script ids, 5 catego; A3 GTM/GA4/FB/dataLayer: done: GTM-M5GMBWF on all locales; container holds 7 GA4 ids, 2 FB pixels, sGTM o; A4 AI audio box: done: Buzzsprout iframe, '#ExploreSkoda News' AI-voiced episodes; TTS vendor beh; A5 embeds: partial: Vimeo/YouTube/Buzzsprout consent behaviour measured; one Vimeo plays fr; A6 Skoda cross-domain services: done for sDrive (endpoint/sync/ccm/zero-tracking + Cloud Run endpoints); chargin; A7 fonts/icons/CDN + CWV: partial: third-party host counts and timing on a story (13 hosts / 29 requests c; A8 other areas needs-browser: done: 2 [B] requests answered in browser-answers.md (09:33); re-checked at end; A9 server-side GTM cloudfunctions: done: 0 refs in GTM container, 0 runtime calls; live sGTM is sgtm-hq-prod-qi2yta; A10 gomexlive: done: 0 refs in GTM, 0 runtime requests on 17 page loads; stale CSP entry; A11 Hotjar: done: inactive (data-store config hotjar:null on 60/60 samples, 0 GTM refs, no r; A12 reCAPTCHA: done: only on the IIHF 2021 app form (key 6LdvOMAa..., 1/60 samples); not on liv; A13 cross.skoda-auto.com + sdrive.azureedge.net: done: see G-A-01/G-A-02; A14 iihf-app.skoda-storyboard.loc: done: template-iihf-2021 on 9 pages; 3 UNIMILLS mill pages load the dev host; A15 Twitter ads / DoubleClick / Instagram: done: no ads-twitter/Instagram at runtime or in GTM; DoubleClick only as Google 
- **B:** B1 wp-json namespaces and routes: done; B2 external consumers (app, mailguide, partner feeds, Google News, podcasts, widgets): partial: app endpoint and mailguide content pipeline not observable without app ; B3 /direct-download/ inbound links: done (G-B-07, G-B-08); external referrer volume needs server logs; B4 RSS feeds per locale and type: done (G-B-03); subscribers unknown; B5 forms beyond the newsletter: done: only newsletter (904) + search; comments 0; IIHF competition dead (G-B-13); B6 source CDN hotlinks + decommission (520): partial: no hotlinks on skoda-media.de / skoda-auto.com / skoda-motorsport.com h; B7 unknown custom namespaces (speeches, mediakit, skt, site-info, data-store): done (G-B-02, G-B-05, G-B-12); B8 mobile app ids, content, endpoint: partial: ids, vendor, version and content found; endpoint needs a client/vendor ; B9 media-cart/v1 history/actions: done (G-B-09); B10 skoda-banners redirect: done: redirect URLs live only in the list JSON; no inbound use found (positive); B11 WordPress plugins with licences/telemetry: done (G-B-10); B12 go.skoda.eu shortlinks: done (G-B-11); full list needs the owner; B13 (added) Škoda group tracking sdrive: done (G-B-04); B14 (added) other WP environments: done (G-B-13); B15 (added) consent backend data-store vs OneTrust: needs-browser (G-B-12; sdrive pre-consent firing for G-B-04)
- **C:** C1 inventory per locale (directory, terms, categories, A-Z, search): done; C2 in-body glossary (markup, counts per locale, importer gap): partial: counts measured on 3,374 REST docs, not the whole corpus; the importer ; C3 term page behaviour (canonical, hreflang, modal vs URL, SEO): partial: no analytics or backlink data available; SEO value judged from canonica; C4 compare with 206, 802, D8 and the ui-spec: done; C5 authoring + owner (D8): done; C6 skodapedia/v1/term/{id} callers + fields; skodapedia-catagory sitemap: done
- **D:** D1 podcast inventory: done; D2 podcast distribution: done; D3 nav podcast link: done; D4 video: partial: per-locale Vimeo/YouTube/MP4 counts from 100 recent PRs per locale; MP4; D5 AI audio: done; D6 simplycleverpodcast2 show: done; D7 podcast archive runtime + Spotify consent (added): needs-browser
- **E:** E1 zero-live families: done; E2 per-family blocks/importer/ticket/keep-drop/redirects: done; E3 features (print, share, social cards, related, embargo countdown, comments, search suggestions, load-more APIs): partial: static HTML only. Share, load-more and search redirect checked; social ; E4 Media Room services (902, downloads, licensing, press contacts, accreditation): done; E5 sitemap/REST types with no matrix row: done; E6 speeches/v1: partial: widget exists in media-room JS; finding where it is used needs a corpus; E7 attachment pages: done
- **F:** F1 robots/sitemaps/news/GSC: done; F2 structured data/OG/article meta: done; F3 legacy domains/DNS/TLS/CDN/slash order: partial: www/apex/http/TLS/DNS measured; other legacy hostnames pointing at the ; F4 shortlinks/feeds/uploads/direct-download: done (direct-download, wp-json and CDN inbound left to G-B-08; feed variants to ; F5 security headers/CSP/WAF: done; F6 search migration 301 map/indexation/monitoring: done; F7 27 Yoast sitemap types: done; F8 source security headers vs EDS: done (merged into F5 / G-F-05); F9 wp-login/xmlrpc/wp paths: done
- **G:** G1 monitoring/RUM/error tracking/D16/812: done; G2 environments/release/freeze/cutover/rollback/WP decommission: done; G3 accessibility 703/WCAG level/statement: done; G4 performance budget per template: done; G5 legal/privacy: cookies, consent records, retention, D19: done; G6 training/author guide/support/D15/handover/costs: done; G7 WordPress 2FA vs SKODA-101a: done; G8 (added) publicly served repo files on the production host: done
- **H:** H1 requirement walk (mapping + traceability gap register): done; H2 tickets with no requirement: done; H3 GitHub drift (issues vs files, milestones, closed-but-incomplete): done; H4 open decisions without default or client owner: done; H5 client questions tracked (C1-C7, locale 5.4, I1-I4, client 10 Q1-Q12): done; H6 epic issues vs children: done
- **critic-inventory:** 
- **critic-journeys:** 
- **critic-outside:** 
- **critic-time:** 
- **topup-day2-authoring-journeys:** J1 create+schedule press release with Media Box, PDF, MP4 (EN/CS/SK): done (G-T1-01, G-T1-03, G-T1-08); J2 embargo a launch: restricted preview, assets hidden, timed multi-locale release: done (G-T1-02, G-T1-03); J3 correct / unpublish / take down one image: done: no new gap beyond G-KJ-07 (runbook) and SKODA-522/D20 (Media Bus copies); ; J4 new press kit with chapters + whole-kit ZIP: done (G-T1-07); J5 translate EN release + link the pair (1005): done: covered by SKODA-1005 + 1002; no new gap (templates note in G-T1-08); J6 add Skodapedia term + link it in a story: done: KNOWN (G-C-01 in-body glossary, G-C-07 no term authoring flow, G-C-02 scop; J7 move/rename page + redirect: done (G-T1-06, G-T1-05); J8 edit nav/footer per locale + publish the fragment: done (G-T1-05); 1006 covers the fragments themselves; J9 per step: tool, permission (809), developer needed: done: matrix in the .md (G-T1-04 for the permission model)
- **topup-frozen-source-generated-data:** T1 list source-fetching tools and outputs: done; T2 runtime use / content drift / post-cutover owner: done; T3 map to AR-06/07/15 + owner: done; T4 importer constants vs content published since import: done
- **topup-inbound-link-inventory:** T3-1 GSC + referrer log export: not-covered: client-only data (GSC property owner, Skoda IT / CloudFront logs). ; T3-2 Skoda network crawl: partial: 36 homepages fetched (35 importer sites + skoda-motorsport.com), plus t; T3-3 external URLs through redirect harness: partial: no redirect harness exists in the repo (G-F-06 proposes one). Ran an of; T3-4 owner outreach list: done: 12 referrer owners with link, action and timing (md table). No ticket owns; T3-5 feed/podcast/app/newsletter endpoints day one: done: 5 more Feedly lookups; /en/press-releases/feed/ has 94 subscribers that KJ
