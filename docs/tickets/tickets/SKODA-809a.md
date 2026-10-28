# SKODA-809a, Access-governance evidence: dual approval, account lifecycle and periodic rights review

- **Epic:** E08, Editorial at Scale
- **Parent:** SKODA-809 (#70), editorial roles and permissions
- **Type:** governance / access lifecycle and control evidence
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before governance acceptance
- **Owner:** SA access/governance owner with IdP/IMS/DA/EDS administrators
- **Estimate:** unestimated pending accountable groups and approval process
- **GitHub issue:** [#530](https://github.com/skoda-storyboard/demo/issues/530)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR security clauses: A07.010/030/040/050/060/070/090.
SKODA-809 maps editorial roles; 101a configures identity, permissions and leaver access.
Neither establishes the complete evidence of dual-controlled grants and recurring recertification.
The client marks IdP authentication DONE; several access-governance clauses remain WIP.

## Scope

- Complete the authorisation concept using the existing role matrix: request/grant/change/withdraw
  processes, accountable owners, approval records, rights visibility and least-privilege checks.
- Implement/document grants under dual control involving at least two employees in addition to
  the recipient, as the source clause requires, or obtain the required approved exception.
- Define periodic access review and revocation across B2B/IdP, IMS, DA and EDS; cover local offices,
  agencies, contractors and privileged/break-glass access.
- Verify personalised accounts, removal/deactivation of production default/test/shared accounts,
  with a safe and authorised test process and the agreed emergency-access policy.

## Acceptance criteria

- [ ] SA accepts the role/lifecycle concept and evidence location; an information owner can inspect rights.
- [ ] A sample grant/change/withdrawal shows the required approvals, timestamps and enforcement at all
      applicable layers; a single unapproved grant cannot bypass the agreed process.
- [ ] A periodic review is evidenced with reviewers, next due date and removal of stale access.
- [ ] Production account inventory demonstrates personalised access and treatment of default/test/shared
      accounts without inventing an exception for break-glass use.
- [ ] WIP clauses have verified evidence or approved risk disposition; client-marked DONE authentication
      is reused, not commissioned again. Audit events feed SKODA-712a/812.

## Dependencies and boundaries

SKODA-809/101a own role/identity implementation; 850d owns publish granularity; 722 ASA/risk acceptance;
712a/812 logging; 712 the recurring calendar. This child does not recreate SSO or the editorial role matrix.
