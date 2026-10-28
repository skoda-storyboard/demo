# SKODA-720, Enterprise DevOps and source handover: Azure delivery, approvals, versioning and rollback

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** setup / DevOps and documentation
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before production acceptance
- **Owner:** SA APT/DevOps with supplier engineering and DM; confirm the producer split
- **Estimate:** unestimated until the EDS/toolchain applicability decision
- **GitHub issue:** [#518](https://github.com/skoda-storyboard/demo/issues/518)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_DV_01/03, NFR_DP_01–04, NFR_ST_01/02/04, NFR_AD_02, NFR_LS_01.
Deliverables: DevOps Solution, DevOps Documentation and Source Code Solution.
GitHub/Code Sync exists; the requested Azure DevOps source delivery and enterprise release
controls are not demonstrated by the inspected main workflow.

## Scope

- Obtain an approved application-by-application interpretation of Azure DevOps storage,
  Cloud Manager controllability, Terraform/non-SaaS IaC and Azure-stage deployment clauses.
  Do not assume the EDS site must be rebuilt or moved to Azure.
- Implement the agreed source handover/mirroring and SA ownership/access arrangements,
  including extension repositories, tooling and the release branches supplied to reviewers.
- Establish enforceable independent/four-eyes review, production approval, automated deployment,
  zero-downtime/quick revert, protected credentials and a release/version compatibility policy.
- Document environments, branches, pipeline purposes and change/release workflows per application.
  Produce SA-format release notes with business version and linked change/ticket references.

## Acceptance criteria

- [ ] SA approves clause applicability and the actual GitHub/EDS/Azure/Cloud Manager delivery pattern;
      each deviation has the required approval rather than a supplier-only assumption.
- [ ] SA owns and can retrieve/build/deploy the complete agreed source set, including any required
      Azure DevOps copies and release branches; a recipient demonstrates access.
- [ ] An unreviewed change cannot merge and an unapproved production deployment cannot proceed
      where approval is required; effective checks are evidenced.
- [ ] A representative deployment and automated revert/redeploy are rehearsed without an outage,
      with timings and the last known-good version recorded.
- [ ] Per-application DevOps Documentation, release notes and handover instructions are accepted
      in SA Wiki; no secret is included in source or documentation.

## Dependencies and boundaries

Use the SKODA-719 application inventory; coordinate SA account transfer with SKODA-712/101a.
SKODA-721 owns Sonar/JFrog gates, SKODA-723 FOSS/licence approval and SKODA-726 security reports.
Deployment rollback here is distinct from SKODA-710's DNS/content cutover rollback.
