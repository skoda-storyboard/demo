# SKODA-811 — Content embargo (restricted pre-publication) via staged-publish
- **Epic:** E08 — Editorial at Scale
- **Type:** governance / workflow
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live). *M1-Stretch showcase only if group-restriction is descoped — the group-access half depends on SKODA-809 (M2, blocked on D15/RACI), so a true group-gated embargo cannot ship at M1. An **ungated** staged-publish (unpublished-in-preview → manual publish, no group ACL) is the most M1 could show.*
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## Summary
Implement the confidential pre-publication content mechanism (§6.5, decision D9) using the native EDS pattern. Closes traceability gap **G3**. Approach **agreed on the 2026-09-14 call**: group-restricted access + preview-not-live, then publish at the release date.

## Description
Client §6.5: assets/content for a future launch must be visible **only to a selected authorised group** until public release. Confirmed real ("restricted folders for new-car launches"). On the 2026-09-14 call, Lars proposed and the client accepted the native EDS approach — **no bespoke gate needed**:
- **group-based access** (not per-individual) to a folder/area in DA/EW preview;
- **content stays unpublished** (visible only in authenticated EW preview) until the release date;
- **scheduled/manual publish** flips it live when the restriction lifts;
- an **article-level preview-share is acceptable** — a separate folder is not strictly required.

Mainly car-launch assets. This is the "staged-publish" recommendation from delivery-plan §4, now client-endorsed.

## Requirements / Spec
- Group-restricted preview access (composes with SKODA-809 roles) to embargoed content/assets.
- Embargoed items remain unpublished; a scheduled or manual publish releases them on the date.
- Protect both content and underlying assets from unauthorised reuse/discovery pre-release.
- Controlled release when the restriction no longer applies.

## Acceptance Criteria
- [ ] An embargoed item is visible to the authorised group in EW preview and NOT on the public site.
- [ ] Publishing on/after the release date makes it public; before, it stays hidden.
- [ ] Underlying assets are not publicly discoverable pre-release.
- [ ] Works at group level (per SKODA-809) and, minimally, at article-preview-share level.

## Dependencies
- Upstream: SKODA-602 (preview/publish lifecycle), SKODA-809 (group access), **D9** (approach agreed)
- Related: scheduled-publish capability (§6.3)

## Risks / Flags
- 🟢 Low technical risk — fits the EDS preview-vs-publish model; no special infrastructure.
- Candidate **M1 Stretch showcase** *only in its ungated form* (staged-publish without group restriction). The group-gated version needs SKODA-809, which is M2 and blocked on D15 — so a full §6.5 group-restricted embargo cannot be an M1 deliverable (adversarial finding F4).
- Depends on the roles model (SKODA-809) for the group definition.
