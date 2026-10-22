# SKODA-809 — Roles & permissions (editorial user groups)
- **Epic:** E08 — Editorial at Scale
- **Type:** governance / config
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–8d *(planning estimate, not a quote)*

## Summary
Set up role-based permissions separating the editorial user groups the client requires. Closes traceability gap **G2** (§6.4). Governance layer — explicitly later-phase (§9), not a demo precondition.

## Description
Client §6.4 requires role-based permissions across the expected user groups: **HQ editors, Storyboard editorial teams, Media Room / PR editors, agencies/suppliers, local-market editors, approvers, administrators.** Detailed role mapping is open and depends on the **governance/RACI decision (D15)** across the client's CMS team, the client's AEP team, and the Adobe delivery team.

This is the DA/Experience-Workspace access model: which groups can author/preview/publish which content trees (Storyboard vs Media Room vs per-market), and who approves. It composes with the embargo (SKODA-811) and audit (SKODA-812) governance tickets.

## Requirements / Spec
- Map the 7 expected user groups to DA/EW permission roles + content-tree scopes.
- Separate Storyboard vs Media Room editorial access; per-market editor scoping (ties to SKODA-1001 locale trees).
- Approver/administrator roles for the publish workflow (SKODA-602 lifecycle).
- Author auth via Škoda IDP (per client §3), set up in SKODA-101a.

## Acceptance Criteria
- [ ] Role model documented and mapped to DA/EW capabilities per group.
- [ ] Group-scoped access enforced for at least Storyboard, Media Room, and one market.
- [ ] Approver + administrator roles operate in the preview→publish flow.
- [ ] Consistent with the embargo (811) and audit (812) requirements.

## Dependencies
- Upstream: SKODA-101a (author identity: Škoda IdP federation, DA permissions, Edge Delivery roles), SKODA-602 (publish lifecycle), **D15 governance/RACI** (blocking — role ownership must be agreed first)
- Downstream: SKODA-811 (embargo group access), SKODA-1001 (per-market trees)

## Risks / Flags
- 🟠 **Blocked on D15 (governance/RACI)** — role ownership across CMS/AEP/Adobe teams must be agreed before this can be finalized (raised as a live blocker on the 2026-09-14 call).
- Detailed role mapping remains client-confirmed (§6.4).
- Capability validation required — confirm the DA/EW permission model supports the needed granularity.

## Amendment (2026-10-21, M2 gap review)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.6.
- **Estimate (amended):** 5 SP, unchanged · AI-assisted 2–3d / manual 4–8d *(planning estimate, not a quote)*. The
  producer row is part of G-T6-05's 0.5 SP; the publish-scope decision and config (G-T1-04, +1–2 SP) are sized in
  SKODA-850d.

**Added scope:**
- **AI-audio producer (G-T6-05, Medium).** Every AI-audio release gets a Buzzsprout episode that a producer adds
  after publish, with a re-publish (88/88 EN, 89/89 CS episodes dated on the release hour). Add the producer to the
  role model: edit + publish on the EN and CS release paths, or edit + Request Publish.
- **Publish granularity (G-T1-04, High, CONFIRMED).** This answers the "capability validation" risk: the Edge
  Delivery `publish` role is site-wide (`live:write`, `live:delete`, no path field) and DA write implies delete. The
  role model uses the SKODA-850d / D15 choice: per-path Request Publish approvers, or site-wide publish with
  SKODA-812 audit.
- **Shared root documents (G-T1-05, Medium).** `/redirects`, `/metadata`, `/nav`, `/footer` and `/media-room/*` get
  an owner per group; locale editors request redirects (SKODA-850d).

**Added acceptance criteria:**
- [ ] The role model has the AI-audio producer row with its paths and rights (G-T6-05).
- [ ] The role model records the publish-scope choice and who approves per locale tree (G-T1-04).
- [ ] Each shared root document has an owning group (G-T1-05).
- **Dependencies (added):** SKODA-850d (publish model), 850a (Request Publish), 101a (amended).
