# SKODA-718, Rebaseline M2 requirements, scope decisions and all 19 deliverable approvals

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / requirements and acceptance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, establishes the release acceptance baseline
- **Owner:** supplier architect with SA Delivery Manager and requirement owners; named owners to be confirmed
- **Estimate:** unestimated; agree scope and external review lead times before sizing
- **GitHub issue:** [#516](https://github.com/skoda-storyboard/demo/issues/516)
- **Status (2026-10-27):** TODO; no acceptance or scope exception is implied by creating this ticket

## Source baseline

The client supplied these PDFs, extracted to Markdown alongside the originals:
- `CMS-MediaRoomMigration-FunctionalRequirements-271026-0937-42.pdf`
- `CMS-MediaRoomMigration-Requirements-NFRs-271026-0936-40.pdf`
- `CMS-MediaRoomMigration-Deliverables-091026-1235-1238.pdf`

They contain 120 functional/migration requirements, 47 general NFRs, 39 security NFRs
(including two cancelled clauses), 27 functional open points and 19 unique deliverables.
Baseline implementation: remote main `0190c923149622f517935889bdcc20058546cad8`.
The older mapping uses superseded IDs and conflates ticketed, implemented and accepted.

## Scope

- Reconcile the requirement mapping, traceability and decision register against every source ID,
  assumption, open point, priority and source-declared state.
- For each requirement record the owning ticket(s), accountable role, applicability, implementation
  state, evidence, remaining action and human acceptance or approved exception.
- Inventory all 19 deliverables with producer, reviewer, approver, SA Wiki/artifact location,
  due date and acceptance state. Reuse existing material rather than commissioning 19 new documents.
- Obtain explicit decisions on search, cart hardening, banners, glossary, microsites, podcasts,
  content/locale boundaries and WCAG version. Internal M3 moves or elapsed answer dates are not approval.
- Preserve the client-marked DONE identity/accessibility clauses pending evidence reconciliation;
  retain A10.011/A10.012 as CANCELLED. Do not invent six-locale content parity or runtime MLOps.

## Acceptance criteria

- [ ] All 120 functional IDs and 86 NFR/security IDs occur exactly once in the coverage baseline,
      with source state separate from verified delivery/acceptance state and linked execution work.
- [ ] All assumptions and 27 open points have an owner and disposition; unresolved decisions remain open.
- [ ] Every identified gap has a ticket; existing consent, newsletter, migration, media, SEO and QA work
      is linked, not duplicated. MR-I06 links to SKODA-850f.
- [ ] All 19 deliverables have a producer/reviewer/approver and evidence location; obtain missing
      SA templates and resolve the duplicated Solution heading and Service Manual wording with SA.
- [ ] The Requirements Coverage Report is reviewed by SA and approved by the DM. Security clauses
      are implemented with evidence or have accepted IRMA risks; planned exceptions are not acceptance.

## Dependencies and boundaries

Start from existing `SKODA-REQUIREMENTS-TRACEABILITY.md`, `SKODA-CLIENT-REQUIREMENTS-MAPPING.md`,
`SKODA-DECISION-REGISTER.md` and the M2 backlog. Execution remains with the owning tickets,
including SKODA-719–726, 712a–e, 713e, 809a and 850f. Do not wait for every implementation before
publishing the initial matrix; update it throughout delivery and at go/no-go.
