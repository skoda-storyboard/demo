# SKODA-805b, Press-kit chapter/resource child pages for the M1 hubs

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805/806)
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 **Could** tier (depends on decision D-1)
- **Estimate:** 3 SP planned (option B) · option A (full import) = 5–8 SP · option C (link-out) ≈ 1 SP, done inside SKODA-609 *(planning estimate, not a quote)*
- **Parent:** SKODA-805 (#66) · **GitHub issue:** [#129](https://github.com/skoda-storyboard/demo/issues/129)

## Summary
The 3 in-scope tiles hubs link to **50 child pages** outside the 43-URL set: Peaq 13, Epiq 13, Motorsport 24. The
children are the substance of a press kit: chapter narrative, resources and media groups. Without them a hub is a
"brochure cover".

**Decision D-1** (gap review) chooses between:

| Option | Scope | Effort |
|---|---|---|
| **A. Import all 50** | Child pages via the 805c `press_kit-template-default` importer (story-detail-style two-column article). Adds a sticky Chapters sub-nav. | 5–8 SP |
| **B. Import one kit's children (recommended)** | Peaq, 13 pages: the flagship narrative plus model tie-in. Epiq and Motorsport tiles link out to live via SKODA-609. | 3 SP |
| **C. Link out** | All tiles open the live source in a new tab (SKODA-609 policy b). | ≈1 SP, inside 609 |

## Requirements / Spec
- **Options A and B:**
  - reuse the SKODA-805c importer and its row-toggle accordion
  - map the media groups to `downloads` (SKODA-502); the whole-kit ZIP (806) stays M2
  - add the sticky Chapters sub-nav from [`press-kit-template.md`](../../ui-specs/press-kit-template.md), 44px, as
    a light section/nav
- **Option C:** no content work; the SKODA-609 link policy applies.
- **Tracking:** record the chosen option and its URL list in the SKODA-603 tracker and in `skoda-m1-url-set.txt`
  (under an addendum header).

## Acceptance Criteria
- [ ] The chosen option is recorded in the gap review decision log.
- [ ] Options A/B: every imported child renders its chapter content, accordions, downloads and Chapters sub-nav, and
      navigating hub → child → hub works.
- [ ] Option C: no tile produces an in-site 404, and external tiles open in a new tab.

## Dependencies
- Upstream: SKODA-805a, SKODA-805c, SKODA-502, SKODA-609, SKODA-602.
