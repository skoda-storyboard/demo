# SKODA-723, Approved third-party inventory, FOSS reports and customer-facing licence agreements

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / licensing and supply-chain compliance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before source/solution acceptance
- **Owner:** engineering with SA FOSS/licence SPOCs and DM
- **Estimate:** unestimated pending component inventory and external review lead times
- **GitHub issue:** [#521](https://github.com/skoda-storyboard/demo/issues/521)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_TP_01/02, NFR_LI_01 and A10.035.
Deliverables: Source Code Solution, DevOps Solution and Solution.
SKODA-712 tracks vendor contracts/renewals, not advance component approvals, FOSS review
or the required externally available licence agreement.

## Scope

- Inventory production, development/migration and vendored third-party components, versions,
  copyright, licence/notice obligations and paid services; cover every applicable repository.
- Reconcile the TS inventory with actual dependencies, copied code, fonts, media/player SDKs,
  source imports and hosted services. Record approval before adding new components.
- Submit release repositories/builds to the SA FOSS process and resolve report findings.
- Produce the required user-available licence agreement for each external-facing application,
  using SA's example and including component/version/copyright/licence texts.

## Acceptance criteria

- [ ] Inventory and approvals cover the complete delivered source/build set, not just package.json.
- [ ] SA's responsible person approves third-party use and every paid licence; evidence and terms
      are linked. Missing historical approval is resolved explicitly, not backdated or presumed.
- [ ] FOSS Check Reports cover all applicable release repositories and have no prohibited open issues.
- [ ] Customer-facing licence agreement(s) are published at agreed accessible locations and include
      the required notices/text; SA's UAT/licence reviewer accepts them.
- [ ] Component changes and licence/renewal obligations have owners and feed the release checklist,
      TS inventory and SKODA-712 calendar.

## Dependencies and boundaries

SKODA-719 (application/TS inventory), 720 (release source set), 721 (ongoing scans),
724 (UAT), 712 (vendor register) and 843 (agreed public legal-page placement).
Do not duplicate the vendor-renewal register or treat the repository's own LICENSE as a FOSS report.
