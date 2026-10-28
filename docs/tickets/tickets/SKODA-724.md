# SKODA-724, Supplier Test Strategy, browser matrix, final test report and formal UAT acceptance

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** QA / whole-release acceptance and documentation
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, strategy early; final report before UAT and release approval
- **Owner:** supplier QA with SA test manager, DM and Business Owner
- **Estimate:** unestimated pending agreed coverage, environments and reviewers
- **GitHub issue:** [#522](https://github.com/skoda-storyboard/demo/issues/522)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_TE_01–04, NFR_AC_01/02, NFR_SEO_01 and MIG-07.
Deliverables: Supplier Test Strategy, Supplier Final Test Report and Solution.
Existing SKODA-715/716 and template QA own specific checks, not the complete agreed supplier
test strategy, browser/OS/device matrix, pre-UAT report and Business Owner acceptance.

## Scope

- Agree test stages, scope, techniques/tools, data, environments, entry/exit criteria, schedule
  and responsibilities for code, integrations, editorial workflows and migrated content/assets.
- Establish a supported browser/OS/device matrix and the chosen WCAG AA version with SA;
  reuse SKODA-716's accessibility decision rather than make a competing one.
- Aggregate existing functional/visual/responsive, performance, accessibility, migration and
  integration evidence, including automation across application layers and manual/screen-reader checks.
- Define migration-wave exit evidence with SKODA-803/713c: reconciled content/asset counts,
  metadata/locale checks, documented exceptions and automated redirect/dead-link validation
  before each publish wave, not only once before DNS cutover.
- Arrange SA UAT, cookie SPOC review and production-only S-Drive validation; coordinate independent
  security reports and licence-agreement UAT without duplicating their implementation.

## Acceptance criteria

- [ ] DM approves the Supplier Test Strategy with SA test stakeholders before execution/hand-over.
- [ ] The browser/OS/device matrix and entry/exit criteria are explicit and drive the recorded runs.
- [ ] Each publish wave has its migration validation/exception report and automated redirect/dead-link
      result; unresolved blocking failures prevent that wave from publishing.
- [ ] Supplier Final Test Report exists before SA UAT, states coverage/pass rates, scenarios and
      known errors against agreed criteria, and identifies exact release/content/environment versions.
- [ ] Failed checks have execution tickets and retest evidence; neither source parity nor a green
      CI run substitutes for acceptance. Source-marked DONE accessibility is reconciled, not erased.
- [ ] SA UAT, cookie and S-Drive outcomes and the required security/licence evidence are recorded;
      the BO approves the Solution and DM approves the supplier report. Unresolved gates remain open.

## Dependencies and boundaries

SKODA-718 (coverage), 715/716 (specialist gates), 803/1004 (migration), 804/905/907
(consent/tracking), 904/908 (external services), 723/725/726 (compliance gates).
Feeds SKODA-710 go/no-go. This ticket aggregates and closes acceptance, not another parallel UI audit.
