# SKODA-712e, Accepted installation/service manuals and L1/L2 knowledge base with independent handover

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-712 (#419), operating model
- **Type:** documentation / support readiness
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before support acceptance
- **Owner:** supplier engineering with SA service desk/operations, APT and DM
- **Estimate:** unestimated pending templates, service owners and recipient access
- **GitHub issue:** [#529](https://github.com/skoda-storyboard/demo/issues/529)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_DO_02–04.
Deliverables: Installation Manual and Service Manual, coordinated with DevOps Documentation
and Technical Recovery Plan. SKODA-712 already owns the support model, training and basic guides;
this child adds the formal per-application manuals, service-desk KB and independently tested handover.

## Scope

- Reuse/update existing developer, import, authoring and operations guides in SA Wiki; prepare
  per-application prerequisites, permissions/licences, versions, configuration and install/deploy procedures.
- Agree the intended Service Manual template with SA: the supplied section repeats Installation Manual
  wording. Do not invent an approved interpretation or silently omit service operations.
- Prepare L1/L2 symptom/diagnosis/escalation articles, communication matrix and service/dependency contacts.
  Cover publish/asset/feed failures, consent/newsletter incidents and recovery/escalation boundaries.
- Assign document maintenance, access and transition ownership so another department/vendor can operate
  the service; link secured secret locations rather than documenting secret values.

## Acceptance criteria

- [ ] SA resolves Service Manual wording and approves the document/template list and producer split.
- [ ] Required manuals and L1/L2 KB exist in SA Wiki with reviewed current instructions, contacts,
      known limitations, ownership and links to DevOps, monitoring/logging and recovery material.
- [ ] A receiving engineer performs the applicable install/configure/deploy procedure from the manual
      without supplier assistance in a safe environment and records the result.
- [ ] Service desk follows representative diagnosis/escalation scenarios; the receiving support owner
      accepts KB access, communications and operational handover.
- [ ] SA reviewers and DM approve the manuals; recurring update and access responsibilities are recorded.

## Dependencies and boundaries

SKODA-712 retains support/training/account-transfer ownership; 720 owns DevOps Documentation,
712a/b logging/monitoring and 712d recovery. Share application boundaries with SKODA-719.
Do not create a second author guide or duplicate the existing renewal/calendar register.
