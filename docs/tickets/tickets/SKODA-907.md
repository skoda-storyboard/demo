# SKODA-907, Škoda consent and group tracking: sDrive SDK and CCM, legal-entity-id, OneTrust per locale, SL, embeds

- **Epic:** E09, Dynamic Services
- **Type:** integration (head scripts, bulk metadata, consent wiring) plus client decisions. Amends SKODA-804 and 905.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Go-live blocker:** without the sDrive hook there is no
  consent layer at all (G-A-01). The long pole is Škoda privacy and analytics (**Q-16**, D10).
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding Škoda lead time *(planning estimate, not
  a quote)*. The source findings sum to ≈ 3.5–5 SP (2–3 on 804, 0.5 embeds, 0.5 SL, 0.5–1 performance), so 3 SP is
  tight; the 905 event work stays inside 905's 8 SP.
- **GitHub issue:** [#423](https://github.com/skoda-storyboard/demo/issues/423) (created 2026-10-21, sub-issue of epic #95)
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-A-01 (High, CONFIRMED; G-B-04 merged),
  G-A-02 (High, CONFIRMED), G-A-03 (Medium, CONFIRMED, was High), G-A-04, G-A-05, G-A-06 (Medium, not re-verified).

## Why
SKODA-804 plans "OneTrust + geolocation in the delayed phase" and "zero cookies, no vendor calls before consent".
The source runs Škoda's central stack instead (measured 2026-10-21):
- **sDrive and the CCM (G-A-01, G-B-04).** Every page carries `<meta name="legal-entity-id">`, then synchronous
  `cross.skoda-auto.com/sdrive/endpoint.js` and `sdrive.azureedge.net/sdrive/zero-tracking.js` in `<head>` (60/60
  samples, 17/17 loads). `endpoint.js` loads `ccm.js`, which picks the OneTrust script from a 97-row table keyed on
  legal entity + language. Without the meta it throws "Invalid LEID" (measured on the demo); with the meta injected
  on `main--demo--…aem.page/en/media-room` the CCM and the OneTrust banner load (no domain lock).

  | Locale | EN | CS | DE | SK | SR | SL |
  |---|---|---|---|---|---|---|
  | legal-entity-id | 004 | 260 | 107 | 654 | 457 | 298 (excluded, no CCM) |
  | OneTrust script (prefix) | 6b4f906c | a8457a09 | 39480dc3 | fcace1c7 | 0ba2b098 | – |

  5 OneTrust groups (C0001–C0005) per locale. SKODA-MASTER l.144 and DISCOVERY l.156 file sdrive as a charging/SSO
  app. The analytics bundle also calls 21 `sdrive.track*` methods: a second, Škoda-owned destination outside GTM
  that 905 never names. The refuters note consent itself stays with Škoda (D10, mapping COM17 / 8.3): what is missing is
  the EDS-side contract, not a consent build.
- **Tracking before consent (G-A-02).** A fresh `/en/` sets 6 cookies (incl. `opt_sync`, `__uid`, `OptanonConsent`
  with C0001 only) on 11/11 sampled pages, sends 2 zero-tracking pings and loads `gtm.js`. After Accept All the CCM
  replays the earlier events and GA4 + 2 Meta pixels fire. Reject All still sets an `aid` cookie and calls a Škoda
  identity service. 804 AC 1 and 905's "no pre-consent tracking" AC can't both hold; Škoda privacy owns the call.
- **GTM (G-A-03).** `GTM-M5GMBWF` holds 7 GA4 ids and 2 Meta pixels, sends GA4 to server-side GTM on Cloud Run
  (`sgtm-hq-prod-…run.app`, 0 refs to 804's `cloudfunctions` host) and routes on lookup tables keyed `BID,language`
  (15 values). SR emits `page.LanguageVersion` `sr-latn-cs` and EN `en-com`, neither in the table as read, so the
  per-locale routing needs the container export. D10 was updated on 2026-10-21; 905 already plans the 1:1 dataLayer.
- **Performance (G-A-04, not re-verified).** On a new session `endpoint.js` sends the top-level page to
  `cross.skoda-auto.com/sdrive/sync.html` and back (`#s_state=NEW&s_aid=…`): 4 of the first 5 navigations, each a
  full reload. The 2 head scripts are render-blocking (213 ms and 119 ms on a warm story). 804's "Lighthouse
  unaffected" AC and the 702 gates assume no such scripts. Reproduced on the demo after injecting `endpoint.js`.
- **SL (G-A-05, not re-verified).** `endpoint.js` excludes LEID 298 (one of 10), so `/sl/` gets no banner while GTM
  and the zero-tracking ping still run. On EDS no consent could ever be given there.
- **Embeds (G-A-06, not re-verified).** The origin gates only YouTube, and still loads the `i.ytimg.com` poster.
  Vimeo (5 iframes on the Media Room, listed under C0003 in Škoda's OneTrust config) and Buzzsprout load ungated.
  204a gates all four providers on one boolean, and withdrawal doesn't unload a loaded player.

## Scope
**Client (Škoda privacy office, analytics, sDrive owner):**
- **C1** Who owns sDrive/CCM, and must Storyboard on EDS stay on it? May `endpoint.js` load async, and can the
  first-visit sync hop be skipped for Storyboard?
- **C2 Q-16:** are the zero-tracking ping, `opt_sync` / `__uid` and the post-refusal `aid` "necessary" for this site?
- **C3** Is sdrive a required reporting feed, and under which consent group?
- **C4** The `GTM-M5GMBWF` export (or read access) and the GA4 property and `BID,language` values per locale.
- **C5** Which CMP `/sl/` uses on the new site, and who owns it (Porsche Slovenija is the SL controller, Q-9).
- **C6** The OneTrust group for Buzzsprout and Spotify, and for Instagram, LinkedIn and `stream.skoda.vwgroup.com`
  embeds (the inventory challenge in §6).

**Team:**
- **T1 Head integration (amends 804).** `legal-entity-id` per locale from the table, written as bulk metadata rows;
  a `dataLayer` seeded with `importer.BID` and `page.LanguageVersion` before the scripts; `endpoint.js` and
  `zero-tracking.js` in `head.html` as on the source (sync unless C1 allows async), each with the CSP nonce
  (SKODA-714 T3).
- **T2 804 text.** Replace "OneTrust tag + geolocation" with the CCM contract; rewrite AC 1 to the Q-16 answer
  (e.g. "only Škoda-classified necessary cookies and the zero-tracking ping before consent"); the server-side
  host becomes the Cloud Run sGTM; drop Hotjar and the `cloudfunctions` host (G-A-07, Low, confirmed).
- **T3 905 amendment.** If C3 keeps sdrive, 905 emits the `sdrive.track*` calls next to the dataLayer events; the
  `page.*`, `importer.BID`, `matrixId` and `trackEcEvent` contract follows the C4 export.
- **T4 Embed map (amends 804 and 204a).** One row per provider: YouTube C0004, Vimeo C0003, the rest per C6.
  `setEmbedConsent` per provider on `OneTrustGroupsUpdated`; withdrawal unloads that provider's players; posters
  are served first-party, so nothing loads from a provider before its group is granted.
- **T5 SL.** Wire the C5 answer. Until then `/sl/` keeps the click-to-load placeholders and loads no analytics.
- **T6 Performance.** Lighthouse and CWV (mobile, desktop; 3 templates) with the sDrive scripts and the sync hop,
  against the 702 baseline. Share and copy-link controls drop `#s_state` / `#s_aid` fragments.
- **T7 Docs.** Correct SKODA-MASTER l.144 and SKODA-STORYBOARD-DISCOVERY l.156; document the LEID table and the
  consent contract.

## Not in scope
- CSP, Trusted Types and the vendor run under the header set: SKODA-714. Per-block event wiring: SKODA-905.
- Converting dropped in-body embeds (first-party iframes, Spotify, Instagram): SKODA-849.
- Analytics continuity reports and dimensions: SKODA-713 T8. Cookie-notice texts per locale: SKODA-843 (Q-9).
- Changes inside the GTM container or the CCM: Škoda.

## Acceptance criteria
- [ ] On preview, every locale's pages carry the right `legal-entity-id`, and 6 sampled pages per locale send no
      "Invalid LEID" beacon.
- [ ] EN, CS, DE, SK and SR load the OneTrust script the CCM table assigns, and the banner shows on a first visit.
- [ ] A fresh-context network log (3 templates × 5 locales) lists the cookies and hosts set before consent; they
      match the Q-16 decision and are compared with the origin.
- [ ] After Accept All, GA4 reaches the Cloud Run sGTM with the C4 values per locale; after Reject All no GA4 or
      Meta request fires.
- [ ] Granting one group loads only its providers; withdrawing it unloads them; 0 `i.ytimg.com` requests before
      consent.
- [ ] `/sl/` behaves as C5 decides, and the decision is recorded.
- [ ] Lighthouse and CWV with the sDrive stack are recorded; any drop below the 702 targets is fixed or accepted by a
      human with the reason.
- [ ] 804 and 905 carry the amendments; MASTER and DISCOVERY are corrected.

## Dependencies
- **Q-16**, D10, Q-9 (SL controller); client C1–C6.
- SKODA-804 and 905 (amended), 204a (consent hook), 714 (nonce, vendor test), 702 (performance baseline), 713 T8,
  849 (embeds it converts), 1004a–e (locale metadata rows, SL timing per Q-7).
