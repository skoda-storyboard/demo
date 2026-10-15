# SKODA-808a, Press kit: model-variant selector (follow-up to SKODA-808, decision-gated)
- **Epic:** E08, Editorial at Scale (follow-up to SKODA-808, #69, closed 2026-10-12)
- **Type:** block · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#370](https://github.com/skoda-storyboard/demo/issues/370) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 1–2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** ⏸ Blocked on requirement **MR-PK03**.

## Why
SKODA-808 delivered the hub facets and the variant tile, nav and chapter. The source has **no** variant selector. MR-PK03
asks for one, and it is net-new UI, so it waits on the client's answer.

## Scope (once MR-PK03 is answered)
- A selector on the press-kit hub that filters the variant chapters (bodywork / derivative), authored from the kit's
  existing facet metadata. No new content model.

## Acceptance criteria
- [ ] MR-PK03 answered: build, or close as not planned.
- [ ] If built: keyboard- and screen-reader-operable; the selection is reflected in the URL so it can be deep-linked;
      no layout shift.

## Dependencies
808 ✅, 401 (facets), MR-PK03 / D12.
