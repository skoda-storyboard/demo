# SKODA-715, Go-live performance gate: a CWV budget per template, measured with the production stack

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** QA / measurement; fixes become follow-up tickets
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The lab run is done before the DNS switch.
- **Estimate:** 2 SP · AI-assisted 1d / manual 2d, excluding fixes *(planning estimate, not a quote)*. From the review:
  G-H-02 3–5 SP for both NFRs plus a fix tail, G-G-11 1–2 SP. The accessibility half is SKODA-716.
- **GitHub issue:** to create
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-H-01 (Medium, PLAUSIBLE), G-H-02,
  G-G-11, G-KT-05 (Medium, not re-verified). Requirement **8.5**.

## Why
- **8.5 has no open ticket.** It maps only to SKODA-702, closed on M1 and scoped to the pilot pages.
- **The targets conflict.** The requirements mapping says "Target ≥90"; SKODA-702 aimed for "Lighthouse ≈ 100". The
  source `/en/` measured 48 on mobile. The gap register (G8) still lists the CWV targets as "TBD (client)".
- **Two 702 follow-ups are open:**
  - the category archive mobile LCP (3.2 s simulated): the LCP card image is built by JS from the query index;
  - the first-glimpse MP4: a 947 MB master that is not fast-start.
- **RUM field data is not verified.** 702 wired the RUM beacons, but reading them needs the domain key (SKODA-712).
- **The M2 stack is not measured.** The Škoda CCM, GTM and sDrive scripts load in the delayed phase (SKODA-907 T6),
  and 702 requires the consent manager to stay there.
- **The index grows** (G-KT-05). Today the EN index is 409 rows, 376 KB raw and 65 KB gzip. At D7's ≈ 4,620 EN
  pages that is ≈ 4.3 MB raw and 0.73 MB gzip in 5 sequential requests, and `story-rail` loads it on every story.
- **No M2 template has a budget:** 206, 209, 810, 813, 843–845 and the bulk corpus.

## Scope
- **Client question (G-G-11):** is the target Lighthouse mobile ≥ 90, Core Web Vitals "good" at p75, or both?
  Proposed default: both, with LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 at p75, and Lighthouse mobile ≥ 90. Record
  the answer in the decision register.
- **Budget table:** one row per template in [`_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md), EN and CS: LCP, INP,
  CLS, JS kB, third-party kB, index and feed bytes.
- **Lab run:** Lighthouse mobile and desktop, median of 3, on the production host (or a production-equivalent
  preview) with the real consent and analytics stack, and a full-size index. Use a 5,000-row synthetic index if the
  corpus isn't imported yet.
- **Field run:** RUM CWV per template from the RUM explorer, once SKODA-712 has the domain key.
- **702 follow-ups:** fix or accept the category LCP (SKODA-209 / 831) and the MP4 fast-start (SKODA-503 / 506).
- **Misses:** each gets a fix ticket or a recorded acceptance by a human.

## Not in scope
- The slim index for rails and cards: the SKODA-401 amendment (G-KT-05).
- The sDrive and CCM measurement detail: SKODA-907 T6. Post-launch monitoring: SKODA-712.
- Accessibility: SKODA-716.

## Acceptance criteria
- [ ] The performance target is answered and recorded in the decision register.
- [ ] The budget table exists, one row per template, EN and CS.
- [ ] Every template meets the budget in the lab run with the production consent and analytics stack, or the miss
      has a fix ticket or a human acceptance.
- [ ] A run with an EN index of at least 4,620 rows is recorded for the home, a story with a rail and a listing.
- [ ] The two open 702 follow-ups are fixed or accepted.
- [ ] RUM CWV at p75 per template is reported for the first 2 weeks after the switch.

## Dependencies
SKODA-702 (method and pilot results), the 401 amendment (G-KT-05), 907 (stack), 709 (production host), 712 (RUM key),
209 / 831, 503 / 506, 1004a (CS corpus). Feeds the go/no-go in SKODA-710.
