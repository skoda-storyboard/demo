# M2 open scope questions for the client (2026-10-22)

These are the points where we still need the client to say whether something is really in scope for M2 (go-live
02 Jan 2027), and the build questions whose answer changes scope or effort materially. They are traced from:
- the [client requirements mapping](SKODA-CLIENT-REQUIREMENTS-MAPPING.md) and the
  [traceability gap register](SKODA-REQUIREMENTS-TRACEABILITY.md);
- the [decision register](SKODA-DECISION-REGISTER.md) (every 🔴 and 🟡 row);
- every open M2 ticket (its client sections, "to confirm" items and scope stated as an assumption);
- the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) and the
  [gap review](../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md);
- the App Builder and IdP client asks;
- the [scope and capacity doc](SKODA-M2-SCOPE-AND-CAPACITY-2026-10-22.md).

**Status: nothing has been sent yet.** The register's "Asked on" column is empty on every row, and no doc records a
question as asked or answered. 47 Czech working days remain to go-live; 7 of them fall in the last two weeks.

Each question has a proposed default. If the client confirms it, or doesn't answer by the due date, the default
becomes the M2 baseline, in line with the register's role as the input for finalising the M2 requirements.

## 1. The twelve that move the most scope
| # | Question | Default | What rides on it |
|--:|---|---|---|
| 1 | **Locales and non-EN content:** which locales go live on 02 Jan, and what happens to the ≈ 12,000 existing non-EN docs (import before DNS, or DE/SK/SR/SL stay on WordPress for now)? | EN + CS at go-live; DE/SK/SR/SL frozen and imported before DNS | D1, Q-6, Q-7 · SKODA-1004a–e (15 SP), 1001–1006 · −10 SP if the four locales wait |
| 2 | **Škodapedia:** migrate as is, prune the discontinued-model terms, or retire with redirects? Who owns the terms? | Migrate, at public paths | D8 · SKODA-206, 206a, 802a, 849a · −17 SP if retired |
| 3 | **Analytics:** rebuild Škoda's dataLayer 1:1 for the live GTM and server-side GTM, or a GA4 + FB pixel baseline? | 1:1 contract (905), for SKODA-907 | D10 · SKODA-804, 905, 907 (≈ 17.5 SP) |
| 4 | **Consent:** parity with skoda-auto.com (sDrive/CCM pings and cookies before consent) or everything gated? Which consent tool for /sl/ (no banner today)? | Parity, as Škoda's privacy office decides; SL gets a banner | Q-16 · SKODA-907, 804, 1004e |
| 5 | **Authoring permissions:** which of the 7 editorial groups exist at go-live? Who may author, approve and publish per section and locale? (EDS publish rights can't be limited by path.) | 7 groups (§6.4); a few publishers with Request Publish approvers | D15 · SKODA-809, 811, 812, 843, 850d |
| 6 | **Author sign-in:** the Škoda IdP federation, and guest accounts or separate Adobe accounts for local offices and agencies, with MFA? | IMS federation; guest accounts in the Škoda IdP; MFA on every path | Q-15 · SKODA-101a, 809, 1004b–e |
| 7 | **Content cutoff:** everything EN from 2015 (≈ 4,620 pages) and everything for CS/SK/SR/SL, or a cutoff per locale? Are legal and T&C posts exempt? | Everything; legal posts exempt | D7, Q-12 · SKODA-803, 801b, 847, 1004a–e |
| 8 | **Banners:** may Storyboard launch without the per-market ad server? Is an authored featured-promo block enough? | Yes; ad server dropped (SKODA-903 now M3) | D3 · SKODA-903 (8 SP) |
| 9 | **Podcasts:** is the Podcast section (live today: 252 + 421 episodes, EN/CS/SR/SL archives) dropped, while the AI-audio box on releases stays? Who owns the two Buzzsprout shows? | Drop the section with redirects; keep the AI-audio embed | client §9, COM03, MR-PR03 · SKODA-848, 204, 908 |
| 10 | **Production launch:** which CDN, and who at Škoda IT changes DNS (www, the bare domain, 11 alias hosts), before its year-end freeze? Saturday 02 Jan, or a weekday switch with a freeze from 18 Dec? | Adobe-managed CDN; weekday switch, freeze 18 Dec | D14, Q-20 · SKODA-709, 710, 103a |
| 11 | **Business requirements still WIP:** will Škoda finalise §5.3, §6, §7, §8 and §11.1 of its requirements doc, or do the register defaults stand as the M2 baseline? | Register defaults are the baseline | All open register rows |
| 12 | **External consumers:** the Škoda Media Room mobile app (its content source), RSS (356 Feedly subscribers) and the newsletter: are they required at go-live, and on which terms? | Required; the app moves to the EDS index or RSS | client §9, COM19, D4 · SKODA-908a–c (11 SP), 405 |

## 2. Decided by us, still to confirm with the client
- **SKODA-901 hosted search, 903 banner ad server and 906 QR access moved to M3** on 2026-10-22, by D6, D3 and D17
  (−21 SP). The client hasn't confirmed this.
- **SKODA-905 stays on M2,** re-scoped to the dataLayer contract (D10, see §1 #3).
- **SKODA-717 bundles five as-built defaults to confirm:** COM04 secondary/model navigation, STO-H01 featured carousel
  curation, STO-H08 the Latest News rail, MR-H10 the contacts placement, and MR-L05 per-type card definitions.
- **D11:** close the Figma-to-AEM showcase now that the demo is done.

## 3. By theme

### Analytics and consent
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Rebuild the Škoda dataLayer 1:1, or GA4 + FB pixel only? Will the analytics team export GTM-M5GMBWF with its event spec and the GA4 property per locale? | The live container routes on Škoda dataLayer keys (importer.BID, page.*) and sends to server-side GTM on Cloud Run. skoda-analytics instruments forms (34 refs), downloads (23), share (14), banners (11), cart (8) and video (65) | 1:1 contract (905) | D10 · 804, 905, 907 | Škoda analytics team |
| Consent model: parity with skoda-auto.com or everything gated? | sDrive and the CCM load from cross.skoda-auto.com on every page, need a legal-entity-id per locale, and ping before consent. 804's "zero vendor calls before consent" criterion contradicts this | Parity | Q-16 · 907, 804 | Škoda privacy office |
| Which consent tool for /sl/? | Slovenia (legal entity 298) is outside the Škoda CCM and shows no banner today; Porsche Slovenija is the SL controller | A banner (tool to choose) | 907, 1004e | Privacy office / Porsche Slovenija |
| Which reports and dashboards read Storyboard data (PR KPIs, download counts), and must their series continue across the cutover? | Every URL changes form at cutover, and downloads clicked from outside lose their server-side count | Cutover annotation + path mapping (713d) | 905, 713d | Škoda analytics team |

### Authoring permissions and identity
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Editorial RACI: which groups exist, and who authors, approves and publishes per section and locale? | §6.4 lists 7 groups. Many agencies author. EDS publish rights are site-wide, so any CS or agency publisher can (un)publish EN. The AI-audio producer and the shared root docs (/redirects, /metadata, /nav, /footer) need owners | 7 groups; a few publishers + Request Publish approvers | D15 · 809, 811, 812, 843, 850d | Škoda Communications / CMS team |
| Which IdP and IMS org own production? Will the Admin Console admins federate, claim the domains and sync groups? | No IdP hook in EDS/DA. The DA permissions list 5 individual Adobe accounts and no Škoda group. It's the same IMS org as App Builder C1 | IMS federation | 101a I1–I4 · 809, 812 | Škoda IT (Admin Console / IdP) |
| How do external authors sign in, and with MFA? | Škoda Auto Deutschland, ŠKODA AUTO Slovensko, Autočačak, Porsche Slovenija and agencies may not be in the IdP. WordPress has 2FA and passkeys today | Guest accounts in the IdP; MFA | Q-15 · 101a, 1004b–e | Škoda IT |
| Is DA version history enough as the audit trail? | §6.7 is a firm requirement (many agencies), but D16 is red and the capability isn't validated | DA version history | D16 · 812 | Škoda IT security + Communications |
| Must preview (`*.aem.page`) require sign-in for embargoed content? | Preview answers without sign-in today, and SKODA-811 stages embargoed content on it | Protect preview; live stays public | 101a T3, 811 | Communications / IT security |
| Must timed releases work at go-live? | Half of HQ's releases go live on a quarter hour. Requirement 6.3 "schedule" had no M2 ticket until 850a | Native Schedule Publish, rehearsed once | 850a, 811 | Press office / Adobe account team |

### Business requirements and non-functional targets
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Will the WIP sections of the requirements doc be finalised, or do the register defaults stand? | The doc (v110926, a DRAFT, "≈ 90 %") still has §5.3 Media Room (WIP), §6 Editorial/Authoring/DAM (WIP), §7 Content Migration (TBD), §8 Non-functional (TBD), §11.1 (unverified) and 12 open §10 questions | Register defaults are the baseline | Every open row | Requirements-doc owner |
| Accessibility target: WCAG 2.1 AA or 2.2 AA? Is an accessibility statement page wanted? | The level is "TBD". The 703 screen-reader pass is open, and the M2 templates have no audit yet | WCAG 2.1 AA (716) | 716, 703 | Škoda accessibility / legal |
| Performance target: Lighthouse mobile ≥ 90, Core Web Vitals "good" at p75, or both? | The targets conflict across docs; mobile Lighthouse measured 48 on /en | Both (715) | 715, 401a | Škoda digital / IT |
| Availability, recovery, browser support and security-header baseline? | D16 is red. Security headers drop at the switch, and no VW-group header baseline is known | none proposed | 812, 714 | Škoda IT security |

### Podcasts and AI audio
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Is the Podcast section dropped at go-live? | Client §9 calls it unused, but it's a live category with archives in EN (30 episodes), CS (20), SR (21) and SL (17), and the Stories nav lists it | Drop with redirects | COM03 · 848, 301 | Škoda Communications |
| Who owns the two Buzzsprout shows, and who updates their channel links at cutover? | 252 + 421 episodes syndicate to Apple, Spotify, Amazon and YouTube, with links into Storyboard. The EN show is registered to a personal mailbox | Add to the runbook; transfer ownership | 908, 710 | Škoda Communications |
| Who produces the AI-audio readings (tool, source text), and do they continue on EDS? Is a visible "AI-generated voice" label required? | On 89/100 EN and 91/100 CS recent releases, added after publish. The AI disclosure sits inside the consent-gated iframe | Producer role with publish rights; label per legal answer | 204, 204a, 809 | Communications / legal |

### Škodapedia (the glossary)
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Migrate, prune or retire Škodapedia, and who owns it? | 724 terms (EN 189, CS 189, DE 188, SK 158), ≈ 750 indexable URLs; 131 of 189 EN terms are unchanged since 2019. Client §9 says it "continues outside Storyboard", yet it lives on the Storyboard site | Migrate at public paths | D8 · 206, 206a, 802a, 849a (−17 SP if retired) | Škoda marketing / Communications |
| In-body glossary terms: an accessible teaser like today, or plain links? | 386 spans in 106 of 3,374 sampled docs; the importer drops them today. Plain links ≈ 2 SP, teaser 3–5 SP | Plain links at minimum | 849a | Marketing / Communications |

### Content in scope
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Cutoff per locale, and are legal and T&C posts exempt? | D7 covers EN only (everything from 2015, ≈ 4,620 pages); 23 DE posts are back-dated to 2000–2009 | Everything; legal exempt | D7, Q-12 · 803, 801b | Communications |
| Which company and legal pages exist at go-live? Is the annual-reports page dropped (it 404s), and where do the annual reports 2011–2025 live? | The reports exist only on the source CDN and are cited 26 times on Wikipedia | 4 company sub-types + BGC + legal set; reports hosted in AEM Assets | Q-1, Q-2 · 810, 843, 523c | Communications / legal |
| Which of the 378 EN taxonomy archives (+ 18 global-categories) exist? | No keep rule today; 41 are live | Keep the linked ones + terms with ≥ N items | Q-4, D12 · 848 | Communications |
| Event galleries and campaign microsites (≈ 240 pages): keep, and with the download tiles? | The day pages are download galleries for journalists (newest hub 2026) | Keep the galleries; download tiles in 210a | Q-5 · 210, 210a | Communications (Media Room) |
| Featured-image mini-pages (29: Road to Christmas, classic cars)? | Never analysed until the census | Keep on the page base | Q-3 · 844 | Communications |
| The 42,275 indexed attachment pages: redirect to the parent post, or 410? | No rule today; the slash rule would turn them into 404s | 301 to the parent, else 410 | Q-17 · 103c | Marketing / SEO owner |
| The 54 quizzes and the interactive embeds (360° tours, before/after sliders)? | The quiz answer keys exist only in the WordPress database | Packages as static assets; quizzes keep or drop | Q-19 · 849, 849b | Communications |
| 11 password-protected DE posts: exclude and redirect? | EDS has no page passwords | Exclude + redirect | Q-13 | Škoda Auto Deutschland |
| Press-release PDFs: uploaded files enough, or generated from the page? Press-kit variant selector wanted? | The source has uploaded PDFs and no selector | Uploaded PDFs; no selector | MR-PR04, MR-PK03 · 523c, 808a | Media Room |
| Is the source timeline visual (`ys-milestones`) wanted as a dedicated block? | Content is kept today; only the visual is lost | No dedicated block (815 closes) | 815 | Communications |

### Banners and promos
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Launch without the per-market ad server; is an authored featured-promo block enough? | A bespoke ad server (174 KB React; campaigns cs 51, en 46, sk 2, sl 1, de 0, sr 0; tag/geo/frequency targeting). SKODA-903 moved to M3, but D3 is still red | Drop the ad server; promo block on request | D3 · 903, 905 (banner events) | Škoda marketing |
| Which Storyboard home stripes stay, and is the Latest News rail on the Storyboard home in scope? | Client §9 "confirm which"; §10 Q12 | As built (717) | 717 | Škoda marketing |

### Locales (beyond §1 #1)
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Who authors each national site today, and must they keep publishing without a gap? | DE, SK and SR are written locally, by Škoda Auto Deutschland, ŠKODA AUTO Slovensko and Autočačak; SL is Porsche Slovenija | Local authors onboarded per locale | Q-7, Q-15 · 1004b–e | The local offices |
| DE Media Room and the 1,260 frozen DE releases: migrate, or redirect to the EN twins and skoda-media.de? | Frozen since 2023-03; 1,259 have an EN twin | Redirect | Q-8 · 1004b | Škoda Auto Deutschland |
| Serbian Latin only? Per-locale media titles and alt text? Translation pairs after go-live? | 0 Cyrillic in 900 SR titles; SK/CS media carry their own metadata; pairs live in a WordPress-built sheet | Latin only; localised AEM metadata; a translation-group id | Q-14, Q-11, Q-10 | Communications + local offices |

### Legal
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Legal owner and legal set per locale? | DE needs its Impressum (Škoda Auto Deutschland GmbH); CS newsletter terms cite a repealed act; the SK cookie notice is in Czech; two SL legal links 404 | Each office confirms its set | Q-9, Q-1 · 843 | Legal owners per locale |
| Who signs off the German Pkw-EnVKV CO2 statements? | 218 DE stories carry them; machine translation can't produce them | Local legal review | 1002, 1004b | Škoda Auto Deutschland |
| Required takedown time for a release or an image, and must expiry remove an image automatically? | Media Bus copies keep showing after unpublish or expiry | SKODA-522 report, authors remove | D20 · 522 | Škoda legal |

### Newsletter
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Is the real ESP subscription in M2, on mailguide.cz with double opt-in? Which lists are active per locale, and what triggers each send? | 4 lists (EN 389/339, CS 386/342); SK, SR and DE post to 389 with `lang`; nobody knows what starts a send | mailguide, per-locale config | D4 · 904, 908c | Škoda marketing + mailguide |
| How long is consent valid, and when do re-permission mails go out? skoda-motorsport.com subscribers manage on Storyboard: who owns that after the decommission? | The extend flow lives in WordPress; motorsport shares the hosting and settings page | Rebuild the manage and extend pages (908c) | 908c, 711 | Marketing / motorsport owner |

### Search and listings
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| Is index-only search acceptable at go-live (hosted search later), also for 33,313 images and 913 videos? | D6; 901 moved to M3 | Index-only | D6 · (901 M3) | Communications |
| Which of the 15 facets are normalised and shown, and does the advanced filter scope to the section? | §10 Q4 | All 15, as the source (402d) | D12 | Communications |
| Archive ordering: newest first? | Assumed in 209 | Newest first | 209 | Communications |

### Media
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| The MP4 library (≈ 0.4–0.6 TB): which originals migrate, and to AEM Assets or Vimeo? | Scoped as "zero video" until 21 Oct | AEM Assets originals, Media Bus posters | Q-18 · 523a | Communications / DAM team |
| Where are documents delivered from (branded host vs the raw AEM host, which blocks crawlers)? | The raw publish host has `robots.txt: Disallow: /`; Google News lists the source PDFs | A branded host | Q-21 · 709b, 103e, 713a | Škoda AEM / Cloud Manager admin |
| Rights rule for ingesting unrecorded masters? Date the source CDN retires? | D5 rights rule open; 520 removes the CDN first | Published + rights-cleared only | D5 · 520, 504a | DAM team / legal |
| Captions and transcripts at go-live (WCAG 1.2.x / EAA)? | 1 of 12 sampled Vimeo videos has human captions; 0 of 673 podcast episodes have transcripts | Parity with the source, plus a plan | 523, 716 | Accessibility / Communications |
| Production media cart: is the client-side ZIP (device ID, no login) acceptable? Media Box from an AEM folder or authored rows? | D2 production approach and D-4 open | Client-side ZIP; authored rows (D-4) | D2, D-4 · 902, 806a, 850b | Media Room |
| Launch assets hidden in AEM until the release: who flips them? | The public media feed lists every published asset | An embargo marker + feed skip (850c) | 850c, 811 | Media Room / DAM team |

### Integrations and external consumers
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| The mobile app: which endpoint does it read, who maintains it, can it switch to the EDS index or RSS? | It reads an undocumented WordPress source; push alerts for new articles | Switch to index/RSS | 908a | iComVision + Communications |
| Which systems subscribe to the RSS feeds; must they stay full text? | 356 Feedly subscribers on 5 feeds; guids are `?p=<id>` | Keep full text, keep guids | 405, 908b | Communications |
| App Builder: entitlement, Developer roles, I/O Events, service credentials, author IP allow-list (C1–C7)? | Blocks the media feed sync (511a), asset lifecycle (522) and the DA token test | Provisioned by the client | D14 · 521, 511a, 522 | Škoda Adobe org admins |
| Who owns the Vimeo, Buzzsprout, mailguide and OneTrust accounts, and their renewals? Will Vimeo allow `*.aem.page/live`? | 20 % of media-library videos are domain-locked; renewals fall in Q1 2027 | Accounts listed in 712 | 523, 712 | Vendor owners |
| Should Wikipedia/Wikidata citations (219+ links) and Škoda-owned referrers be updated, and by whom? | Inbound links break at cutover | Communications sends the notices | 103e, 713c | Communications |

### Launch and operations
| Question | Why it's open | Default | Blocks | Who answers |
|---|---|---|---|---|
| The CDN, DNS and TLS owner; the go-live date and freeze (see §1 #10) | Škoda nameservers; 2 change requests; cert expiry 2026-11-30 | Adobe CDN; weekday switch | D14, Q-20 · 709, 710 | Škoda IT |
| Must a read-only WordPress copy be kept, for how long, and who signs off deleting its databases (personal data)? | 3 environments; shared hosting with motorsport. The rollback window is capped by the WordPress certificate (≤ 90 days after DNS moves) | none proposed (711 asks for form, retention and the deletion owner) | 711 | Škoda IT / legal |
| Who operates the site after 02 Jan, and for how long is hypercare? | No operating model yet | none proposed (712: the window and rota are set with the client) | 712 | Project sponsor |
| Will the hosting agency provide the WordPress exports (plugins, publish hooks, old slugs, nginx alias rules, logs, attachment table)? | Needed for 103b–e, 710b and 711 | none proposed (needed before the delta-import design) | 103d, 710b, 711 | Hosting agency via the Škoda web team |
| Alert channel and log tool for operations? | Needed for the media feed sync (511b) | none proposed | 511b | Škoda IT |

## 4. Our own docs: stale statuses found while tracing
- **The requirements mapping** still has several stale entries:
  - it marks 6.1, 6.2 and MR-PR02 🟠 "on D13", but D13 is resolved (DA; the Assets picker has been live since 12 Oct);
  - it puts consent (COM17, 8.3) out of Adobe scope, while SKODA-804/907 carry it and Q-16 reopens the model;
  - it calls the Podcast "an agreed drop", while the traceability sweep found a live category page;
  - its D2 wording ("server-side reduction") predates the client-side ZIP (2026-09-21).
- **Ticket totals:** the traceability and mapping headers still say 63 tickets / 261 SP. The capacity doc counts 110
  open M2 issues / ≈ 312 SP.
- **SKODA-805:** says "fixed vs conditional sections, confirm with business", but MR-PK02 was resolved on 2026-09-14.

## 5. How to use this
1. Turn §1 and §3 into **one request pack per recipient**:
   - Communications;
   - marketing / analytics;
   - the privacy office and legal;
   - Škoda IT;
   - the local offices;
   - vendors (iComVision, mailguide, Buzzsprout, Vimeo);
   - the hosting agency.
   
   Put due dates in working days, and ask §1 first.
2. When a question goes out, fill the register's "Client owner / Asked on / Answer due" columns. When it's answered,
   record the answer in the register row and update the ticket.
3. If a due date passes without an answer, the default stands, and the register row says so.
