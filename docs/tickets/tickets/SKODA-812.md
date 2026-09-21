# SKODA-812 — Auditability (author change-history)
- **Epic:** E08 — Editorial at Scale
- **Type:** governance / validation
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–3d *(planning estimate, not a quote)*

## Summary
Provide traceable editor activity / material-content-change history for governance and operational monitoring. Closes traceability gap **G5** (§6.7). Confirmed a **firm requirement** on the 2026-09-14 call (was hoped to be out-of-the-box).

## Description
Client §6.7: editor activity and material content changes must be traceable — **user, date/time, content changed, publication/unpublication activity, restricted-content activity.** The driver is that **many agencies author content** (a separate Media Room agency, a Storyboard agency, sub-agencies, and per-country agencies), so change attribution matters on a public brand site.

The requirements doc *assumes* this is provided by the selected AEM/EDS authoring setup — **so the first task is capability validation**: does DA/Experience Workspace expose a sufficient change-history/audit log natively? If yes, configure + document it; if not, scope the gap (e.g. git history of the DA source, or an external log) and flag for a decision.

## Requirements / Spec
- Determine what audit/change-history DA/EW provides natively (author, timestamp, what changed, publish/unpublish events).
- Confirm coverage for restricted-content activity (composes with SKODA-811).
- Document how to retrieve the history for governance; identify any gap vs the §6.7 field list.
- Relates to the NFR/logging requirements (D16).

## Acceptance Criteria
- [ ] Native DA/EW audit capability assessed and documented (what it does / doesn't capture).
- [ ] For a sample content change: user + date/time + change + publish event are retrievable.
- [ ] Any gap vs §6.7 (or restricted-content activity) is flagged with a recommended approach.

## Dependencies
- Upstream: SKODA-101 (site/IDP setup — user identity), SKODA-602 (publish lifecycle), SKODA-809 (roles), **D16** (NFR/logging)
- Related: SKODA-811 (restricted-content activity)

## Risks / Flags
- 🟡 Capability-dependent — the requirement assumes OOTB support; **validate before committing an approach**.
- Multi-agency authoring makes attribution the point — a thin or absent native log would be a real gap to escalate.
