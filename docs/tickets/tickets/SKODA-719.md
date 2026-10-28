# SKODA-719, Accepted TS and Solution Design: application boundaries, EA models and LeanIX integrations

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** architecture / documentation and client decisions
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before production acceptance
- **Owner:** supplier architect with SA architecture and Delivery Manager; named owners to be confirmed
- **Estimate:** unestimated pending access to SA templates and architecture reviewers
- **GitHub issue:** [#517](https://github.com/skoda-storyboard/demo/issues/517)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_DO_01, NFR_IN_01, NFR_AI_01, NFR_SC_01/02, NFR_DV_03, NFR_LS_01.
Deliverables: Technical Specification and Solution Design. Existing architecture/model/UI docs
are inputs, not evidence of an accepted SA TS, EA model or LeanIX record.

## Scope

- Produce supplier TS chapters 5, 7, 8, 9 and 10; coordinate with SA's chapters 1, 2, 3, 4, 6 and 11.
- Define Product, Application and component boundaries: DA/EDS, AEM Assets, App Builder, CDN,
  ESP, identity, consent/tracking and external consumers. Respect the source assumption that
  the project implements one application on Adobe infrastructure; obtain a ruling for extensions.
- Document integration patterns, data classifications, responsibilities, author/publish/delivery
  flows, approved middleware and authentication. Resolve NFR_IN_01 applicability to public delivery,
  client-side services and component-internal traffic; no unapproved blanket APIM/auth exemption.
- Reuse existing content/block models and measured specs; record standard versus custom components,
  constraints, deviations from origin, security and scalability decisions and their validation state.
- Document AI use in development/migration separately from runtime AI. Decide MLOps-log applicability,
  base-image and pay-as-you-go applicability without inventing infrastructure or a runtime AI service.

## Acceptance criteria

- [ ] SA accepts the application/integration inventory and responsibility split, with an owner per boundary.
- [ ] Supplier TS chapters are complete in SA Wiki; SA-owned chapters are linked and coordinated.
- [ ] Required models reside in SA Enterprise Architect and all applicable integrations in LeanIX.
- [ ] Middleware/authentication, scaling/autoscaling, runtime AI, image and environment decisions have
      evidence and an explicit SA architecture disposition; unresolved items remain open.
- [ ] Solution Design covers custom components, responsive behaviour, reuse, AI tooling, constraints,
      accepted deviations and risks, and is approved by the DM; TS follows the SA approval workflow.

## Dependencies and boundaries

Input baseline: SKODA-718; reuse existing architecture, import-pipeline and planning models.
Coordinate in parallel with SKODA-720, 722, 712a–d and 850f. This ticket decides architecture;
owning tickets implement controls and obtain their operational/security evidence.
